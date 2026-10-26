"""
Gestionnaire d'exceptions DRF : toute erreur renvoie un message clair, en français,
compréhensible par un utilisateur non technicien.

Chaque réponse d'erreur garde sa forme habituelle (champ → messages) pour les formulaires,
et reçoit en plus une clé ``message`` : un texte prêt à afficher, où chaque champ est
désigné par son libellé (« Date de fin : … ») et non par son nom technique (end_date).
"""
import logging
import re

from rest_framework.fields import ChoiceField

from django.core.exceptions import PermissionDenied as DjangoPermissionDenied
from django.core.exceptions import ValidationError as DjangoValidationError
from django.db import IntegrityError
from django.db.models import ProtectedError, RestrictedError
from django.http import Http404
from django.utils.text import capfirst
from rest_framework import exceptions, status
from rest_framework.response import Response
from rest_framework.views import exception_handler as drf_exception_handler, set_rollback

from .trash import TrashError

log = logging.getLogger('mazanza.errors')

# Libellés français des champs dont le modèle n'a pas de verbose_name explicite.
FIELD_LABELS = {
    'conflicts': "Conflit d'horaire", 'startTime': "Heure de début", 'endTime': "Heure de fin", 'requested_by': "Demandeur",
    'academic_year': "Année académique", 'action': "Action", 'added_by': "Ajouté par", 'address': "Adresse",
    'adresse': "Adresse", 'amount': "Montant", 'annee': "Année", 'annee_academique': "Année académique",
    'assignment': "Travail", 'assistant': "Assistant", 'assistants': "Assistants", 'audience': "Public",
    'auditoire': "Groupe (auditoire)", 'availability_type': "Type de disponibilité", 'average': "Moyenne",
    'base_monthly_salary': "Salaire mensuel", 'building': "Bâtiment", 'capacity': "Capacité",
    'capacite_max': "Capacité maximale", 'category': "Catégorie", 'check_in': "Heure d'arrivée",
    'check_out': "Heure de départ", 'code': "Code", 'color': "Couleur", 'comment': "Commentaire",
    'contract_type': "Type de contrat", 'course': "Cours", 'courses': "Cours", 'created_by': "Créé par",
    'credits': "Crédits", 'currency': "Devise", 'date': "Date", 'date_naissance': "Date de naissance",
    'date_soutenance': "Date de soutenance", 'day_of_week': "Jour", 'deductions': "Retenues",
    'department': "Département", 'dependents': "Personnes à charge", 'description': "Description",
    'directeur': "Directeur", 'due_date': "Échéance", 'email': "Adresse e-mail", 'employee': "Employé",
    'employee_id': "Matricule employé", 'encadreur': "Encadreur", 'end_courses_date': "Fin des cours",
    'end_date': "Date de fin", 'end_time': "Heure de fin", 'equipment': "Équipement",
    'event_type': "Type d'événement", 'exam_end_date': "Fin des examens", 'exam_session': "Session d'examen",
    'exam_start_date': "Début des examens", 'fee_type': "Type de frais", 'feedback': "Appréciation",
    'fichier': "Fichier", 'file': "Fichier", 'filiere': "Filière", 'first_name': "Prénom", 'grade': "Note",
    'hire_date': "Date d'embauche", 'hours_per_week': "Heures par semaine", 'intitule': "Intitulé",
    'is_active': "Actif", 'is_current': "Année en cours", 'is_mandatory': "Obligatoire", 'label': "Libellé",
    'last_name': "Nom", 'leave_type': "Type de congé", 'libelle': "Libellé", 'location': "Lieu",
    'matricule': "Matricule", 'max_value': "Note maximale", 'membres': "Membres du jury",
    'membres_jury': "Membres du jury", 'message': "Message", 'mois': "Mois", 'motif': "Motif", 'name': "Nom",
    'new_password': "Nouveau mot de passe", 'niveau': "Niveau", 'nom': "Nom", 'note': "Note", 'notes': "Notes",
    'old_password': "Mot de passe actuel", 'order': "Ordre", 'password': "Mot de passe",
    'payment_method': "Mode de paiement", 'phone': "Téléphone", 'position': "Poste", 'post_nom': "Post-nom",
    'prestation_type': "Type de prestation", 'president': "Président du jury", 'president_jury': "Président du jury",
    'priority': "Priorité", 'purpose': "Objet", 'question': "Question", 'quiz': "Quiz", 'rattrapage_end_date':
    "Fin du rattrapage", 'rattrapage_start_date': "Début du rattrapage", 'reason': "Motif",
    'resume': "Résumé", 'role': "Rôle", 'room': "Salle", 'room_type': "Type de salle", 'salaire_horaire':
    "Taux horaire", 'salle': "Salle", 'score': "Score", 'secretaire': "Secrétaire du jury", 'section': "Section",
    'semester': "Semestre", 'semestre': "Semestre", 'session': "Session", 'session_number': "Numéro de l'épreuve",
    'sexe': "Sexe", 'start_date': "Date de début", 'start_time': "Heure de début", 'status': "Statut",
    'statut': "Statut", 'student': "Étudiant", 'teacher': "Enseignant", 'term': "Semestre / trimestre",
    'timeslot': "Créneau", 'title': "Titre", 'titre': "Titre", 'titulaire': "Titulaire",
    'type_inscription': "Type d'inscription", 'type_travail': "Type de travail", 'type_ue': "Type d'UE",
    'ue': "Unité d'enseignement", 'user': "Utilisateur", 'vacation': "Vacation", 'value': "Note",
    'weight': "Pondération", 'year': "Année", 'volume_cm': "Volume CM", 'volume_td': "Volume TD",
    'volume_tp': "Volume TP", 'opening_float': "Fonds de caisse", 'counted': "Montant compté",
    'justification': "Justification", 'mobile_money_number': "Numéro Mobile Money",
}
GENERIC_KEYS = {'non_field_errors', 'detail', '__all__'}

