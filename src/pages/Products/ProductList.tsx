import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Search, X, Image as ImageIcon, Upload } from 'lucide-react';
import { api } from '../../services/api';
import toast from 'react-hot-toast';

interface Product {
  id: string;
  name: string;
  slug?: string;
  sku?: string;
  price: number;
  mrp: number;
  stock: number;
  unit?: string;
  weight?: string;
  categoryId: string;
  isActive: boolean;
  isFeatured?: boolean;
  isEssential?: boolean;
  images?: string[];
}

const API_BASE_URL = 'https://drop-down-underwire-impulse.ngrok-free.dev/api/v1'; 

// =====================================================
// HELPER: GET ADMIN IMAGE URL
// =====================================================
const getAdminImageUrl = (path?: string | null) => {
  if (!path) return '';
  if (path.startsWith('http')) return path.replace(/\s+/g, '%20');
  const cleanPath = path.startsWith('/') ? path.substring(1) : path;
  return `${API_BASE_URL}/uploads/${cleanPath}`.replace(/\s+/g, '%20');
};

export default function ProductList() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Image Upload States
  const [uploadingImage, setUploadingImage] = useState(false);
  const [localPreview, setLocalPreview] = useState<string | null>(null);

  // Form State (Slug added here)
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    sku: '',
    price: 0,
    mrp: 0,
    stock: 0,
    weight: '',
    categoryId: '',
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

  // =====================================================
  // FETCH CATEGORIES FOR DROPDOWN
  // =====================================================
  const fetchCategories = async () => {
    try {
      const response = await api.get('/categories/admin/all');
      const resData = response.data;
      let items = [];
      if (resData?.data && Array.isArray(resData.data)) {
        items = resData.data;
      } else if (Array.isArray(resData)) {
        items = resData;
      }
      setCategories(items);
    } catch (error) {
      console.error("Failed to fetch categories for product modal", error);
    }
  };

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  // =====================================================
  // AUTO GENERATE SLUG
  // =====================================================
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    setFormData({ ...formData, name, slug });
  };

  // =====================================================
  // IMAGE COMPRESSION & UPLOAD HELPER (< 100KB)
  // =====================================================
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    try {
      const compressedFile = await compressImage(file, 100 * 1024); 
      setLocalPreview(URL.createObjectURL(compressedFile));

      const uploadData = new FormData();
      uploadData.append('file', compressedFile);

      // Using the same upload endpoint as categories to store images in /uploads
      const response = await api.post('/categories/upload', uploadData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const imageUrl = response.data?.url || response.data?.path || response.data;
      setFormData(prev => ({ ...prev, image: imageUrl }));
      toast.success('Image uploaded successfully!');
    } catch (error: any) {
      console.error('Upload error', error);
      toast.error(error?.response?.data?.message || 'Failed to upload image');
      setLocalPreview(null);
    } finally {
      setUploadingImage(false);
    }
  };

  const compressImage = (file: File, maxSizeInBytes: number): Promise<File> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          const MAX_WIDTH = 800;
          const MAX_HEIGHT = 800;
          if (width > height) {
            if (width > MAX_WIDTH) { height *= MAX_WIDTH / width; width = MAX_WIDTH; }
          } else {
            if (height > MAX_HEIGHT) { width *= MAX_HEIGHT / height; height = MAX_HEIGHT; }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);

          let quality = 0.9;
          const evaluateQuality = () => {
            canvas.toBlob((blob) => {
                if (!blob) { reject(new Error('Canvas is empty')); return; }
                if (blob.size <= maxSizeInBytes || quality <= 0.1) {
                  resolve(new File([blob], file.name, { type: 'image/jpeg', lastModified: Date.now() }));
                } else {
                  quality -= 0.1;
                  evaluateQuality();
                }
              }, 'image/jpeg', quality
            );
          };
          evaluateQuality();
        };
        img.onerror = (error) => reject(error);
      };
      reader.onerror = (error) => reject(error);
    });
  };

  // =====================================================
  // SUBMIT (CREATE / UPDATE)
  // =====================================================
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.slug.trim()) {
      toast.error('Product name and slug are required');
      return;
    }
    if (!formData.categoryId) {
      toast.error('Please select a category/sub-category');
      return;
    }

    const payload = {
      name: formData.name,
      slug: formData.slug,
      sku: formData.sku,
      price: Number(formData.price),
      mrp: Number(formData.mrp),
      stock: Number(formData.stock),
      weight: formData.weight,
      categoryId: formData.categoryId,
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
    setLocalPreview(null);
    setFormData({
      name: product.name || '',
      slug: product.slug || product.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, ''),
      sku: product.sku || '',
      price: product.price || 0,
      mrp: product.mrp || 0,
      stock: product.stock || 0,
      weight: product.weight || product.unit || '',
      categoryId: product.categoryId || '',
      image: (product.images && product.images.length > 0) ? product.images[0] : '',
      isActive: product.isActive !== false,
      isFeatured: product.isFeatured || false,
      isEssential: product.isEssential || false,
    });
    setIsModalOpen(true);
  };

  const openNewModal = () => {
    setEditingId(null);
    setLocalPreview(null);
    setFormData({ name: '', slug: '', sku: '', price: 0, mrp: 0, stock: 0, weight: '', categoryId: '', image: '', isActive: true, isFeatured: false, isEssential: false });
    setIsModalOpen(true);
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
                          {/* YAHAN HUMNE NAYA HELPER USE KIYA HAI IMAGE RENDER KE LIYE */}
                          {(() => {
                            const imgPath = product.images && product.images.length > 0 ? product.images[0] : null;
                            const finalUri = getAdminImageUrl(imgPath);
                            if (finalUri) {
                              return (
                                <img 
                                  src={finalUri} 
                                  alt={product.name} 
                                  className="h-full w-full object-contain p-1" 
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${product.name}&background=f3f4f6&color=9ca3af`;
                                  }}
                                />
                              );
                            }
                            return <ImageIcon className="text-gray-300 w-5 h-5" />;
                          })()}
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

                {/* Category Dropdown Selection */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-bold text-gray-700 mb-1">Select Category / Sub-Category</label>
                  <select
                    value={formData.categoryId}
                    onChange={(e) => setFormData({...formData, categoryId: e.target.value})}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 outline-none bg-white"
                  >
                    <option value="">-- Choose Category --</option>
                    {categories.map((cat: any) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.parentId ? `↳ ${cat.name} (Sub-Category)` : cat.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Product Name */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-bold text-gray-700 mb-1">Product Name</label>
                  <input 
                    type="text" required value={formData.name}
                    onChange={handleNameChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 outline-none"
                    placeholder="e.g. Britannia Good Day"
                  />
                </div>

                {/* Slug (Auto Generated) */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-bold text-gray-700 mb-1">Slug (Auto-generated)</label>
                  <input 
                    type="text" required value={formData.slug}
                    onChange={(e) => setFormData({...formData, slug: e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-')})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 outline-none bg-gray-50"
                    placeholder="britannia-good-day"
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

                {/* Product Image Upload */}
                <div className="md:col-span-2 mt-2">
                  <label className="block text-sm font-bold text-gray-700 mb-1">Product Image</label>
                  <div className="flex items-center gap-3">
                    <label className="flex-1 flex flex-col items-center justify-center px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-yellow-500 bg-gray-50 transition-colors">
                      <div className="flex items-center space-x-2">
                        <Upload className="w-5 h-5 text-gray-400" />
                        <span className="text-sm font-medium text-gray-600">
                          {uploadingImage ? 'Compressing & Uploading...' : 'Choose image file (< 100KB)'}
                        </span>
                      </div>
                      <input 
                        type="file" 
                        accept="image/*" 
                        onChange={handleImageUpload} 
                        className="hidden" 
                        disabled={uploadingImage}
                      />
                    </label>
                  </div>
                  
                  {(localPreview || formData.image) && (
                    <div className="mt-2 flex items-center gap-2">
                      <img 
                        src={localPreview || getAdminImageUrl(formData.image)} 
                        alt="Preview" 
                        className="w-10 h-10 object-contain rounded border bg-gray-50" 
                      />
                      <span className="text-xs text-green-600 font-medium">Image ready!</span>
                    </div>
                  )}
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
                disabled={isSubmitting || uploadingImage}
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