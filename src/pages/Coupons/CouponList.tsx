import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Search, Ticket, X } from 'lucide-react';
import { api } from '../../services/api';
import toast from 'react-hot-toast';

interface Coupon {
  id: string;
  code: string;
  description?: string;
  type: 'PERCENTAGE' | 'FLAT';
  value: number;
  minOrderAmount?: number;
  maxDiscount?: number;
  usageLimit?: number;
  expiresAt: string;
  isActive: boolean;
  usedCount?: number;
}

export default function CouponList() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  
  // Form States matching Backend DTO
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<'PERCENTAGE' | 'FLAT'>('PERCENTAGE');
  const [value, setValue] = useState('');
  const [minOrderAmount, setMinOrderAmount] = useState('');
  const [maxDiscount, setMaxDiscount] = useState('');
  const [usageLimit, setUsageLimit] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const fetchCoupons = async () => {
    try {
      setLoading(true);
      const response = await api.get('/coupons');
      const resData = response.data;
      
      let items: Coupon[] = [];
      if (resData?.data?.coupons && Array.isArray(resData.data.coupons)) {
        items = resData.data.coupons;
      } else if (resData?.coupons && Array.isArray(resData.coupons)) {
        items = resData.coupons;
      } else if (Array.isArray(resData)) {
        items = resData;
      }

      setCoupons(items);
    } catch (error) {
      console.error("Failed to fetch coupons", error);
      toast.error('Failed to load coupons');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoupons();
  }, []);

  const handleOpenAddModal = () => {
    setEditingCoupon(null);
    setCode('');
    setDescription('');
    setType('PERCENTAGE');
    setValue('');
    setMinOrderAmount('');
    setMaxDiscount('');
    setUsageLimit('');
    setExpiresAt('');
    setIsActive(true);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (coupon: Coupon) => {
    setEditingCoupon(coupon);
    setCode(coupon.code);
    setDescription(coupon.description || '');
    setType(coupon.type || 'PERCENTAGE');
    setValue(coupon.value?.toString() || '');
    setMinOrderAmount(coupon.minOrderAmount?.toString() || '');
    setMaxDiscount(coupon.maxDiscount?.toString() || '');
    setUsageLimit(coupon.usageLimit?.toString() || '');
    setExpiresAt(coupon.expiresAt ? coupon.expiresAt.split('T')[0] : '');
    setIsActive(coupon.isActive);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code || !value || !expiresAt) {
      toast.error('Please fill all required fields');
      return;
    }

    try {
      setSubmitting(true);
      
      const payload: any = {
        code: code.trim().toUpperCase(),
        description: description.trim() || undefined,
        type,
        value: Number(value),
        minOrderAmount: minOrderAmount ? Number(minOrderAmount) : undefined,
        maxDiscount: maxDiscount ? Number(maxDiscount) : undefined,
        usageLimit: usageLimit ? Number(usageLimit) : undefined,
        expiresAt: new Date(expiresAt).toISOString(),
      };

      if (editingCoupon) {
        payload.isActive = isActive; // Sirf edit ke waqt bhejo
        await api.patch(`/coupons/${editingCoupon.id}`, payload);
        toast.success('Coupon updated successfully');
      } else {
        await api.post('/coupons', payload);
        toast.success('Coupon created successfully');
      }

      setIsModalOpen(false);
      fetchCoupons();
    } catch (error: any) {
      console.error('Failed to save coupon', error);
      toast.error(error?.response?.data?.message || 'Failed to save coupon');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to deactivate this coupon?')) return;

    try {
      await api.delete(`/coupons/${id}`);
      toast.success('Coupon deactivated successfully');
      fetchCoupons();
    } catch (error) {
      console.error('Failed to delete coupon', error);
      toast.error('Failed to delete coupon');
    }
  };

  const filteredCoupons = Array.isArray(coupons) ? coupons.filter((c) => 
    c.code.toLowerCase().includes(search.toLowerCase())
  ) : [];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Coupons Management</h1>
        <button 
          onClick={handleOpenAddModal}
          className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-lg font-medium flex items-center transition-colors"
        >
          <Plus className="w-5 h-5 mr-2" />
          Add Coupon
        </button>
      </div>

      {/* Search */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <div className="relative">
          <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input 
            type="text" 
            placeholder="Search by coupon code..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-yellow-500 focus:border-yellow-500 outline-none"
          />
        </div>
      </div>

      {/* Coupons Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full whitespace-nowrap">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Coupon Code</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Discount & Rules</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Usage / Expiry</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">Loading coupons...</td>
                </tr>
              ) : filteredCoupons.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">No coupons found.</td>
                </tr>
              ) : (
                filteredCoupons.map((coupon) => (
                  <tr key={coupon.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg mr-3">
                          <Ticket className="w-5 h-5" />
                        </div>
                        <div>
                          <span className="font-bold text-gray-900 tracking-wider">{coupon.code}</span>
                          {coupon.description && <p className="text-xs text-gray-500">{coupon.description}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">
                        {coupon.type === 'PERCENTAGE' ? `${coupon.value}% OFF` : `₹${coupon.value} OFF`}
                      </div>
                      <div className="text-xs text-gray-500">
                        {coupon.minOrderAmount ? `Min: ₹${coupon.minOrderAmount}` : 'No min spend'} 
                        {coupon.maxDiscount ? ` | Max: ₹${coupon.maxDiscount}` : ''}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">Used: {coupon.usedCount || 0} {coupon.usageLimit ? `/ ${coupon.usageLimit}` : ''}</div>
                      <div className="text-xs text-gray-500">Expires: {coupon.expiresAt ? new Date(coupon.expiresAt).toLocaleDateString() : 'N/A'}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        coupon.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {coupon.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right text-sm font-medium space-x-3">
                      <button onClick={() => handleOpenEditModal(coupon)} className="text-indigo-600 hover:text-indigo-900 bg-indigo-50 p-2 rounded-md transition-colors">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(coupon.id)} className="text-red-600 hover:text-red-900 bg-red-50 p-2 rounded-md transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg p-6 shadow-xl relative animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900">
                {editingCoupon ? 'Edit Coupon' : 'Add New Coupon'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Coupon Code</label>
                  <input 
                    type="text"
                    placeholder="e.g. WELCOME50"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-yellow-500 focus:border-yellow-500 uppercase outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Discount Type</label>
                  <select 
                    value={type}
                    onChange={(e) => setType(e.target.value as 'PERCENTAGE' | 'FLAT')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-yellow-500 focus:border-yellow-500 outline-none bg-white"
                  >
                    <option value="PERCENTAGE">Percentage (%)</option>
                    <option value="FLAT">Flat Amount (₹)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">
                  {type === 'PERCENTAGE' ? 'Percentage Value (1-100)' : 'Flat Amount (₹)'}
                </label>
                <input 
                  type="number"
                  placeholder={type === 'PERCENTAGE' ? 'e.g. 20' : 'e.g. 100'}
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  required
                  min="0.01"
                  max={type === 'PERCENTAGE' ? "100" : undefined}
                  step="any"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-yellow-500 focus:border-yellow-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Min Order Amount (₹)</label>
                  <input 
                    type="number"
                    placeholder="e.g. 199"
                    value={minOrderAmount}
                    onChange={(e) => setMinOrderAmount(e.target.value)}
                    min="0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-yellow-500 focus:border-yellow-500 outline-none"
                  />
                </div>
                {type === 'PERCENTAGE' && (
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Max Discount Cap (₹)</label>
                    <input 
                      type="number"
                      placeholder="e.g. 150"
                      value={maxDiscount}
                      onChange={(e) => setMaxDiscount(e.target.value)}
                      min="0"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-yellow-500 focus:border-yellow-500 outline-none"
                    />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Usage Limit (Total uses)</label>
                  <input 
                    type="number"
                    placeholder="e.g. 100"
                    value={usageLimit}
                    onChange={(e) => setUsageLimit(e.target.value)}
                    min="1"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-yellow-500 focus:border-yellow-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Expiry Date</label>
                  <input 
                    type="date"
                    value={expiresAt}
                    onChange={(e) => setExpiresAt(e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-yellow-500 focus:border-yellow-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Description (Optional)</label>
                <input 
                  type="text"
                  placeholder="e.g. Get 20% off on orders above ₹199"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-yellow-500 focus:border-yellow-500 outline-none"
                />
              </div>

              <div className="flex items-center pt-2">
                <input 
                  type="checkbox"
                  id="isActive"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="w-4 h-4 text-yellow-500 border-gray-300 rounded focus:ring-yellow-500"
                />
                <label htmlFor="isActive" className="ml-2 text-sm font-medium text-gray-700">Active Coupon</label>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-100">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : editingCoupon ? 'Update Coupon' : 'Create Coupon'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}