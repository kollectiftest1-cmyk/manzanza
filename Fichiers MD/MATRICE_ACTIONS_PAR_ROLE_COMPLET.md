# 📊 MATRICE COMPLÈTE DES ACTIONS PAR RÔLE
## Application Manzanza - Analyse Complète

---

## 🎯 RÔLES DÉFINIS DANS LE SYSTÈME

| N° | Code Rôle | Nom Rôle | Niveau |
|----|-----------|----------|--------|
| 1 | PDG | PDG (Président) | EXÉCUTIF |
| 2 | DIRECTEUR_GENERAL | DG (Directeur Général) | EXÉCUTIF |
| 3 | SGA | SGA (Secrétaire Général Académique) | ADMINISTRATIF |
| 4 | SGAD | SGAD (Secrétaire Général Admin) | ADMINISTRATIF |
| 5 | CHEF_SECTION | Chef de Section | ACADÉMIQUE |
| 6 | CHEF_DEPARTEMENT | Chef de Département/Filière | ACADÉMIQUE |
| 7 | ENSEIGNANT | Enseignant (Professeur) | ACADÉMIQUE |
| 8 | ASSISTANT | Assistant (Chargé de cours) | ACADÉMIQUE |
| 9 | ETUDIANT | Étudiant | ACADÉMIQUE |
| 10 | BIBLIOTHECAIRE | Bibliothécaire | SUPPORT |
| 11 | CAISSE | Caissier/Comptable | FINANCIER |
| 12 | IADMIN | iAdmin (Administrateur Système) | SYSTÈME |
| + | APPARITORAT | Apparitorat (Agent de discipline) | SUPPORT |
| + | SERVICE_IT | Service IT | SUPPORT |
| + | JURY | Jury (Évaluateur) | SUPPORT |

---

# 📋 MATRICE DÉTAILLÉE DES ACTIONS PAR CATÉGORIE

---

## 1️⃣ ACTIONS DE PARAMÉTRAGE ET CONFIGURATIONS

### 1.1 Configuration Académique - Années Académiques
- **Création d'Année Académique**
  - PDG, DG, SGA, SGAD, iAdmin

### 1.2 Configuration Académique - Sections
- **Création Section**
  - PDG, DG, SGA, SGAD, iAdmin
- **Modification Section**
  - PDG, DG, SGA, SGAD, iAdmin
- **Suppression Section**
  - PDG, DG, SGAD, iAdmin
- **Affectation Chef de Section**
  - PDG, DG, SGA, SGAD, iAdmin

### 1.3 Configuration Académique - Filières/Départements
- **Création Filière**
  - PDG, DG, SGA, SGAD, Chef de Section, iAdmin
- **Modification Filière**
  - PDG, DG, SGA, SGAD, Chef de Section, iAdmin
- **Suppression Filière**
  - PDG, DG, SGAD, iAdmin
- **Affectation Chef de Filière/Département**
  - PDG, DG, SGA, SGAD, Chef de Section, iAdmin

### 1.4 Configuration Académique - Auditoires (Promotions/Cohortes)
- **Création Auditoire (L1, L2, L3, M1, M2)**
  - PDG, DG, SGA, SGAD, Chef de Section, Chef de Département, iAdmin
- **Modification Auditoire**
  - PDG, DG, SGA, SGAD, Chef de Section, Chef de Département, iAdmin
- **Suppression Auditoire**
  - PDG, DG, SGAD, iAdmin
- **Activation/Désactivation Auditoire**
  - PDG, DG, SGA, SGAD, iAdmin

### 1.5 Configuration Financière - Frais Académiques
- **Création Frais/Droits Académiques**
  - PDG, DG, SGAD, iAdmin
- **Modification Montants Frais**
  - PDG, DG, SGAD, iAdmin
- **Suppression Frais**
  - PDG, SGAD, iAdmin
- **Approbation Nouvelle Structure Tarifaire**
  - PDG, DG

### 1.6 Configuration Financière - Paramètres de Paiement
- **Création Modes de Paiement**
  - PDG, DG, SGAD, iAdmin
- **Modification Compte Bancaire**
  - PDG, DG, SGAD, iAdmin
- **Configuration Taux de Change**
  - PDG, DG, SGAD, iAdmin

### 1.7 Configuration Horaire - Calendrier Académique
- **Création Calendrier Académique**
  - PDG, DG, SGA, SGAD, iAdmin
- **Définition Périodes d'Inscription**
  - PDG, DG, SGA, SGAD, iAdmin
- **Définition Périodes d'Examen**
  - PDG, DG, SGA, SGAD, iAdmin
- **Définition Congés/Vacances Académiques**
  - PDG, DG, SGA, iAdmin

