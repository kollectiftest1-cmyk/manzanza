import { useEffect } from "react"
import { useSelector, useDispatch } from "react-redux"
import EtudiantDashboard from "../components/dashboards/EtudiantDashboard"
import EnseignantDashboard from "../components/dashboards/EnseignantDashboard"
import AssistantDashboard from "../components/dashboards/AssistantDashboard"
import SGADashboard from "../components/dashboards/SGADashboard"
import ChefSectionDashboard from "../components/dashboards/ChefSectionDashboard"
import ChefDepartementDashboard from "../components/dashboards/ChefDepartementDashboard"
import SGADDashboard from "../components/dashboards/SGADDashboard"
import BibliothecaireDashboard from "../components/dashboards/BibliothecaireDashboard"
import ApparitoratDashboard from "../components/dashboards/ApparitoratDashboard"
import ServiceITDashboard from "../components/dashboards/ServiceITDashboard"
import CaisseComptabiliteDashboard from "../components/dashboards/CaisseComptabiliteDashboard"
import JuryDashboard from "../components/dashboards/JuryDashboard"
import IAdminDashboard from "../components/dashboards/IAdminDashboard"
import DirecteurGeneralDashboard from "../components/dashboards/DirecteurGeneralDashboard"
import { USER_ROLES } from "../store/slices/authSlice"
import KpiStrip from "../components/dashboards/KpiStrip"
import { hasAnyRole } from "../utils/permissions"
import { fetchMyCourses, fetchCourses } from "../store/slices/coursesSlice"

const Dashboard = () => {
  const dispatch = useDispatch()
  const { user } = useSelector((state) => state.auth)
  const { courses } = useSelector((state) => state.courses)
  const { notifications } = useSelector((state) => state.notifications)

  useEffect(() => {
    if (user?.role === USER_ROLES.ETUDIANT) {
      dispatch(fetchMyCourses())
    } else if (user?.role) {
      dispatch(fetchCourses())
    }
  }, [dispatch, user])

  const renderDashboard = () => {
    switch (user?.role) {
      case USER_ROLES.ETUDIANT:
        return <EtudiantDashboard user={user} courses={courses} notifications={notifications} />
      case USER_ROLES.ENSEIGNANT:
        return <EnseignantDashboard user={user} courses={courses} notifications={notifications} />
      case USER_ROLES.ASSISTANT:
        return <AssistantDashboard user={user} courses={courses} notifications={notifications} />
      case USER_ROLES.SGA:
        return <SGADashboard user={user} courses={courses} notifications={notifications} />
      case USER_ROLES.SGAD:
        return <SGADDashboard user={user} courses={courses} notifications={notifications} />
      case USER_ROLES.DIRECTEUR_GENERAL:
        return <DirecteurGeneralDashboard />
      case USER_ROLES.CHEF_SECTION:
        return <ChefSectionDashboard user={user} courses={courses} notifications={notifications} />
      case USER_ROLES.CHEF_DEPARTEMENT:
        return <ChefDepartementDashboard user={user} courses={courses} notifications={notifications} />
      case USER_ROLES.BIBLIOTHECAIRE:
        return <BibliothecaireDashboard user={user} courses={courses} notifications={notifications} />
      case USER_ROLES.APPARITORAT:
        return <ApparitoratDashboard user={user} courses={courses} notifications={notifications} />
      case USER_ROLES.SERVICE_IT:
        return <ServiceITDashboard user={user} courses={courses} notifications={notifications} />
      case USER_ROLES.CAISSE:
      case USER_ROLES.COMPTABLE:
        return <CaisseComptabiliteDashboard user={user} courses={courses} notifications={notifications} />
      case USER_ROLES.JURY:
        return <JuryDashboard user={user} courses={courses} notifications={notifications} />
      case USER_ROLES.PDG:
        return <IAdminDashboard user={user} courses={courses} notifications={notifications} />
      default:
        return <EtudiantDashboard user={user} courses={courses} notifications={notifications} />
    }
  }

  const showKpis = hasAnyRole(user, "sga", "sgad", "pdg", "directeur_general", "chef_section", "chef_departement",
    "apparitorat", "comptable", "caisse") && user?.role !== "etudiant"
  return (
    <>
      {showKpis && <KpiStrip />}
      {renderDashboard()}
    </>
  )
}

export default Dashboard
