"""
Purge définitive des éléments de la corbeille dont la durée de conservation est écoulée.

À planifier une fois par jour :
  * Linux (cron)       : 15 2 * * *  cd /chemin/backend && python manage.py purge_trash
  * Windows (Planificateur de tâches) : python manage.py purge_trash
"""
from django.core.management.base import BaseCommand

from apps.core.models import InstitutionSettings
from apps.core.trash import purge_expired


class Command(BaseCommand):
    help = "Supprime définitivement les éléments de la corbeille plus anciens que la durée de conservation."

    def add_arguments(self, parser):
        parser.add_argument('--dry-run', action='store_true', help="Affiche ce qui serait purgé sans rien supprimer.")

    def handle(self, *args, **options):
        retention = InstitutionSettings.load().trash_retention_days
        purged = purge_expired(dry_run=options['dry_run'])
        verb = 'serait purgé' if options['dry_run'] else 'purgé'
        for label in purged:
            self.stdout.write(f"  - {label} : {verb}")
        self.stdout.write(self.style.SUCCESS(
            f"{len(purged)} élément(s) {verb}(s) — conservation configurée : {retention} jours."
        ))
