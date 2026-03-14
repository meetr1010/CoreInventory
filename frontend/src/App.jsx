import { Navigate, Routes, Route } from 'react-router-dom'
import { isLoggedIn } from './utils/auth'
import Login from './pages/Login'
import Register from './pages/Register'
import VerifyOTP from './pages/VerifyOTP'
import Dashboard from './pages/Dashboard'
import Products from './pages/Products'
import Receipts from './pages/Receipts'
import Deliveries from './pages/Deliveries'
import Transfers from './pages/Transfers'
import History from './pages/History'

/** Redirect unauthenticated users to /login */
function ProtectedRoute({ children }) {
  return isLoggedIn() ? children : <Navigate to="/login" replace />
}

function App() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/verify-otp" element={<VerifyOTP />} />

      {/* Protected routes */}
      <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/products" element={<ProtectedRoute><Products /></ProtectedRoute>} />
      <Route path="/receipts" element={<ProtectedRoute><Receipts /></ProtectedRoute>} />
      <Route path="/deliveries" element={<ProtectedRoute><Deliveries /></ProtectedRoute>} />
      <Route path="/transfers" element={<ProtectedRoute><Transfers /></ProtectedRoute>} />
      <Route path="/history" element={<ProtectedRoute><History /></ProtectedRoute>} />
    </Routes>
  )
}

export default App
