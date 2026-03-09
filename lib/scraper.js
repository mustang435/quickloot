import axios from 'axios';
import * as cheerio from 'cheerio';

// ============================================================
// USER AGENT ROTATION - Anti-bot protection
// ============================================================
const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:126.0) Gecko/20100101 Firefox/126.0',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Safari/605.1.15',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36 Edg/122.0.0.0',
];

function getRandomUserAgent() {
  return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
}

// ============================================================
// RANDOMIZED DELAY - Anti-bot protection (1.5s to 5s)
// ============================================================
function getRandomDelay() {
  return 1500 + Math.random() * 3500; // 1.5s to 5s
}

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ============================================================
// CANADIAN STORE SELECTORS
// ============================================================
const DOMAIN_SELECTORS = {
  // Amazon Canada
  'amazon.ca': {
    price: '.a-price .a-offscreen, #priceblock_ourprice, #price_inside_buybox, .a-price-whole, #corePrice_feature_div .a-offscreen, .priceToPay .a-offscreen',
    title: '#productTitle',
    stock: '#availability span',
    currency: 'CAD'
  },
  // Walmart Canada
  'walmart.ca': {
    price: '[data-automation="buybox-price"], .css-1bxk23v, [itemprop="price"], .price-characteristic',
    title: '[data-automation="product-title"], h1.css-1q8rqfc',
    stock: '[data-automation="fulfillment-options"]',
    currency: 'CAD'
  },
  // EB Games Canada
  'ebgames.ca': {
    price: '.prodPriceCont .price, .product-price, .regular-price, .special-price',
    title: '.prodTitle h2, .product-name h1',
    stock: '.availability, .stock-status',
    currency: 'CAD'
  },
  // Staples Canada
  'staples.ca': {
    price: '[data-testid="price"], .price__regular, .stp--price-item, .price-value',
    title: '[data-testid="product-title"], .product-title h1',
    stock: '.availability-message, .stock-message',
    currency: 'CAD'
  },
  // Best Buy Canada
  'bestbuy.ca': {
    price: '.price_FHDfG, [class*="productPricingContainer"] span, .priceWithoutEhf_3Knqg',
    title: '.productName_2KoPa, [class*="productName"] h1',
    stock: '.availabilityMessage_1MO75',
    currency: 'CAD'
  },
  // The Source
  'thesource.ca': {
    price: '.product-price, .price-value, .current-price',
    title: '.product-name, h1.title',
    stock: '.stock-status',
    currency: 'CAD'
  },
  // Newegg Canada
  'newegg.ca': {
    price: '.price-current strong, .price-current, li.price-current',
    title: '.product-title, h1.product-title',
    stock: '.product-inventory, .astock-text',
    currency: 'CAD'
  },
  // Canada Computers
  'canadacomputers.com': {
    price: '.price-big, .price-show-new, .h2-big',
    title: '.page-product_info h1',
    stock: '.pi-prod-availability',
    currency: 'CAD'
  },
  // Memory Express
  'memoryexpress.com': {
    price: '.GrandTotal, .ProductPrice, .price-value',
    title: '.ProductTitle h1',
    stock: '.InventoryState',
    currency: 'CAD'
  },
  // Generic fallback selectors
  'default': {
    price: '[itemprop="price"], .price, .product-price, .current-price, [data-price], .sale-price',
    title: '[itemprop="name"], .product-title, .product-name, h1',
    stock: '.stock, .availability, [itemprop="availability"]',
    currency: 'CAD'
  }
};

function getDomainSelectors(url) {
  try {
    const hostname = new URL(url).hostname.replace('www.', '');
    for (const [domain, selectors] of Object.entries(DOMAIN_SELECTORS)) {
      if (hostname.includes(domain)) {
        return { ...selectors, domain };
      }
    }
  } catch (e) {}
  return { ...DOMAIN_SELECTORS.default, domain: 'unknown' };
}

