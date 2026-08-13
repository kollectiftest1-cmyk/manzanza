import { Routes, Route } from "react-router-dom"
import { useSelector } from "react-redux"
import { useEffect } from "react"
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Title, Tooltip, Legend } from 'chart.js'

import Navbar from "./components/Layout/Navbar"
import Sidebar from "./components/Sidebar" // Corrected import path for Sidebar
import ModernSidebar from "./components/ModernSidebar"
import ModernHeader from "./components/ModernHeader"
import { applyTheme, getCurrentThemeName } from "./config/theme"
import Home from "./pages/Home"
import Login from "./pages/Login"
import Dashboard from "./pages/Dashboard"
import Courses from "./pages/Courses"
import CourseDetail from "./pages/CourseDetail"
import CourseAssessments from "./pages/CourseAssessments"
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
import HrEmployeePage from "./pages/RH/Employees"
import HrContractsPage from "./pages/RH/Contracts"
import HrPayrollsPage from "./pages/RH/Payrolls"
import HrLeavesPage from "./pages/RH/Leaves"
import PayrollForm from "./pages/RH/PayrollForm"
import ContractForm from "./pages/RH/ContractForm"
import LeaveForm from "./pages/RH/LeaveForm"
import EmployeeForm from "./pages/RH/EmployeeForm"
import EmployeeDetail from "./pages/RH/EmployeeDetail"
import Comptabilite from "./pages/Comptabilite"
import ServiceIT from "./pages/ServiceIT"
import Apparitorat from "./pages/Apparitorat"
import Paiements from "./pages/Paiements"
import GestionFrais from "./pages/GestionFrais"
import Caisse from "./pages/Caisse"
import Notifications from "./pages/Notifications"
import PublicInscription from "./pages/PublicInscription"
import GestionInscriptions from "./pages/GestionInscriptions"
import InscriptionDetail from "./pages/InscriptionDetail"
import ProtectedRoute from "./components/Auth/ProtectedRoute"

// Import Horaire page
import Horaire from "./pages/Horaire"
import CalendrierAcademique from "./pages/CalendrierAcademique"

// Import Academic Management pages (Modules académiques)
import GestionEnseignants from "./pages/GestionEnseignants"
import GestionEtudiants from "./pages/GestionEtudiants"
import ConfigurationAcademique from "./pages/ConfigurationNotes"
import RelevesCotes from "./pages/RelevesCotes"

// Import TP/TD/Quiz pages
import TeacherAssignments from "./pages/TeacherAssignments"
import TeacherQuizzes from "./pages/TeacherQuizzes"
import TeacherAttendance from "./pages/TeacherAttendance"
import StudentAssignments from "./pages/StudentAssignments"
import StudentQuizzes from "./pages/StudentQuizzes"

import { Col, Row } from "react-bootstrap"

// Register Chart.js components globally
ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Title, Tooltip, Legend)

