/**
 * Paie mensuelle : génération automatique (pointage, heures de cours, absences, cotisations,
 * IPR), validation par le SGAD / la direction, paiement par la comptabilité, bulletins PDF,
 * livre de paie et paramètres (taux, barème, change).
 */
import { useCallback, useEffect, useState } from "react"
import { useSelector } from "react-redux"
import { Modal } from "react-bootstrap"
import { FiRefreshCw, FiCheckCircle, FiDollarSign, FiFileText, FiDownload, FiSettings, FiEye, FiX } from "react-icons/fi"
import api, { saveBlob } from "../../services/api"
import { hasAnyRole } from "../../utils/permissions"
import { ConfirmDialog, Empty, Field, Kpi, Loading, PageHeader, Pill, Tabs } from "../../components/mz/Kit"
import { fmtDate, fmtMoney, listOf, useFeedback } from "../../components/mz/helpers"

const MOIS = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"]
const TONE = { en_attente: "warning", valide: "info", paye: "success", annule: "danger" }

export default function HrPayrollsPage() {
  const { user } = useSelector((s) => s.auth)
  const canValidate = hasAnyRole(user, "sgad", "directeur_general")
  const canPay = hasAnyRole(user, "comptable", "caisse", "sgad")
  const fb = useFeedback()
  const now = new Date()
  const [mois, setMois] = useState(now.getMonth() + 1)
  const [annee, setAnnee] = useState(now.getFullYear())
  const [statut, setStatut] = useState("")
  const [rows, setRows] = useState(null)
  const [summary, setSummary] = useState(null)
  const [detail, setDetail] = useState(null)
  const [ask, setAsk] = useState(null)
  const [settings, setSettings] = useState(null)
  const [busy, setBusy] = useState(false)

  const load = useCallback(async () => {
    setRows(null)
    try {
      const [{ data }, s] = await Promise.all([
        api.get("/hr/payrolls/", { params: { mois, annee, page_size: 500 } }),
        api.get("/hr/payrolls/summary/", { params: { mois, annee } }),
      ])
      setRows(listOf(data)); setSummary(s.data)
    } catch (e) { fb.fail(e); setRows([]) }
  }, [mois, annee]) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { load() }, [load])

  const run = async (fn, msg) => {
    setBusy(true)
    try { const r = await fn(); fb.ok(typeof msg === "function" ? msg(r) : msg); load(); return r } catch (e) { fb.fail(e) } finally { setBusy(false) }
  }
  const shown = (rows || []).filter((r) => !statut || r.status === statut)
  const count = (s) => (rows || []).filter((r) => r.status === s).length
  const years = [annee - 1, annee, annee + 1]

  return (
    <div className="mz-page">
      <PageHeader title="Paie du personnel" subtitle="Calcul automatique à partir du pointage, des heures de cours tenues, des absences, des cotisations et du barème fiscal.">
        <select className="form-select form-select-sm" style={{ width: 130 }} value={mois} onChange={(e) => setMois(Number(e.target.value))}>
          {MOIS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
        </select>
        <select className="form-select form-select-sm" style={{ width: 100 }} value={annee} onChange={(e) => setAnnee(Number(e.target.value))}>
          {years.map((y) => <option key={y}>{y}</option>)}
        </select>
        {canValidate && <button className="btn btn-outline-primary btn-sm" onClick={async () => { try { setSettings((await api.get("/hr/payroll-settings/")).data) } catch (e) { fb.fail(e) } }}><FiSettings className="me-1" />Paramètres</button>}
        <button className="btn btn-outline-primary btn-sm" onClick={async () => { try { saveBlob(await api.get("/hr/payrolls/export/", { params: { mois, annee }, responseType: "blob" }), "livre_de_paie.csv") } catch (e) { fb.fail(e) } }}><FiDownload className="me-1" />Livre de paie</button>
        {canValidate && <button className="btn btn-primary btn-sm" disabled={busy} onClick={() => run(() => api.post("/hr/payrolls/generate/", { mois, annee }), (r) => `Paie calculée : ${r.data.crees} créée(s), ${r.data.recalcules} recalculée(s), ${r.data.ignores} déjà validée(s).`)}><FiRefreshCw className="me-1" />Calculer la paie du mois</button>}
      </PageHeader>
      {fb.banner}

      {summary && (
        <div className="mz-kpis">
          {Object.entries(summary.par_devise || {}).map(([cur, v]) => (
            <Kpi key={cur} label={`Masse salariale nette (${cur})`} value={fmtMoney(v.net, cur)} hint={`${v.n} bulletin(s) · brut ${fmtMoney(v.brut, cur)}`} />
          ))}
          {Object.entries(summary.par_devise || {}).map(([cur, v]) => (
            <Kpi key={`c${cur}`} label={`Coût employeur (${cur})`} value={fmtMoney(v.cout, cur)} hint={`INSS ${fmtMoney(v.inss, cur)} · IPR ${fmtMoney(v.ipr, cur)}`} />
          ))}
          <Kpi label="À valider" value={count("en_attente")} tone={count("en_attente") ? "warning" : undefined} />
          <Kpi label="Validés / payés" value={`${count("valide")} / ${count("paye")}`} />
        </div>
      )}

      <div className="mz-card">
        <div className="mz-toolbar">
          <Tabs tabs={[{ key: "", label: "Tous", count: rows?.length }, { key: "en_attente", label: "Brouillons", count: count("en_attente") }, { key: "valide", label: "Validés", count: count("valide") }, { key: "paye", label: "Payés", count: count("paye") }, { key: "annule", label: "Annulés", count: count("annule") }]} value={statut} onChange={setStatut} />
          {canValidate && count("en_attente") > 0 && <button className="btn btn-primary btn-sm" onClick={() => setAsk({ title: `Valider la paie de ${MOIS[mois - 1]} ${annee}`, message: `${count("en_attente")} bulletin(s) seront recalculés puis validés : le pointage du mois sera verrouillé.`, confirmLabel: "Valider", onConfirm: () => run(() => api.post("/hr/payrolls/validate-month/", { mois, annee }), (r) => `${r.data.valides} bulletin(s) validé(s).`) })}><FiCheckCircle className="me-1" />Valider tout le mois</button>}
        </div>
        {rows === null ? <Loading /> : shown.length === 0 ? <Empty title="Aucun bulletin">{canValidate ? "Cliquez sur « Calculer la paie du mois »." : "Aucun bulletin pour cette période."}</Empty> : (
          <div className="mz-table-wrap"><table className="mz-table">
            <thead><tr><th>Employé</th><th>Mode</th><th>Base</th><th>Heures</th><th>Brut imposable</th><th>INSS</th><th>IPR</th><th>Net à payer</th><th>Statut</th><th className="mz-actions"></th></tr></thead>
            <tbody>{shown.map((p) => (
              <tr key={p.id}>
                <td><div className="mz-strong">{p.employee_name}</div><div className="mz-muted">{p.employee_id} · {p.position_display}</div></td>
                <td className="mz-muted">{p.prestation_type === "permanent" ? "Permanent" : "Vacataire"}{Number(p.jours_absence_injustifiee) > 0 && <div style={{ color: "var(--color-danger)" }}>{p.jours_absence_injustifiee} j d'absence</div>}</td>
                <td>{fmtMoney(p.base_salary, p.currency)}</td>
                <td className="mz-muted">{Number(p.heures_cours) > 0 && <div>{p.heures_cours} h cours</div>}{Number(p.heures_complementaires) > 0 && <div>+{p.heures_complementaires} h compl.</div>}{Number(p.heures_supplementaires) > 0 && <div>+{p.heures_supplementaires} h sup.</div>}</td>
                <td>{fmtMoney(p.brut_imposable, p.currency)}</td>
                <td className="mz-muted">{fmtMoney(p.inss_salarie, p.currency)}</td>
                <td className="mz-muted">{fmtMoney(p.ipr, p.currency)}</td>
                <td className="mz-strong">{fmtMoney(p.net_salary, p.currency)}</td>
                <td><Pill tone={TONE[p.status]}>{p.status_label}</Pill>{p.payment_date && <div className="mz-muted">le {fmtDate(p.payment_date)}</div>}</td>
                <td className="mz-actions">
                  <button className="mz-icon-btn" title="Détail" onClick={() => setDetail({ ...p })}><FiEye /></button>
                  <button className="mz-icon-btn" title="Bulletin PDF" onClick={async () => { try { saveBlob(await api.get(`/hr/payrolls/${p.id}/generate-payslip/`, { responseType: "blob" }), "bulletin.pdf") } catch (e) { fb.fail(e) } }}><FiFileText /></button>
                  {p.status === "en_attente" && canValidate && <button className="mz-icon-btn mz-icon-btn--primary" onClick={() => run(() => api.post(`/hr/payrolls/${p.id}/validate/`), "Bulletin validé.")}><FiCheckCircle /> Valider</button>}
                  {p.status === "valide" && canPay && <button className="mz-icon-btn mz-icon-btn--primary" onClick={() => setAsk({ title: `Payer ${p.employee_name}`, message: `${fmtMoney(p.net_salary, p.currency)} — l'employé sera notifié.`, confirmLabel: "Confirmer le paiement", onConfirm: () => run(() => api.post(`/hr/payrolls/${p.id}/mark_paid/`, { payment_method: "virement" }), "Salaire payé.") })}><FiDollarSign /> Payer</button>}
                  {["en_attente", "valide"].includes(p.status) && canValidate && <button className="mz-icon-btn" title="Annuler" onClick={() => setAsk({ title: "Annuler le bulletin", input: { label: "Motif", required: true }, danger: true, confirmLabel: "Annuler le bulletin", onConfirm: (reason) => run(() => api.post(`/hr/payrolls/${p.id}/cancel/`, { reason }), "Bulletin annulé.") })}><FiX /></button>}
                </td>
              </tr>))}</tbody>
          </table></div>
        )}
      </div>

      {detail && <PayrollDetail p={detail} canEdit={canValidate} onClose={() => setDetail(null)} onSaved={() => { setDetail(null); fb.ok("Bulletin recalculé."); load() }} onError={fb.fail} />}
      {settings && <PayrollSettingsModal value={settings} onClose={() => setSettings(null)} onSaved={() => { setSettings(null); fb.ok("Paramètres de paie enregistrés. Recalculez les brouillons du mois.") }} onError={fb.fail} />}
      <ConfirmDialog ask={ask} onClose={() => setAsk(null)} />
    </div>
  )
}

function PayrollDetail({ p, canEdit, onClose, onSaved, onError }) {
  const [bonuses, setBonuses] = useState(p.bonuses)
  const [deductions, setDeductions] = useState(p.deductions)
  const [notes, setNotes] = useState(p.notes || "")
  const c = p.currency
  const line = (label, value, strong) => value !== null && value !== undefined && Number(value) !== 0 && (
    <tr><td>{label}</td><td style={{ textAlign: "right", fontWeight: strong ? 700 : 400 }}>{fmtMoney(value, c)}</td></tr>)
  const d = p.details || {}
  return (
    <Modal show onHide={onClose} size="lg" centered scrollable>
      <Modal.Header closeButton><Modal.Title style={{ fontSize: "1.05rem" }}>{p.employee_name} — {p.period_label} <Pill tone={TONE[p.status]}>{p.status_label}</Pill></Modal.Title></Modal.Header>
      <Modal.Body>
        <div className="row g-3">
          <div className="col-md-6">
            <table className="mz-table"><tbody>
              {p.prestation_type === "permanent"
                ? <>{line("Salaire mensuel complet", d.salaire_mensuel_complet)}{line(`Absences non justifiées (${p.jours_absence_injustifiee} j)`, p.retenue_absences && -p.retenue_absences)}</>
                : line(`Vacation : ${p.heures_prestees || 0} h × ${p.salaire_horaire}`, p.base_salary)}
              {line(`Heures complémentaires (${p.heures_complementaires} h)`, p.montant_heures_complementaires)}
              {line(`Heures supplémentaires (${p.heures_supplementaires} h)`, p.montant_heures_supplementaires)}
              {line("Primes", p.bonuses)}
              {line("Brut imposable", p.brut_imposable, true)}
              {line("Indemnités non imposables", p.indemnites)}
              {line("INSS salarié", p.inss_salarie && -p.inss_salarie)}
              {line("IPR / IRPP", p.ipr && -p.ipr)}
              {line("Avances / autres retenues", p.deductions && -p.deductions)}
              {line("Net à payer", p.net_salary, true)}
            </tbody></table>
            <div className="mz-muted mt-2" style={{ fontSize: "0.82rem" }}>Charges patronales : INSS {fmtMoney(p.inss_patronal, c)} · INPP {fmtMoney(p.inpp, c)} · ONEM {fmtMoney(p.onem, c)} — coût employeur {fmtMoney(p.cout_employeur, c)}</div>
          </div>
          <div className="col-md-6">
            <h6 className="fw-semibold">Heures de cours tenues</h6>
            {(d.cours || []).length === 0 ? <p className="mz-muted">Aucune séance clôturée ce mois.</p> : (
              <table className="mz-table"><tbody>{d.cours.map((x) => <tr key={x.course_id}><td>{x.course}<div className="mz-muted">{x.sessions} séance(s)</div></td><td style={{ textAlign: "right" }}>{x.hours} h</td></tr>)}</tbody></table>
            )}
            {d.charge_statutaire ? <p className="mz-muted mt-2">Charge statutaire : {d.charge_statutaire} h / mois.</p> : null}
            {canEdit && p.status === "en_attente" && (<>
              <h6 className="fw-semibold mt-3">Éléments variables</h6>
              <Field label={`Primes (${c})`}><input type="number" step="0.01" className="form-control" value={bonuses} onChange={(e) => setBonuses(e.target.value)} /></Field>
              <Field label={`Avances / autres retenues (${c})`}><input type="number" step="0.01" className="form-control" value={deductions} onChange={(e) => setDeductions(e.target.value)} /></Field>
              <Field label="Notes"><textarea className="form-control" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} /></Field>
            </>)}
          </div>
        </div>
      </Modal.Body>
      <Modal.Footer>
        <button className="btn btn-outline-primary btn-sm" onClick={onClose}>Fermer</button>
        {canEdit && p.status === "en_attente" && <button className="btn btn-primary btn-sm" onClick={async () => {
          try { await api.patch(`/hr/payrolls/${p.id}/`, { bonuses: bonuses || 0, deductions: deductions || 0, notes }); onSaved() } catch (e) { onError(e) }
        }}>Enregistrer et recalculer</button>}
      </Modal.Footer>
    </Modal>
  )
}

