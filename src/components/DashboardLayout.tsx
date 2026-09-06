import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';

export default function DashboardLayout() {
  const adminData = JSON.parse(localStorage.getItem('adminUser') || '{}');

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Left Sidebar */}
      <Sidebar />

      {/* Right Content Area */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Top Navbar */}
        <header className="bg-white shadow-sm h-16 flex items-center justify-between px-8 z-10">
          <h1 className="text-xl font-semibold text-gray-800">Overview</h1>
          <div className="flex items-center space-x-4">
            <div className="text-sm text-right">
              <p className="font-medium text-gray-900">{adminData.name || 'Super Admin'}</p>
              <p className="text-gray-500">{adminData.email}</p>
            </div>
            <div className="w-10 h-10 bg-yellow-500 rounded-full flex items-center justify-center text-white font-bold">
              {adminData.name ? adminData.name.charAt(0).toUpperCase() : 'A'}
            </div>
          </div>
        </header>

        {/* Dynamic Page Content */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 p-8">
          <Outlet /> {/* Yahan par active route ka component render hoga */}
        </main>
      </div>
    </div>
  );
}