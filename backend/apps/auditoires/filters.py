"""
Filtres pour les auditoires
"""

from django_filters import rest_framework as filters
from django.db.models import Q
from .models import Auditoire, Filiere, Section


class AuditoireFilter(filters.FilterSet):
    """
    Filtre complet pour les auditoires
    """
    # Année académique
    annee_academique = filters.CharFilter(
        field_name='annee_academique',
        lookup_expr='icontains'
    )

    # Vacation
    vacation = filters.ChoiceFilter(
        field_name='vacation',
        choices=[
            ('jour', 'Jour'),
            ('soir', 'Soir'),
        ]
    )

    # Section (Faculté)
    section = filters.NumberFilter(field_name='filiere__section__id')

    # Filière (Département)
    filiere = filters.NumberFilter(field_name='filiere__id')

    # Niveau d'étude
    niveau = filters.ChoiceFilter(
        field_name='niveau',
        choices=[
            ('L1', 'Licence 1'),
            ('L2', 'Licence 2'),
            ('L3', 'Licence 3'),
            ('M1', 'Master 1'),
            ('M2', 'Master 2'),
        ]
    )

    # Statut actif
    is_active = filters.BooleanFilter(field_name='is_active')

    # Capacité
    capacite_min = filters.NumberFilter(field_name='capacite_max', lookup_expr='gte')
    capacite_max = filters.NumberFilter(field_name='capacite_max', lookup_expr='lte')

    # Recherche textuelle
    search = filters.CharFilter(method='filter_search')

    class Meta:
        model = Auditoire
        fields = ['annee_academique', 'vacation', 'section', 'filiere', 'niveau', 'is_active']

    def filter_search(self, queryset, name, value):
        """Recherche textuelle dans nom et description"""
        if not value:
            return queryset
        return queryset.filter(
            Q(nom__icontains=value) |
            Q(description__icontains=value) |
            Q(filiere__nom__icontains=value) |
            Q(filiere__section__nom__icontains=value)
        ).distinct()


class FiliereFilter(filters.FilterSet):
    """
    Filtre pour les filières
    """
    # Section
    section = filters.NumberFilter(field_name='section__id')

    # Recherche
    search = filters.CharFilter(method='filter_search')

    class Meta:
        model = Filiere
        fields = ['section']

    def filter_search(self, queryset, name, value):
        """Recherche textuelle"""
        if not value:
            return queryset
        return queryset.filter(
            Q(nom__icontains=value) |
            Q(section__nom__icontains=value)
        ).distinct()


class SectionFilter(filters.FilterSet):
    """
    Filtre pour les sections
    """
    # Recherche
    search = filters.CharFilter(method='filter_search')

    class Meta:
        model = Section
        fields = []

    def filter_search(self, queryset, name, value):
        """Recherche textuelle"""
        if not value:
            return queryset
        return queryset.filter(nom__icontains=value).distinct()