### 1.8 Configuration Horaire - Créneaux Horaires
- **Création Créneaux Horaires**
  - PDG, DG, SGA, Chef de Département, iAdmin
- **Modification Créneaux**
  - PDG, DG, SGA, Chef de Département, iAdmin
- **Suppression Créneaux**
  - PDG, DG, SGA, iAdmin

### 1.9 Configuration Académique - Configuration Notations
- **Définition Barème de Notation**
  - PDG, DG, SGA, iAdmin
- **Modification Nombre Maximum de Points**
  - PDG, DG, SGA, iAdmin
- **Définition Note de Passage/Seuil de Réussite**
  - PDG, DG, SGA, iAdmin
- **Configuration Compensation de Notes**
  - PDG, DG, SGA, iAdmin

---

## 2️⃣ GESTION DES COURS

### 2.1 Création et Gestion des Cours
- **Création Cours**
  - SGA, Chef de Département, Enseignant, iAdmin
- **Modification Cours (titre, description, crédits)**
  - SGA, Chef de Département, Enseignant (titulaire), iAdmin
- **Suppression Cours**
  - PDG, DG, SGA, iAdmin
- **Publication Cours**
  - SGA, Chef de Département, Enseignant, iAdmin
- **Archivage Cours**
  - PDG, DG, SGA, iAdmin

### 2.2 Affectation Ressources Pédagogiques
- **Affectation Enseignant Titulaire**
  - SGA, Chef de Département, iAdmin
- **Affectation Assistants**
  - SGA, Chef de Département, Enseignant, iAdmin
- **Affectation Auditoire à un Cours**
  - SGA, Chef de Département, iAdmin
- **Définition Prérequis (Cours antérieurs)**
  - SGA, Chef de Département, Enseignant, iAdmin

### 2.3 Matériel Pédagogique
- **Upload Syllabus/Notes de Cours**
  - Enseignant, Assistant, iAdmin
- **Partage Ressources (PDF, vidéo, documents)**
  - Enseignant, Assistant, iAdmin
- **Modification Ressources Pédagogiques**
  - Enseignant, Assistant, iAdmin
- **Suppression Ressources Pédagogiques**
  - Enseignant (ses ressources), Assistant, iAdmin

### 2.4 Inscription/Enrôlement
- **Inscription Étudiant dans Cours**
  - SGA, Chef de Département, iAdmin
- **Inscription Massive (par Auditoire)**
  - SGA, Chef de Département, iAdmin
- **Désinscription Étudiant**
  - SGA, Chef de Département, iAdmin
- **Consultation Listes d'Étudiants Enrôlés**
  - Enseignant, Assistant, SGA, Chef de Département, iAdmin

---

## 3️⃣ GESTION DES QUIZ ET ÉVALUATIONS

### 3.1 Création et Gestion Quiz
- **Création Quiz**
  - Enseignant, Assistant, iAdmin
- **Publication Quiz**
  - Enseignant, Assistant, iAdmin
- **Modification Quiz**
  - Enseignant (créateur), Assistant, iAdmin
- **Suppression Quiz**
  - Enseignant (créateur), Assistant, iAdmin
- **Clôture/Archivage Quiz**
  - Enseignant, Assistant, iAdmin

### 3.2 Gestion Questions de Quiz
- **Création Questions (QCM, Vrai/Faux, Réponse courte)**
  - Enseignant, Assistant, iAdmin
- **Modification Questions**
  - Enseignant, Assistant, iAdmin
- **Suppression Questions**
  - Enseignant (créateur), Assistant, iAdmin
- **Ajouter Explications aux Réponses**
  - Enseignant, Assistant, iAdmin

### 3.3 Paramètres Quiz
- **Configuration Mélange Questions**
  - Enseignant, Assistant, iAdmin
- **Configuration Mélange Réponses**
  - Enseignant, Assistant, iAdmin
- **Affichage Réponses Correctes**
  - Enseignant, Assistant, iAdmin
- **Configuration Tentatives Multiples**
  - Enseignant, Assistant, iAdmin
- **Configuration Durée de Réponse**
  - Enseignant, Assistant, iAdmin
- **Configuration Points Maximums**
  - Enseignant, Assistant, iAdmin

### 3.4 Participation aux Quiz
- **Consultation Quiz Disponibles**
  - Étudiant
- **Répondre aux Questions**
  - Étudiant
- **Soumettre Quiz**
  - Étudiant
- **Consultation Résultats**
  - Étudiant (ses résultats), Enseignant, iAdmin
- **Consultation Explications Réponses**
  - Étudiant (après fermeture), Enseignant

---

