/** Chef de section : chiffres réels des filières de sa section pour l'année en cours. */
import RoleHome from "./RoleHome"
import { chefTiles } from "./chefTiles"
import { useHome } from "./homeData"

export default function ChefSectionDashboard({ user }) {
  const f = useHome()?.counters?.filiere
  return (
    <RoleHome user={user} title="Chef de section" subtitle={f ? `Filières : ${f.perimetre} — année en cours` : "Année en cours"}
      actions={[{ label: "Valider les notes", to: "/validation-notes" }, { label: "Délibérations", to: "/deliberations" }]}
      tiles={chefTiles} />
  )
}
