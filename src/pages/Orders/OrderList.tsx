import { useState, useEffect } from 'react';
import { Search, Eye, Printer } from 'lucide-react';
import { api } from '../../services/api';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  status: string;
  total: number;
  placedAt: string;
}

export default function OrderList() {

  const navigate = useNavigate();

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const response = await api.get('/orders/admin/all'); 
        
        const resData = response.data;
        let items: Order[] = [];
        
        if (resData?.orders && Array.isArray(resData.orders)) {
          items = resData.orders;
        } else if (resData?.data && Array.isArray(resData.data)) {
          items = resData.data;
        } else if (Array.isArray(resData)) {
          items = resData;
        }

        setOrders(items);
      } catch (error) {
        console.error("Failed to fetch orders", error);
        toast.error('Failed to load orders');
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  const filteredOrders = Array.isArray(orders) ? orders.filter((o) => 
    o.orderNumber.toLowerCase().includes(search.toLowerCase()) ||
    o.customerPhone.includes(search) ||
    o.customerName.toLowerCase().includes(search.toLowerCase())
  ) : [];

  const AVAILABLE_STATUSES = [
    'PENDING', 'CONFIRMED', 'PROCESSING', 'PACKED', 
    'DISPATCHED', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED'
  ];

  const handleStatusUpdate = async (orderId: string, newStatus: string) => {
    try {
      const response = await api.patch(`/orders/admin/${orderId}/status`, { status: newStatus });
      if(response.data.success) {
         toast.success(`Order marked as ${newStatus}`);
         setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
      }
    } catch (error: any) {
      console.error("Status update error", error);
      toast.error(error?.response?.data?.message || 'Failed to update status');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'bg-yellow-100 text-yellow-800';
      case 'CONFIRMED': return 'bg-blue-100 text-blue-800';
      case 'PROCESSING':
      case 'PACKED':
      case 'OUT_FOR_DELIVERY': return 'bg-purple-100 text-purple-800';
      case 'DELIVERED': return 'bg-green-100 text-green-800';
      case 'CANCELLED': 
      case 'RETURNED': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Orders Management</h1>
      </div>

      {/* Filters & Search */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex gap-4 no-print">
        <div className="relative flex-1">
          <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input 
            type="text" 
            placeholder="Search by Order ID, Customer Name or Phone..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-yellow-500 focus:border-yellow-500"
          />
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full whitespace-nowrap">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Order ID & Date</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Customer</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Amount</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider no-print">Status</th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider no-print">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">Loading orders...</td>
                </tr>
              ) : filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">No orders found.</td>
                </tr>
              ) : (
                filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="text-sm font-bold text-indigo-600">#{order.orderNumber}</div>
                      <div className="text-xs text-gray-500">{new Date(order.placedAt).toLocaleString()}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{order.customerName}</div>
                      <div className="text-sm text-gray-500">{order.customerPhone}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-bold text-gray-900">₹{order.total}</div>
                    </td>
                    <td className="px-6 py-4 no-print">
                      <select 
                        value={order.status}
                        onChange={(e) => handleStatusUpdate(order.id, e.target.value)}
                        disabled={order.status === 'CANCELLED' || order.status === 'DELIVERED'}
                        className={`text-xs font-bold px-3 py-2 rounded-full cursor-pointer border-none outline-none focus:ring-2 focus:ring-gray-200 disabled:opacity-50 disabled:cursor-not-allowed ${getStatusColor(order.status)}`}
                      >
                        {AVAILABLE_STATUSES.map(status => (
                          <option key={status} value={status} className="text-gray-900 bg-white font-medium">
                            {status}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-6 py-4 text-right text-sm font-medium space-x-4 no-print">
                      {/* Generate Bill Button */}
                      <button 
                        onClick={() => navigate(`/orders/${order.id}/invoice`)} 
                        className="text-green-600 hover:text-green-900 transition-colors" 
                        title="Generate Bill / Print Invoice"
                      >
                        <Printer className="w-5 h-5 inline-block" />
                      </button>
                      
                      {/* Existing View Details Button */}
                      <button className="text-gray-600 hover:text-indigo-900 transition-colors" title="View Details">
                        <Eye className="w-5 h-5 inline-block" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}