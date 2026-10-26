/**
 * Finances universitaires : barèmes officiels (facturation automatique à l'inscription),
 * sessions de caisse (ouverture / clôture avec écarts), contre-passations à double validation.
 */
import { useCallback, useEffect, useState } from "react"
import { useSelector } from "react-redux"
import { Modal } from "react-bootstrap"
import { FiPlus, FiZap, FiUnlock, FiLock, FiCheck, FiX, FiDownload } from "react-icons/fi"
import { academicYearsAPI, filieresAPI, financeAPI, pilotageAPI, saveBlob } from "../services/api"
import { hasAnyRole } from "../utils/permissions"
import { ConfirmDialog, Empty, Field, Kpi, Loading, PageHeader, Pill, Tabs } from "../components/mz/Kit"
import { fmtDate, fmtMoney, listOf, useFeedback } from "../components/mz/helpers"

export default function FinancesScolarite() {
  const { user } = useSelector((s) => s.auth)
  const isCashier = hasAnyRole(user, "caisse")
  const tabs = [
    { key: "baremes", label: "Barèmes" },
    ...(isCashier ? [{ key: "caisse", label: "Ma caisse" }] : []),
    { key: "sessions", label: "Sessions de caisse" },
    { key: "contrepassations", label: "Contre-passations" },
  ]
  const [tab, setTab] = useState(isCashier ? "caisse" : "baremes")
  const fb = useFeedback()
  return (
    <div className="mz-page">
      <PageHeader title="Finances de la scolarité" subtitle="Les montants dus naissent des barèmes ; l'encaissement se fait en session de caisse ; aucun paiement ne se supprime, il se contre-passe.">
        <button className="btn btn-outline-primary btn-sm px-3" onClick={async () => { try { saveBlob(await pilotageAPI.exportCSV("impayes"), "impayes.csv") } catch (e) { fb.fail(e) } }}>
          <FiDownload className="me-1" /> Impayés (CSV)</button>
      </PageHeader>
      {fb.banner}
      <div className="mb-3"><Tabs tabs={tabs} value={tab} onChange={setTab} /></div>
      {tab === "baremes" && <Baremes user={user} fb={fb} />}
      {tab === "caisse" && <MaCaisse fb={fb} />}
      {tab === "sessions" && <Sessions />}
      {tab === "contrepassations" && <Contrepassations user={user} fb={fb} />}
    </div>
  )
}

