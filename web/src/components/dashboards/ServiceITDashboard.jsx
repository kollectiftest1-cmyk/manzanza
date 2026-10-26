/** Service IT : comptes et sécurité (données réelles du système). */
import RoleHome from "./RoleHome"

export default function ServiceITDashboard({ user }) {
  return (
    <RoleHome user={user} title="Service IT" subtitle="Comptes utilisateurs et signaux de sécurité."
      actions={[{ label: "Service IT", to: "/service-it" }]}
      tiles={(c) => {
        const s = c.systeme || {}
        return [
          { label: "Comptes", value: s.utilisateurs },
          { label: "Connectés (24 h)", value: s.actifs_24h },
          { label: "Nouveaux comptes (7 j)", value: s.nouveaux_comptes_7j },
          { label: "Comptes inactifs / suspendus", value: s.comptes_inactifs },
          { label: "Échecs de connexion (24 h)", value: s.echecs_connexion_24h, tone: s.echecs_connexion_24h > 10 ? "danger" : undefined },
          { label: "Fichiers stockés", value: `${s.stockage_fichiers_mo ?? 0} Mo` },
        ]
      }} />
  )
}
