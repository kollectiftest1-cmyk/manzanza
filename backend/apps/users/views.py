"""
User views
"""
import logging
import os
from rest_framework import viewsets, status, generics, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny, OR
from rest_framework.pagination import PageNumberPagination
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.parsers import MultiPartParser, FormParser
from django_filters.rest_framework import DjangoFilterBackend, FilterSet
from django_filters import CharFilter
from django.contrib.auth import authenticate, get_user_model
from django.db.models import Q
from django.core.files.storage import default_storage
from .serializers import (
    UserSerializer, UserCreateSerializer, UserUpdateSerializer,
    ChangePasswordSerializer, LoginSerializer, UserProfileSerializer, ProfileUpdateSerializer
)
from .permissions import IsOwnerOrAdmin, IsAdminUser, CanViewUsers, assignable_roles
from rest_framework.exceptions import PermissionDenied
from apps.core.audit import audit
from .filters import UserFilter, StudentFilter, TeacherFilter
from .mixins import RoleBasedFilterMixin

User = get_user_model()
logger = logging.getLogger(__name__)


class StandardResultsSetPagination(PageNumberPagination):
    page_size = 10
    page_size_query_param = 'page_size'
    max_page_size = 100


class UserViewSet(RoleBasedFilterMixin, viewsets.ModelViewSet):
    """
    ViewSet for User model with intelligent role-based filtering
    """
    queryset = User.objects.select_related(
        'auditoire', 'section', 'filiere'
    ).prefetch_related(
        'courses_as_teacher', 'courses_as_assistant'
    ).all().order_by('-date_joined')
    permission_classes = [IsAuthenticated]
    pagination_class = StandardResultsSetPagination
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_class = UserFilter
    search_fields = ['first_name', 'last_name', 'email', 'matricule']
    ordering_fields = ['last_name', 'first_name', 'date_joined']

    def get_queryset(self):
        """
        Apply intelligent role-based filtering

        Note: Si for_course_form=true, chef_section et chef_departement voient TOUS les utilisateurs
        car ils peuvent assigner n'importe quel enseignant à un nouveau cours
        """
        queryset = super().get_queryset()
        user = self.request.user

        # Si c'est pour le formulaire de cours, chef section/département voient TOUS les utilisateurs
        for_course_form = self.request.query_params.get('for_course_form', 'false').lower() == 'true'
        if for_course_form and user.role in ['chef_section', 'chef_departement', 'sga', 'admin', 'pdg']:
            return queryset

        return self.filter_queryset_by_role(queryset, user, 'user')

    def get_serializer_class(self):
        if self.action == 'create':
            return UserCreateSerializer
        elif self.action in ['update', 'partial_update']:
            target = self.get_object() if self.kwargs.get(self.lookup_field) else None
            if target is not None and target.pk == self.request.user.pk and not self._can_manage(target, allow_self=False):
                return ProfileUpdateSerializer
            return UserUpdateSerializer
        elif self.action == 'retrieve':
            return UserProfileSerializer
        return UserSerializer

    def get_serializer_context(self):
        """Pass request to serializer."""
        context = super().get_serializer_context()
        context.update({"request": self.request})
        return context

    def get_permissions(self):
        """Set permissions based on action"""
        if self.action == 'create':
            return [IsAdminUser()]
        elif self.action == 'list':
            return [OR(IsAdminUser(), CanViewUsers())]
        elif self.action == 'destroy':
            return [IsAdminUser()]
        elif self.action in ['update', 'partial_update']:
            return [IsOwnerOrAdmin()]
        elif self.action == 'retrieve':
            return [OR(IsOwnerOrAdmin(), CanViewUsers())]
        return super().get_permissions()

    def _can_manage(self, target, allow_self=True):
        """Un administrateur ne gère que les comptes dont il peut attribuer le rôle."""
        user = self.request.user
        if allow_self and target.pk == user.pk:
            return True
        allowed = assignable_roles(user)
        if allowed is None:
            return True
        return target.role in allowed and target.pk != user.pk

    def perform_update(self, serializer):
        target = serializer.instance
        if target.pk != self.request.user.pk and not self._can_manage(target):
            raise PermissionDenied("Vous ne pouvez pas modifier ce compte.")
        serializer.save()

    def perform_destroy(self, instance):
        if instance.pk == self.request.user.pk:
            raise PermissionDenied("Vous ne pouvez pas supprimer votre propre compte.")
        if not self._can_manage(instance):
            raise PermissionDenied("Vous ne pouvez pas supprimer ce compte.")
        instance.delete(user=self.request.user, reason=self.request.data.get('reason', '') if hasattr(self.request, 'data') else '')

    @action(detail=False, methods=['get'])
    def me(self, request):
        """Get current user info"""
        serializer = UserProfileSerializer(request.user)
        return Response(serializer.data)

    @action(detail=False, methods=['put', 'patch'])
    def update_profile(self, request):
        """Update current user profile"""
        serializer = ProfileUpdateSerializer(request.user, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(UserProfileSerializer(request.user).data)

    @action(detail=False, methods=['post'])
    def change_password(self, request):
        """Change user password"""
        serializer = ChangePasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user = request.user
        if not user.check_password(serializer.validated_data['old_password']):
            return Response(
                {'old_password': 'Mot de passe incorrect.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        user.set_password(serializer.validated_data['new_password'])
        user.save()
        # Révoque toutes les sessions ouvertes (jetons de rafraîchissement).
        try:
            from rest_framework_simplejwt.token_blacklist.models import OutstandingToken, BlacklistedToken
            for token in OutstandingToken.objects.filter(user=user):
                BlacklistedToken.objects.get_or_create(token=token)
        except Exception:
            logger.warning("Révocation des jetons impossible pour %s", user.pk)

        return Response({'detail': 'Mot de passe changé avec succès.'})

    @action(detail=True, methods=['post', 'delete', 'get'])
    def avatar(self, request, pk=None):
        """
        Upload, delete or get user avatar
        POST: Upload avatar
        DELETE: Delete avatar
        GET: Get avatar URL
        """
        user = self.get_object()

        # Check permissions - user can only modify their own avatar or admin can modify any
        if user != request.user and not request.user.is_staff and request.user.role not in ['pdg', 'admin']:
            return Response(
                {'detail': 'Vous n\'avez pas la permission de modifier cet avatar.'},
                status=status.HTTP_403_FORBIDDEN
            )

        if request.method == 'POST':
            # Set parsers for multipart data
            self.parser_classes = [MultiPartParser, FormParser]
            # Upload avatar
            avatar_file = request.FILES.get('avatar')

            if not avatar_file:
                return Response(
                    {'detail': 'Aucun fichier fourni.'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Validate file type
            allowed_types = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
            if avatar_file.content_type not in allowed_types:
                return Response(
                    {'detail': 'Type de fichier non supporté. Utilisez JPG, PNG, GIF ou WebP.'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Validate file size (5MB max)
            if avatar_file.size > 5 * 1024 * 1024:
                return Response(
                    {'detail': 'Fichier trop volumineux. Taille maximale: 5MB.'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Delete old avatar if exists
            if user.avatar:
                try:
                    if os.path.isfile(user.avatar.path):
                        os.remove(user.avatar.path)
                except Exception as e:
                    logger.warning(f"Could not delete old avatar: {e}")

            # Save new avatar
            user.avatar = avatar_file
            user.save()

            return Response({
                'detail': 'Avatar uploadé avec succès.',
                'avatar_url': request.build_absolute_uri(user.avatar.url) if user.avatar else None
            })

        elif request.method == 'DELETE':
            # Delete avatar
            if user.avatar:
                try:
                    if os.path.isfile(user.avatar.path):
                        os.remove(user.avatar.path)
                except Exception as e:
                    logger.warning(f"Could not delete avatar file: {e}")

                user.avatar = None
                user.save()

                return Response({'detail': 'Avatar supprimé avec succès.'})
            else:
                return Response(
                    {'detail': 'Aucun avatar à supprimer.'},
                    status=status.HTTP_404_NOT_FOUND
                )

        elif request.method == 'GET':
            # Get avatar URL
            return Response({
                'avatar_url': request.build_absolute_uri(user.avatar.url) if user.avatar else None
            })


class LoginView(generics.GenericAPIView):
    """
    Login view - returns JWT tokens
    """
    serializer_class = LoginSerializer
    permission_classes = [AllowAny]
    throttle_scope = 'login'

    def post(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        email = serializer.validated_data['email']
        password = serializer.validated_data['password']

        user = authenticate(email=email, password=password)

        if user is None:
            audit('login_failed', None, details={'email': email})
            return Response(
                {'detail': 'Email ou mot de passe incorrect.'},
                status=status.HTTP_401_UNAUTHORIZED
            )

        if not user.is_active or user.status != 'actif':
            audit('login_failed', user, user=user, details={'motif': f'compte {user.status}'})
            return Response(
                {'detail': 'Ce compte est désactivé ou suspendu. Contactez l’administration.'},
                status=status.HTTP_401_UNAUTHORIZED
            )
        audit('login', user, user=user)

        user = User.objects.select_related('auditoire', 'section', 'filiere').get(pk=user.pk)
        refresh = RefreshToken.for_user(user)

        body = {'access': str(refresh.access_token), 'user': UserProfileSerializer(user).data}
        if cookie_mode(request):
            # Web : le refresh token vit dans un cookie httpOnly (inaccessible au JavaScript).
            response = Response(body)
            set_refresh_cookie(response, str(refresh))
            return response
        body['refresh'] = str(refresh)  # applications mobiles : stockage sécurisé natif
        return Response(body)


class LogoutView(generics.GenericAPIView):
    """
    Logout view - blacklist refresh token
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        refresh_token = request.data.get('refresh') or request.COOKIES.get(REFRESH_COOKIE)
        response = Response({'detail': 'Déconnexion réussie.'}, status=status.HTTP_200_OK)
        response.delete_cookie(REFRESH_COOKIE, path=REFRESH_COOKIE_PATH)
        if refresh_token:
            try:
                RefreshToken(refresh_token).blacklist()
            except Exception:
                pass  # jeton déjà expiré / révoqué : la déconnexion reste effective
        return response


REFRESH_COOKIE = 'mz_refresh'
REFRESH_COOKIE_PATH = '/api/auth/'


def cookie_mode(request):
    return request.headers.get('X-Auth-Mode', '').lower() == 'cookie'


def set_refresh_cookie(response, token):
    from django.conf import settings as dj_settings
    response.set_cookie(
        REFRESH_COOKIE, token, httponly=True, secure=not dj_settings.DEBUG, samesite='Lax',
        path=REFRESH_COOKIE_PATH,
        max_age=int(dj_settings.SIMPLE_JWT['REFRESH_TOKEN_LIFETIME'].total_seconds()))


class CookieTokenRefreshView(generics.GenericAPIView):
    """Rafraîchit l'access token depuis le corps (mobile) ou le cookie httpOnly (web)."""
    permission_classes = [AllowAny]
    authentication_classes = []

    def post(self, request):
        from rest_framework_simplejwt.serializers import TokenRefreshSerializer
        from rest_framework_simplejwt.exceptions import TokenError, InvalidToken
        from_cookie = not request.data.get('refresh')
        token = request.data.get('refresh') or request.COOKIES.get(REFRESH_COOKIE)
        if not token:
            return Response({'detail': 'Session expirée.'}, status=status.HTTP_401_UNAUTHORIZED)
        serializer = TokenRefreshSerializer(data={'refresh': token})
        try:
            serializer.is_valid(raise_exception=True)
        except (TokenError, InvalidToken):
            response = Response({'detail': 'Session expirée.'}, status=status.HTTP_401_UNAUTHORIZED)
            response.delete_cookie(REFRESH_COOKIE, path=REFRESH_COOKIE_PATH)
            return response
        data = dict(serializer.validated_data)
        if from_cookie:
            response = Response({'access': data['access']})
            if data.get('refresh'):
                set_refresh_cookie(response, data['refresh'])
            return response
        return Response(data)


class StudentFilter(FilterSet):
    """Custom filter for students."""
    section = CharFilter(method='filter_by_section')
    filiere = CharFilter(method='filter_by_filiere')

    class Meta:
        model = User
        fields = ['auditoire', 'section', 'filiere']

    def filter_by_section(self, queryset, name, value):
        logger.info(f"--- Filtering students by section ID: {value} ---")
        logger.info(f"Initial student count: {queryset.count()}")
        logger.info(f"Initial student count:")

        filtered_qs = queryset.filter(
            Q(auditoire__filiere__section__id=value) |
            Q(filiere__section__id=value) |
            Q(section__id=value)
        ).distinct()

        logger.info(f"Final student count after filter: {filtered_qs.count()}")
        logger.info("--- End of section filter ---")
        return filtered_qs

    def filter_by_filiere(self, queryset, name, value):
        logger.info(f"--- Filtering students by filiere ID: {value} ---")
        logger.info(f"Initial student count: {queryset.count()}")

        filtered_qs = queryset.filter(
            Q(auditoire__filiere__id=value) |
            Q(filiere__id=value)
        ).distinct()

        logger.info(f"Final student count after filter: {filtered_qs.count()}")
        logger.info("--- End of filiere filter ---")
        return filtered_qs


class StudentListView(RoleBasedFilterMixin, generics.ListAPIView):
    """
    API view to list students with intelligent role-based filtering
    """
    queryset = User.objects.select_related('auditoire__filiere__section', 'filiere__section', 'section').filter(role='etudiant').order_by('last_name', 'first_name')
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated, CanViewUsers]
    pagination_class = StandardResultsSetPagination
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_class = StudentFilter
    search_fields = ['first_name', 'last_name', 'email', 'matricule']
    ordering_fields = ['last_name', 'first_name', 'matricule']

    def get_queryset(self):
        """Apply intelligent role-based filtering"""
        queryset = super().get_queryset()
        return self.filter_queryset_by_role(queryset, self.request.user, 'user')


class TeacherListView(RoleBasedFilterMixin, generics.ListAPIView):
    """
    API view to list teachers and assistants with intelligent role-based filtering
    """
    queryset = User.objects.select_related('filiere', 'section').prefetch_related(
        'courses_as_teacher__auditoire__filiere__section',
        'courses_as_assistant__auditoire__filiere__section'
    ).filter(role__in=['enseignant', 'assistant']).order_by('last_name', 'first_name').distinct()
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated, CanViewUsers]
    pagination_class = StandardResultsSetPagination
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_class = TeacherFilter
    search_fields = ['first_name', 'last_name', 'email']
    ordering_fields = ['last_name', 'first_name']

    def get_queryset(self):
        """
        Apply intelligent role-based filtering

        Note: Si for_course_form=true, chef_section et chef_departement voient TOUS les enseignants
        car ils peuvent assigner n'importe quel enseignant à un nouveau cours
        """
        queryset = super().get_queryset()
        user = self.request.user

        # Si c'est pour le formulaire de cours, chef section/département voient TOUS les enseignants
        for_course_form = self.request.query_params.get('for_course_form', 'false').lower() == 'true'
        if for_course_form and user.role in ['chef_section', 'chef_departement']:
            return queryset

        return self.filter_queryset_by_role(queryset, user, 'user')