HTTP_MESSAGES = {
    401: "Votre session a expiré. Reconnectez-vous pour continuer.",
    403: "Vous n'avez pas l'autorisation d'effectuer cette action avec votre rôle.",
    404: "Élément introuvable : il a peut-être été supprimé (consultez la corbeille).",
    405: "Cette action n'est pas possible sur cet élément.",
    413: "Le fichier envoyé est trop volumineux.",
    415: "Format de fichier ou de données non accepté.",
    429: "Trop de tentatives en peu de temps. Patientez une minute puis réessayez.",
}


def _serializer_fields(context):
    view = context.get('view') if context else None
    if view is None:
        return {}
    try:
        cls = view.get_serializer_class()
        return cls(context={'request': context.get('request'), 'view': view}).fields
    except Exception:  # noqa: BLE001 — l'introspection ne doit jamais masquer l'erreur d'origine
        return {}


def field_label(name, fields=None):
    f = (fields or {}).get(name)
    label = str(getattr(f, 'label', '') or '')
    if label and label.lower() != name.replace('_', ' ').lower():
        return label
    return FIELD_LABELS.get(name, capfirst(name.replace('_', ' ')))


def _mentions(line, label):
    """Le message cite-t-il déjà le champ (« La date de fin (…) ») ? Alors pas de préfixe « Date de fin : »."""
    return len(label) > 3 and re.search(r'\b' + re.escape(label.lower()) + r'\b', line.lower()) is not None


