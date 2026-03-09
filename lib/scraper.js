import axios from 'axios';
import * as cheerio from 'cheerio';

const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
];

const DOMAIN_SELECTORS = {
  'amazon': {
    price: '.a-price .a-offscreen, #priceblock_ourprice, #price_inside_buybox, .a-price-whole',
    title: '#productTitle',
  },
  'ebay': {
    price: '.x-price-primary .ux-textspans, .notranslate[itemprop="price"], #prcIsum',
    title: '.ux-pagetitle--titlecontext, .it-ttl',
  },
  'aliexpress': {
    price: '.product-price-value, .uniform-banner-box-price, .snow-price_Price__mainS',
    title: '.product-title-text, h1.product-name',
  },
  'fnac': {
    price: '.userPrice .finalPrice, .f-priceBox-price',
    title: 'h1.f-productHeader-Title',
  },
  'cdiscount': {
    price: '.fpPrice .Price, .jsPriceDeal',
    title: 'h1.titleProduct',
  },
  'ldlc': {
    price: '.price .price, .product-price',
    title: 'h1.title-1',
  },
  'boulanger': {
    price: '.price-product, [data-test="price"]',
    title: 'h1.product-name',
  },
};

function getDomainSelectors(url) {
  try {
    const domain = new URL(url).hostname.replace('www.', '');
    for (const [key, selectors] of Object.entries(DOMAIN_SELECTORS)) {
      if (domain.includes(key)) return selectors;
    }
  } catch (e) {}
  return null;
}

function cleanPrice(str) {
  if (!str) return null;
  let cleaned = str.replace(/[^0-9.,]/g, '').trim();
  if (!cleaned) return null;
  if (cleaned.includes(',') && cleaned.includes('.')) {
    if (cleaned.lastIndexOf(',') > cleaned.lastIndexOf('.')) {
      cleaned = cleaned.replace(/\./g, '').replace(',', '.');
    } else {
      cleaned = cleaned.replace(/,/g, '');
    }
  } else if (cleaned.includes(',') && !cleaned.includes('.')) {
    cleaned = cleaned.replace(',', '.');
  }
  const price = parseFloat(cleaned);
  return isNaN(price) ? null : price;
}

export async function scrapePrice(url, customSelectors = null) {
  const userAgent = USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];

  try {
    const response = await axios.get(url, {
      headers: {
        'User-Agent': userAgent,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9,fr;q=0.8',
        'Accept-Encoding': 'gzip, deflate',
        'Connection': 'keep-alive',
        'Cache-Control': 'no-cache',
      },
      timeout: 15000,
      maxRedirects: 5,
    });

    const $ = cheerio.load(response.data);
    const domainSelectors = getDomainSelectors(url);
    const selectors = customSelectors || domainSelectors;

    let price = null;
    let title = null;

    if (selectors && selectors.price) {
      const priceEl = $(selectors.price).first();
      if (priceEl.length) {
        price = cleanPrice(priceEl.text() || priceEl.attr('content'));
      }
      if (selectors.title) {
        title = $(selectors.title).first().text().trim() || null;
      }
    }

    // Fallback: JSON-LD structured data
    if (!price) {
      $('script[type="application/ld+json"]').each((_, el) => {
        try {
          const data = JSON.parse($(el).html());
          const findPrice = (obj) => {
            if (!obj) return null;
            if (obj['@type'] === 'Product') {
              const offer = obj.offers || obj.Offers;
              if (offer) {
                const o = Array.isArray(offer) ? offer[0] : offer;
                return o.price || o.lowPrice;
              }
            }
            if (Array.isArray(obj)) {
              for (const item of obj) { const r = findPrice(item); if (r) return r; }
            }
            return null;
          };
          const found = findPrice(data);
          if (found && !price) price = parseFloat(found);
        } catch (e) {}
      });
    }

    // Fallback: meta tags
    if (!price) {
      const metaPrice = $('meta[property="product:price:amount"], meta[itemprop="price"]').attr('content');
      if (metaPrice) price = cleanPrice(metaPrice);
    }

    // Try to get currency
    let currency = 'EUR';
    const metaCurrency = $('meta[property="product:price:currency"], meta[itemprop="priceCurrency"]').attr('content');
    if (metaCurrency) currency = metaCurrency.toUpperCase();

    return {
      success: !!price,
      price,
      currency,
      title: title || null,
      scrapedAt: new Date().toISOString(),
      error: price ? null : 'Price not found in page',
    };
  } catch (error) {
    return {
      success: false,
      price: null,
      currency: 'EUR',
      title: null,
      scrapedAt: new Date().toISOString(),
      error: error.message,
    };
  }
}

export async function scrapeAllPriceLinks(db) {
  const priceLinks = await db.collection('priceLinks').find({ active: true }).toArray();
  const results = [];

  for (const link of priceLinks) {
    console.log(`[Scraper] Scraping: ${link.url}`);

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

      const historyEntry = { price: result.price, currency: result.currency, date: new Date().toISOString() };

      await db.collection('priceLinks').updateOne(
        { id: link.id },
        { $set: updateData, $push: { priceHistory: { $each: [historyEntry], $slice: -90 } } }
      );

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

    // Rate limiting
    await new Promise(resolve => setTimeout(resolve, 1500 + Math.random() * 2000));
  }

  return results;
}
