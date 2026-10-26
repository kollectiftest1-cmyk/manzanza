/** Étudiant : situation réelle (inscription, crédits, résultats publiés, assiduité, frais) et ses cours. */
import { Link } from "react-router-dom"
import RoleHome from "./RoleHome"
import { useHome } from "./homeData"

const pct = (v) => (v == null ? "—" : `${Number(v).toLocaleString("fr-FR", { maximumFractionDigits: 1 })} %`)

export default function EtudiantDashboard({ user }) {
  const home = useHome()
  const e = home?.counters?.etudiant
  return (
    <RoleHome user={user} title={`Bonjour ${user?.first_name || ""}`}
      subtitle={e?.groupe ? `${e.groupe} · ${e.annee} · ${e.statut}` : "Votre espace étudiant"}
      actions={[{ label: "Mes résultats", to: "/mes-resultats" }, { label: "Mes paiements", to: "/paiements" }, { label: "Horaire", to: "/horaire" }]}
      tiles={(c) => {
        const s = c.etudiant || {}
        return [
          { label: "Programme de l'année", value: s.nb_cours ?? 0, hint: `${s.credits_annee ?? 0} crédits à valider`, to: "/courses" },
          { label: "Assiduité moyenne", value: pct(s.assiduite_moyenne), tone: s.assiduite_moyenne != null && s.assiduite_moyenne < 70 ? "danger" : undefined, hint: "séances d'appel clôturées" },
          { label: "Dernier résultat publié", value: s.derniere_moyenne != null ? `${Number(s.derniere_moyenne).toFixed(2)}/20` : "—", hint: s.derniere_decision ? `${s.derniere_decision} · ${s.derniere_session}` : "aucune délibération publiée", to: "/mes-resultats" },
          { label: "Crédits capitalisés", value: s.credits_capitalises != null ? `${s.credits_capitalises}/60` : "—", hint: "dernière délibération" },
          { label: "Frais échus réglés", value: pct(s.frais_payes_pourcent), tone: s.en_regle === false ? "warning" : undefined, hint: s.en_regle ? "en règle" : "accès aux examens et résultats bloqué", to: "/paiements" },
        ]
      }}>
      {e?.cours?.length > 0 && (
        <div className="mz-card mt-3">
          <div className="mz-toolbar"><strong>Mes cours {e.annee}</strong><Link to="/courses" className="mz-muted">Tous les cours →</Link></div>
          <div className="mz-table-wrap"><table className="mz-table">
            <thead><tr><th>Cours</th><th>UE</th><th>Semestre</th><th>Crédits</th><th>Titulaire</th><th>Assiduité</th><th>Note provisoire</th></tr></thead>
            <tbody>{e.cours.map((c) => (
              <tr key={c.id}>
                <td className="mz-strong"><Link to={`/courses/${c.id}`}>{c.nom}</Link></td>
                <td>{c.ue || "—"}</td><td>{c.semestre}</td><td>{c.credits}</td><td className="mz-muted">{c.titulaire}</td>
                <td style={{ color: c.assiduite != null && c.assiduite < 70 ? "var(--color-danger)" : undefined }}>{pct(c.assiduite)}</td>
                <td className="mz-strong">{c.note_publiee != null ? `${c.note_publiee.toFixed(2)}/20` : <span className="mz-muted">—</span>}</td>
              </tr>))}</tbody>
          </table></div>
          <p className="mz-muted mb-0 mt-2" style={{ fontSize: ".82rem" }}>Note provisoire : calculée sur les seules notes publiées (feuilles approuvées). Sous 70 % d'assiduité, l'examen du cours n'est pas accessible.</p>
        </div>
      )}
    </RoleHome>
  )
}