// ============================================================
// PRICE CLEANING - Handle CAD format
// ============================================================
function cleanPrice(str) {
  if (!str) return null;
  
  // Remove currency symbols, "CAD", "$", whitespace
  let cleaned = str
    .replace(/CAD/gi, '')
    .replace(/\$/g, '')
    .replace(/[^0-9.,]/g, '')
    .trim();
  
  if (!cleaned) return null;
  
  // Handle different formats: 1,299.99 or 1299,99 or 1299.99
  if (cleaned.includes(',') && cleaned.includes('.')) {
    // Format: 1,299.99 (North American)
    if (cleaned.lastIndexOf('.') > cleaned.lastIndexOf(',')) {
      cleaned = cleaned.replace(/,/g, '');
    } else {
      // Format: 1.299,99 (European)
      cleaned = cleaned.replace(/\./g, '').replace(',', '.');
    }
  } else if (cleaned.includes(',') && !cleaned.includes('.')) {
    // Check if comma is decimal separator (e.g., 299,99)
    const parts = cleaned.split(',');
    if (parts.length === 2 && parts[1].length === 2) {
      cleaned = cleaned.replace(',', '.');
    } else {
      // Thousand separator
      cleaned = cleaned.replace(/,/g, '');
    }
  }
  
  const price = parseFloat(cleaned);
  return isNaN(price) || price <= 0 ? null : price;
}

// ============================================================
// STOCK STATUS DETECTION
// ============================================================
function detectStockStatus(text) {
  if (!text) return 'unknown';
  const lower = text.toLowerCase();
  
  const outOfStockKeywords = [
    'out of stock', 'rupture', 'sold out', 'unavailable', 
    'not available', 'épuisé', 'non disponible', 'back order',
    'currently unavailable', 'notify me'
  ];
  
  const inStockKeywords = [
    'in stock', 'en stock', 'available', 'disponible', 
    'add to cart', 'ajouter au panier', 'buy now', 'ships from'
  ];
  
  for (const keyword of outOfStockKeywords) {
    if (lower.includes(keyword)) return 'out_of_stock';
  }
  
  for (const keyword of inStockKeywords) {
    if (lower.includes(keyword)) return 'in_stock';
  }
  
  return 'unknown';
}