## 4️⃣ GESTION DES TRAVAUX PRATIQUES (TP) ET TRAVAUX DIRIGÉS (TD)

### 4.1 Création et Gestion Assignments
- **Création Assignement (TP/TD)**
  - Enseignant, Assistant, iAdmin
- **Publication Assignement**
  - Enseignant, Assistant, iAdmin
- **Modification Assignement**
  - Enseignant (créateur), Assistant, iAdmin
- **Suppression Assignement**
  - Enseignant (créateur), Assistant, iAdmin
- **Clôture/Fermeture Assignement**
  - Enseignant, Assistant, iAdmin

### 4.2 Gestion Questions et Ressources
- **Création Questions (Cas, Problèmes)**
  - Enseignant, Assistant, iAdmin
- **Modification Questions**
  - Enseignant, Assistant, iAdmin
- **Upload Ressources (Énoncés, Données)**
  - Enseignant, Assistant, iAdmin

### 4.3 Soumissions Étudiants
- **Consultation Travaux à Faire**
  - Étudiant
- **Soumission Travail (Électronique)**
  - Étudiant
- **Modification Soumission (avant deadline)**
  - Étudiant
- **Consultation Statut Soumission**
  - Étudiant, Enseignant

### 4.4 Correction et Notation
- **Consultation Soumissions Reçues**
  - Enseignant, Assistant, iAdmin
- **Correction/Feedback**
  - Enseignant, Assistant, iAdmin
- **Attribution Points/Notes**
  - Enseignant, Assistant, iAdmin
- **Notation Automatique (si configurée)**
  - Système (auto)
- **Publication Résultats**
  - Enseignant, Assistant, iAdmin

---

## 5️⃣ GESTION DES NOTES ET RÉSULTATS

### 5.1 Saisie des Grades
- **Création/Saisie Notes (Quiz, Partiel, Final)**
  - Enseignant, Assistant, iAdmin
- **Modification Notes**
  - Enseignant (auteur), iAdmin
- **Suppression Notes**
  - Enseignant (auteur), iAdmin
- **Correction Notes (si erreur)**
  - Enseignant, iAdmin

### 5.2 Consultation des Résultats
- **Consultation Ses Propres Résultats**
  - Étudiant
- **Consultation Résultats d'une Classe**
  - Enseignant, Assistant, Chef de Département, iAdmin
- **Consultation Résultats par Cours**
  - Enseignant, Chef de Département, iAdmin
- **Consultation Résultats par Auditoire**
  - Chef de Département, SGA, iAdmin
- **Consultation Tous les Résultats**
  - SGA, iAdmin

### 5.3 Catégories et Pondérations de Notes
- **Configuration Catégories de Notes (Interro, Partiel, Final, Participation)**
  - SGA, iAdmin
- **Définition Pondérations par Catégorie**
  - SGA, Chef de Département, iAdmin
- **Modification Pondérations**
  - SGA, iAdmin
- **Suppression Catégories**
  - SGA, iAdmin

### 5.4 Génération de Relevés
- **Génération Relevés de Notes**
  - SGA, Chef de Département, iAdmin
- **Génération Relevés par Étudiant**
  - SGA, iAdmin
- **Génération Relevés par Cours**
  - SGA, iAdmin
- **Génération Relevés par Auditoire**
  - SGA, Chef de Département, iAdmin
- **Export Relevés (PDF, Excel)**
  - SGA, Chef de Département, iAdmin

### 5.5 Sessions d'Examen
- **Création Session d'Examen**
  - SGA, Chef de Département, iAdmin
- **Planification Date et Heure**
  - SGA, Chef de Département, iAdmin
- **Modification Session d'Examen**
  - SGA, Chef de Département, iAdmin
- **Archivage Session**
  - SGA, iAdmin

---

## 6️⃣ GESTION DES EMPLOIS DU TEMPS

### 6.1 Planification de l'Horaire
- **Création Emploi du Temps (Global)**
  - SGA, Chef de Département, iAdmin
- **Création Créneaux de Cours**
  - SGA, Chef de Département, iAdmin
- **Affectation Cours à Créneaux**
  - SGA, Chef de Département, iAdmin
- **Affectation Salles de Classe**
  - SGA, Chef de Département, iAdmin
- **Affectation Enseignants à Créneaux**
  - SGA, Chef de Département, iAdmin

### 6.2 Gestion Conflits d'Horaire
- **Détection Conflits (même enseignant/salle)**
  - Système (auto)
- **Résolution Conflits**
  - SGA, Chef de Département, iAdmin
- **Modification Créneaux pour Éviter Conflits**
  - SGA, Chef de Département, iAdmin