def _flatten(data, fields, prefix=''):
    """Transforme {champ: [messages]} (éventuellement imbriqué) en lignes lisibles."""
    lines = []
    if isinstance(data, (list, tuple)):
        for i, item in enumerate(data):
            if isinstance(item, (dict, list)):
                lines += _flatten(item, fields, f"{prefix}ligne {i + 1} — " if isinstance(item, dict) else prefix)
            elif str(item):
                lines.append(f"{prefix}{item}")
        return lines
    if isinstance(data, dict):
        for key, value in data.items():
            if key in GENERIC_KEYS:
                lines += _flatten(value, fields, prefix)
            else:
                sub = (fields or {}).get(key)
                child = getattr(getattr(sub, 'child', None), 'fields', None) or getattr(sub, 'fields', None) or {}
                label = field_label(key, fields)
                inner = _flatten(value, child, '')
                # Uniquement les listes fixes : sur une relation, « .choices » interrogerait la base.
                choices = sub.choices if isinstance(sub, ChoiceField) else None
                if choices and len(choices) <= 15:
                    opts = ', '.join(f"« {v} »" for v in choices.values())
                    inner = [f"{x} Choix possibles : {opts}." if "choix valide" in x else x for x in inner]
                lines += [f"{prefix}{line}" if _mentions(line, label) else f"{prefix}{label} : {line}"
                          for line in inner]
        return lines
    return [f"{prefix}{data}"] if str(data) else []


_UNIQUE = re.compile(r"Un objet (?P<model>.+?) avec ce champ (?P<field>\w+) existe déjà\.")
_UNIQUE_SET = re.compile(r"Les champs (?P<fields>[\w, ]+) doivent former un ensemble unique\.")


def _humanize(line, fields):
    """Reformule les messages d'unicité de Django avec les libellés des champs."""
    line = _UNIQUE.sub(lambda m: f"cette valeur est déjà utilisée par un(e) autre {m['model'].lower()}. "
                                 "Choisissez une autre valeur (vérifiez aussi la corbeille).", line)
    line = _UNIQUE_SET.sub(lambda m: "cette combinaison existe déjà ("
                           + ", ".join(field_label(f.strip(), fields) for f in m['fields'].split(',')) + ").", line)
    line = line.replace('\xa0', ' ')
    for raw, clear in _PLAIN.items():
        line = line.replace(raw, clear)
    return line


# Messages DRF par défaut reformulés pour un utilisateur non technicien.
_PLAIN = {
    "Ce champ ne peut être nul.": "Ce champ est obligatoire.",
    "Ce champ ne peut être vide.": "Ce champ est obligatoire.",
    "Ce champ ne peut pas être vide.": "Ce champ est obligatoire.",
    "Cette liste ne peut pas être vide.": "Sélectionnez au moins un élément.",
    "Un nombre valide est requis.": "Saisissez un nombre (ex. 12 ou 12.5).",
    "Un nombre entier valide est requis.": "Saisissez un nombre entier (ex. 3).",
    "La date n'a pas le bon format. Utilisez un des formats suivants : YYYY-MM-DD.":
        "Choisissez une date valide dans le calendrier (jour/mois/année).",
    "L'heure n'a pas le bon format. Utilisez un des formats suivants : hh:mm[:ss[.uuuuuu]].":
        "Saisissez une heure valide au format HH:MM (ex. 08:30).",
    "Saisissez une adresse e-mail valide.": "Adresse e-mail invalide (exemple : nom@domaine.cd).",
    "Saisissez une adresse email valide.": "Adresse e-mail invalide (exemple : nom@domaine.cd).",
}


def readable(data, fields=None):
    try:
        return _readable(data, fields)
    except Exception:  # le message d'erreur ne doit jamais provoquer lui-même une erreur 500
        log.exception("Mise en forme du message d'erreur impossible")
        try:
            return _readable(data, None)
        except Exception:
            return "Certaines informations sont invalides. Vérifiez le formulaire."


def _readable(data, fields=None):
    lines = []
    for line in (_humanize(x, fields) for x in _flatten(data, fields)):
        if line not in lines:
            lines.append(line)
    return '\n'.join(lines)


