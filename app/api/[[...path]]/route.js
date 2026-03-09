import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';
import { scrapePrice, scrapeAllPriceLinks } from '@/lib/scraper';
import { CATEGORIES, DEFAULT_STORES } from '@/lib/translations';

// ============================================================
// CRON JOB INITIALIZATION
// ============================================================
let cronJob = null;
let cronInitialized = false;
let lastCronRun = null;
let cronRunning = false;

async function initializeCron() {
  if (cronInitialized) return;
  cronInitialized = true;

  try {
    const { default: cron } = await import('node-cron');
    // Run every 3 hours
    cronJob = cron.schedule('0 */3 * * *', async () => {
      if (cronRunning) {
        console.log('[Cron] Previous scrape still running, skipping...');
        return;
      }
      console.log('[Cron] Starting scheduled price update...');
      cronRunning = true;
      try {
        const db = await getDb();
        const results = await scrapeAllPriceLinks(db);
        lastCronRun = new Date().toISOString();
        console.log(`[Cron] Completed. Updated ${results.filter(r => r.success).length}/${results.length} links.`);
      } catch (err) {
        console.error('[Cron] Error:', err.message);
      } finally {
        cronRunning = false;
      }
    });
    console.log('[Cron] Initialized - runs every 3 hours');
  } catch (err) {
    console.error('[Cron] Failed to initialize:', err.message);
  }
}

// Initialize cron on module load (server-side only)
if (typeof window === 'undefined') {
  initializeCron();
}

// ============================================================
// CORS HEADERS
// ============================================================
function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };
}

