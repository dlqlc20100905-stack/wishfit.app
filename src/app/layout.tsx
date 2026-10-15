import type { Metadata, Viewport } from "next";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import "./globals.css";

export const metadata: Metadata = {
  title: "wishfit · 통합 위시리스트",
  description: "어느 쇼핑몰 상품이든 링크로 담고, 코디로 맞춰 보고, 친구에게 선물받는 패션 위시리스트",
};

export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#e8573f" };

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  return (
    <html lang="ko">
      <head>
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css"
        />
      </head>
      <body className="min-h-dvh font-sans antialiased">
        <header className="sticky top-0 z-10 border-b border-border bg-bg/90 backdrop-blur">
          <nav className="mx-auto flex h-14 max-w-3xl items-center gap-4 px-4 text-sm">
            <Link href={user ? "/wishlists" : "/"} className="text-base font-bold text-accent">
              wishfit
            </Link>
            {user && (
              <>
                <Link href="/wishlists" className="text-muted hover:text-text">위시리스트</Link>
                <Link href="/outfits" className="text-muted hover:text-text">코디</Link>
                <Link href="/settings" className="ml-auto text-muted hover:text-text">{user.nickname}</Link>
              </>
            )}
            {!user && (
              <Link href="/login" className="ml-auto font-medium">로그인</Link>
            )}
          </nav>
        </header>
        {children}
      </body>
    </html>
  );
}
