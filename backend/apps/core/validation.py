"""
Règles de cohérence réutilisables, avec des messages qui citent les valeurs saisies :
« La date de fin (31/08/2027) ne peut pas être avant la date de début (01/09/2028). »

Usage dans un serializer :

    def validate(self, attrs):
        check(self, attrs, order=[('start_date', 'end_date')], within_year=('academic_year', ...))
        return attrs
"""
from datetime import date, datetime, time

from django.utils import timezone
from rest_framework import serializers

# Désignation de chaque champ dans une phrase (avec l'article).
PHRASES = {
    'start_date': "la date de début", 'end_date': "la date de fin", 'hire_date': "la date d'embauche",
    'start_time': "l'heure de début", 'end_time': "l'heure de fin", 'check_in': "l'heure d'arrivée",
    'check_out': "l'heure de départ", 'end_courses_date': "la fin des cours", 'exam_start_date': "le début des examens",
    'exam_end_date': "la fin des examens", 'rattrapage_start_date': "le début du rattrapage",
    'rattrapage_end_date': "la fin du rattrapage", 'publish_date': "la date de publication",
    'expire_date': "la date d'expiration", 'borrow_date': "la date d'emprunt", 'due_date': "la date de retour prévue",
    'issue_date': "la date d'émission", 'expiry_date': "la date d'expiration",
    'module_start_date': "la date de début du module", 'module_end_date': "la date de fin du module",
    'return_date': "la date de retour", 'date': "la date", 'start_at': "l'ouverture", 'end_at': "la fermeture",
    'start_datetime': "l'ouverture", 'end_datetime': "la fermeture", 'scheduled_date': "la date prévue",
}


_labels = {}


def phrase(name):
    return _labels.get(name) or PHRASES.get(name, name.replace('_', ' '))


def cap(s):
    return s[:1].upper() + s[1:]


def fmt(v):
    if isinstance(v, datetime):
        return timezone.localtime(v).strftime('%d/%m/%Y %H:%M') if timezone.is_aware(v) else v.strftime('%d/%m/%Y %H:%M')
    if isinstance(v, date):
        return v.strftime('%d/%m/%Y')
    if isinstance(v, time):
        return v.strftime('%H:%M')
    return str(v)


def value(serializer, attrs, name):
    if name in attrs:
        return attrs[name]
    inst = getattr(serializer, 'instance', None)
    return getattr(inst, name, None) if inst is not None and not isinstance(inst, (list, tuple)) else None


def check(serializer, attrs, order=(), strict=(), not_future=(), not_past=(), within=None, labels=None):
    """
    order      : [(avant, après)] — « après » ne peut pas être antérieur à « avant » (égalité permise) ;
    strict     : [(avant, après)] — « après » doit être STRICTEMENT postérieur (heures) ;
    not_future : champs qui ne peuvent pas être dans le futur (ex. une séance d'appel) ;
    not_past   : champs qui ne peuvent pas être dans le passé (seulement à la création) ;
    within     : (borne_debut, borne_fin, nom_lisible, [champs]) — les champs doivent rester dans la période.
    labels     : {champ: « la date limite »} pour nommer un champ autrement que PHRASES.
    Toutes les incohérences sont signalées en une fois.
    """
    _labels.clear()
    _labels.update(labels or {})
    errors = {}

    def add(field, msg):
        errors.setdefault(field, []).append(msg)

    for a, b in order:
        va, vb = value(serializer, attrs, a), value(serializer, attrs, b)
        if va is not None and vb is not None and vb < va:
            add(b, f"{cap(phrase(b))} ({fmt(vb)}) ne peut pas être avant {phrase(a)} ({fmt(va)}).")
    for a, b in strict:
        va, vb = value(serializer, attrs, a), value(serializer, attrs, b)
        if va is not None and vb is not None and vb <= va:
            add(b, f"{cap(phrase(b))} ({fmt(vb)}) doit être après {phrase(a)} ({fmt(va)}).")
    today = timezone.localdate()
    for f in not_future:
        v = value(serializer, attrs, f)
        d = v.date() if isinstance(v, datetime) else v
        if isinstance(d, date) and d > today:
            add(f, f"{cap(phrase(f))} ({fmt(v)}) ne peut pas être dans le futur (nous sommes le {fmt(today)}).")
    if getattr(serializer, 'instance', None) is None:
        now = timezone.now()
        for f in not_past:
            v = attrs.get(f)
            past = (v < now) if isinstance(v, datetime) else (isinstance(v, date) and v < today)
            if v is not None and past:
                add(f, f"{cap(phrase(f))} ({fmt(v)}) est déjà passée : choisissez une date à venir.")
    if within:
        lo, hi, label, fields = within
        for f in fields:
            v = value(serializer, attrs, f)
            if v is None or f in errors:  # une seule remarque par champ, la plus utile
                continue
            if lo is not None and v < lo:
                add(f, f"{cap(phrase(f))} ({fmt(v)}) est avant le début de {label} ({fmt(lo)}).")
            elif hi is not None and v > hi:
                add(f, f"{cap(phrase(f))} ({fmt(v)}) est après la fin de {label} ({fmt(hi)}).")
    if errors:
        raise serializers.ValidationError(errors)
