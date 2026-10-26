/**
 * Espace personnel du membre du personnel : pointage d'arrivée / de départ, présences du mois,
 * bulletins de paie validés ou payés.
 */
import { useCallback, useEffect, useState } from "react"
import { FiLogIn, FiLogOut, FiFileText } from "react-icons/fi"
import api, { saveBlob } from "../../services/api"
import { Empty, Kpi, Loading, PageHeader, Pill } from "../../components/mz/Kit"
import { fmtDate, fmtMoney, listOf, useFeedback } from "../../components/mz/helpers"

export default function MonEspaceRH() {
  const fb = useFeedback()
  const [me, setMe] = useState(null)
  const [att, setAtt] = useState(null)
  const [pays, setPays] = useState(null)
  const now = new Date()
  const load = useCallback(async () => {
    try {
      const [m, a, p] = await Promise.all([
        api.get("/hr/attendance/me/"),
        api.get("/hr/attendance/", { params: { mois: now.getMonth() + 1, annee: now.getFullYear(), page_size: 62 } }),
        api.get("/hr/payrolls/", { params: { page_size: 24 } }),
      ])
      setMe(m.data); setAtt(listOf(a.data)); setPays(listOf(p.data))
    } catch (e) { fb.fail(e); setMe({}); setAtt([]); setPays([]) }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { load() }, [load])
  const act = async (url, msg) => { try { await api.post(url); fb.ok(msg); load() } catch (e) { fb.fail(e) } }
  if (me === null) return <div className="mz-page"><Loading /></div>
  const t = me.today
  const count = (s) => (att || []).filter((x) => x.status === s).length
  return (
    <div className="mz-page">
      <PageHeader title="Mon espace RH" subtitle="Pointage, présences et bulletins de paie." />
      {fb.banner}
      {!me.employee ? <Empty title="Aucun dossier du personnel">Votre compte n'est pas encore rattaché à un dossier RH : contactez le SGAD.</Empty> : (<>
        <div className="mz-card mb-3"><div className="mz-card-body d-flex align-items-center gap-3 flex-wrap">
          <div style={{ flex: 1 }}>
            <div className="fw-semibold">Aujourd'hui, {now.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}</div>
            <div className="mz-muted" style={{ color: "var(--color-textSecondary)" }}>
              {t ? <>Arrivée {t.check_in?.slice(0, 5) || "—"} · départ {t.check_out?.slice(0, 5) || "—"} · <Pill code={t.status}>{t.status_label}</Pill></> : "Pas encore pointé."}
            </div>
          </div>
          <button className="btn btn-primary btn-sm" disabled={!!t?.check_in} onClick={() => act("/hr/attendance/check-in/", "Arrivée enregistrée.")}><FiLogIn className="me-1" />Pointer l'arrivée</button>
          <button className="btn btn-outline-primary btn-sm" disabled={!t?.check_in || !!t?.check_out} onClick={() => act("/hr/attendance/check-out/", "Départ enregistré.")}><FiLogOut className="me-1" />Pointer le départ</button>
        </div></div>
        <div className="mz-kpis">
          <Kpi label="Jours présents (mois)" value={count("present") + count("retard")} />
          <Kpi label="Retards" value={count("retard")} />
          <Kpi label="Absences non justifiées" value={count("absent_injustifie")} tone={count("absent_injustifie") ? "danger" : undefined} />
          <Kpi label="Congés" value={count("conge")} />
        </div>
        <div className="mz-card"><div className="mz-toolbar"><strong>Mes bulletins de paie</strong></div>
          {pays.length === 0 ? <Empty title="Aucun bulletin validé" /> : (
            <div className="mz-table-wrap"><table className="mz-table">
              <thead><tr><th>Période</th><th>Brut imposable</th><th>Net à payer</th><th>Statut</th><th className="mz-actions"></th></tr></thead>
              <tbody>{pays.map((p) => (
                <tr key={p.id}><td className="mz-strong">{p.period_label}</td><td>{fmtMoney(p.brut_imposable, p.currency)}</td><td className="mz-strong">{fmtMoney(p.net_salary, p.currency)}</td>
                  <td><Pill code={p.status === "paye" ? "paye" : "valid"}>{p.status_label}</Pill>{p.payment_date && <div className="mz-muted">le {fmtDate(p.payment_date)}</div>}</td>
                  <td className="mz-actions"><button className="mz-icon-btn" onClick={async () => { try { saveBlob(await api.get(`/hr/payrolls/${p.id}/generate-payslip/`, { responseType: "blob" }), "bulletin.pdf") } catch (e) { fb.fail(e) } }}><FiFileText /> PDF</button></td></tr>
              ))}</tbody>
            </table></div>
          )}
        </div>
      </>)}
    </div>
  )
}