function Baremes({ user, fb }) {
  const canWrite = hasAnyRole(user, "sgad", "pdg", "directeur_general")
  const [years, setYears] = useState([])
  const [year, setYear] = useState("")
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState(null)
  const [feeTypes, setFeeTypes] = useState([])
  const [filieres, setFilieres] = useState([])
  const [ask, setAsk] = useState(null)

  useEffect(() => {
    academicYearsAPI.list().then(({ data }) => { const ys = listOf(data); setYears(ys); const c = ys.find((y) => y.is_current) || ys[0]; if (c) setYear(String(c.id)) }).catch(() => {})
    financeAPI.feeTypes().then(({ data }) => setFeeTypes(listOf(data))).catch(() => {})
    filieresAPI.getAll({ page_size: 300 }).then(({ data }) => setFilieres(listOf(data))).catch(() => {})
  }, [])
  const load = useCallback(async () => {
    if (!year) return
    setLoading(true)
    try { const { data } = await financeAPI.baremes({ academic_year: year, page_size: 300 }); setRows(listOf(data)) }
    catch (e) { fb.fail(e) } finally { setLoading(false) }
  }, [year]) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { load() }, [load])

  const save = async () => {
    try {
      const payload = { ...form, academic_year: year, filiere: form.filiere || null }
      if (form.id) await financeAPI.updateBareme(form.id, payload); else await financeAPI.createBareme(payload)
      setForm(null); fb.ok("Barème enregistré. Utilisez « Facturer » pour l'appliquer aux inscriptions existantes."); load()
    } catch (e) { fb.fail(e) }
  }
  const totals = rows.reduce((acc, r) => { acc[r.currency] = (acc[r.currency] || 0) + Number(r.amount); return acc }, {})

  return (
    <div className="mz-card">
      <div className="mz-toolbar">
        <div className="d-flex gap-2 align-items-center">
          <select className="form-select form-select-sm" style={{ width: 150 }} value={year} onChange={(e) => setYear(e.target.value)}>
            {years.map((y) => <option key={y.id} value={y.id}>{y.name}</option>)}
          </select>
          <span className="mz-muted" style={{ color: "var(--color-textSecondary)", fontSize: "0.85rem" }}>
            {Object.entries(totals).map(([c, t]) => fmtMoney(t, c)).join(" · ")}
          </span>
        </div>
        {canWrite && <button className="btn btn-primary btn-sm px-3" onClick={() => setForm({ libelle: "", fee_type: "", amount: "", currency: "USD", due_date: "", niveau: "", vacation: "", filiere: "", is_mandatory: true, required_for_admin_validation: false })}><FiPlus className="me-1" />Nouveau barème</button>}
      </div>
      {loading ? <Loading /> : rows.length === 0 ? <Empty title="Aucun barème pour cette année">Définissez les frais officiels : ils seront facturés automatiquement à chaque inscription.</Empty> : (
        <div className="mz-table-wrap"><table className="mz-table">
          <thead><tr><th>Libellé</th><th>Montant</th><th>Cible</th><th>Échéance</th><th>Règles</th><th>Facturés</th><th className="mz-actions"></th></tr></thead>
          <tbody>{rows.map((b) => (
            <tr key={b.id}>
              <td><div className="mz-strong">{b.libelle}</div><div className="mz-muted">{b.fee_type_name}</div></td>
              <td className="mz-strong">{fmtMoney(b.amount, b.currency)}</td>
              <td className="mz-muted">{b.filiere_name || "Toutes filières"} · {b.niveau || "tous niveaux"} · {b.vacation || "toutes vacations"}</td>
              <td className="mz-muted">{fmtDate(b.due_date)}</td>
              <td>{b.is_mandatory ? <Pill tone="info">Obligatoire</Pill> : <Pill>Facultatif</Pill>} {b.required_for_admin_validation && <Pill tone="warning">Requis à l'inscription</Pill>}</td>
              <td>{b.billed_count}</td>
              <td className="mz-actions">{canWrite && (<>
                <button className="mz-icon-btn" onClick={() => setForm({ ...b, filiere: b.filiere || "" })}>Modifier</button>
                <button className="mz-icon-btn mz-icon-btn--primary" onClick={() => setAsk({ title: "Facturer ce barème", message: "Crée la dette correspondante pour chaque inscription active de l'année qui ne l'a pas encore.", confirmLabel: "Facturer",
                  onConfirm: async () => { try { const { data } = await financeAPI.applyBareme(b.id); fb.ok(`${data.created} facture(s) créée(s).`); load() } catch (e) { fb.fail(e) } } })}><FiZap /> Facturer</button>
              </>)}</td>
            </tr>))}</tbody>
        </table></div>
      )}
      {form && (
        <Modal show onHide={() => setForm(null)} centered>
          <Modal.Header closeButton><Modal.Title style={{ fontSize: "1.05rem" }}>{form.id ? "Modifier le barème" : "Nouveau barème"}</Modal.Title></Modal.Header>
          <Modal.Body>
            <Field label="Libellé"><input className="form-control" value={form.libelle} onChange={(e) => setForm({ ...form, libelle: e.target.value })} placeholder="Minerval L1 — 1re tranche" /></Field>
            <Field label="Type de frais"><select className="form-select" value={form.fee_type} onChange={(e) => setForm({ ...form, fee_type: e.target.value })}>
              <option value="">— Choisir —</option>{feeTypes.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}</select></Field>
            <div className="row">
              <div className="col-7"><Field label="Montant"><input type="number" min="0" step="0.01" className="form-control" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} /></Field></div>
              <div className="col-5"><Field label="Devise"><select className="form-select" value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })}><option>USD</option><option>CDF</option></select></Field></div>
            </div>
            <Field label="Échéance"><input type="date" className="form-control" value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} /></Field>
            <div className="row">
              <div className="col-4"><Field label="Filière"><select className="form-select" value={form.filiere} onChange={(e) => setForm({ ...form, filiere: e.target.value })}>
                <option value="">Toutes</option>{filieres.map((f) => <option key={f.id} value={f.id}>{f.nom}</option>)}</select></Field></div>
              <div className="col-4"><Field label="Niveau"><select className="form-select" value={form.niveau} onChange={(e) => setForm({ ...form, niveau: e.target.value })}>
                <option value="">Tous</option>{["L1", "L2", "L3", "M1", "M2"].map((n) => <option key={n}>{n}</option>)}</select></Field></div>
              <div className="col-4"><Field label="Vacation"><select className="form-select" value={form.vacation} onChange={(e) => setForm({ ...form, vacation: e.target.value })}>
                <option value="">Toutes</option><option value="jour">Jour</option><option value="soir">Soir</option></select></Field></div>
            </div>
            <div className="form-check"><input id="bm" type="checkbox" className="form-check-input" checked={form.is_mandatory} onChange={(e) => setForm({ ...form, is_mandatory: e.target.checked })} /><label htmlFor="bm" className="form-check-label">Obligatoire (compte pour l'accès aux examens et aux résultats)</label></div>
            <div className="form-check"><input id="br" type="checkbox" className="form-check-input" checked={form.required_for_admin_validation} onChange={(e) => setForm({ ...form, required_for_admin_validation: e.target.checked })} /><label htmlFor="br" className="form-check-label">Doit être réglé pour valider l'inscription administrative</label></div>
          </Modal.Body>
          <Modal.Footer>
            <button className="btn btn-outline-primary btn-sm" onClick={() => setForm(null)}>Annuler</button>
            <button className="btn btn-primary btn-sm" disabled={!form.libelle || !form.fee_type || !form.amount || !form.due_date} onClick={save}>Enregistrer</button>
          </Modal.Footer>
        </Modal>
      )}
      <ConfirmDialog ask={ask} onClose={() => setAsk(null)} />
    </div>
  )
}

