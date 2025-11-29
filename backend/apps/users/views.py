"""
User views
"""
import logging
from rest_framework import viewsets, status, generics, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny, OR
from rest_framework.pagination import PageNumberPagination
from rest_framework_simplejwt.tokens import RefreshToken
from django_filters.rest_framework import DjangoFilterBackend, FilterSet
from django_filters import CharFilter
from django.contrib.auth import authenticate, get_user_model
from django.db.models import Q
from .serializers import (
    UserSerializer, UserCreateSerializer, UserUpdateSerializer,
    ChangePasswordSerializer, LoginSerializer, UserProfileSerializer
)
from .permissions import IsOwnerOrAdmin, IsAdminUser, CanViewUsers

User = get_user_model()
logger = logging.getLogger(__name__)


class StandardResultsSetPagination(PageNumberPagination):
    page_size = 10
    page_size_query_param = 'page_size'
    max_page_size = 100


class UserViewSet(viewsets.ModelViewSet):
    """
    ViewSet for User model
    """
    queryset = User.objects.select_related(
        'auditoire', 'section', 'filiere'
    ).prefetch_related(
        'courses_held'
    ).all().order_by('-date_joined')
    permission_classes = [IsAuthenticated]
    pagination_class = StandardResultsSetPagination
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['role']
    search_fields = ['first_name', 'last_name', 'email']

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


class StudentListView(generics.ListAPIView):
    """
    API view to list students with filtering options.
    """
    queryset = User.objects.select_related('auditoire__filiere__section', 'filiere__section', 'section').filter(role='etudiant').order_by('last_name', 'first_name')
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated, CanViewUsers]
    pagination_class = StandardResultsSetPagination
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_class = StudentFilter
    search_fields = ['first_name', 'last_name', 'email', 'matricule']
    ordering_fields = ['last_name', 'first_name', 'matricule']


class TeacherListView(generics.ListAPIView):
    """
    API view to list teachers and assistants with filtering options.
    """
    queryset = User.objects.select_related('filiere', 'section').filter(role__in=['enseignant', 'assistant']).order_by('last_name', 'first_name').distinct()
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated, CanViewUsers]
    pagination_class = StandardResultsSetPagination
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = [
        'filiere',
        'section',
        'courses_held__filieres',
        'courses_held__sections',
    ]
    search_fields = ['first_name', 'last_name', 'email']
    ordering_fields = ['last_name', 'first_name']
