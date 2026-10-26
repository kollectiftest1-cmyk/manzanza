/** Tuiles communes aux chefs de section et de filière (compteurs réels de /stats/home/). */
export const chefTiles = (c) => {
  const f = c.filiere || {}
  return [
    { label: "Groupes (auditoires)", value: f.groupes ?? 0, to: "/auditoires" },
    { label: "Étudiants inscrits", value: f.inscrits ?? 0, to: "/inscriptions-annuelles" },
    { label: "Inscriptions à valider (pédagogique)", value: f.a_valider_pedagogiquement ?? 0, tone: f.a_valider_pedagogiquement ? "warning" : undefined, to: "/inscriptions-annuelles" },
    { label: "Feuilles de notes à approuver", value: f.feuilles_a_approuver ?? 0, tone: f.feuilles_a_approuver ? "warning" : undefined, to: "/validation-notes" },
    { label: "Sujets TFC à valider", value: f.sujets_tfc_a_valider ?? 0, tone: f.sujets_tfc_a_valider ? "warning" : undefined, to: "/memoires" },
    { label: "Cours actifs", value: f.cours ?? 0, to: "/courses" },
    { label: "Enseignants", value: f.enseignants ?? 0 },
  ]
}
