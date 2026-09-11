import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Search, X, Upload } from 'lucide-react';
import { api } from '../../services/api';
import toast from 'react-hot-toast';

// YEH APP KE 'NgrokSvg' KA WEB VERSION HAI JO WARNING BYPASS KAREGA
const NgrokWebImage = ({ src, alt, className }: { src: string, alt?: string, className?: string }) => {
  const [imgSrc, setImgSrc] = useState<string | null>(null);

  useEffect(() => {
    if (!src) return;
    if (!src.includes('ngrok-free.dev')) {
      setImgSrc(src);
      return;
    }
    // Fetch use karke secretly header bhejenge
    fetch(src, { headers: { 'ngrok-skip-browser-warning': 'true' } })
      .then(res => res.blob())
      .then(blob => setImgSrc(URL.createObjectURL(blob)))
      .catch(() => setImgSrc(null));
  }, [src]);

  if (!imgSrc) return <div className={`flex items-center justify-center bg-gray-100 text-gray-400 text-xs ${className}`}>No img</div>;
  return <img src={imgSrc} alt={alt} className={className} />;
};

interface Category {
  id: string;
  name: string;
  slug: string;
  icon?: string;
  isActive: boolean;
  parentId?: string | null;
}

export default function CategoryList() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    icon: '',
    isActive: true,
    parentId: '',
  });

  // =====================================================
  // FETCH CATEGORIES
  // =====================================================
  const fetchCategories = async () => {
    try {
      setLoading(true);
      const response = await api.get('/categories/admin/all');
      const resData = response.data;
      
      let items: Category[] = [];
      if (resData?.data && Array.isArray(resData.data)) {
        items = resData.data;
      } else if (Array.isArray(resData)) {
        items = resData;
      }

      setCategories(items);
    } catch (error) {
      console.error("Failed to fetch categories", error);
      toast.error('Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
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

  // Filter only main categories for parent selection
  const parentCategories = Array.isArray(categories) 
    ? categories.filter(c => !c.parentId) 
    : [];

  // =====================================================
  // IMAGE COMPRESSION & UPLOAD HELPER (< 100KB)
  // =====================================================
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    try {
      // 1. Compression logic (< 100KB)
      const compressedFile = await compressImage(file, 100 * 1024); // target 100KB

      // 2. Upload to backend
      const uploadData = new FormData();
      uploadData.append('file', compressedFile);

      // Assuming your backend upload endpoint is /upload or /categories/upload
      const response = await api.post('/categories/upload', uploadData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      // Adjust based on your backend response structure (e.g., response.data.url or path)
      const imageUrl = response.data?.url || response.data?.path || response.data;
      setFormData(prev => ({ ...prev, icon: imageUrl }));
      toast.success('Image uploaded & compressed successfully!');
    } catch (error: any) {
      console.error('Upload error', error);
      toast.error(error?.response?.data?.message || 'Failed to upload image');
    } finally {
      setUploadingImage(false);
    }
  };

  // Canvas-based image compressor
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

          // Resize if too large
          const MAX_WIDTH = 800;
          const MAX_HEIGHT = 800;
          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);

          let quality = 0.9;
          const evaluateQuality = () => {
            canvas.toBlob(
              (blob) => {
                if (!blob) {
                  reject(new Error('Canvas is empty'));
                  return;
                }
                if (blob.size <= maxSizeInBytes || quality <= 0.1) {
                  const compressedFile = new File([blob], file.name, {
                    type: 'image/jpeg',
                    lastModified: Date.now(),
                  });
                  resolve(compressedFile);
                } else {
                  quality -= 0.1;
                  evaluateQuality();
                }
              },
              'image/jpeg',
              quality
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
      toast.error('Name and Slug are required');
      return;
    }

    try {
      setIsSubmitting(true);
      const payload = {
        ...formData,
        parentId: formData.parentId === '' ? null : formData.parentId,
      };

      if (editingId) {
        await api.patch(`/categories/${editingId}`, payload);
        toast.success('Category updated successfully');
      } else {
        await api.post('/categories', payload);
        toast.success('Category created successfully');
      }
      setIsModalOpen(false);
      fetchCategories();
    } catch (error: any) {
      console.error("Submit error", error);
      toast.error(error?.response?.data?.message || 'Failed to save category');
    } finally {
      setIsSubmitting(false);
    }
  };

  // =====================================================
  // DELETE CATEGORY
  // =====================================================
  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this category?')) return;
    
    try {
      await api.delete(`/categories/${id}`);
      toast.success('Category deleted successfully');
      fetchCategories();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to delete category');
    }
  };

  // =====================================================
  // OPEN MODALS
  // =====================================================
  const openEditModal = (category: Category) => {
    setEditingId(category.id);
    setFormData({
      name: category.name,
      slug: category.slug,
      icon: category.icon || '',
      isActive: category.isActive !== false,
      parentId: category.parentId || '',
    });
    setIsModalOpen(true);
  };

  const openNewModal = () => {
    setEditingId(null);
    setFormData({ name: '', slug: '', icon: '', isActive: true, parentId: '' });
    setIsModalOpen(true);
  };

  const filteredCategories = Array.isArray(categories) ? categories.filter((c) => 
    c.name.toLowerCase().includes(search.toLowerCase()) || 
    (c.slug && c.slug.toLowerCase().includes(search.toLowerCase()))
  ) : [];

  return (
    <div className="space-y-6 relative">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Categories Management</h1>
        <button 
          onClick={openNewModal}
          className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-lg font-medium flex items-center transition-colors shadow-sm"
        >
          <Plus className="w-5 h-5 mr-2" />
          Add Category
        </button>
      </div>

      {/* Search */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <div className="relative">
          <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input 
            type="text" 
            placeholder="Search categories by name..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-yellow-500 focus:border-yellow-500 outline-none"
          />
        </div>
      </div>

      {/* Categories Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full whitespace-nowrap">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Image & Name</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={3} className="px-6 py-8 text-center text-gray-500">Loading categories...</td>
                </tr>
              ) : filteredCategories.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-6 py-8 text-center text-gray-500">No categories found.</td>
                </tr>
              ) : (
                filteredCategories.map((category) => (
                  <tr key={category.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="h-12 w-12 flex-shrink-0 bg-gray-50 rounded-lg overflow-hidden flex items-center justify-center border border-gray-200">
                          {category.icon ? (
                            <NgrokWebImage 
                              src={category.icon.startsWith('http') ? category.icon.replace(/\s+/g, '%20') : `https://drop-down-underwire-impulse.ngrok-free.dev/api/v1/uploads/${category.icon.replace(/\s+/g, '%20')}`} 
                              alt={category.name} 
                              className="h-full w-full object-contain p-1" 
                            />
                          ) : (
                            <span className="text-gray-400 text-xs">No img</span>
                          )}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-bold text-gray-900">
                            {category.parentId ? `↳ ` : ''}{category.name}
                          </div>
                          <div className="text-xs text-gray-500 mt-1">/{category.slug}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        category.isActive !== false ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {category.isActive !== false ? 'Active' : 'Hidden'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right text-sm font-medium space-x-3">
                      <button 
                        onClick={() => openEditModal(category)}
                        className="text-indigo-600 hover:text-indigo-900 bg-indigo-50 p-2 rounded-md transition-colors"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDelete(category.id)}
                        className="text-red-600 hover:text-red-900 bg-red-50 p-2 rounded-md transition-colors"
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

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="flex justify-between items-center p-6 border-b border-gray-100">
              <h2 className="text-xl font-bold text-gray-900">
                {editingId ? 'Edit Category' : 'Add New Category'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 p-1">
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Category Name</label>
                <input 
                  type="text" 
                  required
                  value={formData.name}
                  onChange={handleNameChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 outline-none"
                  placeholder="e.g. Fresh Veggies"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Slug (Auto-generated)</label>
                <input 
                  type="text" 
                  required
                  value={formData.slug}
                  onChange={(e) => setFormData({...formData, slug: e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-')})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 outline-none bg-gray-50"
                  placeholder="fresh-veggies"
                />
              </div>

              {/* Parent Category Dropdown */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Parent Category (Optional)</label>
                <select
                  value={formData.parentId}
                  onChange={(e) => setFormData({ ...formData, parentId: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 outline-none bg-white"
                >
                  <option value="">None (Make this a Main Category)</option>
                  {parentCategories.map(cat => (
                    cat.id !== editingId && (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    )
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">Select a main category if you want to make this a Sub-Category.</p>
              </div>

              {/* Direct File Upload instead of raw text URL */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Category Icon / Image</label>
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
                {formData.icon && (
                  <div className="mt-2 flex items-center gap-2">
                    <NgrokWebImage 
                      src={formData.icon.startsWith('http') ? formData.icon.replace(/\s+/g, '%20') : `https://drop-down-underwire-impulse.ngrok-free.dev/api/v1/uploads/${formData.icon.replace(/\s+/g, '%20')}`} 
                      alt="Preview" 
                      className="w-10 h-10 object-contain rounded border bg-white" 
                    />
                    <span className="text-xs text-green-600 font-medium">Image uploaded successfully!</span>
                  </div>
                )}
                <p className="text-xs text-gray-500 mt-1">Select an image from your computer; it will automatically compress under 100KB.</p>
              </div>

              <div className="flex items-center mt-2">
                <input 
                  type="checkbox" 
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({...formData, isActive: e.target.checked})}
                  className="w-4 h-4 text-yellow-500 rounded focus:ring-yellow-500 cursor-pointer"
                />
                <label htmlFor="isActive" className="ml-2 text-sm font-bold text-gray-700 cursor-pointer">
                  Visible in App
                </label>
              </div>

              <div className="pt-4 flex gap-3">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-bold transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={isSubmitting || uploadingImage}
                  className="flex-1 px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg font-bold transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving...' : 'Save Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}