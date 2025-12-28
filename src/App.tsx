import { Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import Register from './pages/Register'
import ChangePassword from './pages/ChangePassword'
import Dashboard from './pages/Dashboard'
import Files from './pages/Files'
import Metrics from './pages/Metrics'
import ProtectedRoute from './components/ProtectedRoute'

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/change-password" element={<ChangePassword />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/files"
        element={
          <ProtectedRoute>
            <Files />
          </ProtectedRoute>
        }
      />
      <Route
        path="/metrics"
        element={
          <ProtectedRoute>
            <Metrics />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
