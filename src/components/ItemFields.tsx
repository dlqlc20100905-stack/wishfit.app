import { CATEGORY_LABEL, type Category, type ItemInput } from "@/lib/types";

/** 상품 정보 입력칸. 파싱이 실패하거나 틀렸을 때 사용자가 직접 고친다. */
export function ItemFields({ item }: { item: Partial<ItemInput> }) {
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      <input type="hidden" name="url" value={item.url ?? ""} />
      <label className="text-sm text-muted sm:col-span-2">
        상품명
        <input name="name" defaultValue={item.name ?? ""} required maxLength={200} className="input mt-1" />
      </label>
      <label className="text-sm text-muted">
        가격(원)
        <input name="price" inputMode="numeric" defaultValue={item.price ?? ""} placeholder="예: 59000" className="input mt-1" />
      </label>
      <label className="text-sm text-muted">
        카테고리
        <select name="category" defaultValue={item.category ?? "etc"} className="input mt-1">
          {(Object.keys(CATEGORY_LABEL) as Category[]).map((c) => (
            <option key={c} value={c}>{CATEGORY_LABEL[c]}</option>
          ))}
        </select>
      </label>
      <label className="text-sm text-muted sm:col-span-2">
        이미지 주소
        <input name="imageUrl" type="url" defaultValue={item.imageUrl ?? ""} placeholder="https://" className="input mt-1" />
      </label>
    </div>
  );
}
