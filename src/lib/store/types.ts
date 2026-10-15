import type { EventType, Item, ItemInput, Outfit, SharedItem, Slot, User, Wishlist } from "../types";

export type ReserveResult = "ok" | "already_reserved" | "not_found";

export interface Store {
  getUser(id: string): Promise<User | null>;
  ensureUser(id: string, nickname: string, kakaoId?: string | null): Promise<User>;
  updateUser(id: string, patch: Partial<Pick<User, "nickname" | "monthlyBudget">>): Promise<void>;

  listWishlists(userId: string): Promise<(Wishlist & { itemCount: number })[]>;
  createWishlist(userId: string, input: { title: string; occasionDate: string | null }): Promise<Wishlist>;
  getWishlist(userId: string, id: string): Promise<Wishlist | null>;
  deleteWishlist(userId: string, id: string): Promise<void>;

  /** 주인용 목록. 예약 정보는 절대 포함하지 않는다. */
  listItems(userId: string, wishlistId?: string): Promise<Item[]>;
  addItem(userId: string, wishlistId: string, input: ItemInput): Promise<Item>;
  updateItem(userId: string, id: string, patch: Partial<ItemInput>): Promise<void>;
  deleteItem(userId: string, id: string): Promise<void>;
  getItem(id: string): Promise<Item | null>;

  /** 공유 링크로 보는 리스트. viewerSecretHash가 예약한 상품은 reservedByViewer로 표시한다. */
  getSharedWishlist(
    token: string,
    viewerSecretHash: string | null,
  ): Promise<{ wishlist: Wishlist; ownerNickname: string; items: SharedItem[] } | null>;
  reserve(token: string, itemId: string, reserverName: string, secretHash: string): Promise<ReserveResult>;
  cancelReservation(token: string, itemId: string, secretHash: string): Promise<void>;

  listOutfits(userId: string): Promise<Outfit[]>;
  createOutfit(userId: string, title: string, picks: { slot: Slot; itemId: string }[]): Promise<Outfit>;
  deleteOutfit(userId: string, id: string): Promise<void>;
  getSharedOutfit(token: string): Promise<{ outfit: Outfit; ownerNickname: string } | null>;

  logEvent(type: EventType, refId: string | null): Promise<void>;
}
