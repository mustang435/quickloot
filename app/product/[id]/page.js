'use client';

import { useState, useEffect } from 'react';
import { ArrowLeft, ExternalLink, TrendingDown, Clock, RefreshCw, ShoppingCart, ChevronRight, Zap, TrendingUp, AlertCircle } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { CATEGORIES } from '@/lib/translations';
import Link from 'next/link';

function useLang() {
  const [lang, setLang] = useState('en');
  useEffect(() => {
    const saved = localStorage.getItem('ql_lang') || 'en';
    setLang(saved);
  }, []);
  return { lang };
}

function formatPrice(price, currency = 'EUR', lang = 'en') {
  if (!price) return 'N/A';
  try {
    return new Intl.NumberFormat(lang === 'fr' ? 'fr-FR' : 'en-GB', {
      style: 'currency',
      currency: currency || 'EUR',
      minimumFractionDigits: 2,
    }).format(price);
  } catch {
    return `${currency} ${price.toFixed(2)}`;
  }
}

function PriceHistoryChart({ history, currency }) {
  if (!history || history.length < 2) {
    return (
      <div className="bg-gray-50 rounded-xl h-48 flex items-center justify-center border-2 border-dashed border-gray-200">
        <div className="text-center text-gray-400">
          <TrendingUp className="w-8 h-8 mx-auto mb-2 opacity-30" />
          <p className="text-sm font-medium">Price History</p>
          <p className="text-xs mt-1">Chart will appear after first scrape</p>
        </div>
      </div>
    );
  }

  const data = history.slice(-30).map(h => ({
    date: new Date(h.date).toLocaleDateString('en-GB', { month: 'short', day: 'numeric' }),
    price: h.price,
  }));

  const minPrice = Math.min(...data.map(d => d.price));
  const maxPrice = Math.max(...data.map(d => d.price));

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold text-gray-800 flex items-center gap-2">
          <TrendingDown className="w-4 h-4 text-orange-500" />
          Price History (last 30 days)
        </h3>
        <div className="flex gap-4 text-xs">
          <span className="text-green-600 font-semibold">Low: {formatPrice(minPrice, currency)}</span>
          <span className="text-red-500 font-semibold">High: {formatPrice(maxPrice, currency)}</span>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={data} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="date" tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 11 }} domain={['auto', 'auto']} />
          <Tooltip
            formatter={(value) => [formatPrice(value, currency), 'Price']}
            contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e5e7eb' }}
          />
          <Line type="monotone" dataKey="price" stroke="#f97316" strokeWidth={2} dot={{ r: 3, fill: '#f97316' }} activeDot={{ r: 5 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export default function ProductPage({ params }) {
  const id = params.id;
  const { lang } = useLang();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadProduct() {
      try {
        const res = await fetch(`/api/products/${id}`);
        if (!res.ok) throw new Error('Product not found');
        const data = await res.json();
        setProduct(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    loadProduct();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin text-orange-500 mx-auto mb-3" />
          <p className="text-gray-500">Loading product...</p>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-3" />
          <h2 className="text-xl font-bold text-gray-700 mb-2">Product not found</h2>
          <Link href="/" className="text-orange-500 hover:underline text-sm">← Back to homepage</Link>
        </div>
      </div>
    );
  }

  const priceLinks = product.priceLinks || [];
  const sortedLinks = [...priceLinks].sort((a, b) => (a.currentPrice || Infinity) - (b.currentPrice || Infinity));
  const bestLink = sortedLinks[0];
  const category = CATEGORIES.find(c => c.slug === product.category);

  // Get combined price history from all links
  const allHistory = priceLinks.flatMap(l => l.priceHistory || []).sort((a, b) => new Date(a.date) - new Date(b.date));
  const bestCurrency = bestLink?.currency || 'EUR';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-1.5 text-gray-500 hover:text-orange-500 transition-colors text-sm">
              <ArrowLeft className="w-4 h-4" /> Back
            </Link>
            <div className="h-4 w-px bg-gray-200 hidden sm:block" />
            <Link href="/" className="flex items-center gap-1.5 hidden sm:flex">
              <div className="bg-gradient-to-br from-orange-500 to-amber-500 text-white w-6 h-6 rounded-md flex items-center justify-center">
                <Zap className="w-3.5 h-3.5" />
              </div>
              <span className="font-black text-sm text-gray-700">Quick<span className="text-orange-500">Loot</span>.net</span>
            </Link>
          </div>
          {/* Breadcrumb */}
          <nav className="hidden md:flex items-center gap-1 text-xs text-gray-400">
            <Link href="/" className="hover:text-orange-500">Home</Link>
            <ChevronRight className="w-3 h-3" />
            {category && (
              <>
                <Link href={`/?category=${category.slug}`} className="hover:text-orange-500">
                  {lang === 'fr' ? category.fr : category.en}
                </Link>
                <ChevronRight className="w-3 h-3" />
              </>
            )}
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
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-xs text-green-600 font-semibold uppercase tracking-wide mb-1">
                            {lang === 'fr' ? 'Meilleur prix' : 'Best Price'}
                          </div>
                          <div className="text-3xl font-black text-green-700">
                            {formatPrice(bestLink.currentPrice, bestLink.currency, lang)}
                          </div>
                          {bestLink.store && (
                            <div className="text-xs text-gray-500 mt-1">
                              {bestLink.store.logo} {bestLink.store.name}
                            </div>
                          )}
                        </div>
                        <a
                          href={bestLink.affiliateUrl || bestLink.url}
                          target="_blank"
                          rel="noopener noreferrer sponsored"
                          className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-5 py-3 rounded-xl font-bold text-sm transition-colors shadow-md"
                        >
                          <ShoppingCart className="w-4 h-4" />
                          {lang === 'fr' ? 'Aller au magasin' : 'Go to Store'}
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-gray-50 rounded-xl p-4 border border-gray-200 text-center text-gray-400 text-sm">
                      No prices available yet
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Price Comparison Table */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="p-5 border-b border-gray-50">
                <h2 className="font-bold text-gray-800 flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5 text-orange-500" />
                  {lang === 'fr' ? `Comparer ${priceLinks.length} offres` : `Compare ${priceLinks.length} Offers`}
                </h2>
              </div>

              {sortedLinks.length === 0 ? (
                <div className="p-8 text-center text-gray-400">
                  <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">No price links available for this product.</p>
                  <Link href="/admin" className="text-orange-500 hover:underline text-xs mt-2 block">Add price links in admin panel →</Link>
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

                        {/* Store */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-sm text-gray-700">
                              {link.store?.logo} {link.store?.name || link.storeName || 'Store'}
                            </span>
                            {isBest && (
                              <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-semibold">
                                {lang === 'fr' ? 'Meilleur prix' : 'Best Price'}
                              </span>
                            )}
                          </div>
                          {link.lastUpdated && (
                            <div className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {lang === 'fr' ? 'Mis à jour' : 'Updated'}: {new Date(link.lastUpdated).toLocaleDateString()}
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
                              {link.scrapeStatus === 'pending' ? '⏳ Pending' : '—'}
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
                          {lang === 'fr' ? 'Voir' : 'View'}
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
              <PriceHistoryChart history={allHistory} currency={bestCurrency} />
            </div>
          </div>

          {/* Right: Sidebar */}
          <div className="space-y-4">
            {/* Quick Stats */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <h3 className="font-bold text-gray-800 mb-4 text-sm">Quick Stats</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-500">Stores compared</span>
                  <span className="font-bold text-sm text-gray-800">{priceLinks.length}</span>
                </div>
                {product.bestPrice && (
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-500">Best price</span>
                    <span className="font-bold text-sm text-green-600">{formatPrice(product.bestPrice, bestCurrency, lang)}</span>
                  </div>
                )}
                {sortedLinks.length > 1 && sortedLinks[0].currentPrice && sortedLinks[sortedLinks.length-1].currentPrice && (
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-500">Price range</span>
                    <span className="font-bold text-sm text-gray-700">
                      {formatPrice(sortedLinks[0].currentPrice, bestCurrency, lang)} — {formatPrice(sortedLinks[sortedLinks.length-1].currentPrice, bestCurrency, lang)}
                    </span>
                  </div>
                )}
                {product.bestPriceUpdated && (
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-500">Last checked</span>
                    <span className="text-xs text-gray-600">{new Date(product.bestPriceUpdated).toLocaleDateString()}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Ad Placeholder */}
            <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl border-2 border-dashed border-gray-200 h-64 flex items-center justify-center">
              <div className="text-center text-gray-400">
                <div className="text-sm font-medium mb-1">📢 Advertisement</div>
                <div className="text-xs">300×250</div>
              </div>
            </div>

            {/* Category */}
            {category && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <h3 className="font-bold text-gray-800 mb-3 text-sm">Category</h3>
                <Link
                  href={`/?category=${category.slug}`}
                  className="flex items-center gap-3 p-3 bg-orange-50 rounded-xl hover:bg-orange-100 transition-colors"
                >
                  <span className="text-2xl">{category.icon}</span>
                  <div>
                    <div className="font-semibold text-sm text-orange-700">{lang === 'fr' ? category.fr : category.en}</div>
                    <div className="text-xs text-orange-500">Browse all products →</div>
                  </div>
                </Link>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-100 py-6 mt-8">
        <div className="max-w-6xl mx-auto px-4 text-center text-xs text-gray-400">
          © 2025 QuickLoot.net — Prices updated automatically every 3 hours. Affiliate links may be used.
        </div>
      </footer>
    </div>
  );
}
