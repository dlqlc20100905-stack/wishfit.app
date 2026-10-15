# wishfit · 통합 위시리스트

어느 쇼핑몰 상품이든 링크로 담고, 코디로 맞춰 보고, 친구에게 선물받는 패션 위시리스트입니다.
「통합 위시리스트 앱 기획서」의 로드맵 1단계(MVP)와 2단계(코디 보드)를 구현했습니다.

## 기능

| 기능 | 경로 | 내용 |
| --- | --- | --- |
| 통합 담기 | `/wishlists/[id]` | 링크를 붙여넣으면 서버가 JSON-LD·og 태그에서 이름·이미지·가격을 읽음. 실패하면 직접 채우는 화면 |
| 자동 분류 | `src/lib/categorize.ts` | 상품명 키워드 사전으로 아우터·상의·하의·신발·가방 분류, 사용자가 수정 가능 |
| 선물 공유 | `/s/[token]` | 카톡 공유 링크. 친구가 로그인 없이 '내가 살게'로 예약, 상품당 예약 1건. 주인에게는 예약 상태가 안 보임 |
| 코디 보드 | `/outfits/new` | 서로 다른 카테고리 3개 이상 찜하면 열림. 슬롯별로 넘겨 보며 고르고, 총액을 월 예산과 비교 |
| 코디 공유 | `/o/[token]` | 저장한 코디를 링크로 공유, 원본 몰 출처 표시 |
| 지표 기록 | `events` 테이블 | 가입·공유·예약·구매 클릭(`/go/[itemId]`)을 기록해 성공 지표를 계산 |

배경 제거는 라이선스 확인 전이라 넣지 않았고, 기획서의 대체안인 썸네일 격자로 보여줍니다.

## 실행

```bash
npm install
npm run dev      # http://localhost:3000
npm test         # 단위 테스트
npm run build
```

환경 변수가 없으면 **데모 모드**로 실행됩니다. 닉네임만으로 로그인하고 데이터는 `.data/db.json`에 저장됩니다.

## 호스팅(Vercel + Supabase)

호스팅 환경에서는 데모 모드를 쓸 수 없습니다. 아래 순서대로 Supabase를 먼저 준비하세요.

1. **Supabase:** 프로젝트를 만들고 SQL Editor에서 `supabase/migrations/0001_init.sql`을 실행합니다.
   Project Settings > API에서 URL, anon 키, service_role 키를 복사해 둡니다.
2. **Vercel:** Add New > Project에서 이 레포를 가져옵니다(프레임워크는 Next.js로 자동 인식).
   Environment Variables에 다음을 넣고 배포합니다.

   | 변수 | 값 |
   | --- | --- |
   | `NEXT_PUBLIC_SUPABASE_URL` | Supabase URL |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | anon 키 |
   | `SUPABASE_SERVICE_ROLE_KEY` | service_role 키(서버 전용) |
   | `NEXT_PUBLIC_SITE_URL` | 배포 주소, 예: `https://wishfit.app` |
   | `NEXT_PUBLIC_KAKAO_JS_KEY` | 카카오 JavaScript 키(선택, 없으면 링크 복사로 공유) |

3. **카카오 디벨로퍼스:** 앱을 만들고 카카오 로그인을 켭니다.
   - Redirect URI: `https://<프로젝트>.supabase.co/auth/v1/callback`
   - 동의 항목: 닉네임(profile_nickname). 이메일 동의를 받을 수 없는 앱이면 4단계에서 Supabase Kakao 설정의 이메일 없는 사용자 허용 옵션을 켭니다
   - 플랫폼 > Web 사이트 도메인: 배포 주소
4. **Supabase > Authentication > Providers > Kakao:** 카카오 REST API 키와 Client Secret을 넣고 켭니다.
5. **Supabase > Authentication > URL Configuration:** Site URL에 배포 주소, Redirect URLs에 `<배포 주소>/auth/callback`을 넣습니다.
6. **도메인:** Vercel > Settings > Domains에서 `wishfit.app`을 연결하고, 3·5단계 주소도 같은 도메인으로 맞춥니다.

앱 서버는 service role 키로 DB에 접근하며 권한은 서버 코드에서 확인합니다. RLS는 이중 안전장치로, `reservations`에는
정책이 없어 리스트 주인을 포함한 어떤 사용자 키로도 읽을 수 없습니다.

## 구조

```
src/app            화면과 서버 액션
src/components     클라이언트 컴포넌트(링크 담기, 코디 보드, 공유 버튼)
src/lib/store      저장소 인터페이스, Supabase 구현, 로컬 데모 구현
src/lib/parse.ts   상품 페이지 파싱
src/lib/safeFetch.ts  내부망 주소 차단·크기 제한을 둔 서버 fetch
supabase/migrations   DB 스키마
```

## 출시 전 확인할 것

- 주요 패션몰 10곳으로 링크 파싱 성공률 테스트(스크립트로 그리는 몰은 실패할 수 있음)
- 몰 이미지 공개 공유에 대한 법률 확인
- 제휴 링크를 붙일 때 `src/app/go/[itemId]/route.ts`에서 URL 변환, 화면의 제휴 표시 문구 유지
