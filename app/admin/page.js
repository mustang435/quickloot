'use client';

import { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2, RefreshCw, CheckCircle, XCircle, Clock, ExternalLink, ArrowLeft, Zap, Save, X, ChevronDown, AlertCircle } from 'lucide-react';
import { CATEGORIES, DEFAULT_STORES } from '@/lib/translations';
import Link from 'next/link';

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

function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b">
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
// TABS
// ============================================================
const TABS = [
  { id: 'products', label: 'Products', icon: '📦' },
  { id: 'price-links', label: 'Price Links', icon: '🔗' },
  { id: 'stores', label: 'Stores', icon: '🏪' },
  { id: 'scraping', label: 'Scraping', icon: '🤖' },
];

// ============================================================
// PRODUCTS TAB
// ============================================================
function ProductsTab() {
  const [products, setProducts] = useState([]);
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null); // null | 'add' | 'edit' | 'links'
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [form, setForm] = useState({ name: '', brand: '', description: '', category: 'electronics', image: '', featured: false, tags: '' });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => { loadProducts(); loadStores(); }, []);

  async function loadProducts() {
    setLoading(true);
    const res = await fetch('/api/products?limit=100&sort=recent');
    if (res.ok) {
      const data = await res.json();
      setProducts(data.products || []);
    }
    setLoading(false);
  }

  async function loadStores() {
    const res = await fetch('/api/stores');
    if (res.ok) setStores(await res.json());
  }

  function openAdd() {
    setForm({ name: '', brand: '', description: '', category: 'electronics', image: '', featured: false, tags: '' });
    setSelectedProduct(null);
    setModal('add');
  }

  function openEdit(product) {
    setForm({
      name: product.name || '',
      brand: product.brand || '',
      description: product.description || '',
      category: product.category || 'electronics',
      image: product.image || '',
      featured: product.featured || false,
      tags: (product.tags || []).join(', '),
    });
    setSelectedProduct(product);
    setModal('edit');
  }

  async function saveProduct() {
    if (!form.name.trim()) return;
    setSaving(true);
    setMsg('');
    try {
      const payload = {
        ...form,
        tags: form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
      };
      let res;
      if (modal === 'edit' && selectedProduct) {
        res = await fetch(`/api/products/${selectedProduct.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch('/api/products', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
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
    await fetch(`/api/products/${id}`, { method: 'DELETE' });
    loadProducts();
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-lg font-bold text-gray-800">Products ({products.length})</h2>
        <button onClick={openAdd} className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm">
          <Plus className="w-4 h-4" /> Add Product
        </button>
      </div>

      {loading && <div className="text-center py-10 text-gray-400">Loading...</div>}

      <div className="space-y-2">
        {products.map(product => (
          <div key={product.id} className="bg-white rounded-xl border border-gray-100 p-4 flex items-center gap-4 hover:shadow-sm transition-shadow">
            <div className="w-12 h-12 bg-gray-50 rounded-lg flex items-center justify-center flex-shrink-0 text-2xl overflow-hidden">
              {product.image ? (
                <img src={product.image} alt="" className="w-full h-full object-contain" onError={(e) => e.target.style.display='none'} />
              ) : (
                CATEGORIES.find(c => c.slug === product.category)?.icon || '📦'
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-gray-800 text-sm truncate">{product.name}</div>
              <div className="flex items-center gap-2 mt-1">
                {product.brand && <span className="text-xs text-orange-500">{product.brand}</span>}
                <span className="text-xs text-gray-400">{CATEGORIES.find(c => c.slug === product.category)?.en || product.category}</span>
                {product.featured && <span className="text-xs bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded">⭐ Featured</span>}
              </div>
            </div>
            <div className="text-right flex-shrink-0">
              {product.bestPrice ? (
                <div className="text-green-600 font-bold text-sm">€{product.bestPrice.toFixed(2)}</div>
              ) : (
                <div className="text-gray-400 text-xs">No price</div>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => { setSelectedProduct(product); setModal('links'); }}
                className="text-xs bg-blue-50 hover:bg-blue-100 text-blue-600 px-3 py-1.5 rounded-lg font-medium transition-colors"
              >
                🔗 Links
              </button>
              <button onClick={() => openEdit(product)} className="text-gray-400 hover:text-orange-500 transition-colors p-1.5 hover:bg-orange-50 rounded-lg">
                <Edit2 className="w-4 h-4" />
              </button>
              <button onClick={() => deleteProduct(product.id)} className="text-gray-400 hover:text-red-500 transition-colors p-1.5 hover:bg-red-50 rounded-lg">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add/Edit Modal */}
      {(modal === 'add' || modal === 'edit') && (
        <Modal title={modal === 'add' ? 'Add Product' : 'Edit Product'} onClose={() => setModal(null)}>
          <FormField label="Product Name" required>
            <input className={inputCls} value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="e.g. iPhone 15 Pro 256GB" />
          </FormField>
          <FormField label="Brand">
            <input className={inputCls} value={form.brand} onChange={e => setForm({...form, brand: e.target.value})} placeholder="e.g. Apple" />
          </FormField>
          <FormField label="Category">
            <select className={inputCls} value={form.category} onChange={e => setForm({...form, category: e.target.value})}>
              {CATEGORIES.map(c => <option key={c.slug} value={c.slug}>{c.icon} {c.en}</option>)}
            </select>
          </FormField>
          <FormField label="Description">
            <textarea className={inputCls} rows={3} value={form.description} onChange={e => setForm({...form, description: e.target.value})} placeholder="Product description..." />
          </FormField>
          <FormField label="Image URL">
            <input className={inputCls} value={form.image} onChange={e => setForm({...form, image: e.target.value})} placeholder="https://..." />
          </FormField>
          <FormField label="Tags (comma separated)">
            <input className={inputCls} value={form.tags} onChange={e => setForm({...form, tags: e.target.value})} placeholder="smartphone, apple, ios" />
          </FormField>
          <div className="mb-4 flex items-center gap-2">
            <input type="checkbox" id="featured" checked={form.featured} onChange={e => setForm({...form, featured: e.target.checked})} className="w-4 h-4 accent-orange-500" />
            <label htmlFor="featured" className="text-sm text-gray-700">⭐ Featured Product (shown on homepage)</label>
          </div>
          {msg && <div className={`text-sm mb-3 px-3 py-2 rounded-lg ${msg.includes('Error') ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>{msg}</div>}
          <div className="flex gap-2">
            <button onClick={saveProduct} disabled={saving} className="flex-1 bg-orange-500 hover:bg-orange-600 text-white py-2.5 rounded-lg font-semibold text-sm transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
              {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {saving ? 'Saving...' : 'Save Product'}
            </button>
            <button onClick={() => setModal(null)} className="px-4 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50">Cancel</button>
          </div>
        </Modal>
      )}

      {/* Price Links Modal */}
      {modal === 'links' && selectedProduct && (
        <PriceLinksModal product={selectedProduct} stores={stores} onClose={() => { setModal(null); loadProducts(); }} />
      )}
    </div>
  );
}

// ============================================================
// PRICE LINKS MODAL (inside Products)
// ============================================================
function PriceLinksModal({ product, stores, onClose }) {
  const [links, setLinks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ storeId: '', storeName: '', url: '', affiliateUrl: '', currentPrice: '', currency: 'EUR' });
  const [saving, setSaving] = useState(false);
  const [scraping, setScraping] = useState({});
  const [msg, setMsg] = useState('');

  useEffect(() => { loadLinks(); }, []);

  async function loadLinks() {
    setLoading(true);
    const res = await fetch(`/api/price-links?productId=${product.id}`);
    if (res.ok) setLinks(await res.json());
    setLoading(false);
  }

  async function addLink() {
    if (!form.url.trim()) return setMsg('URL is required');
    setSaving(true);
    setMsg('');
    try {
      const payload = { ...form, productId: product.id };
      const selected = stores.find(s => s.id === form.storeId);
      if (selected && !form.storeName) payload.storeName = selected.name;
      const res = await fetch('/api/price-links', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        setMsg('Link added!');
        setForm({ storeId: '', storeName: '', url: '', affiliateUrl: '', currentPrice: '', currency: 'EUR' });
        loadLinks();
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

  async function deleteLink(id) {
    if (!confirm('Delete this price link?')) return;
    await fetch(`/api/price-links/${id}`, { method: 'DELETE' });
    loadLinks();
  }

  async function scrapeLink(id) {
    setScraping(prev => ({ ...prev, [id]: true }));
    setMsg('');
    try {
      const res = await fetch('/api/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ linkId: id }),
      });
      const data = await res.json();
      if (data.success) {
        setMsg(`✅ Price found: €${data.price}`);
      } else {
        setMsg(`⚠️ ${data.error || 'Could not extract price'}`);
      }
      loadLinks();
    } catch (e) {
      setMsg(`Error: ${e.message}`);
    } finally {
      setScraping(prev => ({ ...prev, [id]: false }));
    }
  }

  return (
    <Modal title={`Price Links - ${product.name}`} onClose={onClose}>
      {/* Add link form */}
      <div className="bg-gray-50 rounded-xl p-4 mb-5 border border-gray-200">
        <h4 className="font-semibold text-sm text-gray-700 mb-3">➕ Add Price Link</h4>
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <label className="text-xs text-gray-500 mb-1 block">Store</label>
            <select className={inputCls} value={form.storeId} onChange={e => setForm({...form, storeId: e.target.value})}>
              <option value="">-- Select Store --</option>
              {stores.map(s => <option key={s.id} value={s.id}>{s.logo} {s.name}</option>)}
            </select>
          </div>
          <div className="col-span-2">
            <label className="text-xs text-gray-500 mb-1 block">Product URL *</label>
            <input className={inputCls} value={form.url} onChange={e => setForm({...form, url: e.target.value})} placeholder="https://www.amazon.fr/..." />
          </div>
          <div className="col-span-2">
            <label className="text-xs text-gray-500 mb-1 block">Affiliate URL (optional)</label>
            <input className={inputCls} value={form.affiliateUrl} onChange={e => setForm({...form, affiliateUrl: e.target.value})} placeholder="https://... (leave empty to use same URL)" />
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Price (optional)</label>
            <input className={inputCls} type="number" step="0.01" value={form.currentPrice} onChange={e => setForm({...form, currentPrice: e.target.value})} placeholder="29.99" />
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Currency</label>
            <select className={inputCls} value={form.currency} onChange={e => setForm({...form, currency: e.target.value})}>
              <option value="EUR">EUR €</option>
              <option value="GBP">GBP £</option>
              <option value="USD">USD $</option>
            </select>
          </div>
        </div>
        {msg && (
          <div className={`text-xs mt-2 px-2 py-1.5 rounded ${msg.includes('Error') || msg.includes('⚠️') ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>{msg}</div>
        )}
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
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-semibold text-gray-700">{store?.logo} {store?.name || link.storeName || 'Unknown Store'}</span>
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
                      <div className="text-green-600 font-bold text-sm">{link.currency === 'GBP' ? '£' : link.currency === 'USD' ? '$' : '€'}{link.currentPrice.toFixed(2)}</div>
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
// STORES TAB
// ============================================================
function StoresTab() {
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ name: '', domain: '', logo: '🏪', color: '#666666', country: 'Global', scrapingConfig: { price: '', title: '' } });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const [seeding, setSeeding] = useState(false);

  useEffect(() => { loadStores(); }, []);

  async function loadStores() {
    setLoading(true);
    const res = await fetch('/api/stores');
    if (res.ok) setStores(await res.json());
    setLoading(false);
  }

  async function seedStores() {
    setSeeding(true);
    await fetch('/api/seed', { method: 'POST' });
    loadStores();
    setSeeding(false);
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
      const res = await fetch('/api/stores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        setMsg('Store added!');
        setModal(false);
        setForm({ name: '', domain: '', logo: '🏪', color: '#666666', country: 'Global', scrapingConfig: { price: '', title: '' } });
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
    await fetch(`/api/stores/${id}`, { method: 'DELETE' });
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
          <button onClick={() => setModal(true)} className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm">
            <Plus className="w-4 h-4" /> Add Store
          </button>
        </div>
      </div>

      {loading ? <div className="text-center py-10 text-gray-400">Loading...</div> : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {stores.map(store => (
            <div key={store.id} className="bg-white rounded-xl border border-gray-100 p-4 flex items-center gap-3">
              <div className="text-3xl">{store.logo}</div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-gray-800 text-sm">{store.name}</div>
                <div className="text-xs text-gray-400">{store.domain}</div>
                <div className="text-xs text-gray-400">{store.country}</div>
              </div>
              <button onClick={() => deleteStore(store.id)} className="text-gray-300 hover:text-red-400 transition-colors">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {modal && (
        <Modal title="Add Store" onClose={() => setModal(false)}>
          <FormField label="Store Name" required>
            <input className={inputCls} value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="e.g. Amazon FR" />
          </FormField>
          <FormField label="Domain" required>
            <input className={inputCls} value={form.domain} onChange={e => setForm({...form, domain: e.target.value})} placeholder="e.g. amazon.fr" />
          </FormField>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Logo Emoji">
              <input className={inputCls} value={form.logo} onChange={e => setForm({...form, logo: e.target.value})} />
            </FormField>
            <FormField label="Country">
              <input className={inputCls} value={form.country} onChange={e => setForm({...form, country: e.target.value})} placeholder="France" />
            </FormField>
          </div>
          <FormField label="Custom Price CSS Selector (optional)">
            <input className={inputCls} value={form.scrapingConfig.price} onChange={e => setForm({...form, scrapingConfig: {...form.scrapingConfig, price: e.target.value}})} placeholder=".product-price, #price" />
          </FormField>
          {msg && <div className="text-sm mb-3 text-green-600">{msg}</div>}
          <div className="flex gap-2">
            <button onClick={saveStore} disabled={saving} className="flex-1 bg-orange-500 hover:bg-orange-600 text-white py-2.5 rounded-lg font-semibold text-sm">
              {saving ? 'Saving...' : 'Add Store'}
            </button>
            <button onClick={() => setModal(false)} className="px-4 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-600">Cancel</button>
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
    const res = await fetch('/api/scrape/status');
    if (res.ok) setStatus(await res.json());
    setLoading(false);
  }

  async function triggerScrape() {
    if (!confirm('Start scraping all price links? This may take a while.')) return;
    setScraping(true);
    setMsg('');
    const res = await fetch('/api/scrape', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    const data = await res.json();
    setMsg(data.message || 'Scraping started!');
    setScraping(false);
    setTimeout(loadStatus, 3000);
  }

  if (loading) return <div className="text-center py-10 text-gray-400">Loading...</div>;
  if (!status) return null;

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-lg font-bold text-gray-800">Scraping Status</h2>
        <button
          onClick={triggerScrape}
          disabled={scraping || status.cronRunning}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 shadow-sm"
        >
          {(scraping || status.cronRunning) ? <RefreshCw className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          {status.cronRunning ? 'Scraping in progress...' : 'Scrape All Now'}
        </button>
      </div>

      {msg && (
        <div className="mb-4 px-4 py-3 bg-blue-50 text-blue-700 rounded-xl text-sm border border-blue-100">{msg}</div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total Links', value: status.total, color: 'bg-blue-50 text-blue-700', icon: '🔗' },
          { label: 'Success', value: status.success, color: 'bg-green-50 text-green-700', icon: '✅' },
          { label: 'Failed', value: status.failed, color: 'bg-red-50 text-red-700', icon: '❌' },
          { label: 'Cron Active', value: status.cronInitialized ? 'Yes' : 'No', color: 'bg-purple-50 text-purple-700', icon: '⏰' },
        ].map(item => (
          <div key={item.label} className={`rounded-xl p-4 ${item.color}`}>
            <div className="text-2xl mb-1">{item.icon}</div>
            <div className="text-2xl font-black">{item.value}</div>
            <div className="text-xs opacity-70">{item.label}</div>
          </div>
        ))}
      </div>

      {status.lastCronRun && (
        <div className="mb-4 text-sm text-gray-500 bg-gray-50 px-4 py-2.5 rounded-lg">
          ⏰ Cron runs every 3 hours. Last run: <strong>{new Date(status.lastCronRun).toLocaleString()}</strong>
        </div>
      )}

      {/* Recent links */}
      <h3 className="font-semibold text-gray-700 mb-3 text-sm">Recent Scraping Activity</h3>
      <div className="space-y-2">
        {status.recentLinks.map(link => (
          <div key={link.id} className="bg-white border border-gray-100 rounded-xl p-3 flex items-center gap-3">
            <Badge status={link.scrapeStatus} />
            <div className="flex-1 min-w-0">
              <a href={link.url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-500 hover:underline truncate block">
                {link.store?.logo} {link.store?.name || 'Unknown'} — {link.url.substring(0, 60)}...
              </a>
              {link.scrapeError && <div className="text-xs text-red-400 mt-0.5">{link.scrapeError}</div>}
            </div>
            <div className="flex-shrink-0 text-right">
              {link.currentPrice && <div className="text-green-600 font-bold text-sm">€{link.currentPrice?.toFixed(2)}</div>}
              {link.lastScrapedAt && <div className="text-xs text-gray-400">{new Date(link.lastScrapedAt).toLocaleDateString()}</div>}
            </div>
          </div>
        ))}
      </div>
      {status.recentLinks.length === 0 && (
        <div className="text-center py-8 text-gray-400 text-sm">No scraping history yet. Add products and price links, then scrape!</div>
      )}
    </div>
  );
}

// ============================================================
// MAIN ADMIN PAGE
// ============================================================
export default function AdminPage() {
  const [activeTab, setActiveTab] = useState('products');

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-2 text-gray-500 hover:text-orange-500 transition-colors">
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm">Back to site</span>
            </Link>
            <div className="h-5 w-px bg-gray-200" />
            <div className="flex items-center gap-2">
              <div className="bg-gradient-to-br from-orange-500 to-amber-500 text-white w-7 h-7 rounded-lg flex items-center justify-center">
                <Zap className="w-4 h-4" />
              </div>
              <h1 className="font-black text-gray-800">QuickLoot<span className="text-orange-500">.net</span> Admin</h1>
            </div>
          </div>
          <div className="text-xs text-gray-400 bg-gray-50 px-3 py-1.5 rounded-full">
            ⏰ Auto-scrape every 3 hours
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
          {activeTab === 'price-links' && <AllPriceLinksTab />}
          {activeTab === 'stores' && <StoresTab />}
          {activeTab === 'scraping' && <ScrapingTab />}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// ALL PRICE LINKS TAB (standalone)
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
      fetch('/api/price-links').then(r => r.json()),
      fetch('/api/products?limit=200&sort=recent').then(r => r.json()),
      fetch('/api/stores').then(r => r.json()),
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
    const res = await fetch('/api/scrape', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ linkId: id }),
    });
    const data = await res.json();
    setMsg(data.success ? `✅ Price: €${data.price}` : `⚠️ ${data.error}`);
    setScraping(prev => ({ ...prev, [id]: false }));
    const updated = await fetch('/api/price-links').then(r => r.json());
    setLinks(updated);
  }

  async function deleteLink(id) {
    if (!confirm('Delete?')) return;
    await fetch(`/api/price-links/${id}`, { method: 'DELETE' });
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
                  <span className="text-xs text-gray-500">{store?.logo} {store?.name || link.storeName}</span>
                  <a href={link.url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-500 hover:underline truncate max-w-xs">{link.url.substring(0, 50)}...</a>
                </div>
                {link.scrapeError && <div className="text-xs text-red-400 mt-0.5">{link.scrapeError}</div>}
              </div>
              <div className="flex-shrink-0 text-right">
                {link.currentPrice ? (
                  <div className="text-green-600 font-bold text-sm">€{link.currentPrice.toFixed(2)}</div>
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
