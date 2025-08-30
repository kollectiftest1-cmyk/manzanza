import { Routes, Route } from "react-router-dom"
import { useSelector } from "react-redux"
import Navbar from "./components/Layout/Navbar"
import Sidebar from "./components/Sidebar"
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
import Auditoires from "./pages/Auditoires"
import AuditoireDetail from "./pages/AuditoireDetail"
import TPTD from "./pages/TPTD"
import RH from "./pages/RH"
import Comptabilite from "./pages/Comptabilite"
import ServiceIT from "./pages/ServiceIT"
import Apparitorat from "./pages/Apparitorat"
import Paiements from "./pages/Paiements"
import Notifications from "./pages/Notifications"
import ProtectedRoute from "./components/Auth/ProtectedRoute"

function App() {
  const { isAuthenticated } = useSelector((state) => state.auth)

  return (
    <div className="App">
      {isAuthenticated ? (
        <div className="d-flex">
          <Sidebar />
          <div
            className="main-content"
            style={{ marginLeft: "280px", width: "calc(100% - 280px)", minHeight: "100vh" }}
          >
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/login" element={<Login />} />
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/courses"
                element={
                  <ProtectedRoute>
                    <Courses />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/courses/:id"
                element={
                  <ProtectedRoute>
                    <CourseDetail />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/auditoires"
                element={
                  <ProtectedRoute>
                    <Auditoires />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/auditoires/:id"
                element={
                  <ProtectedRoute>
                    <AuditoireDetail />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/tptd"
                element={
                  <ProtectedRoute>
                    <TPTD />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/quiz/:id"
                element={
                  <ProtectedRoute>
                    <Quiz />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/chat"
                element={
                  <ProtectedRoute>
                    <Chat />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/rh"
                element={
                  <ProtectedRoute>
                    <RH />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/comptabilite"
                element={
                  <ProtectedRoute>
                    <Comptabilite />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/service-it"
                element={
                  <ProtectedRoute>
                    <ServiceIT />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/apparitorat"
                element={
                  <ProtectedRoute>
                    <Apparitorat />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/paiements"
                element={
                  <ProtectedRoute>
                    <Paiements />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/notifications"
                element={
                  <ProtectedRoute>
                    <Notifications />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <Profile />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/administration"
                element={
                  <ProtectedRoute>
                    <Administration />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/library"
                element={
                  <ProtectedRoute>
                    <Library />
                  </ProtectedRoute>
                }
              />
            </Routes>
          </div>
        </div>
      ) : (
        <>
          <Navbar />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
          </Routes>
        </>
      )}
    </div>
  )
}

export default App
