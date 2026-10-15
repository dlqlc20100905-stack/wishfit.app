import fs from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { newShareToken } from "../tokens";
import type { Item, Outfit, Slot, User, Wishlist } from "../types";
import type { Store } from "./types";

interface Reservation {
  itemId: string;
  reserverName: string;
  secretHash: string;
  createdAt: string;
}
interface OutfitRow extends Omit<Outfit, "items"> {
  picks: { slot: Slot; itemId: string }[];
}
interface Db {
  users: User[];
  wishlists: Wishlist[];
  items: Item[];
  reservations: Reservation[];
  outfits: OutfitRow[];
  events: { type: string; refId: string | null; createdAt: string }[];
}

const FILE = path.join(process.cwd(), ".data", "db.json");

function load(): Db {
  try {
    return JSON.parse(fs.readFileSync(FILE, "utf8")) as Db;
  } catch {
    return { users: [], wishlists: [], items: [], reservations: [], outfits: [], events: [] };
  }
}

function save(db: Db) {
  fs.mkdirSync(path.dirname(FILE), { recursive: true });
  fs.writeFileSync(FILE, JSON.stringify(db, null, 2));
}

function mutate<T>(fn: (db: Db) => T): T {
  const db = load();
  const out = fn(db);
  save(db);
  return out;
}

const now = () => new Date().toISOString();

function hydrateOutfit(db: Db, row: OutfitRow): Outfit {
  const items = row.picks.flatMap(({ slot, itemId }) => {
    const item = db.items.find((i) => i.id === itemId);
    return item ? [{ ...item, slot }] : [];
  });
  const { picks: _picks, ...rest } = row;
  return { ...rest, items };
}

