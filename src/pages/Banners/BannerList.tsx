import { useState, useEffect } from 'react';
import { Plus, Trash2, ImageIcon, Link as LinkIcon } from 'lucide-react';
import { api } from '../../services/api';
import toast from 'react-hot-toast';

interface Category {
  id: string;
  name: string;
}

interface Banner {
  id: string;
  image: string;
  isActive: boolean;
  sortOrder: number;
  category?: {
    id: string;
    name: string;
    slug: string;
  };
}

export default function BannerList() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  
  const [image, setImage] = useState('');
  const [sortOrder, setSortOrder] = useState('0');
  const [categoryId, setCategoryId] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchBannersAndCategories = async () => {
    try {
      setLoading(true);
      // Fetch Banners
      const bannerRes = await api.get('/banners');
      let bannerItems = bannerRes.data?.data || bannerRes.data || [];
      setBanners(Array.isArray(bannerItems) ? bannerItems : []);

      // Fetch Categories for Dropdown
      const catRes = await api.get('/categories');
      let catItems = catRes.data?.data || catRes.data || [];
      setCategories(Array.isArray(catItems) ? catItems : []);

    } catch (error) {
      console.error("Failed to fetch data", error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBannersAndCategories();
  }, []);

  const handleCreateBanner = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!image.trim()) {
      toast.error('Please enter a valid image URL');
      return;
    }

    try {
      setSubmitting(true);
      await api.post('/banners', {
        image: image.trim(),
        sortOrder: Number(sortOrder) || 0,
        isActive: true,
        // Agar category select ki hai toh bhejenge, warna undefined
        categoryId: categoryId ? categoryId : undefined, 
      });
      toast.success('Banner created successfully!');
      setImage('');
      setSortOrder('0');
      setCategoryId('');
      setShowAddModal(false);
      fetchBannersAndCategories();
    } catch (error: any) {
      console.error('Failed to create banner', error);
      toast.error(error?.response?.data?.message || 'Failed to create banner');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteBanner = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this banner?')) return;

    try {
      await api.delete(`/banners/${id}`);
      toast.success('Banner deleted successfully');
      fetchBannersAndCategories();
    } catch (error) {
      console.error('Failed to delete banner', error);
      toast.error('Failed to delete banner');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Banners Management</h1>
        <button 
          onClick={() => setShowAddModal(true)}
          className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-lg font-medium flex items-center transition-colors"
        >
          <Plus className="w-5 h-5 mr-2" />
          Add Banner
        </button>
      </div>

      {/* Add Banner Modal / Form Box */}
      {showAddModal && (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Add New Banner</h2>
          <form onSubmit={handleCreateBanner} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Banner Image URL</label>
              <input 
                type="text" 
                placeholder="https://example.com/image.jpg" 
                value={image}
                onChange={(e) => setImage(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-yellow-500 focus:border-yellow-500"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Link to Category (Optional)</label>
                <select 
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-yellow-500 focus:border-yellow-500 bg-white"
                >
                  <option value="">No Link (Display Only)</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Sort Order (Position)</label>
                <input 
                  type="number" 
                  placeholder="0" 
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-yellow-500 focus:border-yellow-500"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-2">
              <button 
                type="button" 
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium"
              >
                Cancel
              </button>
              <button 
                type="submit" 
                disabled={submitting}
                className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg font-medium"
              >
                {submitting ? 'Saving...' : 'Save Banner'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Banners Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full whitespace-nowrap">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Banner Image</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Linked Category</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Sort Order</th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-gray-500">Loading banners...</td>
                </tr>
              ) : banners.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-gray-500">No banners found.</td>
                </tr>
              ) : (
                banners.map((banner) => (
                  <tr key={banner.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="h-16 w-32 flex-shrink-0 bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center border border-gray-200">
                        {banner.image ? (
                          <img 
                            src={banner.image.startsWith('http') ? banner.image : `http://localhost:3000/api/v1/${banner.image}`} 
                            alt="Banner" 
                            className="h-full w-full object-cover" 
                          />
                        ) : (
                          <ImageIcon className="w-6 h-6 text-gray-400" />
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {banner.category ? (
                        <div className="flex items-center text-sm text-indigo-600 font-medium">
                          <LinkIcon className="w-4 h-4 mr-1.5" />
                          {banner.category.name}
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400 italic">None</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                        #{banner.sortOrder || 0}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right text-sm font-medium">
                      <button 
                        onClick={() => handleDeleteBanner(banner.id)}
                        className="text-red-600 hover:text-red-900 bg-red-50 p-2 rounded-md"
                        title="Delete Banner"
                      >
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
    </div>
  );
}