import { useEffect } from "react";

type SeoOptions = {
  title: string;
  description: string;
  path: string;
};

const SITE = "https://chamby.mx";

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

export function useSeo({ title, description, path }: SeoOptions) {
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
  }, [title, description, path]);
}
