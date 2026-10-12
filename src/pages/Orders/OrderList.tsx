import { useState, useEffect } from 'react';
import { Search, Eye, Printer, X, Package, Calendar, MapPin, User, Phone } from 'lucide-react';
import { api } from '../../services/api';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

const API_BASE_URL = 'https://shope2door-api.duckdns.org/api/v1';

interface OrderItem {
  id: string;
  productName?: string;
  name?: string;
  quantity: number;
  unitPrice?: number | string;
  mrp?: number | string;
  total?: number | string;
  price?: number | string;
  productImage?: string;
  product?: {
    id?: string;
    name?: string;
    images?: string[];
    weight?: string;
    unit?: string;
  };
}

interface OrderAddress {
  id?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  pincode?: string;
  landmark?: string;
}

interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  address?: OrderAddress | string;
  landmark?: string;
  status: string;
  total: number | string;
  subtotal?: number | string;
  deliveryFee?: number | string;
  tax?: number | string;
  notes?: string;
  paymentMethod?: string;
  placedAt?: string;
  createdAt?: string;
  deliverySlot?: string;
  items?: OrderItem[];
}

export default function OrderList() {
  const navigate = useNavigate();

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Modal States
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [modalLoading, setModalLoading] = useState(false);

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

  // Eye Button Click -> Fetch Single Order Safely
  const handleViewDetails = async (orderId: string) => {
    try {
      setModalLoading(true);
      // Temporary placeholder to open modal immediately
      const initialLocalOrder = orders.find(o => o.id === orderId) || null;
      setSelectedOrder(initialLocalOrder);

      const response = await api.get(`/orders/admin/${orderId}`);
      const resData = response.data;
      const detailedOrder = resData?.data || resData?.order || resData;

      if (detailedOrder && typeof detailedOrder === 'object') {
        setSelectedOrder(detailedOrder);
      }
    } catch (error) {
      console.error("Failed to fetch order details:", error);
      toast.error("Could not fetch latest details, showing list data.");
    } finally {
      setModalLoading(false);
    }
  };

  const filteredOrders = Array.isArray(orders) ? orders.filter((o) => {
    const searchLower = search.toLowerCase();
    return (
      o.orderNumber?.toLowerCase().includes(searchLower) ||
      o.customerPhone?.includes(searchLower) ||
      o.customerName?.toLowerCase().includes(searchLower)
    );
  }) : [];

  const AVAILABLE_STATUSES = [
    'PENDING', 'CONFIRMED', 'PROCESSING', 'PACKED', 
    'DISPATCHED', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED'
  ];

  const handleStatusUpdate = async (orderId: string, newStatus: string) => {
    try {
      const response = await api.patch(`/orders/admin/${orderId}/status`, { status: newStatus });
      if (response.data.success || response.status === 200) {
         toast.success(`Order marked as ${newStatus}`);
         setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
         if (selectedOrder && selectedOrder.id === orderId) {
           setSelectedOrder(prev => prev ? { ...prev, status: newStatus } : null);
         }
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

  const getItemImage = (item: OrderItem) => {
    const rawImg = item.productImage || item.product?.images?.[0];
    if (!rawImg) return null;
    return rawImg.startsWith('http') ? rawImg : `${API_BASE_URL}/uploads/${rawImg.replace(/^\//, '')}`;
  };

  const formatAddress = (addr?: OrderAddress | string) => {
    if (!addr) return 'N/A';
    if (typeof addr === 'string') return addr;
    return `${addr.addressLine1 || ''} ${addr.addressLine2 || ''}, ${addr.city || ''} ${addr.pincode || ''}`.trim();
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
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-yellow-500 focus:border-yellow-500 text-sm"
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
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500 text-sm">Loading orders...</td>
                </tr>
              ) : filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500 text-sm">No orders found.</td>
                </tr>
              ) : (
                filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="text-sm font-bold text-indigo-600">#{order.orderNumber}</div>
                      <div className="text-xs text-gray-500">
                        {order.placedAt || order.createdAt ? new Date(order.placedAt || order.createdAt!).toLocaleString() : 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{order.customerName}</div>
                      <div className="text-sm text-gray-500">{order.customerPhone}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-bold text-gray-900">₹{Number(order.total || 0).toFixed(2)}</div>
                    </td>
                    <td className="px-6 py-4 no-print">
                      <select 
                        value={order.status}
                        onChange={(e) => handleStatusUpdate(order.id, e.target.value)}
                        disabled={order.status === 'DELIVERED'}
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
                      <button 
                        onClick={() => navigate(`/orders/${order.id}/invoice`)} 
                        className="text-green-600 hover:text-green-900 transition-colors" 
                        title="Generate Bill / Print Invoice"
                      >
                        <Printer className="w-5 h-5 inline-block" />
                      </button>
                      
                      <button 
                        onClick={() => handleViewDetails(order.id)}
                        className="text-gray-600 hover:text-indigo-900 transition-colors" 
                        title="View Details"
                      >
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

      {/* ========================================================= */}
      {/* ORDER DETAILS MODAL (FULL PREVIEW LIKE FIRST SCREENSHOT) */}
      {/* ========================================================= */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col my-auto border border-gray-100">
            
            {/* Modal Header */}
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-100 flex justify-between items-center">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Order #{selectedOrder.orderNumber}</h2>
                <p className="text-xs text-gray-500">Customer: <span className="font-semibold text-gray-700">{selectedOrder.customerName}</span></p>
              </div>
              <div className="flex items-center gap-3">
                <span className={`px-3 py-1 text-xs font-bold rounded-full ${getStatusColor(selectedOrder.status)}`}>
                  {selectedOrder.status}
                </span>
                <button 
                  onClick={() => setSelectedOrder(null)} 
                  className="p-1.5 rounded-full text-gray-400 hover:bg-gray-200 hover:text-gray-700 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6 text-sm text-gray-700">
              {modalLoading && (!selectedOrder.items || selectedOrder.items.length === 0) ? (
                <div className="py-12 text-center text-gray-500 text-sm">Loading complete order details...</div>
              ) : (
                <>
                  {/* Order Information Section */}
                  <div className="bg-gray-50 p-4 rounded-xl space-y-2 border border-gray-100">
                    <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <Calendar className="w-4 h-4 text-indigo-600" /> ORDER INFORMATION
                    </h3>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div><span className="text-gray-500">Order Date:</span> <span className="font-semibold">{selectedOrder.placedAt || selectedOrder.createdAt ? new Date(selectedOrder.placedAt || selectedOrder.createdAt!).toLocaleString() : 'N/A'}</span></div>
                      <div><span className="text-gray-500">Delivery Slot:</span> <span className="font-semibold">{selectedOrder.deliverySlot || 'Standard Delivery (20-30m)'}</span></div>
                      <div><span className="text-gray-500">Subtotal:</span> <span className="font-semibold">₹{Number(selectedOrder.subtotal || 0).toFixed(2)}</span></div>
                      <div><span className="text-gray-500">Delivery Fee:</span> <span className="font-semibold">₹{Number(selectedOrder.deliveryFee || 0).toFixed(2)}</span></div>
                      <div><span className="text-gray-500 font-bold">Total Amount:</span> <span className="font-bold text-indigo-600">₹{Number(selectedOrder.total || 0).toFixed(2)}</span></div>
                    </div>
                  </div>

                  {/* Customer Information Section */}
                  <div className="bg-gray-50 p-4 rounded-xl space-y-2 border border-gray-100">
                    <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <User className="w-4 h-4 text-indigo-600" /> CUSTOMER INFORMATION
                    </h3>
                    <div className="space-y-1.5 text-xs">
                      <div className="flex items-center gap-2">
                        <User className="w-3.5 h-3.5 text-gray-400" />
                        <span className="font-semibold">{selectedOrder.customerName}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="w-3.5 h-3.5 text-gray-400" />
                        <span>{selectedOrder.customerPhone}</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <MapPin className="w-3.5 h-3.5 text-gray-400 mt-0.5" />
                        <span>Address: {formatAddress(selectedOrder.address)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Order Items Section */}
                  <div>
                    <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                      <Package className="w-4 h-4 text-indigo-600" /> ORDER ITEMS
                    </h3>
                    
                    {selectedOrder.items && selectedOrder.items.length > 0 ? (
                      <div className="space-y-2.5">
                        {selectedOrder.items.map((item, idx) => {
                          const imgUrl = getItemImage(item);
                          const itemName = item.productName || item.name || item.product?.name || 'Product Item';
                          const itemPrice = Number(item.unitPrice || item.price || 0);
                          const itemTotal = Number(item.total || itemPrice * item.quantity);
                          const itemWeight = item.product?.weight || item.product?.unit || '';

                          return (
                            <div key={item.id || idx} className="flex items-center justify-between p-3 bg-white border border-gray-100 rounded-xl hover:shadow-sm transition-shadow">
                              <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-lg bg-gray-100 overflow-hidden flex items-center justify-center border border-gray-200 flex-shrink-0">
                                  {imgUrl ? (
                                    <img src={imgUrl} alt={itemName} className="w-full h-full object-cover" />
                                  ) : (
                                    <Package className="w-6 h-6 text-gray-400" />
                                  )}
                                </div>
                                <div>
                                  <div className="font-semibold text-gray-900 text-xs">{itemName}</div>
                                  <div className="text-[11px] text-gray-500">
                                    {itemWeight && <span>Weight: {itemWeight} • </span>}
                                    <span>Qty: <span className="font-bold text-gray-800">{item.quantity}</span></span>
                                  </div>
                                </div>
                              </div>
                              <div className="font-bold text-gray-900 text-sm">
                                ₹{itemTotal.toFixed(2)}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="p-4 text-center text-gray-400 bg-gray-50 rounded-xl text-xs">
                        No items found in this order.
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-end gap-3">
              <button 
                onClick={() => navigate(`/orders/${selectedOrder.id}/invoice`)}
                className="px-4 py-2 bg-emerald-600 text-white font-semibold rounded-xl text-xs hover:bg-emerald-700 transition-colors flex items-center gap-2"
              >
                <Printer className="w-4 h-4" /> Print Bill
              </button>
              <button 
                onClick={() => setSelectedOrder(null)}
                className="px-4 py-2 bg-gray-200 text-gray-700 font-semibold rounded-xl text-xs hover:bg-gray-300 transition-colors"
              >
                Close
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}