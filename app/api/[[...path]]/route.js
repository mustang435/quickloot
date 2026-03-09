import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';
import { scrapePrice, scrapeAllPriceLinks } from '@/lib/scraper';
import { CATEGORIES, DEFAULT_STORES } from '@/lib/translations';
import {
  signAdminToken,
  verifyAdminToken,
  verifyAdminPassword,
  extractToken,
  checkRateLimit,
  checkBruteForce,
  recordFailedAttempt,
  clearLoginAttempts,
  getClientIp,
  sanitizeObject,
} from '@/lib/auth';

// ============================================================
// CRON JOB - Local development only (Vercel uses /api/cron)
// ============================================================
let cronInitialized = false;
let lastCronRun = null;
let cronRunning = false;

async function initializeCron() {
  // Skip in production - Vercel Cron handles this via /api/cron
  if (process.env.VERCEL || cronInitialized) return;
  cronInitialized = true;
  
  try {
    const { default: cron } = await import('node-cron');
    cron.schedule('0 */3 * * *', async () => {
      if (cronRunning) return;
      console.log('[Cron] Starting scheduled price update...');
      cronRunning = true;
      try {
        const db = await getDb();
        const results = await scrapeAllPriceLinks(db);
        lastCronRun = new Date().toISOString();
        console.log(`[Cron] Done. Updated ${results.filter(r => r.success).length}/${results.length}`);
      } catch (err) {
        console.error('[Cron] Error:', err.message);
      } finally {
        cronRunning = false;
      }
    });
    console.log('[Cron] Initialized - runs every 3 hours (local dev)');
  } catch (err) {
    console.error('[Cron] Failed:', err.message);
  }
}

if (typeof window === 'undefined') initializeCron();

// ============================================================
// SECURITY HEADERS
// ============================================================
function securityHeaders() {
  return {
    'Access-Control-Allow-Origin': process.env.CORS_ORIGINS || '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  };
}

// ============================================================
// RATE LIMITING
// ============================================================
function applyRateLimit(request, isLoginRoute = false) {
  const ip = getClientIp(request);
  const limit = isLoginRoute ? 5 : 200;
  const windowMs = 15 * 60 * 1000; // 15 minutes
  const result = checkRateLimit(`${ip}:${isLoginRoute ? 'login' : 'api'}`, limit, windowMs);

  if (!result.allowed) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      {
        status: 429,
        headers: {
          ...securityHeaders(),
          'Retry-After': String(result.retryAfter || 60),
          'X-RateLimit-Limit': String(limit),
          'X-RateLimit-Remaining': '0',
        },
      }
    );
  }
  return null; // allowed
}

// ============================================================
// ADMIN AUTH MIDDLEWARE
// ============================================================
const PUBLIC_GET_ROUTES = ['products', 'categories', 'stores', 'search', 'featured', 'stats', 'price-links'];
const ADMIN_REQUIRED_METHODS = ['POST', 'PUT', 'DELETE'];
const ADMIN_REQUIRED_PATHS = ['products', 'stores', 'price-links', 'categories', 'scrape', 'seed'];

function requiresAdminAuth(method, pathSegments) {
  if (method === 'OPTIONS') return false;
  if (pathSegments[0] === 'admin') return false; // login route itself
  if (method === 'GET' && PUBLIC_GET_ROUTES.includes(pathSegments[0])) return false;
  if (ADMIN_REQUIRED_METHODS.includes(method) && ADMIN_REQUIRED_PATHS.includes(pathSegments[0])) return true;
  return false;
}

function checkAdminAuth(request) {
  const token = extractToken(request);
  const payload = verifyAdminToken(token);
  return payload !== null;
}

// ============================================================
// SAFE ERROR RESPONSE (never expose internals)
// ============================================================
function safeError(message = 'An error occurred', status = 500) {
  // Only log real error internally, send generic message to client
  return NextResponse.json(
    { error: message },
    { status, headers: securityHeaders() }
  );
}

