# Guide des opérations mobiles Manzanza

Ce guide couvre les rôles `etudiant` et `enseignant`. Pour chaque opération, attendez le message de confirmation avant de toucher une seconde fois le bouton. En cas d’erreur, gardez l’écran ouvert, vérifiez les champs signalés et utilisez **Réessayer** avant de recommencer toute la saisie.

## Connexion au backend

1. Dans `mobile/.env`, définissez `EXPO_PUBLIC_API_URL=http://ADRESSE_IP_DU_PC:8000/api`.
2. Lancez Django sur le réseau avec `python manage.py runserver 0.0.0.0:8000`.
3. Placez le téléphone et l’ordinateur sur le même réseau Wi-Fi et autorisez le port `8000` dans le pare-feu.
4. Redémarrez Expo après toute modification du fichier `.env`.
5. Depuis le téléphone, ouvrez `http://ADRESSE_IP_DU_PC:8000/api/` dans un navigateur. Si la page ne répond pas, corrigez d’abord le réseau ou le pare-feu.

Sur un émulateur Android, l’hôte local est généralement `10.0.2.2`. Sur un téléphone physique, n’utilisez jamais `localhost`, car il désigne le téléphone lui-même.

## Opérations communes

| Opération | Marche à suivre | Résultat attendu |
|---|---|---|
| Se connecter | Ouvrir l’application → saisir l’e-mail et le mot de passe → **Se connecter**. | Le tableau de bord du rôle étudiant ou enseignant apparaît. |
| Actualiser un écran | Faire glisser la liste vers le bas ou toucher **Réessayer** après une erreur. | Les données les plus récentes du backend remplacent les données affichées. |
| Consulter un cours | **Cours** → choisir le cours → lire les informations et les supports. | La fiche du cours et ses ressources apparaissent. |
| Télécharger ou ouvrir un support | **Cours** → cours concerné → support → ouvrir le lien ou le fichier. | Le lecteur compatible du téléphone s’ouvre. |
| Consulter le planning | **Services** → **Planning** → faire défiler les séances et événements. | L’horaire associé au compte connecté apparaît. |
| Consulter les notes | **Services** → **Notes et relevés** → choisir le cours ou le relevé. | Les résultats autorisés sont affichés ; une note non publiée ne doit pas apparaître à l’étudiant. |
| Ouvrir la messagerie | **Services** → **Messagerie** → choisir un canal. | L’historique du canal est chargé. |
| Envoyer un message | Ouvrir un canal → saisir le texte → **Envoyer**. | Le message apparaît une seule fois dans le fil. |
| Réagir à un message | Ouvrir le canal → choisir le message → sélectionner la réaction. | La réaction est associée au message. |
| Créer un canal | **Messagerie** → **Nouveau canal** → nom et participants → enregistrer. | Le canal apparaît pour les participants autorisés. |
| Supprimer son message | Ouvrir le message envoyé → **Supprimer** → confirmer. | Le message disparaît ou porte le statut supprimé. |
| Lire une notification | **Services** → **Notifications** → toucher la notification. | La notification passe à l’état lu. |
| Tout marquer comme lu | **Notifications** → **Tout lire** → confirmer. | Le compteur de non-lues revient à zéro. |
| Effacer les notifications | **Notifications** → **Tout effacer** → confirmer. | La liste personnelle est vidée sans supprimer les annonces institutionnelles. |
| Rechercher un livre | **Services** → **Bibliothèque** → saisir le titre ou l’auteur → rechercher. | Les livres correspondant au filtre apparaissent. |
| Emprunter un livre | Ouvrir le livre disponible → **Emprunter** → confirmer. | L’emprunt apparaît dans **Mes emprunts**. |
| Réserver un livre | Ouvrir un livre indisponible → **Réserver** → confirmer. | La réservation est enregistrée pour le compte connecté. |
| Signaler un retour | **Bibliothèque** → **Mes emprunts** → livre → **Retourner**. | Le prêt passe au statut retourné selon les règles de la bibliothèque. |
| Modifier le profil | **Services** → **Profil** → **Modifier le profil** → enregistrer. | Les nouvelles informations apparaissent après actualisation. |
| Changer la photo | **Profil** → **Changer la photo** → autoriser l’accès → choisir l’image. | Le nouvel avatar apparaît sur la fiche. |
| Changer le mot de passe | **Profil** → **Changer le mot de passe** → ancien et nouveau mots de passe → confirmer. | La confirmation s’affiche ; la prochaine connexion utilise le nouveau mot de passe. |
| Se déconnecter | **Profil** → **Se déconnecter** → confirmer. | Les jetons locaux sont supprimés et l’écran de connexion apparaît. |

