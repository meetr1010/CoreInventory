import { Routes, Route } from 'react-router-dom'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Products from './pages/Products'
import Receipts from './pages/Receipts'
import Deliveries from './pages/Deliveries'
import Transfers from './pages/Transfers'
import History from './pages/History'

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/" element={<Dashboard />} />
      <Route path="/products" element={<Products />} />
      <Route path="/receipts" element={<Receipts />} />
      <Route path="/deliveries" element={<Deliveries />} />
      <Route path="/transfers" element={<Transfers />} />
      <Route path="/history" element={<History />} />
    </Routes>
  )
}

export default App
