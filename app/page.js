'use client';

import { useState, useEffect, useCallback } from 'react';
import { Search, ChevronDown, TrendingDown, Zap, Globe, ArrowRight, RefreshCw, Menu, X, ChevronRight, ShoppingCart } from 'lucide-react';
import Link from 'next/link';

// ============================================================
// Translations (inline)
// ============================================================
const translations = {
  en: {
    search: 'Search for products, brands...',
    searchBtn: 'Search',
    allCategories: 'All Categories',
    home: 'Home',
    heroTitle: 'Compare Prices, Save More',
    heroSubtitle: 'Find the best deals from Amazon.ca, Walmart, EB Games, Staples and more Canadian stores',
    lowestPrice: 'Lowest Price',
    noPrice: 'N/A',
    noResults: 'No products found',
    loading: 'Loading...',
    sortBy: 'Sort By',
    sortLowHigh: 'Price: Low to High',
    sortHighLow: 'Price: High to Low',
    sortRecent: 'Recently Added',
    featured: 'Featured Products',
    compareAll: 'Compare',
    about: 'About',
    contact: 'Contact',
    privacy: 'Privacy Policy',
    terms: 'Terms of Service',
    footerDesc: 'QuickLoot.net helps you find the best prices across Canadian online stores.',
    copyright: '© 2025 QuickLoot.net - All rights reserved',
    categories: 'Categories',
    popularCategories: 'Popular Categories',
    partnerStores: 'Partner Stores',
    tryAgain: 'Try another search or browse categories.',
  },
  fr: {
    search: 'Rechercher des produits, marques...',
    searchBtn: 'Rechercher',
    allCategories: 'Toutes les catégories',
    home: 'Accueil',
    heroTitle: 'Comparez les prix, économisez plus',
    heroSubtitle: "Trouvez les meilleures aubaines chez Amazon.ca, Walmart, EB Games, Staples et d'autres magasins canadiens",
    lowestPrice: 'Prix le plus bas',
    noPrice: 'N/D',
    noResults: 'Aucun produit trouvé',
    loading: 'Chargement...',
    sortBy: 'Trier par',
    sortLowHigh: 'Prix: croissant',
    sortHighLow: 'Prix: décroissant',
    sortRecent: 'Récemment ajouté',
    featured: 'Produits vedettes',
    compareAll: 'Comparer',
    about: 'À propos',
    contact: 'Nous joindre',
    privacy: 'Politique de confidentialité',
    terms: "Conditions d'utilisation",
    footerDesc: 'QuickLoot.net vous aide à trouver les meilleurs prix dans les magasins en ligne canadiens.',
    copyright: '© 2025 QuickLoot.net - Tous droits réservés',
    categories: 'Catégories',
    popularCategories: 'Catégories populaires',
    partnerStores: 'Magasins partenaires',
    tryAgain: 'Essayez une autre recherche ou parcourez les catégories.',
  }
};

// ============================================================
// Language Hook
// ============================================================
function useLang() {
  const [lang, setLang] = useState('en');
  useEffect(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem('ql_lang') || 'en' : 'en';
    setLang(saved);
  }, []);
  const t = (key) => translations[lang]?.[key] || translations['en']?.[key] || key;
  const switchLang = (l) => {
    setLang(l);
    if (typeof window !== 'undefined') localStorage.setItem('ql_lang', l);
  };
  return { lang, t, switchLang };
}

// ============================================================
// Ad Banner
// ============================================================
function AdBanner({ height = 90, label = 'Advertisement' }) {
  return (
    <div className="rounded-lg border-2 border-dashed border-gray-200 bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center" style={{ height }}>
      <div className="text-center">
        <div className="text-xs text-gray-400 mb-0.5">📢 {label}</div>
        <div className="text-xs text-gray-300">Google AdSense</div>
      </div>
    </div>
  );
}

// ============================================================
// Category Icon Component (supports image or emoji)
// ============================================================
function CategoryIcon({ category, size = 'md' }) {
  const sizeClasses = {
    sm: 'w-6 h-6 text-lg',
    md: 'w-10 h-10 text-2xl',
    lg: 'w-12 h-12 text-3xl',
  };

  // If category has an image (base64 or URL)
  if (category.image && (category.image.startsWith('data:') || category.image.startsWith('http'))) {
    return (
      <div className={`${sizeClasses[size].split(' ').slice(0, 2).join(' ')} rounded-lg overflow-hidden bg-gray-50 flex items-center justify-center`}>
        <img 
          src={category.image} 
          alt={category.name_en || category.name || ''} 
          className="w-full h-full object-contain"
        />
      </div>
    );
  }

  // Otherwise use emoji icon
  return (
    <span className={sizeClasses[size].split(' ').slice(2).join(' ')}>
      {category.icon || '📁'}
    </span>
  );
}

