from rest_framework import serializers

from .models import (AffectationRole, Memoire, Deliberation, DocumentOfficiel, InscriptionAnnuelle, InscriptionUE,
                     ResultatDeliberation, UniteEnseignement)


class UniteEnseignementSerializer(serializers.ModelSerializer):
    filiere_name = serializers.CharField(source='filiere.nom', read_only=True)
    credits = serializers.IntegerField(read_only=True)
    cours = serializers.SerializerMethodField()
    type_label = serializers.CharField(source='get_type_ue_display', read_only=True)
    volume_horaire = serializers.SerializerMethodField()

    def get_volume_horaire(self, obj):
        from apps.grades.models import AcademicConfig
        hpc = AcademicConfig.load().hours_per_credit or 15
        return sum((c.volume_horaire_total or (c.credits or 0) * hpc) for c in obj.current_courses())

    class Meta:
        model = UniteEnseignement
        fields = ['id', 'code', 'intitule', 'filiere', 'filiere_name', 'niveau', 'semestre', 'type_ue',
                  'type_label', 'description', 'is_active', 'credits', 'volume_horaire', 'cours', 'created_at']
        read_only_fields = ['created_at']

    def get_cours(self, obj):
        return [{'id': c.id, 'code': c.code, 'name': c.name, 'credits': c.credits,
                 'volume': c.volume_horaire_total} for c in obj.current_courses()]


class InscriptionUESerializer(serializers.ModelSerializer):
    ue_code = serializers.CharField(source='ue.code', read_only=True)
    ue_intitule = serializers.CharField(source='ue.intitule', read_only=True)
    credits = serializers.IntegerField(source='ue.credits', read_only=True)

    class Meta:
        model = InscriptionUE
        fields = ['id', 'ue', 'ue_code', 'ue_intitule', 'credits', 'is_dette']


class InscriptionAnnuelleSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='student.name', read_only=True)
    matricule = serializers.CharField(source='student.matricule', read_only=True)
    academic_year_name = serializers.CharField(source='academic_year.name', read_only=True)
    auditoire_name = serializers.CharField(source='auditoire.nom', read_only=True)
    filiere_name = serializers.CharField(source='auditoire.filiere.nom', read_only=True)
    statut_label = serializers.CharField(source='get_statut_display', read_only=True)
    type_label = serializers.CharField(source='get_type_inscription_display', read_only=True)
    ues = InscriptionUESerializer(many=True, read_only=True)
    finance = serializers.SerializerMethodField()

    class Meta:
        model = InscriptionAnnuelle
        fields = ['id', 'student', 'student_name', 'matricule', 'academic_year', 'academic_year_name',
                  'auditoire', 'auditoire_name', 'filiere_name', 'niveau', 'type_inscription', 'type_label',
                  'statut', 'statut_label', 'decision_precedente', 'notes', 'created_at',
                  'admin_validated_at', 'peda_validated_at', 'ues', 'finance']
        read_only_fields = ['niveau', 'statut', 'decision_precedente', 'created_at', 'admin_validated_at',
                            'peda_validated_at']

    def get_finance(self, obj):
        if not self.context.get('with_finance'):
            return None
        from .services.finance import admin_fees_settled, clearance
        status = clearance(obj.student, obj)
        return {'paid_percent': float(status['paid_percent']), 'cleared': status['cleared'],
                'admin_fees_settled': admin_fees_settled(obj)}


class AffectationRoleSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source='user.name', read_only=True)
    role_label = serializers.CharField(source='get_role_display', read_only=True)
    filiere_name = serializers.CharField(source='filiere.nom', read_only=True, default=None)
    section_name = serializers.CharField(source='section.nom', read_only=True, default=None)
    is_current = serializers.BooleanField(read_only=True)

    class Meta:
        model = AffectationRole
        fields = ['id', 'user', 'user_name', 'role', 'role_label', 'section', 'section_name', 'filiere',
                  'filiere_name', 'start_date', 'end_date', 'motif', 'is_current', 'created_at']
        read_only_fields = ['created_at']

    def validate(self, attrs):
        start, end = attrs.get('start_date'), attrs.get('end_date')
        if start and end and end < start:
            raise serializers.ValidationError({'end_date': "La fin doit être postérieure au début."})
        role = attrs.get('role') or getattr(self.instance, 'role', None)
        if role == 'chef_departement' and not (attrs.get('filiere') or getattr(self.instance, 'filiere', None)):
            raise serializers.ValidationError({'filiere': "Un chef de filière est affecté à une filière."})
        if role == 'chef_section' and not (attrs.get('section') or getattr(self.instance, 'section', None)):
            raise serializers.ValidationError({'section': "Un chef de section est affecté à une section."})
        return attrs


class ResultatSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='student.name', read_only=True)
    matricule = serializers.CharField(source='student.matricule', read_only=True)
    decision_label = serializers.CharField(source='get_decision_display', read_only=True)
    decision_calculee_label = serializers.CharField(source='get_decision_calculee_display', read_only=True)
    mention_label = serializers.CharField(source='get_mention_display', read_only=True)

    class Meta:
        model = ResultatDeliberation
        fields = ['id', 'deliberation', 'student', 'student_name', 'matricule', 'moyenne', 'credits_obtenus',
                  'credits_total', 'decision', 'decision_label', 'decision_calculee', 'decision_calculee_label',
                  'mention', 'mention_label', 'decision_modifiee', 'justification', 'rang', 'details',
                  'computed_at']
        read_only_fields = fields


