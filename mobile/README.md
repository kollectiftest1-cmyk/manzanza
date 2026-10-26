# Manzanza Mobile

Application Expo SDK 54 en JavaScript/JSX, réservée aux rôles `etudiant` et `enseignant`.

## Démarrage

1. Copiez `.env.example` en `.env` et définissez l'URL de l'API Django. Sur appareil réel, utilisez l'IP LAN du poste qui lance Django, et non `localhost`.
2. Installez les dépendances : `npm install`.
3. Démarrez Expo : `npm start`.

L'application conserve les jetons dans le stockage sécurisé, rafraîchit automatiquement la session et refuse explicitement les autres rôles.

## Fonctionnalités

- Cours, détails et supports ; ajout/suppression de supports pour l'enseignant.
- TP/TD : création, modification, publication, clôture, questions, remise avec pièces jointes, correction et auto-correction.
- Quiz : création, modification, publication, clôture, questions, sauvegarde, soumission, tentatives et notation.
- Notes et relevés, horaires, calendrier, présences, auditoires et disponibilités enseignant.
- Messagerie, réactions, notifications, annonces et bibliothèque.
- Frais, Mobile Money, bons et reçus pour l'étudiant.
- Profil, avatar, mot de passe et reprise de session.

Les dates de gestion utilisent le format ISO (`2026-09-15T10:00:00Z`) ou `AAAA-MM-JJ` selon le champ.

## Guide d’utilisation

La marche à suivre de chaque opération étudiante et enseignante est détaillée dans [GUIDE_OPERATIONS_MOBILE.md](GUIDE_OPERATIONS_MOBILE.md). Le guide indique aussi les contrôles à effectuer lorsque le backend est inaccessible ou refuse une action.
