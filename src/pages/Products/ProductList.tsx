import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Search, X, Image as ImageIcon } from 'lucide-react';
import { api } from '../../services/api';
import toast from 'react-hot-toast';

interface Product {
  id: string;
  name: string;
  sku?: string;
  price: number;
  mrp: number;
  stock: number;
  unit?: string;
  weight?: string;
  isActive: boolean;
  isFeatured?: boolean;
  isEssential?: boolean;
  images?: string[];
}

const API_BASE_URL = 'https://drop-down-underwire-impulse.ngrok-free.dev/api/v1'; 

export default function ProductList() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    price: 0,
    mrp: 0,
    stock: 0,
    weight: '',
    image: '',
    isActive: true,
    isFeatured: false,
    isEssential: false,
  });

  // =====================================================
  // FETCH PRODUCTS
  // =====================================================
  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await api.get('/products/admin/all');
      const resData = response.data;
      
      let items: Product[] = [];
      if (resData?.data?.products && Array.isArray(resData.data.products)) {
        items = resData.data.products;
      } else if (Array.isArray(resData?.data)) {
        items = resData.data;
      } else if (Array.isArray(resData)) {
        items = resData;
      }

      setProducts(items);
    } catch (error) {
      console.error("Failed to fetch products", error);
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // =====================================================
  // SUBMIT (CREATE / UPDATE)
  // =====================================================
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error('Product name is required');
      return;
    }

    const payload = {
      name: formData.name,
      sku: formData.sku,
      price: Number(formData.price),
      mrp: Number(formData.mrp),
      stock: Number(formData.stock),
      weight: formData.weight,
      isActive: formData.isActive,
      isFeatured: formData.isFeatured,
      isEssential: formData.isEssential,
      images: formData.image ? [formData.image] : [], 
    };

    try {
      setIsSubmitting(true);
      if (editingId) {
        await api.patch(`/products/${editingId}`, payload);
        toast.success('Product updated successfully');
      } else {
        await api.post('/products', payload);
        toast.success('Product added successfully');
      }
      setIsModalOpen(false);
      fetchProducts();
    } catch (error: any) {
      console.error("Submit error", error);
      toast.error(error?.response?.data?.message || 'Failed to save product');
    } finally {
      setIsSubmitting(false);
    }
  };

  // =====================================================
  // DELETE PRODUCT
  // =====================================================
  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    
    try {
      await api.delete(`/products/${id}`);
      toast.success('Product deleted successfully');
      fetchProducts();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to delete product');
    }
  };

  // =====================================================
  // OPEN MODALS
  // =====================================================
  const openEditModal = (product: Product) => {
    setEditingId(product.id);
    setFormData({
      name: product.name || '',
      sku: product.sku || '',
      price: product.price || 0,
      mrp: product.mrp || 0,
      stock: product.stock || 0,
      weight: product.weight || product.unit || '',
      image: (product.images && product.images.length > 0) ? product.images[0] : '',
      isActive: product.isActive !== false,
      isFeatured: product.isFeatured || false,
      isEssential: product.isEssential || false,
    });
    setIsModalOpen(true);
  };

  const openNewModal = () => {
    setEditingId(null);
    setFormData({ name: '', sku: '', price: 0, mrp: 0, stock: 0, weight: '', image: '', isActive: true, isFeatured: false, isEssential: false });
    setIsModalOpen(true);
  };

  // =====================================================
  // HELPER: GET IMAGE URL
  // =====================================================
  const getImageUrl = (images?: string[]) => {
    if (!images || images.length === 0) return null;
    const img = images[0];
    return img.startsWith('http') ? img : `${API_BASE_URL}/${img}`;
  };

  const filteredProducts = Array.isArray(products) ? products.filter((p) => 
    p.name.toLowerCase().includes(search.toLowerCase()) || 
    (p.sku && p.sku.toLowerCase().includes(search.toLowerCase()))
  ) : [];

  return (
    <div className="space-y-6 relative">
      {/* Page Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Products Management</h1>
        <button 
          onClick={openNewModal}
          className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-lg font-medium flex items-center transition-colors shadow-sm"
        >
          <Plus className="w-5 h-5 mr-2" />
          Add New Product
        </button>
      </div>

      {/* Filters & Search */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex gap-4">
        <div className="relative flex-1">
          <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input 
            type="text" 
            placeholder="Search products by name or SKU..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-yellow-500 focus:border-yellow-500 outline-none"
          />
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full whitespace-nowrap">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Product Info</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Price/MRP</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Stock</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                    Loading products...
                  </td>
                </tr>
              ) : filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                    No products found.
                  </td>
                </tr>
              ) : (
                filteredProducts.map((product) => (
                  <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="h-10 w-10 flex-shrink-0 bg-gray-50 border border-gray-200 rounded-lg overflow-hidden flex items-center justify-center">
                          {getImageUrl(product.images) ? (
                            <img src={getImageUrl(product.images)!} alt={product.name} className="h-full w-full object-contain p-1" />
                          ) : (
                            <ImageIcon className="text-gray-300 w-5 h-5" />
                          )}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{product.name}</div>
                          <div className="text-sm text-gray-500">SKU: {product.sku || 'N/A'} • {product.weight || product.unit}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 font-bold">₹{product.price || 0}</div>
                      <div className="text-xs text-gray-400 line-through">₹{product.mrp || 0}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        product.stock > 10 ? 'bg-green-100 text-green-800' : product.stock > 0 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {product.stock} left
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        product.isActive ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {product.isActive ? 'Active' : 'Draft'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right text-sm font-medium space-x-3">
                      <button onClick={() => openEditModal(product)} className="text-indigo-600 hover:text-indigo-900 bg-indigo-50 p-2 rounded-md transition-colors">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(product.id)} className="text-red-600 hover:text-red-900 bg-red-50 p-2 rounded-md transition-colors">
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

      {/* =====================================================
          ADD/EDIT MODAL
          ===================================================== */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center p-6 border-b border-gray-100 shrink-0">
              <h2 className="text-xl font-bold text-gray-900">
                {editingId ? 'Edit Product' : 'Add New Product'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 p-1">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="overflow-y-auto p-6">
              <form id="productForm" onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Product Name - Full Width */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-bold text-gray-700 mb-1">Product Name</label>
                  <input 
                    type="text" required value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 outline-none"
                    placeholder="e.g. Britannia Good Day"
                  />
                </div>

                {/* SKU */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">SKU (Optional)</label>
                  <input 
                    type="text" value={formData.sku}
                    onChange={(e) => setFormData({...formData, sku: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 outline-none"
                    placeholder="e.g. BGD-100"
                  />
                </div>

                {/* Weight / Unit */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Weight / Unit</label>
                  <input 
                    type="text" value={formData.weight} required
                    onChange={(e) => setFormData({...formData, weight: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 outline-none"
                    placeholder="e.g. 500g, 1L, 1 Unit"
                  />
                </div>

                {/* Selling Price */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Selling Price (₹)</label>
                  <input 
                    type="number" required min="0" step="0.01" value={formData.price}
                    onChange={(e) => setFormData({...formData, price: Number(e.target.value)})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 outline-none"
                  />
                </div>

                {/* MRP */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">MRP (₹)</label>
                  <input 
                    type="number" required min="0" step="0.01" value={formData.mrp}
                    onChange={(e) => setFormData({...formData, mrp: Number(e.target.value)})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 outline-none"
                  />
                </div>

                {/* Stock */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Available Stock</label>
                  <input 
                    type="number" required min="0" value={formData.stock}
                    onChange={(e) => setFormData({...formData, stock: Number(e.target.value)})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 outline-none"
                  />
                </div>

                {/* Status Toggles - Full Width */}
                <div className="md:col-span-2 flex flex-wrap gap-6 pt-4 border-t border-gray-100 mt-2">
                  <div className="flex items-center">
                    <input 
                      type="checkbox" id="isActiveProduct" checked={formData.isActive}
                      onChange={(e) => setFormData({...formData, isActive: e.target.checked})}
                      className="w-4 h-4 text-yellow-500 rounded focus:ring-yellow-500 cursor-pointer"
                    />
                    <label htmlFor="isActiveProduct" className="ml-2 text-sm font-bold text-gray-700 cursor-pointer">
                      Active (Visible)
                    </label>
                  </div>

                  <div className="flex items-center">
                    <input 
                      type="checkbox" id="isFeatured" checked={formData.isFeatured}
                      onChange={(e) => setFormData({...formData, isFeatured: e.target.checked})}
                      className="w-4 h-4 text-blue-500 rounded focus:ring-blue-500 cursor-pointer"
                    />
                    <label htmlFor="isFeatured" className="ml-2 text-sm font-bold text-gray-700 cursor-pointer">
                      Show in Best Selling
                    </label>
                  </div>

                  <div className="flex items-center">
                    <input 
                      type="checkbox" id="isEssential" checked={formData.isEssential}
                      onChange={(e) => setFormData({...formData, isEssential: e.target.checked})}
                      className="w-4 h-4 text-green-500 rounded focus:ring-green-500 cursor-pointer"
                    />
                    <label htmlFor="isEssential" className="ml-2 text-sm font-bold text-gray-700 cursor-pointer">
                      Show in Everyday Essentials
                    </label>
                  </div>
                </div>

                {/* Image URL - Full Width */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-bold text-gray-700 mb-1">Product Image URL</label>
                  <input 
                    type="text" value={formData.image}
                    onChange={(e) => setFormData({...formData, image: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 outline-none"
                    placeholder="https://example.com/image.jpg"
                  />
                  <p className="text-xs text-gray-500 mt-1">Provide a valid image URL for the product.</p>
                </div>
              </form>
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-gray-100 flex gap-3 shrink-0">
              <button 
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="flex-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-bold transition-colors"
              >
                Cancel
              </button>
              <button 
                type="submit"
                form="productForm"
                disabled={isSubmitting}
                className="flex-1 px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg font-bold transition-colors disabled:opacity-50"
              >
                {isSubmitting ? 'Saving...' : 'Save Product'}
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}