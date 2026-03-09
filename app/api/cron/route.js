import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { scrapeAllPriceLinks } from '@/lib/scraper';

// Vercel Cron Job - runs every 3 hours
// This endpoint is called automatically by Vercel
export const runtime = 'nodejs';
export const maxDuration = 300; // 5 minutes max

export async function GET(request) {
  // Verify this is a legitimate cron request from Vercel
  const authHeader = request.headers.get('authorization');
  
  // In production, verify the CRON_SECRET
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  console.log('[Cron] Starting scheduled price update...');
  
  try {
    const db = await getDb();
    const results = await scrapeAllPriceLinks(db);
    
    const summary = {
      total: results.length,
      success: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
      timestamp: new Date().toISOString(),
    };
    
    console.log(`[Cron] Complete. Success: ${summary.success}/${summary.total}`);
    
    return NextResponse.json({
      message: 'Cron job completed',
      ...summary,
    });
  } catch (error) {
    console.error('[Cron] Error:', error.message);
    return NextResponse.json(
      { error: 'Cron job failed', message: error.message },
      { status: 500 }
    );
  }
}
