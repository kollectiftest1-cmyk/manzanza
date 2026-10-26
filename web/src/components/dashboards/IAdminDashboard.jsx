/** PDG : état réel du système (comptes, sécurité, corbeille, stockage, sauvegarde). */
import RoleHome from "./RoleHome"
import { fmtDate } from "../mz/helpers"

const ROLE_LABELS = { etudiant: "Étudiants", enseignant: "Enseignants", assistant: "Assistants", sga: "SGA", sgad: "SGAD",
  caisse: "Caisse", comptable: "Comptables", apparitorat: "Apparitorat", bibliothecaire: "Bibliothèque",
  chef_section: "Chefs de section", chef_departement: "Chefs de filière", service_it: "Service IT",
  pdg: "PDG", directeur_general: "DG", jury: "Jury" }

export default function IAdminDashboard({ user }) {
  return (
    <RoleHome user={user} title="PDG — pilotage et administration" subtitle="Comptes, sécurité, corbeille et stockage, calculés en direct."
      actions={[{ label: "Utilisateurs", to: "/administration" }, { label: "Journal d'audit", to: "/journal-audit" }, { label: "Corbeille", to: "/corbeille" }, { label: "Paramètres", to: "/parametres" }]}
      tiles={(c) => {
        const s = c.systeme || {}
        return [
          { label: "Comptes", value: s.utilisateurs, hint: `${s.nouveaux_comptes_7j ?? 0} créés en 7 jours`, to: "/administration" },
          { label: "Connectés (24 h)", value: s.actifs_24h },
          { label: "Échecs de connexion (24 h)", value: s.echecs_connexion_24h, tone: s.echecs_connexion_24h > 10 ? "danger" : undefined, to: "/journal-audit" },
          { label: "Comptes inactifs / suspendus", value: s.comptes_inactifs },
          { label: "Éléments en corbeille", value: s.elements_corbeille, hint: `conservation ${s.retention_jours} j`, to: "/corbeille" },
          { label: "Dernière purge", value: s.derniere_purge ? fmtDate(s.derniere_purge) : "Jamais", tone: s.derniere_purge ? undefined : "warning", hint: "planifier purge_trash chaque nuit" },
          { label: "Fichiers stockés", value: `${s.stockage_fichiers_mo ?? 0} Mo` },
          { label: "Base de données", value: s.base_de_donnees, tone: s.base_de_donnees === "sqlite3" ? "warning" : undefined, hint: s.base_de_donnees === "sqlite3" ? "PostgreSQL recommandé en production" : "" },
          ...Object.entries(s.par_role || {}).sort((a, b) => b[1] - a[1]).slice(0, 4).map(([r, n]) => ({ label: ROLE_LABELS[r] || r, value: n })),
        ]
      }} />
  )
}
