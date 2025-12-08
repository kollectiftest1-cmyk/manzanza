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
    ChangePasswordSerializer, LoginSerializer, UserProfileSerializer
)
from .permissions import IsOwnerOrAdmin, IsAdminUser, CanViewUsers
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
        if for_course_form and user.role in ['chef_section', 'chef_departement', 'sga', 'admin', 'iadmin']:
            return queryset

        return self.filter_queryset_by_role(queryset, user, 'user')

    def get_serializer_class(self):
        if self.action == 'create':
            return UserCreateSerializer
        elif self.action in ['update', 'partial_update']:
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
            return [AllowAny()]
        elif self.action == 'list':
            return [OR(IsAdminUser(), CanViewUsers())]
        elif self.action == 'destroy':
            return [IsAdminUser()]
        elif self.action in ['update', 'partial_update']:
            return [IsOwnerOrAdmin()]
        elif self.action == 'retrieve':
            return [OR(IsOwnerOrAdmin(), CanViewUsers())]
        return super().get_permissions()

    @action(detail=False, methods=['get'])
    def me(self, request):
        """Get current user info"""
        serializer = UserProfileSerializer(request.user)
        return Response(serializer.data)

    @action(detail=False, methods=['put', 'patch'])
    def update_profile(self, request):
        """Update current user profile"""
        serializer = UserUpdateSerializer(request.user, data=request.data, partial=True)
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
        if user != request.user and not request.user.is_staff and request.user.role not in ['iadmin', 'admin', 'pdg']:
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

    def post(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        email = serializer.validated_data['email']
        password = serializer.validated_data['password']

        user = authenticate(email=email, password=password)

        if user is None:
            return Response(
                {'detail': 'Email ou mot de passe incorrect.'},
                status=status.HTTP_401_UNAUTHORIZED
            )

        if not user.is_active:
            return Response(
                {'detail': 'Ce compte est désactivé.'},
                status=status.HTTP_401_UNAUTHORIZED
            )

        user = User.objects.select_related('auditoire', 'section', 'filiere').get(pk=user.pk)
        refresh = RefreshToken.for_user(user)

        return Response({
            'access': str(refresh.access_token),
            'refresh': str(refresh),
            'user': UserProfileSerializer(user).data
        })


class LogoutView(generics.GenericAPIView):
    """
    Logout view - blacklist refresh token
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            refresh_token = request.data.get('refresh')
            if refresh_token:
                token = RefreshToken(refresh_token)
                token.blacklist()
            return Response({'detail': 'Déconnexion réussie.'}, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({'detail': str(e)}, status=status.HTTP_400_BAD_REQUEST)


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
