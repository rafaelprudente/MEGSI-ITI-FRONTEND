import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Home, FileText, BarChart3, LogOut } from 'lucide-react'
import { authService } from '../lib/auth'

export default function Navbar() {
  const location = useLocation()
  const navigate = useNavigate()
  const user = authService.getUser()

  const handleLogout = () => {
    authService.logout()
    navigate('/login')
  }

  const navItems = [
    { path: '/', icon: Home, label: 'Dashboard' },
    { path: '/files', icon: FileText, label: 'Files' },
    { path: '/metrics', icon: BarChart3, label: 'Metrics' },
  ]

  return (
    <nav className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex space-x-8">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-primary-600">UM Drive</h1>
            </div>
            <div className="hidden sm:flex sm:space-x-4">
              {navItems.map((item) => {
                const Icon = item.icon
                const isActive = location.pathname === item.path
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`inline-flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                      isActive
                        ? 'text-primary-600 bg-primary-50'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    <Icon className="w-4 h-4 mr-2" />
                    {item.label}
                  </Link>
                )
              })}
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-600">
              {user?.username || 'User'}
            </span>
            <button
              onClick={handleLogout}
              className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-md"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </button>
          </div>
        </div>
      </div>
    </nav>
  )
}
