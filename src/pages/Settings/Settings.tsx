import { useState, useEffect } from 'react';
import { Store, Truck, PhoneCall, Save } from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '../../services/api';

export default function Settings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Store Settings State
  const [isClosed, setIsClosed] = useState(false);
  const [closedMessage, setClosedMessage] = useState('');

  // Delivery Settings State
  const [deliveryCharge, setDeliveryCharge] = useState('0');
  const [freeDeliveryAbove, setFreeDeliveryAbove] = useState('0');
  const [minOrderAmount, setMinOrderAmount] = useState('0');

  // Contact Settings State
  const [phone, setPhone] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [email, setEmail] = useState('');

  // 1. Fetch settings on page load
  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await api.get('/settings');
      if (response.data?.success) {
        const { store, help, delivery } = response.data.data;
        
        setIsClosed(store?.isClosed || false);
        setClosedMessage(store?.closedMessage || '');
        
        setPhone(help?.phone || '');
        setWhatsapp(help?.whatsapp || '');
        setEmail(help?.email || '');
        
        setDeliveryCharge(delivery?.deliveryCharge?.toString() || '0');
        setFreeDeliveryAbove(delivery?.freeDeliveryAbove?.toString() || '0');
        setMinOrderAmount(delivery?.minimumOrderAmount?.toString() || '0');
      }
    } catch (error) {
      toast.error('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  // 2. Save settings to backend
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        isClosed,
        closedMessage,
        phone,
        whatsapp,
        email,
        deliveryCharge: Number(deliveryCharge),
        freeDeliveryAbove: Number(freeDeliveryAbove),
        minimumOrderAmount: Number(minOrderAmount),
      };

      const response = await api.post('/settings', payload);
      if (response.data?.success) {
        toast.success('Settings updated successfully!');
      }
    } catch (error) {
      toast.error('Failed to update settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-gray-500">Loading settings...</div>;
  }

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">App Settings</h1>
        <button 
          onClick={handleSave}
          disabled={saving}
          className="bg-yellow-500 hover:bg-yellow-600 text-white px-5 py-2.5 rounded-lg font-medium flex items-center transition-colors disabled:opacity-50"
        >
          <Save className="w-5 h-5 mr-2" />
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Store Status Card */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center mb-6">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg mr-3">
              <Store className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-bold text-gray-900">Store Status</h2>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">Temporarily Close Store</p>
                <p className="text-sm text-gray-500">Stop accepting new orders</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  className="sr-only peer" 
                  checked={isClosed}
                  onChange={(e) => setIsClosed(e.target.checked)}
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-yellow-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-500"></div>
              </label>
            </div>
            {isClosed && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Closing Message (Shown to users)</label>
                <input 
                  type="text" 
                  value={closedMessage}
                  onChange={(e) => setClosedMessage(e.target.value)}
                  placeholder="e.g. We are closed for maintenance."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-yellow-500 focus:border-yellow-500"
                />
              </div>
            )}
          </div>
        </div>

        {/* Contact/Help Details Card */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center mb-6">
            <div className="p-2 bg-green-50 text-green-600 rounded-lg mr-3">
              <PhoneCall className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-bold text-gray-900">Support & Contact</h2>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Support Phone</label>
              <input 
                type="text" 
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 9876543210"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-yellow-500 focus:border-yellow-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">WhatsApp Number</label>
              <input 
                type="text" 
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                placeholder="+91 9876543210"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-yellow-500 focus:border-yellow-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Support Email</label>
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="help@shop2door.com"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-yellow-500 focus:border-yellow-500"
              />
            </div>
          </div>
        </div>

        {/* Delivery Settings Card */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 lg:col-span-2">
          <div className="flex items-center mb-6">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg mr-3">
              <Truck className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-bold text-gray-900">Delivery Configurations</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Standard Delivery Charge (₹)</label>
              <input 
                type="number" 
                value={deliveryCharge}
                onChange={(e) => setDeliveryCharge(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-yellow-500 focus:border-yellow-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Free Delivery Above (₹)</label>
              <input 
                type="number" 
                value={freeDeliveryAbove}
                onChange={(e) => setFreeDeliveryAbove(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-yellow-500 focus:border-yellow-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Minimum Order Amount (₹)</label>
              <input 
                type="number" 
                value={minOrderAmount}
                onChange={(e) => setMinOrderAmount(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-yellow-500 focus:border-yellow-500"
              />
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}