// ============================================================
// ROUTE HANDLERS
// ============================================================
export async function GET(request, { params }) {
  const path = params?.path || [];

  // Rate limiting
  const rateLimitError = applyRateLimit(request);
  if (rateLimitError) return rateLimitError;

  try {
    const db = await getDb();
    const url = new URL(request.url);
    const searchParams = url.searchParams;

    // GET /api/categories
    if (path[0] === 'categories') {
      const categories = await db.collection('categories').find({}).sort({ order: 1 }).toArray();
      return NextResponse.json(categories, { headers: securityHeaders() });
    }

    // GET /api/stores
    if (path[0] === 'stores') {
      if (path[1]) {
        const store = await db.collection('stores').findOne({ id: path[1] });
        if (!store) return safeError('Store not found', 404);
        return NextResponse.json(store, { headers: securityHeaders() });
      }
      const stores = await db.collection('stores').find({}).sort({ name: 1 }).toArray();
      return NextResponse.json(stores, { headers: securityHeaders() });
    }

    // GET /api/products
    if (path[0] === 'products') {
      if (path[1]) {
        const product = await db.collection('products').findOne({ id: path[1] });
        if (!product) return safeError('Product not found', 404);

        const priceLinks = await db.collection('priceLinks')
          .find({ productId: path[1], active: true })
          .sort({ currentPrice: 1 })
          .toArray();

        const storeIds = [...new Set(priceLinks.map(l => l.storeId).filter(Boolean))];
        const stores = await db.collection('stores').find({ id: { $in: storeIds } }).toArray();
        const storesMap = {};
        stores.forEach(s => storesMap[s.id] = s);

        return NextResponse.json(
          { ...product, priceLinks: priceLinks.map(l => ({ ...l, store: storesMap[l.storeId] || null })) },
          { headers: securityHeaders() }
        );
      }

      const category = searchParams.get('category');
      const featured = searchParams.get('featured');
      const sort = searchParams.get('sort') || 'bestPrice';
      const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);
      const skip = Math.max(parseInt(searchParams.get('skip') || '0'), 0);

      let query = {};
      if (category) query.category = category;
      if (featured === 'true') query.featured = true;

      let sortObj = {};
      if (sort === 'bestPrice') sortObj = { bestPrice: 1 };
      else if (sort === 'priceDesc') sortObj = { bestPrice: -1 };
      else sortObj = { createdAt: -1 };

      const products = await db.collection('products').find(query).sort(sortObj).skip(skip).limit(limit).toArray();
      const total = await db.collection('products').countDocuments(query);
      return NextResponse.json({ products, total }, { headers: securityHeaders() });
    }

    // GET /api/price-links
    if (path[0] === 'price-links') {
      const productId = searchParams.get('productId');
      let query = {};
      if (productId) query.productId = productId;
      const links = await db.collection('priceLinks').find(query).sort({ currentPrice: 1 }).toArray();
      return NextResponse.json(links, { headers: securityHeaders() });
    }

    // GET /api/search
    if (path[0] === 'search') {
      const q = (searchParams.get('q') || '').substring(0, 200).trim();
      const category = searchParams.get('category') || '';
      const sort = searchParams.get('sort') || 'bestPrice';
      const limit = Math.min(parseInt(searchParams.get('limit') || '30'), 50);

      if (!q) return NextResponse.json({ products: [], total: 0 }, { headers: securityHeaders() });

      let query = {
        $or: [
          { name: { $regex: q, $options: 'i' } },
          { brand: { $regex: q, $options: 'i' } },
          { description: { $regex: q, $options: 'i' } },
          { tags: { $in: [new RegExp(q, 'i')] } },
        ],
      };
      if (category) query.category = category;

      let sortObj = sort === 'bestPrice' ? { bestPrice: 1 } : sort === 'priceDesc' ? { bestPrice: -1 } : { createdAt: -1 };

      const products = await db.collection('products').find(query).sort(sortObj).limit(limit).toArray();
      const total = await db.collection('products').countDocuments(query);
      return NextResponse.json({ products, total }, { headers: securityHeaders() });
    }

    // GET /api/scrape/status  (admin protected)
    if (path[0] === 'scrape' && path[1] === 'status') {
      if (!checkAdminAuth(request)) return safeError('Unauthorized', 401);

      const totalLinks = await db.collection('priceLinks').countDocuments({ active: true });
      const successLinks = await db.collection('priceLinks').countDocuments({ active: true, scrapeStatus: 'success' });
      const failedLinks = await db.collection('priceLinks').countDocuments({ active: true, scrapeStatus: { $in: ['failed', 'pending', null] } });

      return NextResponse.json({
        cronRunning, 
        lastCronRun, 
        cronInitialized, 
        totalLinks,
        successLinks,
        failedLinks,
      }, { headers: securityHeaders() });
    }

    // GET /api/featured
    if (path[0] === 'featured') {
      const products = await db.collection('products').find({ featured: true }).sort({ bestPrice: 1 }).limit(8).toArray();
      return NextResponse.json(products, { headers: securityHeaders() });
    }

    // GET /api/stats
    if (path[0] === 'stats') {
      const totalProducts = await db.collection('products').countDocuments();
      const totalStores = await db.collection('stores').countDocuments();
      const totalLinks = await db.collection('priceLinks').countDocuments({ active: true });
      return NextResponse.json({ totalProducts, totalStores, totalLinks }, { headers: securityHeaders() });
    }

    return safeError('Not found', 404);
  } catch (err) {
    console.error('[API GET Error]', err);
    return safeError('An error occurred', 500);
  }
}