## Opérations de l’étudiant

| Opération | Marche à suivre | Contrôle final |
|---|---|---|
| Voir les travaux | Onglet **Travaux** → filtrer ou parcourir → ouvrir le TP/TD. | Vérifier le cours, l’échéance, le barème et le type de réponse. |
| Soumettre un TP/TD | **Travaux** → travail → répondre à chaque question → joindre les fichiers demandés → **Soumettre**. | Le statut de la remise et sa date sont visibles. |
| Modifier une remise | Ouvrir le travail avant l’échéance → modifier les réponses ou pièces → soumettre à nouveau. | La dernière version et l’heure de mise à jour sont affichées. |
| Consulter une correction | Ouvrir le travail remis → consulter la note, le détail et le feedback. | Le total correspond au barème publié. |
| Commencer un quiz | **Services** → **Quiz** → quiz disponible → **Commencer**. | Une tentative active est créée ; vérifier le temps restant. |
| Sauvegarder un quiz | Répondre aux questions → **Sauvegarder** avant de quitter l’écran. | Les réponses restent présentes en revenant dans la tentative. |
| Soumettre un quiz | Relire toutes les réponses → **Soumettre** → confirmer. | La tentative passe à l’état terminé et ne doit pas être envoyée deux fois. |
| Consulter ses tentatives | **Quiz** → quiz concerné → **Mes tentatives**. | Les dates, statuts et résultats publiés apparaissent. |
| Consulter ses présences | **Services** → **Planning** ou **Notes et relevés** → section présences. | Les séances et statuts personnels apparaissent. |
| Consulter ses frais | **Services** → **Paiements** → **Mes frais**. | Les montants dus, payés et restants correspondent à l’année active. |
| Payer par Mobile Money | **Paiements** → frais concerné → **Mobile Money** → numéro, opérateur et montant → confirmer. | Une référence de transaction ou un statut en attente apparaît. Ne relancez pas avant vérification. |
| Créer un bon de paiement | **Paiements** → **Créer un bon** → choisir le frais et le mode → enregistrer. | Le bon apparaît dans la liste avec sa référence. |
| Consulter un reçu | **Paiements** → **Reçus** → ouvrir le reçu correspondant. | La référence, le montant et la date correspondent au paiement validé. |

## Opérations de l’enseignant

