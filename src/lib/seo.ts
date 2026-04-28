import { useEffect } from "react";

type SeoOptions = {
  title: string;
  description: string;
  path: string;
  // Optional per-route schema.org JSON-LD. Injected as a dedicated <script>
  // tag so it doesn't collide with the global structured data in index.html.
  jsonLd?: object;
};

const SITE = "https://chamby.mx";
const ROUTE_JSONLD_ID = "route-jsonld";

function setMeta(selector: string, attr: "name" | "property", key: string, value: string) {
  let el = document.head.querySelector<HTMLMetaElement>(selector);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute("content", value);
}

function setLink(rel: string, href: string) {
  let el = document.head.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`);
  if (!el) {
    el = document.createElement("link");
    el.setAttribute("rel", rel);
    document.head.appendChild(el);
  }
  el.setAttribute("href", href);
}

function setRouteJsonLd(data: object | undefined) {
  const existing = document.getElementById(ROUTE_JSONLD_ID);
  if (!data) {
    existing?.remove();
    return;
  }
  if (existing) {
    existing.textContent = JSON.stringify(data);
    return;
  }
  const el = document.createElement("script");
  el.id = ROUTE_JSONLD_ID;
  el.type = "application/ld+json";
  el.textContent = JSON.stringify(data);
  document.head.appendChild(el);
}

export function useSeo({ title, description, path, jsonLd }: SeoOptions) {
  useEffect(() => {
    const url = `${SITE}${path}`;
    document.title = title;
    setMeta(`meta[name="description"]`, "name", "description", description);
    setLink("canonical", url);
    setMeta(`meta[property="og:title"]`, "property", "og:title", title);
    setMeta(`meta[property="og:description"]`, "property", "og:description", description);
    setMeta(`meta[property="og:url"]`, "property", "og:url", url);
    setMeta(`meta[name="twitter:title"]`, "name", "twitter:title", title);
    setMeta(`meta[name="twitter:description"]`, "name", "twitter:description", description);
    setRouteJsonLd(jsonLd);
  }, [title, description, path, jsonLd]);
}
