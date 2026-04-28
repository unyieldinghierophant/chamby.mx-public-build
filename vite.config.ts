import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import prerender from "@prerenderer/rollup-plugin";
import chromium from "@sparticuz/chromium";

// Public, unauthenticated routes that benefit from SEO. Anything behind
// auth (admin, provider portal, active jobs, login, etc.) is intentionally
// excluded — crawlers can't reach those, and prerendering them would just
// snapshot a redirect.
//
// /user-landing is omitted because it's an authenticated dashboard that
// redirects unauthenticated visitors to /. Puppeteer can't snapshot it.
const PRERENDER_ROUTES = [
  "/",
  "/provider-landing",
  "/how-it-works",
  "/about",
  "/blog",
];

// On Vercel build runners we need a Chromium that bundles the system
// shared libraries (libnspr4.so, etc.) that the default headless Chrome
// expects. @sparticuz/chromium ships those. Locally we let Puppeteer use
// its own default Chrome, which works because macOS has the libs.
const isVercel = !!process.env.VERCEL;

// https://vitejs.dev/config/
export default defineConfig(async ({ mode }) => ({
  base: "/",
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
    mode !== "development" && prerender({
      routes: PRERENDER_ROUTES,
      renderer: "@prerenderer/renderer-puppeteer",
      rendererOptions: {
        renderAfterTime: 4000,
        maxConcurrentRoutes: 2,
        headless: true,
        ...(isVercel && {
          launchOptions: {
            args: chromium.args,
            executablePath: await chromium.executablePath(),
          },
        }),
      },
    }),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          "vendor-react":    ["react", "react-dom", "react-router-dom"],
          "vendor-supabase": ["@supabase/supabase-js"],
          "vendor-motion":   ["framer-motion"],
          "vendor-leaflet":  ["leaflet"],
          "vendor-stripe":   ["@stripe/react-stripe-js", "@stripe/stripe-js"],
          "vendor-query":    ["@tanstack/react-query"],
        },
      },
    },
  },
}));
