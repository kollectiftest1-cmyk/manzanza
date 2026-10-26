/**
 * Pointage du personnel : feuille de présence journalière (saisie en masse) et récapitulatif
 * mensuel. Les absences non justifiées sont retenues sur la paie ; les heures au-delà de la
 * journée de référence deviennent des heures supplémentaires.
 */
import { useCallback, useEffect, useState } from "react"
import { FiSave, FiCalendar } from "react-icons/fi"
import api from "../../services/api"
import { Empty, Kpi, Loading, PageHeader, Pill, Tabs } from "../../components/mz/Kit"
import { listOf, useFeedback } from "../../components/mz/helpers"

const STATUS = [
  ["present", "Présent"], ["retard", "En retard"], ["absent_justifie", "Absence justifiée"],
  ["absent_injustifie", "Absence non justifiée"], ["conge", "Congé"], ["mission", "Mission"], ["ferie", "Jour férié"],
]
const TONE = { present: "success", retard: "warning", absent_justifie: "info", absent_injustifie: "danger", conge: "info", mission: "info", ferie: "" }
const today = () => new Date().toISOString().slice(0, 10)

export default function Presences() {
  const fb = useFeedback()
  const [tab, setTab] = useState("jour")
  return (
    <div className="mz-page">
      <PageHeader title="Pointage du personnel" subtitle="Présences, retards, absences et heures supplémentaires — utilisés automatiquement par la paie." />
      {fb.banner}
      <div className="mb-3"><Tabs tabs={[{ key: "jour", label: "Feuille du jour" }, { key: "mois", label: "Récapitulatif mensuel" }]} value={tab} onChange={setTab} /></div>
      {tab === "jour" ? <DaySheet fb={fb} /> : <MonthSummary fb={fb} />}
    </div>
  )
}

function DaySheet({ fb }) {
  const [date, setDate] = useState(today())
  const [rows, setRows] = useState(null)
  const [saving, setSaving] = useState(false)
  const load = useCallback(async () => {
    setRows(null)
    try {
      const [emps, att] = await Promise.all([
        api.get("/hr/employees/", { params: { page_size: 500, status: "actif" } }),
        api.get("/hr/attendance/", { params: { date, page_size: 500 } }),
      ])
      const byEmp = Object.fromEntries(listOf(att.data).map((a) => [a.employee, a]))
      setRows(listOf(emps.data).map((e) => {
        const a = byEmp[e.id]
        return { employee: e.id, name: e.user_name, code: e.employee_id, poste: e.position_display,
          status: a?.status || "", check_in: a?.check_in?.slice(0, 5) || "", check_out: a?.check_out?.slice(0, 5) || "",
          note: a?.note || "", hours: a?.hours_worked, self: a?.self_declared, existing: !!a }
      }))
    } catch (e) { fb.fail(e); setRows([]) }
  }, [date]) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { load() }, [load])
  const set = (i, k, v) => setRows((rs) => rs.map((r, j) => (j === i ? { ...r, [k]: v } : r)))
  const allPresent = () => setRows((rs) => rs.map((r) => (r.status ? r : { ...r, status: "present", check_in: r.check_in || "08:00", check_out: r.check_out || "16:00" })))
  const save = async () => {
    setSaving(true)
    try {
      const entries = rows.filter((r) => r.status).map((r) => ({ employee: r.employee, status: r.status, check_in: r.check_in || null, check_out: r.check_out || null, note: r.note }))
      const { data } = await api.post("/hr/attendance/bulk/", { date, entries })
      fb.ok(`${data.saved} pointage(s) enregistrés pour le ${new Date(date).toLocaleDateString("fr-FR")}.`); load()
    } catch (e) { fb.fail(e) } finally { setSaving(false) }
  }
  const missing = (rows || []).filter((r) => !r.status).length
  return (
    <div className="mz-card">
      <div className="mz-toolbar">
        <div className="d-flex gap-2 align-items-center"><FiCalendar /><input type="date" className="form-control form-control-sm" style={{ width: 170 }} value={date} onChange={(e) => setDate(e.target.value)} />
          {rows && <span className="mz-muted" style={{ color: "var(--color-textSecondary)" }}>{missing} non pointé(s)</span>}</div>
        <div className="d-flex gap-2">
          <button className="btn btn-outline-primary btn-sm" onClick={allPresent} disabled={!rows}>Marquer les non-pointés présents</button>
          <button className="btn btn-primary btn-sm" onClick={save} disabled={saving || !rows}><FiSave className="me-1" />Enregistrer</button>
        </div>
      </div>
      {rows === null ? <Loading /> : rows.length === 0 ? <Empty title="Aucun employé actif">Créez d'abord les dossiers du personnel (RH → Employés).</Empty> : (
        <div className="mz-table-wrap"><table className="mz-table">
          <thead><tr><th>Employé</th><th>Statut</th><th>Arrivée</th><th>Départ</th><th>Heures</th><th>Note</th></tr></thead>
          <tbody>{rows.map((r, i) => (
            <tr key={r.employee}>
              <td><div className="mz-strong">{r.name}</div><div className="mz-muted">{r.code} · {r.poste}{r.self && " · pointé par l'employé"}</div></td>
              <td><select className="form-select form-select-sm" style={{ minWidth: 180 }} value={r.status} onChange={(e) => set(i, "status", e.target.value)}>
                <option value="">— non pointé —</option>{STATUS.map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select></td>
              <td><input type="time" className="form-control form-control-sm" value={r.check_in} onChange={(e) => set(i, "check_in", e.target.value)} disabled={!["present", "retard"].includes(r.status)} /></td>
              <td><input type="time" className="form-control form-control-sm" value={r.check_out} onChange={(e) => set(i, "check_out", e.target.value)} disabled={!["present", "retard"].includes(r.status)} /></td>
              <td className="mz-muted">{r.hours ? `${r.hours} h` : "—"}</td>
              <td><input className="form-control form-control-sm" value={r.note} onChange={(e) => set(i, "note", e.target.value)} placeholder={r.status === "absent_justifie" ? "Justificatif" : ""} /></td>
            </tr>))}</tbody>
        </table></div>
      )}
    </div>
  )
}

