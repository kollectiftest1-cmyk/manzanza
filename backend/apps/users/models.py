"""
User models for Syntax GU University Management System
"""
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.db import models
from django.utils import timezone
from apps.auditoires.models import Auditoire, Section, Filiere

class UserManager(BaseUserManager):
    """Custom user manager"""

    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError('Users must have an email address')
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('role', 'iadmin')
        return self.create_user(email, password, **extra_fields)

class User(AbstractBaseUser, PermissionsMixin):
    """Custom User Model"""

    ROLE_CHOICES = [
        ('pdg', 'PDG'),
        ('directeur_general', 'Directeur Général'),
        ('sga', 'SGA'),
        ('sgad', 'SGAD'),
        ('chef_section', 'Chef de Section'),
        ('chef_departement', 'Chef de Département'), # Maintenu pour la logique, mais représente le chef de filière
        ('enseignant', 'Enseignant'),
        ('assistant', 'Assistant'),
        ('etudiant', 'Étudiant'),
        ('bibliothecaire', 'Bibliothécaire'),
        ('iadmin', 'iAdmin'),
    ]

    STATUS_CHOICES = [('actif', 'Actif'), ('inactif', 'Inactif'), ('suspendu', 'Suspendu')]

    email = models.EmailField(unique=True)
    first_name = models.CharField(max_length=150)
    last_name = models.CharField(max_length=150)
    phone = models.CharField(max_length=20, blank=True, null=True)
    role = models.CharField(max_length=50, choices=ROLE_CHOICES, default='etudiant')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='actif')

    # Student specific
    matricule = models.CharField(max_length=50, blank=True, null=True, unique=True)
    auditoire = models.ForeignKey(Auditoire, on_delete=models.SET_NULL, null=True, blank=True, related_name='students')

    # Staff specific - Utilisation de clés étrangères pour l'intégrité
    section = models.ForeignKey(Section, on_delete=models.SET_NULL, null=True, blank=True, related_name='staff')
    filiere = models.ForeignKey(Filiere, on_delete=models.SET_NULL, null=True, blank=True, related_name='staff')

    # System fields
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    date_joined = models.DateTimeField(default=timezone.now)

    objects = UserManager()

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['first_name', 'last_name']

    def __str__(self):
        return f"{self.first_name} {self.last_name}"

    @property
    def name(self):
        return f"{self.first_name} {self.last_name}"

    def get_full_name(self):
        """Return the full name of the user"""
        return f"{self.first_name} {self.last_name}"
