/**
 * Pilotage : indicateurs réels (calculés côté serveur) selon le rôle — académique,
 * admission, finances (par devise, jamais additionnées).
 */
import { useCallback, useEffect, useState } from "react"
import { FiDownload, FiRefreshCw } from "react-icons/fi"
import { academicYearsAPI, pilotageAPI, saveBlob } from "../services/api"
import { Empty, Kpi, Loading, PageHeader } from "../components/mz/Kit"
import { fmtDate, fmtMoney, listOf, useFeedback } from "../components/mz/helpers"

const LEVELS = ["L1", "L2", "L3", "M1", "M2"]
const STATUT_LABEL = { en_attente: "En attente", administrative: "Administrative", pedagogique: "Pédagogique", suspendue: "Suspendue", abandon: "Abandon", diplome: "Diplômé" }

function Bars({ data, labelOf = (k) => k }) {
  const entries = Object.entries(data || {})
  const max = Math.max(1, ...entries.map(([, v]) => v))
  if (!entries.length) return <div style={{ color: "var(--color-textSecondary)" }}>Aucune donnée.</div>
  return (
    <div className="d-flex flex-column gap-2">
      {entries.map(([k, v]) => (
        <div key={k} className="d-flex align-items-center gap-2">
          <div style={{ width: 130, fontSize: "0.85rem", color: "var(--color-textSecondary)" }}>{labelOf(k)}</div>
          <div style={{ flex: 1, background: "var(--color-primaryLight)", borderRadius: 999, height: 10 }}>
            <div style={{ width: `${(v * 100) / max}%`, background: "var(--color-primary)", height: 10, borderRadius: 999 }} />
          </div>
          <div style={{ width: 40, textAlign: "right", fontWeight: 600 }}>{v}</div>
        </div>
      ))}
    </div>
  )
}

export default function Pilotage() {
  const fb = useFeedback()
  const [years, setYears] = useState([])
  const [year, setYear] = useState("")
  const [data, setData] = useState(null)
  useEffect(() => { academicYearsAPI.list().then(({ data }) => { const ys = listOf(data); setYears(ys); const c = ys.find((y) => y.is_current) || ys[0]; if (c) setYear(String(c.id)) }).catch(() => {}) }, [])
  const load = useCallback(async () => {
    setData(null)
    try { const { data } = await pilotageAPI.kpis(year ? { academic_year: year } : {}); setData(data) } catch (e) { fb.fail(e); setData({}) }
  }, [year]) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { load() }, [load])
  const exp = async (kind) => { try { saveBlob(await pilotageAPI.exportCSV(kind, { academic_year: year }), `${kind}.csv`) } catch (e) { fb.fail(e) } }

  const a = data?.academique, ad = data?.admission, f = data?.finances
  return (
    <div className="mz-page">
      <PageHeader title="Pilotage" subtitle={data?.generated_at ? `Chiffres calculés le ${fmtDate(data.generated_at, true)}` : "Indicateurs de l'établissement"}>
        <select className="form-select form-select-sm" style={{ width: 150 }} value={year} onChange={(e) => setYear(e.target.value)}>
          {years.map((y) => <option key={y.id} value={y.id}>{y.name}</option>)}</select>
        <button className="btn btn-outline-primary btn-sm" onClick={load}><FiRefreshCw /></button>
      </PageHeader>
      {fb.banner}
      {data === null ? <Loading /> : !a && !ad && !f ? <Empty title="Aucun indicateur pour votre rôle" /> : (
        <>
          {a && (<>
            <h6 className="fw-bold mb-2" style={{ color: "var(--color-textSecondary)" }}>ACADÉMIQUE</h6>
            <div className="mz-kpis">
              <Kpi label="Étudiants inscrits" value={a.inscriptions_total} hint={a.academic_year} />
              <Kpi label="Feuilles à approuver" value={a.feuilles_a_approuver} tone={a.feuilles_a_approuver ? "warning" : undefined} />
              <Kpi label="Corrections en attente" value={a.corrections_en_attente} />
              <Kpi label="Taux de réussite" value={a.taux_reussite != null ? `${a.taux_reussite} %` : "—"} hint="délibérations clôturées" />
              <Kpi label="Enseignants" value={a.enseignants} />
            </div>
            <div className="row g-3 mb-4">
              <div className="col-lg-4"><div className="mz-card h-100"><div className="mz-card-body"><h6 className="fw-semibold">Par statut</h6><Bars data={a.inscriptions_par_statut} labelOf={(k) => STATUT_LABEL[k] || k} /></div></div></div>
              <div className="col-lg-4"><div className="mz-card h-100"><div className="mz-card-body"><h6 className="fw-semibold">Par niveau</h6>
                <Bars data={Object.fromEntries(LEVELS.filter((l) => a.inscriptions_par_niveau?.[l]).map((l) => [l, a.inscriptions_par_niveau[l]]))} /></div></div></div>
              <div className="col-lg-4"><div className="mz-card h-100"><div className="mz-card-body"><h6 className="fw-semibold">Par filière</h6>
                <Bars data={Object.fromEntries((a.inscriptions_par_filiere || []).map((r) => [r.filiere, r.effectif]))} /></div></div></div>
            </div>
            <div className="mb-4"><button className="btn btn-outline-primary btn-sm" onClick={() => exp("inscriptions")}><FiDownload className="me-1" />Liste des inscrits (CSV)</button></div>
          </>)}
          {ad && (<>
            <h6 className="fw-bold mb-2" style={{ color: "var(--color-textSecondary)" }}>ADMISSION</h6>
            <div className="mz-kpis mb-4">
              <Kpi label="Candidatures en cours" value={ad.candidatures_en_cours} />
              <Kpi label="Pièces à vérifier" value={ad.pieces_a_verifier} tone={ad.pieces_a_verifier ? "warning" : undefined} />
              <Kpi label="Frais de dossier attendus" value={ad.frais_dossier_attendus} />
              <Kpi label="En attente de commission" value={ad.en_attente_commission} />
              <Kpi label="Admis / refusés" value={`${ad.admis} / ${ad.refuses}`} />
            </div>
          </>)}
          {f && (<>
            <h6 className="fw-bold mb-2" style={{ color: "var(--color-textSecondary)" }}>FINANCES</h6>
            <div className="mz-kpis">
              {Object.entries(f.par_devise || {}).map(([c, v]) => (
                <Kpi key={c} label={`Recouvrement ${c}`} value={v.taux_recouvrement != null ? `${v.taux_recouvrement} %` : "—"}
                     hint={`${fmtMoney(v.encaisse, c)} encaissés sur ${fmtMoney(v.facture, c)} — reste ${fmtMoney(v.reste, c)}`} />
              ))}
              <Kpi label="Encaissé ce mois" value={Object.entries(f.encaisse_ce_mois || {}).map(([c, v]) => fmtMoney(v, c)).join(" · ") || "—"} />
              <Kpi label="Impayés échus" value={f.impayes_echus} hint={`${f.etudiants_en_retard} étudiant(s)`} tone={f.impayes_echus ? "danger" : undefined} />
              <Kpi label="Paiements à confirmer" value={f.paiements_en_attente} />
              <Kpi label="Caisses ouvertes" value={f.caisses_ouvertes} />
              <Kpi label="Contre-passations en attente" value={f.contrepassations_en_attente} />
            </div>
            <button className="btn btn-outline-primary btn-sm" onClick={() => exp("impayes")}><FiDownload className="me-1" />Impayés (CSV)</button>
          </>)}
        </>
      )}
    </div>
  )
}