function PayrollSettingsModal({ value, onClose, onSaved, onError }) {
  const [v, setV] = useState({ ...value, ipr_text: (value.ipr_brackets || []).map(([u, r]) => `${u ?? "∞"} : ${r}`).join("\n") })
  const num = (k, label, hint) => <div className="col-md-4"><Field label={label} hint={hint}><input type="number" step="0.01" className="form-control" value={v[k]} onChange={(e) => setV({ ...v, [k]: e.target.value })} /></Field></div>
  const save = async () => {
    try {
      const brackets = v.ipr_text.split("\n").map((l) => l.trim()).filter(Boolean).map((l) => {
        const [u, r] = l.split(":").map((x) => x.trim().replace(/\s/g, "").replace(",", "."))
        return [u === "∞" || u === "" ? null : Number(u), Number(r)]
      })
      const payload = { ...v, ipr_brackets: brackets }; delete payload.ipr_text; delete payload.updated_at
      await api.patch("/hr/payroll-settings/", payload); onSaved()
    } catch (e) { onError(e) }
  }
  return (
    <Modal show onHide={onClose} size="lg" centered>
      <Modal.Header closeButton><Modal.Title style={{ fontSize: "1.05rem" }}>Paramètres de paie</Modal.Title></Modal.Header>
      <Modal.Body>
        <div className="mz-banner mb-3" style={{ background: "var(--color-pillWarningBg, #FFEBD6)", color: "#8a4a0c" }}>Valeurs indicatives pour la RDC : faites-les confirmer par votre comptable (taux en vigueur, barème IPR/IRPP, taux de change).</div>
        <div className="row">
          {num("working_days_per_month", "Jours de référence / mois", "Base du prorata des absences")}
          {num("hours_per_day", "Heures par jour", "Au-delà : heures supplémentaires")}
          {num("overtime_multiplier", "Majoration heures sup.", "Ex. 1,3 = +30 %")}
          {num("inss_employee_rate", "INSS salarié (%)")}
          {num("inss_employer_rate", "INSS patronal (%)")}
          {num("inpp_rate", "INPP (%)")}
          {num("onem_rate", "ONEM (%)")}
          {num("exchange_rate_cdf_per_usd", "Taux de change (CDF / USD)", "Pour appliquer le barème en CDF")}
          {num("ipr_cap_rate", "Plafond IPR (% du revenu)")}
          {num("ipr_dependent_reduction", "Réduction / personne à charge (%)")}
          {num("ipr_max_dependents", "Personnes à charge max.")}
          {num("late_tolerance_minutes", "Tolérance de retard (min)")}
        </div>
        <Field label="Barème annuel IPR en CDF (une tranche par ligne : plafond : taux)" hint="Dernière ligne : ∞ : taux">
          <textarea className="form-control" rows={5} style={{ fontFamily: "monospace" }} value={v.ipr_text} onChange={(e) => setV({ ...v, ipr_text: e.target.value })} />
        </Field>
      </Modal.Body>
      <Modal.Footer>
        <button className="btn btn-outline-primary btn-sm" onClick={onClose}>Annuler</button>
        <button className="btn btn-primary btn-sm" onClick={save}>Enregistrer</button>
      </Modal.Footer>
    </Modal>
  )
}