class DeliberationSerializer(serializers.ModelSerializer):
    auditoire_name = serializers.CharField(source='auditoire.nom', read_only=True)
    academic_year_name = serializers.CharField(source='academic_year.name', read_only=True, default=None)
    statut_label = serializers.CharField(source='get_statut_display', read_only=True)
    session_label = serializers.CharField(source='get_session_display', read_only=True)
    president_name = serializers.CharField(source='president.name', read_only=True)
    secretaire_name = serializers.CharField(source='secretaire.name', read_only=True)
    membres_names = serializers.SerializerMethodField()
    stats = serializers.SerializerMethodField()
    has_pv = serializers.SerializerMethodField()

    class Meta:
        model = Deliberation
        fields = ['id', 'auditoire', 'auditoire_name', 'academic_year', 'academic_year_name', 'session',
                  'session_label', 'statut', 'statut_label', 'president', 'president_name', 'secretaire',
                  'secretaire_name', 'membres', 'membres_names', 'opened_at', 'closed_at', 'publication_date',
                  'pv_sha256', 'has_pv', 'stats', 'created_at']
        read_only_fields = ['academic_year', 'statut', 'opened_at', 'closed_at', 'publication_date', 'pv_sha256',
                            'created_at']

    def get_membres_names(self, obj):
        return [m.name for m in obj.membres.all()]

    def get_has_pv(self, obj):
        return bool(obj.pv_file)

    def get_stats(self, obj):
        out = {'total': 0}
        for res in obj.resultats.values_list('decision', flat=True):
            out['total'] += 1
            out[res] = out.get(res, 0) + 1
        admis = out.get('admis', 0) + out.get('admis_dette', 0)
        out['taux_reussite'] = round(admis * 100 / out['total'], 1) if out['total'] else None
        return out

    def validate(self, attrs):
        president = attrs.get('president') or getattr(self.instance, 'president', None)
        secretaire = attrs.get('secretaire') or getattr(self.instance, 'secretaire', None)
        if president and secretaire and president == secretaire:
            raise serializers.ValidationError({'secretaire': "Le secrétaire doit être différent du président."})
        if self.instance and self.instance.statut != 'preparation':
            raise serializers.ValidationError("Le jury ne se modifie plus après l'ouverture.")
        auditoire = attrs.get('auditoire')
        session = attrs.get('session', 1)
        if auditoire and session == 2 and not Deliberation.objects.filter(
                auditoire=auditoire, session=1, statut__in=['cloturee', 'publiee']).exists():
            raise serializers.ValidationError({'session': "La 2e session suppose une 1re session clôturée."})
        return attrs


class DocumentOfficielSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='student.name', read_only=True)
    matricule = serializers.CharField(source='student.matricule', read_only=True)
    type_label = serializers.CharField(source='get_type_document_display', read_only=True)
    issued_by_name = serializers.CharField(source='issued_by.name', read_only=True, default=None)

    class Meta:
        model = DocumentOfficiel
        fields = ['id', 'type_document', 'type_label', 'numero', 'verification_code', 'student', 'student_name',
                  'matricule', 'academic_year', 'resultat', 'inscription', 'issued_by_name', 'issued_at',
                  'revoked', 'revoked_reason']
        read_only_fields = fields



class MemoireSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='student.name', read_only=True)
    matricule = serializers.CharField(source='student.matricule', read_only=True)
    directeur_name = serializers.CharField(source='directeur.name', read_only=True)
    encadreur_name = serializers.CharField(source='encadreur.name', read_only=True, default=None)
    president_name = serializers.CharField(source='president_jury.name', read_only=True, default=None)
    membres_names = serializers.SerializerMethodField()
    statut_label = serializers.CharField(source='get_statut_display', read_only=True)
    type_label = serializers.CharField(source='get_type_travail_display', read_only=True)
    mention = serializers.CharField(read_only=True)
    groupe = serializers.CharField(source='inscription.auditoire.nom', read_only=True, default=None)

    class Meta:
        model = Memoire
        fields = ['id', 'student', 'student_name', 'matricule', 'groupe', 'inscription', 'type_travail', 'type_label',
                  'titre', 'resume', 'directeur', 'directeur_name', 'encadreur', 'encadreur_name', 'course',
                  'statut', 'statut_label', 'motif_refus', 'fichier', 'depose_le', 'date_soutenance', 'salle',
                  'president_jury', 'president_name', 'membres_jury', 'membres_names', 'note', 'mention',
                  'observations', 'created_at', 'updated_at']
        read_only_fields = ['statut', 'motif_refus', 'fichier', 'depose_le', 'date_soutenance', 'salle',
                            'president_jury', 'membres_jury', 'note', 'observations', 'inscription',
                            'created_at', 'updated_at']
        extra_kwargs = {'student': {'required': False}}

    def get_membres_names(self, obj):
        return [m.name for m in obj.membres_jury.all()]

    def validate_directeur(self, value):
        if value.role not in ('enseignant', 'chef_section', 'chef_departement'):
            raise serializers.ValidationError("Le directeur doit être un enseignant.")
        return value
