import { categorize } from "./categorize";
import { mallFromUrl } from "./malls";
import { parsePrice } from "./format";
import type { ItemInput } from "./types";

function decodeEntities(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&#x27;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
    .trim();
}

function metaContent(html: string, keys: string[]): string | null {
  for (const key of keys) {
    const k = key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const patterns = [
      new RegExp(`<meta[^>]+(?:property|name|itemprop)=["']${k}["'][^>]*content=["']([^"']*)["']`, "i"),
      new RegExp(`<meta[^>]+content=["']([^"']*)["'][^>]*(?:property|name|itemprop)=["']${k}["']`, "i"),
    ];
    for (const p of patterns) {
      const m = html.match(p);
      if (m?.[1]) return decodeEntities(m[1]);
    }
  }
  return null;
}

type JsonLdProduct = { name?: string; image?: unknown; offers?: unknown };

function findProduct(node: unknown): JsonLdProduct | null {
  if (!node || typeof node !== "object") return null;
  if (Array.isArray(node)) {
    for (const n of node) {
      const hit = findProduct(n);
      if (hit) return hit;
    }
    return null;
  }
  const obj = node as Record<string, unknown>;
  const type = obj["@type"];
  if (type === "Product" || (Array.isArray(type) && type.includes("Product"))) return obj as JsonLdProduct;
  return findProduct(obj["@graph"]);
}

function jsonLdProduct(html: string): { name?: string; image?: string; price?: number | null } {
  const scripts = html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi);
  for (const [, body] of scripts) {
    try {
      const product = findProduct(JSON.parse(body));
      if (!product) continue;
      const image = Array.isArray(product.image) ? product.image[0] : product.image;
      const offers = Array.isArray(product.offers) ? product.offers[0] : product.offers;
      const offer = offers as { price?: unknown; lowPrice?: unknown } | undefined;
      return {
        name: product.name,
        image: typeof image === "string" ? image : (image as { url?: string } | undefined)?.url,
        price: parsePrice(String(offer?.price ?? offer?.lowPrice ?? "")),
      };
    } catch {
      // 깨진 JSON-LD는 무시
    }
  }
  return {};
}

/** 상품 페이지 HTML에서 이름·이미지·가격을 뽑는다. 못 찾은 값은 null로 두고 사용자가 채운다. */
export function parseProductHtml(html: string, url: string): ItemInput {
  const ld = jsonLdProduct(html);
  const title = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1];
  const name = ld.name ?? metaContent(html, ["og:title", "twitter:title"]) ?? (title ? decodeEntities(title) : "") ?? "";
  const rawImage = ld.image ?? metaContent(html, ["og:image", "og:image:url", "twitter:image"]);
  const price =
    ld.price ??
    parsePrice(metaContent(html, ["product:price:amount", "og:price:amount", "product:sale_price:amount", "price"]));

  let imageUrl: string | null = null;
  if (rawImage) {
    try {
      imageUrl = new URL(rawImage, url).toString();
    } catch {
      imageUrl = null;
    }
  }
  return { url, mall: mallFromUrl(url), name: name.trim(), imageUrl, price, category: categorize(name) };
}
