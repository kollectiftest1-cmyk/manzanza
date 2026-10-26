"""
Role-based filtering mixins for intelligent access control
"""
from django.db.models import Q


class RoleBasedFilterMixin:
    """
    Mixin pour filtrer les querysets basés sur le rôle de l'utilisateur

    Règles de filtrage :
    - SGA/Admin : Voir TOUT
    - Chef Section : Voir tout de SA section
    - Chef Département : Voir tout de SA filière
    - Enseignant/Assistant : Voir les cours où ils enseignent
    - Étudiant : Voir uniquement SON auditoire
    """

    def filter_queryset_by_role(self, queryset, user, model_type):
        """
        Filtrer le queryset basé sur le rôle de l'utilisateur et le type de modèle

        Args:
            queryset: Le queryset à filtrer
            user: L'utilisateur actuel
            model_type: Le type de modèle ('course', 'auditoire', 'user', 'section', 'filiere')
        """
        if not user.is_authenticated:
            return queryset.none()

        # SGA, admins et direction voient TOUT (la direction consulte, n'opère pas)
        if user.is_superuser or user.role in ['sga', 'admin', 'pdg', 'directeur_general']:
            return queryset

        # Lecture de la structure académique (ciblage des frais, apparitorat)
        if model_type in ['section', 'filiere', 'auditoire'] and user.role in ['sgad', 'caisse', 'apparitorat']:
            return queryset

        # Finances : besoin de retrouver les étudiants (affectation des frais, encaissement)
        if model_type == 'user' and user.role in ['sgad', 'caisse']:
            return queryset.filter(role='etudiant')

        # Chef de section
        if user.role == 'chef_section':
            return self._filter_for_chef_section(queryset, user, model_type)

        # Chef de département
        if user.role == 'chef_departement':
            return self._filter_for_chef_departement(queryset, user, model_type)

        # Enseignant/Assistant
        if user.role in ['enseignant', 'assistant']:
            return self._filter_for_teacher(queryset, user, model_type)

        # Étudiant
        if user.role == 'etudiant':
            return self._filter_for_student(queryset, user, model_type)

        return queryset.none()

    def _filter_for_chef_section(self, queryset, user, model_type):
        """Filtrage pour chef de section"""
        section = user.managed_section if hasattr(user, 'managed_section') else None
        if not section:
            return queryset.none()

        filters = {
            'course': Q(auditoire__filiere__section=section),
            'auditoire': Q(filiere__section=section),
            'user': Q(
                Q(auditoire__filiere__section=section) |  # Étudiants de la section
                Q(courses_as_teacher__auditoire__filiere__section=section) |  # Enseignants
                Q(courses_as_assistant__auditoire__filiere__section=section) |  # Assistants
                Q(managed_filiere__section=section) |  # Chefs de département
                Q(managed_section=section)  # Chef de section lui-même
            ),
            'section': Q(id=section.id),
            'filiere': Q(section=section),
        }

        return queryset.filter(filters.get(model_type, Q())).distinct()

    def _filter_for_chef_departement(self, queryset, user, model_type):
        """Filtrage pour chef de département"""
        filiere = user.managed_filiere if hasattr(user, 'managed_filiere') else None
        if not filiere:
            return queryset.none()

        filters = {
            'course': Q(auditoire__filiere=filiere),
            'auditoire': Q(filiere=filiere),
            'user': Q(
                Q(auditoire__filiere=filiere) |  # Étudiants de la filière
                Q(courses_as_teacher__auditoire__filiere=filiere) |  # Enseignants
                Q(courses_as_assistant__auditoire__filiere=filiere) |  # Assistants
                Q(managed_filiere=filiere)  # Chef lui-même
            ),
            'section': Q(id=filiere.section.id) if filiere.section else Q(),
            'filiere': Q(id=filiere.id),
        }

        return queryset.filter(filters.get(model_type, Q())).distinct()

    def _filter_for_teacher(self, queryset, user, model_type):
        """Filtrage pour enseignant/assistant"""
        filters = {
            'course': Q(titulaire=user) | Q(assistants=user),
            'auditoire': Q(
                Q(courses__titulaire=user) | Q(courses__assistants=user)
            ),
            'user': Q(
                Q(auditoire__courses__titulaire=user) |  # Étudiants de ses cours
                Q(auditoire__courses__assistants=user) |
                Q(id=user.id)  # Lui-même
            ),
            'section': Q(
                Q(filieres__auditoire__courses__titulaire=user) |
                Q(filieres__auditoire__courses__assistants=user)
            ),
            'filiere': Q(
                Q(auditoire__courses__titulaire=user) |
                Q(auditoire__courses__assistants=user)
            ),
        }

        return queryset.filter(filters.get(model_type, Q())).distinct()

    def _filter_for_student(self, queryset, user, model_type):
        """Filtrage pour étudiant"""
        auditoire = user.auditoire
        if not auditoire:
            return queryset.none()

        filters = {
            'course': Q(auditoire=auditoire),
            'auditoire': Q(id=auditoire.id),
            'user': Q(
                Q(auditoire=auditoire) |  # Ses camarades
                Q(courses_as_teacher__auditoire=auditoire) |  # Ses enseignants
                Q(courses_as_assistant__auditoire=auditoire) |  # Ses assistants
                Q(id=user.id)  # Lui-même
            ),
            'section': Q(id=auditoire.filiere.section.id) if auditoire.filiere and auditoire.filiere.section else Q(),
            'filiere': Q(id=auditoire.filiere.id) if auditoire.filiere else Q(),
        }

        return queryset.filter(filters.get(model_type, Q())).distinct()
