"""
Custom permissions for user management
"""
from rest_framework import permissions


class IsOwnerOrAdmin(permissions.BasePermission):
    """
    Permission to only allow owners of an object or admins to access it.
    """
    def has_object_permission(self, request, view, obj):
        # Admins can access any profile
        if request.user.is_staff or request.user.role in ['iadmin', 'pdg', 'directeur_general', 'sga', 'sgad']:
            return True
        # Owners can access their own profile
        return obj == request.user

class IsAdminUser(permissions.BasePermission):
    """
    Permission to only allow admin users
    """
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and \
               (request.user.is_staff or request.user.role in ['iadmin', 'pdg', 'directeur_general', 'sga', 'sgad'])

class IsSGAOrAdmin(permissions.BasePermission):
    """
    Permission for SGA and Admin users.
    """
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and \
               (request.user.is_staff or request.user.role == 'sga')

class CanManageCourses(permissions.BasePermission):
    """
    Permission for users who can manage courses (create, update, delete).
    """
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and \
               (request.user.is_staff or request.user.role in ['sga', 'chef_section', 'chef_departement', 'enseignant'])

class IsTeacherOrAdmin(permissions.BasePermission):
    """
    Permission for teachers and admin users
    """
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and \
               (request.user.is_staff or request.user.role in ['enseignant', 'assistant', 'chef_section', 'chef_departement'])

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
               (request.user.is_staff or request.user.role in ['bibliothecaire', 'sga'])

class IsHROrAdmin(permissions.BasePermission):
    """
    Permission for HR and admin users
    """
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and \
               (request.user.is_staff or request.user.role in ['sgad', 'directeur_general'])

class IsCaisseOrAdmin(permissions.BasePermission):
    """
    Permission for caisse/accounting and admin users
    """
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and \
               (request.user.is_staff or request.user.role in ['caisse', 'sgad'])

class CanViewUsers(permissions.BasePermission):
    """
    Permission to allow specific roles (iadmin, sga, chef_section, chef_departement) to view users.
    """
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return request.user and request.user.is_authenticated and \
                   (request.user.is_staff or request.user.role in ['iadmin', 'sga', 'chef_section', 'chef_departement'])
        return False

    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return request.user and request.user.is_authenticated and \
                   (request.user.is_staff or request.user.role in ['iadmin', 'sga', 'chef_section', 'chef_departement'])
        return False

class CanViewAcademicData(permissions.BasePermission):
    """
    Permission to allow specific roles (iadmin, sga, chef_section, chef_departement) to view academic data (sections, filieres, auditoires).
    """
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return request.user and request.user.is_authenticated and \
                   (request.user.is_staff or request.user.role in ['iadmin', 'sga', 'chef_section', 'chef_departement'])
        return False

    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return request.user and request.user.is_authenticated and \
                   (request.user.is_staff or request.user.role in ['iadmin', 'sga', 'chef_section', 'chef_departement'])
        return False
