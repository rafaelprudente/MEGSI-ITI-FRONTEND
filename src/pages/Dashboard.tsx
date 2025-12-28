import Navbar from '../components/Navbar'

export default function Dashboard() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Dashboard</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Welcome to UM Drive</h3>
            <p className="text-gray-600">
              Your cloud file storage system for ITI 2025-26 project
            </p>
          </div>
          
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Quick Actions</h3>
            <ul className="space-y-2">
              <li>
                <a href="/files" className="text-primary-600 hover:underline">
                  Upload Files →
                </a>
              </li>
              <li>
                <a href="/metrics" className="text-primary-600 hover:underline">
                  View Metrics →
                </a>
              </li>
            </ul>
          </div>
          
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-700 mb-2">System Status</h3>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="text-sm text-gray-600">All systems operational</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
