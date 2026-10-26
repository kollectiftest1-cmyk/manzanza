/** Membre de jury : délibérations dont il fait partie. */
import RoleHome from "./RoleHome"

export default function JuryDashboard({ user }) {
  return (
    <RoleHome user={user} title="Jury" subtitle="Les délibérations auxquelles vous participez."
      actions={[{ label: "Délibérations", to: "/deliberations" }, { label: "Soutenances", to: "/memoires" }]}
      tiles={(c) => {
        const j = c.jury || {}
        return [
          { label: "Délibérations", value: j.deliberations ?? 0, to: "/deliberations" },
          { label: "En préparation", value: j.en_preparation ?? 0 },
          { label: "Ouvertes", value: j.ouvertes ?? 0, tone: j.ouvertes ? "warning" : undefined },
          { label: "Clôturées / publiées", value: j.cloturees ?? 0 },
          { label: "Présidées", value: j.presidees ?? 0 },
          ...(c.memoires ? [{ label: "Soutenances à venir", value: c.memoires.soutenances_a_venir, to: "/memoires" },
            { label: "Soutenances à noter", value: c.memoires.a_noter, tone: c.memoires.a_noter ? "warning" : undefined, to: "/memoires" }] : []),
        ]
      }} />
  )
}
