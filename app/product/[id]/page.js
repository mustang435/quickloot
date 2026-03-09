'use client';

import { useState, useEffect } from 'react';
import { ArrowLeft, ExternalLink, TrendingDown, Clock, RefreshCw, ShoppingCart, ChevronRight, Zap, TrendingUp, AlertCircle, Check, X, Cpu, Info } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import Link from 'next/link';

// ============================================================
// TRANSLATIONS
// ============================================================
const T = {
  en: {
    back: 'Back',
    home: 'Home',
    bestPrice: 'Best Price',
    goToStore: 'Go to Store',
    compare: 'Compare',
    offers: 'Offers',
    updated: 'Updated',
    priceHistory: 'Price History',
    last30days: 'last 30 days',
    low: 'Low',
    high: 'High',
    storesCompared: 'Stores compared',
    priceRange: 'Price range',
    lastChecked: 'Last checked',
    category: 'Category',
    browseAll: 'Browse all products',
    advertisement: 'Advertisement',
    noPrice: 'No prices available yet',
    noPriceLinks: 'No price links available for this product.',
    addPriceLinks: 'Add price links in admin panel',
    pending: 'Pending',
    view: 'View',
    prosTitle: 'Pros',
    consTitle: 'Cons',
    specsTitle: 'Technical Specifications',
    chartWillAppear: 'Price chart will appear after first update',
    productNotFound: 'Product not found',
    loading: 'Loading product...',
    quickStats: 'Quick Stats',
  },
  fr: {
    back: 'Retour',
    home: 'Accueil',
    bestPrice: 'Meilleur prix',
    goToStore: 'Magasiner',
    compare: 'Comparer',
    offers: 'offres',
    updated: 'Mis à jour',
    priceHistory: 'Historique des prix',
    last30days: '30 derniers jours',
    low: 'Bas',
    high: 'Haut',
    storesCompared: 'Magasins comparés',
    priceRange: 'Gamme de prix',
    lastChecked: 'Dernière vérification',
    category: 'Catégorie',
    browseAll: 'Parcourir tous les produits',
    advertisement: 'Publicité',
    noPrice: 'Aucun prix disponible',
    noPriceLinks: 'Aucun lien de prix pour ce produit.',
    addPriceLinks: 'Ajouter des liens dans le panneau admin',
    pending: 'En attente',
    view: 'Voir',
    prosTitle: 'Avantages',
    consTitle: 'Inconvénients',
    specsTitle: 'Fiche technique',
    chartWillAppear: 'Le graphique apparaîtra après la première mise à jour',
    productNotFound: 'Produit non trouvé',
    loading: 'Chargement...',
    quickStats: 'Statistiques',
  }
};

function useLang() {
  const [lang, setLang] = useState('en');
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('ql_lang') || 'en';
      setLang(saved);
    }
  }, []);
  return { lang, t: T[lang] || T.en };
}

function formatPrice(price, currency = 'CAD', lang = 'en') {
  if (!price) return 'N/A';
  try {
    return new Intl.NumberFormat(lang === 'fr' ? 'fr-CA' : 'en-CA', {
      style: 'currency',
      currency: currency || 'CAD',
      minimumFractionDigits: 2,
    }).format(price);
  } catch {
    return `$${price.toFixed(2)}`;
  }
}

// ============================================================
// STORE LOGO COMPONENT (handles base64 properly)
// ============================================================
function StoreLogo({ store, size = 'md' }) {
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-10 h-10',
  };

  if (!store?.logo) {
    return (
      <div className={`${sizeClasses[size]} rounded-lg bg-gray-100 flex items-center justify-center text-gray-400`}>
        <ShoppingCart className="w-4 h-4" />
      </div>
    );
  }

  // Check if it's a base64 image
  if (store.logo.startsWith('data:image')) {
    return (
      <div className={`${sizeClasses[size]} rounded-lg bg-white border border-gray-100 overflow-hidden flex-shrink-0`}>
        <img
          src={store.logo}
          alt={store.name || 'Store'}
          className="w-full h-full object-contain"
          style={{ objectFit: 'contain' }}
        />
      </div>
    );
  }

  // Check if it's an emoji (short string)
  if (store.logo.length <= 4) {
    return (
      <div className={`${sizeClasses[size]} rounded-lg bg-gray-50 flex items-center justify-center text-lg`}>
        {store.logo}
      </div>
    );
  }

  // It's a URL
  return (
    <div className={`${sizeClasses[size]} rounded-lg bg-white border border-gray-100 overflow-hidden flex-shrink-0`}>
      <img
        src={store.logo}
        alt={store.name || 'Store'}
        className="w-full h-full object-contain"
        onError={(e) => { e.target.style.display = 'none'; }}
      />
    </div>
  );
}

