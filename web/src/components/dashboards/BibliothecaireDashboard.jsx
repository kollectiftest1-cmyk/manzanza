/** Bibliothèque : fonds, emprunts, retards et réservations réels. */
import RoleHome from "./RoleHome"

export default function BibliothecaireDashboard({ user }) {
  return (
    <RoleHome user={user} title="Bibliothèque" subtitle="Fonds documentaire et circulation des ouvrages."
      actions={[{ label: "Catalogue et emprunts", to: "/library" }]}
      tiles={(c) => {
        const b = c.bibliotheque || {}
        return [
          { label: "Ouvrages au catalogue", value: b.ouvrages, to: "/library" },
          { label: "Exemplaires disponibles", value: b.exemplaires_disponibles },
          { label: "Emprunts en cours", value: b.emprunts_en_cours },
          { label: "Retards", value: b.retards, tone: b.retards ? "danger" : undefined },
          { label: "Retours (30 j)", value: b.retours_30j },
          { label: "Réservations en attente", value: b.reservations_en_attente },
        ]
      }} />
  )
}