### 6.3 Publication et Consultation
- **Publication Emploi du Temps**
  - SGA, Chef de Département, iAdmin
- **Consultation Emploi du Temps (Ensemble)**
  - Tous authentifiés
- **Consultation Emploi Personnel**
  - Enseignant (ses cours), Étudiant (ses cours), iAdmin
- **Notification Changements d'Horaire**
  - Système (auto)

### 6.4 Changements et Modifications
- **Modification Créneaux (Horaire/Salle)**
  - SGA, Chef de Département, iAdmin
- **Annulation Cours**
  - SGA, Chef de Département, Enseignant, iAdmin
- **Reportage de Cours**
  - SGA, Chef de Département, Enseignant, iAdmin
- **Notification Changements aux Intéressés**
  - Système (auto)

---

## 7️⃣ GESTION DES PAIEMENTS ET FINANCES

### 7.1 Frais Académiques
- **Définition Frais par Niveau (L1, L2, L3, M1, M2)**
  - PDG, DG, SGAD, iAdmin
- **Modification Montants Frais**
  - SGAD, iAdmin
- **Ajout Frais Supplémentaires (Labo, Sport, etc.)**
  - SGAD, iAdmin
- **Approbation Structure Tarifaire**
  - PDG, DG

### 7.2 Facturation Étudiants
- **Génération Factures Automatiques**
  - Système (auto), SGAD
- **Création Factures Manuelles**
  - SGAD, Caisse, iAdmin
- **Modification Factures (avant paiement)**
  - SGAD, Caisse, iAdmin
- **Envoi Factures aux Étudiants**
  - Système (auto)
- **Consultation Factures**
  - Étudiant (sienne), SGAD, Caisse, iAdmin

### 7.3 Enregistrement Paiements
- **Enregistrement Paiement (Cash/Chèque/Virement)**
  - Caisse, SGAD, iAdmin
- **Confirmation Paiement Reçu**
  - Caisse, SGAD, iAdmin
- **Génération Reçus de Paiement**
  - Caisse, SGAD, iAdmin
