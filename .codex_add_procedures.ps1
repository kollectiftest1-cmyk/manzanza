$ErrorActionPreference = "Stop"

$guidePath = Join-Path $PSScriptRoot "Fichiers MD\GUIDE_PARAMETRAGE_UTILISATION.md"
$lines = Get-Content -LiteralPath $guidePath -Encoding UTF8

# Nettoie un éventuel passage précédent avant de reconstruire les procédures.
$cleanLines = [System.Collections.Generic.List[string]]::new()
$skipProcedureLines = 0
$skipIntro = $false
foreach ($sourceLine in $lines) {
    if ($sourceLine -match '^## Mode d') {
        $skipIntro = $true
        continue
    }
    if ($skipIntro) {
        if ($sourceLine -eq '---') {
            $skipIntro = $false
        }
        continue
    }
    if ($skipProcedureLines -gt 0) {
        $skipProcedureLines--
        continue
    }
    if ($sourceLine -match '^  - \*\*Chemin d') {
        $skipProcedureLines = 7
        continue
    }
    $cleanLines.Add($sourceLine)
}
$lines = $cleanLines

function Get-AccessPath([string]$section) {
    switch -Regex ($section) {
        '^2\.1|^2\.4|^2\.8|^4\.1' { return "Web : Académique > Calendrier ; mobile étudiant/enseignant : Agenda" }
        '^2\.2|^2\.3|^2\.5|^8\.2' { return "Web : Académique > Auditoires" }
        '^2\.6|^2\.7|^3\.1|^3\.2' { return "Web : Académique > Cours ; mobile étudiant/enseignant : Cours" }
        '^2\.9|^2\.10|^4\.2' { return "Web : Académique > Horaire ; mobile étudiant/enseignant : Agenda" }
        '^2\.11|^3\.7|^3\.8|^4\.3' { return "Web : Académique > Notes et résultats ; mobile étudiant/enseignant : Notes" }
        '^2\.12|^7\.1' { return "Web : Administration > Utilisateurs ; mobile : Profil pour son propre compte" }
        '^2\.13|^2\.14|^5\.' { return "Web : Finances > Frais et paiements ; mobile étudiant : Paiements" }
        '^2\.15|^7\.5' { return "Web : Service IT > Paramètres système" }
        '^3\.3|^3\.5' { return "Web : Quiz ; mobile étudiant/enseignant : Services > Quiz" }
        '^3\.4|^3\.6' { return "Web : TP/TD ; mobile étudiant/enseignant : onglet TP/TD" }
        '^3\.9' { return "Web : Présences ; mobile enseignant : Services > Présences, mobile étudiant : Agenda" }
        '^3\.10|^7\.2' { return "Web ou mobile : Messagerie / Notifications" }
        '^4\.4' { return "Web : Académique > Inscriptions" }
        '^6\.' { return "Web : Ressources humaines" }
        '^7\.3' { return "Web ou mobile : Bibliothèque" }
        '^7\.4' { return "Web : Administration > Audit et rapports" }
        '^8\.1' { return "Web : Apparitorat > Discipline" }
        '^9\.' { return "Web : Académique > Mémoires et jurys" }
        default { return "Web : ouvrir le module correspondant depuis le tableau de bord" }
    }
}