function MaCaisse({ fb }) {
  const [session, setSession] = useState(undefined)
  const [floatUSD, setFloatUSD] = useState("0")
  const [floatCDF, setFloatCDF] = useState("0")
  const [counted, setCounted] = useState({ USD: "", CDF: "" })
  const [justification, setJustification] = useState("")
  const load = useCallback(async () => { try { const { data } = await financeAPI.currentCashSession(); setSession(data) } catch { setSession(null) } }, [])
  useEffect(() => { load() }, [load])
  if (session === undefined) return <Loading />
  if (!session) return (
    <div className="mz-card"><div className="mz-card-body">
      <h6 className="fw-semibold">Ouvrir ma session de caisse</h6>
      <p className="mz-muted" style={{ color: "var(--color-textSecondary)" }}>Les encaissements en espèces ne sont possibles qu'avec une session ouverte. Indiquez le fonds de caisse remis.</p>
      <div className="d-flex gap-2 flex-wrap align-items-end">
        <Field label="Fonds USD"><input type="number" className="form-control" style={{ width: 140 }} value={floatUSD} onChange={(e) => setFloatUSD(e.target.value)} /></Field>
        <Field label="Fonds CDF"><input type="number" className="form-control" style={{ width: 160 }} value={floatCDF} onChange={(e) => setFloatCDF(e.target.value)} /></Field>
        <button className="btn btn-primary mb-3" onClick={async () => { try { await financeAPI.openCashSession({ USD: floatUSD || 0, CDF: floatCDF || 0 }); fb.ok("Session de caisse ouverte."); load() } catch (e) { fb.fail(e) } }}><FiUnlock className="me-1" />Ouvrir</button>
      </div>
    </div></div>
  )
  const expected = session.live_expected || {}
  return (
    <>
      <div className="mz-kpis">
        <Kpi label="Ouverte le" value={fmtDate(session.opened_at, true)} />
        <Kpi label="Encaissements" value={session.payments_count} />
        {Object.entries(expected).map(([c, v]) => <Kpi key={c} label={`Attendu en caisse (${c})`} value={fmtMoney(v, c)} />)}
      </div>
      <div className="mz-card"><div className="mz-card-body">
        <h6 className="fw-semibold">Clôturer la session</h6>
        <p style={{ color: "var(--color-textSecondary)" }}>Comptez les espèces par devise. Tout écart doit être justifié ; il est conservé au journal.</p>
        <div className="d-flex gap-2 flex-wrap">
          {["USD", "CDF"].map((c) => <Field key={c} label={`Compté ${c}`}><input type="number" className="form-control" style={{ width: 160 }} value={counted[c]} onChange={(e) => setCounted({ ...counted, [c]: e.target.value })} /></Field>)}
        </div>
        <Field label="Justification d'écart (si nécessaire)"><textarea className="form-control" rows={2} value={justification} onChange={(e) => setJustification(e.target.value)} /></Field>
        <button className="btn btn-primary" onClick={async () => {
          try {
            const c = Object.fromEntries(Object.entries(counted).filter(([, v]) => v !== ""))
            const { data } = await financeAPI.closeCashSession(session.id, c, justification)
            fb.ok(`Session clôturée. Écart : ${Object.entries(data.difference).map(([k, v]) => `${v} ${k}`).join(", ") || "aucun"}.`); load()
          } catch (e) { fb.fail(e) }
        }}><FiLock className="me-1" />Clôturer</button>
      </div></div>
    </>
  )
}

