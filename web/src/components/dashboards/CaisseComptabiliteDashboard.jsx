/** Caisse / comptabilité : encaissements réels par devise (USD et CDF ne s'additionnent jamais). */
import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { FiArrowRight, FiSearch } from "react-icons/fi"
import RoleHome from "./RoleHome"
import { fmtDate, fmtMoney } from "../mz/helpers"

const byCur = (o) => {
  const e = Object.entries(o || {}).filter(([, v]) => v)
  return e.length ? e.map(([c, v]) => fmtMoney(v, c)).join(" · ") : "0"
}

export default function CaisseComptabiliteDashboard({ user }) {
  const navigate = useNavigate()
  const [code, setCode] = useState("")
  const isCashier = user?.role === "caisse"
  return (
    <RoleHome user={user} title={isCashier ? "Caisse" : "Comptabilité"}
      subtitle="Encaissements calculés en direct ; chaque devise est suivie séparément."
      actions={[{ label: "Caisse", to: "/caisse" }, { label: "Barèmes & sessions", to: "/finances" }, ...(isCashier ? [] : [{ label: "Paie", to: "/rh/payrolls" }])]}
      tiles={(c) => {
        const k = c.caisse || {}
        return [
          ...(isCashier ? [{ label: "Ma session de caisse", value: k.session_ouverte ? "Ouverte" : "Fermée", tone: k.session_ouverte ? undefined : "warning",
            hint: k.session_ouverte ? `depuis ${fmtDate(k.session_depuis, true)} · ${k.session_encaissements} encaissement(s)` : "ouvrir la session avant d'encaisser des espèces", to: "/finances" }] : []),
          { label: "Encaissé aujourd'hui", value: byCur(k.aujourdhui), hint: `${k.aujourdhui_nb ?? 0} paiement(s) confirmé(s)` },
          { label: "Encaissé ce mois", value: byCur(k.mois) },
          { label: "Paiements à confirmer", value: k.en_attente ?? 0, tone: k.en_attente ? "warning" : undefined, to: "/comptabilite" },
          { label: "Contre-passations à valider", value: k.contrepassations ?? 0, tone: k.contrepassations ? "warning" : undefined, to: "/finances" },
          { label: "Étudiants avec impayés échus", value: k.impayes_echus ?? 0, tone: k.impayes_echus ? "danger" : undefined, to: "/finances" },
        ]
      }}>
      <form className="mz-card mt-3" onSubmit={(e) => { e.preventDefault(); if (code.trim()) navigate(`/caisse?code=${encodeURIComponent(code.trim())}`) }}>
        <div className="mz-toolbar"><strong><FiSearch className="me-1" />Bon de paiement</strong></div>
        <div className="d-flex gap-2" style={{ maxWidth: 560 }}>
          <input className="form-control" placeholder="Numéro du BON présenté par l'étudiant (ex. BON-20261025-12345)" value={code} onChange={(e) => setCode(e.target.value)} />
          <button className="btn btn-primary px-3" type="submit">Rechercher <FiArrowRight /></button>
        </div>
      </form>
    </RoleHome>
  )
}