function Get-Procedure([string]$operation, [string]$accessPath, [string]$roles) {
    $op = $operation.ToLowerInvariant()
    $systemOperation = $roles -match "Système \(auto\)" -and $roles -notmatch "Enseignant|Étudiant|SGA|DG|PDG|Chef|Assistant|Budget|Caiss|Comptable|Apparitorat|iAdmin|Service IT"

    if ($systemOperation) {
        $steps = @(
            "Vérifier que les données sources, les dates et les règles du module sont complètes.",
            "Déclencher l’événement prévu ou attendre la tâche planifiée qui lance automatiquement l’opération.",
            "Contrôler la notification, le journal d’activité ou le statut produit par le système.",
            "En cas d’échec, ne pas répéter manuellement l’opération avant d’avoir vérifié les doublons et les journaux."
        )
    }
    elseif ($op -match "^(consultation|voir|visualisation|suivi|tableau de bord|identification|vérification|examen|investigation|rapport d'effectifs)") {
        $steps = @(
            "Se connecter avec un rôle autorisé, puis suivre : $accessPath.",
            "Choisir l’année académique et appliquer les filtres nécessaires pour limiter les résultats.",
            "Ouvrir la fiche concernée et vérifier le statut, les dates, l’auteur et les pièces liées.",
            "Actualiser la liste si les informations semblent anciennes, puis exporter ou partager uniquement si l’action est proposée."
        )
    }
    elseif ($op -match "^(création|ajout|enregistrement|constitution|ouverture|saisie|upload|soumission|demande|signalement|émission|encodage|définition)") {
        $steps = @(
            "Se connecter avec un rôle autorisé, puis suivre : $accessPath.",
            "Appuyer sur Ajouter, Nouveau ou l’action équivalente, puis sélectionner le contexte académique concerné.",
            "Renseigner tous les champs obligatoires, joindre les fichiers demandés et vérifier les dates, montants ou destinataires.",
            "Enregistrer, attendre la confirmation, puis rouvrir la fiche pour vérifier qu’elle apparaît avec le bon statut."
        )
    }
    elseif ($op -match "^(modification|mise à jour|configuration|affectation|assignation|renouvellement|réinitialisation|activation/désactivation)") {
        $steps = @(
            "Se connecter avec un rôle autorisé, puis suivre : $accessPath.",
            "Rechercher l’élément avec son identifiant, son intitulé ou les filtres d’année et de statut.",
            "Ouvrir Modifier, changer uniquement les champs nécessaires et vérifier l’impact sur les données liées.",
            "Enregistrer, contrôler le message de succès et rouvrir la fiche pour confirmer la nouvelle valeur."
        )
    }
    elseif ($op -match "^(suppression|annulation|désactivation|résiliation|retrait|clôture|fermeture|blocage)") {
        $steps = @(
            "Se connecter avec un rôle autorisé, puis suivre : $accessPath.",
            "Rechercher et ouvrir l’élément exact ; vérifier son identifiant, son statut et ses dépendances.",
            "Choisir l’action de suppression, annulation ou clôture, lire l’avertissement puis confirmer une seule fois.",
            "Actualiser la liste et vérifier que l’élément est supprimé ou qu’il porte le statut attendu dans l’historique."
        )
    }
    elseif ($op -match "^(publication|approbation|validation|activation|archivage|confirmation|délibération|décision|traitement|acceptation|rejet)") {
        $steps = @(
            "Se connecter avec un rôle autorisé, puis suivre : $accessPath.",
            "Ouvrir l’élément en attente et contrôler son contenu, ses pièces, ses dates et les validations précédentes.",
            "Choisir l’action correspondante, ajouter un commentaire si demandé, puis confirmer la décision.",
            "Vérifier le nouveau statut, la date de décision et l’envoi de la notification aux personnes concernées."
        )
    }
    elseif ($op -match "^(génération|calcul|export|rapport|production|établissement)") {
        $steps = @(
            "Se connecter avec un rôle autorisé, puis suivre : $accessPath.",
            "Choisir la période, l’année académique, le groupe et les autres critères du document à produire.",
            "Lancer le calcul, l’aperçu ou la génération et vérifier les totaux ainsi que les données manquantes.",
            "Télécharger ou imprimer le résultat final, puis conserver la date et les filtres utilisés pour la traçabilité."
        )
    }
    elseif ($op -match "^(envoi|partage|participation|notification|distribution|communication|réponse)") {
        $steps = @(
            "Se connecter avec un rôle autorisé, puis suivre : $accessPath.",
            "Sélectionner le bon cours, fil de discussion, groupe ou destinataire avant de saisir le contenu.",
            "Relire le message, vérifier les pièces jointes et les droits de visibilité, puis envoyer une seule fois.",
            "Contrôler l’état Envoyé ou Distribué et traiter une éventuelle réponse depuis le même fil."
        )
    }
    elseif ($op -match "^(correction|attribution|notation)") {
        $steps = @(
            "Se connecter avec un rôle autorisé, puis suivre : $accessPath.",
            "Sélectionner le cours et l’évaluation, puis ouvrir la copie ou la soumission de l’étudiant.",
            "Appliquer le barème, saisir les points et un commentaire utile, puis vérifier le total avant validation.",
            "Enregistrer la correction et ne publier le résultat qu’après contrôle de toutes les copies concernées."
        )
    }
    else {
        $steps = @(
            "Se connecter avec un rôle autorisé, puis suivre : $accessPath.",
            "Sélectionner l’année académique, le module et l’élément concernés par l’opération.",
            "Exécuter l’action demandée après avoir contrôlé les champs, les dates, les droits et les éventuelles pièces jointes.",
            "Vérifier le message de confirmation, le nouveau statut et la présence de l’action dans l’historique."
        )
    }

    $result = "L’opération « $operation » est enregistrée avec le statut attendu et reste traçable dans le module."
    $errorHelp = "Conserver les données saisies, vérifier la connexion et les champs signalés, puis réessayer une fois. Si l’erreur persiste, relever le message exact et contacter le responsable du module ou le Service IT."

    return @(
        "  - **Chemin d’accès :** $accessPath.",
        "  - **Marche à suivre :**",
        "    1. $($steps[0])",
        "    2. $($steps[1])",
        "    3. $($steps[2])",
        "    4. $($steps[3])",
        "  - **Résultat attendu :** $result",
        "  - **En cas d’erreur :** $errorHelp"
    )
}