function App() {
  const { isAuthenticated } = useSelector((state) => state.auth)

  // Define roles that can view user lists
  const canViewUsersRoles = ['iadmin', 'sga', 'chef_section', 'chef_departement', 'directeur_general', 'pdg'];

  // Apply theme on mount
  useEffect(() => {
    applyTheme(getCurrentThemeName())
  }, [])

  return (
    <div className="App">
      {isAuthenticated ? (
        <div className="container-fluid hh p-0" style={{ height: '100vh', overflow: 'hidden' }}>
          <Row className="row g-0" style={{ height: '100%' }}>
            <Col lg={2.3} className="col-auto" style={{ height: '100%' }}>
              <ModernSidebar />
            </Col>
            <Col lg={9.7} className="col" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <ModernHeader />
              <div
                className="main-content"
                style={{
                  flex: 1,
                  overflowY: "auto",
                  overflowX: "hidden",
                  backgroundColor: "var(--color-bodyBg)",
                }}
              >
                <div className="p-0">
                  <Routes>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                    <Route path="/courses" element={<ProtectedRoute><Courses /></ProtectedRoute>} />
                    <Route path="/courses/:id" element={<ProtectedRoute><CourseDetail /></ProtectedRoute>} />
                    <Route path="/courses/:id/assessments" element={<ProtectedRoute roles={['enseignant', 'assistant', 'chef_section', 'chef_departement', 'sga', 'iadmin', 'pdg', 'directeur_general']}><CourseAssessments /></ProtectedRoute>} />
                    <Route path="/auditoires" element={<ProtectedRoute><Auditoires /></ProtectedRoute>} />
                    <Route path="/auditoires/:id" element={<ProtectedRoute><AuditoireDetail /></ProtectedRoute>} />
                    <Route path="/sections/:id" element={<ProtectedRoute><SectionDetail /></ProtectedRoute>} />
                    <Route path="/filieres/:id" element={<ProtectedRoute><FiliereDetail /></ProtectedRoute>} />
                    <Route path="/tptd" element={<ProtectedRoute><TPTD /></ProtectedRoute>} />
                    <Route path="/horaire" element={<ProtectedRoute><Horaire /></ProtectedRoute>} />
                    <Route path="/calendrier" element={<ProtectedRoute><CalendrierAcademique /></ProtectedRoute>} />
                    <Route path="/quiz" element={<ProtectedRoute><Quiz /></ProtectedRoute>} />
                    <Route path="/quiz/:id" element={<ProtectedRoute><Quiz /></ProtectedRoute>} />

                    {/* TP/TD/Quiz Routes for Teachers */}
                    <Route path="/teacher/assignments" element={<ProtectedRoute roles={['enseignant', 'assistant']}><TeacherAssignments /></ProtectedRoute>} />
                    <Route path="/teacher/quizzes" element={<ProtectedRoute roles={['enseignant', 'assistant']}><TeacherQuizzes /></ProtectedRoute>} />
                    <Route path="/teacher/attendance" element={<ProtectedRoute roles={['enseignant', 'assistant']}><TeacherAttendance /></ProtectedRoute>} />

                    {/* TP/TD/Quiz Routes for Students */}
                    <Route path="/student/assignments" element={<ProtectedRoute roles={['etudiant']}><StudentAssignments /></ProtectedRoute>} />
                    <Route path="/student/quizzes" element={<ProtectedRoute roles={['etudiant']}><StudentQuizzes /></ProtectedRoute>} />
                    <Route path="/chat" element={<ProtectedRoute><Chat /></ProtectedRoute>} />

                    {/* RH Routes */}
                    <Route path="/rh/employees" element={<ProtectedRoute roles={['iadmin', 'sgad', 'directeur_general']}><HrEmployeePage /></ProtectedRoute>} />
                    <Route path="/rh/employees/:id" element={<ProtectedRoute roles={['iadmin', 'sgad', 'directeur_general']}><EmployeeDetail /></ProtectedRoute>} />
                    <Route path="/rh/employees/edit/:id" element={<ProtectedRoute roles={['iadmin', 'sgad', 'directeur_general']}><EmployeeForm /></ProtectedRoute>} />

                    <Route path="/rh/contracts" element={<ProtectedRoute roles={['iadmin', 'sgad', 'directeur_general']}><HrContractsPage /></ProtectedRoute>} />
                    <Route path="/rh/contracts/new" element={<ProtectedRoute roles={['iadmin', 'sgad', 'directeur_general']}><ContractForm /></ProtectedRoute>} />
                    <Route path="/rh/contracts/edit/:id" element={<ProtectedRoute roles={['iadmin', 'sgad', 'directeur_general']}><ContractForm /></ProtectedRoute>} />

                    <Route path="/rh/payrolls" element={<ProtectedRoute roles={['iadmin', 'sgad', 'directeur_general']}><HrPayrollsPage /></ProtectedRoute>} />
                    <Route path="/rh/payrolls/new" element={<ProtectedRoute roles={['iadmin', 'sgad', 'directeur_general']}><PayrollForm /></ProtectedRoute>} />
                    <Route path="/rh/payrolls/edit/:id" element={<ProtectedRoute roles={['iadmin', 'sgad', 'directeur_general']}><PayrollForm /></ProtectedRoute>} />

                    <Route path="/rh/leaves" element={<ProtectedRoute roles={['iadmin', 'sgad', 'directeur_general']}><HrLeavesPage /></ProtectedRoute>} />
                    <Route path="/rh/leaves/new" element={<ProtectedRoute roles={['iadmin', 'sgad', 'directeur_general']}><LeaveForm /></ProtectedRoute>} />
                    <Route path="/rh/leaves/edit/:id" element={<ProtectedRoute roles={['iadmin', 'sgad', 'directeur_general']}><LeaveForm /></ProtectedRoute>} />

                    <Route path="/comptabilite" element={<ProtectedRoute roles={['iadmin', 'caisse', 'sgad', 'directeur_general']}><Comptabilite /></ProtectedRoute>} />
                    <Route path="/service-it" element={<ProtectedRoute roles={['iadmin', 'service_it']}><ServiceIT /></ProtectedRoute>} />
                    <Route path="/apparitorat" element={<ProtectedRoute roles={['iadmin', 'apparitorat', 'sga']}><Apparitorat /></ProtectedRoute>} />
                    <Route path="/paiements" element={<ProtectedRoute roles={['etudiant']}><Paiements /></ProtectedRoute>} />
                    <Route path="/gestion-frais" element={<ProtectedRoute roles={['iadmin', 'sgad', 'caisse', 'pdg', 'directeur_general']}><GestionFrais /></ProtectedRoute>} />
                    <Route path="/caisse" element={<ProtectedRoute roles={['caisse', 'iadmin', 'directeur_general']}><Caisse /></ProtectedRoute>} />
                    <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
                    <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
                    <Route path="/profile/:id" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
                    <Route path="/administration" element={<ProtectedRoute roles={canViewUsersRoles}><Administration /></ProtectedRoute>} />
                    
                    {/* Inscription Management Routes */}
                    <Route path="/gestion-inscriptions" element={<ProtectedRoute roles={['iadmin', 'sga']}><GestionInscriptions /></ProtectedRoute>} />
                    <Route path="/gestion-inscriptions/:id" element={<ProtectedRoute roles={['iadmin', 'sga']}><InscriptionDetail /></ProtectedRoute>} />
                    
                    <Route path="/library" element={<ProtectedRoute roles={['iadmin', 'bibliothecaire', 'sga', 'etudiant', 'enseignant', 'assistant', 'chef_section','chef_departement']}><Library /></ProtectedRoute>} />
                    <Route path="/book-detail/:id" element={<ProtectedRoute><BookDetail /></ProtectedRoute>} />

                    {/* Student & Teacher routes → redirect to unified management pages */}
                    <Route path="/students" element={<ProtectedRoute roles={canViewUsersRoles}><GestionEtudiants /></ProtectedRoute>} />
                    <Route path="/students/*" element={<ProtectedRoute roles={canViewUsersRoles}><GestionEtudiants /></ProtectedRoute>} />
                    <Route path="/teachers" element={<ProtectedRoute roles={canViewUsersRoles}><GestionEnseignants /></ProtectedRoute>} />
                    <Route path="/teachers/*" element={<ProtectedRoute roles={canViewUsersRoles}><GestionEnseignants /></ProtectedRoute>} />

                    {/* Academic Management Modules */}
                    <Route path="/gestion-enseignants" element={<ProtectedRoute roles={['iadmin', 'sga', 'chef_section', 'chef_departement', 'directeur_general']}><GestionEnseignants /></ProtectedRoute>} />
                    <Route path="/gestion-etudiants" element={<ProtectedRoute roles={['iadmin', 'sga', 'chef_section', 'chef_departement', 'directeur_general']}><GestionEtudiants /></ProtectedRoute>} />
                    <Route path="/configuration-notes" element={<ProtectedRoute roles={['iadmin', 'sga']}><ConfigurationAcademique /></ProtectedRoute>} />
                    <Route path="/releves-cotes" element={<ProtectedRoute roles={['iadmin', 'sga', 'sgad', 'pdg', 'directeur_general', 'chef_section', 'chef_departement', 'enseignant', 'assistant', 'etudiant']}><RelevesCotes /></ProtectedRoute>} />
                    <Route path="/transcripts" element={<ProtectedRoute roles={['iadmin', 'sga', 'sgad', 'pdg', 'directeur_general', 'chef_section', 'chef_departement', 'enseignant', 'assistant', 'etudiant']}><RelevesCotes /></ProtectedRoute>} />
                  </Routes>
                </div>
              </div>
            </Col>
          </Row>

          {/* Sidebar Overlay for Mobile */}
          <div
            className="sidebar-overlay-backdrop"
            onClick={() => {
              const sidebar = document.getElementById('modernSidebar')
              const overlay = document.querySelector('.sidebar-overlay-backdrop')
              if (sidebar) sidebar.classList.remove('show')
              if (overlay) overlay.classList.remove('show')
            }}
          />
        </div>
      ) : (
        <>
          <Navbar />
          <div style={{ minHeight: '100vh', paddingTop: '70px' }}>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/inscription" element={<PublicInscription />} />
              <Route path="*" element={<Login />} />
            </Routes>
          </div>
          {/* Sidebar Overlay for Mobile */}
          <div
            className="sidebar-overlay-backdrop"
            onClick={() => {
              const sidebar = document.querySelector('.modern-sidebar')
              const overlay = document.querySelector('.sidebar-overlay-backdrop')
              if (sidebar) sidebar.classList.remove('show')
              if (overlay) overlay.classList.remove('show')
            }}
            style={{
              display: 'none',
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0, 0, 0, 0.5)',
              zIndex: 1040,
              opacity: 0,
              transition: 'opacity 0.3s ease'
            }}
          />
          <style>{`
            .sidebar-overlay-backdrop {
              display: none;
              position: fixed;
              top: 0;
              left: 0;
              right: 0;
              bottom: 0;
              background: rgba(0, 0, 0, 0.5);
              z-index: 1040;
              opacity: 0;
              pointer-events: none;
              transition: opacity 0.3s ease;
            }

            @media (max-width: 991px) {
              .sidebar-overlay-backdrop {
                display: block !important;
              }
              .sidebar-overlay-backdrop.show {
                opacity: 1 !important;
                pointer-events: all !important;
              }
            }
          `}</style>
        </>
      )}
    </div>
  )
}

export default App
