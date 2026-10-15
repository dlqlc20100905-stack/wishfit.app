import type { Category } from "./types";

// 상품명 키워드 사전. 앞에 있는 카테고리가 우선한다(예: "셔츠 자켓"은 아우터).
const DICTIONARY: [Exclude<Category, "etc">, string[]][] = [
  ["bag", ["가방", "백팩", "토트", "숄더백", "크로스백", "클러치", "에코백", "파우치", "bag", "backpack", "tote"]],
  ["shoes", ["신발", "스니커즈", "운동화", "로퍼", "부츠", "샌들", "슬리퍼", "구두", "뮬", "힐", "더비", "sneaker", "shoe", "boot", "loafer"]],
  ["outer", ["코트", "자켓", "재킷", "점퍼", "패딩", "가디건", "카디건", "블레이저", "바람막이", "아우터", "야상", "무스탕", "베스트", "coat", "jacket", "parka", "cardigan", "blazer"]],
  ["bottom", ["팬츠", "바지", "슬랙스", "청바지", "데님 팬츠", "진", "스커트", "치마", "쇼츠", "반바지", "조거", "레깅스", "pants", "jeans", "skirt", "shorts", "trousers"]],
  ["top", ["셔츠", "티셔츠", "반팔", "긴팔", "니트", "스웨터", "맨투맨", "후드", "블라우스", "탑", "나시", "슬리브리스", "스웨트", "원피스", "shirt", "tee", "knit", "sweater", "hoodie", "blouse", "top"]],
];

export function categorize(name: string): Category {
  const n = name.toLowerCase();
  for (const [category, words] of DICTIONARY) {
    if (words.some((w) => n.includes(w))) return category;
  }
  return "etc";
}
