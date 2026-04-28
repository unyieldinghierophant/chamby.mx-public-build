import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const SITE = "https://chamby.mx";
const today = new Date().toISOString().slice(0, 10);

// Add new public routes here. Auth-gated routes (/login, /admin, /provider-portal,
// /user-landing, /active-jobs, etc.) are intentionally omitted — crawlers can't
// usefully index them, and including them risks soft-404 warnings in GSC.
const routes = [
  { path: "/",                                   changefreq: "daily",   priority: 1.0 },
  { path: "/provider-landing",                   changefreq: "weekly",  priority: 0.9 },
  { path: "/book-job",                           changefreq: "weekly",  priority: 0.9 },
  { path: "/book-job?category=plomeria",         changefreq: "weekly",  priority: 0.8 },
  { path: "/book-job?category=electricidad",     changefreq: "weekly",  priority: 0.8 },
  { path: "/book-job?category=jardineria",       changefreq: "weekly",  priority: 0.8 },
  { path: "/book-job?category=limpieza",         changefreq: "weekly",  priority: 0.8 },
  { path: "/book-job?category=pintura",          changefreq: "weekly",  priority: 0.8 },
  { path: "/book-job?category=general",          changefreq: "weekly",  priority: 0.8 },
  { path: "/book-job?category=aire-acondicionado", changefreq: "weekly", priority: 0.8 },
  { path: "/how-it-works",                       changefreq: "monthly", priority: 0.8 },
  { path: "/about",                              changefreq: "monthly", priority: 0.7 },
  { path: "/blog",                               changefreq: "weekly",  priority: 0.6 },
  { path: "/help-center",                        changefreq: "monthly", priority: 0.7 },
];

const xmlEscape = (s) => s.replace(/&/g, "&amp;").replace(/'/g, "&apos;");

const body = routes
  .map(({ path, changefreq, priority }) =>
    `  <url>
    <loc>${xmlEscape(SITE + path)}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority.toFixed(1)}</priority>
  </url>`
  )
  .join("\n");

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${body}
</urlset>
`;

const outPath = join(dirname(fileURLToPath(import.meta.url)), "..", "public", "sitemap.xml");
writeFileSync(outPath, xml);
console.log(`sitemap.xml written with ${routes.length} routes, lastmod=${today}`);
