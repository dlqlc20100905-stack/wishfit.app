import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { newShareToken } from "../tokens";
import type { Category, Item, Outfit, Slot, User, Wishlist } from "../types";
import type { Store } from "./types";

/* eslint-disable @typescript-eslint/no-explicit-any */
type Row = Record<string, any>;

let client: SupabaseClient | null = null;
function db(): SupabaseClient {
  client ??= createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return client;
}

function check<T>(res: { data: T; error: { message: string } | null }): T {
  if (res.error) throw new Error(res.error.message);
  return res.data;
}

const toUser = (r: Row): User => ({ id: r.id, nickname: r.nickname, monthlyBudget: r.monthly_budget });
const toWishlist = (r: Row): Wishlist => ({
  id: r.id,
  userId: r.user_id,
  title: r.title,
  occasionDate: r.occasion_date,
  shareToken: r.share_token,
  createdAt: r.created_at,
});
const toItem = (r: Row): Item => ({
  id: r.id,
  userId: r.user_id,
  wishlistId: r.wishlist_id,
  url: r.url,
  mall: r.mall,
  name: r.name,
  imageUrl: r.image_url,
  price: r.price,
  category: r.category as Category,
  createdAt: r.created_at,
});
const toOutfit = (r: Row): Outfit => ({
  id: r.id,
  userId: r.user_id,
  title: r.title,
  total: r.total,
  shareToken: r.share_token,
  createdAt: r.created_at,
  items: ((r.outfit_items ?? []) as Row[])
    .filter((oi) => oi.items)
    .map((oi) => ({ ...toItem(oi.items), slot: oi.slot as Slot })),
});

function itemPatch(p: Partial<Item>): Row {
  const out: Row = {};
  if (p.url !== undefined) out.url = p.url;
  if (p.mall !== undefined) out.mall = p.mall;
  if (p.name !== undefined) out.name = p.name;
  if (p.imageUrl !== undefined) out.image_url = p.imageUrl;
  if (p.price !== undefined) out.price = p.price;
  if (p.category !== undefined) out.category = p.category;
  return out;
}

const OUTFIT_SELECT = "*, outfit_items(slot, items(*))";