// ============================================================
// MAIN SCRAPE FUNCTION
// ============================================================
export async function scrapePrice(url, customSelectors = null) {
  const userAgent = getRandomUserAgent();
  const domainInfo = getDomainSelectors(url);
  const selectors = customSelectors || domainInfo;
  
  console.log(`[Scraper] Fetching: ${url}`);
  console.log(`[Scraper] Using UA: ${userAgent.substring(0, 50)}...`);
  console.log(`[Scraper] Domain detected: ${domainInfo.domain}`);

  try {
    const response = await axios.get(url, {
      headers: {
        'User-Agent': userAgent,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-CA,en;q=0.9,fr-CA;q=0.8,fr;q=0.7',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Sec-Fetch-User': '?1',
        'Upgrade-Insecure-Requests': '1',
      },
      timeout: 20000,
      maxRedirects: 5,
      validateStatus: (status) => status < 500,
    });

    if (response.status === 403 || response.status === 429) {
      console.log(`[Scraper] Blocked by ${domainInfo.domain} (${response.status})`);
      return {
        success: false,
        price: null,
        currency: 'CAD',
        stock: 'unknown',
        title: null,
        scrapedAt: new Date().toISOString(),
        error: `Blocked by store (HTTP ${response.status})`,
      };
    }

    const $ = cheerio.load(response.data);
    let price = null;
    let title = null;
    let stock = 'unknown';

    // Try domain-specific selectors
    if (selectors.price) {
      const priceSelectors = selectors.price.split(',').map(s => s.trim());
      for (const selector of priceSelectors) {
        const priceEl = $(selector).first();
        if (priceEl.length) {
          const priceText = priceEl.text() || priceEl.attr('content');
          price = cleanPrice(priceText);
          if (price) {
            console.log(`[Scraper] Price found with selector "${selector}": $${price}`);
            break;
          }
        }
      }
    }

    // Get title
    if (selectors.title) {
      const titleSelectors = selectors.title.split(',').map(s => s.trim());
      for (const selector of titleSelectors) {
        title = $(selector).first().text().trim();
        if (title) break;
      }
    }

    // Get stock status
    if (selectors.stock) {
      const stockSelectors = selectors.stock.split(',').map(s => s.trim());
      for (const selector of stockSelectors) {
        const stockText = $(selector).first().text();
        if (stockText) {
          stock = detectStockStatus(stockText);
          if (stock !== 'unknown') break;
        }
      }
    }

    // Fallback: JSON-LD structured data
    if (!price) {
      $('script[type="application/ld+json"]').each((_, el) => {
        try {
          const data = JSON.parse($(el).html());
          const findPrice = (obj) => {
            if (!obj) return null;
            if (obj['@type'] === 'Product' || obj['@type'] === 'Offer') {
              const offer = obj.offers || obj;
              if (Array.isArray(offer)) {
                for (const o of offer) {
                  if (o.price) return parseFloat(o.price);
                  if (o.lowPrice) return parseFloat(o.lowPrice);
                }
              } else if (offer.price) {
                return parseFloat(offer.price);
              } else if (offer.lowPrice) {
                return parseFloat(offer.lowPrice);
              }
            }
            if (Array.isArray(obj)) {
              for (const item of obj) {
                const r = findPrice(item);
                if (r) return r;
              }
            }
            if (typeof obj === 'object') {
              for (const key of Object.keys(obj)) {
                if (key !== '@context') {
                  const r = findPrice(obj[key]);
                  if (r) return r;
                }
              }
            }
            return null;
          };
          const found = findPrice(data);
          if (found && !price) {
            price = found;
            console.log(`[Scraper] Price found in JSON-LD: $${price}`);
          }
        } catch (e) {}
      });
    }

    // Fallback: meta tags
    if (!price) {
      const metaPrice = $('meta[property="product:price:amount"], meta[itemprop="price"], meta[property="og:price:amount"]').attr('content');
      if (metaPrice) {
        price = cleanPrice(metaPrice);
        if (price) console.log(`[Scraper] Price found in meta tag: $${price}`);
      }
    }

    // Detect stock from page content if not found
    if (stock === 'unknown') {
      const pageText = $('body').text();
      stock = detectStockStatus(pageText);
    }

    return {
      success: !!price,
      price,
      currency: 'CAD',
      stock,
      title: title ? title.substring(0, 200) : null,
      scrapedAt: new Date().toISOString(),
      error: price ? null : 'Price not found in page',
    };
  } catch (error) {
    console.error(`[Scraper] Error: ${error.message}`);
    return {
      success: false,
      price: null,
      currency: 'CAD',
      stock: 'unknown',
      title: null,
      scrapedAt: new Date().toISOString(),
      error: error.message,
    };
  }
}

// ============================================================
// BATCH SCRAPE ALL PRICE LINKS (with randomized delays)
// ============================================================
export async function scrapeAllPriceLinks(db) {
  const priceLinks = await db.collection('priceLinks').find({ active: true }).toArray();
  const results = [];
  
  console.log(`[Scraper] Starting batch scrape of ${priceLinks.length} links...`);

  for (let i = 0; i < priceLinks.length; i++) {
    const link = priceLinks[i];
    console.log(`[Scraper] Processing ${i + 1}/${priceLinks.length}: ${link.url}`);

    // Get custom selectors from store if available
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
      stock: result.stock || 'unknown',
    };

    if (result.success && result.price) {
      updateData.currentPrice = result.price;
      updateData.currency = result.currency;
      updateData.lastUpdated = new Date().toISOString();

      const historyEntry = {
        price: result.price,
        currency: result.currency,
        stock: result.stock,
        date: new Date().toISOString(),
      };

      await db.collection('priceLinks').updateOne(
        { id: link.id },
        {
          $set: updateData,
          $push: { priceHistory: { $each: [historyEntry], $slice: -90 } },
        }
      );

      // Update product's best price
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
      await db.collection('priceLinks').updateOne({ id: link.id }, { $set: updateData });
    }

    results.push({ linkId: link.id, url: link.url, ...result });

    // Randomized delay between requests (anti-bot protection)
    if (i < priceLinks.length - 1) {
      const delay = getRandomDelay();
      console.log(`[Scraper] Waiting ${Math.round(delay / 1000)}s before next request...`);
      await sleep(delay);
    }
  }

  console.log(`[Scraper] Batch complete. Success: ${results.filter(r => r.success).length}/${results.length}`);
  return results;
}
