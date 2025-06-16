"use client";

export default function StudentDashboard() {
  return (
    <div className="min-h-screen bg-gray-50/50">
      {/* Sidebar */}
      <aside className="bg-gradient-to-br from-gray-800 to-gray-900 fixed inset-y-0 left-0 z-50 w-64 p-4">
        <div className="flex items-center justify-center py-6">
          <h1 className="text-white text-lg font-semibold">Eclero Student</h1>
        </div>

        <nav className="mt-8">
          <ul className="space-y-2">
            <li>
              <a href="#" className="flex items-center p-3 text-white rounded-lg hover:bg-gray-700">
                <span>Dashboard</span>
              </a>
            </li>
            <li>
              <a href="#" className="flex items-center p-3 text-white rounded-lg hover:bg-gray-700">
                <span>My Profile</span>
              </a>
            </li>
            <li>
              <a href="#" className="flex items-center p-3 text-white rounded-lg hover:bg-gray-700">
                <span>Sessions</span>
              </a>
            </li>
            <li>
              <a href="#" className="flex items-center p-3 text-white rounded-lg hover:bg-gray-700">
                <span>Log Out</span>
              </a>
            </li>
          </ul>
        </nav>
      </aside>

      {/* Main Content */}
      <div className="ml-64 p-8">
        <h2 className="text-2xl font-semibold text-gray-800">Student Dashboard</h2>
        <p className="mt-4 text-gray-600">Welcome to your student dashboard. Use the menu to navigate.</p>
      </div>
    </div>
  );
}