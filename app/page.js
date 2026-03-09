'use client';

import { useState, useEffect, useCallback } from 'react';
import { Search, ChevronDown, ExternalLink, TrendingDown, Zap, Globe, Star, ArrowRight, RefreshCw, Menu, X, ChevronRight, ShoppingCart } from 'lucide-react';
import { translations, CATEGORIES } from '@/lib/translations';
import Link from 'next/link';

// ============================================================
// Language Context Hook
// ============================================================
function useLang() {
  const [lang, setLang] = useState('en');
  useEffect(() => {
    const saved = localStorage.getItem('ql_lang') || 'en';
    setLang(saved);
  }, []);
  const t = (key) => translations[lang]?.[key] || translations['en']?.[key] || key;
  const switchLang = (l) => { setLang(l); localStorage.setItem('ql_lang', l); };
  return { lang, t, switchLang };
}

// ============================================================
// Ad Placeholder Component
// ============================================================
function AdBanner({ width = '100%', height = 90, label = 'Advertisement' }) {
  return (
    <div className="ad-placeholder" style={{ width, height, minHeight: height }}>
      <div className="text-center">
        <div className="text-xs text-gray-400 mb-1">📢 {label}</div>
        <div className="text-xs text-gray-300">Google AdSense</div>
      </div>
    </div>
  );
}

