import { NavLink } from 'react-router-dom'
import {
  HiOutlineViewGrid,
  HiOutlineCube,
  HiOutlineClipboardList,
  HiOutlineTruck,
  HiOutlineSwitchHorizontal,
  HiOutlineClock,
} from 'react-icons/hi'

const links = [
  { to: '/',           label: 'Dashboard',  icon: HiOutlineViewGrid },
  { to: '/products',   label: 'Products',   icon: HiOutlineCube },
  { to: '/receipts',   label: 'Receipts',   icon: HiOutlineClipboardList },
  { to: '/deliveries', label: 'Deliveries', icon: HiOutlineTruck },
  { to: '/transfers',  label: 'Transfers',  icon: HiOutlineSwitchHorizontal },
  { to: '/history',    label: 'History',    icon: HiOutlineClock },
]

export default function Sidebar() {
  return (
    <aside className="fixed top-16 left-0 w-60 h-[calc(100vh-4rem)] bg-gray-900 border-r border-gray-800 flex flex-col z-20">
      {/* Navigation */}
      <nav className="flex-1 px-3 py-6 space-y-1 overflow-y-auto">
        <p className="px-3 mb-4 text-[11px] font-semibold uppercase tracking-widest text-gray-500">
          Menu
        </p>
        {links.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group ${
                isActive
                  ? 'bg-indigo-600/20 text-indigo-400 shadow-lg shadow-indigo-500/5'
                  : 'text-gray-400 hover:bg-gray-800 hover:text-white'
              }`
            }
          >
            <Icon className="w-5 h-5 transition-transform duration-200 group-hover:scale-110" />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-4 py-4 border-t border-gray-800">
        <p className="text-xs text-gray-600 text-center">© 2026 IMS v1.0</p>
      </div>
    </aside>
  )
}
