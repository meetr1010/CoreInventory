// backend/components/Navbar.jsx
import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getUser, logout } from '../utils/auth'
import {
  HiOutlineUserCircle,
  HiOutlineLogout,
  HiOutlineChevronDown,
} from 'react-icons/hi'

export default function Navbar() {
  const navigate = useNavigate()
  const user = getUser()
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClick(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

  const displayName = user?.name || 'User'
  const displayRole = user?.role
    ? user.role.charAt(0).toUpperCase() + user.role.slice(1)
    : 'Staff'

  // Avatar initials
  const initials = displayName
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  return (
    <header className="h-16 bg-gray-900 border-b border-gray-800 flex items-center justify-between px-6 fixed top-0 left-0 right-0 z-30">
      {/* App Brand */}
      <div className="flex items-center gap-3">
        <img src="/logo.png" alt="Flowventory" className="h-9 w-auto" />
        <h1 className="text-xl font-semibold text-white tracking-tight">
          Flow<span className="text-green-400">ventory</span>
        </h1>
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-4">
        {/* User Profile Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen((o) => !o)}
            className="flex items-center gap-3 pl-4 border-l border-gray-700 hover:opacity-80 transition-opacity"
          >
            {/* Avatar */}
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
              {initials}
            </div>

            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium text-white leading-tight">{displayName}</p>
              <p className="text-xs text-gray-400">{displayRole}</p>
            </div>
            <HiOutlineChevronDown
              className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`}
            />
          </button>

          {/* Dropdown Menu */}
          {dropdownOpen && (
            <div className="absolute right-0 top-full mt-2 w-52 rounded-xl border border-gray-700 bg-gray-900 shadow-2xl shadow-black/40 overflow-hidden z-50">
              {/* Profile info */}
              <div className="px-4 py-3 border-b border-gray-800">
                <p className="text-sm font-semibold text-white truncate">{displayName}</p>
                <p className="text-xs text-gray-400 truncate">{user?.email || ''}</p>
                <span className="inline-block mt-1 text-[10px] font-semibold uppercase tracking-wider bg-indigo-600/20 text-indigo-400 px-2 py-0.5 rounded-full">
                  {displayRole}
                </span>
              </div>

              {/* Logout */}
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors text-left"
              >
                <HiOutlineLogout className="w-4 h-4" />
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
