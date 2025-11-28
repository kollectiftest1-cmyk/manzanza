"""
URL configuration for Syntax GU Backend project.
"""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from rest_framework import permissions
from drf_yasg.views import get_schema_view
from drf_yasg import openapi
from rest_framework.routers import DefaultRouter
from apps.users.views import UserViewSet

# API Documentation
schema_view = get_schema_view(
    openapi.Info(
        title="Syntax GU API",
        default_version='v1',
        description="API Documentation for Syntax GU University Management System",
        terms_of_service="https://www.google.com/policies/terms/",
        contact=openapi.Contact(email="contact@syntaxgu.com"),
        license=openapi.License(name="BSD License"),
    ),
    public=True,
    permission_classes=(permissions.AllowAny,),
)

# Main API router
router = DefaultRouter()
router.register(r'users', UserViewSet, basename='user')

urlpatterns = [
    # Admin
    path('admin/', admin.site.urls),

    # API Documentation
    path('api/docs/', schema_view.with_ui('swagger', cache_timeout=0), name='schema-swagger-ui'),
    path('api/redoc/', schema_view.with_ui('redoc', cache_timeout=0), name='schema-redoc'),

    # API Routes
    path('api/', include(router.urls)),
    path('api/auth/', include('apps.users.urls')),
    path('api/inscriptions/', include('apps.inscriptions.urls')), # New
    path('api/courses/', include('apps.courses.urls')),
    path('api/auditoires/', include('apps.auditoires.urls')),
    path('api/quiz/', include('apps.quiz.urls')),
    path('api/chat/', include('apps.chat.urls')),
    path('api/assignments/', include('apps.assignments.urls')),
    path('api/library/', include('apps.library.urls')),
    path('api/payments/', include('apps.payments.urls')),
    path('api/hr/', include('apps.hr.urls')),
    path('api/notifications/', include('apps.notifications.urls')),
    path('api/stats/', include('apps.stats.urls')),
    path('api/core/', include('apps.core.urls')),
]

# Serve media files in development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
