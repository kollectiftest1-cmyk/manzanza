/**
 * Bandeau d'indicateurs réels (GET /stats/kpis/) affiché en tête des tableaux de bord
 * de gestion. Les chiffres viennent du serveur et respectent le périmètre du rôle.
 */
import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { FiArrowRight } from "react-icons/fi"
import { pilotageAPI } from "../../services/api"
import { Kpi } from "../mz/Kit"
import { fmtMoney } from "../mz/helpers"

export default function KpiStrip() {
  const [d, setD] = useState(null)
  useEffect(() => { pilotageAPI.kpis().then(({ data }) => setD(data)).catch(() => setD(false)) }, [])
  if (!d) return null
  const a = d.academique, ad = d.admission, f = d.finances
  const usd = f?.par_devise?.USD
  return (
    <div className="mz-page" style={{ paddingBottom: 0 }}>
      <div className="d-flex justify-content-between align-items-center mb-2">
        <strong style={{ color: "var(--color-textSecondary)", fontSize: "0.8rem", letterSpacing: "0.05em" }}>INDICATEURS EN TEMPS RÉEL{a?.academic_year ? ` — ${a.academic_year}` : ""}</strong>
        <Link to="/pilotage" style={{ fontSize: "0.85rem" }}>Pilotage détaillé <FiArrowRight /></Link>
      </div>
      <div className="mz-kpis" style={{ marginBottom: 0 }}>
        {a && <Kpi label="Étudiants inscrits" value={a.inscriptions_total} />}
        {a && <Kpi label="Feuilles de notes à approuver" value={a.feuilles_a_approuver} tone={a.feuilles_a_approuver ? "warning" : undefined} />}
        {a && a.taux_reussite != null && <Kpi label="Taux de réussite" value={`${a.taux_reussite} %`} />}
        {ad && <Kpi label="Candidatures en cours" value={ad.candidatures_en_cours} hint={`${ad.pieces_a_verifier} dossier(s) à vérifier`} />}
        {usd && <Kpi label="Recouvrement USD" value={usd.taux_recouvrement != null ? `${usd.taux_recouvrement} %` : "—"} hint={`reste ${fmtMoney(usd.reste, "USD")}`} />}
        {f && <Kpi label="Impayés échus" value={f.impayes_echus} tone={f.impayes_echus ? "danger" : undefined} />}
        {f && f.contrepassations_en_attente > 0 && <Kpi label="Contre-passations à valider" value={f.contrepassations_en_attente} tone="warning" />}
      </div>
    </div>
  )
}