// ============================================================
// Build category tree (for nested display)
// ============================================================
function buildCategoryTree(categories, parentId = null) {
  if (!categories || !Array.isArray(categories)) return [];
  
  return categories
    .filter(c => c && (c.parentId || null) === parentId)
    .sort((a, b) => (a.order || 99) - (b.order || 99))
    .map(cat => ({
      ...cat,
      children: buildCategoryTree(categories, cat.id || cat._id || cat.slug)
    }));
}

// ============================================================
// Header with Dynamic Categories
// ============================================================
function Header({ lang, t, switchLang, onSearch, searchQuery, setSearchQuery, categories }) {
  const [catOpen, setCatOpen] = useState(false);
  const categoryTree = buildCategoryTree(categories);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) onSearch(searchQuery.trim());
  };

  // Keep track of which parent categories are expanded in the menu
  const [expandedCats, setExpandedCats] = useState({});

  const toggleCat = (e, catId) => {
    e.preventDefault();
    e.stopPropagation();
    setExpandedCats(prev => ({ ...prev, [catId]: !prev[catId] }));
  };

  const setCatExpanded = (catId, isExpanded) => {
    setExpandedCats(prev => ({ ...prev, [catId]: isExpanded }));
  };

  // Render category with children
  const renderCategoryItem = (cat, index, depth = 0) => {
    if (!cat || (!cat.id && !cat._id && !cat.slug)) return null; // SAFEGUARD: ignore invalid categories

    const catId = cat.id || cat._id || cat.slug || `cat-${index}`;
    const catSlug = cat.slug || cat.id || cat._id || ''; 
    
    // Prevent rendering if there's no way to link to it
    if (!catSlug) return null;

    const hasChildren = Array.isArray(cat.children) && cat.children.length > 0;
    const isExpanded = !!expandedCats[catId];
    
    return (
      <div 
        key={catId} 
        onMouseEnter={() => hasChildren && setCatExpanded(catId, true)}
        onMouseLeave={() => hasChildren && setCatExpanded(catId, false)}
      >
        <div 
          className="flex items-center justify-between px-4 py-2 hover:bg-orange-50 text-gray-700 hover:text-orange-600 transition-colors text-sm group"
          style={{ paddingLeft: `${16 + depth * 16}px` }}
        >
          {/* Main Clickable Link */}
          <Link 
            href={`/?category=${catSlug}`} 
            onClick={() => setCatOpen(false)} 
            className="flex items-center gap-3 flex-1 py-1"
          >
            <CategoryIcon category={cat} size={depth === 0 ? "sm" : "sm"} />
            <span className={depth > 0 ? "text-xs text-gray-600 group-hover:text-orange-600 font-medium" : "font-semibold"}>
              {getCategoryName(cat)}
            </span>
          </Link>
          
          {/* Toggle Button for Children (useful for mobile) */}
          {hasChildren && (
            <button 
              onClick={(e) => toggleCat(e, catId)}
              className="p-1.5 hover:bg-orange-100 rounded-md transition-colors text-gray-400 hover:text-orange-600"
            >
              <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isExpanded ? 'rotate-180' : '-rotate-90'}`} />
            </button>
          )}
        </div>
        
        {/* Children (Accordion) */}
        {hasChildren && isExpanded && (
          <div className="bg-orange-50/30 border-l-2 border-orange-200 ml-6 pl-1 my-1 rounded-bl-md">
            {cat.children
               .filter(child => child && (child.id || child._id || child.slug))
               .map((child, childIdx) => renderCategoryItem(child, childIdx, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <header className="bg-white shadow-md sticky top-0 z-50">
      {/* Top bar */}
      <div className="bg-gradient-to-r from-orange-500 to-amber-500 py-1.5 px-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4 text-white text-xs">
            <span className="flex items-center gap-1"><TrendingDown className="w-3 h-3" /> {lang === 'fr' ? 'Meilleur prix garanti' : 'Best price guarantee'}</span>
            <span className="hidden sm:flex items-center gap-1"><Globe className="w-3 h-3" /> {lang === 'fr' ? 'Magasins canadiens' : 'Canadian stores comparison'}</span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => switchLang('en')} className={`text-xs px-2 py-0.5 rounded transition-all ${lang === 'en' ? 'bg-white text-orange-600 font-semibold' : 'text-white hover:bg-white/20'}`}>🇨🇦 EN</button>
            <button onClick={() => switchLang('fr')} className={`text-xs px-2 py-0.5 rounded transition-all ${lang === 'fr' ? 'bg-white text-orange-600 font-semibold' : 'text-white hover:bg-white/20'}`}>🇨🇦 FR</button>
          </div>
        </div>
      </div>

      {/* Main header */}
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-4">
        <Link href="/" className="flex items-center gap-2 flex-shrink-0">
          <div className="bg-gradient-to-br from-orange-500 to-amber-500 text-white w-9 h-9 rounded-lg flex items-center justify-center shadow-md">
            <Zap className="w-5 h-5" />
          </div>
          <div className="hidden sm:block">
            <div className="text-xl font-black text-gray-800 leading-none">Quick<span className="text-orange-500">Loot</span></div>
            <div className="text-[9px] text-gray-400 tracking-widest uppercase">.net</div>
          </div>
        </Link>

        {/* Category dropdown - DYNAMIC FROM DB */}
        <div className="relative hidden md:block flex-shrink-0">
          <button onClick={() => setCatOpen(!catOpen)} className="flex items-center gap-1.5 bg-orange-500 hover:bg-orange-600 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors">
            <Menu className="w-4 h-4" />
            <span className="hidden lg:block">{t('allCategories')}</span>
            <ChevronDown className="w-3 h-3" />
          </button>
          {catOpen && categories?.length > 0 && (
            <div className="absolute top-full left-0 mt-1 bg-white rounded-xl shadow-2xl border border-gray-100 w-72 z-50 py-2 max-h-96 overflow-y-auto">
              {categoryTree?.filter(cat => cat && (cat.id || cat._id || cat.slug)).map((cat, rootIdx) => renderCategoryItem(cat, rootIdx))}
            </div>
          )}
          {catOpen && (!categories || categories.length === 0) && (
            <div className="absolute top-full left-0 mt-1 bg-white rounded-xl shadow-2xl border border-gray-100 w-64 z-50 py-4 px-4 text-center text-gray-400 text-sm">
              {lang === 'fr' ? 'Aucune catégorie' : 'No categories yet'}
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
              autoComplete="off"
              className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent text-sm bg-gray-50"
            />
          </div>
          <button type="submit" className="bg-orange-500 hover:bg-orange-600 text-white px-5 py-2.5 rounded-lg font-medium text-sm flex items-center gap-1.5 transition-colors shadow-sm">
            <Search className="w-4 h-4" />
            <span className="hidden sm:block">{t('searchBtn')}</span>
          </button>
        </form>
      </div>

      {/* Category bar - DYNAMIC (only root categories, sorted by order) */}
      <div className="border-t border-gray-100 bg-white overflow-x-auto scrollbar-hide">
        <div className="max-w-7xl mx-auto px-4 flex gap-1 py-2">
          <Link href="/" className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap bg-orange-500 text-white">
            🏠 {t('home')}
          </Link>
          {categories
            .filter(c => !c.parentId)
            .sort((a, b) => (a.order || 99) - (b.order || 99))
            .slice(0, 8)
            .map(cat => (
              <Link 
                key={cat.id} 
                href={`/?category=${cat.slug}`} 
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap text-gray-600 hover:bg-orange-50 hover:text-orange-600 transition-colors border border-transparent hover:border-orange-200"
              >
                <CategoryIcon category={cat} size="sm" />
                <span>{lang === 'fr' ? (cat.name_fr || cat.name_en) : (cat.name_en || cat.name)}</span>
              </Link>
            ))}
        </div>
      </div>
    </header>
  );
}

// ============================================================
// Product Card
// ============================================================
function ProductCard({ product, t, lang, categories }) {
  const formatPrice = (price, currency = 'CAD') => {
    if (!price) return t('noPrice');
    try {
      return new Intl.NumberFormat(lang === 'fr' ? 'fr-CA' : 'en-CA', { style: 'currency', currency: currency || 'CAD', minimumFractionDigits: 2 }).format(price);
    } catch { return `$${price.toFixed(2)}`; }
  };

  // Find category from dynamic list
  const category = categories.find(c => c.slug === product.category || c.id === product.category);

  return (
    <div className="bg-white rounded-xl border border-gray-100 hover:shadow-lg hover:border-orange-200 transition-all duration-200 group overflow-hidden">
      <div className="relative bg-gradient-to-br from-gray-50 to-gray-100 h-44 flex items-center justify-center overflow-hidden">
        {product.image ? (
          <img src={product.image} alt={product.name} className="h-full w-full object-contain p-4 group-hover:scale-105 transition-transform duration-200" onError={(e) => { e.target.style.display = 'none'; }} />
        ) : (
          <div className="text-6xl opacity-20">
            {category?.image ? <img src={category.image} alt="" className="w-16 h-16 object-contain opacity-30" /> : (category?.icon || '📦')}
          </div>
        )}
        {product.bestPrice && (
          <div className="absolute top-2 right-2 bg-green-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow">
            {formatPrice(product.bestPrice)}
          </div>
        )}
      </div>

      <div className="p-3">
        {product.brand && <div className="text-xs text-orange-500 font-semibold uppercase tracking-wide mb-1">{product.brand}</div>}
        <h3 className="text-sm font-semibold text-gray-800 line-clamp-2 mb-2 leading-tight group-hover:text-orange-600 transition-colors">{product.name}</h3>

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
          <Link href={`/product/${product.id}`} className="flex items-center gap-1 bg-orange-500 hover:bg-orange-600 text-white text-xs font-semibold px-3 py-2 rounded-lg transition-colors shadow-sm">
            {t('compareAll')} <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// Footer (NO Admin link)
// ============================================================
function Footer({ t, lang, categories }) {
  return (
    <footer className="bg-gray-900 text-gray-300 mt-12">
      <div className="max-w-7xl mx-auto px-4 py-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="bg-gradient-to-br from-orange-500 to-amber-500 text-white w-8 h-8 rounded-lg flex items-center justify-center">
                <Zap className="w-4 h-4" />
              </div>
              <div className="text-white font-black text-lg">Quick<span className="text-orange-400">Loot</span>.net</div>
            </div>
            <p className="text-xs text-gray-400 leading-relaxed">{t('footerDesc')}</p>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-3 text-sm">{t('categories')}</h4>
            <ul className="space-y-1.5">
              {categories
                .filter(c => !c.parentId)
                .sort((a, b) => (a.order || 99) - (b.order || 99))
                .slice(0, 6)
                .map(cat => (
                  <li key={cat.id}>
                    <Link href={`/?category=${cat.slug}`} className="text-xs text-gray-400 hover:text-orange-400 transition-colors flex items-center gap-1">
                      <CategoryIcon category={cat} size="sm" />
                      <span>{lang === 'fr' ? (cat.name_fr || cat.name_en) : (cat.name_en || cat.name)}</span>
                    </Link>
                  </li>
                ))}
            </ul>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-3 text-sm">{t('partnerStores')}</h4>
            <ul className="space-y-1.5 text-xs text-gray-400">
              <li>🛒 Amazon.ca</li>
              <li>🏪 Walmart Canada</li>
              <li>🎮 EB Games</li>
              <li>📎 Staples Canada</li>
              <li>📺 Best Buy Canada</li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-3 text-sm">QuickLoot.net</h4>
            <ul className="space-y-1.5">
              <li><Link href="/privacy" className="text-xs text-gray-400 hover:text-orange-400 transition-colors">{t('privacy')}</Link></li>
              <li><Link href="/terms" className="text-xs text-gray-400 hover:text-orange-400 transition-colors">{t('terms')}</Link></li>
            </ul>
          </div>
        </div>
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
// Cookie Consent
// ============================================================
function CookieConsent({ lang }) {
  const [visible, setVisible] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const consent = localStorage.getItem('ql_cookie_consent');
    if (!consent) {
      setTimeout(() => setVisible(true), 1000);
    }
  }, []);

  const accept = () => {
    localStorage.setItem('ql_cookie_consent', JSON.stringify({ accepted: true, timestamp: new Date().toISOString() }));
    setVisible(false);
  };

  if (!mounted || !visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4">
      <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-2xl border border-gray-100 p-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="flex-1">
            <h3 className="font-semibold text-gray-800 mb-1">🍪 {lang === 'fr' ? 'Préférences de témoins' : 'Cookie Preferences'}</h3>
            <p className="text-sm text-gray-600">
              {lang === 'fr' 
                ? "Nous utilisons des témoins pour améliorer votre expérience." 
                : "We use cookies to enhance your browsing experience."}
              {' '}
              <Link href="/privacy" className="text-orange-500 hover:underline">{lang === 'fr' ? 'En savoir plus' : 'Learn more'}</Link>
            </p>
          </div>
          <div className="flex gap-2">
            <button onClick={accept} className="bg-orange-500 hover:bg-orange-600 text-white px-5 py-2 rounded-lg font-semibold text-sm transition-colors">
              {lang === 'fr' ? 'Accepter' : 'Accept'}
            </button>
            <button onClick={() => setVisible(false)} className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-5 py-2 rounded-lg font-semibold text-sm transition-colors">
              {lang === 'fr' ? 'Fermer' : 'Close'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// MAIN APP
// ============================================================
export default function App() {
  const { lang, t, switchLang } = useLang();

  const [mounted, setMounted] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState(null);
  const [searching, setSearching] = useState(false);
  const [allProducts, setAllProducts] = useState([]);
  const [categories, setCategories] = useState([]); // DYNAMIC CATEGORIES
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({ totalProducts: 0, totalStores: 0, totalLinks: 0 });
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedCategoryData, setSelectedCategoryData] = useState(null);
  const [sortBy, setSortBy] = useState('bestPrice');

  // Mount guard
  useEffect(() => {
    setMounted(true);
  }, []);

  // Load categories from DB (sorted by order)
  useEffect(() => {
    if (!mounted) return;
    async function loadCategories() {
      try {
        const r = await fetch('/api/categories');
        if (r.ok) {
          const data = await r.json();
          // Sort by order
          data.sort((a, b) => (a.order || 99) - (b.order || 99));
          setCategories(data);
        }
      } catch (e) {
        console.error('Failed to load categories:', e);
      }
    }
    loadCategories();
  }, [mounted]);

  // Load stats
  useEffect(() => {
    if (!mounted) return;
    async function loadStats() {
      try {
        const r = await fetch('/api/stats');
        if (r.ok) setStats(await r.json());
      } catch (e) {}
    }
    loadStats();
  }, [mounted]);

  // Load products (with dynamic category from URL)
  useEffect(() => {
    if (!mounted) return;
    
    const urlParams = new URLSearchParams(window.location.search);
    const cat = urlParams.get('category');
    setSelectedCategory(cat);

    async function loadData() {
      setLoading(true);
      try {
        let url = `/api/products?sort=${sortBy}&limit=24`;
        if (cat) url += `&category=${cat}`;
        const r = await fetch(url);
        if (r.ok) {
          const data = await r.json();
          setAllProducts(data.products || []);
        }
      } catch (err) {
        console.error('Load error:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [mounted, sortBy]);

  // Update selected category data when categories or selectedCategory changes
  useEffect(() => {
    if (selectedCategory && categories.length > 0) {
      const cat = categories.find(c => c.slug === selectedCategory);
      setSelectedCategoryData(cat || null);
    } else {
      setSelectedCategoryData(null);
    }
  }, [selectedCategory, categories]);

  // Search handler
  const handleSearch = useCallback(async (q) => {
    setSearching(true);
    setSearchResults(null);
    try {
      const r = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
      if (r.ok) {
        const data = await r.json();
        setSearchResults(data.products || []);
      }
    } catch (err) {
      console.error('Search error:', err);
    } finally {
      setSearching(false);
    }
  }, []);

  const clearSearch = () => { setSearchResults(null); setSearchQuery(''); };

  // Loading screen
  if (!mounted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-3">⚡</div>
          <div className="text-orange-500 font-bold text-xl">QuickLoot<span className="text-gray-700">.net</span></div>
          <div className="text-gray-400 text-sm mt-1">{t('loading')}</div>
        </div>
      </div>
    );
  }

  const displayProducts = searchResults !== null ? searchResults : allProducts;
  const isSearchMode = searchResults !== null;

  // Build category breadcrumb
  const getCategoryBreadcrumb = () => {
    if (!selectedCategoryData) return [];
    const breadcrumb = [selectedCategoryData];
    let parent = selectedCategoryData.parentId ? categories.find(c => c.id === selectedCategoryData.parentId) : null;
    while (parent) {
      breadcrumb.unshift(parent);
      parent = parent.parentId ? categories.find(c => c.id === parent.parentId) : null;
    }
    return breadcrumb;
  };
  const categoryBreadcrumb = getCategoryBreadcrumb();

  return (
    <div className="min-h-screen bg-gray-50">
      <Header 
        lang={lang} 
        t={t} 
        switchLang={switchLang} 
        onSearch={handleSearch} 
        searchQuery={searchQuery} 
        setSearchQuery={setSearchQuery} 
        categories={categories}
      />

      <main className="max-w-7xl mx-auto px-4 py-6">

        {/* Header Ad */}
        <div className="mb-6">
          <AdBanner height={90} label="Header Advertisement (728×90)" />
        </div>

        {/* Hero Section (only on homepage) */}
        {!isSearchMode && !selectedCategory && (
          <div className="relative bg-gradient-to-br from-gray-900 via-gray-800 to-orange-900 rounded-2xl p-8 mb-8 overflow-hidden">
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-0 right-0 w-96 h-96 bg-orange-500 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-amber-500 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
            </div>
            <div className="relative z-10">
              <div className="flex items-center gap-2 text-orange-400 text-sm font-semibold mb-3 uppercase tracking-wide">
                <Zap className="w-4 h-4" /> QuickLoot.net
              </div>
              <h1 className="text-3xl md:text-4xl font-black text-white mb-3">{t('heroTitle')}</h1>
              <p className="text-gray-300 text-base mb-6 max-w-xl">{t('heroSubtitle')}</p>
              <div className="flex flex-wrap gap-6">
                {[{ value: stats.totalProducts, label: lang === 'fr' ? 'Produits' : 'Products', icon: '📦' }, 
                  { value: stats.totalStores, label: lang === 'fr' ? 'Magasins' : 'Stores', icon: '🏪' }, 
                  { value: stats.totalLinks, label: lang === 'fr' ? 'Liens de prix' : 'Price Links', icon: '🔗' }].map(({ value, label, icon }) => (
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

        {/* Category Grid - DYNAMIC FROM DB (sorted by order) */}
        {!isSearchMode && !selectedCategory && categories.filter(c => !c.parentId).length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <span>📂</span> {t('categories')}
            </h2>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
              {categories
                .filter(c => !c.parentId)
                .sort((a, b) => (a.order || 99) - (b.order || 99))
                .map(cat => (
                  <Link 
                    key={cat.id} 
                    href={`/?category=${cat.slug}`} 
                    className="bg-white rounded-xl p-3 text-center hover:shadow-md hover:border-orange-200 border border-transparent transition-all group cursor-pointer"
                  >
                    <div className="text-3xl mb-1.5 group-hover:scale-110 transition-transform flex items-center justify-center">
                      {cat.image && (cat.image.startsWith('data:') || cat.image.startsWith('http')) ? (
                        <img src={cat.image} alt="" className="w-10 h-10 object-contain" />
                      ) : (
                        <span>{cat.icon || '📁'}</span>
                      )}
                    </div>
                    <div className="text-xs font-medium text-gray-600 group-hover:text-orange-600 transition-colors line-clamp-2">
                      {lang === 'fr' ? (cat.name_fr || cat.name_en) : (cat.name_en || cat.name)}
                    </div>
                  </Link>
                ))}
            </div>
          </div>
        )}

        {/* Main Content + Sidebar */}
        <div className="flex gap-6">
          <div className="flex-1 min-w-0">

            {/* Search header */}
            {isSearchMode && (
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold text-gray-800">
                    {searching ? t('loading') : `${displayProducts.length} ${lang === 'fr' ? 'résultats pour' : 'results for'} "${searchQuery}"`}
                  </h2>
                  {searching && <RefreshCw className="w-4 h-4 animate-spin text-orange-500" />}
                </div>
                <button onClick={clearSearch} className="text-sm text-gray-500 hover:text-orange-500 flex items-center gap-1">
                  <X className="w-4 h-4" /> {lang === 'fr' ? 'Effacer' : 'Clear'}
                </button>
              </div>
            )}

            {/* Category header with breadcrumb */}
            {selectedCategory && !isSearchMode && (
              <div className="mb-4">
                {/* Breadcrumb */}
                {categoryBreadcrumb.length > 0 && (
                  <div className="flex items-center gap-1 text-xs text-gray-400 mb-2">
                    <Link href="/" className="hover:text-orange-500">{t('home')}</Link>
                    {categoryBreadcrumb.map((cat, idx) => (
                      <span key={cat.id} className="flex items-center gap-1">
                        <ChevronRight className="w-3 h-3" />
                        {idx < categoryBreadcrumb.length - 1 ? (
                          <Link href={`/?category=${cat.slug}`} className="hover:text-orange-500">
                            <CategoryIcon category={cat} size="sm" /> {lang === 'fr' ? (cat.name_fr || cat.name_en) : (cat.name_en || cat.name)}
                          </Link>
                        ) : (
                          <span className="text-gray-600">
                            <CategoryIcon category={cat} size="sm" /> {lang === 'fr' ? (cat.name_fr || cat.name_en) : (cat.name_en || cat.name)}
                          </span>
                        )}
                      </span>
                    ))}
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                    {selectedCategoryData && <CategoryIcon category={selectedCategoryData} size="md" />}
                    {selectedCategoryData ? (lang === 'fr' ? (selectedCategoryData.name_fr || selectedCategoryData.name_en) : (selectedCategoryData.name_en || selectedCategoryData.name)) : selectedCategory}
                  </h2>
                  <Link href="/" className="text-sm text-orange-500 hover:underline">← {t('home')}</Link>
                </div>
              </div>
            )}

            {/* Sort controls */}
            {displayProducts.length > 0 && (
              <div className="flex items-center gap-2 mb-4 flex-wrap">
                <span className="text-xs text-gray-500">{t('sortBy')}:</span>
                {[{ value: 'bestPrice', label: t('sortLowHigh') }, { value: 'priceDesc', label: t('sortHighLow') }, { value: 'recent', label: t('sortRecent') }].map(opt => (
                  <button key={opt.value} onClick={() => setSortBy(opt.value)} className={`text-xs px-3 py-1.5 rounded-full border transition-all ${sortBy === opt.value ? 'bg-orange-500 text-white border-orange-500' : 'bg-white text-gray-600 border-gray-200 hover:border-orange-300'}`}>
                    {opt.label}
                  </button>
                ))}
              </div>
            )}

            {/* Loading */}
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
              <div>
                {!isSearchMode && !selectedCategory && (
                  <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <span>⚡</span> {t('featured')}
                  </h2>
                )}
                <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                  {displayProducts.map((product) => (
                    <ProductCard key={product.id} product={product} t={t} lang={lang} categories={categories} />
                  ))}
                </div>
              </div>
            )}

            {/* Empty state - NO ADMIN BUTTON */}
            {!loading && displayProducts.length === 0 && (
              <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
                <div className="text-6xl mb-4">🔍</div>
                <h3 className="text-lg font-bold text-gray-700 mb-2">
                  {isSearchMode ? `${lang === 'fr' ? 'Aucun résultat pour' : 'No results for'} "${searchQuery}"` : t('noResults')}
                </h3>
                <p className="text-gray-400 text-sm mb-4">
                  {t('tryAgain')}
                </p>
                <Link href="/" className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-5 py-2.5 rounded-lg text-sm font-semibold transition-colors">
                  🏠 {t('home')}
                </Link>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="hidden xl:block w-72 flex-shrink-0">
            <div className="space-y-4">
              <AdBanner height={250} label="Sidebar Ad (300×250)" />
              <AdBanner height={250} label="Sidebar Ad (300×250)" />
              <div className="bg-white rounded-xl border border-gray-100 p-4">
                <h3 className="font-bold text-gray-800 text-sm mb-3 flex items-center gap-1.5">
                  <TrendingDown className="w-4 h-4 text-orange-500" />
                  {t('popularCategories')}
                </h3>
                <ul className="space-y-2">
                  {categories
                    .filter(c => !c.parentId)
                    .sort((a, b) => (a.order || 99) - (b.order || 99))
                    .slice(0, 8)
                    .map(cat => (
                      <li key={cat.id}>
                        <Link href={`/?category=${cat.slug}`} className="flex items-center gap-2 text-sm text-gray-600 hover:text-orange-600 transition-colors">
                          <CategoryIcon category={cat} size="sm" />
                          <span>{lang === 'fr' ? (cat.name_fr || cat.name_en) : (cat.name_en || cat.name)}</span>
                          <ChevronRight className="w-3 h-3 ml-auto text-gray-300" />
                        </Link>
                      </li>
                    ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer t={t} lang={lang} categories={categories} />
      <CookieConsent lang={lang} />
    </div>
  );
}
