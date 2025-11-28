"""
Auditoire models
"""
from django.db import models
from django.conf import settings

class Section(models.Model):
    """
    Section Model (e.g., 'Sciences Informatiques', 'Sciences Économiques')
    """
    nom = models.CharField(max_length=100, unique=True, verbose_name='Nom de la Section')
    chef_section = models.OneToOneField(
        settings.AUTH_USER_MODEL, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True, 
        related_name='managed_section'
    )

    class Meta:
        verbose_name = 'Section'
        verbose_name_plural = 'Sections'
        ordering = ['nom']

    def __str__(self):
        return self.nom

class Filiere(models.Model):
    """
    Filiere (Option) Model (e.g., 'Génie Logiciel', 'Techniques de Maintenance')
    """
    nom = models.CharField(max_length=100, verbose_name='Nom de la Filière/Option')
    section = models.ForeignKey(Section, on_delete=models.CASCADE, related_name='filieres', verbose_name='Section')
    chef_filiere = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='managed_filiere'
    )

    class Meta:
        verbose_name = 'Filière'
        verbose_name_plural = 'Filières'
        ordering = ['section', 'nom']
        unique_together = ['nom', 'section']

    def __str__(self):
        return f"{self.nom} ({self.section.nom})"

class Auditoire(models.Model):
    """Auditoire (Virtual Classroom) Model"""

    NIVEAU_CHOICES = [
        ('L1', 'Licence 1'), ('L2', 'Licence 2'), ('L3', 'Licence 3'),
        ('M1', 'Master 1'), ('M2', 'Master 2'),
    ]
    VACATION_CHOICES = [
        ('jour', 'Jour'), ('soir', 'Soir'),
    ]

    nom = models.CharField(max_length=200, verbose_name='Nom de l\'auditoire')
    niveau = models.CharField(max_length=10, choices=NIVEAU_CHOICES, verbose_name='Niveau')
    # Filiere is now non-nullable. An auditoire MUST have a filiere.
    filiere = models.ForeignKey(Filiere, on_delete=models.CASCADE, verbose_name='Filière')
    vacation = models.CharField(
        max_length=10, 
        choices=VACATION_CHOICES, 
        default='jour', 
        verbose_name='Vacation',
        blank=True  # Allows the admin to not require it, as it has a default.
    )
    description = models.TextField(blank=True, null=True, verbose_name='Description')

    # Metadata
    annee_academique = models.CharField(max_length=20, default='2024-2025', verbose_name='Année académique')
    capacite_max = models.IntegerField(default=50, verbose_name='Capacité maximale')
    is_active = models.BooleanField(default=True, verbose_name='Actif')

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
                                   null=True, related_name='auditoires_created')

    class Meta:
        verbose_name = 'Auditoire'
        verbose_name_plural = 'Auditoires'
        ordering = ['niveau', 'filiere', 'vacation', 'nom']
        unique_together = ['filiere', 'niveau', 'vacation', 'annee_academique']

    def __str__(self):
        return f"{self.nom} ({self.get_niveau_display()} - {self.get_vacation_display()})"

    @property
    def etudiants_count(self):
        """Count of students in this auditoire"""
        return self.students.filter(status='actif').count()

    @property
    def cours_count(self):
        """Count of courses for this auditoire"""
        return self.courses.filter(is_active=True).count()