export const supabaseStore: Store = {
  async getUser(id) {
    const row = check(await db().from("users").select("*").eq("id", id).maybeSingle());
    return row ? toUser(row) : null;
  },
  async ensureUser(id, nickname, kakaoId) {
    const existing = await this.getUser(id);
    if (existing) return existing;
    const row = check(
      await db().from("users").insert({ id, nickname, kakao_id: kakaoId ?? null }).select().single(),
    );
    return toUser(row);
  },
  async updateUser(id, patch) {
    const row: Row = {};
    if (patch.nickname !== undefined) row.nickname = patch.nickname;
    if (patch.monthlyBudget !== undefined) row.monthly_budget = patch.monthlyBudget;
    check(await db().from("users").update(row).eq("id", id));
  },

  async listWishlists(userId) {
    const rows = check(
      await db()
        .from("wishlists")
        .select("*, items(count)")
        .eq("user_id", userId)
        .order("created_at", { ascending: false }),
    ) as Row[];
    return rows.map((r) => ({ ...toWishlist(r), itemCount: r.items?.[0]?.count ?? 0 }));
  },
  async createWishlist(userId, input) {
    const row = check(
      await db()
        .from("wishlists")
        .insert({ user_id: userId, title: input.title, occasion_date: input.occasionDate, share_token: newShareToken() })
        .select()
        .single(),
    );
    return toWishlist(row);
  },
  async getWishlist(userId, id) {
    const row = check(await db().from("wishlists").select("*").eq("id", id).eq("user_id", userId).maybeSingle());
    return row ? toWishlist(row) : null;
  },
  async deleteWishlist(userId, id) {
    check(await db().from("wishlists").delete().eq("id", id).eq("user_id", userId));
  },

  async listItems(userId, wishlistId) {
    let q = db().from("items").select("*").eq("user_id", userId);
    if (wishlistId) q = q.eq("wishlist_id", wishlistId);
    return (check(await q.order("created_at", { ascending: false })) as Row[]).map(toItem);
  },
  async addItem(userId, wishlistId, input) {
    if (!(await this.getWishlist(userId, wishlistId))) throw new Error("not found");
    const row = check(
      await db()
        .from("items")
        .insert({ user_id: userId, wishlist_id: wishlistId, mall: input.mall ?? "기타", ...itemPatch(input) })
        .select()
        .single(),
    );
    return toItem(row);
  },
  async updateItem(userId, id, patch) {
    check(await db().from("items").update(itemPatch(patch)).eq("id", id).eq("user_id", userId));
  },
  async deleteItem(userId, id) {
    check(await db().from("items").delete().eq("id", id).eq("user_id", userId));
  },
  async getItem(id) {
    const row = check(await db().from("items").select("*").eq("id", id).maybeSingle());
    return row ? toItem(row) : null;
  },

  async getSharedWishlist(token, viewerSecretHash) {
    const w = check(await db().from("wishlists").select("*").eq("share_token", token).maybeSingle());
    if (!w) return null;
    const [owner, itemRows] = await Promise.all([
      this.getUser(w.user_id),
      db()
        .from("items")
        .select("*, reservations(secret_hash)")
        .eq("wishlist_id", w.id)
        .order("created_at", { ascending: false })
        .then(check),
    ]);
    const items = (itemRows as Row[]).map((r) => {
      const res = Array.isArray(r.reservations) ? r.reservations[0] : r.reservations;
      return { ...toItem(r), reserved: !!res, reservedByViewer: !!res && res.secret_hash === viewerSecretHash };
    });
    return { wishlist: toWishlist(w), ownerNickname: owner?.nickname ?? "친구", items };
  },
  async reserve(token, itemId, reserverName, secretHash) {
    const w = check(await db().from("wishlists").select("id").eq("share_token", token).maybeSingle());
    if (!w) return "not_found";
    const item = check(
      await db().from("items").select("id").eq("id", itemId).eq("wishlist_id", w.id).maybeSingle(),
    );
    if (!item) return "not_found";
    const { error } = await db()
      .from("reservations")
      .insert({ item_id: itemId, reserver_name: reserverName, secret_hash: secretHash });
    if (error?.code === "23505") return "already_reserved";
    if (error) throw new Error(error.message);
    return "ok";
  },
  async cancelReservation(token, itemId, secretHash) {
    const w = check(await db().from("wishlists").select("id").eq("share_token", token).maybeSingle());
    if (!w) return;
    const item = check(
      await db().from("items").select("id").eq("id", itemId).eq("wishlist_id", w.id).maybeSingle(),
    );
    if (!item) return;
    check(await db().from("reservations").delete().eq("item_id", itemId).eq("secret_hash", secretHash));
  },

  async listOutfits(userId) {
    const rows = check(
      await db().from("outfits").select(OUTFIT_SELECT).eq("user_id", userId).order("created_at", { ascending: false }),
    ) as Row[];
    return rows.map(toOutfit);
  },
  async createOutfit(userId, title, picks) {
    const ids = picks.map((p) => p.itemId);
    const owned = (
      ids.length ? (check(await db().from("items").select("id, price").eq("user_id", userId).in("id", ids)) as Row[]) : []
    ) as Row[];
    const valid = picks.filter((p) => owned.some((o) => o.id === p.itemId));
    const total = valid.reduce((s, p) => s + (owned.find((o) => o.id === p.itemId)?.price ?? 0), 0);
    const outfit = check(
      await db()
        .from("outfits")
        .insert({ user_id: userId, title, total, share_token: newShareToken() })
        .select()
        .single(),
    );
    if (valid.length) {
      check(
        await db()
          .from("outfit_items")
          .insert(valid.map((p) => ({ outfit_id: outfit.id, item_id: p.itemId, slot: p.slot }))),
      );
    }
    const full = check(await db().from("outfits").select(OUTFIT_SELECT).eq("id", outfit.id).single());
    return toOutfit(full);
  },
  async deleteOutfit(userId, id) {
    check(await db().from("outfits").delete().eq("id", id).eq("user_id", userId));
  },
  async getSharedOutfit(token) {
    const row = check(await db().from("outfits").select(OUTFIT_SELECT).eq("share_token", token).maybeSingle());
    if (!row) return null;
    const owner = await this.getUser(row.user_id);
    return { outfit: toOutfit(row), ownerNickname: owner?.nickname ?? "친구" };
  },

  async logEvent(type, refId) {
    await db().from("events").insert({ type, ref_id: refId });
  },
};
