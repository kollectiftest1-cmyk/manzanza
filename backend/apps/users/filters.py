"""
Filtres pour les utilisateurs (Étudiants, Enseignants, etc.)
"""

from django_filters import rest_framework as filters
from django.db.models import Q
from .models import User


class UserFilter(filters.FilterSet):
    """
    Filtre complet pour les utilisateurs avec tous les critères
    """
    # Année académique
    annee_academique = filters.CharFilter(method='filter_annee_academique')

    # Vacation
    vacation = filters.CharFilter(method='filter_vacation')

    # Section (Faculté)
    section = filters.NumberFilter(field_name='section__id')

    # Filière (Département)
    filiere = filters.NumberFilter(field_name='filiere__id')

    # Niveau d'étude
    niveau = filters.CharFilter(method='filter_niveau')

    # Sexe
    sexe = filters.ChoiceFilter(
        field_name='sexe',
        choices=[('M', 'Masculin'), ('F', 'Féminin')]
    )

    # Rôle
    role = filters.ChoiceFilter(
        field_name='role',
        choices=[
            ('etudiant', 'Étudiant'),
            ('enseignant', 'Enseignant'),
            ('assistant', 'Assistant'),
            ('apparitorat', 'Apparitorat'),
            ('chef_section', 'Chef de Section'),
            ('chef_departement', 'Chef de Département'),
            ('sga', 'SGA'),
            ('sgad', 'SGAD'),
            ('bibliothecaire', 'Bibliothecaire'),
            ('caisse', 'Caisse'),
            ('service_it', 'Service IT'),
            ('jury', 'Jury'),
            ('pdg', 'PDG'),
            ('directeur_general', 'Directeur General'),
        ]
    )

    # Rôles multiples (pour filtrer par plusieurs rôles à la fois)
    role__in = filters.CharFilter(method='filter_role_in')

    # Statut
    is_active = filters.BooleanFilter(field_name='is_active')

    # Recherche textuelle
    search = filters.CharFilter(method='filter_search')

    class Meta:
        model = User
        fields = ['role', 'section', 'filiere', 'sexe', 'is_active']

    def filter_annee_academique(self, queryset, name, value):
        """
        Filtre par année académique
        Peut être "2024-2025" ou juste "2024"
        """
        if not value:
            return queryset

        # Pour les étudiants: filtre via l'auditoire
        # Pour les enseignants: filtre via les cours qu'ils enseignent
        return queryset.filter(
            Q(auditoire__annee_academique__icontains=value) |
            Q(courses_as_teacher__annee_academique__icontains=value) |
            Q(courses_as_assistant__annee_academique__icontains=value)
        ).distinct()

    def filter_vacation(self, queryset, name, value):
        """
        Filtre par vacation (jour/soir)
        """
        if not value:
            return queryset

        # Pour les étudiants: via leur auditoire
        # Pour les enseignants: via les cours qu'ils enseignent
        return queryset.filter(
            Q(auditoire__vacation__iexact=value) |
            Q(courses_as_teacher__auditoire__vacation__iexact=value) |
            Q(courses_as_assistant__auditoire__vacation__iexact=value)
        ).distinct()

    def filter_niveau(self, queryset, name, value):
        """
        Filtre par niveau d'étude (L1, L2, L3, M1, M2)
        """
        if not value:
            return queryset

        # Pour les étudiants: via leur auditoire
        # Pour les enseignants: via les cours qu'ils enseignent
        return queryset.filter(
            Q(auditoire__niveau__iexact=value) |
            Q(courses_as_teacher__auditoire__niveau__iexact=value) |
            Q(courses_as_assistant__auditoire__niveau__iexact=value)
        ).distinct()

    def filter_search(self, queryset, name, value):
        """
        Recherche textuelle dans nom, prénom, email, matricule
        """
        if not value:
            return queryset

        return queryset.filter(
            Q(first_name__icontains=value) |
            Q(last_name__icontains=value) |
            Q(email__icontains=value) |
            Q(matricule__icontains=value)
        ).distinct()

    def filter_role_in(self, queryset, name, value):
        """
        Filtre par plusieurs rôles (séparés par des virgules)
        Exemple: role__in=enseignant,assistant
        """
        if not value:
            return queryset

        # Split par virgule et nettoyer les espaces
        roles = [role.strip() for role in value.split(',')]
        return queryset.filter(role__in=roles).distinct()


class StudentFilter(UserFilter):
    """
    Filtre spécifique pour les étudiants
    Hérite de UserFilter et ajoute des filtres spécifiques aux étudiants
    """
    # Auditoire
    auditoire = filters.NumberFilter(field_name='auditoire__id')

    # Statut d'inscription
    status = filters.ChoiceFilter(
        field_name='status',
        choices=[
            ('actif', 'Actif'),
            ('inactif', 'Inactif'),
            ('suspendu', 'Suspendu'),
        ]
    )

    class Meta:
        model = User
        fields = ['section', 'filiere', 'auditoire', 'sexe', 'status', 'is_active']

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # Force le filtre role='etudiant' pour les étudiants
        if self.request:
            self.queryset = self.queryset.filter(role='etudiant')


class TeacherFilter(UserFilter):
    """
    Filtre spécifique pour les enseignants
    Hérite de UserFilter et ajoute des filtres spécifiques aux enseignants
    """
    # Cours enseignés dans une section
    course_section = filters.NumberFilter(method='filter_by_course_section')

    # Cours enseignés dans une filière
    course_filiere = filters.NumberFilter(method='filter_by_course_filiere')

    # Cours enseignés dans un niveau
    course_niveau = filters.CharFilter(method='filter_by_course_niveau')

    class Meta:
        model = User
        fields = ['role', 'section', 'filiere', 'sexe', 'is_active']

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # Force le filtre role in ['enseignant', 'assistant']
        if self.request:
            self.queryset = self.queryset.filter(role__in=['enseignant', 'assistant'])

    def filter_by_course_section(self, queryset, name, value):
        """Filtre enseignants par sections où ils enseignent"""
        return queryset.filter(
            Q(courses_as_teacher__auditoire__filiere__section__id=value) |
            Q(courses_as_assistant__auditoire__filiere__section__id=value)
        ).distinct()

    def filter_by_course_filiere(self, queryset, name, value):
        """Filtre enseignants par filières où ils enseignent"""
        return queryset.filter(
            Q(courses_as_teacher__auditoire__filiere__id=value) |
            Q(courses_as_assistant__auditoire__filiere__id=value)
        ).distinct()

    def filter_by_course_niveau(self, queryset, name, value):
        """Filtre enseignants par niveaux où ils enseignent"""
        return queryset.filter(
            Q(courses_as_teacher__auditoire__niveau__iexact=value) |
            Q(courses_as_assistant__auditoire__niveau__iexact=value)
        ).distinct()
