/**
 * Paramètres de l'établissement : identité (documents officiels) et règles académiques /
 * financières. Modifiables par la direction (DG / PDG) et le PDG ; chaque changement est audité.
 */
import { useEffect, useState } from "react"
import { useSelector } from "react-redux"
import { trashAPI } from "../services/api"
import { hasAnyRole } from "../utils/permissions"
import { Field, Loading, PageHeader } from "../components/mz/Kit"
import { fmtDate, useFeedback } from "../components/mz/helpers"

export default function ParametresInstitution() {
  const { user } = useSelector((s) => s.auth)
  const canEdit = hasAnyRole(user, "pdg", "directeur_general")
  const fb = useFeedback()
  const [data, setData] = useState(null)
  const [saving, setSaving] = useState(false)
  useEffect(() => { trashAPI.getSettings().then(({ data }) => setData(data)).catch((e) => fb.fail(e)) }, []) // eslint-disable-line react-hooks/exhaustive-deps
  if (!data) return <div className="mz-page">{fb.banner}<Loading /></div>
  const set = (k, v) => setData({ ...data, [k]: v })
  const save = async () => {
    setSaving(true)
    try {
      const payload = { institution_name: data.institution_name, institution_city: data.institution_city, rector_name: data.rector_name,
        sga_name: data.sga_name, exam_min_paid_percent: Number(data.exam_min_paid_percent),
        results_require_clearance: data.results_require_clearance, admission_requires_application_fee: data.admission_requires_application_fee }
      const { data: saved } = await trashAPI.updateSettings(payload); setData(saved); fb.ok("Paramètres enregistrés.")
    } catch (e) { fb.fail(e) } finally { setSaving(false) }
  }
  return (
    <div className="mz-page" style={{ maxWidth: 900 }}>
      <PageHeader title="Paramètres de l'établissement" subtitle={data.updated_at ? `Dernière modification le ${fmtDate(data.updated_at, true)}${data.updated_by_name ? ` par ${data.updated_by_name}` : ""}` : ""} />
      {fb.banner}
      <fieldset disabled={!canEdit}>
        <div className="mz-card mb-3"><div className="mz-card-body">
          <h6 className="fw-bold mb-3">Identité (reprise sur les PV, relevés, attestations et diplômes)</h6>
          <div className="row">
            <div className="col-md-8"><Field label="Nom de l'établissement"><input className="form-control" value={data.institution_name || ""} onChange={(e) => set("institution_name", e.target.value)} /></Field></div>
            <div className="col-md-4"><Field label="Ville"><input className="form-control" value={data.institution_city || ""} onChange={(e) => set("institution_city", e.target.value)} /></Field></div>
            <div className="col-md-6"><Field label="Recteur"><input className="form-control" value={data.rector_name || ""} onChange={(e) => set("rector_name", e.target.value)} /></Field></div>
            <div className="col-md-6"><Field label="Secrétaire général académique (signataire)"><input className="form-control" value={data.sga_name || ""} onChange={(e) => set("sga_name", e.target.value)} /></Field></div>
          </div>
        </div></div>
        <div className="mz-card mb-3"><div className="mz-card-body">
          <h6 className="fw-bold mb-3">Règles académiques et financières</h6>
          <Field label="Part minimale des frais obligatoires échus réglée pour accéder aux examens (%)" hint="Seules les tranches dont l’échéance est passée sont exigées. Même seuil pour la consultation détaillée des résultats et l’émission des documents officiels.">
            <input type="number" min={0} max={100} className="form-control" style={{ width: 120 }} value={data.exam_min_paid_percent} onChange={(e) => set("exam_min_paid_percent", e.target.value)} />
          </Field>
          <div className="form-check mb-2"><input id="rc" type="checkbox" className="form-check-input" checked={data.results_require_clearance} onChange={(e) => set("results_require_clearance", e.target.checked)} />
            <label htmlFor="rc" className="form-check-label">Résultats détaillés et documents officiels réservés aux étudiants en règle</label></div>
          <div className="form-check"><input id="af" type="checkbox" className="form-check-input" checked={data.admission_requires_application_fee} onChange={(e) => set("admission_requires_application_fee", e.target.checked)} />
            <label htmlFor="af" className="form-check-label">L'admission exige l'encaissement préalable des frais de dossier</label></div>
        </div></div>
      </fieldset>
      <div className="mz-muted mb-3" style={{ color: "var(--color-textSecondary)", fontSize: "0.85rem" }}>La durée de conservation de la corbeille ({data.trash_retention_days} jours) se règle depuis la page Corbeille (PDG).</div>
      {canEdit && <button className="btn btn-primary px-4" disabled={saving} onClick={save}>Enregistrer</button>}
    </div>
  )
}
