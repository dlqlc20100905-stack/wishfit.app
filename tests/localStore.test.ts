import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { beforeEach, describe, expect, it, vi } from "vitest";

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "wish-"));
vi.spyOn(process, "cwd").mockReturnValue(tmp);
const { localStore: store } = await import("@/lib/store/local");

const item = (name: string, category: "top" | "bottom" | "shoes", price: number) => ({
  url: "https://shop.example.com/" + name,
  mall: "샵",
  name,
  imageUrl: null,
  price,
  category,
});

describe("localStore", () => {
  beforeEach(() => fs.rmSync(path.join(tmp, ".data"), { recursive: true, force: true }));

  it("blocks double reservations and hides reserver from other viewers", async () => {
    await store.ensureUser("owner", "빛");
    const w = await store.createWishlist("owner", { title: "생일", occasionDate: null });
    const a = await store.addItem("owner", w.id, item("셔츠", "top", 50000));

    expect(await store.reserve(w.shareToken, a.id, "민수", "hashA")).toBe("ok");
    expect(await store.reserve(w.shareToken, a.id, "지영", "hashB")).toBe("already_reserved");

    const forA = await store.getSharedWishlist(w.shareToken, "hashA");
    const forB = await store.getSharedWishlist(w.shareToken, "hashB");
    expect(forA!.items[0]).toMatchObject({ reserved: true, reservedByViewer: true });
    expect(forB!.items[0]).toMatchObject({ reserved: true, reservedByViewer: false });
    expect(JSON.stringify(forB)).not.toContain("민수");

    // 다른 사람의 비밀값으로는 취소할 수 없다
    await store.cancelReservation(w.shareToken, a.id, "hashB");
    expect((await store.getSharedWishlist(w.shareToken, null))!.items[0].reserved).toBe(true);
    await store.cancelReservation(w.shareToken, a.id, "hashA");
    expect((await store.getSharedWishlist(w.shareToken, null))!.items[0].reserved).toBe(false);
  });

  it("rejects reserving an item through another list's token", async () => {
    await store.ensureUser("u1", "a");
    const w1 = await store.createWishlist("u1", { title: "1", occasionDate: null });
    const w2 = await store.createWishlist("u1", { title: "2", occasionDate: null });
    const a = await store.addItem("u1", w1.id, item("셔츠", "top", 1));
    expect(await store.reserve(w2.shareToken, a.id, "x", "h")).toBe("not_found");
  });

  it("only lets owners touch their items and outfits", async () => {
    await store.ensureUser("u1", "a");
    const w = await store.createWishlist("u1", { title: "1", occasionDate: null });
    const top = await store.addItem("u1", w.id, item("셔츠", "top", 50000));
    const bottom = await store.addItem("u1", w.id, item("팬츠", "bottom", 70000));
    await expect(store.addItem("intruder", w.id, item("x", "top", 1))).rejects.toThrow();

    await store.deleteItem("intruder", top.id);
    expect(await store.listItems("u1")).toHaveLength(2);

    const outfit = await store.createOutfit("u1", "주말", [
      { slot: "top", itemId: top.id },
      { slot: "bottom", itemId: bottom.id },
    ]);
    expect(outfit.total).toBe(120000);
    const foreign = await store.createOutfit("intruder", "x", [{ slot: "top", itemId: top.id }]);
    expect(foreign.items).toHaveLength(0);

    const shared = await store.getSharedOutfit(outfit.shareToken);
    expect(shared!.outfit.items.map((i) => i.slot)).toEqual(["top", "bottom"]);
  });
});
