import { NavLink, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, ShoppingCart, Package, 
  Tags, Users, Settings, LogOut, Ticket, Image
} from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '../services/api';

export default function Sidebar() {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.error('Logout error', error);
    } finally {
      localStorage.clear();
      toast.success('Logged out successfully');
      navigate('/login');
    }
  };

  const menuItems = [
    { name: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
    { name: 'Orders', icon: ShoppingCart, path: '/orders' },
    { name: 'Products', icon: Package, path: '/products' },
    { name: 'Categories', icon: Tags, path: '/categories' },
    { name: 'Customers', icon: Users, path: '/customers' },
    { name: 'Coupons', icon: Ticket, path: '/coupons' },
    { name: 'Banners', icon: Image, path: '/banners' },
    { name: 'Settings', icon: Settings, path: '/settings' },
  ];

  return (
    <div className="w-64 bg-gray-900 text-white min-h-screen flex flex-col">
      <div className="p-6 text-center border-b border-gray-800">
        <h2 className="text-2xl font-extrabold text-yellow-500">Shop2Door</h2>
        <p className="text-xs text-gray-400 mt-1">Admin Panel</p>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {menuItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                isActive 
                  ? 'bg-yellow-500 text-gray-900' 
                  : 'text-gray-300 hover:bg-gray-800 hover:text-white'
              }`
            }
          >
            <item.icon className="w-5 h-5 mr-3" />
            {item.name}
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-gray-800">
        <button
          onClick={handleLogout}
          className="flex items-center w-full px-4 py-3 text-sm font-medium text-red-400 rounded-lg hover:bg-gray-800 hover:text-red-300 transition-colors"
        >
          <LogOut className="w-5 h-5 mr-3" />
          Logout
        </button>
      </div>
    </div>
  );
}