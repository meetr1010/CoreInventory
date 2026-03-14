import { HiOutlineBell, HiOutlineUserCircle } from 'react-icons/hi'

export default function Navbar() {
  return (
    <header className="h-16 bg-gray-900 border-b border-gray-800 flex items-center justify-between px-6 fixed top-0 left-0 right-0 z-30">
      {/* App Brand */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
          <span className="text-white font-bold text-sm">IM</span>
        </div>
        <h1 className="text-xl font-semibold text-white tracking-tight">
          Inventory<span className="text-indigo-400">Manager</span>
        </h1>
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-4">
        {/* Notification Bell */}
        <button className="relative p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors">
          <HiOutlineBell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full"></span>
        </button>

        {/* User Profile */}
        <div className="flex items-center gap-3 pl-4 border-l border-gray-700">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-medium text-white leading-tight">John Doe</p>
            <p className="text-xs text-gray-400">Admin</p>
          </div>
          <HiOutlineUserCircle className="w-8 h-8 text-gray-400 hover:text-indigo-400 transition-colors cursor-pointer" />
        </div>
      </div>
    </header>
  )
}