export async function POST(request, { params }) {
  const path = params?.path || [];

  // Rate limiting (stricter for login)
  const isLoginRoute = path[0] === 'admin' && path[1] === 'login';
  const rateLimitError = applyRateLimit(request, isLoginRoute);
  if (rateLimitError) return rateLimitError;

  // ============================================================
  // POST /api/admin/login - PUBLIC (no auth required)
  // ============================================================
  if (path[0] === 'admin' && path[1] === 'login') {
    try {
      const db = await getDb();
      const ip = getClientIp(request);
      let body = {};
      try { body = await request.json(); } catch (e) {}

      // Check brute force
      const bruteCheck = await checkBruteForce(db, ip);
      if (bruteCheck.blocked) {
        return NextResponse.json(
          { error: bruteCheck.message },
          { status: 429, headers: securityHeaders() }
        );
      }

      // Verify password
      const { password } = body;
      if (!password) {
        return NextResponse.json({ error: 'Password required' }, { status: 400, headers: securityHeaders() });
      }

      const isValid = await verifyAdminPassword(password);

      if (!isValid) {
        const result = await recordFailedAttempt(db, ip);
        const remaining = Math.max(0, 3 - result.attempts);

        if (result.locked) {
          return NextResponse.json(
            { error: 'Account temporarily locked for 15 minutes due to too many failed attempts.' },
            { status: 429, headers: securityHeaders() }
          );
        }

        return NextResponse.json(
          { error: `Invalid password. ${remaining} attempt(s) remaining before lockout.` },
          { status: 401, headers: securityHeaders() }
        );
      }

      // Success - clear attempts and issue token
      await clearLoginAttempts(db, ip);
      const token = signAdminToken();

      return NextResponse.json(
        { token, message: 'Login successful' },
        { status: 200, headers: securityHeaders() }
      );
    } catch (err) {
      console.error('[Login Error]', err);
      return safeError('An error occurred', 500);
    }
  }

  // ============================================================
  // ALL OTHER POST ROUTES REQUIRE ADMIN AUTH
  // ============================================================
  if (requiresAdminAuth('POST', path)) {
    if (!checkAdminAuth(request)) {
      return safeError('Unauthorized - Admin access required', 401);
    }
  }

  try {
    const db = await getDb();
    let body = {};
    try { body = await request.json(); } catch (e) {}
    body = sanitizeObject(body);

    // POST /api/categories
    if (path[0] === 'categories') {
      const cat = {
        id: uuidv4(),
        name_en: body.name_en || body.en || '',
        name_fr: body.name_fr || body.fr || '',
        slug: (body.slug || '').toLowerCase().replace(/[^a-z0-9-]/g, '-'),
        icon: body.icon || '📦',
        image: body.image || '', // Category image (base64 or URL)
        order: parseInt(body.order) || 99,
        parentId: body.parentId || null,
        createdAt: new Date().toISOString(),
      };
      await db.collection('categories').insertOne(cat);
      return NextResponse.json(cat, { status: 201, headers: securityHeaders() });
    }

    // POST /api/stores
    if (path[0] === 'stores') {
      const store = {
        id: uuidv4(),
        name: body.name || '',
        domain: body.domain || '',
        logo: body.logo || '🏪',
        color: body.color || '#666666',
        country: body.country || 'Global',
        scrapingConfig: body.scrapingConfig || null,
        active: true,
        createdAt: new Date().toISOString(),
      };
      await db.collection('stores').insertOne(store);
      return NextResponse.json(store, { status: 201, headers: securityHeaders() });
    }

    // POST /api/products
    if (path[0] === 'products') {
      if (!body.name?.trim()) return safeError('Product name is required', 400);
      const product = {
        id: uuidv4(),
        name: body.name.trim(),
        slug: (body.slug || body.name).toLowerCase().replace(/[^a-z0-9]+/g, '-').substring(0, 200),
        description: (body.description || '').substring(0, 5000),
        category: body.category || 'electronics',
        brand: (body.brand || '').substring(0, 100),
        image: (body.image || '').substring(0, 500),
        tags: Array.isArray(body.tags) ? body.tags.slice(0, 20) : [],
        featured: !!body.featured,
        // Multi-language Pros & Cons
        pros_en: Array.isArray(body.pros_en) ? body.pros_en.slice(0, 20) : (Array.isArray(body.pros) ? body.pros.slice(0, 20) : []),
        cons_en: Array.isArray(body.cons_en) ? body.cons_en.slice(0, 20) : (Array.isArray(body.cons) ? body.cons.slice(0, 20) : []),
        pros_fr: Array.isArray(body.pros_fr) ? body.pros_fr.slice(0, 20) : [],
        cons_fr: Array.isArray(body.cons_fr) ? body.cons_fr.slice(0, 20) : [],
        // Legacy fields for backward compatibility
        pros: Array.isArray(body.pros_en) ? body.pros_en.slice(0, 20) : (Array.isArray(body.pros) ? body.pros.slice(0, 20) : []),
        cons: Array.isArray(body.cons_en) ? body.cons_en.slice(0, 20) : (Array.isArray(body.cons) ? body.cons.slice(0, 20) : []),
        specs: body.specs || null,
        bestPrice: body.bestPrice ? parseFloat(body.bestPrice) : null,
        bestPriceUpdated: body.bestPrice ? new Date().toISOString() : null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      await db.collection('products').insertOne(product);
      return NextResponse.json(product, { status: 201, headers: securityHeaders() });
    }

    // POST /api/price-links
    if (path[0] === 'price-links') {
      if (!body.url?.trim() || !body.productId?.trim()) return safeError('URL and productId are required', 400);
      const link = {
        id: uuidv4(),
        productId: body.productId,
        storeId: body.storeId || null,
        storeName: body.storeName || '',
        url: body.url.trim().substring(0, 2000),
        affiliateUrl: (body.affiliateUrl || body.url).trim().substring(0, 2000),
        currentPrice: body.currentPrice ? parseFloat(body.currentPrice) : null,
        currency: body.currency || 'EUR',
        priceHistory: body.currentPrice
          ? [{ price: parseFloat(body.currentPrice), currency: body.currency || 'EUR', date: new Date().toISOString() }]
          : [],
        active: true,
        lastUpdated: new Date().toISOString(),
        lastScrapedAt: null,
        scrapeStatus: 'pending',
        scrapeError: null,
        createdAt: new Date().toISOString(),
      };
      await db.collection('priceLinks').insertOne(link);

      // Update product best price
      if (body.currentPrice) {
        const allLinks = await db.collection('priceLinks')
          .find({ productId: body.productId, active: true, currentPrice: { $exists: true, $gt: 0 } })
          .toArray();
        if (allLinks.length > 0) {
          const bestPrice = Math.min(...allLinks.map(l => l.currentPrice));
          await db.collection('products').updateOne(
            { id: body.productId },
            { $set: { bestPrice, bestPriceUpdated: new Date().toISOString() } }
          );
        }
      }
      return NextResponse.json(link, { status: 201, headers: securityHeaders() });
    }

    // POST /api/scrape
    if (path[0] === 'scrape') {
      const linkId = body.linkId;
      if (linkId) {
        const link = await db.collection('priceLinks').findOne({ id: linkId });
        if (!link) return safeError('Link not found', 404);

        let customSelectors = null;
        if (link.storeId) {
          const store = await db.collection('stores').findOne({ id: link.storeId });
          if (store?.scrapingConfig) customSelectors = store.scrapingConfig;
        }

        const result = await scrapePrice(link.url, customSelectors);
        const updateData = {
          lastScrapedAt: new Date().toISOString(),
          scrapeStatus: result.success ? 'success' : 'failed',
          scrapeError: result.error || null,
        };

        if (result.success && result.price) {
          updateData.currentPrice = result.price;
          updateData.currency = result.currency;
          updateData.lastUpdated = new Date().toISOString();
          await db.collection('priceLinks').updateOne(
            { id: linkId },
            { $set: updateData, $push: { priceHistory: { $each: [{ price: result.price, currency: result.currency, date: new Date().toISOString() }], $slice: -90 } } }
          );
          const allLinks = await db.collection('priceLinks').find({ productId: link.productId, active: true, currentPrice: { $exists: true, $gt: 0 } }).toArray();
          if (allLinks.length > 0) {
            const bestPrice = Math.min(...allLinks.map(l => l.currentPrice));
            await db.collection('products').updateOne({ id: link.productId }, { $set: { bestPrice, bestPriceUpdated: new Date().toISOString() } });
          }
        } else {
          await db.collection('priceLinks').updateOne({ id: linkId }, { $set: updateData });
        }
        return NextResponse.json({ linkId, ...result }, { headers: securityHeaders() });
      } else {
        if (cronRunning) return NextResponse.json({ message: 'Scrape already running', cronRunning }, { headers: securityHeaders() });
        cronRunning = true;
        scrapeAllPriceLinks(db).then(results => {
          lastCronRun = new Date().toISOString();
          cronRunning = false;
        }).catch(err => { cronRunning = false; console.error('[Scrape Error]', err.message); });
        return NextResponse.json({ message: 'Scrape started', cronRunning: true }, { headers: securityHeaders() });
      }
    }

    // POST /api/seed
    if (path[0] === 'seed') {
      const existingCats = await db.collection('categories').countDocuments();
      if (existingCats === 0) {
        await db.collection('categories').insertMany(
          CATEGORIES.map(c => ({ id: uuidv4(), ...c, createdAt: new Date().toISOString() }))
        );
      }
      const existingStores = await db.collection('stores').countDocuments();
      if (existingStores === 0) {
        await db.collection('stores').insertMany(
          DEFAULT_STORES.map(s => ({ id: uuidv4(), ...s, active: true, createdAt: new Date().toISOString() }))
        );
      }
      return NextResponse.json({ message: 'Seeded successfully' }, { headers: securityHeaders() });
    }

    // ============================================================
    // POST /api/update-product - Python Scraper Integration Endpoint
    // Allows external Python scraper to update product prices
    // Expected JSON structure:
    // {
    //   "product_id": "uuid",
    //   "store_prices": [
    //     {
    //       "store_id": "uuid",
    //       "store_url": "https://...",
    //       "price": 599.99,
    //       "currency": "CAD",
    //       "is_in_stock": true,
    //       "last_checked": "2025-03-09T12:00:00Z"
    //     }
    //   ]
    // }
    // ============================================================
    if (path[0] === 'update-product') {
      // Validate required fields
      if (!body.product_id) {
        return safeError('product_id is required', 400);
      }
      
      const productId = body.product_id;
      const storePrices = body.store_prices || [];
      
      // Check if product exists
      const product = await db.collection('products').findOne({ id: productId });
      if (!product) {
        return safeError('Product not found', 404);
      }
      
      const results = [];
      let bestPrice = null;
      
      for (const storeData of storePrices) {
        const { store_id, store_url, price, currency = 'CAD', is_in_stock = true, last_checked } = storeData;
        
        if (!store_url || price === undefined) continue;
        
        // Find or create price link
        let priceLink = await db.collection('priceLinks').findOne({
          productId,
          $or: [
            { storeId: store_id },
            { url: store_url }
          ]
        });
        
        const priceValue = parseFloat(price);
        const now = last_checked || new Date().toISOString();
        
        if (priceLink) {
          // Update existing link
          const updateData = {
            currentPrice: priceValue,
            currency,
            inStock: is_in_stock,
            lastScrapedAt: now,
            lastUpdated: now,
            scrapeStatus: 'success',
            scrapeError: null,
          };
          
          await db.collection('priceLinks').updateOne(
            { id: priceLink.id },
            { 
              $set: updateData,
              $push: { 
                priceHistory: { 
                  $each: [{ price: priceValue, currency, date: now, inStock: is_in_stock }], 
                  $slice: -90 
                } 
              }
            }
          );
          
          results.push({ action: 'updated', linkId: priceLink.id, price: priceValue });
        } else {
          // Create new link
          const newLink = {
            id: uuidv4(),
            productId,
            storeId: store_id || null,
            storeName: storeData.store_name || '',
            url: store_url,
            affiliateUrl: storeData.affiliate_url || store_url,
            currentPrice: priceValue,
            currency,
            inStock: is_in_stock,
            priceHistory: [{ price: priceValue, currency, date: now, inStock: is_in_stock }],
            active: true,
            lastUpdated: now,
            lastScrapedAt: now,
            scrapeStatus: 'success',
            scrapeError: null,
            createdAt: now,
          };
          
          await db.collection('priceLinks').insertOne(newLink);
          results.push({ action: 'created', linkId: newLink.id, price: priceValue });
        }
        
        // Track best price
        if (is_in_stock && priceValue > 0) {
          if (bestPrice === null || priceValue < bestPrice) {
            bestPrice = priceValue;
          }
        }
      }
      
      // Update product best price if we found one
      if (bestPrice !== null) {
        await db.collection('products').updateOne(
          { id: productId },
          { 
            $set: { 
              bestPrice, 
              bestPriceUpdated: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            } 
          }
        );
      }
      
      return NextResponse.json({
        success: true,
        productId,
        linksProcessed: results.length,
        results,
        bestPrice
      }, { headers: securityHeaders() });
    }

    return safeError('Not found', 404);
  } catch (err) {
    console.error('[API POST Error]', err);
    return safeError('An error occurred', 500);
  }
}

export async function PUT(request, { params }) {
  const path = params?.path || [];

  const rateLimitError = applyRateLimit(request);
  if (rateLimitError) return rateLimitError;

  if (requiresAdminAuth('PUT', path)) {
    if (!checkAdminAuth(request)) return safeError('Unauthorized', 401);
  }

  try {
    const db = await getDb();
    let body = {};
    try { body = await request.json(); } catch (e) {}
    body = sanitizeObject(body);

    if (path[0] === 'products' && path[1]) {
      const updates = { ...body, updatedAt: new Date().toISOString() };
      delete updates._id; delete updates.id;
      if (updates.currentPrice) updates.currentPrice = parseFloat(updates.currentPrice);
      await db.collection('products').updateOne({ id: path[1] }, { $set: updates });
      const updated = await db.collection('products').findOne({ id: path[1] });
      if (!updated) return safeError('Product not found', 404);
      return NextResponse.json(updated, { headers: securityHeaders() });
    }

    if (path[0] === 'stores' && path[1]) {
      const updates = { ...body };
      delete updates._id; delete updates.id;
      await db.collection('stores').updateOne({ id: path[1] }, { $set: updates });
      const updated = await db.collection('stores').findOne({ id: path[1] });
      return NextResponse.json(updated, { headers: securityHeaders() });
    }

    if (path[0] === 'price-links' && path[1]) {
      const updates = { ...body };
      delete updates._id; delete updates.id;
      if (updates.currentPrice) updates.currentPrice = parseFloat(updates.currentPrice);
      await db.collection('priceLinks').updateOne({ id: path[1] }, { $set: updates });
      const updated = await db.collection('priceLinks').findOne({ id: path[1] });
      return NextResponse.json(updated, { headers: securityHeaders() });
    }

    if (path[0] === 'categories' && path[1]) {
      const updates = { ...body };
      delete updates._id; delete updates.id;
      await db.collection('categories').updateOne({ id: path[1] }, { $set: updates });
      const updated = await db.collection('categories').findOne({ id: path[1] });
      return NextResponse.json(updated, { headers: securityHeaders() });
    }

    return safeError('Not found', 404);
  } catch (err) {
    console.error('[API PUT Error]', err);
    return safeError('An error occurred', 500);
  }
}

export async function DELETE(request, { params }) {
  const path = params?.path || [];

  const rateLimitError = applyRateLimit(request);
  if (rateLimitError) return rateLimitError;

  if (requiresAdminAuth('DELETE', path)) {
    if (!checkAdminAuth(request)) return safeError('Unauthorized', 401);
  }

  try {
    const db = await getDb();

    if (path[0] === 'products' && path[1]) {
      await db.collection('products').deleteOne({ id: path[1] });
      await db.collection('priceLinks').deleteMany({ productId: path[1] });
      return NextResponse.json({ success: true }, { headers: securityHeaders() });
    }
    if (path[0] === 'stores' && path[1]) {
      await db.collection('stores').deleteOne({ id: path[1] });
      return NextResponse.json({ success: true }, { headers: securityHeaders() });
    }
    if (path[0] === 'price-links' && path[1]) {
      await db.collection('priceLinks').deleteOne({ id: path[1] });
      return NextResponse.json({ success: true }, { headers: securityHeaders() });
    }
    if (path[0] === 'categories' && path[1]) {
      await db.collection('categories').deleteOne({ id: path[1] });
      return NextResponse.json({ success: true }, { headers: securityHeaders() });
    }

    return safeError('Not found', 404);
  } catch (err) {
    console.error('[API DELETE Error]', err);
    return safeError('An error occurred', 500);
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 200, headers: securityHeaders() });
}
