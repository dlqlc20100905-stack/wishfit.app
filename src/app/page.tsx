import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";

const FEATURES = [
  { title: "통합 담기", body: "무신사, 29CM, 지그재그, 해외 편집숍까지. 링크만 붙여넣으면 이미지·이름·가격이 저장돼요." },
  { title: "코디 보드", body: "여러 몰에서 찜한 옷을 슬롯에 끼워 맞춰 보고, 코디 총액을 이번 달 예산과 비교해요." },
  { title: "선물 공유", body: "카톡으로 리스트를 보내면 친구가 '내가 살게'로 예약해요. 겹치는 선물이 없어요." },
];

export default async function Home() {
  if (await getCurrentUser()) redirect("/wishlists");
  return (
    <main className="mx-auto max-w-3xl px-4 py-14">
      <h1 className="text-3xl font-bold leading-tight sm:text-4xl">
        뭘 입을지, 정말 살지,
        <br />
        누가 사줄지 정해주는 위시리스트
      </h1>
      <p className="mt-4 text-muted">최저가를 쫓는 대신, 사기 전의 결정과 선물에 집중해요.</p>
      <Link href="/login" className="btn-primary mt-8 px-6">무료로 시작하기</Link>
      <ul className="mt-14 grid gap-4 sm:grid-cols-3">
        {FEATURES.map((f) => (
          <li key={f.title} className="card p-5">
            <h2 className="font-semibold">{f.title}</h2>
            <p className="mt-2 text-sm text-muted">{f.body}</p>
          </li>
        ))}
      </ul>
    </main>
  );
}