// ============================================================
// Header Component
// ============================================================
function Header({ lang, t, switchLang, onSearch, searchQuery, setSearchQuery }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [catOpen, setCatOpen] = useState(false);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) onSearch(searchQuery.trim());
  };

  return (
    <header className="bg-white shadow-md sticky top-0 z-50">
      {/* Top bar */}
      <div className="bg-gradient-to-r from-orange-500 to-amber-500 py-1.5 px-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4 text-white text-xs">
            <span className="flex items-center gap-1"><TrendingDown className="w-3 h-3" /> Best price guarantee</span>
            <span className="hidden sm:flex items-center gap-1"><Globe className="w-3 h-3" /> Global stores comparison</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => switchLang('en')}
              className={`text-xs px-2 py-0.5 rounded transition-all ${lang === 'en' ? 'bg-white text-orange-600 font-semibold' : 'text-white hover:bg-white/20'}`}
            >
              🇬🇧 EN
            </button>
            <button
              onClick={() => switchLang('fr')}
              className={`text-xs px-2 py-0.5 rounded transition-all ${lang === 'fr' ? 'bg-white text-orange-600 font-semibold' : 'text-white hover:bg-white/20'}`}
            >
              🇫🇷 FR
            </button>
          </div>
        </div>
      </div>

      {/* Main header */}
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 flex-shrink-0">
          <div className="bg-gradient-to-br from-orange-500 to-amber-500 text-white w-9 h-9 rounded-lg flex items-center justify-center shadow-md">
            <Zap className="w-5 h-5" />
          </div>
          <div className="hidden sm:block">
            <div className="text-xl font-black text-gray-800 leading-none">
              Quick<span className="text-orange-500">Loot</span>
            </div>
            <div className="text-[9px] text-gray-400 tracking-widest uppercase">.net</div>
          </div>
        </Link>

        {/* Category dropdown */}
        <div className="relative hidden md:block flex-shrink-0">
          <button
            onClick={() => setCatOpen(!catOpen)}
            className="flex items-center gap-1.5 bg-orange-500 hover:bg-orange-600 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            <Menu className="w-4 h-4" />
            <span className="hidden lg:block">{t('allCategories')}</span>
            <ChevronDown className="w-3 h-3" />
          </button>
          {catOpen && (
            <div className="absolute top-full left-0 mt-1 bg-white rounded-xl shadow-2xl border border-gray-100 w-64 z-50 py-2 max-h-96 overflow-y-auto">
              {CATEGORIES.map(cat => (
                <Link
                  key={cat.slug}
                  href={`/?category=${cat.slug}`}
                  onClick={() => setCatOpen(false)}
                  className="flex items-center gap-3 px-4 py-2.5 hover:bg-orange-50 text-gray-700 hover:text-orange-600 transition-colors text-sm"
                >
                  <span className="text-lg">{cat.icon}</span>
                  <span>{lang === 'fr' ? cat.fr : cat.en}</span>
                  <ChevronRight className="w-3 h-3 ml-auto text-gray-400" />
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Search bar */}
        <form onSubmit={handleSearch} className="flex-1 flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('search')}
              className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent text-sm bg-gray-50"
              suppressHydrationWarning
              autoComplete="off"
            />
          </div>
          <button
            type="submit"
            className="bg-orange-500 hover:bg-orange-600 text-white px-5 py-2.5 rounded-lg font-medium text-sm flex items-center gap-1.5 transition-colors shadow-sm"
          >
            <Search className="w-4 h-4" />
            <span className="hidden sm:block">{t('searchBtn')}</span>
          </button>
        </form>

        {/* Admin link */}
        <Link href="/admin" className="hidden lg:flex items-center gap-1.5 text-gray-500 hover:text-orange-500 text-xs transition-colors flex-shrink-0">
          <Star className="w-4 h-4" />
          Admin
        </Link>
      </div>

      {/* Category bar */}
      <div className="border-t border-gray-100 bg-white overflow-x-auto scrollbar-hide">
        <div className="max-w-7xl mx-auto px-4 flex gap-1 py-2">
          <Link href="/" className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap bg-orange-500 text-white">
            🏠 {t('home')}
          </Link>
          {CATEGORIES.slice(0, 8).map(cat => (
            <Link
              key={cat.slug}
              href={`/?category=${cat.slug}`}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap text-gray-600 hover:bg-orange-50 hover:text-orange-600 transition-colors border border-transparent hover:border-orange-200"
            >
              {cat.icon} {lang === 'fr' ? cat.fr : cat.en}
            </Link>
          ))}
        </div>
      </div>
    </header>
  );
}

// ============================================================
// Product Card Component
// ============================================================
function ProductCard({ product, t, lang }) {
  const formatPrice = (price, currency = 'EUR') => {
    if (!price) return t('noPrice');
    return new Intl.NumberFormat(lang === 'fr' ? 'fr-FR' : 'en-GB', {
      style: 'currency',
      currency: currency || 'EUR',
      minimumFractionDigits: 2
    }).format(price);
  };

  return (
    <div className="bg-white rounded-xl border border-gray-100 hover:shadow-lg hover:border-orange-200 transition-all duration-200 group overflow-hidden">
      {/* Product Image */}
      <div className="relative bg-gradient-to-br from-gray-50 to-gray-100 h-44 flex items-center justify-center overflow-hidden">
        {product.image ? (
          <img
            src={product.image}
            alt={product.name}
            className="h-full w-full object-contain p-4 group-hover:scale-105 transition-transform duration-200"
            onError={(e) => { e.target.style.display = 'none'; }}
          />
        ) : (
          <div className="text-6xl opacity-20">
            {CATEGORIES.find(c => c.slug === product.category)?.icon || '📦'}
          </div>
        )}
        {product.bestPrice && (
          <div className="absolute top-2 right-2 bg-green-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow">
            {formatPrice(product.bestPrice)}
          </div>
        )}
      </div>

      {/* Product Info */}
      <div className="p-3">
        {product.brand && (
          <div className="text-xs text-orange-500 font-semibold uppercase tracking-wide mb-1">{product.brand}</div>
        )}
        <h3 className="text-sm font-semibold text-gray-800 line-clamp-2 mb-2 leading-tight group-hover:text-orange-600 transition-colors">
          {product.name}
        </h3>

        <div className="flex items-center justify-between mt-auto pt-2 border-t border-gray-50">
          <div>
            {product.bestPrice ? (
              <div>
                <div className="text-xs text-gray-400">{t('lowestPrice')}</div>
                <div className="text-lg font-black text-green-600">{formatPrice(product.bestPrice)}</div>
              </div>
            ) : (
              <div className="text-sm text-gray-400">{t('noPrice')}</div>
            )}
          </div>
          <Link
            href={`/product/${product.id}`}
            className="flex items-center gap-1 bg-orange-500 hover:bg-orange-600 text-white text-xs font-semibold px-3 py-2 rounded-lg transition-colors shadow-sm"
          >
            {t('compareAll')} <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// Sidebar Ad
// ============================================================
function SidebarAd() {
  return (
    <div className="space-y-4">
      <div className="ad-placeholder" style={{ height: 250 }}>
        <div className="text-center">
          <div className="text-xs text-gray-400 mb-1">📢 Advertisement</div>
          <div className="text-xs text-gray-300">300×250</div>
        </div>
      </div>
      <div className="ad-placeholder" style={{ height: 250 }}>
        <div className="text-center">
          <div className="text-xs text-gray-400 mb-1">📢 Advertisement</div>
          <div className="text-xs text-gray-300">300×250</div>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// Footer
// ============================================================
function Footer({ t }) {
  return (
    <footer className="bg-gray-900 text-gray-300 mt-12">
      <div className="max-w-7xl mx-auto px-4 py-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="bg-gradient-to-br from-orange-500 to-amber-500 text-white w-8 h-8 rounded-lg flex items-center justify-center">
                <Zap className="w-4 h-4" />
              </div>
              <div className="text-white font-black text-lg">Quick<span className="text-orange-400">Loot</span>.net</div>
            </div>
            <p className="text-xs text-gray-400 leading-relaxed">{t('footerDesc')}</p>
          </div>

          {/* Categories */}
          <div>
            <h4 className="text-white font-semibold mb-3 text-sm">Top Categories</h4>
            <ul className="space-y-1.5">
              {CATEGORIES.slice(0, 6).map(cat => (
                <li key={cat.slug}>
                  <Link href={`/?category=${cat.slug}`} className="text-xs text-gray-400 hover:text-orange-400 transition-colors flex items-center gap-1">
                    <span>{cat.icon}</span> {cat.en}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Stores */}
          <div>
            <h4 className="text-white font-semibold mb-3 text-sm">Partner Stores</h4>
            <ul className="space-y-1.5 text-xs text-gray-400">
              <li>🛒 Amazon</li>
              <li>🏷️ eBay</li>
              <li>📦 AliExpress</li>
              <li>📦 Fnac</li>
              <li>🏷️ Cdiscount</li>
              <li>💻 LDLC</li>
            </ul>
          </div>

          {/* Links */}
          <div>
            <h4 className="text-white font-semibold mb-3 text-sm">QuickLoot.net</h4>
            <ul className="space-y-1.5">
              {[['about', t('about')], ['contact', t('contact')], ['privacy', t('privacy')], ['terms', t('terms')]].map(([href, label]) => (
                <li key={href}>
                  <Link href={`/${href}`} className="text-xs text-gray-400 hover:text-orange-400 transition-colors">{label}</Link>
                </li>
              ))}
              <li>
                <Link href="/admin" className="text-xs text-gray-400 hover:text-orange-400 transition-colors flex items-center gap-1">
                  ⚙️ Admin Panel
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Ad space footer */}
        <div className="border-t border-gray-700 pt-6 mb-4">
          <AdBanner height={60} label="Footer Advertisement (728×60)" />
        </div>

        <div className="border-t border-gray-800 pt-4 text-center text-xs text-gray-500">
          {t('copyright')} | Affiliate disclosure: Links may contain affiliate codes.
        </div>
      </div>
    </footer>
  );
}

// ============================================================
// MAIN APP
// ============================================================
export default function App() {
  const { lang, t, switchLang } = useLang();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState(null);
  const [searching, setSearching] = useState(false);
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ totalProducts: 0, totalStores: 0, totalLinks: 0 });
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [sortBy, setSortBy] = useState('bestPrice');
  const [seeded, setSeeded] = useState(false);

  // Seed initial data and load products
  useEffect(() => {
    async function init() {
      try {
        if (!localStorage.getItem('ql_seeded')) {
          try {
            await fetch('/api/seed', { method: 'POST' });
          } catch (e) {}
          localStorage.setItem('ql_seeded', '1');
        }
        try {
          const statsRes = await fetch('/api/stats');
          if (statsRes.ok) {
            const s = await statsRes.json();
            setStats(s);
          }
        } catch (e) {}
      } finally {
        setSeeded(true);
      }
    }
    init();
  }, []);

  useEffect(() => {
    if (!seeded) return;

    async function loadData() {
      setLoading(true);
      try {
        // Get URL params
        const urlParams = new URLSearchParams(window.location.search);
        const cat = urlParams.get('category');
        setSelectedCategory(cat);

        // Load stats
        const statsRes = await fetch('/api/stats');
        if (statsRes.ok) {
          const s = await statsRes.json();
          setStats(s);
        }

        // Load products
        let url = `/api/products?sort=${sortBy}&limit=24`;
        if (cat) url += `&category=${cat}`;

        const prodRes = await fetch(url);
        if (prodRes.ok) {
          const data = await prodRes.json();
          setAllProducts(data.products || []);
        }

        // Load featured
        const featRes = await fetch('/api/products?featured=true&limit=8');
        if (featRes.ok) {
          const data = await featRes.json();
          setFeaturedProducts(data.products || []);
        }
      } catch (err) {
        console.error('Load error:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [seeded, sortBy]);

  const handleSearch = useCallback(async (q) => {
    setSearching(true);
    setSearchResults(null);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
      if (res.ok) {
        const data = await res.json();
        setSearchResults(data.products || []);
      }
    } catch (err) {
      console.error('Search error:', err);
    } finally {
      setSearching(false);
    }
  }, []);

  const clearSearch = () => {
    setSearchResults(null);
    setSearchQuery('');
  };

  const displayProducts = searchResults || allProducts;
  const isSearchMode = searchResults !== null;

  return (
    <div className="min-h-screen bg-gray-50">
      <Header
        lang={lang}
        t={t}
        switchLang={switchLang}
        onSearch={handleSearch}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
      />

      <main className="max-w-7xl mx-auto px-4 py-6">

        {/* Header Ad Banner */}
        <div className="mb-6">
          <AdBanner height={90} label="Header Advertisement (728×90)" />
        </div>

        {/* Hero Section (only on homepage without search) */}
        {!isSearchMode && !selectedCategory && (
          <div className="relative bg-gradient-to-br from-gray-900 via-gray-800 to-orange-900 rounded-2xl p-8 mb-8 overflow-hidden">
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-0 right-0 w-96 h-96 bg-orange-500 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-amber-500 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
            </div>
            <div className="relative z-10">
              <div className="flex items-center gap-2 text-orange-400 text-sm font-semibold mb-3 uppercase tracking-wide">
                <Zap className="w-4 h-4" />
                QuickLoot.net
              </div>
              <h1 className="text-3xl md:text-4xl font-black text-white mb-3">
                {t('heroTitle')}
              </h1>
              <p className="text-gray-300 text-base mb-6 max-w-xl">{t('heroSubtitle')}</p>

              {/* Stats */}
              <div className="flex flex-wrap gap-6">
                {[
                  { value: stats.totalProducts, label: 'Products', icon: '📦' },
                  { value: stats.totalStores, label: 'Stores', icon: '🏪' },
                  { value: stats.totalLinks, label: 'Price Links', icon: '🔗' },
                ].map(({ value, label, icon }) => (
                  <div key={label} className="flex items-center gap-2">
                    <span className="text-2xl">{icon}</span>
                    <div>
                      <div className="text-xl font-black text-white">{value}</div>
                      <div className="text-xs text-gray-400">{label}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Category Grid (homepage only) */}
        {!isSearchMode && !selectedCategory && (
          <div className="mb-8">
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <span>📂</span> {lang === 'fr' ? 'Catégories' : 'Categories'}
            </h2>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
              {CATEGORIES.map(cat => (
                <Link
                  key={cat.slug}
                  href={`/?category=${cat.slug}`}
                  className="bg-white rounded-xl p-3 text-center hover:shadow-md hover:border-orange-200 border border-transparent transition-all group cursor-pointer"
                >
                  <div className="text-3xl mb-1.5 group-hover:scale-110 transition-transform">{cat.icon}</div>
                  <div className="text-xs font-medium text-gray-600 group-hover:text-orange-600 transition-colors line-clamp-2">
                    {lang === 'fr' ? cat.fr : cat.en}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Main Content + Sidebar */}
        <div className="flex gap-6">
          {/* Main Content */}
          <div className="flex-1 min-w-0">

            {/* Search results header */}
            {isSearchMode && (
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold text-gray-800">
                    {searching ? t('loading') : `${displayProducts.length} results for "${searchQuery}"`}
                  </h2>
                  {searching && <RefreshCw className="w-4 h-4 animate-spin text-orange-500" />}
                </div>
                <button
                  onClick={clearSearch}
                  className="text-sm text-gray-500 hover:text-orange-500 flex items-center gap-1"
                >
                  <X className="w-4 h-4" /> {lang === 'fr' ? 'Effacer' : 'Clear'}
                </button>
              </div>
            )}

            {/* Category header */}
            {selectedCategory && !isSearchMode && (
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                  {CATEGORIES.find(c => c.slug === selectedCategory)?.icon}
                  {lang === 'fr'
                    ? CATEGORIES.find(c => c.slug === selectedCategory)?.fr
                    : CATEGORIES.find(c => c.slug === selectedCategory)?.en
                  }
                </h2>
                <Link href="/" className="text-sm text-orange-500 hover:underline">← {t('home')}</Link>
              </div>
            )}

            {/* Sort controls */}
            {displayProducts.length > 0 && (
              <div className="flex items-center gap-2 mb-4">
                <span className="text-xs text-gray-500">{t('sortBy')}:</span>
                {[
                  { value: 'bestPrice', label: t('sortLowHigh') },
                  { value: 'priceDesc', label: t('sortHighLow') },
                  { value: 'recent', label: t('sortRecent') },
                ].map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => setSortBy(opt.value)}
                    className={`text-xs px-3 py-1.5 rounded-full border transition-all ${
                      sortBy === opt.value
                        ? 'bg-orange-500 text-white border-orange-500'
                        : 'bg-white text-gray-600 border-gray-200 hover:border-orange-300'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            )}

            {/* Loading state */}
            {loading && (
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="bg-white rounded-xl border border-gray-100 overflow-hidden animate-pulse">
                    <div className="bg-gray-100 h-44" />
                    <div className="p-3">
                      <div className="h-3 bg-gray-100 rounded mb-2" />
                      <div className="h-3 bg-gray-100 rounded w-2/3 mb-3" />
                      <div className="h-6 bg-gray-100 rounded" />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Products Grid */}
            {!loading && displayProducts.length > 0 && (
              <>
                {/* Section title */}
                {!isSearchMode && (
                  <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                    {selectedCategory ? '' : <><span>⚡</span> {t('featured')}</>}
                  </h2>
                )}

                <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                  {displayProducts.map((product, idx) => (
                    <>
                      <ProductCard key={product.id} product={product} t={t} lang={lang} />
                      {/* In-content ad every 8 products */}
                      {(idx + 1) % 8 === 0 && (
                        <div key={`ad-${idx}`} className="col-span-2 md:col-span-3 xl:col-span-4">
                          <AdBanner height={80} label="In-Content Advertisement (728×80)" />
                        </div>
                      )}
                    </>
                  ))}
                </div>
              </>
            )}

            {/* No results */}
            {!loading && displayProducts.length === 0 && (
              <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
                <div className="text-6xl mb-4">🔍</div>
                <h3 className="text-lg font-bold text-gray-700 mb-2">
                  {isSearchMode ? `No results found for "${searchQuery}"` : t('noResults')}
                </h3>
                <p className="text-gray-400 text-sm mb-6">
                  {isSearchMode
                    ? 'Try different keywords or browse our categories'
                    : lang === 'fr' ? 'Ajoutez des produits via le panneau admin' : 'Add products via the admin panel'}
                </p>
                <Link
                  href="/admin"
                  className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-5 py-2.5 rounded-lg text-sm font-semibold transition-colors"
                >
                  ⚙️ {lang === 'fr' ? 'Aller au panneau admin' : 'Go to Admin Panel'}
                </Link>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="hidden xl:block w-72 flex-shrink-0">
            <SidebarAd />

            {/* Trending/Quick Links */}
            <div className="bg-white rounded-xl border border-gray-100 p-4 mt-4">
              <h3 className="font-bold text-gray-800 text-sm mb-3 flex items-center gap-1.5">
                <TrendingDown className="w-4 h-4 text-orange-500" />
                {lang === 'fr' ? 'Catégories populaires' : 'Popular Categories'}
              </h3>
              <ul className="space-y-2">
                {CATEGORIES.slice(0, 8).map(cat => (
                  <li key={cat.slug}>
                    <Link
                      href={`/?category=${cat.slug}`}
                      className="flex items-center gap-2 text-sm text-gray-600 hover:text-orange-600 transition-colors"
                    >
                      <span>{cat.icon}</span>
                      <span>{lang === 'fr' ? cat.fr : cat.en}</span>
                      <ChevronRight className="w-3 h-3 ml-auto text-gray-300" />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </main>

      <Footer t={t} />
    </div>
  );
}