function MonthSummary({ fb }) {
  const now = new Date()
  const [mois, setMois] = useState(now.getMonth() + 1)
  const [annee, setAnnee] = useState(now.getFullYear())
  const [data, setData] = useState(null)
  useEffect(() => {
    setData(null)
    api.get("/hr/attendance/month-summary/", { params: { mois, annee } }).then(({ data }) => setData(data)).catch((e) => { fb.fail(e); setData({ employes: [] }) })
  }, [mois, annee]) // eslint-disable-line react-hooks/exhaustive-deps
  const tot = (k) => (data?.employes || []).reduce((t, e) => t + (e.statuts[k] || 0), 0)
  return (
    <>
      <div className="d-flex gap-2 mb-3">
        <select className="form-select form-select-sm" style={{ width: 140 }} value={mois} onChange={(e) => setMois(Number(e.target.value))}>
          {["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"].map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
        </select>
        <input type="number" className="form-control form-control-sm" style={{ width: 100 }} value={annee} onChange={(e) => setAnnee(Number(e.target.value))} />
      </div>
      {data === null ? <Loading /> : (<>
        <div className="mz-kpis">
          <Kpi label="Jours ouvrables du mois" value={data.jours_ouvrables} />
          <Kpi label="Absences non justifiées" value={tot("absent_injustifie")} tone={tot("absent_injustifie") ? "danger" : undefined} />
          <Kpi label="Retards" value={tot("retard")} />
          <Kpi label="Jours de congé" value={tot("conge")} />
        </div>
        <div className="mz-card">{data.employes.length === 0 ? <Empty title="Aucun pointage ce mois" /> : (
          <div className="mz-table-wrap"><table className="mz-table">
            <thead><tr><th>Employé</th>{STATUS.map(([k, l]) => <th key={k}>{l}</th>)}<th>Heures</th><th>H. sup.</th><th>Non pointés</th></tr></thead>
            <tbody>{data.employes.map((e) => {
              const pointed = Object.values(e.statuts).reduce((a, b) => a + b, 0)
              return (<tr key={e.employee}>
                <td><div className="mz-strong">{e.nom}</div><div className="mz-muted">{e.matricule}</div></td>
                {STATUS.map(([k]) => <td key={k}>{e.statuts[k] ? <Pill tone={TONE[k]}>{e.statuts[k]}</Pill> : <span className="mz-muted">—</span>}</td>)}
                <td>{e.heures.toFixed(1)}</td><td>{e.heures_sup.toFixed(1)}</td>
                <td>{Math.max(data.jours_ouvrables - pointed, 0)}</td>
              </tr>)
            })}</tbody>
          </table></div>
        )}</div>
      </>)}
    </>
  )
}
