"""
Permissions et groupes de rôles — source unique de vérité.

Principe (cahier des charges v2) : celui qui saisit ne valide pas, celui qui encaisse
ne rapproche pas, la direction consulte tout mais n'opère pas.
"""
from rest_framework import permissions

# --- Groupes de rôles -------------------------------------------------------
DIRECTION_ROLES = ['pdg', 'directeur_general']
ACADEMIC_ADMIN_ROLES = ['pdg', 'sga']                      # structure, inscriptions, horaires
FINANCE_ADMIN_ROLES = ['pdg', 'sgad', 'directeur_general']  # barèmes, validations financières
CASHIER_ROLES = ['caisse']
TEACHING_ROLES = ['enseignant', 'assistant']
ACADEMIC_HEAD_ROLES = ['chef_section', 'chef_departement']
# Rôles autorisés à créer des comptes et leurs rôles attribuables.
ROLE_ASSIGNMENT = {
    'pdg': None,  # tous les rôles
    'sga': ['etudiant', 'enseignant', 'assistant', 'chef_section', 'chef_departement', 'apparitorat', 'jury'],
    'sgad': ['caisse', 'comptable', 'bibliothecaire', 'service_it'],
}


def effective_roles(user):
    """Rôle principal + affectations datées en cours (AffectationRole)."""
    if not user or not user.is_authenticated:
        return set()
    cached = getattr(user, '_mz_roles', None)
    if cached is not None:
        return cached
    roles = {user.role}
    try:
        from django.utils import timezone
        from django.db.models import Q
        from apps.scolarite.models import AffectationRole
        today = timezone.localdate()
        roles |= set(AffectationRole.objects.filter(
            user=user, start_date__lte=today).filter(Q(end_date__isnull=True) | Q(end_date__gte=today))
            .values_list('role', flat=True))
    except Exception:
        pass
    user._mz_roles = roles
    return roles


def scoped_affectations(user, role):
    """Affectations en cours d'un rôle donné (pour connaître le périmètre filière/section)."""
    from django.utils import timezone
    from django.db.models import Q
    from apps.scolarite.models import AffectationRole
    today = timezone.localdate()
    return AffectationRole.objects.filter(user=user, role=role, start_date__lte=today).filter(
        Q(end_date__isnull=True) | Q(end_date__gte=today))


PERSONAL_ROLES = {'etudiant'}


def has_role(user, *roles):
    """
    Vrai si l'utilisateur détient l'un des rôles (rôle principal ou affectation en cours).
    Le PDG (administrateur général) et le superutilisateur détiennent tous les pouvoirs,
    sauf les espaces strictement personnels de l'étudiant.
    """
    if not (user and user.is_authenticated):
        return False
    if (user.is_superuser or user.role == 'pdg') and not set(roles) <= PERSONAL_ROLES:
        return True
    return bool(effective_roles(user) & set(roles))


def assignable_roles(user):
    """Rôles que ``user`` peut attribuer (None = tous)."""
    if not user or not user.is_authenticated:
        return []
    if user.is_superuser or user.role == 'pdg':
        return None
    return ROLE_ASSIGNMENT.get(user.role, [])


def teaches_course(user, course):
    """Vrai si ``user`` est titulaire ou assistant du cours."""
    if not user or not user.is_authenticated or course is None:
        return False
    if course.titulaire_id == user.id:
        return True
    return course.assistants.filter(pk=user.pk).exists()


def manages_course(user, course):
    """Titulaire/assistant, chef de la filière ou de la section du cours, ou admin académique."""
    if not user or not user.is_authenticated or course is None:
        return False
    if user.is_superuser or user.role in ACADEMIC_ADMIN_ROLES:
        return True
    if teaches_course(user, course):
        return True
    filiere = getattr(course.auditoire, 'filiere', None) if course.auditoire_id else None
    if filiere is None:
        return False
    # Affectations datées (ex. enseignant nommé chef de filière)
    roles = effective_roles(user)
    if 'chef_departement' in roles and scoped_affectations(user, 'chef_departement').filter(filiere=filiere).exists():
        return True
    if 'chef_section' in roles and scoped_affectations(user, 'chef_section').filter(section_id=filiere.section_id).exists():
        return True
    if user.role == 'chef_departement':
        managed = getattr(user, 'managed_filiere', None) if hasattr(user, 'managed_filiere') else None
        return filiere.id in {getattr(managed, 'id', None), user.filiere_id}
    if user.role == 'chef_section':
        managed = getattr(user, 'managed_section', None) if hasattr(user, 'managed_section') else None
        return filiere.section_id in {getattr(managed, 'id', None), user.section_id}
    return False


class IsAcademicAdmin(permissions.BasePermission):
    """SGA et PDG : structure académique, inscriptions, calendrier."""
    message = "Réservé au Secrétariat Général Académique."

    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and
                    (request.user.is_staff or has_role(request.user, *ACADEMIC_ADMIN_ROLES)))


class IsTeachingStaff(permissions.BasePermission):
    """Enseignants, assistants, chefs et admins académiques (jamais les étudiants)."""

    def has_permission(self, request, view):
        return has_role(request.user, *TEACHING_ROLES, *ACADEMIC_HEAD_ROLES, *ACADEMIC_ADMIN_ROLES)


