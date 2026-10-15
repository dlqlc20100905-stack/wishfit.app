export const SLOTS = ["outer", "top", "bottom", "shoes", "bag"] as const;
export type Slot = (typeof SLOTS)[number];
export type Category = Slot | "etc";

export const CATEGORY_LABEL: Record<Category, string> = {
  outer: "아우터",
  top: "상의",
  bottom: "하의",
  shoes: "신발",
  bag: "가방",
  etc: "기타",
};

export interface User {
  id: string;
  nickname: string;
  monthlyBudget: number | null;
}

export interface Wishlist {
  id: string;
  userId: string;
  title: string;
  occasionDate: string | null;
  shareToken: string;
  createdAt: string;
}

export interface Item {
  id: string;
  userId: string;
  wishlistId: string;
  url: string;
  mall: string;
  name: string;
  imageUrl: string | null;
  price: number | null;
  category: Category;
  createdAt: string;
}

export type ItemInput = Pick<Item, "url" | "name" | "imageUrl" | "price" | "category"> & {
  mall?: string;
};

/** 공유 페이지용. 예약자 정보는 담지 않고 예약 여부만 담는다. */
export interface SharedItem extends Item {
  reserved: boolean;
  reservedByViewer: boolean;
}

export interface Outfit {
  id: string;
  userId: string;
  title: string;
  total: number;
  shareToken: string;
  createdAt: string;
  items: (Item & { slot: Slot })[];
}

export type EventType = "share" | "reserve" | "buy_click" | "signup";
