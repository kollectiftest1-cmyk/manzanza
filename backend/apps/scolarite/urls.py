from django.urls import include, path
from rest_framework.routers import DefaultRouter

from . import views

router = DefaultRouter()
router.register(r'ues', views.UniteEnseignementViewSet, basename='ue')
router.register(r'inscriptions', views.InscriptionAnnuelleViewSet, basename='inscription-annuelle')
router.register(r'affectations', views.AffectationRoleViewSet, basename='affectation')
router.register(r'deliberations', views.DeliberationViewSet, basename='deliberation')
router.register(r'resultats', views.ResultatViewSet, basename='resultat')
router.register(r'memoires', views.MemoireViewSet, basename='memoire')
router.register(r'documents', views.DocumentOfficielViewSet, basename='document-officiel')

urlpatterns = [
    path('verify/<str:code>/', views.verify_document, name='verify-document'),
    path('clearance/me/', views.my_clearance, name='my-clearance'),
    path('', include(router.urls)),
]
