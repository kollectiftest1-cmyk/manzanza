"""
Utility functions for auditoires management
"""
from .models import Auditoire


def generate_auditoire_name(niveau, filiere, vacation):
    """
    Generates a human-readable name for an auditoire based on its attributes.

    Example:
        generate_auditoire_name('L1', filiere_obj, 'soir')
        => "L1 Génie Logiciel Soir"

    Args:
        niveau (str): Niveau (L1, L2, L3, M1, M2)
        filiere (Filiere): Filiere object
        vacation (str): Vacation (jour, soir)

    Returns:
        str: Generated auditoire name
    """
    # Get niveau display name
    niveau_display = dict(Auditoire.NIVEAU_CHOICES).get(niveau, niveau)

    # Get vacation display name
    vacation_display = dict(Auditoire.VACATION_CHOICES).get(vacation, vacation)

    # Get filiere name
    filiere_name = filiere.nom if filiere else "Sans filière"

    # Construct the name: "L1 Génie Logiciel Soir"
    # Or if niveau is already verbose: "Licence 1 Génie Logiciel Soir"
    # We'll use the short version (L1, L2, etc.) for brevity
    name = f"{niveau} {filiere_name} {vacation_display.capitalize()}"

    return name


def find_or_create_auditoire(filiere, niveau, vacation, annee_academique=None, created_by=None):
    """
    Finds an existing auditoire matching the criteria, or creates a new one if it doesn't exist.

    Args:
        filiere (Filiere): Filiere object
        niveau (str): Niveau (L1, L2, L3, M1, M2)
        vacation (str): Vacation (jour, soir)
        annee_academique (str): Academic year (default: current from settings)
        created_by (User): User who creates the auditoire

    Returns:
        tuple: (auditoire, created) where created is a boolean
    """
    if not annee_academique:
        annee_academique = '2024-2025'  # Default, could be dynamic

    # Try to find existing auditoire
    try:
        auditoire = Auditoire.objects.get(
            filiere=filiere,
            niveau=niveau,
            vacation=vacation,
            annee_academique=annee_academique
        )
        return auditoire, False
    except Auditoire.DoesNotExist:
        # Create new auditoire
        nom = generate_auditoire_name(niveau, filiere, vacation)
        auditoire = Auditoire.objects.create(
            nom=nom,
            filiere=filiere,
            niveau=niveau,
            vacation=vacation,
            annee_academique=annee_academique,
            created_by=created_by,
            is_active=True
        )
        return auditoire, True
    except Auditoire.MultipleObjectsReturned:
        # If there are duplicates, return the first one
        # This shouldn't happen with unique_together, but just in case
        auditoire = Auditoire.objects.filter(
            filiere=filiere,
            niveau=niveau,
            vacation=vacation,
            annee_academique=annee_academique
        ).first()
        return auditoire, False
