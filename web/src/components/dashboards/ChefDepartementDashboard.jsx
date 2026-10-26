/** Chef de filière : chiffres réels de sa filière pour l'année en cours. */
import RoleHome from "./RoleHome"
import { useHome } from "./homeData"
import { chefTiles } from "./chefTiles"

export default function ChefDepartementDashboard({ user }) {
  const f = useHome()?.counters?.filiere
  return (
    <RoleHome user={user} title="Chef de filière" subtitle={f ? `Filière : ${f.perimetre} — année en cours` : "Année en cours"}
      actions={[{ label: "Valider les notes", to: "/validation-notes" }, { label: "Inscriptions", to: "/inscriptions-annuelles" }, { label: "UE", to: "/unites-enseignement" }]}
      tiles={chefTiles} />
  )
}