function Sessions() {
  const [rows, setRows] = useState(null)
  useEffect(() => { financeAPI.cashSessions({ page_size: 100 }).then(({ data }) => setRows(listOf(data))).catch(() => setRows([])) }, [])
  if (rows === null) return <Loading />
  return (
    <div className="mz-card">{rows.length === 0 ? <Empty title="Aucune session de caisse" /> : (
      <div className="mz-table-wrap"><table className="mz-table">
        <thead><tr><th>Caissier</th><th>Ouverture</th><th>Clôture</th><th>Attendu</th><th>Compté</th><th>Écart</th><th>Statut</th></tr></thead>
        <tbody>{rows.map((s) => {
          const gap = Object.values(s.difference || {}).some((v) => Number(v) !== 0)
          const fmt = (o) => Object.entries(o || {}).map(([c, v]) => fmtMoney(v, c)).join(" · ") || "—"
          return (<tr key={s.id}>
            <td className="mz-strong">{s.cashier_name}</td><td className="mz-muted">{fmtDate(s.opened_at, true)}</td><td className="mz-muted">{fmtDate(s.closed_at, true)}</td>
            <td>{s.status === "open" ? fmt(s.live_expected) : fmt(s.expected)}</td><td>{fmt(s.counted)}</td>
            <td>{s.status === "closed" ? <Pill tone={gap ? "danger" : "success"}>{gap ? fmt(s.difference) : "Aucun"}</Pill> : "—"}{s.justification && <div className="mz-muted">{s.justification}</div>}</td>
            <td><Pill code={s.status}>{s.status === "open" ? "Ouverte" : "Clôturée"}</Pill></td>
          </tr>)
        })}</tbody>
      </table></div>
    )}</div>
  )
}