- **Modification Paiement (correction d'erreur)**
  - SGAD, iAdmin
- **Consultation Historique Paiements**
  - Étudiant (ses paiements), Caisse, SGAD, iAdmin

### 7.4 Remboursements
- **Demande Remboursement (Étudiant)**
  - Étudiant
- **Approbation Remboursement**
  - SGAD, DG, iAdmin
- **Traitement Remboursement**
  - Caisse, SGAD, iAdmin
- **Suivi Remboursement**
  - Étudiant, Caisse, SGAD, iAdmin

### 7.5 Rapports Financiers
- **Rapport Paiements Journaliers**
  - Caisse, SGAD, DG, iAdmin
- **Rapport Paiements par Étudiant**
  - SGAD, Caisse, iAdmin
- **Rapport Paiements par Niveau**
  - SGAD, SGA, DG, iAdmin
- **Rapport Impayés**
  - SGAD, DG, iAdmin
- **Rapport Récettes**
  - SGAD, DG, PDG, iAdmin
- **Export Rapports Financiers**
  - SGAD, DG, iAdmin

### 7.6 Gestion Arriérés de Paiement
- **Identification Étudiants Débiteurs**
  - SGAD, SGA, iAdmin
- **Envoi Rappels de Paiement**
  - Système (auto), SGAD
- **Blocage Inscription (si débiteur)**
  - Système (auto), SGA
- **Déblocage Après Paiement**
  - SGAD, SGA, iAdmin

---

## 8️⃣ GESTION DES RESSOURCES HUMAINES

### 8.1 Gestion Enseignants et Assistants
- **Recrutement Enseignant**
  - PDG, DG, iAdmin
- **Création Dossier Enseignant**
  - DG, SGAD, iAdmin
- **Modification Données Enseignant**
  - DG, SGAD, Enseignant (ses données), iAdmin
- **Affectation Cours**
  - SGA, Chef de Département, iAdmin
- **Consultation Statut Enseignant**
  - DG, SGAD, Chef de Département, iAdmin

### 8.2 Gestion Contrats
- **Création Contrat**
  - DG, SGAD, iAdmin
- **Types de Contrats (CDI, CDD, Vacation)**
  - DG, SGAD, iAdmin
- **Modification Contrat**
  - DG, SGAD, iAdmin
- **Renouvellement Contrat**
  - DG, SGAD, iAdmin
- **Résiliation Contrat**
  - PDG, DG, iAdmin
- **Consultation Contrats**
  - DG, SGAD, Enseignant (son contrat), iAdmin

### 8.3 Gestion Paie
- **Création Bulletin de Paie**
  - SGAD, iAdmin
- **Calcul Salaires**
  - Système (auto)
- **Déduction Cotisations Sociales**
  - Système (auto)
- **Génération Bulletin Paie**
  - SGAD, iAdmin
- **Distribution Paie**
  - SGAD, iAdmin
- **Consultation Bulletins (Personnel)**
  - Enseignant (son bulletin), iAdmin
- **Rapport Masse Salariale**
  - DG, SGAD, iAdmin

### 8.4 Gestion Congés et Absences
- **Demande Congé (Étudiant)**
  - Étudiant
- **Demande Permission (Enseignant)**
  - Enseignant
- **Approbation Congé Étudiant**
  - SGA, Chef de Département, iAdmin
- **Approbation Permission Enseignant**
  - DG, Chef de Département, iAdmin
- **Suivi Absences Étudiants**
  - Enseignant, Assistant
- **Suivi Absences Enseignants**
  - DG, Chef de Département, iAdmin

### 8.5 Évaluation du Personnel
- **Saisie Évaluation Enseignant**
  - Chef de Département, DG, iAdmin
- **Consultation Évaluation (Personnel)**
  - Enseignant (son évaluation), iAdmin
- **Génération Rapport Évaluation**
  - DG, SGAD, iAdmin

---

## 9️⃣ GESTION DES UTILISATEURS

### 9.1 Création et Gestion Comptes
- **Création Compte Utilisateur**
  - PDG, DG, SGA, SGAD, iAdmin
- **Assignation Rôle**
  - PDG, DG, SGAD, iAdmin
- **Modification Rôle**
  - PDG, DG, SGAD, iAdmin
- **Désactivation Compte**
  - PDG, DG, SGAD, iAdmin
- **Réactivation Compte**
  - PDG, DG, SGAD, iAdmin
- **Suppression Compte**
  - PDG, iAdmin

### 9.2 Authentification et Accès
- **Connexion au Système**
  - Tous authentifiés
- **Déconnexion**
  - Tous authentifiés
- **Changement Mot de Passe**
  - Tous authentifiés
- **Réinitialisation Mot de Passe (Oubli)**
  - Utilisateur (soi-même), Administrateur
- **Consultation Historique Connexions**
  - Utilisateur (soi-même), iAdmin

### 9.3 Permissions et Accès
- **Assignation Permissions Personnalisées**
  - PDG, iAdmin
- **Modification Permissions**
  - PDG, iAdmin
- **Suppression Permissions**
  - PDG, iAdmin
- **Restriction d'Accès à Zones**
  - PDG, iAdmin

### 9.4 Profils Utilisateurs
- **Modification Profil Personnel**
  - Tous authentifiés
- **Upload Avatar**
  - Tous authentifiés
- **Modification Données Personnelles**
  - Tous authentifiés
- **Consultation Profil Autres**
  - Authentifiés (données limitées)

---

## 🔟 GESTION DES PRÉ-INSCRIPTIONS

### 10.1 Inscription Nouveaux Étudiants
- **Ouverture Période Pré-inscription**
  - SGA, SGAD, iAdmin
- **Consultation Offres de Formation**
  - Public (non authentifiés)
- **Soumission Dossier Pré-inscription**
  - Candidat externe
- **Upload Pièces Justificatives**
  - Candidat
- **Suivi Dossier**
  - Candidat, SGA, iAdmin

### 10.2 Traitement Dossiers
- **Réception Dossier**
  - Système (auto), SGA
- **Vérification Complétude**
  - SGA, iAdmin
- **Saisie Informations dans Système**
  - SGA, iAdmin
- **Notification Candidat**
  - Système (auto)

### 10.3 Sélection et Validation
- **Examen Dossier**
  - SGA, Chef de Département, iAdmin
- **Approbation Admission**
  - SGA, Chef de Département, PDG, iAdmin
- **Notification d'Admission**
  - Système (auto), SGA
- **Génération Lettre Admission**
  - SGA, iAdmin

### 10.4 Inscription Définitive
- **Confirmation Inscription**
  - Candidat admis
- **Assignation Matricule Étudiant**
  - Système (auto), SGA
- **Assignation Auditoire**
  - SGA, Chef de Département, iAdmin
- **Création Compte Étudiant**
  - Système (auto), SGA

---

## 1️⃣1️⃣ GESTION DE LA BIBLIOTHÈQUE

### 11.1 Gestion des Collections
- **Ajout Nouveau Livre**
  - Bibliothécaire, iAdmin
- **Modification Informations Livre**
  - Bibliothécaire, iAdmin
- **Suppression (Soft Delete) Livre**
  - Bibliothécaire, iAdmin
- **Marquage Livre Perdu**
  - Bibliothécaire, iAdmin
- **Restitution Livre Endommagé**
  - Bibliothécaire, iAdmin

### 11.2 Consultation du Catalogue
- **Consultation Catalogue Complet**
  - Tous authentifiés
- **Recherche Livre par Titre**
  - Tous authentifiés
- **Recherche Livre par Auteur**
  - Tous authentifiés
- **Recherche Livre par Catégorie**
  - Tous authentifiés
- **Consultation Disponibilité**
  - Tous authentifiés

### 11.3 Emprunts
- **Demande Emprunt**
  - Étudiant, Enseignant
- **Approbation Emprunt**
  - Bibliothécaire, iAdmin
- **Enregistrement Emprunt**
  - Bibliothécaire, iAdmin
- **Définition Durée Emprunt**
  - Bibliothécaire (configurable), iAdmin
- **Rappel Restitution**
  - Système (auto)
- **Extension Délai**
  - Bibliothécaire, Étudiant (demande), iAdmin

### 11.4 Restitutions
- **Restitution Livre (À l'heure)**
  - Étudiant, Enseignant
- **Enregistrement Restitution**
  - Bibliothécaire, iAdmin
- **Sanctions Retard**
  - Bibliothécaire, iAdmin
- **Notification Pénalité**
  - Système (auto)

### 11.5 Réservations
- **Demande Réservation**
  - Étudiant, Enseignant
- **Approbation Réservation**
  - Bibliothécaire, iAdmin
- **Notification Disponibilité**
  - Système (auto)
- **Annulation Réservation**
  - Étudiant (sa réservation), Bibliothécaire, iAdmin

---

## 1️⃣2️⃣ COMMUNICATION ET NOTIFICATIONS

### 12.1 Annonces et Notifications
- **Création Annonce Institutionnelle**
  - PDG, DG, SGA, iAdmin
- **Création Annonce Académique**
  - SGA, Chef de Département, Chef de Section, iAdmin
- **Création Annonce Cours**
  - Enseignant, Assistant, iAdmin
- **Publication Annonce**
  - Auteur (créateur), SGA, iAdmin
- **Modification Annonce**
  - Auteur, iAdmin
- **Archivage Annonce**
  - Auteur, iAdmin

### 12.2 Système de Chat et Messagerie
- **Création Canal de Chat**
  - SGA, Enseignant, Chef de Département, iAdmin
- **Accès Canal de Chat**
  - Membres du canal
- **Envoi Message**
  - Membres du canal
- **Réaction à Message**
  - Membres du canal
- **Suppression Message (propre)**
  - Auteur, iAdmin
- **Suppression Message (autre)**
  - iAdmin uniquement

### 12.3 Notifications Système
- **Notification Inscription**
  - Système (auto) → Étudiant
- **Notification Résultats**
  - Système (auto) → Étudiant
- **Notification Paiement Reçu**
  - Système (auto) → Étudiant
- **Notification Rappel Deadline**
  - Système (auto) → Étudiants
- **Notification Changement Horaire**
  - Système (auto) → Intéressés

---

## 1️⃣3️⃣ GESTION ADMINISTRATIVE GÉNÉRALE

### 13.1 Rapports et Statistiques
- **Génération Rapport Académique**
  - SGA, Chef de Département, iAdmin
- **Rapport d'Effectifs**
  - SGA, Chef de Département, iAdmin
- **Rapport Réussite/Échec**
  - SGA, Chef de Département, iAdmin
- **Tableau de Bord Administrateur**
  - PDG, DG, SGA, SGAD, iAdmin
- **Tableau de Bord Chef de Département**
  - Chef de Département, SGA
- **Tableau de Bord Enseignant**
  - Enseignant, Assistant
- **Tableau de Bord Étudiant**
  - Étudiant

### 13.2 Sauvegardes et Audit
- **Consultation Logs d'Audit**
  - iAdmin
- **Consultation Historique Modifications**
  - iAdmin
- **Consultation Trace Paiements**
  - SGAD, Caisse, iAdmin
- **Génération Rapport Audit**
  - iAdmin, DG, PDG

### 13.3 Configuration du Système
- **Configuration Paramètres Généraux**
  - iAdmin
- **Configuration Logo/Branding**
  - iAdmin, SGAD
- **Configuration Thème**
  - iAdmin
- **Configuration Langue**
  - Utilisateur (pour soi-même)

---

## 1️⃣4️⃣ GESTION DE LA DISCIPLINE ET ATTENDANCE

### 14.1 Suivi des Absences (Étudiants)
- **Enregistrement Absence Étudiant**
  - Enseignant, Assistant, iAdmin
- **Modification Absence**
  - Enseignant (auteur), iAdmin
- **Consultation Absences**
  - Étudiant (ses absences), Enseignant, Chef de Département, iAdmin
- **Génération Rapport Absences**
  - Chef de Département, SGA, iAdmin
- **Sanction Absences Répétées**
  - Chef de Département, Apparitorat, iAdmin

### 14.2 Discipline et Conduites
- **Signalement Cas Disciplinaire**
  - Enseignant, Apparitorat, Chef de Département
- **Investigation Cas**
  - Apparitorat, Chef de Département, DG
- **Approbation Sanction**
  - Chef de Département, DG, PDG
- **Application Sanction**
  - Apparitorat, SGAD, iAdmin
- **Consultation Dossier Discipline (Personnel)**
  - Étudiant (son dossier), iAdmin

---

## 1️⃣5️⃣ GESTION DES THÈSES ET MÉMOIRES (JURY)

### 15.1 Suivi Mémoires de Fin d'Études
- **Enregistrement Mémoire**
  - Étudiant, SGA, iAdmin
- **Assignation Directeur de Mémoire**
  - Chef de Département, SGA, iAdmin
- **Modification Sujet Mémoire**
  - Étudiant (en accord), Directeur, iAdmin
- **Consultation État Mémoire**
  - Étudiant, Directeur, Jury, iAdmin

### 15.2 Gestion Jury de Défense
- **Constitution Jury de Défense**
  - Chef de Département, SGA, iAdmin
- **Assignation Membres Jury**
  - Chef de Département, SGA, iAdmin
- **Planification Date Défense**
  - Chef de Département, SGA, iAdmin
- **Modification Date Défense**
  - Chef de Département, SGA, iAdmin

### 15.3 Soutenance et Évaluation
- **Consultation Mémoire (Jury)**
  - Jury, Directeur, iAdmin
- **Enregistrement Présentation Soutenance**
  - Jury
- **Attribution Notes (Jury)**
  - Jury, iAdmin
- **Génération PV de Soutenance**
  - Jury, SGA, iAdmin

---

## 📊 MATRICE DE SYNTHÈSE PAR RÔLE

### PDG (Président)
**Permissions:** TOTALES (Niveau 5)
- ✅ Toutes les actions de paramétrage
- ✅ Approbation stratégique
- ✅ Gestion complète RH
- ✅ Accès à tous les rapports
- ✅ Audit et discipline

---

### DG (Directeur Général)
**Permissions:** COMPLÈTES (Niveau 4)
- ✅ Paramétrage académique et financier
- ✅ Gestion RH et contrats
- ✅ Approbation admissions et sanctions
- ✅ Rapports financiers et académiques
- ✅ Accès administratif complet

---

### SGA (Secrétaire Général Académique)
**Permissions:** ACADÉMIQUES + ADMIN (Niveau 3A)
- ✅ Gestion académique complète
- ✅ Création cours, auditoires, sections
- ✅ Gestion emplois du temps
- ✅ Admissions et inscriptions
- ✅ Rapports académiques
- ❌ Gestion financière limitée
- ❌ Gestion RH restreinte

---

### SGAD (Secrétaire Général Admin)
**Permissions:** ADMINISTRATIVE + FINANCIÈRE (Niveau 3B)
- ✅ Gestion financière complète
- ✅ Gestion paiements et frais
- ✅ Gestion RH basique
- ✅ Gestion utilisateurs
- ✅ Configuration système
- ❌ Décisions académiques

---

### Chef de Section
**Permissions:** ACADÉMIQUE SECTION (Niveau 2A)
- ✅ Gestion sections et filières
- ✅ Courses sous sa section
- ✅ Auditoires de sa section
- ✅ Emploi du temps sa section
- ✅ Rapports sections
- ❌ Gestion financière
- ❌ Gestion RH

---

### Chef de Département/Filière
**Permissions:** ACADÉMIQUE DÉPARTEMENT (Niveau 2B)
- ✅ Gestion courses son département
- ✅ Affectation enseignants
- ✅ Notation et résultats
- ✅ Emploi du temps
- ✅ Admissions filière
- ✅ Rapports département
- ❌ Gestion financière
- ❌ Gestion RH sauf permissions

---

### Enseignant
**Permissions:** PÉDAGOGIQUE + COURS (Niveau 1A)
- ✅ Création cours (avec SGA)
- ✅ Gestion ressources pédagogiques
- ✅ Création Quiz et Assignments
- ✅ Saisie notes
- ✅ Communication étudiants
- ✅ Suivi absences
- ❌ Gestion financière
- ❌ Gestion administrative générale

---

### Assistant
**Permissions:** PÉDAGOGIQUE SUPPORT (Niveau 1B)
- ✅ Support enseignant (même cours)
- ✅ Création ressources
- ✅ Saisie notes (assistance)
- ✅ Communication étudiants
- ✅ Suivi absences
- ❌ Création course autonome
- ❌ Gestion administrative

---

### Étudiant
**Permissions:** ACADÉMIQUE RESTREINTE (Niveau 0A)
- ✅ Consultation courses
- ✅ Réponse Quiz/Assignments
- ✅ Consultation résultats personnels
- ✅ Demande congé
- ✅ Consultation emprunts bibli
- ✅ Communication
- ❌ Modification données
- ❌ Accès autre étudiant

---

### Bibliothécaire
**Permissions:** GESTION BIBLIOTHÈQUE (Niveau S1)
- ✅ Gestion collection complète
- ✅ Gestion emprunts/restitutions
- ✅ Gestion réservations
- ✅ Rapports emprunts
- ❌ Gestion académique
- ❌ Gestion financière

---

### Caisse
**Permissions:** GESTION PAIEMENTS (Niveau S2)
- ✅ Enregistrement paiements
- ✅ Génération reçus
- ✅ Consultation paiements
- ✅ Rapports journaliers
- ❌ Modification frais
- ❌ Remboursements (sauf exécution)

---

### iAdmin (Admin Système)
**Permissions:** SYSTÈME COMPLÈTE (Niveau T)
- ✅ TOUTES les actions (except approbation stratégique)
- ✅ Gestion users et permissions
- ✅ Configuration système
- ✅ Logs et audit
- ✅ Sauvegardes

---

### Apparitorat
**Permissions:** DISCIPLINE + SUPPORT (Niveau S3)
- ✅ Enregistrement absences
- ✅ Signalement discipline
- ✅ Application sanctions
- ✓ Suivi effectifs
- ❌ Décisions administratives

---

### Service IT
**Permissions:** SUPPORT TECHNIQUE (Niveau S4)
- ✅ Maintenance système
- ✅ Support technique users
- ✓ Gestion incidents
- ❌ Accès données sensibles

---

### Jury
**Permissions:** ÉVALUATION MÉMOIRES (Niveau S5)
- ✅ Consultation mémoires
- ✅ Évaluation soutenance
- ✅ Attribution notes défense
- ✓ Génération PV
- ❌ Gestion administrative

---

## 📈 TABLEAU RÉCAPITULATIF

| Action | PDG | DG | SGA | SGAD | Chef Sec | Chef Dept | Ens | Ass | Etud | Bibli | Caisse | iAdmin |
|--------|-----|----|----|------|----------|-----------|-----|-----|------|-------|--------|--------|
| **Année Académique** | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| **Section** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| **Filière** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| **Auditoire** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| **Création Cours** | ✅ | ✅ | ✅ | ❌ | ❌ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ |
| **Quiz** | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ | R | ❌ | ❌ | ✅ |
| **TP/TD** | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ | S | ❌ | ❌ | ✅ |
| **Saisie Notes** | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ |
| **Paiement** | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | S | ❌ | ✅ | ✅ |
| **Frais** | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| **Contrats** | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| **Paie** | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| **Gestion Users** | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| **Emprunts Bibli** | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ | ❌ | ✅ |
| **Annonces** | ✅ | ✅ | ✅ | ❌ | ❌ | ✅ | ✅ | ❌ | R | ❌ | ❌ | ✅ |

**Légende:**
- ✅ = Permission complète (C, R, U, D)
- ✓ = Permission limitée (lecture seulement ou cas spécifiques)
- R = Lecture seule (Read)
- S = Soumission (création de demandes)
- ❌ = Pas de permission

---

## 🎯 RÉSUMÉ HIÉRARCHIE D'ACCÈS

```
1. PDG/DG
   └─ Accès à TOUT (sauf données confidentielles)
   
2. SGA/SGAD/iAdmin
   ├─ SGA: Académique complet
   ├─ SGAD: Financier + RH
   └─ iAdmin: Système complet
   
3. Chef Section/Chef Département
   └─ Académique limité (leur zone)
   
4. Enseignant/Assistant
   └─ Pédagogique (ses cours)
   
5. Support Specialisé
   ├─ Bibliothécaire: Bibliothèque
   ├─ Caisse: Paiements
   ├─ Apparitorat: Discipline
   └─ Jury: Évaluation
   
6. Étudiant
   └─ Ses données académiques uniquement
```

---

**Document créé:** 2026-05-31  
**Application:** Manzanza - Système de Gestion Universitaire  
**Version:** 1.0 Complète
