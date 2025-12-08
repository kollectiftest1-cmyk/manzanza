"""
Teacher-Assistant relationship models
"""
from django.db import models
from django.conf import settings
from django.core.exceptions import ValidationError


class TeacherAssistant(models.Model):
    """
    Relation entre un enseignant et un assistant.
    Un assistant peut être attaché à un enseignant pour un cours spécifique.
    """
    assistant = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='teacher_assignments',
        verbose_name='Assistant',
        limit_choices_to={'role': 'assistant'}
    )
    teacher = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='assigned_assistants',
        verbose_name='Enseignant',
        limit_choices_to={'role__in': ['enseignant', 'chef_section', 'chef_departement']}
    )
    course = models.ForeignKey(
        'Course',
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        verbose_name='Cours',
        help_text='Cours pour lequel l\'assistant aide l\'enseignant (optionnel si aide générale)'
    )

    # Permissions de l'assistant
    can_edit_materials = models.BooleanField(
        default=True,
        verbose_name='Peut éditer les matériels',
        help_text='Peut ajouter/modifier des documents de cours'
    )
    can_grade = models.BooleanField(
        default=False,
        verbose_name='Peut noter',
        help_text='Peut attribuer des notes aux étudiants'
    )
    can_take_attendance = models.BooleanField(
        default=True,
        verbose_name='Peut pointer les présences',
        help_text='Peut enregistrer les présences des étudiants'
    )
    can_manage_assignments = models.BooleanField(
        default=True,
        verbose_name='Peut gérer les devoirs',
        help_text='Peut créer et corriger les devoirs'
    )

    # Metadata
    assigned_date = models.DateTimeField(auto_now_add=True, verbose_name='Date d\'assignation')
    is_active = models.BooleanField(default=True, verbose_name='Actif')
    notes = models.TextField(blank=True, null=True, verbose_name='Notes')

    class Meta:
        verbose_name = 'Assistant d\'enseignant'
        verbose_name_plural = 'Assistants d\'enseignants'
        unique_together = ['assistant', 'teacher', 'course']
        ordering = ['-assigned_date']

    def __str__(self):
        course_info = f" - {self.course.name}" if self.course else " (tous les cours)"
        return f"{self.assistant.get_full_name()} assiste {self.teacher.get_full_name()}{course_info}"

    def clean(self):
        """Validation personnalisée"""
        # Vérifier que l'assistant n'est pas le même que l'enseignant
        if self.assistant == self.teacher:
            raise ValidationError("Un enseignant ne peut pas être son propre assistant.")

        # Vérifier que l'assistant a bien le rôle 'assistant'
        if self.assistant.role != 'assistant':
            raise ValidationError(
                f"{self.assistant.get_full_name()} doit avoir le rôle 'assistant' (rôle actuel: {self.assistant.get_role_display()})"
            )

        # Vérifier que l'enseignant a bien un rôle approprié
        if self.teacher.role not in ['enseignant', 'chef_section', 'chef_departement']:
            raise ValidationError(
                f"{self.teacher.get_full_name()} doit avoir le rôle 'enseignant', 'chef_section' ou 'chef_departement'"
            )

        # Si un cours est spécifié, vérifier que l'enseignant est le titulaire
        if self.course and self.course.titulaire != self.teacher:
            raise ValidationError(
                f"{self.teacher.get_full_name()} n'est pas le titulaire du cours {self.course.name}"
            )

    @property
    def permissions_summary(self):
        """Résumé des permissions de l'assistant"""
        perms = []
        if self.can_edit_materials:
            perms.append('Éditer matériels')
        if self.can_grade:
            perms.append('Noter')
        if self.can_take_attendance:
            perms.append('Présences')
        if self.can_manage_assignments:
            perms.append('Devoirs')
        return ', '.join(perms) if perms else 'Aucune permission'