// ============================================================
// PRICE HISTORY CHART
// ============================================================
function PriceHistoryChart({ history, currency, lang, t }) {
  // If only 1 data point, duplicate it to show a line
  let chartData = [];
  
  if (history && history.length > 0) {
    chartData = history.slice(-30).map(h => ({
      date: new Date(h.date).toLocaleDateString(lang === 'fr' ? 'fr-CA' : 'en-CA', { month: 'short', day: 'numeric' }),
      price: h.price,
    }));
    
    // If only 1 point, add a second point with same price
    if (chartData.length === 1) {
      const today = new Date();
      chartData.push({
        date: today.toLocaleDateString(lang === 'fr' ? 'fr-CA' : 'en-CA', { month: 'short', day: 'numeric' }),
        price: chartData[0].price,
      });
    }
  }
  
  if (chartData.length === 0) {
    return (
      <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl h-48 flex items-center justify-center border-2 border-dashed border-gray-200">
        <div className="text-center text-gray-400">
          <TrendingUp className="w-8 h-8 mx-auto mb-2 opacity-30" />
          <p className="text-sm font-medium">{t.priceHistory}</p>
          <p className="text-xs mt-1">{t.chartWillAppear}</p>
        </div>
      </div>
    );
  }

  const prices = chartData.map(d => d.price);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold text-gray-800 flex items-center gap-2">
          <TrendingDown className="w-4 h-4 text-orange-500" />
          {t.priceHistory} <span className="font-normal text-gray-400 text-xs">({t.last30days})</span>
        </h3>
        <div className="flex gap-4 text-xs">
          <span className="text-green-600 font-semibold">{t.low}: {formatPrice(minPrice, currency, lang)}</span>
          <span className="text-red-500 font-semibold">{t.high}: {formatPrice(maxPrice, currency, lang)}</span>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={200}>
        <AreaChart data={chartData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
          <defs>
            <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#f97316" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="date" tick={{ fontSize: 11 }} />
          <YAxis 
            tick={{ fontSize: 11 }} 
            domain={['dataMin - 10', 'dataMax + 10']}
            tickFormatter={(v) => `$${v}`}
          />
          <Tooltip
            formatter={(value) => [formatPrice(value, currency, lang), 'Prix']}
            contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e5e7eb' }}
          />
          <Area type="monotone" dataKey="price" stroke="#f97316" strokeWidth={2} fill="url(#priceGradient)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

// ============================================================
// PROS & CONS COMPONENT (Multi-language support)
// ============================================================
function ProsConsSection({ product, lang, t }) {
  // Get pros/cons based on language
  const pros = lang === 'fr' 
    ? (product.pros_fr?.length > 0 ? product.pros_fr : product.pros_en || product.pros || [])
    : (product.pros_en || product.pros || []);
  
  const cons = lang === 'fr'
    ? (product.cons_fr?.length > 0 ? product.cons_fr : product.cons_en || product.cons || [])
    : (product.cons_en || product.cons || []);

  if ((!pros || pros.length === 0) && (!cons || cons.length === 0)) {
    return null;
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-gray-100">
        {/* Pros */}
        <div className="p-6 bg-green-50/30">
          <h3 className="font-bold text-green-800 mb-4 flex items-center gap-2 text-base">
            <span className="text-xl">✅</span>
            {t.prosTitle}
          </h3>
          {pros && pros.length > 0 ? (
            <ul className="space-y-3">
              {pros.map((pro, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-green-900/80 font-medium">
                  <span className="text-green-500 mt-0.5 font-bold">•</span>
                  <span>{pro}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-green-800/40 text-sm italic">—</p>
          )}
        </div>

        {/* Cons */}
        <div className="p-6 bg-red-50/30">
          <h3 className="font-bold text-red-800 mb-4 flex items-center gap-2 text-base">
            <span className="text-xl">❌</span>
            {t.consTitle}
          </h3>
          {cons && cons.length > 0 ? (
            <ul className="space-y-3">
              {cons.map((con, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-red-900/80 font-medium">
                  <span className="text-red-500 mt-0.5 font-bold">•</span>
                  <span>{con}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-red-800/40 text-sm italic">—</p>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// TECHNICAL SPECIFICATIONS TABLE
// ============================================================
function SpecsTable({ specs, t }) {
  if (!specs || Object.keys(specs).length === 0) {
    return null;
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="p-5 border-b border-gray-50">
        <h3 className="font-bold text-gray-800 flex items-center gap-2">
          <Cpu className="w-5 h-5 text-orange-500" />
          {t.specsTitle}
        </h3>
      </div>
      <div className="divide-y divide-gray-50">
        {Object.entries(specs).map(([key, value], i) => (
          <div key={i} className={`flex ${i % 2 === 0 ? 'bg-gray-50/50' : 'bg-white'}`}>
            <div className="w-1/3 px-5 py-3 text-sm text-gray-500 font-medium">
              {key}
            </div>
            <div className="flex-1 px-5 py-3 text-sm text-gray-800">
              {value}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================
// MAIN PRODUCT PAGE
// ============================================================
export default function ProductPage({ params }) {
  const id = params.id;
  const { lang, t } = useLang();
  const [product, setProduct] = useState(null);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadData() {
      try {
        const [productRes, categoriesRes] = await Promise.all([
          fetch(`/api/products/${id}`),
          fetch('/api/categories')
        ]);
        
        if (!productRes.ok) throw new Error('Product not found');
        
        const productData = await productRes.json();
        const categoriesData = categoriesRes.ok ? await categoriesRes.json() : [];
        
        setProduct(productData);
        setCategories(categoriesData);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin text-orange-500 mx-auto mb-3" />
          <p className="text-gray-500">{t.loading}</p>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-3" />
          <h2 className="text-xl font-bold text-gray-700 mb-2">{t.productNotFound}</h2>
          <Link href="/" className="text-orange-500 hover:underline text-sm">← {t.back}</Link>
        </div>
      </div>
    );
  }

  const priceLinks = product.priceLinks || [];
  const sortedLinks = [...priceLinks].sort((a, b) => (a.currentPrice || Infinity) - (b.currentPrice || Infinity));
  const bestLink = sortedLinks[0];
  
  // Find category from database (user-created categories override defaults)
  const category = categories.find(c => c.slug === product.category || c.id === product.category);
  
  // Build category breadcrumb (handle nested categories)
  const getCategoryBreadcrumb = () => {
    if (!category) return null;
    const breadcrumb = [category];
    let parent = category.parentId ? categories.find(c => c.id === category.parentId) : null;
    while (parent) {
      breadcrumb.unshift(parent);
      parent = parent.parentId ? categories.find(c => c.id === parent.parentId) : null;
    }
    return breadcrumb;
  };
  const categoryBreadcrumb = getCategoryBreadcrumb();

  // Get combined price history from all links
  const allHistory = priceLinks.flatMap(l => l.priceHistory || []).sort((a, b) => new Date(a.date) - new Date(b.date));
  const bestCurrency = bestLink?.currency || 'CAD';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-1.5 text-gray-500 hover:text-orange-500 transition-colors text-sm">
              <ArrowLeft className="w-4 h-4" /> {t.back}
            </Link>
            <div className="h-4 w-px bg-gray-200 hidden sm:block" />
            <Link href="/" className="flex items-center gap-1.5 hidden sm:flex">
              <div className="bg-gradient-to-br from-orange-500 to-amber-500 text-white w-6 h-6 rounded-md flex items-center justify-center">
                <Zap className="w-3.5 h-3.5" />
              </div>
              <span className="font-black text-sm text-gray-700">Quick<span className="text-orange-500">Loot</span>.net</span>
            </Link>
          </div>
          {/* Breadcrumb with nested categories */}
          <nav className="hidden md:flex items-center gap-1 text-xs text-gray-400">
            <Link href="/" className="hover:text-orange-500">{t.home}</Link>
            {categoryBreadcrumb && categoryBreadcrumb.map((cat, idx) => (
              <span key={cat.id} className="flex items-center gap-1">
                <ChevronRight className="w-3 h-3" />
                <Link href={`/?category=${cat.slug}`} className="hover:text-orange-500">
                  {cat.icon} {lang === 'fr' ? (cat.name_fr || cat.name_en || cat.name) : (cat.name_en || cat.name)}
                </Link>
              </span>
            ))}
            <ChevronRight className="w-3 h-3" />
            <span className="text-gray-600 truncate max-w-48">{product.name}</span>
          </nav>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Left: Product Info */}
          <div className="lg:col-span-2 space-y-6">

            {/* Product Header Card */}
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
              <div className="flex flex-col sm:flex-row gap-0">
                {/* Image */}
                <div className="sm:w-64 bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-8 min-h-48">
                  {product.image ? (
                    <img
                      src={product.image}
                      alt={product.name}
                      className="max-h-48 max-w-full object-contain"
                      onError={(e) => { e.target.style.display = 'none'; }}
                    />
                  ) : (
                    <div className="text-8xl opacity-20">{category?.icon || '📦'}</div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 p-6">
                  {product.brand && (
                    <div className="text-xs text-orange-500 font-bold uppercase tracking-widest mb-1">{product.brand}</div>
                  )}
                  <h1 className="text-xl font-black text-gray-800 mb-3 leading-tight">{product.name}</h1>
                  {product.description && (
                    <p className="text-sm text-gray-500 mb-4 leading-relaxed">{product.description}</p>
                  )}

                  {/* Best Price */}
                  {bestLink?.currentPrice ? (
                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4 border border-green-100">
                      <div className="flex items-center justify-between flex-wrap gap-3">
                        <div>
                          <div className="text-xs text-green-600 font-semibold uppercase tracking-wide mb-1">
                            {t.bestPrice}
                          </div>
                          <div className="text-3xl font-black text-green-700">
                            {formatPrice(bestLink.currentPrice, bestLink.currency, lang)}
                          </div>
                          {bestLink.store && (
                            <div className="text-xs text-gray-500 mt-1 flex items-center gap-2">
                              <StoreLogo store={bestLink.store} size="sm" />
                              <span>{bestLink.store.name}</span>
                            </div>
                          )}
                        </div>
                        <a
                          href={bestLink.affiliateUrl || bestLink.url}
                          target="_blank"
                          rel="noopener noreferrer sponsored"
                          className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-5 py-3 rounded-xl font-bold text-sm transition-colors shadow-md whitespace-nowrap"
                        >
                          <ShoppingCart className="w-4 h-4" />
                          {t.goToStore}
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-gray-50 rounded-xl p-4 border border-gray-200 text-center text-gray-400 text-sm">
                      {t.noPrice}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Pros & Cons */}
            <ProsConsSection product={product} lang={lang} t={t} />

            {/* Technical Specifications */}
            <SpecsTable specs={product.specs} t={t} />

            {/* Price Comparison Table */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="p-5 border-b border-gray-50">
                <h2 className="font-bold text-gray-800 flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5 text-orange-500" />
                  {t.compare} {priceLinks.length} {t.offers}
                </h2>
              </div>

              {sortedLinks.length === 0 ? (
                <div className="p-8 text-center text-gray-400">
                  <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">{t.noPriceLinks}</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-50">
                  {sortedLinks.map((link, index) => {
                    const isBest = index === 0 && link.currentPrice;
                    return (
                      <div key={link.id} className={`p-4 flex items-center gap-4 hover:bg-gray-50 transition-colors ${isBest ? 'bg-green-50/50' : ''}`}>
                        {/* Rank */}
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0 ${
                          isBest ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-500'
                        }`}>
                          {isBest ? '🏆' : index + 1}
                        </div>

                        {/* Store Logo */}
                        <StoreLogo store={link.store} size="md" />

                        {/* Store Name */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-sm text-gray-700">
                              {link.store?.name || link.storeName || 'Store'}
                            </span>
                            {isBest && (
                              <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-semibold whitespace-nowrap">
                                {t.bestPrice}
                              </span>
                            )}
                          </div>
                          {link.lastUpdated && (
                            <div className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {t.updated}: {new Date(link.lastUpdated).toLocaleDateString(lang === 'fr' ? 'fr-CA' : 'en-CA')}
                            </div>
                          )}
                        </div>

                        {/* Price */}
                        <div className="text-right flex-shrink-0">
                          {link.currentPrice ? (
                            <div className={`text-lg font-black ${isBest ? 'text-green-600' : 'text-gray-700'}`}>
                              {formatPrice(link.currentPrice, link.currency, lang)}
                            </div>
                          ) : (
                            <div className="text-sm text-gray-400">
                              {link.scrapeStatus === 'pending' ? `⏳ ${t.pending}` : '—'}
                            </div>
                          )}
                        </div>

                        {/* Go to store button */}
                        <a
                          href={link.affiliateUrl || link.url}
                          target="_blank"
                          rel="noopener noreferrer sponsored"
                          className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-colors flex-shrink-0 ${
                            isBest
                              ? 'bg-orange-500 hover:bg-orange-600 text-white shadow-sm'
                              : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                          }`}
                        >
                          {t.view}
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Price History Chart */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <PriceHistoryChart history={allHistory} currency={bestCurrency} lang={lang} t={t} />
            </div>
          </div>

          {/* Right: Sidebar */}
          <div className="space-y-4">
            {/* Quick Stats */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <h3 className="font-bold text-gray-800 mb-4 text-sm">{t.quickStats}</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-500">{t.storesCompared}</span>
                  <span className="font-bold text-sm text-gray-800">{priceLinks.length}</span>
                </div>
                {product.bestPrice && (
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-500">{t.bestPrice}</span>
                    <span className="font-bold text-sm text-green-600">{formatPrice(product.bestPrice, bestCurrency, lang)}</span>
                  </div>
                )}
                {sortedLinks.length > 1 && sortedLinks[0].currentPrice && sortedLinks[sortedLinks.length-1].currentPrice && (
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-500">{t.priceRange}</span>
                    <span className="font-bold text-sm text-gray-700">
                      {formatPrice(sortedLinks[0].currentPrice, bestCurrency, lang)} — {formatPrice(sortedLinks[sortedLinks.length-1].currentPrice, bestCurrency, lang)}
                    </span>
                  </div>
                )}
                {product.bestPriceUpdated && (
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-500">{t.lastChecked}</span>
                    <span className="text-xs text-gray-600">{new Date(product.bestPriceUpdated).toLocaleDateString(lang === 'fr' ? 'fr-CA' : 'en-CA')}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Ad Placeholder */}
            <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl border-2 border-dashed border-gray-200 h-64 flex items-center justify-center">
              <div className="text-center text-gray-400">
                <div className="text-sm font-medium mb-1">📢 {t.advertisement}</div>
                <div className="text-xs">300×250</div>
              </div>
            </div>

            {/* Category (with nested support) */}
            {category && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                <h3 className="font-bold text-gray-800 mb-3 text-sm">{t.category}</h3>
                {categoryBreadcrumb?.length > 0 && (
                  <div className="flex flex-col gap-2">
                    {categoryBreadcrumb.map((cat, idx) => {
                      if (!cat || (!cat.slug && !cat.id)) return null; // SAFEGUARD
                      const catSlug = cat.slug || cat.id || '';
                      const stableKey = cat.id || cat._id || cat.slug || `bc-${idx}`;
                      
                      return (
                        <div key={stableKey} className="flex relative" style={{ paddingLeft: `${idx * 12}px` }}>
                          {/* Tree line visual effect for children */}
                          {idx > 0 && (
                            <div className="absolute left-[calc(-12px+8px)] top-0 bottom-0 w-px bg-orange-200" style={{ left: `${(idx - 1) * 12 + 10}px`, bottom: '50%' }} />
                          )}
                          {idx > 0 && (
                            <div className="absolute top-1/2 w-3 h-px bg-orange-200" style={{ left: `${(idx - 1) * 12 + 10}px` }} />
                          )}
                          
                          <Link
                            href={catSlug ? `/?category=${catSlug}` : '/'}
                            className={`flex items-center gap-2 px-3 py-2 w-full rounded-lg transition-colors ${
                              idx === categoryBreadcrumb.length - 1 
                                ? 'bg-orange-50 hover:bg-orange-100 border border-orange-100' 
                                : 'hover:bg-gray-50 text-gray-600'
                            }`}
                          >
                            <span className={`${idx === categoryBreadcrumb.length - 1 ? 'text-xl' : 'text-base'}`}>{cat.icon || '📦'}</span>
                            <div className="flex-1 min-w-0">
                              <div className={`text-sm truncate ${idx === categoryBreadcrumb.length - 1 ? 'font-semibold text-orange-700' : 'font-medium'}`}>
                                {lang === 'fr' ? (cat.name_fr || cat.name_en || cat.name || 'Category') : (cat.name_en || cat.name || 'Category')}
                              </div>
                              {idx === categoryBreadcrumb.length - 1 && (
                                <div className="text-xs text-orange-500 mt-0.5">{t.browseAll} →</div>
                              )}
                            </div>
                          </Link>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-100 py-6 mt-8">
        <div className="max-w-6xl mx-auto px-4 text-center text-xs text-gray-400">
          © 2025 QuickLoot.net — {lang === 'fr' ? 'Prix mis à jour automatiquement toutes les 3 heures.' : 'Prices updated automatically every 3 hours.'} 
        </div>
      </footer>
    </div>
  );
}
