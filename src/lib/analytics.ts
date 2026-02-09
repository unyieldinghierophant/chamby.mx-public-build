// Google Analytics 4 — privacy-first, loaded only after cookie consent

const GA_MEASUREMENT_ID = "G-2FWSZGQXTV";

let gaInitialized = false;

declare global {
  interface Window {
    dataLayer: unknown[];
    gtag: (...args: unknown[]) => void;
  }
}

export function isGALoaded(): boolean {
  return gaInitialized;
}

export function initGA(measurementId: string = GA_MEASUREMENT_ID): void {
  if (gaInitialized) return;
  if (typeof window === "undefined") return;

  // Inject gtag.js script
  const script = document.createElement("script");
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
  document.head.appendChild(script);

  // Initialize dataLayer and gtag
  window.dataLayer = window.dataLayer || [];
  window.gtag = function (...args: unknown[]) {
    window.dataLayer.push(args);
  };
  window.gtag("js", new Date());
  window.gtag("config", measurementId, {
    send_page_view: false, // We send page views manually on route change
  });

  gaInitialized = true;
}

export function trackPageView(path: string): void {
  if (!gaInitialized || !window.gtag) return;
  window.gtag("event", "page_view", { page_path: path });
}

export function trackEvent(
  name: string,
  params?: Record<string, unknown>,
): void {
  if (!gaInitialized || !window.gtag) return;
  window.gtag("event", name, params);
}