// ============================================================
// ROUTE HANDLER
// ============================================================
export async function GET(request, { params }) {
  const path = params?.path || [];
  const url = new URL(request.url);
  const searchParams = url.searchParams;

  try {
    const db = await getDb();

    // GET /api/categories
    if (path[0] === 'categories') {
      const categories = await db.collection('categories').find({}).sort({ order: 1 }).toArray();
      return NextResponse.json(categories, { headers: corsHeaders() });
    }

    // GET /api/stores
    if (path[0] === 'stores') {
      if (path[1]) {
        const store = await db.collection('stores').findOne({ id: path[1] });
        if (!store) return NextResponse.json({ error: 'Store not found' }, { status: 404, headers: corsHeaders() });
        return NextResponse.json(store, { headers: corsHeaders() });
      }
      const stores = await db.collection('stores').find({}).sort({ name: 1 }).toArray();
      return NextResponse.json(stores, { headers: corsHeaders() });
    }

    // GET /api/products
    if (path[0] === 'products') {
      if (path[1]) {
        // GET /api/products/:id
        const product = await db.collection('products').findOne({ id: path[1] });
        if (!product) return NextResponse.json({ error: 'Product not found' }, { status: 404, headers: corsHeaders() });
        
        // Get price links with store info
        const priceLinks = await db.collection('priceLinks')
          .find({ productId: path[1], active: true })
          .sort({ currentPrice: 1 })
          .toArray();

        const storeIds = [...new Set(priceLinks.map(l => l.storeId).filter(Boolean))];
        const stores = await db.collection('stores').find({ id: { $in: storeIds } }).toArray();
        const storesMap = {};
        stores.forEach(s => storesMap[s.id] = s);

        const enrichedLinks = priceLinks.map(l => ({
          ...l,
          store: storesMap[l.storeId] || null
        }));

        return NextResponse.json({ ...product, priceLinks: enrichedLinks }, { headers: corsHeaders() });
      }

      // GET /api/products with filters
      const category = searchParams.get('category');
      const featured = searchParams.get('featured');
      const sort = searchParams.get('sort') || 'bestPrice';
      const limit = parseInt(searchParams.get('limit') || '50');
      const skip = parseInt(searchParams.get('skip') || '0');

      let query = {};
      if (category) query.category = category;
      if (featured === 'true') query.featured = true;

      let sortObj = {};
      if (sort === 'bestPrice') sortObj = { bestPrice: 1 };
      else if (sort === 'priceDesc') sortObj = { bestPrice: -1 };
      else if (sort === 'recent') sortObj = { createdAt: -1 };

      const products = await db.collection('products')
        .find(query)
        .sort(sortObj)
        .skip(skip)
        .limit(limit)
        .toArray();

      const total = await db.collection('products').countDocuments(query);
      return NextResponse.json({ products, total }, { headers: corsHeaders() });
    }

    // GET /api/price-links
    if (path[0] === 'price-links') {
      const productId = searchParams.get('productId');
      let query = {};
      if (productId) query.productId = productId;
      const links = await db.collection('priceLinks').find(query).sort({ currentPrice: 1 }).toArray();
      return NextResponse.json(links, { headers: corsHeaders() });
    }

    // GET /api/search
    if (path[0] === 'search') {
      const q = searchParams.get('q') || '';
      const category = searchParams.get('category') || '';
      const sort = searchParams.get('sort') || 'bestPrice';
      const limit = parseInt(searchParams.get('limit') || '30');

      if (!q.trim()) {
        return NextResponse.json({ products: [], total: 0 }, { headers: corsHeaders() });
      }

      let query = {
        $or: [
          { name: { $regex: q, $options: 'i' } },
          { brand: { $regex: q, $options: 'i' } },
          { description: { $regex: q, $options: 'i' } },
          { tags: { $in: [new RegExp(q, 'i')] } }
        ]
      };
      if (category) query.category = category;

      let sortObj = {};
      if (sort === 'bestPrice') sortObj = { bestPrice: 1 };
      else if (sort === 'priceDesc') sortObj = { bestPrice: -1 };
      else sortObj = { createdAt: -1 };

      const products = await db.collection('products').find(query).sort(sortObj).limit(limit).toArray();
      const total = await db.collection('products').countDocuments(query);

      return NextResponse.json({ products, total }, { headers: corsHeaders() });
    }

    // GET /api/scrape/status
    if (path[0] === 'scrape' && path[1] === 'status') {
      const recentLinks = await db.collection('priceLinks')
        .find({ active: true })
        .sort({ lastScrapedAt: -1 })
        .limit(20)
        .toArray();
      
      const storeIds = [...new Set(recentLinks.map(l => l.storeId).filter(Boolean))];
      const stores = await db.collection('stores').find({ id: { $in: storeIds } }).toArray();
      const storesMap = {};
      stores.forEach(s => storesMap[s.id] = s);

      const total = await db.collection('priceLinks').countDocuments({ active: true });
      const success = await db.collection('priceLinks').countDocuments({ active: true, scrapeStatus: 'success' });
      const failed = await db.collection('priceLinks').countDocuments({ active: true, scrapeStatus: 'failed' });

      return NextResponse.json({
        cronRunning,
        lastCronRun,
        cronInitialized,
        total,
        success,
        failed,
        recentLinks: recentLinks.map(l => ({ ...l, store: storesMap[l.storeId] || null }))
      }, { headers: corsHeaders() });
    }

    // GET /api/featured
    if (path[0] === 'featured') {
      const products = await db.collection('products')
        .find({ featured: true })
        .sort({ bestPrice: 1 })
        .limit(8)
        .toArray();
      return NextResponse.json(products, { headers: corsHeaders() });
    }

    // GET /api/stats
    if (path[0] === 'stats') {
      const totalProducts = await db.collection('products').countDocuments();
      const totalStores = await db.collection('stores').countDocuments();
      const totalLinks = await db.collection('priceLinks').countDocuments({ active: true });
      return NextResponse.json({ totalProducts, totalStores, totalLinks }, { headers: corsHeaders() });
    }

    return NextResponse.json({ error: 'Not found' }, { status: 404, headers: corsHeaders() });
  } catch (err) {
    console.error('[API GET]', err);
    return NextResponse.json({ error: err.message }, { status: 500, headers: corsHeaders() });
  }
}

