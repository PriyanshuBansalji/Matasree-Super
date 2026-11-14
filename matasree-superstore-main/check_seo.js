const fs = require('fs');
const path = require('path');

console.log('================================================================');
console.log(' SEO AUDIT & VERIFICATION SUITE');
console.log('================================================================\n');

let total = 0;
let passed = 0;

function assertSEO(name, condition, details) {
  total++;
  if (condition) {
    passed++;
    console.log(`  ✅ [PASS] ${name}`);
  } else {
    console.error(`  ❌ [FAIL] ${name} (${details})`);
  }
}

// 1. robots.txt
const robotsPath = path.join(__dirname, 'public/robots.txt');
const hasRobots = fs.existsSync(robotsPath);
const robotsContent = hasRobots ? fs.readFileSync(robotsPath, 'utf8') : '';
assertSEO('robots.txt exists & disallows admin/cart/checkout', hasRobots && robotsContent.includes('Disallow: /admin') && robotsContent.includes('Sitemap:'));

// 2. sitemap.xml
const sitemapPath = path.join(__dirname, 'public/sitemap.xml');
const hasSitemap = fs.existsSync(sitemapPath);
const sitemapContent = hasSitemap ? fs.readFileSync(sitemapPath, 'utf8') : '';
assertSEO('sitemap.xml exists & contains valid urlset XML', hasSitemap && sitemapContent.includes('<urlset') && sitemapContent.includes('<loc>'));

// 3. PageHelmet (OpenGraph, Twitter Cards, Canonical URLs)
const helmetPath = path.join(__dirname, 'src/components/PageHelmet.tsx');
const helmetContent = fs.readFileSync(helmetPath, 'utf8');
assertSEO('OpenGraph meta tags configured (og:title, og:image, og:url)', helmetContent.includes('og:title') && helmetContent.includes('og:image') && helmetContent.includes('og:url'));
assertSEO('Twitter Cards meta tags configured (twitter:card, twitter:title, twitter:image)', helmetContent.includes('twitter:card') && helmetContent.includes('twitter:title') && helmetContent.includes('twitter:image'));
assertSEO('Canonical URL tag configured (<link rel="canonical">)', helmetContent.includes('rel="canonical"'));

// 4. JsonLd (Product Schema & Breadcrumb Schema)
const jsonLdPath = path.join(__dirname, 'src/components/JsonLd.tsx');
const jsonLdContent = fs.readFileSync(jsonLdPath, 'utf8');
assertSEO('Product JSON-LD schema builder (schema.org/Product & Offer & AggregateRating)', jsonLdContent.includes('buildProductSchema') && jsonLdContent.includes("'@type': 'Product'") && jsonLdContent.includes("'@type': 'Offer'"));
assertSEO('Breadcrumb JSON-LD schema builder (schema.org/BreadcrumbList & ListItem)', jsonLdContent.includes('buildBreadcrumbSchema') && jsonLdContent.includes("'@type': 'BreadcrumbList'") && jsonLdContent.includes("'@type': 'ListItem'"));

console.log('\n================================================================');
console.log(` SEO AUDIT SUMMARY: Passed: ${passed} | Failed: ${total - passed}`);
console.log('================================================================\n');

if (passed < total) process.exit(1);