def _django_validation_data(exc):
    if hasattr(exc, 'message_dict'):
        return {k if k != '__all__' else 'non_field_errors': v for k, v in exc.message_dict.items()}
    return {'non_field_errors': exc.messages}


def exception_handler(exc, context):
    if isinstance(exc, TrashError):
        set_rollback()
        return Response({'detail': str(exc), 'message': str(exc)}, status=status.HTTP_409_CONFLICT)

    if isinstance(exc, DjangoValidationError):
        set_rollback()
        data = _django_validation_data(exc)
        data['message'] = readable(data, _serializer_fields(context))
        return Response(data, status=status.HTTP_400_BAD_REQUEST)

    if isinstance(exc, (ProtectedError, RestrictedError)):
        set_rollback()
        objs = list(getattr(exc, 'protected_objects', None) or getattr(exc, 'restricted_objects', None) or [])
        kinds = sorted({str(o._meta.verbose_name_plural) for o in objs})
        sample = ', '.join(str(o) for o in objs[:3])
        msg = ("Suppression impossible : cet élément est encore utilisé"
               + (f" par {len(objs)} élément(s) ({', '.join(kinds)})" if objs else '')
               + (f", par exemple : {sample}" if sample else '')
               + ". Retirez ou réaffectez d'abord ces éléments.")
        return Response({'detail': msg, 'message': msg}, status=status.HTTP_409_CONFLICT)

    if isinstance(exc, IntegrityError):
        set_rollback()
        msg = ("Cet enregistrement existe déjà (doublon). Vérifiez qu'un élément identique n'existe pas "
               "déjà, y compris dans la corbeille : restaurez-le plutôt que d'en créer un nouveau.")
        return Response({'detail': msg, 'message': msg}, status=status.HTTP_409_CONFLICT)

    if isinstance(exc, Http404):
        exc = exceptions.NotFound()
    elif isinstance(exc, DjangoPermissionDenied):
        exc = exceptions.PermissionDenied()

    response = drf_exception_handler(exc, context)
    if response is None:
        # Erreur inattendue : on la journalise et on répond proprement (jamais de page HTML 500).
        set_rollback()
        req = context.get('request') if context else None
        log.exception("Erreur interne sur %s %s", getattr(req, 'method', ''), getattr(req, 'path', ''))
        msg = ("Erreur interne du serveur : l'opération n'a pas été enregistrée. Réessayez ; si le problème "
               "persiste, signalez-le au service informatique (menu Assistance IT) en indiquant l'heure et l'écran.")
        return Response({'detail': msg, 'message': msg}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    data = response.data
    if isinstance(exc, exceptions.ValidationError):
        msg = readable(data, _serializer_fields(context)) or "Certaines informations sont invalides."
    elif isinstance(data, dict) and data.get('detail'):
        detail = str(data['detail'])
        # Messages techniques par défaut remplacés par une explication claire
        if isinstance(exc, exceptions.NotAuthenticated) or isinstance(exc, exceptions.AuthenticationFailed):
            msg = HTTP_MESSAGES[401]
        elif isinstance(exc, exceptions.PermissionDenied) and detail in (
                str(exceptions.PermissionDenied.default_detail),):
            msg = HTTP_MESSAGES[403]
        elif isinstance(exc, exceptions.NotFound) and detail == str(exceptions.NotFound.default_detail):
            msg = HTTP_MESSAGES[404]
        elif isinstance(exc, exceptions.Throttled):
            wait = getattr(exc, 'wait', None)
            msg = (f"Trop de tentatives. Réessayez dans {int(wait) + 1} secondes." if wait else HTTP_MESSAGES[429])
        else:
            msg = detail
    elif isinstance(data, dict) and data.get('error'):
        msg = str(data['error'])
    else:
        msg = HTTP_MESSAGES.get(response.status_code, "L'opération n'a pas abouti.")
    if isinstance(data, dict):
        data['message'] = msg
    else:
        response.data = {'detail': data, 'message': msg}
    return response