export async function POST(request, { params }) {
  const path = params?.path || [];

  try {
    const db = await getDb();
    let body = {};
    try { body = await request.json(); } catch (e) {}

    // POST /api/categories
    if (path[0] === 'categories') {
      const cat = {
        id: uuidv4(),
        name_en: body.name_en || body.en,
        name_fr: body.name_fr || body.fr,
        slug: body.slug,
        icon: body.icon || '📦',
        order: body.order || 99,
        parentId: body.parentId || null,
        createdAt: new Date().toISOString()
      };
      await db.collection('categories').insertOne(cat);
      return NextResponse.json(cat, { status: 201, headers: corsHeaders() });
    }

    // POST /api/stores
    if (path[0] === 'stores') {
      const store = {
        id: uuidv4(),
        name: body.name,
        domain: body.domain,
        logo: body.logo || '🏪',
        color: body.color || '#666666',
        country: body.country || 'Global',
        scrapingConfig: body.scrapingConfig || null,
        active: true,
        createdAt: new Date().toISOString()
      };
      await db.collection('stores').insertOne(store);
      return NextResponse.json(store, { status: 201, headers: corsHeaders() });
    }

    // POST /api/products
    if (path[0] === 'products') {
      const product = {
        id: uuidv4(),
        name: body.name,
        slug: body.slug || body.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        description: body.description || '',
        category: body.category || 'electronics',
        brand: body.brand || '',
        image: body.image || '',
        tags: body.tags || [],
        featured: body.featured || false,
        bestPrice: null,
        bestPriceUpdated: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      await db.collection('products').insertOne(product);
      return NextResponse.json(product, { status: 201, headers: corsHeaders() });
    }

    // POST /api/price-links
    if (path[0] === 'price-links') {
      const link = {
        id: uuidv4(),
        productId: body.productId,
        storeId: body.storeId || null,
        storeName: body.storeName || '',
        url: body.url,
        affiliateUrl: body.affiliateUrl || body.url,
        currentPrice: body.currentPrice ? parseFloat(body.currentPrice) : null,
        currency: body.currency || 'EUR',
        priceHistory: body.currentPrice ? [{ price: parseFloat(body.currentPrice), currency: body.currency || 'EUR', date: new Date().toISOString() }] : [],
        active: true,
        lastUpdated: new Date().toISOString(),
        lastScrapedAt: null,
        scrapeStatus: 'pending',
        scrapeError: null,
        createdAt: new Date().toISOString()
      };
      await db.collection('priceLinks').insertOne(link);

      // Update product best price
      if (body.currentPrice) {
        const allLinks = await db.collection('priceLinks')
          .find({ productId: body.productId, active: true, currentPrice: { $exists: true, $gt: 0 } })
          .toArray();
        const bestPrice = Math.min(...allLinks.map(l => l.currentPrice));
        await db.collection('products').updateOne(
          { id: body.productId },
          { $set: { bestPrice, bestPriceUpdated: new Date().toISOString() } }
        );
      }

      return NextResponse.json(link, { status: 201, headers: corsHeaders() });
    }

    // POST /api/scrape - Trigger manual scrape
    if (path[0] === 'scrape') {
      const linkId = body.linkId;
      
      if (linkId) {
        // Scrape single link
        const link = await db.collection('priceLinks').findOne({ id: linkId });
        if (!link) return NextResponse.json({ error: 'Link not found' }, { status: 404, headers: corsHeaders() });
        
        let customSelectors = null;
        if (link.storeId) {
          const store = await db.collection('stores').findOne({ id: link.storeId });
          if (store?.scrapingConfig) customSelectors = store.scrapingConfig;
        }

        const result = await scrapePrice(link.url, customSelectors);
        
        const updateData = {
          lastScrapedAt: new Date().toISOString(),
          scrapeStatus: result.success ? 'success' : 'failed',
          scrapeError: result.error || null
        };

        if (result.success && result.price) {
          updateData.currentPrice = result.price;
          updateData.currency = result.currency;
          updateData.lastUpdated = new Date().toISOString();
          await db.collection('priceLinks').updateOne(
            { id: linkId },
            { $set: updateData, $push: { priceHistory: { $each: [{ price: result.price, currency: result.currency, date: new Date().toISOString() }], $slice: -90 } } }
          );
          // Update product best price
          const allLinks = await db.collection('priceLinks')
            .find({ productId: link.productId, active: true, currentPrice: { $exists: true, $gt: 0 } })
            .toArray();
          if (allLinks.length > 0) {
            const bestPrice = Math.min(...allLinks.map(l => l.currentPrice));
            await db.collection('products').updateOne(
              { id: link.productId },
              { $set: { bestPrice, bestPriceUpdated: new Date().toISOString() } }
            );
          }
        } else {
          await db.collection('priceLinks').updateOne({ id: linkId }, { $set: updateData });
        }

        return NextResponse.json({ linkId, ...result }, { headers: corsHeaders() });
      } else {
        // Scrape all - run in background
        if (cronRunning) {
          return NextResponse.json({ message: 'Scrape already running', cronRunning }, { headers: corsHeaders() });
        }
        cronRunning = true;
        scrapeAllPriceLinks(db).then(results => {
          lastCronRun = new Date().toISOString();
          cronRunning = false;
          console.log(`[Manual Scrape] Done: ${results.filter(r => r.success).length}/${results.length}`);
        }).catch(err => {
          cronRunning = false;
          console.error('[Manual Scrape] Error:', err.message);
        });
        return NextResponse.json({ message: 'Scrape started', cronRunning: true }, { headers: corsHeaders() });
      }
    }

    // POST /api/seed - Seed initial data
    if (path[0] === 'seed') {
      // Seed categories
      const existingCats = await db.collection('categories').countDocuments();
      if (existingCats === 0) {
        await db.collection('categories').insertMany(
          CATEGORIES.map(c => ({ id: uuidv4(), ...c, createdAt: new Date().toISOString() }))
        );
      }

      // Seed stores
      const existingStores = await db.collection('stores').countDocuments();
      if (existingStores === 0) {
        await db.collection('stores').insertMany(
          DEFAULT_STORES.map(s => ({ id: uuidv4(), ...s, active: true, createdAt: new Date().toISOString() }))
        );
      }

      return NextResponse.json({ message: 'Seeded successfully' }, { headers: corsHeaders() });
    }

    return NextResponse.json({ error: 'Not found' }, { status: 404, headers: corsHeaders() });
  } catch (err) {
    console.error('[API POST]', err);
    return NextResponse.json({ error: err.message }, { status: 500, headers: corsHeaders() });
  }
}

export async function PUT(request, { params }) {
  const path = params?.path || [];

  try {
    const db = await getDb();
    let body = {};
    try { body = await request.json(); } catch (e) {}

    // PUT /api/products/:id
    if (path[0] === 'products' && path[1]) {
      const updates = {
        ...body,
        updatedAt: new Date().toISOString()
      };
      delete updates._id;
      delete updates.id;
      await db.collection('products').updateOne({ id: path[1] }, { $set: updates });
      const updated = await db.collection('products').findOne({ id: path[1] });
      return NextResponse.json(updated, { headers: corsHeaders() });
    }

    // PUT /api/stores/:id
    if (path[0] === 'stores' && path[1]) {
      const updates = { ...body };
      delete updates._id;
      delete updates.id;
      await db.collection('stores').updateOne({ id: path[1] }, { $set: updates });
      const updated = await db.collection('stores').findOne({ id: path[1] });
      return NextResponse.json(updated, { headers: corsHeaders() });
    }

    // PUT /api/price-links/:id
    if (path[0] === 'price-links' && path[1]) {
      const updates = { ...body };
      delete updates._id;
      delete updates.id;
      if (updates.currentPrice) updates.currentPrice = parseFloat(updates.currentPrice);
      await db.collection('priceLinks').updateOne({ id: path[1] }, { $set: updates });
      const updated = await db.collection('priceLinks').findOne({ id: path[1] });
      return NextResponse.json(updated, { headers: corsHeaders() });
    }

    // PUT /api/categories/:id
    if (path[0] === 'categories' && path[1]) {
      const updates = { ...body };
      delete updates._id;
      delete updates.id;
      await db.collection('categories').updateOne({ id: path[1] }, { $set: updates });
      const updated = await db.collection('categories').findOne({ id: path[1] });
      return NextResponse.json(updated, { headers: corsHeaders() });
    }

    return NextResponse.json({ error: 'Not found' }, { status: 404, headers: corsHeaders() });
  } catch (err) {
    console.error('[API PUT]', err);
    return NextResponse.json({ error: err.message }, { status: 500, headers: corsHeaders() });
  }
}

export async function DELETE(request, { params }) {
  const path = params?.path || [];

  try {
    const db = await getDb();

    if (path[0] === 'products' && path[1]) {
      await db.collection('products').deleteOne({ id: path[1] });
      await db.collection('priceLinks').deleteMany({ productId: path[1] });
      return NextResponse.json({ success: true }, { headers: corsHeaders() });
    }

    if (path[0] === 'stores' && path[1]) {
      await db.collection('stores').deleteOne({ id: path[1] });
      return NextResponse.json({ success: true }, { headers: corsHeaders() });
    }

    if (path[0] === 'price-links' && path[1]) {
      await db.collection('priceLinks').deleteOne({ id: path[1] });
      return NextResponse.json({ success: true }, { headers: corsHeaders() });
    }

    if (path[0] === 'categories' && path[1]) {
      await db.collection('categories').deleteOne({ id: path[1] });
      return NextResponse.json({ success: true }, { headers: corsHeaders() });
    }

    return NextResponse.json({ error: 'Not found' }, { status: 404, headers: corsHeaders() });
  } catch (err) {
    console.error('[API DELETE]', err);
    return NextResponse.json({ error: err.message }, { status: 500, headers: corsHeaders() });
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 200, headers: corsHeaders() });
}
