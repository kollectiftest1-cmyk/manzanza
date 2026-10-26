/** Apparitorat : contrôle des pièces, validations administratives, documents, salles. */
import RoleHome from "./RoleHome"

export default function ApparitoratDashboard({ user }) {
  return (
    <RoleHome user={user} title="Apparitorat" subtitle="Dossiers à contrôler, inscriptions à valider et documents émis."
      actions={[{ label: "Admissions", to: "/gestion-inscriptions" }, { label: "Inscriptions annuelles", to: "/inscriptions-annuelles" }, { label: "Documents officiels", to: "/documents-officiels" }]}
      tiles={(c) => {
        const a = c.apparitorat || {}
        return [
          { label: "Pièces à vérifier", value: a.pieces_a_verifier, tone: a.pieces_a_verifier ? "warning" : undefined, to: "/gestion-inscriptions" },
          { label: "Dossiers à compléter", value: a.dossiers_a_completer },
          { label: "Inscriptions à valider", value: a.inscriptions_a_valider, hint: "validation administrative", to: "/inscriptions-annuelles" },
          { label: "Documents émis (30 j)", value: a.documents_emis_30j, to: "/documents-officiels" },
          { label: "Réservations de salles en attente", value: a.reservations_en_attente, to: "/horaire" },
        ]
      }} />
  )
}
