import { describe, expect, it } from "vitest";
import { categorize } from "@/lib/categorize";
import { mallFromUrl } from "@/lib/malls";
import { parsePrice } from "@/lib/format";
import { parseProductHtml } from "@/lib/parse";
import { budgetGap, canMakeOutfit } from "@/lib/outfit";

describe("categorize", () => {
  it.each([
    ["오버핏 울 블렌드 코트", "outer"],
    ["옥스포드 셔츠 자켓", "outer"],
    ["와이드 데님 팬츠", "bottom"],
    ["코튼 크루넥 니트", "top"],
    ["레더 로퍼", "shoes"],
    ["나일론 백팩", "bag"],
    ["실버 반지", "etc"],
  ])("%s → %s", (name, expected) => {
    expect(categorize(name)).toBe(expected);
  });
});

describe("mallFromUrl", () => {
  it("knows Korean fashion malls", () => {
    expect(mallFromUrl("https://www.musinsa.com/products/123")).toBe("무신사");
    expect(mallFromUrl("https://product.29cm.co.kr/catalog/1")).toBe("29CM");
    expect(mallFromUrl("https://m.wconcept.co.kr/x")).toBe("W컨셉");
  });
  it("falls back to hostname", () => {
    expect(mallFromUrl("https://shop.example.com/a")).toBe("shop.example.com");
  });
});

describe("parsePrice", () => {
  it("reads won strings", () => {
    expect(parsePrice("59,000원")).toBe(59000);
    expect(parsePrice("129000.00")).toBe(129000);
    expect(parsePrice("")).toBeNull();
    expect(parsePrice("무료")).toBeNull();
  });
});

describe("parseProductHtml", () => {
  it("prefers JSON-LD Product", () => {
    const html = `<html><head>
      <meta property="og:title" content="OG 제목 | 무신사">
      <script type="application/ld+json">{"@context":"https://schema.org","@graph":[{"@type":"Product","name":"울 캐시미어 코트","image":["/img/a.jpg"],"offers":{"@type":"Offer","price":"289000"}}]}</script>
    </head></html>`;
    const item = parseProductHtml(html, "https://www.musinsa.com/products/1");
    expect(item).toMatchObject({
      name: "울 캐시미어 코트",
      price: 289000,
      imageUrl: "https://www.musinsa.com/img/a.jpg",
      mall: "무신사",
      category: "outer",
    });
  });

  it("falls back to og tags in either attribute order", () => {
    const html = `<meta content="스트라이프 셔츠 &amp; 타이" property="og:title">
      <meta property="og:image" content="https://cdn.example.com/s.jpg">
      <meta property="product:price:amount" content="45000">`;
    expect(parseProductHtml(html, "https://shop.example.com/p")).toMatchObject({
      name: "스트라이프 셔츠 & 타이",
      imageUrl: "https://cdn.example.com/s.jpg",
      price: 45000,
      category: "top",
    });
  });

  it("leaves unknown values empty for the user to fill", () => {
    const item = parseProductHtml("<html></html>", "https://shop.example.com/p");
    expect(item.name).toBe("");
    expect(item.price).toBeNull();
    expect(item.imageUrl).toBeNull();
  });
});

describe("outfit rules", () => {
  it("needs three distinct slot categories", () => {
    expect(canMakeOutfit([{ category: "top" }, { category: "top" }, { category: "etc" }, { category: "bottom" }])).toBe(false);
    expect(canMakeOutfit([{ category: "top" }, { category: "bottom" }, { category: "shoes" }])).toBe(true);
  });
  it("compares total with budget", () => {
    expect(budgetGap(420000, 300000)).toBe(-120000);
    expect(budgetGap(100000, null)).toBeNull();
  });
});