/** 개발·데모용 저장소. 파일 하나에 저장하므로 서버 여러 대에서는 쓰지 않는다. */
export const localStore: Store = {
  async getUser(id) {
    return load().users.find((u) => u.id === id) ?? null;
  },
  async ensureUser(id, nickname) {
    return mutate((db) => {
      let user = db.users.find((u) => u.id === id);
      if (!user) {
        user = { id, nickname, monthlyBudget: null };
        db.users.push(user);
      }
      return user;
    });
  },
  async updateUser(id, patch) {
    mutate((db) => {
      const user = db.users.find((u) => u.id === id);
      if (user) Object.assign(user, patch);
    });
  },

  async listWishlists(userId) {
    const db = load();
    return db.wishlists
      .filter((w) => w.userId === userId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .map((w) => ({ ...w, itemCount: db.items.filter((i) => i.wishlistId === w.id).length }));
  },
  async createWishlist(userId, input) {
    return mutate((db) => {
      const w: Wishlist = { id: randomUUID(), userId, ...input, shareToken: newShareToken(), createdAt: now() };
      db.wishlists.push(w);
      return w;
    });
  },
  async getWishlist(userId, id) {
    return load().wishlists.find((w) => w.id === id && w.userId === userId) ?? null;
  },
  async deleteWishlist(userId, id) {
    mutate((db) => {
      if (!db.wishlists.some((w) => w.id === id && w.userId === userId)) return;
      const itemIds = new Set(db.items.filter((i) => i.wishlistId === id).map((i) => i.id));
      db.wishlists = db.wishlists.filter((w) => w.id !== id);
      db.items = db.items.filter((i) => !itemIds.has(i.id));
      db.reservations = db.reservations.filter((r) => !itemIds.has(r.itemId));
      for (const o of db.outfits) o.picks = o.picks.filter((p) => !itemIds.has(p.itemId));
    });
  },

  async listItems(userId, wishlistId) {
    return load()
      .items.filter((i) => i.userId === userId && (!wishlistId || i.wishlistId === wishlistId))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },
  async addItem(userId, wishlistId, input) {
    return mutate((db) => {
      if (!db.wishlists.some((w) => w.id === wishlistId && w.userId === userId)) throw new Error("not found");
      const item: Item = {
        id: randomUUID(),
        userId,
        wishlistId,
        url: input.url,
        mall: input.mall ?? "기타",
        name: input.name,
        imageUrl: input.imageUrl,
        price: input.price,
        category: input.category,
        createdAt: now(),
      };
      db.items.push(item);
      return item;
    });
  },
  async updateItem(userId, id, patch) {
    mutate((db) => {
      const item = db.items.find((i) => i.id === id && i.userId === userId);
      if (item) Object.assign(item, patch);
    });
  },
  async deleteItem(userId, id) {
    mutate((db) => {
      if (!db.items.some((i) => i.id === id && i.userId === userId)) return;
      db.items = db.items.filter((i) => i.id !== id);
      db.reservations = db.reservations.filter((r) => r.itemId !== id);
      for (const o of db.outfits) o.picks = o.picks.filter((p) => p.itemId !== id);
    });
  },
  async getItem(id) {
    return load().items.find((i) => i.id === id) ?? null;
  },

  async getSharedWishlist(token, viewerSecretHash) {
    const db = load();
    const wishlist = db.wishlists.find((w) => w.shareToken === token);
    if (!wishlist) return null;
    const owner = db.users.find((u) => u.id === wishlist.userId);
    const items = db.items
      .filter((i) => i.wishlistId === wishlist.id)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .map((i) => {
        const r = db.reservations.find((r) => r.itemId === i.id);
        return { ...i, reserved: !!r, reservedByViewer: !!r && r.secretHash === viewerSecretHash };
      });
    return { wishlist, ownerNickname: owner?.nickname ?? "친구", items };
  },
  async reserve(token, itemId, reserverName, secretHash) {
    return mutate((db) => {
      const wishlist = db.wishlists.find((w) => w.shareToken === token);
      const item = wishlist && db.items.find((i) => i.id === itemId && i.wishlistId === wishlist.id);
      if (!item) return "not_found";
      if (db.reservations.some((r) => r.itemId === itemId)) return "already_reserved";
      db.reservations.push({ itemId, reserverName, secretHash, createdAt: now() });
      return "ok";
    });
  },
  async cancelReservation(token, itemId, secretHash) {
    mutate((db) => {
      const wishlist = db.wishlists.find((w) => w.shareToken === token);
      if (!wishlist || !db.items.some((i) => i.id === itemId && i.wishlistId === wishlist.id)) return;
      db.reservations = db.reservations.filter((r) => !(r.itemId === itemId && r.secretHash === secretHash));
    });
  },

  async listOutfits(userId) {
    const db = load();
    return db.outfits
      .filter((o) => o.userId === userId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .map((o) => hydrateOutfit(db, o));
  },
  async createOutfit(userId, title, picks) {
    return mutate((db) => {
      const owned = picks.filter((p) => db.items.some((i) => i.id === p.itemId && i.userId === userId));
      const total = owned.reduce((sum, p) => sum + (db.items.find((i) => i.id === p.itemId)?.price ?? 0), 0);
      const row: OutfitRow = {
        id: randomUUID(),
        userId,
        title,
        total,
        shareToken: newShareToken(),
        createdAt: now(),
        picks: owned,
      };
      db.outfits.push(row);
      return hydrateOutfit(db, row);
    });
  },
  async deleteOutfit(userId, id) {
    mutate((db) => {
      db.outfits = db.outfits.filter((o) => !(o.id === id && o.userId === userId));
    });
  },
  async getSharedOutfit(token) {
    const db = load();
    const row = db.outfits.find((o) => o.shareToken === token);
    if (!row) return null;
    const owner = db.users.find((u) => u.id === row.userId);
    return { outfit: hydrateOutfit(db, row), ownerNickname: owner?.nickname ?? "친구" };
  },

  async logEvent(type, refId) {
    mutate((db) => {
      db.events.push({ type, refId, createdAt: now() });
    });
  },
};
