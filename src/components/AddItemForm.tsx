"use client";

import { useRef, useState, useTransition } from "react";
import { categorize } from "@/lib/categorize";
import type { ItemInput } from "@/lib/types";
import { ItemFields } from "./ItemFields";
import { ItemImage } from "./ItemImage";

export function AddItemForm({ action }: { action: (formData: FormData) => Promise<void> }) {
  const [link, setLink] = useState("");
  const [draft, setDraft] = useState<ItemInput | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, startSaving] = useTransition();
  // 사용자가 카테고리를 직접 고르기 전까지는 상품명을 고칠 때마다 다시 분류한다.
  const categoryTouched = useRef(false);

  async function fetchInfo(raw: string) {
    if (!raw.trim()) return;
    setLoading(true);
    setNotice(null);
    try {
      const res = await fetch("/api/parse", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ url: raw }),
      });
      const data = await res.json();
      if (!data.item) {
        setNotice(data.error ?? "정보를 불러오지 못했어요");
        return;
      }
      categoryTouched.current = false;
      setDraft(data.item);
      if (!data.ok || !data.item.name || data.item.price == null) {
        setNotice("일부 정보를 자동으로 못 가져왔어요. 빈 칸을 채워 주세요.");
      }
    } finally {
      setLoading(false);
    }
  }

  async function pasteFromClipboard() {
    try {
      const text = await navigator.clipboard.readText();
      setLink(text);
      await fetchInfo(text);
    } catch {
      setNotice("클립보드를 읽을 수 없어요. 링크를 직접 붙여넣어 주세요.");
    }
  }

  return (
    <section className="card p-4">
      <h2 className="font-semibold">상품 담기</h2>
      <form
        className="mt-3 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          fetchInfo(link);
        }}
      >
        <input
          value={link}
          onChange={(e) => setLink(e.target.value)}
          placeholder="쇼핑몰 상품 링크 붙여넣기"
          className="input"
          inputMode="url"
        />
        <button className="btn-primary shrink-0" disabled={loading}>{loading ? "불러오는 중" : "불러오기"}</button>
      </form>
      <button type="button" onClick={pasteFromClipboard} className="mt-2 text-sm text-accent">
        복사한 링크 바로 붙여넣기
      </button>
      {notice && <p className="mt-3 text-sm text-muted">{notice}</p>}

      {draft && (
        <form
          key={draft.url}
          className="mt-4 flex flex-col gap-4 sm:flex-row"
          onChange={(e) => {
            const el = e.target as unknown as HTMLInputElement;
            if (el.name === "category") categoryTouched.current = true;
            if (el.name === "name" && !categoryTouched.current) {
              const select = el.form?.elements.namedItem("category") as HTMLSelectElement | null;
              if (select) select.value = categorize(el.value);
            }
          }}
          action={(fd) =>
            startSaving(async () => {
              await action(fd);
              setDraft(null);
              setLink("");
              setNotice(null);
            })
          }
        >
          <div className="w-28 shrink-0 overflow-hidden rounded-xl">
            <ItemImage src={draft.imageUrl} alt={draft.name} />
          </div>
          <div className="flex-1 space-y-3">
            <p className="text-xs text-muted">{draft.mall}</p>
            <ItemFields item={draft} />
            <div className="flex gap-2">
              <button className="btn-primary" disabled={saving}>{saving ? "담는 중" : "리스트에 담기"}</button>
              <button type="button" className="btn-secondary" onClick={() => setDraft(null)}>취소</button>
            </div>
          </div>
        </form>
      )}
    </section>
  );
}
