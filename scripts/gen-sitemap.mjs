// Genera public/sitemap.xml en build time con la flota real de la API.
// Si la API no responde (build offline), escribe el sitemap base sin romper el build.
import { writeFileSync } from 'node:fs';
import { CITY_PAGES } from '../src/cities.js';

const BASE = 'https://domirentcar.com';
const API = 'https://api.domirentcar.com/api/vehicles';

// Mismo slugify de src/App.jsx — los paths deben coincidir
const slugify = (s) => (s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
  .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

let vehiclePaths = [];
try {
  const res = await fetch(API, { signal: AbortSignal.timeout(15000) });
  const vehicles = await res.json();
  vehiclePaths = vehicles.map(v => `/vehiculo/${slugify(v.name)}`);
  console.log(`[sitemap] ${vehicles.length} vehículos desde la API`);
} catch (e) {
  console.warn(`[sitemap] API no disponible (${e.message}) — sitemap base sin vehículos`);
}

const today = new Date().toISOString().slice(0, 10);
const entry = (path, priority) => `  <url>
    <loc>${BASE}${path}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>${priority}</priority>
  </url>`;

const urls = [
  entry('/', '1.0'),
  ...Object.keys(CITY_PAGES).map(slug => entry(`/${slug}`, '0.9')),
  entry('/nosotros', '0.6'),
  ...vehiclePaths.map(p => entry(p, '0.7')),
];

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join('\n')}
</urlset>
`;

writeFileSync(new URL('../public/sitemap.xml', import.meta.url), xml);
console.log(`[sitemap] ${urls.length} URLs → public/sitemap.xml`);
