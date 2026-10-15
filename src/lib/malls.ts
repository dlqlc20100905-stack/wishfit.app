const MALLS: [string, string][] = [
  ["musinsa.com", "무신사"],
  ["29cm.co.kr", "29CM"],
  ["zigzag.kr", "지그재그"],
  ["wconcept.co.kr", "W컨셉"],
  ["ably.co.kr", "에이블리"],
  ["a-bly.com", "에이블리"],
  ["kream.co.kr", "KREAM"],
  ["coupang.com", "쿠팡"],
  ["smartstore.naver.com", "네이버 스마트스토어"],
  ["brand.naver.com", "네이버 브랜드스토어"],
  ["ssg.com", "SSG"],
  ["lotteon.com", "롯데ON"],
  ["hfashionmall.com", "H패션몰"],
  ["ssfshop.com", "SSF샵"],
  ["ssense.com", "SSENSE"],
  ["farfetch.com", "FARFETCH"],
  ["mytheresa.com", "MYTHERESA"],
  ["matchesfashion.com", "MATCHES"],
];

export function mallFromUrl(url: string): string {
  let host: string;
  try {
    host = new URL(url).hostname.replace(/^www\.|^m\./, "");
  } catch {
    return "기타";
  }
  const hit = MALLS.find(([domain]) => host === domain || host.endsWith("." + domain));
  return hit ? hit[1] : host;
}
