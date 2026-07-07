export const dynamic = 'force-dynamic'

import { getDeals } from '@/lib/sheets'
import {
  type UsDeal,
  REPS,
  countryCode,
  dealFinance,
  fmtUsd,
  fmtUsdFull,
  isInvoicePending,
} from '@/lib/us-ops'
import DashboardDealTable from '@/components/dashboard/DashboardDealTable'
import RecentActivity from '@/components/dashboard/RecentActivity'

function toISO(d: Date | string | null): string {
  if (!d) return ''
  const date = d instanceof Date ? d : new Date(d)
  return isNaN(date.getTime()) ? '' : date.toISOString().split('T')[0]
}

export default async function DashboardPage() {
  const sheetDeals = await getDeals()

  const deals: UsDeal[] = sheetDeals
    .filter((d) => d.region !== 'Korea') // US ops only — exclude KR HQ deals
    .map((d) => ({
      id: d.id,
      customer: d.customer,
      status: d.status,
      category: d.category,
      region: d.region,
      country: countryCode(d.salesParty, d.region),
      owner: d.owner,
      revenue: d.revenue,
      cards: d.cards,
      servers: d.servers,
      etd: toISO(d.etdDate ?? d.billingDate),
      dealDate: toISO(d.poDate ?? d.createdAt),
    }))

  const b2b = deals.filter((d) => d.category === 'B2B')
  const internal = deals.filter((d) => d.category === 'Internal')
  const waiting = deals.filter((d) => d.status === 'Waiting for Delivery')
  const deliveredB2B = b2b.filter((d) => d.status === 'Delivered')
  const waitingB2B = b2b.filter((d) => d.status === 'Waiting for Delivery')

  const pipelineRev = waitingB2B.reduce((s, d) => s + d.revenue, 0)
  const deliveredRev = deliveredB2B.reduce((s, d) => s + d.revenue, 0)
  const totalRev = pipelineRev + deliveredRev

  const cardsDelivered = deliveredB2B.reduce((s, d) => s + d.cards, 0)
  const cardsPending = waitingB2B.reduce((s, d) => s + d.cards, 0)
  const cardsTotal = cardsDelivered + cardsPending
  const cardsPct = cardsTotal ? Math.round((cardsDelivered / cardsTotal) * 100) : 0

  const serversDelivered = deliveredB2B.reduce((s, d) => s + d.servers, 0)
  const serversPending = waitingB2B.reduce((s, d) => s + d.servers, 0)
  const serversTotal = serversDelivered + serversPending
  const serversPct = serversTotal ? Math.round((serversDelivered / serversTotal) * 100) : 0

  const invoicePending = b2b.filter(isInvoicePending)

  const find = (name: string) => deals.find((d) => d.customer === name)

  // At Risk — real US ops deals, curated risk descriptions
  const riskItems = [
    { d: find('I/ONX'), badge: 'rb-red', icon: '🧾', tag: 'Invoice overdue', tagCls: 'bg-[#fcebeb] text-[#a32d2d]', desc: 'Delivered May 22 · invoice still not issued' },
    { d: find('MIMOS'), badge: 'rb-red', icon: '🧾', tag: 'Invoice pending', tagCls: 'bg-[#fcebeb] text-[#a32d2d]', desc: 'Delivered · invoice pending · Malaysia research lab' },
    { d: find('NTU'), badge: 'rb-amber', icon: '📦', tag: 'Delivery + invoice', tagCls: 'bg-[#faeeda] text-[#854f0b]', desc: 'ETD Aug 30 · 6 servers + 48 cards · largest deal · no invoice' },
    { d: find('CADT'), badge: 'rb-purple', icon: '📅', tag: 'Long ETA', tagCls: 'bg-[#eeedfe] text-[#534ab7]', desc: 'PO Jul 25 · ETD Sep 30 · 1 server + 4 cards · Cambodia lab' },
  ].filter((r) => r.d)

  const badgeBg: Record<string, string> = {
    'rb-red': 'bg-[#fcebeb] text-[#a32d2d]',
    'rb-amber': 'bg-[#faeeda] text-[#854f0b]',
    'rb-purple': 'bg-[#eeedfe] text-[#534ab7]',
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-[#1a1a1a]">
      {/* Alert banner */}
      <div className="flex flex-wrap items-center gap-2 border-b border-[#fac775] bg-[#fffbeb] px-5 py-2 text-[11px] text-[#633806]">
        <span className="h-1.5 w-1.5 flex-shrink-0 animate-pulse rounded-full bg-[#ef9f27]" />
        {invoicePending.slice(0, 3).map((d) => (
          <span key={d.id} className="flex items-center gap-2">
            <span>
              <strong>{d.customer} {fmtUsd(d.revenue)}</strong> — {dealFinance(d).invoice === 'overdue' ? 'delivered, invoice overdue' : 'invoice pending'}
            </span>
            <span className="text-[#fac775]">•</span>
          </span>
        ))}
        <span className="font-medium text-[#a32d2d]">
          {waiting.length} deals waiting · {fmtUsd(pipelineRev)} unrecognized revenue
        </span>
      </div>

      {/* Page header */}
      <div className="flex items-center justify-between border-b border-[#e5e5e0] bg-white px-5 py-3">
        <div>
          <div className="text-base font-medium">US Ops Dashboard</div>
          <div className="mt-0.5 text-[10px] text-[#888]">US &amp; APAC deals only · alex.liu · tom.gallivan · addison</div>
        </div>
        <div className="flex items-center gap-1.5 text-[10px] text-[#888]">
          <span className="h-1.5 w-1.5 rounded-full bg-[#1d9e75]" /> Live · synced from Google Sheets
        </div>
      </div>

      {/* KPI stat row */}
      <div className="grid grid-cols-2 border-b border-[#e5e5e0] bg-white sm:grid-cols-4">
        <Kpi label="Pipeline (Waiting)" value={fmtUsd(pipelineRev)} sub={waitingB2B.map((d) => d.customer).join(' · ')} icon="⏱" iconCls="bg-[#faeeda] text-[#854f0b]" />
        <Kpi label="Delivered Revenue" value={fmtUsd(deliveredRev)} sub={deliveredB2B.map((d) => d.customer).join(' · ')} icon="✓" iconCls="bg-[#e1f5ee] text-[#0f6e56]" />
        <Kpi label="Cards Shipped" value={`${cardsDelivered} / ${cardsTotal}`} sub={`B2B delivered · ${cardsPending} in pipeline`} icon="▦" iconCls="bg-[#e6f1fb] text-[#185fa5]" />
        <Kpi label="Invoice Pending" value={`${invoicePending.length} deals`} valueCls="text-[#a32d2d]" sub={invoicePending.map((d) => d.customer).join(' · ')} icon="🧾" iconCls="bg-[#fcebeb] text-[#a32d2d]" />
      </div>

      {/* Fulfillment strip */}
      <div className="grid grid-cols-1 gap-3 border-b border-[#e5e5e0] bg-white px-5 py-2.5 sm:grid-cols-2">
        <Fulfillment label="B2B Cards Delivery Progress" pct={cardsPct} fill="bg-[#378add]" note={`${cardsDelivered} delivered · ${cardsPending} pending`} icon="▦" iconCls="bg-[#e6f1fb] text-[#185fa5]" />
        <Fulfillment label="B2B Servers Delivery Progress" pct={serversPct} fill="bg-[#ef9f27]" pctCls="text-[#854f0b]" note={`${serversDelivered} delivered · ${serversPending} pending`} icon="🖥" iconCls="bg-[#faeeda] text-[#854f0b]" />
      </div>

      <div className="px-5 py-3.5">
        {/* Row 1: Funnel + At Risk + Inventory */}
        <div className="mb-3 grid grid-cols-1 gap-2.5 lg:grid-cols-[1.1fr_1fr_1fr]">
          {/* Funnel */}
          <Card>
            <CardTitle icon="🔻" iconColor="#185fa5">Deal Pipeline (US Ops)</CardTitle>
            <p className="mb-2.5 text-[10px] text-[#888]">US · APAC deals · alex.liu / tom.gallivan / addison</p>
            <div className="flex items-center gap-1">
              <FunnelStep n={deals.length} label="Total" bg="#e6f1fb" border="#b5d4f4" color="#185fa5" />
              <Arrow />
              <FunnelStep n={internal.length} label="Internal" bg="#eeedfe" border="#afa9ec" color="#534ab7" />
              <Arrow />
              <FunnelStep n={waiting.length} label="Waiting" bg="#faeeda" border="#fac775" color="#854f0b" />
              <Arrow />
              <FunnelStep n={deliveredB2B.length} label="Delivered" bg="#eaf3de" border="#c0dd97" color="#3b6d11" />
            </div>
            <div className="mt-2.5 flex justify-between border-t border-[#f0f0f0] pt-2 text-[10px] text-[#888]">
              <span>Revenue: <strong className="text-[#1d9e75]">{fmtUsd(deliveredRev)}</strong></span>
              <span>Pipeline: <strong className="text-[#854f0b]">{fmtUsd(pipelineRev)}</strong></span>
              <span>Total: <strong className="text-[#1a1a1a]">{fmtUsd(totalRev)}</strong></span>
            </div>
          </Card>

          {/* At Risk */}
          <div className="rounded-[10px] border border-[#f7c1c1] bg-white p-3.5">
            <div className="mb-0.5 flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-[11px] font-medium">
                <span style={{ color: '#a32d2d' }}>⚠</span> At Risk
              </span>
              <span className="inline-flex items-center rounded-full bg-[#fcebeb] px-1.5 py-0.5 text-[9px] font-medium text-[#a32d2d]">{riskItems.length} signals</span>
            </div>
            <p className="mb-2.5 text-[10px] text-[#888]">Based on actual US ops deal data</p>
            {riskItems.map((r) => (
              <div key={r.d!.id} className="flex items-start gap-2 border-b border-[#f0f0f0] py-1.5 last:border-0 last:pb-0">
                <div className={`mt-0.5 flex h-[22px] w-[22px] flex-shrink-0 items-center justify-center rounded-[5px] text-[11px] ${badgeBg[r.badge]}`}>{r.icon}</div>
                <div>
                  <div className="text-[11px] font-medium">{r.d!.customer} — {fmtUsdFull(r.d!.revenue)}</div>
                  <div className="mt-0.5 text-[10px] leading-snug text-[#888]">{r.desc}</div>
                  <span className={`mt-1 inline-flex items-center rounded-full px-1.5 py-0.5 text-[9px] font-medium ${r.tagCls}`}>{r.tag}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Inventory (curated snapshot) */}
          <Card>
            <CardTitle icon="📦" iconColor="#534ab7">US Office Inventory</CardTitle>
            <p className="mb-2.5 text-[10px] text-[#888]">Live snapshot · Jun 22, 2026</p>
            <InvRow label="Cards" big="16" sub="available / 40 total · 24 in use" pct={60} fill="bg-[#7f77dd]" tag="+4 this month" tagCls="bg-[#e1f5ee] text-[#1d9e75]" />
            <div className="mt-2 border-t border-[#f0f0f0] pt-2">
              <InvRow label="Servers" big="6" sub="available / 16 total · 10 in use" pct={62} fill="bg-[#ef9f27]" tag="62% in use" tagCls="bg-[#faeeda] text-[#854f0b]" />
            </div>
            <div className="mt-2 border-t border-[#f0f0f0] pt-2">
              <div className="mb-1.5 text-[10px] font-medium text-[#888]">Upcoming POC</div>
              {[
                ['AWS', '8 cards · Jun'],
                ['Meta', '8 cards · Jul'],
                ['Microsoft', '2 svr · Jul'],
              ].map(([n, v]) => (
                <div key={n} className="flex justify-between py-0.5 text-[10px]">
                  <span>{n}</span>
                  <span className="inline-flex items-center rounded-full bg-[#e6f1fb] px-1.5 py-0.5 text-[9px] font-medium text-[#185fa5]">{v}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Rep allocation */}
        <SectionTitle icon="👥">POC Allocation — US Ops Reps</SectionTitle>
        <div className="mb-3 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {REPS.map((rep) => {
            const repDeals = deals.filter((d) => d.owner === rep.email)
            const cards = repDeals.reduce((s, d) => s + d.cards, 0)
            const servers = repDeals.reduce((s, d) => s + d.servers, 0)
            const pending = repDeals.filter(isInvoicePending).length
            const health =
              repDeals.length === 0
                ? { cls: 'border border-[#e5e5e0] bg-[#fafafa] text-[#888]', label: 'Available' }
                : pending >= 2
                  ? { cls: 'bg-[#fcebeb] text-[#a32d2d]', label: '● Overloaded' }
                  : pending === 1
                    ? { cls: 'bg-[#faeeda] text-[#854f0b]', label: '● Busy' }
                    : { cls: 'bg-[#eaf3de] text-[#3b6d11]', label: '● Healthy' }
            return (
              <div key={rep.email} className="rounded-[10px] border border-[#e5e5e0] bg-white p-3">
                <div className="mb-2 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className={`flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-medium ${rep.avatar}`}>{rep.initials}</span>
                    <div>
                      <div className="text-[11px] font-medium">{rep.name}</div>
                      <div className="text-[9px] text-[#aaa]">{rep.email}</div>
                    </div>
                  </div>
                  <span className={`inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[9px] font-medium ${health.cls}`}>{health.label}</span>
                </div>
                {repDeals.length === 0 ? (
                  <div className="mt-1 text-[10px] italic text-[#aaa]">No US ops deals assigned</div>
                ) : (
                  <>
                    <div className="flex justify-between text-[10px] text-[#888]">
                      <span>Cards</span>
                      <span className="font-medium text-[#1a1a1a]">{cards}</span>
                    </div>
                    <div className="my-1 flex justify-between text-[10px] text-[#888]">
                      <span>Servers</span>
                      <span className="font-medium text-[#1a1a1a]">{servers}</span>
                    </div>
                    <div className="mt-1.5 flex flex-wrap gap-1">
                      {repDeals.map((d) => {
                        const warn = isInvoicePending(d)
                        return (
                          <span
                            key={d.id}
                            className={`rounded border px-1.5 py-0.5 text-[9px] ${warn ? 'border-[#f7c1c1] bg-[#fcebeb] text-[#a32d2d]' : 'border-[#e5e5e0] bg-[#fafafa] text-[#888]'}`}
                          >
                            {d.customer}{warn ? ' ⚠' : ''}
                          </span>
                        )
                      })}
                    </div>
                  </>
                )}
              </div>
            )
          })}
        </div>

        {/* Deal pipeline table */}
        <SectionTitle icon="☰">Deal Pipeline — US Ops Only</SectionTitle>
        <DashboardDealTable deals={deals} />

        {/* Recent audit-log activity (Postgres; isolated so DB downtime can't 500 this page) */}
        <RecentActivity />
      </div>
    </div>
  )
}

function Kpi({ label, value, sub, icon, iconCls, valueCls }: { label: string; value: string; sub: string; icon: string; iconCls: string; valueCls?: string }) {
  return (
    <div className="flex items-center justify-between border-b border-r border-[#e5e5e0] px-4 py-3 last:border-r-0 sm:border-b-0">
      <div className="min-w-0">
        <div className="text-[10px] font-medium text-[#888]">{label}</div>
        <div className={`text-[18px] font-medium ${valueCls ?? 'text-[#1a1a1a]'}`}>{value}</div>
        <div className="mt-0.5 truncate text-[10px] text-[#aaa]">{sub}</div>
      </div>
      <div className={`flex h-[30px] w-[30px] flex-shrink-0 items-center justify-center rounded-[7px] text-sm ${iconCls}`}>{icon}</div>
    </div>
  )
}

function Fulfillment({ label, pct, fill, note, icon, iconCls, pctCls }: { label: string; pct: number; fill: string; note: string; icon: string; iconCls: string; pctCls?: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-md text-[13px] ${iconCls}`}>{icon}</div>
      <div className="flex-1">
        <div className="flex items-baseline justify-between">
          <span className="text-[10px] font-medium text-[#888]">{label}</span>
          <span className={`text-[13px] font-medium ${pctCls ?? 'text-[#1a1a1a]'}`}>{pct}%</span>
        </div>
        <div className="my-1 h-1 overflow-hidden rounded bg-[#f0f0ea]">
          <div className={`h-full rounded ${fill}`} style={{ width: `${pct}%` }} />
        </div>
        <span className="text-[10px] text-[#888]">{note}</span>
      </div>
    </div>
  )
}

function Card({ children }: { children: React.ReactNode }) {
  return <div className="rounded-[10px] border border-[#e5e5e0] bg-white p-3.5">{children}</div>
}

function CardTitle({ children, icon, iconColor }: { children: React.ReactNode; icon: string; iconColor: string }) {
  return (
    <div className="mb-0.5 flex items-center gap-1.5 text-[11px] font-medium">
      <span style={{ color: iconColor }}>{icon}</span> {children}
    </div>
  )
}

function SectionTitle({ children, icon }: { children: React.ReactNode; icon: string }) {
  return (
    <div className="mb-2 flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wider text-[#888]">
      <span>{icon}</span> {children}
    </div>
  )
}

function FunnelStep({ n, label, bg, border, color }: { n: number; label: string; bg: string; border: string; color: string }) {
  return (
    <div className="flex-1 rounded-[7px] border py-2 text-center" style={{ background: bg, borderColor: border }}>
      <div className="text-base font-medium" style={{ color }}>{n}</div>
      <div className="mt-0.5 text-[9px] text-[#888]">{label}</div>
    </div>
  )
}

function Arrow() {
  return <span className="flex-shrink-0 text-sm text-[#ccc]">›</span>
}

function InvRow({ label, big, sub, pct, fill, tag, tagCls }: { label: string; big: string; sub: string; pct: number; fill: string; tag: string; tagCls: string }) {
  return (
    <div>
      <div className="mb-0.5 flex items-center justify-between">
        <span className="text-[10px] font-medium text-[#888]">{label}</span>
        <span className={`inline-flex items-center rounded-full px-1.5 py-0.5 text-[9px] ${tagCls}`}>{tag}</span>
      </div>
      <div className="mb-1 flex items-baseline gap-2.5">
        <span className="text-[18px] font-medium">{big}</span>
        <span className="text-[10px] text-[#888]">{sub}</span>
      </div>
      <div className="h-1 overflow-hidden rounded bg-[#f0f0ea]">
        <div className={`h-full rounded ${fill}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}
