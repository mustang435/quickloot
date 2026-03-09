'use client';

import { useState, useEffect, useRef } from 'react';
import { Plus, Trash2, Edit2, RefreshCw, CheckCircle, XCircle, Clock, ExternalLink, ArrowLeft, Zap, Save, X, AlertCircle, LogOut, Shield, Home, Upload, Image as ImageIcon, ChevronRight, FolderTree } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

// ============================================================
// Auth utilities (client-side)
// ============================================================
function getAdminToken() {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('ql_admin_token');
}

function isTokenValid(token) {
  if (!token) return false;
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return false;
    const payload = JSON.parse(atob(parts[1]));
    return payload.exp && payload.exp * 1000 > Date.now() && payload.role === 'admin';
  } catch (e) { return false; }
}

function authFetch(url, options = {}) {
  const token = getAdminToken();
  return fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });
}

// ============================================================
// HELPERS
// ============================================================
function Badge({ status }) {
  const styles = {
    success: 'bg-green-100 text-green-700',
    failed: 'bg-red-100 text-red-700',
    pending: 'bg-yellow-100 text-yellow-700',
  };
  const icons = {
    success: <CheckCircle className="w-3 h-3" />,
    failed: <XCircle className="w-3 h-3" />,
    pending: <Clock className="w-3 h-3" />,
  };
  return (
    <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${styles[status] || styles.pending}`}>
      {icons[status] || icons.pending}
      {status || 'pending'}
    </span>
  );
}

function Modal({ title, onClose, children, size = 'md' }) {
  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className={`bg-white rounded-2xl shadow-2xl w-full ${sizeClasses[size]} max-h-[90vh] overflow-y-auto`}>
        <div className="flex items-center justify-between p-5 border-b sticky top-0 bg-white z-10">
          <h3 className="font-bold text-gray-800 text-lg">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

function FormField({ label, required, children }) {
  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-1.5">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
    </div>
  );
}

const inputCls = "w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent bg-gray-50";

// ============================================================
// IMAGE UPLOAD COMPONENT
// ============================================================
function ImageUpload({ value, onChange, label = "Upload Logo (512x512 PNG/SVG)" }) {
  const [preview, setPreview] = useState(value || null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  useEffect(() => {
    setPreview(value || null);
  }, [value]);

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['image/png', 'image/svg+xml', 'image/jpeg', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setError('Please upload a PNG, SVG, JPEG, or WebP image');
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      setError('Image size must be less than 2MB');
      return;
    }

    setError('');
    setUploading(true);

    try {
      // Convert to base64
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = event.target?.result;
        setPreview(base64);
        onChange(base64);
        setUploading(false);
      };
      reader.onerror = () => {
        setError('Failed to read file');
        setUploading(false);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      setError('Upload failed');
      setUploading(false);
    }
  };

  const handleRemove = () => {
    setPreview(null);
    onChange('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
      <div className="border-2 border-dashed border-gray-200 rounded-xl p-4 text-center hover:border-orange-300 transition-colors">
        {preview ? (
          <div className="relative inline-block">
            <div className="w-24 h-24 rounded-xl overflow-hidden bg-gray-100 border border-gray-200">
              <img src={preview} alt="Preview" className="w-full h-full object-contain" />
            </div>
            <button
              type="button"
              onClick={handleRemove}
              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-md hover:bg-red-600 transition-colors"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        ) : (
          <div>
            <input
              type="file"
              ref={fileInputRef}
              accept="image/png,image/svg+xml,image/jpeg,image/webp"
              onChange={handleFileSelect}
              className="hidden"
              id="logo-upload"
            />
            <label
              htmlFor="logo-upload"
              className="cursor-pointer inline-flex flex-col items-center gap-2"
            >
              <div className="w-16 h-16 rounded-xl bg-gray-100 flex items-center justify-center">
                {uploading ? (
                  <RefreshCw className="w-6 h-6 text-gray-400 animate-spin" />
                ) : (
                  <Upload className="w-6 h-6 text-gray-400" />
                )}
              </div>
              <span className="text-xs text-gray-500">Click to upload (PNG, SVG, max 2MB)</span>
              <span className="text-xs text-gray-400">Recommended: 512x512px</span>
            </label>
          </div>
        )}
      </div>
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
}

// ============================================================
// TABS
// ============================================================
const TABS = [
  { id: 'products', label: 'Products', icon: '📦' },
  { id: 'categories', label: 'Categories', icon: '📁' },
  { id: 'price-links', label: 'Price Links', icon: '🔗' },
  { id: 'stores', label: 'Stores', icon: '🏪' },
  { id: 'scraping', label: 'Scraping', icon: '🤖' },
];

// ============================================================
// CATEGORIES TAB (with nested support)
// ============================================================
function CategoriesTab() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null); // null | 'add' | 'edit'
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [form, setForm] = useState({ name_en: '', name_fr: '', slug: '', icon: '📁', parentId: null });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => { loadCategories(); }, []);

  async function loadCategories() {
    setLoading(true);
    const res = await authFetch('/api/categories');
    if (res.ok) setCategories(await res.json());
    setLoading(false);
  }

  function openAdd(parentId = null) {
    setForm({ name_en: '', name_fr: '', slug: '', icon: '📁', parentId });
    setSelectedCategory(null);
    setModal('add');
  }

  function openEdit(cat) {
    setForm({
      name_en: cat.name_en || cat.name || '',
      name_fr: cat.name_fr || '',
      slug: cat.slug || '',
      icon: cat.icon || '📁',
      parentId: cat.parentId || null,
    });
    setSelectedCategory(cat);
    setModal('edit');
  }

  async function saveCategory() {
    if (!form.name_en.trim()) return;
    setSaving(true);
    setMsg('');
    try {
      const slug = form.slug || form.name_en.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      const payload = { ...form, slug };
      
      let res;
      if (modal === 'edit' && selectedCategory) {
        res = await authFetch(`/api/categories/${selectedCategory.id}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
      } else {
        res = await authFetch('/api/categories', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
      }
      
      if (res.ok) {
        setMsg('Saved!');
        setModal(null);
        loadCategories();
      } else {
        const err = await res.json();
        setMsg(`Error: ${err.error}`);
      }
    } catch (e) {
      setMsg(`Error: ${e.message}`);
    } finally {
      setSaving(false);
    }
  }

  async function deleteCategory(id) {
    if (!confirm('Delete this category and all subcategories?')) return;
    await authFetch(`/api/categories/${id}`, { method: 'DELETE' });
    loadCategories();
  }

  // Build category tree
  function buildTree(cats, parentId = null, depth = 0) {
    return cats
      .filter(c => (c.parentId || null) === parentId)
      .map(cat => ({
        ...cat,
        depth,
        children: buildTree(cats, cat.id, depth + 1),
      }));
  }

  function renderCategory(cat, index) {
    const paddingLeft = cat.depth * 24;
    return (
      <div key={cat.id}>
        <div 
          className="flex items-center gap-3 py-3 px-4 bg-white border border-gray-100 rounded-xl hover:border-orange-200 transition-colors mb-2"
          style={{ marginLeft: paddingLeft }}
        >
          <span className="text-2xl">{cat.icon}</span>
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-gray-800 text-sm flex items-center gap-2">
              {cat.depth > 0 && <ChevronRight className="w-3 h-3 text-gray-400" />}
              {cat.name_en || cat.name}
            </div>
            <div className="text-xs text-gray-400">
              {cat.name_fr && <span className="mr-2">🇫🇷 {cat.name_fr}</span>}
              <span className="text-gray-300">/{cat.slug}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => openAdd(cat.id)}
              className="text-xs bg-blue-50 hover:bg-blue-100 text-blue-600 px-2 py-1 rounded-lg transition-colors"
            >
              + Sub
            </button>
            <button onClick={() => openEdit(cat)} className="text-gray-400 hover:text-orange-500 transition-colors">
              <Edit2 className="w-4 h-4" />
            </button>
            <button onClick={() => deleteCategory(cat.id)} className="text-gray-300 hover:text-red-400 transition-colors">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
        {cat.children?.map((child, i) => renderCategory(child, i))}
      </div>
    );
  }

  const tree = buildTree(categories);
  const rootCategories = categories.filter(c => !c.parentId);

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
          <FolderTree className="w-5 h-5 text-orange-500" />
          Categories ({categories.length})
        </h2>
        <button onClick={() => openAdd(null)} className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm">
          <Plus className="w-4 h-4" /> Add Category
        </button>
      </div>

      {loading ? <div className="text-center py-10 text-gray-400">Loading...</div> : (
        <div>
          {tree.length === 0 ? (
            <div className="text-center py-10 text-gray-400">
              No categories yet. Add one to get started!
            </div>
          ) : (
            tree.map((cat, i) => renderCategory(cat, i))
          )}
        </div>
      )}

      {modal && (
        <Modal title={modal === 'edit' ? 'Edit Category' : 'Add Category'} onClose={() => setModal(null)}>
          <FormField label="Name (English)" required>
            <input className={inputCls} value={form.name_en} onChange={e => setForm({...form, name_en: e.target.value})} placeholder="e.g. Electronics" />
          </FormField>
          <FormField label="Name (French - Quebec)">
            <input className={inputCls} value={form.name_fr} onChange={e => setForm({...form, name_fr: e.target.value})} placeholder="e.g. Électronique" />
          </FormField>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Slug">
              <input className={inputCls} value={form.slug} onChange={e => setForm({...form, slug: e.target.value})} placeholder="auto-generated" />
            </FormField>
            <FormField label="Icon (Emoji)">
              <input className={inputCls} value={form.icon} onChange={e => setForm({...form, icon: e.target.value})} />
            </FormField>
          </div>
          <FormField label="Parent Category">
            <select 
              className={inputCls} 
              value={form.parentId || ''} 
              onChange={e => setForm({...form, parentId: e.target.value || null})}
            >
              <option value="">— Root Category (No Parent) —</option>
              {categories
                .filter(c => c.id !== selectedCategory?.id) // Can't be parent of itself
                .map(cat => (
                  <option key={cat.id} value={cat.id}>
                    {'  '.repeat(buildTree(categories).find(t => t.id === cat.id)?.depth || 0)}
                    {cat.icon} {cat.name_en || cat.name}
                  </option>
                ))
              }
            </select>
          </FormField>
          {msg && <div className={`text-sm mb-3 ${msg.includes('Error') ? 'text-red-600' : 'text-green-600'}`}>{msg}</div>}
          <div className="flex gap-2">
            <button onClick={saveCategory} disabled={saving} className="flex-1 bg-orange-500 hover:bg-orange-600 text-white py-2.5 rounded-lg font-semibold text-sm">
              {saving ? 'Saving...' : 'Save Category'}
            </button>
            <button onClick={() => setModal(null)} className="px-4 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-600">Cancel</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ============================================================
// PRODUCTS TAB
// ============================================================
function ProductsTab() {
  const [products, setProducts] = useState([]);
  const [stores, setStores] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [form, setForm] = useState({ 
    name: '', brand: '', description: '', category: '', image: '', featured: false, tags: '',
    pros: '', cons: '', specs: ''
  });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => { 
    loadProducts(); 
    loadStores(); 
    loadCategories();
  }, []);

  async function loadProducts() {
    setLoading(true);
    const res = await authFetch('/api/products?limit=100&sort=recent');
    if (res.ok) {
      const data = await res.json();
      setProducts(data.products || []);
    }
    setLoading(false);
  }

  async function loadStores() {
    const res = await authFetch('/api/stores');
    if (res.ok) setStores(await res.json());
  }

  async function loadCategories() {
    const res = await authFetch('/api/categories');
    if (res.ok) setCategories(await res.json());
  }

  function openAdd() {
    setForm({ 
      name: '', brand: '', description: '', category: '', image: '', featured: false, tags: '',
      pros: '', cons: '', specs: ''
    });
    setSelectedProduct(null);
    setModal('add');
  }

  function openEdit(product) {
    setForm({
      name: product.name || '',
      brand: product.brand || '',
      description: product.description || '',
      category: product.category || '',
      image: product.image || '',
      featured: product.featured || false,
      tags: (product.tags || []).join(', '),
      pros: (product.pros || []).join('\n'),
      cons: (product.cons || []).join('\n'),
      specs: product.specs ? Object.entries(product.specs).map(([k,v]) => `${k}: ${v}`).join('\n') : '',
    });
    setSelectedProduct(product);
    setModal('edit');
  }

  async function saveProduct() {
    if (!form.name.trim()) return;
    setSaving(true);
    setMsg('');
    try {
      // Parse pros (line separated)
      const pros = form.pros ? form.pros.split('\n').map(l => l.trim()).filter(Boolean) : [];
      // Parse cons (line separated)
      const cons = form.cons ? form.cons.split('\n').map(l => l.trim()).filter(Boolean) : [];
      // Parse specs (key: value format, line separated)
      const specs = {};
      if (form.specs) {
        form.specs.split('\n').forEach(line => {
          const idx = line.indexOf(':');
          if (idx > 0) {
            const key = line.substring(0, idx).trim();
            const value = line.substring(idx + 1).trim();
            if (key && value) specs[key] = value;
          }
        });
      }

      const payload = {
        ...form,
        tags: form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
        pros,
        cons,
        specs: Object.keys(specs).length > 0 ? specs : null,
      };

      // Remove string versions
      delete payload.pros;
      delete payload.cons;
      delete payload.specs;
      payload.pros = pros;
      payload.cons = cons;
      payload.specs = Object.keys(specs).length > 0 ? specs : null;

      let res;
      if (modal === 'edit' && selectedProduct) {
        res = await authFetch(`/api/products/${selectedProduct.id}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
      } else {
        res = await authFetch('/api/products', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
      }
      if (res.ok) {
        setMsg('Saved successfully!');
        setModal(null);
        loadProducts();
      } else {
        const err = await res.json();
        setMsg(`Error: ${err.error}`);
      }
    } catch (e) {
      setMsg(`Error: ${e.message}`);
    } finally {
      setSaving(false);
    }
  }

  async function deleteProduct(id) {
    if (!confirm('Delete this product and all its price links?')) return;
    await authFetch(`/api/products/${id}`, { method: 'DELETE' });
    loadProducts();
  }

  // Build category tree for dropdown
  function buildCategoryOptions(cats, parentId = null, depth = 0) {
    const result = [];
    cats.filter(c => (c.parentId || null) === parentId).forEach(cat => {
      result.push({ ...cat, depth });
      result.push(...buildCategoryOptions(cats, cat.id, depth + 1));
    });
    return result;
  }
  const categoryOptions = buildCategoryOptions(categories);

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-lg font-bold text-gray-800">Products ({products.length})</h2>
        <button onClick={openAdd} className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm">
          <Plus className="w-4 h-4" /> Add Product
        </button>
      </div>

      {loading ? <div className="text-center py-10 text-gray-400">Loading...</div> : (
        <div className="grid gap-3">
          {products.map(product => {
            const cat = categories.find(c => c.id === product.category || c.slug === product.category);
            return (
              <div key={product.id} className="bg-white rounded-xl border border-gray-100 p-4 flex items-center gap-4">
                <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0">
                  {product.image ? (
                    <img src={product.image} alt="" className="w-full h-full object-contain" />
                  ) : (
                    <span className="text-2xl opacity-30">{cat?.icon || '📦'}</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-gray-800">{product.name}</div>
                  <div className="text-xs text-gray-400">
                    {product.brand && <span className="mr-2">{product.brand}</span>}
                    {cat && <span className="bg-gray-100 px-1.5 py-0.5 rounded">{cat.icon} {cat.name_en || cat.name}</span>}
                  </div>
                  {product.bestPrice && (
                    <div className="text-green-600 font-bold text-sm mt-1">${product.bestPrice.toFixed(2)} CAD</div>
                  )}
                </div>
                <div className="flex gap-2">
                  <button onClick={() => { setSelectedProduct(product); setModal('links'); }} className="text-xs bg-blue-50 hover:bg-blue-100 text-blue-600 px-3 py-1.5 rounded-lg transition-colors">🔗 Links</button>
                  <button onClick={() => openEdit(product)} className="text-gray-400 hover:text-orange-500 transition-colors"><Edit2 className="w-4 h-4" /></button>
                  <button onClick={() => deleteProduct(product.id)} className="text-gray-300 hover:text-red-400 transition-colors"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
            );
          })}
          {products.length === 0 && <div className="text-center py-10 text-gray-400">No products yet. Add one!</div>}
        </div>
      )}

      {(modal === 'add' || modal === 'edit') && (
        <Modal title={modal === 'edit' ? 'Edit Product' : 'Add Product'} onClose={() => setModal(null)} size="lg">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField label="Product Name" required>
              <input className={inputCls} value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="e.g. PlayStation 5 Digital Edition" />
            </FormField>
            <FormField label="Brand">
              <input className={inputCls} value={form.brand} onChange={e => setForm({...form, brand: e.target.value})} placeholder="e.g. Sony" />
            </FormField>
          </div>
          <FormField label="Category">
            <select className={inputCls} value={form.category} onChange={e => setForm({...form, category: e.target.value})}>
              <option value="">Select a category...</option>
              {categoryOptions.map(cat => (
                <option key={cat.id} value={cat.slug}>
                  {'  '.repeat(cat.depth)}{cat.icon} {cat.name_en || cat.name}
                </option>
              ))}
            </select>
          </FormField>
          <FormField label="Image URL">
            <input className={inputCls} value={form.image} onChange={e => setForm({...form, image: e.target.value})} placeholder="https://..." />
          </FormField>
          <FormField label="Description">
            <textarea className={inputCls} rows={2} value={form.description} onChange={e => setForm({...form, description: e.target.value})} placeholder="Product description..." />
          </FormField>
          
          {/* Pros & Cons */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField label="✅ Pros (one per line)">
              <textarea 
                className={inputCls} 
                rows={4} 
                value={form.pros} 
                onChange={e => setForm({...form, pros: e.target.value})} 
                placeholder="Lightning-fast SSD&#10;Haptic feedback&#10;3D Audio support&#10;Backward compatible"
              />
            </FormField>
            <FormField label="❌ Cons (one per line)">
              <textarea 
                className={inputCls} 
                rows={4} 
                value={form.cons} 
                onChange={e => setForm({...form, cons: e.target.value})} 
                placeholder="No disc drive&#10;Limited storage&#10;Requires stable internet"
              />
            </FormField>
          </div>

          {/* Technical Specifications */}
          <FormField label="📋 Technical Specs (key: value per line)">
            <textarea 
              className={inputCls} 
              rows={5} 
              value={form.specs} 
              onChange={e => setForm({...form, specs: e.target.value})} 
              placeholder="Storage: 825GB SSD&#10;Resolution: 4K UHD&#10;Frame Rate: Up to 120fps&#10;Audio: Tempest 3D&#10;Connectivity: Wi-Fi 6, Bluetooth 5.1"
            />
          </FormField>

          <FormField label="Tags (comma separated)">
            <input className={inputCls} value={form.tags} onChange={e => setForm({...form, tags: e.target.value})} placeholder="ps5, gaming, sony" />
          </FormField>
          <div className="flex items-center gap-2 mb-4">
            <input type="checkbox" id="featured" checked={form.featured} onChange={e => setForm({...form, featured: e.target.checked})} className="w-4 h-4 text-orange-500" />
            <label htmlFor="featured" className="text-sm text-gray-700">Featured product</label>
          </div>
          {msg && <div className={`text-sm mb-3 ${msg.includes('Error') ? 'text-red-600' : 'text-green-600'}`}>{msg}</div>}
          <div className="flex gap-2">
            <button onClick={saveProduct} disabled={saving} className="flex-1 bg-orange-500 hover:bg-orange-600 text-white py-2.5 rounded-lg font-semibold text-sm">{saving ? 'Saving...' : 'Save Product'}</button>
            <button onClick={() => setModal(null)} className="px-4 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-600">Cancel</button>
          </div>
        </Modal>
      )}

      {modal === 'links' && selectedProduct && (
        <PriceLinksModal product={selectedProduct} stores={stores} onClose={() => { setModal(null); loadProducts(); }} />
      )}
    </div>
  );
}

// ============================================================
// PRICE LINKS MODAL
// ============================================================
function PriceLinksModal({ product, stores, onClose }) {
  const [links, setLinks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ storeId: '', url: '', price: '', currency: 'CAD' });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const [scraping, setScraping] = useState({});

  useEffect(() => { loadLinks(); }, [product.id]);

  async function loadLinks() {
    setLoading(true);
    const res = await authFetch(`/api/price-links?productId=${product.id}`);
    if (res.ok) setLinks(await res.json());
    setLoading(false);
  }

  async function addLink() {
    if (!form.storeId || !form.url.trim()) {
      setMsg('⚠️ Select a store and enter URL');
      return;
    }
    setSaving(true);
    setMsg('');
    const store = stores.find(s => s.id === form.storeId);
    const payload = {
      productId: product.id,
      storeId: form.storeId,
      storeName: store?.name,
      url: form.url.trim(),
      currentPrice: form.price ? parseFloat(form.price) : null,
      currency: form.currency,
    };
    const res = await authFetch('/api/price-links', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      setForm({ storeId: '', url: '', price: '', currency: 'CAD' });
      loadLinks();
      setMsg('✅ Link added!');
    } else {
      setMsg('⚠️ Failed to add');
    }
    setSaving(false);
  }

  async function scrapeLink(id) {
    setScraping(prev => ({ ...prev, [id]: true }));
    const res = await authFetch('/api/scrape', {
      method: 'POST',
      body: JSON.stringify({ linkId: id }),
    });
    const data = await res.json();
    setMsg(data.success ? `✅ Price: $${data.price} CAD` : `⚠️ ${data.error}`);
    setScraping(prev => ({ ...prev, [id]: false }));
    loadLinks();
  }

  async function deleteLink(id) {
    if (!confirm('Delete?')) return;
    await authFetch(`/api/price-links/${id}`, { method: 'DELETE' });
    loadLinks();
  }

  return (
    <Modal title={`Price Links - ${product.name}`} onClose={onClose} size="lg">
      {msg && <div className={`mb-3 px-3 py-2 rounded-lg text-sm ${msg.includes('⚠️') || msg.includes('Error') ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>{msg}</div>}
      
      {/* Add link form */}
      <div className="bg-gray-50 rounded-xl p-4 mb-4">
        <h4 className="font-semibold text-gray-700 text-sm mb-3">Add New Link</h4>
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Store</label>
            <select className={inputCls} value={form.storeId} onChange={e => setForm({...form, storeId: e.target.value})}>
              <option value="">Select store...</option>
              {stores.map(s => (
                <option key={s.id} value={s.id}>{s.logo ? '' : ''} {s.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Product URL</label>
            <input className={inputCls} value={form.url} onChange={e => setForm({...form, url: e.target.value})} placeholder="https://amazon.ca/..." />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Manual Price (optional)</label>
            <input type="number" step="0.01" className={inputCls} value={form.price} onChange={e => setForm({...form, price: e.target.value})} placeholder="549.99" />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Currency</label>
            <select className={inputCls} value={form.currency} onChange={e => setForm({...form, currency: e.target.value})}>
              <option value="CAD">CAD $</option>
              <option value="USD">USD $</option>
            </select>
          </div>
        </div>
        <button onClick={addLink} disabled={saving} className="mt-3 w-full bg-orange-500 hover:bg-orange-600 text-white py-2 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50">
          {saving ? 'Adding...' : '+ Add Link'}
        </button>
      </div>

      {/* Existing links */}
      {loading ? (
        <div className="text-center py-6 text-gray-400 text-sm">Loading links...</div>
      ) : links.length === 0 ? (
        <div className="text-center py-6 text-gray-400 text-sm">No price links yet. Add one above!</div>
      ) : (
        <div className="space-y-2">
          {links.map(link => {
            const store = stores.find(s => s.id === link.storeId);
            return (
              <div key={link.id} className="bg-white border border-gray-100 rounded-xl p-3">
                <div className="flex items-start gap-3">
                  {store?.logo && store.logo.startsWith('data:') ? (
                    <div className="w-8 h-8 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                      <img src={store.logo} alt="" className="w-full h-full object-contain" />
                    </div>
                  ) : null}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-semibold text-gray-700">{store?.name || link.storeName || 'Unknown Store'}</span>
                      <Badge status={link.scrapeStatus} />
                    </div>
                    <a href={link.url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-500 hover:underline truncate block max-w-xs">{link.url}</a>
                    {link.lastScrapedAt && (
                      <div className="text-xs text-gray-400 mt-1">Last scraped: {new Date(link.lastScrapedAt).toLocaleString()}</div>
                    )}
                    {link.scrapeError && (
                      <div className="text-xs text-red-400 mt-0.5 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {link.scrapeError}</div>
                    )}
                  </div>
                  <div className="text-right flex-shrink-0">
                    {link.currentPrice ? (
                      <div className="text-green-600 font-bold text-sm">${link.currentPrice.toFixed(2)} {link.currency || 'CAD'}</div>
                    ) : (
                      <div className="text-gray-400 text-xs">No price</div>
                    )}
                  </div>
                </div>
                <div className="flex gap-2 mt-2">
                  <button
                    onClick={() => scrapeLink(link.id)}
                    disabled={scraping[link.id]}
                    className="flex items-center gap-1 text-xs bg-blue-50 hover:bg-blue-100 text-blue-600 px-2.5 py-1.5 rounded-lg font-medium transition-colors disabled:opacity-50"
                  >
                    {scraping[link.id] ? <RefreshCw className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
                    Scrape Now
                  </button>
                  <a href={link.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs bg-gray-50 hover:bg-gray-100 text-gray-600 px-2.5 py-1.5 rounded-lg font-medium transition-colors">
                    <ExternalLink className="w-3 h-3" /> Open
                  </a>
                  <button onClick={() => deleteLink(link.id)} className="ml-auto flex items-center gap-1 text-xs text-red-400 hover:bg-red-50 px-2.5 py-1.5 rounded-lg transition-colors">
                    <Trash2 className="w-3 h-3" /> Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Modal>
  );
}

// ============================================================
// STORES TAB (with image upload)
// ============================================================
function StoresTab() {
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null); // null | 'add' | 'edit'
  const [selectedStore, setSelectedStore] = useState(null);
  const [form, setForm] = useState({ name: '', domain: '', logo: '', color: '#666666', country: 'Canada', scrapingConfig: { price: '', title: '' } });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const [seeding, setSeeding] = useState(false);

  useEffect(() => { loadStores(); }, []);

  async function loadStores() {
    setLoading(true);
    const res = await authFetch('/api/stores');
    if (res.ok) setStores(await res.json());
    setLoading(false);
  }

  async function seedStores() {
    setSeeding(true);
    await authFetch('/api/seed', { method: 'POST' });
    loadStores();
    setSeeding(false);
  }

  function openAdd() {
    setForm({ name: '', domain: '', logo: '', color: '#666666', country: 'Canada', scrapingConfig: { price: '', title: '' } });
    setSelectedStore(null);
    setModal('add');
  }

  function openEdit(store) {
    setForm({
      name: store.name || '',
      domain: store.domain || '',
      logo: store.logo || '',
      color: store.color || '#666666',
      country: store.country || 'Canada',
      scrapingConfig: store.scrapingConfig || { price: '', title: '' },
    });
    setSelectedStore(store);
    setModal('edit');
  }

  async function saveStore() {
    if (!form.name.trim() || !form.domain.trim()) return;
    setSaving(true);
    setMsg('');
    try {
      const payload = {
        ...form,
        scrapingConfig: form.scrapingConfig?.price ? form.scrapingConfig : null,
      };
      let res;
      if (modal === 'edit' && selectedStore) {
        res = await authFetch(`/api/stores/${selectedStore.id}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
      } else {
        res = await authFetch('/api/stores', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
      }
      if (res.ok) {
        setMsg('Store saved!');
        setModal(null);
        loadStores();
      }
    } catch (e) {
      setMsg(`Error: ${e.message}`);
    } finally {
      setSaving(false);
    }
  }

  async function deleteStore(id) {
    if (!confirm('Delete this store?')) return;
    await authFetch(`/api/stores/${id}`, { method: 'DELETE' });
    loadStores();
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-lg font-bold text-gray-800">Stores ({stores.length})</h2>
        <div className="flex gap-2">
          <button onClick={seedStores} disabled={seeding} className="flex items-center gap-2 bg-blue-50 hover:bg-blue-100 text-blue-600 px-4 py-2 rounded-lg text-sm font-medium transition-colors">
            {seeding ? <RefreshCw className="w-4 h-4 animate-spin" /> : '🔄'} Load Default Stores
          </button>
          <button onClick={openAdd} className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm">
            <Plus className="w-4 h-4" /> Add Store
          </button>
        </div>
      </div>

      {loading ? <div className="text-center py-10 text-gray-400">Loading...</div> : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {stores.map(store => (
            <div key={store.id} className="bg-white rounded-xl border border-gray-100 p-4 flex items-center gap-3 hover:border-orange-200 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                {store.logo && store.logo.startsWith('data:') ? (
                  <img src={store.logo} alt={store.name} className="w-full h-full object-contain" />
                ) : store.logo && store.logo.length <= 4 ? (
                  <span className="text-2xl">{store.logo}</span>
                ) : (
                  <span className="text-2xl">🏪</span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-gray-800 text-sm">{store.name}</div>
                <div className="text-xs text-gray-400">{store.domain}</div>
                <div className="text-xs text-gray-400">{store.country}</div>
              </div>
              <div className="flex gap-1">
                <button onClick={() => openEdit(store)} className="text-gray-400 hover:text-orange-500 transition-colors p-1">
                  <Edit2 className="w-4 h-4" />
                </button>
                <button onClick={() => deleteStore(store.id)} className="text-gray-300 hover:text-red-400 transition-colors p-1">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {modal && (
        <Modal title={modal === 'edit' ? 'Edit Store' : 'Add Store'} onClose={() => setModal(null)}>
          <FormField label="Store Name" required>
            <input className={inputCls} value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="e.g. Amazon Canada" />
          </FormField>
          <FormField label="Domain" required>
            <input className={inputCls} value={form.domain} onChange={e => setForm({...form, domain: e.target.value})} placeholder="e.g. amazon.ca" />
          </FormField>
          
          {/* Image Upload */}
          <div className="mb-4">
            <ImageUpload 
              value={form.logo} 
              onChange={(val) => setForm({...form, logo: val})} 
              label="Store Logo (512x512 PNG/SVG recommended)"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <FormField label="Brand Color">
              <input type="color" className="w-full h-10 rounded-lg cursor-pointer" value={form.color} onChange={e => setForm({...form, color: e.target.value})} />
            </FormField>
            <FormField label="Country">
              <input className={inputCls} value={form.country} onChange={e => setForm({...form, country: e.target.value})} placeholder="Canada" />
            </FormField>
          </div>
          <FormField label="Custom Price CSS Selector (optional)">
            <input className={inputCls} value={form.scrapingConfig?.price || ''} onChange={e => setForm({...form, scrapingConfig: {...form.scrapingConfig, price: e.target.value}})} placeholder=".product-price, #price" />
          </FormField>
          {msg && <div className="text-sm mb-3 text-green-600">{msg}</div>}
          <div className="flex gap-2">
            <button onClick={saveStore} disabled={saving} className="flex-1 bg-orange-500 hover:bg-orange-600 text-white py-2.5 rounded-lg font-semibold text-sm">
              {saving ? 'Saving...' : 'Save Store'}
            </button>
            <button onClick={() => setModal(null)} className="px-4 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-600">Cancel</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ============================================================
// SCRAPING TAB
// ============================================================
function ScrapingTab() {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [scraping, setScraping] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => { loadStatus(); }, []);

  async function loadStatus() {
    setLoading(true);
    const res = await authFetch('/api/scrape/status');
    if (res.ok) setStatus(await res.json());
    setLoading(false);
  }

  async function triggerScrape() {
    if (!confirm('Start scraping all price links? This may take a while.')) return;
    setScraping(true);
    setMsg('');
    const res = await authFetch('/api/scrape', {
      method: 'POST',
      body: JSON.stringify({ all: true }),
    });
    const data = await res.json();
    if (res.ok) {
      setMsg(`✅ Completed! ${data.summary?.success || 0}/${data.summary?.total || 0} links updated.`);
    } else {
      setMsg(`⚠️ Error: ${data.error}`);
    }
    setScraping(false);
    loadStatus();
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-lg font-bold text-gray-800">Scraping Status</h2>
        <button onClick={triggerScrape} disabled={scraping} className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm disabled:opacity-50">
          {scraping ? <RefreshCw className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          Scrape All Now
        </button>
      </div>

      {msg && (
        <div className={`mb-4 px-4 py-3 rounded-xl text-sm ${msg.includes('⚠️') ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
          {msg}
        </div>
      )}

      {loading ? <div className="text-center py-10 text-gray-400">Loading...</div> : status && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <div className="text-3xl font-black text-gray-800">{status.totalLinks || 0}</div>
            <div className="text-sm text-gray-500">Total Price Links</div>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <div className="text-3xl font-black text-green-600">{status.successLinks || 0}</div>
            <div className="text-sm text-gray-500">Successfully Scraped</div>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <div className="text-3xl font-black text-red-500">{status.failedLinks || 0}</div>
            <div className="text-sm text-gray-500">Failed / Pending</div>
          </div>
        </div>
      )}

      <div className="mt-6 bg-blue-50 rounded-xl p-4">
        <h3 className="font-semibold text-blue-800 mb-2">About Automatic Scraping</h3>
        <p className="text-sm text-blue-700">
          Prices are automatically updated every 3 hours via Vercel Cron Jobs. 
          You can also trigger a manual scrape using the button above.
        </p>
        <p className="text-sm text-blue-600 mt-2">
          <strong>Note:</strong> Some stores (Amazon, Walmart) have bot protection. 
          Manual price entry is recommended for these stores.
        </p>
      </div>
    </div>
  );
}

// ============================================================
// ALL PRICE LINKS TAB
// ============================================================
function AllPriceLinksTab() {
  const [links, setLinks] = useState([]);
  const [products, setProducts] = useState([]);
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [scraping, setScraping] = useState({});
  const [msg, setMsg] = useState('');

  useEffect(() => {
    Promise.all([
      authFetch('/api/price-links').then(r => r.json()),
      authFetch('/api/products?limit=200&sort=recent').then(r => r.json()),
      authFetch('/api/stores').then(r => r.json()),
    ]).then(([l, p, s]) => {
      setLinks(l);
      setProducts(p.products || []);
      setStores(s);
      setLoading(false);
    });
  }, []);

  function getProduct(productId) { return products.find(p => p.id === productId); }
  function getStore(storeId) { return stores.find(s => s.id === storeId); }

  async function scrapeLink(id) {
    setScraping(prev => ({ ...prev, [id]: true }));
    const res = await authFetch('/api/scrape', {
      method: 'POST',
      body: JSON.stringify({ linkId: id }),
    });
    const data = await res.json();
    setMsg(data.success ? `✅ Price: $${data.price} CAD` : `⚠️ ${data.error}`);
    setScraping(prev => ({ ...prev, [id]: false }));
    const updated = await authFetch('/api/price-links').then(r => r.json());
    setLinks(updated);
  }

  async function deleteLink(id) {
    if (!confirm('Delete?')) return;
    await authFetch(`/api/price-links/${id}`, { method: 'DELETE' });
    setLinks(links.filter(l => l.id !== id));
  }

  if (loading) return <div className="text-center py-10 text-gray-400">Loading...</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-lg font-bold text-gray-800">All Price Links ({links.length})</h2>
      </div>
      {msg && <div className="mb-3 px-4 py-2 bg-blue-50 text-blue-700 rounded-lg text-sm">{msg}</div>}
      <div className="space-y-2">
        {links.map(link => {
          const product = getProduct(link.productId);
          const store = getStore(link.storeId);
          return (
            <div key={link.id} className="bg-white rounded-xl border border-gray-100 p-3 flex items-center gap-3">
              <Badge status={link.scrapeStatus} />
              <div className="flex-1 min-w-0">
                <div className="text-xs font-semibold text-gray-700">{product?.name || 'Unknown product'}</div>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs text-gray-500">{store?.name || link.storeName}</span>
                  <a href={link.url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-500 hover:underline truncate max-w-xs">{link.url.substring(0, 50)}...</a>
                </div>
                {link.scrapeError && <div className="text-xs text-red-400 mt-0.5">{link.scrapeError}</div>}
              </div>
              <div className="flex-shrink-0 text-right">
                {link.currentPrice ? (
                  <div className="text-green-600 font-bold text-sm">${link.currentPrice.toFixed(2)} CAD</div>
                ) : <div className="text-gray-400 text-xs">No price</div>}
                {link.lastScrapedAt && <div className="text-xs text-gray-400">{new Date(link.lastScrapedAt).toLocaleDateString()}</div>}
              </div>
              <div className="flex gap-1">
                <button onClick={() => scrapeLink(link.id)} disabled={scraping[link.id]} className="p-1.5 text-blue-400 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50">
                  <RefreshCw className={`w-3.5 h-3.5 ${scraping[link.id] ? 'animate-spin' : ''}`} />
                </button>
                <button onClick={() => deleteLink(link.id)} className="p-1.5 text-gray-300 hover:text-red-400 hover:bg-red-50 rounded-lg transition-colors">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
        {links.length === 0 && (
          <div className="text-center py-10 text-gray-400">No price links yet. Add products and price links from the Products tab.</div>
        )}
      </div>
    </div>
  );
}

// ============================================================
// MAIN ADMIN PAGE
// ============================================================
export default function AdminPage() {
  const [activeTab, setActiveTab] = useState('products');
  const [authenticated, setAuthenticated] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const token = getAdminToken();
    if (!token || !isTokenValid(token)) {
      // Redirect to login using window.location for reliability
      window.location.href = '/admin/login';
      return;
    }
    
    // Ensure cookie is set for middleware with SameSite=Lax
    document.cookie = `ql_admin_token=${token}; path=/; max-age=${24*60*60}; SameSite=Lax`;
    setAuthenticated(true);
    setChecking(false);
  }, []);

  function handleLogout() {
    localStorage.removeItem('ql_admin_token');
    document.cookie = 'ql_admin_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    // Use window.location for reliable redirect
    window.location.href = '/admin/login';
  }

  if (checking) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <RefreshCw className="w-8 h-8 text-orange-500 animate-spin" />
      </div>
    );
  }

  if (!authenticated) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Back to Homepage */}
            <Link 
              href="/" 
              className="flex items-center gap-2 text-gray-500 hover:text-orange-500 transition-colors group"
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              <Home className="w-4 h-4" />
            </Link>
            
            <div className="h-5 w-px bg-gray-200" />
            
            <div className="flex items-center gap-2">
              <div className="bg-gradient-to-br from-orange-500 to-amber-500 text-white w-8 h-8 rounded-lg flex items-center justify-center">
                <Zap className="w-4 h-4" />
              </div>
              <div>
                <div className="font-black text-gray-800 text-sm leading-none">QuickLoot<span className="text-orange-500">.net</span></div>
                <div className="text-[10px] text-gray-400">Admin Panel</div>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 text-xs text-gray-500">
              <Shield className="w-3.5 h-3.5 text-green-500" />
              <span>JWT Secured</span>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 text-xs text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-full border border-red-200 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Tabs */}
        <div className="flex gap-1 bg-white rounded-xl p-1.5 border border-gray-200 mb-6 overflow-x-auto scrollbar-hide">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-orange-500 text-white shadow-sm'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-800'
              }`}
            >
              <span>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div>
          {activeTab === 'products' && <ProductsTab />}
          {activeTab === 'categories' && <CategoriesTab />}
          {activeTab === 'price-links' && <AllPriceLinksTab />}
          {activeTab === 'stores' && <StoresTab />}
          {activeTab === 'scraping' && <ScrapingTab />}
        </div>
      </div>
    </div>
  );
}
