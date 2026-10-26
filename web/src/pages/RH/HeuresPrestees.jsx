/**
 * Heures de cours prestées (séances d'appel clôturées) par enseignant, heures complémentaires
 * au-delà de la charge statutaire, et taux d'exécution des cours (volume prévu LMD vs tenu).
 */
import { useEffect, useState } from "react"
import { Empty, Kpi, Loading, PageHeader, Pill, Tabs } from "../../components/mz/Kit"
import { useFeedback } from "../../components/mz/helpers"
import api from "../../services/api"

export default function HeuresPrestees() {
  const fb = useFeedback()
  const now = new Date()
  const [mois, setMois] = useState(now.getMonth() + 1)
  const [annee, setAnnee] = useState(now.getFullYear())
  const [tab, setTab] = useState("enseignants")
  const [data, setData] = useState(null)
  const [open, setOpen] = useState(null)
  useEffect(() => {
    setData(null)
    api.get("/hr/teaching-hours/", { params: { mois, annee } }).then(({ data }) => setData(data)).catch((e) => { fb.fail(e); setData({ enseignants: [], execution_cours: [] }) })
  }, [mois, annee]) // eslint-disable-line react-hooks/exhaustive-deps
  const total = (data?.enseignants || []).reduce((t, x) => t + x.heures, 0)
  const comp = (data?.enseignants || []).reduce((t, x) => t + x.heures_complementaires, 0)
  const exec = data?.execution_cours || []
  const late = exec.filter((c) => c.taux_execution !== null && c.taux_execution < 50).length
  return (
    <div className="mz-page">
      <PageHeader title="Heures prestées" subtitle="Seules les séances dont l'appel a été clôturé comptent : elles alimentent la paie des vacataires et les heures complémentaires.">
        <select className="form-select form-select-sm" style={{ width: 140 }} value={mois} onChange={(e) => setMois(Number(e.target.value))}>
          {["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"].map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
        </select>
        <input type="number" className="form-control form-control-sm" style={{ width: 100 }} value={annee} onChange={(e) => setAnnee(Number(e.target.value))} />
      </PageHeader>
      {fb.banner}
      {data === null ? <Loading /> : (<>
        <div className="mz-kpis">
          <Kpi label="Heures de cours tenues (mois)" value={total.toFixed(1)} />
          <Kpi label="Heures complémentaires" value={comp.toFixed(1)} />
          <Kpi label="Enseignants" value={data.enseignants.length} />
          <Kpi label="Cours exécutés à moins de 50 %" value={late} tone={late ? "warning" : undefined} hint="sur l'année" />
        </div>
        <div className="mb-3"><Tabs tabs={[{ key: "enseignants", label: "Par enseignant" }, { key: "cours", label: "Exécution des cours" }]} value={tab} onChange={setTab} /></div>
        <div className="mz-card">
          {tab === "enseignants" ? (data.enseignants.length === 0 ? <Empty title="Aucun enseignant" /> : (
            <div className="mz-table-wrap"><table className="mz-table">
              <thead><tr><th>Enseignant</th><th>Statut RH</th><th>Heures tenues</th><th>Charge statutaire</th><th>Heures compl.</th><th className="mz-actions"></th></tr></thead>
              <tbody>{data.enseignants.map((t) => [
                <tr key={t.teacher_id}>
                  <td><div className="mz-strong">{t.teacher}</div><div className="mz-muted">{t.role}</div></td>
                  <td className="mz-muted">{t.mode}</td>
                  <td className="mz-strong">{t.heures} h</td>
                  <td>{t.charge_statutaire ? `${t.charge_statutaire} h` : "—"}</td>
                  <td>{t.heures_complementaires ? <Pill tone="warning">{t.heures_complementaires} h</Pill> : "—"}</td>
                  <td className="mz-actions">{t.cours.length > 0 && <button className="mz-icon-btn" onClick={() => setOpen(open === t.teacher_id ? null : t.teacher_id)}>{open === t.teacher_id ? "Masquer" : "Détail"}</button>}</td>
                </tr>,
                open === t.teacher_id && t.cours.map((c) => <tr key={`${t.teacher_id}-${c.course_id}`}><td className="mz-muted" style={{ paddingLeft: 32 }} colSpan={2}>{c.course} ({c.code})</td><td>{c.hours} h</td><td colSpan={3} className="mz-muted">{c.sessions} séance(s)</td></tr>),
              ])}</tbody>
            </table></div>
          )) : (exec.length === 0 ? <Empty title="Aucun cours" /> : (
            <div className="mz-table-wrap"><table className="mz-table">
              <thead><tr><th>Cours</th><th>Groupe</th><th>Titulaire</th><th>Crédits</th><th>Volume prévu</th><th>Heures tenues</th><th>Exécution</th></tr></thead>
              <tbody>{exec.map((c) => (
                <tr key={c.course_id}>
                  <td><div className="mz-strong">{c.course}</div><div className="mz-muted">{c.code}</div></td>
                  <td className="mz-muted">{c.groupe}</td><td className="mz-muted">{c.titulaire}</td><td>{c.credits}</td>
                  <td>{c.volume_prevu} h</td><td>{c.heures_tenues} h</td>
                  <td>{c.taux_execution === null ? "—" : <Pill tone={c.taux_execution >= 90 ? "success" : c.taux_execution >= 50 ? "info" : "warning"}>{c.taux_execution} %</Pill>}</td>
                </tr>))}</tbody>
            </table></div>
          ))}
        </div>
      </>)}
    </div>
  )
}
