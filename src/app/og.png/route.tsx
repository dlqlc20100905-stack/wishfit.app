import { ImageResponse } from "next/og";

// 상품 이미지가 없는 리스트를 카톡으로 공유할 때 쓰는 기본 이미지
export function GET() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "#e8573f", color: "white", fontSize: 120, fontWeight: 700 }}>
        wishfit
      </div>
    ),
    { width: 800, height: 400 },
  );
}
