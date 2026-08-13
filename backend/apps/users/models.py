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
        ('chef_departement', 'Chef de Département'),  # Représente le chef de filière
        ('enseignant', 'Enseignant'),
        ('assistant', 'Assistant'),
        ('apparitorat', 'Apparitorat'),
        ('etudiant', 'Étudiant'),
        ('bibliothecaire', 'Bibliothécaire'),
        ('caisse', 'Caissier / Comptable'),
        ('service_it', 'Service IT'),
        ('jury', 'Jury Memoire/Defense'),
        ('iadmin', 'iAdmin'),
    ]

    STATUS_CHOICES = [('actif', 'Actif'), ('inactif', 'Inactif'), ('suspendu', 'Suspendu')]

    SEXE_CHOICES = [('M', 'Masculin'), ('F', 'Féminin')]

    email = models.EmailField(unique=True)
    first_name = models.CharField(max_length=150)
    last_name = models.CharField(max_length=150)
    post_nom = models.CharField(max_length=150, blank=True, null=True)  # Post-nom (middle name)
    phone = models.CharField(max_length=20, blank=True, null=True)
    sexe = models.CharField(max_length=1, choices=SEXE_CHOICES, blank=True, null=True)
    date_naissance = models.DateField(blank=True, null=True)
    adresse = models.TextField(blank=True, null=True)
    role = models.CharField(max_length=50, choices=ROLE_CHOICES, default='etudiant')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='actif')

    # Student specific
    matricule = models.CharField(max_length=50, blank=True, null=True, unique=True)
    auditoire = models.ForeignKey(Auditoire, on_delete=models.SET_NULL, null=True, blank=True, related_name='students')

    def save(self, *args, **kwargs):
        # Detect auditoire change for students
        is_student = self.role == 'etudiant'
        old_auditoire = None
        if self.pk:
            old = type(self).objects.get(pk=self.pk)
            old_auditoire = old.auditoire
        super().save(*args, **kwargs)
        # If student and auditoire changed, enroll in all courses of new auditoire
        if is_student and self.auditoire and self.auditoire != old_auditoire:
            from apps.courses.models import Course, CourseEnrollment
            for course in Course.objects.filter(auditoire=self.auditoire):
                CourseEnrollment.objects.get_or_create(student=self, course=course)
    # Staff specific - Utilisation de clés étrangères pour l'intégrité
    section = models.ForeignKey(Section, on_delete=models.SET_NULL, null=True, blank=True, related_name='staff')
    filiere = models.ForeignKey(Filiere, on_delete=models.SET_NULL, null=True, blank=True, related_name='staff')

    # Avatar
    avatar = models.ImageField(upload_to='avatars/', null=True, blank=True)

    # System fields
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    date_joined = models.DateTimeField(default=timezone.now)

    objects = UserManager()

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['first_name', 'last_name']

    def __str__(self):
        parts = [self.first_name, self.post_nom, self.last_name]
        return ' '.join(p for p in parts if p)

    @property
    def name(self):
        parts = [self.first_name, self.post_nom, self.last_name]
        return ' '.join(p for p in parts if p)

    def get_avatar_url(self):
        """Return the URL of the user's avatar"""
        if self.avatar:
            return self.avatar.url
        return None

    def get_full_name(self):
        """Return the full name of the user"""
        return f"{self.first_name} {self.last_name}"