function Contrepassations({ user, fb }) {
  const canDecide = hasAnyRole(user, "comptable", "sgad", "pdg")
  const canRequest = hasAnyRole(user, "caisse", "comptable", "pdg")
  const [rows, setRows] = useState(null)
  const [req, setReq] = useState(null)
  const [ask, setAsk] = useState(null)
  const load = useCallback(() => financeAPI.contrepassations({ page_size: 200 }).then(({ data }) => setRows(listOf(data))).catch(() => setRows([])), [])
  useEffect(() => { load() }, [load])
  const [found, setFound] = useState([])
  const search = async (q) => { try { const { data } = await financeAPI.payments({ search: q, status: "confirme", page_size: 20 }); setFound(listOf(data)) } catch { setFound([]) } }
  return (
    <div className="mz-card">
      <div className="mz-toolbar"><span style={{ color: "var(--color-textSecondary)" }}>La personne qui demande ne peut pas valider sa propre demande.</span>
        {canRequest && <button className="btn btn-primary btn-sm px-3" onClick={() => { setReq({ payment: "", reason: "" }); setFound([]) }}><FiPlus className="me-1" />Demander une contre-passation</button>}</div>
      {rows === null ? <Loading /> : rows.length === 0 ? <Empty title="Aucune contre-passation" /> : (
        <div className="mz-table-wrap"><table className="mz-table">
          <thead><tr><th>Paiement</th><th>Étudiant</th><th>Montant</th><th>Motif</th><th>Demandé par</th><th>Statut</th><th className="mz-actions"></th></tr></thead>
          <tbody>{rows.map((c) => (
            <tr key={c.id}>
              <td className="mz-strong">{c.payment_reference}</td><td>{c.student_name}</td><td>{fmtMoney(c.amount, c.currency)}</td>
              <td className="mz-muted" style={{ maxWidth: 240 }}>{c.reason}{c.decision_note && <div>Décision : {c.decision_note}</div>}</td>
              <td className="mz-muted">{c.requested_by_name}<div>{fmtDate(c.requested_at, true)}</div></td>
              <td><Pill code={c.status}>{c.status_label}</Pill>{c.decided_by_name && <div className="mz-muted">par {c.decided_by_name}</div>}</td>
              <td className="mz-actions">{c.status === "pending" && canDecide && c.requested_by_name !== user?.name && (<>
                <button className="mz-icon-btn mz-icon-btn--primary" onClick={() => setAsk({ title: "Approuver la contre-passation", message: "Le paiement sera annulé et le solde de l'étudiant recalculé. Le reçu correspondant apparaîtra comme annulé.", danger: true, confirmLabel: "Approuver",
                  onConfirm: async () => { try { await financeAPI.decideContrepassation(c.id, true, ""); fb.ok("Contre-passation approuvée."); load() } catch (e) { fb.fail(e) } } })}><FiCheck /> Approuver</button>
                <button className="mz-icon-btn" onClick={() => setAsk({ title: "Refuser", input: { label: "Motif", required: true }, confirmLabel: "Refuser",
                  onConfirm: async (note) => { try { await financeAPI.decideContrepassation(c.id, false, note); fb.ok("Demande refusée."); load() } catch (e) { fb.fail(e) } } })}><FiX /> Refuser</button>
              </>)}</td>
            </tr>))}</tbody>
        </table></div>
      )}
      {req && (
        <Modal show onHide={() => setReq(null)} centered>
          <Modal.Header closeButton><Modal.Title style={{ fontSize: "1.05rem" }}>Demander une contre-passation</Modal.Title></Modal.Header>
          <Modal.Body>
            <Field label="Rechercher le paiement (référence, nom)"><input className="form-control" onChange={(e) => search(e.target.value)} /></Field>
            <select className="form-select mb-3" size={5} value={req.payment} onChange={(e) => setReq({ ...req, payment: e.target.value })}>
              {found.map((p) => <option key={p.id} value={p.id}>{p.reference} — {p.student_name} — {fmtMoney(p.amount, p.currency)} ({fmtDate(p.payment_date)})</option>)}
            </select>
            <Field label="Motif"><textarea className="form-control" rows={3} value={req.reason} onChange={(e) => setReq({ ...req, reason: e.target.value })} /></Field>
          </Modal.Body>
          <Modal.Footer>
            <button className="btn btn-outline-primary btn-sm" onClick={() => setReq(null)}>Annuler</button>
            <button className="btn btn-primary btn-sm" disabled={!req.payment || !req.reason.trim()} onClick={async () => {
              try { await financeAPI.requestContrepassation(req.payment, req.reason); setReq(null); fb.ok("Demande transmise pour validation."); load() } catch (e) { fb.fail(e) }
            }}>Envoyer</button>
          </Modal.Footer>
        </Modal>
      )}
      <ConfirmDialog ask={ask} onClose={() => setAsk(null)} />
    </div>
  )
}
