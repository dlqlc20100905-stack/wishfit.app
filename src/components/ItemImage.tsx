/* eslint-disable @next/next/no-img-element */
// 몰 이미지는 도메인이 제각각이라 next/image 대신 img를 쓴다.
export function ItemImage({ src, alt, className = "" }: { src: string | null; alt: string; className?: string }) {
  if (!src) {
    return (
      <div className={`flex aspect-square items-center justify-center bg-surface-2 text-xs text-muted ${className}`}>
        이미지 없음
      </div>
    );
  }
  return (
    <img
      src={src}
      alt={alt}
      referrerPolicy="no-referrer"
      loading="lazy"
      className={`aspect-square w-full bg-surface-2 object-cover ${className}`}
    />
  );
}
