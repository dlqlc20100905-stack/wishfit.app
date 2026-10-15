import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto max-w-sm px-4 py-20 text-center">
      <h1 className="text-xl font-bold">페이지를 찾을 수 없어요</h1>
      <p className="mt-2 text-sm text-muted">링크가 바뀌었거나 삭제된 리스트일 수 있어요.</p>
      <Link href="/" className="btn-secondary mt-6">처음으로</Link>
    </main>
  );
}