$output = [System.Collections.Generic.List[string]]::new()
$inOperations = $false
$currentSection = ""
$introAdded = $false

for ($i = 0; $i -lt $lines.Count; $i++) {
    $line = $lines[$i]

    if ($line -match '^##\s+2') {
        $inOperations = $true
        if (-not $introAdded) {
            $output.Add("## Mode d’emploi des procédures")
            $output.Add("")
            $output.Add("Chaque opération ci-dessous indique les rôles autorisés, le chemin d’accès, les étapes à exécuter, le résultat attendu et la conduite à tenir en cas d’erreur. Les intitulés de boutons peuvent varier légèrement entre le Web et le mobile, mais la règle métier reste la même.")
            $output.Add("")
            $output.Add("Avant toute opération, vérifiez l’environnement utilisé, votre rôle, l’année académique active et la qualité de la connexion. Sur mobile, utilisez l’adresse IP réseau du serveur backend et non `localhost`.")
            $output.Add("")
            $output.Add("---")
            $output.Add("")
            $introAdded = $true
        }
    }
    elseif ($line -match '^##\s+📊') {
        $inOperations = $false
    }

    if ($inOperations -and $line -match '^###\s+(.+)$') {
        $currentSection = $Matches[1]
    }

    $output.Add($line)

    if ($inOperations -and $line -match '^- \*\*(.+?)\*\*') {
        $operation = $Matches[1]
        $roleParts = [System.Collections.Generic.List[string]]::new()

        while (($i + 1) -lt $lines.Count -and $lines[$i + 1] -match '^  - ') {
            $i++
            $roleLine = $lines[$i]
            $output.Add($roleLine)
            $roleParts.Add(($roleLine -replace '^  -\s*[^\p{L}\p{N}]*\s*', '').Trim())
        }

        $roles = $roleParts -join "; "
        $accessPath = Get-AccessPath $currentSection
        foreach ($procedureLine in (Get-Procedure $operation $accessPath $roles)) {
            $output.Add($procedureLine)
        }
    }
}

[System.IO.File]::WriteAllLines($guidePath, $output, [System.Text.UTF8Encoding]::new($false))
Write-Output "Guide enrichi : $guidePath"
