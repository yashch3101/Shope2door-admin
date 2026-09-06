import { useState, useEffect } from 'react';
import { Users, ShoppingBag, ShoppingCart, IndianRupee, AlertTriangle, Clock } from 'lucide-react';
import { api } from '../../services/api';
import toast from 'react-hot-toast';

export default function Dashboard() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchStats = async (showLoader = true) => {
    try {
      if (showLoader) setLoading(true);
      else setRefreshing(true);

      const response = await api.get('/admin/dashboard');
      const data = response.data?.data || response.data;
      setStats(data);
    } catch (error) {
      console.error("Dashboard fetch error:", error);
      if (showLoader) toast.error('Failed to load dashboard stats');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStats(true);

    const intervalId = setInterval(() => {
      fetchStats(false); 
    }, 30000); 

    return () => clearInterval(intervalId);
  }, []);

  if (loading) {
    return <div className="flex items-center justify-center h-full text-gray-500">Loading dashboard stats...</div>;
  }

  if (!stats) {
    return <div className="text-gray-500">No data available.</div>;
  }

  const recentOrders = stats.recentOrders || [];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard Overview</h1>
        {refreshing && <span className="text-xs text-green-600 font-semibold flex items-center"><Clock className="w-3 h-3 mr-1 animate-spin" /> Live Syncing...</span>}
      </div>

      {/* Top Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Revenue Card */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center space-x-4">
          <div className="p-3 bg-green-100 text-green-600 rounded-lg">
            <IndianRupee className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Total Revenue</p>
            <p className="text-2xl font-bold text-gray-900">₹{stats.revenue?.toLocaleString() || 0}</p>
          </div>
        </div>

        {/* Orders Card */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center space-x-4">
          <div className="p-3 bg-blue-100 text-blue-600 rounded-lg">
            <ShoppingCart className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Total Orders</p>
            <p className="text-2xl font-bold text-gray-900">{stats.orders?.total || 0}</p>
            <p className="text-xs text-gray-400 mt-1">{stats.orders?.pending || 0} Pending</p>
          </div>
        </div>

        {/* Products Card */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center space-x-4">
          <div className="p-3 bg-yellow-100 text-yellow-600 rounded-lg">
            <ShoppingBag className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Active Products</p>
            <p className="text-2xl font-bold text-gray-900">{stats.products?.active || 0}</p>
            {stats.products?.lowStock > 0 && (
              <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" /> {stats.products.lowStock} Low Stock
              </p>
            )}
          </div>
        </div>

        {/* Users Card */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center space-x-4">
          <div className="p-3 bg-purple-100 text-purple-600 rounded-lg">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Total Users</p>
            <p className="text-2xl font-bold text-gray-900">{stats.users?.total || 0}</p>
            <p className="text-xs text-gray-400 mt-1">{stats.users?.active || 0} Active</p>
          </div>
        </div>
      </div>

      {/* Extended Dashboard Section: Recent Orders & Quick Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
        
        {/* Left Side: Recent Orders (Takes up 2 columns) */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
            <h2 className="text-lg font-bold text-gray-900">Recent Orders</h2>
            <a href="/orders" className="text-sm text-yellow-600 hover:text-yellow-700 font-semibold">View All</a>
          </div>
          <div className="p-0">
            {recentOrders.length > 0 ? (
              <table className="w-full whitespace-nowrap">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Order ID</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Customer</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Amount</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {recentOrders.map((order: any) => (
                    <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">#{order.orderNumber || order.id.substring(0, 8)}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{order.user?.name || 'Guest'}</td>
                      <td className="px-6 py-4 text-sm font-bold text-gray-900">₹{order.total}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-md ${
                          order.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                          order.status === 'DELIVERED' ? 'bg-green-100 text-green-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {order.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="p-8 text-center text-gray-500 text-sm">
                No recent orders found. Data will appear here automatically.
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Action Needed / Low Stock Alerts */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="text-lg font-bold text-gray-900">Attention Needed</h2>
          </div>
          <div className="p-6 flex flex-col items-center justify-center text-center space-y-4">
             <div className="p-4 bg-orange-50 rounded-full">
               <AlertTriangle className="w-8 h-8 text-orange-500" />
             </div>
             {stats.products?.lowStock > 0 ? (
               <div>
                 <p className="text-gray-900 font-bold">{stats.products.lowStock} Products running out of stock!</p>
                 <a href="/products" className="text-sm text-yellow-600 hover:text-yellow-700 font-semibold mt-2 inline-block">Update Inventory</a>
               </div>
             ) : (
               <p className="text-gray-500 text-sm">Inventory is healthy. No low stock alerts right now.</p>
             )}
          </div>
        </div>

      </div>
    </div>
  );
}