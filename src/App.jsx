import { Routes, Route } from "react-router-dom"
import { useSelector } from "react-redux"
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Title, Tooltip, Legend } from 'chart.js'

import Navbar from "./components/Layout/Navbar"
import Sidebar from "./components/Sidebar" // Corrected import path for Sidebar
import Home from "./pages/Home"
import Login from "./pages/Login"
import Dashboard from "./pages/Dashboard"
import Courses from "./pages/Courses"
import CourseDetail from "./pages/CourseDetail"
import Quiz from "./pages/Quiz"
import Chat from "./pages/Chat"
import Profile from "./pages/Profile"
import Administration from "./pages/Administration"
import Library from "./pages/Library"
import BookDetail from "./pages/BookDetail"
import Auditoires from "./pages/Auditoires"
import AuditoireDetail from "./pages/AuditoireDetail"
import SectionDetail from "./pages/SectionDetail"
import FiliereDetail from "./pages/FiliereDetail"
import TPTD from "./pages/TPTD"
import RH from "./pages/RH"
import Comptabilite from "./pages/Comptabilite"
import ServiceIT from "./pages/ServiceIT"
import Apparitorat from "./pages/Apparitorat"
import Paiements from "./pages/Paiements"
import Notifications from "./pages/Notifications"
import PublicInscription from "./pages/PublicInscription"
import GestionInscriptions from "./pages/GestionInscriptions"
import InscriptionDetail from "./pages/InscriptionDetail"
import ProtectedRoute from "./components/Auth/ProtectedRoute"

// Import new list pages
import StudentListPage from "./pages/StudentListPage"
import TeacherListPage from "./pages/TeacherListPage"

import { Col, Row } from "react-bootstrap"

// Register Chart.js components globally
ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Title, Tooltip, Legend)

function App() {
  const { isAuthenticated } = useSelector((state) => state.auth)

  // Define roles that can view user lists
  const canViewUsersRoles = ['iadmin', 'sga', 'chef_section', 'chef_departement', 'directeur_general', 'pdg'];

  return (
    <div className="App">
      {isAuthenticated ? (
        <div className="container-fluid p-0">
          <Row className="row g-0">
            <Col lg={2} className="col-auto">
              <Sidebar />
            </Col>
            <Col lg={10} className="col">
              <div
                className="main-content"
                style={{
                  height: "100vh",
                  overflowY: "auto",
                  overflowX: "auto",
                  backgroundColor: "#f8f9fa",
                }}
              >
                <div className="p-4">
                  <Routes>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                    <Route path="/courses" element={<ProtectedRoute><Courses /></ProtectedRoute>} />
                    <Route path="/courses/:id" element={<ProtectedRoute><CourseDetail /></ProtectedRoute>} />
                    <Route path="/auditoires" element={<ProtectedRoute><Auditoires /></ProtectedRoute>} />
                    <Route path="/auditoires/:id" element={<ProtectedRoute><AuditoireDetail /></ProtectedRoute>} />
                    <Route path="/sections/:id" element={<ProtectedRoute><SectionDetail /></ProtectedRoute>} />
                    <Route path="/filieres/:id" element={<ProtectedRoute><FiliereDetail /></ProtectedRoute>} />
                    <Route path="/tptd" element={<ProtectedRoute><TPTD /></ProtectedRoute>} />
                    <Route path="/quiz" element={<ProtectedRoute><Quiz /></ProtectedRoute>} />
                    <Route path="/quiz/:id" element={<ProtectedRoute><Quiz /></ProtectedRoute>} />
                    <Route path="/chat" element={<ProtectedRoute><Chat /></ProtectedRoute>} />
                    <Route path="/rh" element={<ProtectedRoute roles={['iadmin', 'sgad', 'directeur_general']}><RH /></ProtectedRoute>} />
                    <Route path="/comptabilite" element={<ProtectedRoute roles={['iadmin', 'caisse', 'sgad']}><Comptabilite /></ProtectedRoute>} />
                    <Route path="/service-it" element={<ProtectedRoute roles={['iadmin', 'service_it']}><ServiceIT /></ProtectedRoute>} />
                    <Route path="/apparitorat" element={<ProtectedRoute roles={['iadmin', 'apparitorat', 'sga']}><Apparitorat /></ProtectedRoute>} />
                    <Route path="/paiements" element={<ProtectedRoute roles={['etudiant', 'iadmin']}><Paiements /></ProtectedRoute>} />
                    <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
                    <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
                    <Route path="/profile/:id" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
                    <Route path="/administration" element={<ProtectedRoute roles={canViewUsersRoles}><Administration /></ProtectedRoute>} />
                    
                    {/* Inscription Management Routes */}
                    <Route path="/gestion-inscriptions" element={<ProtectedRoute roles={['iadmin', 'sga']}><GestionInscriptions /></ProtectedRoute>} />
                    <Route path="/gestion-inscriptions/:id" element={<ProtectedRoute roles={['iadmin', 'sga']}><InscriptionDetail /></ProtectedRoute>} />
                    
                    <Route path="/library" element={<ProtectedRoute roles={['iadmin', 'bibliothecaire', 'sga', 'etudiant','chef_section','chef_departement']}><Library /></ProtectedRoute>} />
                    <Route path="/book-detail/:id" element={<ProtectedRoute><BookDetail /></ProtectedRoute>} />

                    {/* New Student List Routes */}
                    <Route path="/students" element={<ProtectedRoute roles={canViewUsersRoles}><StudentListPage /></ProtectedRoute>} />
                    <Route path="/students/filiere/:filiereId" element={<ProtectedRoute roles={canViewUsersRoles}><StudentListPage /></ProtectedRoute>} />
                    <Route path="/students/section/:sectionId" element={<ProtectedRoute roles={canViewUsersRoles}><StudentListPage /></ProtectedRoute>} />
                    <Route path="/students/auditoire/:auditoireId" element={<ProtectedRoute roles={canViewUsersRoles}><StudentListPage /></ProtectedRoute>} />

                    {/* New Teacher List Routes */}
                    <Route path="/teachers" element={<ProtectedRoute roles={canViewUsersRoles}><TeacherListPage /></ProtectedRoute>} />
                    <Route path="/teachers/filiere/:filiereId" element={<ProtectedRoute roles={canViewUsersRoles}><TeacherListPage /></ProtectedRoute>} />
                    <Route path="/teachers/section/:sectionId" element={<ProtectedRoute roles={canViewUsersRoles}><TeacherListPage /></ProtectedRoute>} />
                  </Routes>
                </div>
              </div>
            </Col>
          </Row>
        </div>
      ) : (
        <>
          <Navbar />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/inscription" element={<PublicInscription />} />
            <Route path="*" element={<Login />} />
          </Routes>
        </>
      )}
    </div>
  )
}

export default App
