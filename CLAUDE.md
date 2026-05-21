# US Ops Dashboard — CLAUDE.md

FuriosaAI 미국 영업 운영 대시보드. Deal 파이프라인 현황, 재고, POC 배포 계획, 배송 추적, 재무 현황을 관리한다.

## 프로젝트 기본 정보

- **프로덕션 URL:** https://us-ops-dashboard-five.vercel.app/
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
    deals/page.tsx             # Deals 목록
    deals/[dmdId]/page.tsx     # Deal 상세
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
      DealsTable.tsx           # Deal 목록 테이블
      ShipmentForm.tsx         # 배송 등록 폼
      TrackingCard.tsx         # 배송 추적 카드
    shipments/
      ShipmentsTable.tsx       # 배송 목록 테이블
      ShipmentTracker.tsx      # 배송 추적기
    layout/
      Navbar.tsx               # 상단 네비게이션 (Dashboard / Deals / Shipments / Key Financials)
    shared/
      FilterBar.tsx            # 상단 필터 (Status, Region, Owner, Date)
      MultiSelect.tsx          # 다중 선택 드롭다운
      DatePicker.tsx           # 날짜 선택기
```

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

- `src/generated/prisma`는 `.gitignore` 처리됨 → build 스크립트가 `prisma generate && next build`로 자동 생성
- 스키마 변경 시 `prisma migrate dev` 후 커밋
- 환경변수 `DATABASE_URL` 필수 (Supabase PostgreSQL)

@AGENTS.md