| Opération | Marche à suivre | Contrôle final |
|---|---|---|
| Ajouter un support | **Cours** → cours → **Ajouter un support** → titre, type, fichier ou URL → enregistrer. | Le support apparaît dans le cours et s’ouvre correctement. |
| Supprimer un support | **Cours** → cours → support → **Supprimer** → confirmer. | Le support disparaît après actualisation. |
| Créer un TP/TD | Onglet **TP/TD** → **Nouveau** → cours, type, consignes, barème et échéance → enregistrer. | Le travail est créé en brouillon avec le bon cours. |
| Modifier un TP/TD | Ouvrir le travail non clôturé → **Modifier** → enregistrer. | Les nouvelles consignes et dates sont visibles. |
| Ajouter une question de TP/TD | Ouvrir le travail → **Ajouter une question** → type, énoncé et points → enregistrer. | La somme des points reste cohérente avec le barème. |
| Publier un TP/TD | Ouvrir le brouillon → vérifier questions et échéance → **Publier** → confirmer. | Le travail devient visible aux étudiants concernés. |
| Clôturer un TP/TD | Ouvrir le travail publié → **Clôturer** → confirmer. | Aucune nouvelle remise ne doit être acceptée. |
| Supprimer un TP/TD | Ouvrir le brouillon sans remise utile → **Supprimer** → confirmer. | Le travail disparaît ; si des remises existent, privilégier la clôture. |
| Corriger une remise | TP/TD → travail → **Soumissions** → étudiant → saisir points et feedback → enregistrer. | La note respecte le maximum et la correction est liée à la bonne copie. |
| Lancer l’auto-correction | Ouvrir une soumission compatible → **Auto-corriger** → contrôler le résultat → enregistrer. | Les réponses automatiques sont notées ; les réponses libres restent à vérifier. |
| Créer un quiz | **Services** → **Quiz** → **Nouveau** → cours, durée, dates, barème et options → enregistrer. | Le quiz est créé en brouillon. |
| Modifier un quiz | Ouvrir le quiz non clôturé → **Modifier** → enregistrer. | Les paramètres modifiés apparaissent sur la fiche. |
| Ajouter une question de quiz | Quiz → **Ajouter une question** → type, énoncé, choix, bonne réponse et points → enregistrer. | La question apparaît et le barème total reste cohérent. |
| Publier un quiz | Vérifier questions, dates et durée → **Publier** → confirmer. | Le quiz devient disponible pendant la période définie. |
| Clôturer un quiz | Ouvrir le quiz → **Clôturer** → confirmer. | Les nouvelles tentatives sont refusées. |
| Supprimer un quiz | Ouvrir un brouillon sans tentative → **Supprimer** → confirmer. | Le quiz disparaît ; avec des tentatives, utilisez la clôture. |
| Consulter les tentatives | Quiz → **Tentatives** → choisir l’étudiant. | Les réponses, le statut et les heures correspondent à la tentative choisie. |
| Noter une tentative | Ouvrir la tentative → vérifier l’auto-correction → compléter les points et le feedback → enregistrer. | La note finale ne dépasse pas le maximum du quiz. |
| Saisir une note | **Services** → **Notes et relevés** → cours → évaluation → étudiant → note et commentaire → enregistrer. | La note est rattachée au bon cours, à la bonne évaluation et au bon étudiant. |
| Modifier une note | Rechercher la note → **Modifier** → corriger la valeur et le motif → enregistrer. | La valeur actualisée apparaît et reste traçable. |
| Supprimer une note | Ouvrir la note erronée → **Supprimer** → confirmer. | La note disparaît du calcul après actualisation. |
| Saisie groupée des notes | Cours → évaluation → **Saisie groupée** → remplir chaque ligne → vérifier → enregistrer. | Toutes les lignes valides sont enregistrées ; corriger celles signalées en erreur. |
| Créer une séance de présence | **Services** → **Présences** → cours → **Nouvelle séance** → date et horaires → enregistrer. | La séance apparaît ouverte avec la liste du cours. |
| Faire l’appel | Ouvrir la séance → marquer chaque étudiant → **Enregistrer l’appel**. | Aucun étudiant ne reste sans statut, sauf justification explicite. |
| Finaliser l’appel | Relire les statuts → **Finaliser** → confirmer. | La séance est verrouillée ou porte le statut finalisé. |
| Consulter les statistiques | **Présences** → choisir le cours → **Statistiques**. | Les totaux correspondent aux séances finalisées. |
| Ajouter une disponibilité | **Services** → **Planning** → **Disponibilités** → **Ajouter** → date et plage horaire. | La plage apparaît sans chevauchement. |
| Supprimer une disponibilité | **Planning** → **Disponibilités** → plage → **Supprimer**. | La plage disparaît après actualisation. |
| Consulter un auditoire | **Services** → **Auditoires** → choisir l’auditoire. | La fiche, les étudiants et les cours autorisés apparaissent. |

## Diagnostic rapide

- **Impossible de joindre le serveur** : vérifier l’IP dans `.env`, le même Wi-Fi, Django sur `0.0.0.0:8000` et le pare-feu.
- **401 / session expirée** : revenir à la connexion ; l’application tente normalement de rafraîchir le jeton une fois.
- **403 / action interdite** : vérifier que le compte possède bien le rôle `etudiant` ou `enseignant` et que l’objet appartient à ses cours.
- **400 / données invalides** : corriger les champs affichés, en particulier dates ISO, identifiants de cours, barèmes et fichiers.
- **Bouton masqué par le clavier** : fermer le clavier ou faire défiler le formulaire ; les formulaires sont conçus pour conserver le bouton d’action accessible.
- **Envoi lent** : ne pas toucher plusieurs fois. Attendre la fin de l’indicateur puis actualiser la liste avant une nouvelle tentative.
