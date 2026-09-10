import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import { Printer, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';

export default function OrderInvoice() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrderDetails = async () => {
      try {
        const response = await api.get(`/orders/admin/${id}`);
        const data = response.data?.data || response.data?.order || response.data;
        setOrder(data);
      } catch (error) {
        toast.error("Failed to load invoice data");
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchOrderDetails();
  }, [id]);

  if (loading) return <div className="p-8 text-center text-gray-500">Loading Invoice...</div>;
  if (!order) return <div className="p-8 text-center text-gray-500">Order not found</div>;

  const subtotal = Number(order.subtotal) || 0;
  const deliveryFee = Number(order.deliveryFee) || 0;
  const total = Number(order.total) || 0;
  
  const discount = Number(order.discount || order.couponDiscount) || 0;

  const backendHandling = Number(order.handlingFee ?? order.handlingCharge);
  const handlingFee = backendHandling > 0 
    ? backendHandling 
    : Math.max(0, total - subtotal - deliveryFee + discount) || (subtotal > 0 ? 5 : 0);

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      {/* Top Action Bar - Will be hidden during print */}
      <div className="max-w-3xl mx-auto mb-6 flex justify-between items-center no-print">
        <button onClick={() => navigate(-1)} className="flex items-center text-gray-600 hover:text-gray-900 font-medium">
          <ArrowLeft className="w-5 h-5 mr-2" /> Back to Orders
        </button>
        <button 
          onClick={() => window.print()} 
          className="flex items-center bg-gray-900 text-white px-5 py-2.5 rounded-lg font-semibold hover:bg-gray-800 transition-colors"
        >
          <Printer className="w-5 h-5 mr-2" /> Print Invoice
        </button>
      </div>

      {/* Printable Invoice Container */}
      <div className="print-area max-w-3xl mx-auto bg-white p-8 md:p-12 shadow-sm border border-gray-200">
        <h1 className="text-2xl font-bold text-center mb-8 uppercase tracking-wider text-gray-900">Tax Invoice</h1>

        {/* Info Grid */}
        <div className="grid grid-cols-2 gap-8 mb-8">
          <div>
            <h3 className="text-sm font-bold text-gray-800 border-b pb-2 mb-3">Order Information</h3>
            <div className="text-sm text-gray-600 space-y-1.5">
              <p><span className="font-semibold text-gray-800">Order ID:</span> #{order.orderNumber}</p>
              <p><span className="font-semibold text-gray-800">Order Date:</span> {new Date(order.createdAt || order.placedAt).toLocaleString()}</p>
              <p><span className="font-semibold text-gray-800">Status:</span> {order.status}</p>
            </div>
          </div>
          
          <div>
            <h3 className="text-sm font-bold text-gray-800 border-b pb-2 mb-3">Customer Information</h3>
            <div className="text-sm text-gray-600 space-y-1.5">
              <p><span className="font-semibold text-gray-800">Name:</span> {order.customerName || order.user?.name}</p>
              <p><span className="font-semibold text-gray-800">Phone:</span> {order.customerPhone || order.user?.phone || 'N/A'}</p>
              <p><span className="font-semibold text-gray-800">Address:</span> {order.address ? `${order.address.addressLine1}, ${order.address.city}` : 'N/A'}</p>
            </div>
          </div>
        </div>

        {/* Order Items Table */}
        <div className="mb-8">
          <h3 className="text-sm font-bold text-gray-800 border-b pb-2 mb-3">Order Items</h3>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-800 border-b">
                <th className="py-2">Item</th>
                <th className="py-2 text-center">Qty</th>
                <th className="py-2 text-right">Unit Price</th>
                <th className="py-2 text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {(order.items || []).map((item: any, index: number) => (
                <tr key={index}>
                  <td className="py-3 text-gray-700">{item.productName || item.product?.name}</td>
                  <td className="py-3 text-center text-gray-700">{item.quantity}</td>
                  <td className="py-3 text-right text-gray-700">₹{item.unitPrice || item.price}</td>
                  <td className="py-3 text-right font-medium text-gray-900">₹{item.total || (item.unitPrice * item.quantity)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Order Summary */}
        <div className="flex justify-end">
          <div className="w-1/2">
            <h3 className="text-sm font-bold text-gray-800 border-b pb-2 mb-3">Order Summary</h3>
            <div className="text-sm space-y-2">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal:</span>
                <span>₹{subtotal}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Delivery Fee:</span>
                <span>₹{deliveryFee}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Handling Fee:</span>
                <span>₹{handlingFee}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-gray-600">
                  <span>Discount:</span>
                  <span className="text-green-600">- ₹{discount}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-gray-900 text-base pt-2 border-t mt-2">
                <span>Total Amount:</span>
                <span>₹{total}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}