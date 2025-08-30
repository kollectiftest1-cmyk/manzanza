import { useSelector } from "react-redux"
import EtudiantDashboard from "../components/dashboards/EtudiantDashboard"
import EnseignantDashboard from "../components/dashboards/EnseignantDashboard"
import SGADashboard from "../components/dashboards/SGADashboard"
import AdminDashboard from "../components/dashboards/AdminDashboard"
import { USER_ROLES } from "../store/slices/authSlice"

const Dashboard = () => {
  const { user } = useSelector((state) => state.auth)
  const { courses } = useSelector((state) => state.courses)
  const { notifications } = useSelector((state) => state.notifications)

  const renderDashboard = () => {
    switch (user?.role) {
      case USER_ROLES.ETUDIANT:
        return <EtudiantDashboard user={user} courses={courses} notifications={notifications} />
      case USER_ROLES.ENSEIGNANT:
      case USER_ROLES.ASSISTANT:
        return <EnseignantDashboard user={user} courses={courses} notifications={notifications} />
      case USER_ROLES.SGA:
        return <SGADashboard user={user} courses={courses} notifications={notifications} />
      case USER_ROLES.PDG:
      case USER_ROLES.DIRECTEUR_GENERAL:
        return <AdminDashboard user={user} courses={courses} notifications={notifications} />
      default:
        return <EtudiantDashboard user={user} courses={courses} notifications={notifications} />
    }
  }

  return renderDashboard()
}

export default Dashboard