class IsOwnerOrAdmin(permissions.BasePermission):
    """
    Permission to only allow owners of an object or admins to access it.
    """
    def has_object_permission(self, request, view, obj):
        # Admins can access any profile
        if request.user.is_staff or request.user.role in ['pdg', 'directeur_general', 'sga', 'sgad']:
            return True
        # Owners can access their own profile
        return obj == request.user

class IsAdminUser(permissions.BasePermission):
    """
    Permission to only allow admin users
    """
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and \
               (request.user.is_staff or request.user.role in ['pdg', 'directeur_general', 'sga', 'sgad'])

class IsSGAOrAdmin(permissions.BasePermission):
    """
    SGA, SGAD, direction et PDG. Le caissier n'en fait PLUS partie : il ne gère ni la
    structure académique ni les inscriptions.
    """
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and \
               (request.user.is_staff or request.user.role in ['sga', 'sgad', 'pdg', 'directeur_general'])

class CanManageCourses(permissions.BasePermission):
    """
    Création / modification / suppression de cours : SGA, PDG et chefs (dans leur
    périmètre, contrôlé par la vue). Un enseignant ne crée pas de cours.
    """
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and \
               (request.user.is_staff or request.user.role in ['sga', 'pdg', 'chef_section', 'chef_departement'])

class IsTeacherOrAdmin(permissions.BasePermission):
    """
    Permission for teachers and admin users (including SGA and other admin roles)
    """
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and \
               (request.user.is_staff or request.user.role in [
                   'enseignant', 'assistant', 'chef_section', 'chef_departement',
                   'sga', 'sgad', 'pdg', 'directeur_general'
               ])

class IsStudentUser(permissions.BasePermission):
    """
    Permission for student users
    """
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.role == 'etudiant'

class IsLibrarianOrAdmin(permissions.BasePermission):
    """
    Permission for librarians and admin users
    """
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and \
               (request.user.is_staff or request.user.role in ['bibliothecaire', 'sga', 'pdg'])

class IsHROrAdmin(permissions.BasePermission):
    """
    Permission for HR and admin users
    """
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and \
               (request.user.is_staff or request.user.role in ['sgad', 'pdg', 'directeur_general'])

class IsCaisseOrAdmin(permissions.BasePermission):
    """Caisse, comptabilité, SGAD, direction et PDG (affectations datées comprises)."""
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and (
            request.user.is_staff or has_role(request.user, 'caisse', 'comptable', 'sgad', 'pdg', 'directeur_general')))


class IsComptableOrAdmin(permissions.BasePermission):
    """Contrôle financier : comptable, SGAD, DG, PDG."""
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and (
            request.user.is_staff or has_role(request.user, 'comptable', 'sgad', 'pdg', 'directeur_general')))


class IsDGOrIAdmin(permissions.BasePermission):
    """
    Permission for DG and PDG only — full financial management.
    """
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and \
               (request.user.is_staff or request.user.role in ['pdg', 'directeur_general'])

class CanViewUsers(permissions.BasePermission):
    """
    Permission to allow specific roles to view users (including SGAD for fee assignment).
    """
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return request.user and request.user.is_authenticated and \
                   (request.user.is_staff or request.user.role in [
                       'pdg', 'sga', 'sgad', 'caisse', 'directeur_general',
                       'chef_section', 'chef_departement', 'enseignant'
                   ])
        return False

    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return request.user and request.user.is_authenticated and \
                   (request.user.is_staff or request.user.role in [
                       'pdg', 'sga', 'sgad', 'caisse', 'directeur_general',
                       'chef_section', 'chef_departement', 'enseignant'
                   ])
        return False

class CanViewAcademicData(permissions.BasePermission):
    """
    Permission to allow specific roles (pdg, sga, chef_section, chef_departement) to view academic data (sections, filieres, auditoires).
    """
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return request.user and request.user.is_authenticated and \
                   (request.user.is_staff or request.user.role in ['pdg', 'sga', 'chef_section', 'chef_departement', 'enseignant', 'assistant', 'directeur_general', 'sgad', 'caisse', 'apparitorat'])
        return False

    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return request.user and request.user.is_authenticated and \
                   (request.user.is_staff or request.user.role in ['pdg', 'sga', 'chef_section', 'chef_departement', 'enseignant', 'assistant', 'directeur_general', 'sgad', 'caisse', 'apparitorat'])
        return False


class ManagesObjectCourse(permissions.BasePermission):
    """
    Permission objet : l'utilisateur doit gérer le cours de l'objet.
    La vue fournit ``course_of(obj)``.
    """
    message = "Vous ne pouvez agir que sur vos propres cours."

    def has_object_permission(self, request, view, obj):
        return manages_course(request.user, view.course_of(obj))


class IsObjectStudent(permissions.BasePermission):
    """Permission objet : l'objet (tentative, copie) appartient à l'étudiant connecté."""
    message = "Cet élément ne vous appartient pas."

    def has_object_permission(self, request, view, obj):
        return getattr(obj, 'student_id', None) == request.user.id


ASSESSMENT_READ_ALL_ROLES = ['pdg', 'sga', 'directeur_general']
