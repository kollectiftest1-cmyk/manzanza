"""
User models for Université MAZANZA — système de gestion universitaire
"""
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.db import models
from django.utils import timezone
from apps.auditoires.models import Auditoire, Section, Filiere
from apps.core.softdelete import AllObjectsManager, SoftDeleteModel, SoftDeleteQuerySet


class UserManager(BaseUserManager.from_queryset(SoftDeleteQuerySet)):
    """Gestionnaire d'utilisateurs : les comptes placés dans la corbeille sont invisibles
    (et ne peuvent donc plus se connecter)."""

    def get_queryset(self):
        return super().get_queryset().filter(deleted_at__isnull=True)

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
        extra_fields.setdefault('role', 'pdg')
        return self.create_user(email, password, **extra_fields)

class User(SoftDeleteModel, AbstractBaseUser, PermissionsMixin):
    """Custom User Model"""

    # Le PDG est l'administrateur suprême de la plateforme (l'ancien rôle « iAdmin » lui est fusionné).
    ROLE_CHOICES = [
        ('pdg', 'PDG (administrateur général)'),
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
        ('caisse', 'Caissier'),
        ('comptable', 'Comptable'),
        ('service_it', 'Service IT'),
        ('jury', 'Jury Memoire/Defense'),
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
            old = type(self).all_objects.filter(pk=self.pk).first()
            old_auditoire = old.auditoire if old else None
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
    all_objects = AllObjectsManager()

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['first_name', 'last_name']

    def trash_guard(self):
        from apps.core.trash import TrashProtectedError
        if self.is_superuser:
            raise TrashProtectedError("Un compte super-administrateur ne peut pas être supprimé.")

    def after_trash(self):
        # Un compte dans la corbeille ne peut plus se connecter.
        type(self).all_objects.filter(pk=self.pk).update(is_active=False, status='inactif')

    def after_restore(self):
        type(self).all_objects.filter(pk=self.pk).update(is_active=True, status='actif')

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
