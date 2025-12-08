"""
Filtres pour les cours
"""

from django_filters import rest_framework as filters
from django.db.models import Q
from .models import Course


class CourseFilter(filters.FilterSet):
    """
    Filtre complet pour les cours
    """
    # Année académique
    annee_academique = filters.CharFilter(
        field_name='annee_academique',
        lookup_expr='icontains'
    )

    # Vacation (via l'auditoire)
    vacation = filters.CharFilter(method='filter_vacation')

    # Section (via auditoire → filière → section)
    section = filters.NumberFilter(method='filter_section')

    # Filière (via auditoire → filière)
    filiere = filters.NumberFilter(method='filter_filiere')

    # Niveau d'étude (via auditoire)
    niveau = filters.CharFilter(method='filter_niveau')

    # Semestre
    semester = filters.ChoiceFilter(
        field_name='semester',
        choices=[
            ('Semestre 1', 'Semestre 1'),
            ('Semestre 2', 'Semestre 2'),
        ]
    )

    # Auditoire
    auditoire = filters.NumberFilter(field_name='auditoire__id')

    # Titulaire (enseignant)
    titulaire = filters.NumberFilter(field_name='titulaire__id')

    # Statut actif
    is_active = filters.BooleanFilter(field_name='is_active')

    # Crédits
    credits = filters.NumberFilter(field_name='credits')
    credits_min = filters.NumberFilter(field_name='credits', lookup_expr='gte')
    credits_max = filters.NumberFilter(field_name='credits', lookup_expr='lte')

    # Recherche textuelle
    search = filters.CharFilter(method='filter_search')

    class Meta:
        model = Course
        fields = ['annee_academique', 'semester', 'auditoire', 'titulaire', 'is_active', 'credits']

    def filter_vacation(self, queryset, name, value):
        """Filtre par vacation via l'auditoire"""
        if not value:
            return queryset
        return queryset.filter(auditoire__vacation__iexact=value).distinct()

    def filter_section(self, queryset, name, value):
        """Filtre par section via auditoire → filière → section"""
        if not value:
            return queryset
        return queryset.filter(auditoire__filiere__section__id=value).distinct()

    def filter_filiere(self, queryset, name, value):
        """Filtre par filière via auditoire → filière"""
        if not value:
            return queryset
        return queryset.filter(auditoire__filiere__id=value).distinct()

    def filter_niveau(self, queryset, name, value):
        """Filtre par niveau via auditoire"""
        if not value:
            return queryset
        return queryset.filter(auditoire__niveau__iexact=value).distinct()

    def filter_search(self, queryset, name, value):
        """Recherche textuelle dans nom, code, description"""
        if not value:
            return queryset
        return queryset.filter(
            Q(name__icontains=value) |
            Q(code__icontains=value) |
            Q(description__icontains=value)
        ).distinct()
