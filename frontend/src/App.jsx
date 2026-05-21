import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import LoginPage from './pages/LoginPage'
import HomePage from './pages/HomePage'
import TeachersPage from './pages/TeachersPage'
import StudentsPage from './pages/StudentsPage'
import GradesPage from './pages/GradesPage'
import AnalyticsPage from './pages/AnalyticsPage'
import AdminPage from './pages/AdminPage'
import ProfilePage from './pages/ProfilePage'
import './index.css'

function Layout({ children }) {
  return (
    <div className="app-shell">
      <Navbar />
      <main>{children}</main>
      <Footer />
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={
            <ProtectedRoute roles={['guest', 'user', 'admin']}>
              <Layout><HomePage /></Layout>
            </ProtectedRoute>
          } />
          <Route path="/teachers" element={
            <ProtectedRoute roles={['guest', 'user', 'admin']}>
              <Layout><TeachersPage /></Layout>
            </ProtectedRoute>
          } />
          <Route path="/students" element={
            <ProtectedRoute roles={['guest', 'user', 'admin']}>
              <Layout><StudentsPage /></Layout>
            </ProtectedRoute>
          } />
          <Route path="/grades" element={
            <ProtectedRoute roles={['guest', 'user', 'admin']}>
              <Layout><GradesPage /></Layout>
            </ProtectedRoute>
          } />
          <Route path="/analytics" element={
            <ProtectedRoute roles={['guest', 'user', 'admin']}>
              <Layout><AnalyticsPage /></Layout>
            </ProtectedRoute>
          } />
          <Route path="/profile" element={
            <ProtectedRoute roles={['guest', 'user', 'admin']}>
              <Layout><ProfilePage /></Layout>
            </ProtectedRoute>
          } />
          <Route path="/admin" element={
            <ProtectedRoute roles={['admin']}>
              <Layout><AdminPage /></Layout>
            </ProtectedRoute>
          } />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
