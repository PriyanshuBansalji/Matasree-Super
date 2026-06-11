/**
 * Sitemap Generator Script
 *
 * Connects to MongoDB, queries all active products and categories, then writes
 * a valid sitemap.xml to the frontend public directory.
 *
 * Usage (from matasree-backend/):
 *   npx ts-node src/scripts/generateSitemap.ts
 *
 * Requirements: 28.1, 28.2, 28.4, 28.5
 */

import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

// Load env vars from backend .env
dotenv.config({ path: path.join(__dirname, '../../.env') });

// ----------------------------------------------------------------
// Minimal model references (avoid pulling in the full model tree)
// ----------------------------------------------------------------
import Product from '../models/Product';
import Category from '../models/Category';

// ----------------------------------------------------------------
// Config
// ----------------------------------------------------------------
const FRONTEND_URL =
  (process.env.FRONTEND_URL || process.env.VITE_FRONTEND_URL || 'https://matasreesuper.com')
    .replace(/\/$/, '');

const SITEMAP_OUTPUT_PATH = path.join(
  __dirname,
  '../../..',
  'matasree-superstore-main/public/sitemap.xml'
);

// ----------------------------------------------------------------
// Helpers
// ----------------------------------------------------------------

function escapeXml(raw: string): string {
  return raw
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

interface UrlEntry {
  loc: string;
  lastmod?: string;
  changefreq: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority: string;
}

function buildXml(entries: UrlEntry[]): string {
  const urlElements = entries
    .map((e) => {
      const lastmodTag = e.lastmod ? `\n    <lastmod>${e.lastmod}</lastmod>` : '';
      return `  <url>\n    <loc>${escapeXml(e.loc)}</loc>${lastmodTag}\n    <changefreq>${e.changefreq}</changefreq>\n    <priority>${e.priority}</priority>\n  </url>`;
    })
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urlElements}\n</urlset>\n`;
}

function toIsoDate(d: Date): string {
  return d.toISOString().split('T')[0];
}

// ----------------------------------------------------------------
// Main
// ----------------------------------------------------------------

async function generate(): Promise<void> {
  const mongoUri = process.env.MONGODB_URI;

  if (!mongoUri) {
    process.stderr.write(
      '[generateSitemap] ERROR: MONGODB_URI is not defined in environment variables.\n'
    );
    process.exit(1);
  }

  // Connect
  try {
    await mongoose.connect(mongoUri);
    console.log('[generateSitemap] Connected to MongoDB.');
  } catch (err: any) {
    process.stderr.write(
      `[generateSitemap] ERROR: Failed to connect to MongoDB — ${err?.message ?? err}\n`
    );
    process.exit(1);
  }

  const entries: UrlEntry[] = [];

  // ── Static pages ────────────────────────────────────────────
  entries.push({
    loc: FRONTEND_URL,
    changefreq: 'monthly',
    priority: '1.0',
  });

  entries.push({
    loc: `${FRONTEND_URL}/products`,
    changefreq: 'weekly',
    priority: '0.8',
  });

  entries.push({
    loc: `${FRONTEND_URL}/about`,
    changefreq: 'monthly',
    priority: '0.6',
  });

  entries.push({
    loc: `${FRONTEND_URL}/recipes`,
    changefreq: 'monthly',
    priority: '0.6',
  });

  entries.push({
    loc: `${FRONTEND_URL}/contact`,
    changefreq: 'monthly',
    priority: '0.6',
  });

  // ── Products ────────────────────────────────────────────────
  try {
    const products = await Product.find({ stock: { $gte: 0 } })
      .select('_id updatedAt')
      .lean();

    for (const product of products) {
      entries.push({
        loc: `${FRONTEND_URL}/product/${product._id}`,
        lastmod: toIsoDate(product.updatedAt),
        changefreq: 'weekly',
        priority: '0.8',
      });
    }

    console.log(`[generateSitemap] Added ${products.length} product URL(s).`);
  } catch (err: any) {
    process.stderr.write(
      `[generateSitemap] WARNING: Could not query products — ${err?.message ?? err}\n`
    );
    // Non-fatal: continue with static pages and categories
  }

  // ── Categories ──────────────────────────────────────────────
  try {
    const categories = await Category.find({})
      .select('slug _id updatedAt')
      .lean();

    for (const category of categories) {
      // Use slug when available; fall back to _id
      const segment = category.slug
        ? encodeURIComponent(category.slug)
        : String(category._id);

      entries.push({
        loc: `${FRONTEND_URL}/products?category=${segment}`,
        lastmod: toIsoDate(category.updatedAt),
        changefreq: 'weekly',
        priority: '0.7',
      });
    }

    console.log(`[generateSitemap] Added ${categories.length} category URL(s).`);
  } catch (err: any) {
    process.stderr.write(
      `[generateSitemap] WARNING: Could not query categories — ${err?.message ?? err}\n`
    );
  }

  // ── Write file ───────────────────────────────────────────────
  const xml = buildXml(entries);
  const outputDir = path.dirname(SITEMAP_OUTPUT_PATH);

  try {
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    fs.writeFileSync(SITEMAP_OUTPUT_PATH, xml, 'utf-8');
    console.log(`[generateSitemap] sitemap.xml written to: ${SITEMAP_OUTPUT_PATH}`);
    console.log(`[generateSitemap] Total URLs: ${entries.length}`);
  } catch (err: any) {
    process.stderr.write(
      `[generateSitemap] ERROR: Failed to write sitemap.xml — ${err?.message ?? err}\n`
    );
    process.exit(1);
  }

  await mongoose.disconnect();
  console.log('[generateSitemap] Done.');
}

generate();
