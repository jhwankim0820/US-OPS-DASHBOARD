# US Ops Dashboard — CLAUDE.md

FuriosaAI 미국 영업 운영 대시보드. Deal 파이프라인 현황, 재고, POC 배포 계획, 배송 추적, 재무 현황을 관리한다.

## 프로젝트 기본 정보

- **프로덕션 URL:** https://us-ops-dashboard-five.vercel.app/
- **로컬 작업 경로:** `C:\Users\jihwa\us-ops-dashboard` (이 폴더에서만 작업)
- **GitHub 레포:** `jhwankim0820/US-OPS-DASHBOARD` (이 레포만 사용)
- **Vercel 팀:** `us-operations`
- **스택:** Next.js 16 (App Router), TypeScript, Prisma v7, PostgreSQL (Supabase), Tailwind CSS v4, Recharts

## 로컬 개발 시작

```bash
git clone https://github.com/jhwankim0820/US-OPS-DASHBOARD
cd US-OPS-DASHBOARD
npm install
vercel link          # Vercel 프로젝트 연결 (us-operations/us-ops-dashboard)
vercel env pull .env # 환경변수 다운로드
npm run dev
```

## 배포

```bash
git add .
git commit -m "..."
git push origin main   # → Vercel 자동 프로덕션 배포 트리거
```

## 프로젝트 구조

```
src/
  app/
    page.tsx                   # Dashboard 메인 (/)
    projects/page.tsx          # Project Management (deal 목록, Google Sheets)
    projects/[dmdId]/page.tsx  # Deal 상세
    shipments/page.tsx         # Shipments
    financials/page.tsx        # Key Financials (분기별 P&L)
  components/
    dashboard/
      StatCards.tsx            # KPI 카드 (cards/servers 출하율 + pipeline by stage)
      DealStatusFlow.tsx       # Deal 파이프라인 칸반 보드
      InventorySection.tsx     # 재고 도넛 차트
      PocAllocationSection.tsx # 영업 담당자별 POC 칩 배포 계획
      DonutChart.tsx           # 공용 도넛 차트
    deals/
      ShipmentForm.tsx         # 배송 등록 폼 (projects/[dmdId]에서 사용)
      TrackingCard.tsx         # 배송 추적 카드 (projects/[dmdId]에서 사용)
    shipments/
      ShipmentsTable.tsx       # 배송 목록 테이블
      ShipmentTracker.tsx      # 배송 추적기
    layout/
      Navbar.tsx               # 상단 네비게이션 (Dashboard / Project Management / Shipments / Key Financials)
    shared/
      FilterBar.tsx            # 상단 필터 (Status, Region, Owner, Date)
      MultiSelect.tsx          # 다중 선택 드롭다운
      DatePicker.tsx           # 날짜 선택기
```

## 데이터 소스 (하이브리드)

이 앱은 **두 개의 데이터 소스**를 함께 쓴다. 화면/작업마다 소스가 다르니 주의.

| 화면 / 작업 | 소스 |
|---|---|
| `/` (대시보드), `/projects`, `/financials` — deal 데이터 읽기 | **Google Sheets** (`getDeals()` in `src/lib/sheets.ts`, `unstable_cache`) |
| `/shipments`, `/projects/[dmdId]` — 배송/상세 읽기 | **Postgres** (Prisma) |
| 배송 생성/상태 동기화 (`src/actions/shipments.ts`) | **Postgres** (Server Action, `$transaction`) |
| 시트 배송 기록 (`addShipment`), 인보이스 (`appendInvoiceRow` / `updateDealStatus`) | **Google Sheets** |
| 인보이스 문서/메일 (Drive/Gmail) | Google Drive / Gmail (부수효과) |

- Sheets 인증: 서비스 계정 (`GOOGLE_SERVICE_ACCOUNT_JSON`), 스프레드시트는 `GOOGLE_SPREADSHEET_ID`. **서비스 계정 키는 서버에서만 사용, 절대 클라이언트로 노출 금지.**
- Sheets의 deal 식별자는 행 기반 합성값(`SHT-001`)이고, Postgres deal은 `DMD-xx`로 서로 다르다.

## 감사 로그 규칙 (필수)

모든 데이터 쓰기는 `AuditLog`(Postgres)에 기록한다. 헬퍼: `src/lib/audit.ts`.

1. **Postgres 쓰기** — 변경과 **동일 `prisma.$transaction` 안에서** `logAudit(tx, ...)` 호출 (원자적). 예: `src/actions/shipments.ts`.
2. **Sheets 쓰기** — 시트는 트랜잭션이 없으므로, append/update **성공 직후** `logAuditSafe(...)` (best-effort, `source: 'sheets'`). 로그 실패는 삼켜서 시트 쓰기 자체는 성공시킨다.
3. **`revenue` 필드는 변경 액션에서 제외** — 재무 수치는 변경 플로우 밖에서 관리.
4. **미인증 사용자 쓰기 차단** — 인증 레이어 추가 시 각 쓰기 진입점에서 검증 (현재 `actor`는 `'system'` 고정).
5. 새 쓰기 경로를 추가하면 **반드시 감사 로그를 함께 추가**한다.

최근 활동은 대시보드(`/`) 하단 `RecentActivity` 컴포넌트가 표시한다. 이 컴포넌트는 Postgres를 읽지만 **try/catch로 격리**돼 있어, DB 장애 시에도 Sheets 기반 대시보드가 죽지 않는다.

## 데이터 모델

**Deal** — 핵심 영업 단위
- `dmdId`: 고유 식별자 (e.g. `DMD-001`)
- `status`: `Demand` | `Confirmed` | `Waiting for Delivery` | `SUBMITTED` | `Delivered` | `Cancelled/Lost`
- `formFactor`: `Card Only` | `Custom System` | `Rack Server` | `Workstation`
- `category`: `B2B` | `B2G` | `Internal` | `Rental`
- `cards`, `servers`: 수량
- `revenue`: USD (Float)
- `owner`: 영업 담당자명

**Shipment** — Deal에 연결된 배송 정보
- `dmdId` → `Deal.dmdId` FK
- `status`: `SUBMITTED` | `IN_TRANSIT` | `DELIVERED`

## 빌드 주의사항

- `src/generated/prisma`는 `.gitignore` 처리됨 → build 스크립트가 자동 생성
- **build 스크립트: `prisma migrate deploy && prisma generate && next build`** → 배포 시 미적용 마이그레이션이 자동 반영된다. 스키마 변경 시 로컬에서 `prisma migrate dev`로 마이그레이션 파일을 만들어 **커밋**하면 다음 배포에서 적용됨.
- 환경변수: `DATABASE_URL`(앱 런타임, transaction pooler `6543` + `pgbouncer=true`), `DIRECT_URL`(마이그레이션용 session pooler `5432`). `prisma.config.ts`가 마이그레이션에 `DIRECT_URL`을 사용한다.
- Sheets용: `GOOGLE_SERVICE_ACCOUNT_JSON`, `GOOGLE_SPREADSHEET_ID`. 배송 mock: `FEDEX_USE_MOCK=true`.

@AGENTS.md
