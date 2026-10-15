"use client";

import { useState } from "react";
import Script from "next/script";
import { recordShare } from "@/app/actions";

declare global {
  interface Window {
    Kakao?: {
      isInitialized(): boolean;
      init(key: string): void;
      Share: { sendDefault(opts: unknown): void };
    };
  }
}

const KAKAO_KEY = process.env.NEXT_PUBLIC_KAKAO_JS_KEY;

export function ShareButton(props: { path: string; title: string; description: string; imageUrl?: string | null; refId: string }) {
  const [copied, setCopied] = useState(false);

  async function share() {
    const url = new URL(props.path, window.location.origin).toString();
    recordShare(props.refId).catch(() => {});

    const kakao = window.Kakao;
    if (KAKAO_KEY && kakao) {
      if (!kakao.isInitialized()) kakao.init(KAKAO_KEY);
      kakao.Share.sendDefault({
        objectType: "feed",
        content: {
          title: props.title,
          description: props.description,
          imageUrl: props.imageUrl ?? new URL("/og.png", window.location.origin).toString(),
          link: { mobileWebUrl: url, webUrl: url },
        },
        buttons: [{ title: "보러 가기", link: { mobileWebUrl: url, webUrl: url } }],
      });
      return;
    }
    if (navigator.share) {
      try {
        await navigator.share({ title: props.title, text: props.description, url });
        return;
      } catch {
        // 공유 창을 닫으면 링크 복사로 넘어간다.
      }
    }
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <>
      {KAKAO_KEY && (
        <Script src="https://t1.kakaocdn.net/kakao_js_sdk/2.7.4/kakao.min.js" strategy="lazyOnload" crossOrigin="anonymous" />
      )}
      <button type="button" onClick={share} className="btn-primary">
        {copied ? "링크를 복사했어요" : KAKAO_KEY ? "카톡으로 공유" : "공유하기"}
      </button>
    </>
  );
}
