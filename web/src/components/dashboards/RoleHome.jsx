/**
 * Tableau de bord générique d'un service : tuiles alimentées par des données réelles,
 * raccourcis vers les tâches du service, agenda et activité réels.
 */
import { Link } from "react-router-dom"
import { Row, Col } from "react-bootstrap"
import { FiArrowRight } from "react-icons/fi"
import { Kpi, Loading } from "../mz/Kit"
import RecentActivity from "../RecentActivity"
import ScheduleWidget from "../ScheduleWidget"
import { useHome } from "./homeData"

export default function RoleHome({ user, title, subtitle, tiles, actions = [], children }) {
  const home = useHome()
  const list = home ? tiles(home.counters || {}) : null
  return (
    <div className="mz-page">
      <div className="mz-page-header">
        <div>
          <h1 className="mz-page-title">{title}</h1>
          <p className="mz-page-subtitle">{subtitle || `Bienvenue ${user?.first_name || ""}`}</p>
        </div>
        {actions.length > 0 && (
          <div className="d-flex gap-2 flex-wrap">
            {actions.map((a) => <Link key={a.to} to={a.to} className="btn btn-outline-primary btn-sm px-3">{a.label} <FiArrowRight /></Link>)}
          </div>
        )}
      </div>
      {list === null ? <Loading /> : (
        <div className="mz-kpis">
          {list.map((t) => (
            <div key={t.label} style={{ display: "contents" }}>
              {t.to ? <Link to={t.to} style={{ textDecoration: "none", color: "inherit", display: "contents" }}><Kpi {...t} /></Link> : <Kpi {...t} />}
            </div>
          ))}
        </div>
      )}
      {children}
      <Row className="g-3 mt-1">
        <Col lg={6}><ScheduleWidget source="agenda" delay={0.1} /></Col>
        <Col lg={6}><RecentActivity delay={0.2} /></Col>
      </Row>
    </div>
  )
}
