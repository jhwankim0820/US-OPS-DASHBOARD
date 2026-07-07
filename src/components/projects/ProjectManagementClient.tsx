'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import type { InvoiceDeal } from '@/lib/invoice-template'
import ProjectInvoiceModal from './ProjectInvoiceModal'
import ProjectPOModal from './ProjectPOModal'

export type ProjectDeal = InvoiceDeal & {
  date: string
  quoteAt: string
  poAt: string
  invoiceAt: string
  shipAt: string
}

interface DocStatus {
  rental: boolean
  quote: boolean
  po: boolean
  invoice: boolean
  folders: { rental: string | null; quote: string | null; po: string | null; invoice: string | null }
  latestAction: { type: string; filename: string; modifiedTime: string } | null
}

// Session-level cache (with TTL) so navigating away and back doesn't re-fetch Drive.
const DOC_TTL_MS = 5 * 60_000
const docCache = new Map<string, { data: DocStatus; ts: number }>()
const isFresh = (id: string) => {
  const e = docCache.get(id)
  return !!e && Date.now() - e.ts < DOC_TTL_MS
}
const docsFromCache = (): Record<string, DocStatus> =>
  Object.fromEntries([...docCache.entries()].map(([k, v]) => [k, v.data]))

async function fetchDoc(dealId: string): Promise<DocStatus | null> {
  try {
    const res = await fetch(`/api/drive/deal-docs?dealId=${encodeURIComponent(dealId)}`)
    if (!res.ok) return null
    return (await res.json()) as DocStatus
  } catch {
    return null
  }
}

type StatusFilter = 'All' | 'Waiting' | 'Delivered'
type SortKey = 'default' | 'customer' | 'revenue' | 'date'

type Stage = 'quote' | 'po' | 'invoice' | 'ship' | 'tp'
type StageState = 'done' | 'progress' | 'todo'
type StageOverride = Partial<Record<Stage, boolean>>

const STAGE_DEFS: { key: Stage; label: string; folderKey?: 'quote' | 'po' | 'invoice' }[] = [
  { key: 'quote', label: 'Quote', folderKey: 'quote' },
  { key: 'po', label: 'PO', folderKey: 'po' },
  { key: 'invoice', label: 'Invoice', folderKey: 'invoice' },
  { key: 'ship', label: 'Ship' },
  { key: 'tp', label: 'TP' },
]

const folderUrl = (id: string) => `https://drive.google.com/drive/folders/${id}`

function initials(owner: string): string {
  const local = owner.split('@')[0]
  const parts = local.split(/[.\-_]/).filter(Boolean)
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase()
  return local.slice(0, 2).toUpperCase()
}
const AVATAR_COLORS = ['bg-[#e1f5ee] text-[#0f6e56]', 'bg-[#e6f1fb] text-[#185fa5]', 'bg-[#faece7] text-[#993c1d]']
function avatarColor(owner: string): string {
  let h = 0
  for (let i = 0; i < owner.length; i++) h = (h + owner.charCodeAt(i)) % AVATAR_COLORS.length
  return AVATAR_COLORS[h]
}
function fmtDate(iso: string): string {
  if (!iso) return '—'
  const d = new Date(iso)
  if (isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' })
}

const STATUS_BADGE: Record<string, string> = {
  'Waiting for Delivery': 'bg-[#faeeda] text-[#854f0b]',
  Delivered: 'bg-[#eaf3de] text-[#3b6d11]',
  Confirmed: 'bg-[#e6f1fb] text-[#185fa5]',
  Demand: 'bg-[#f1efe8] text-[#5f5e5a]',
  SUBMITTED: 'bg-[#eeedfe] text-[#534ab7]',
}
const CATEGORY_BADGE: Record<string, string> = {
  B2B: 'bg-[#e6f1fb] text-[#185fa5]',
  Internal: 'bg-[#f1efe8] text-[#5f5e5a]',
  B2G: 'bg-[#eeedfe] text-[#534ab7]',
  Rental: 'bg-[#fbeaf0] text-[#993556]',
}

const PILL = 'inline-flex cursor-pointer items-center gap-1.5 rounded-full border px-3 py-1 text-xs whitespace-nowrap transition-colors'
const PILL_ON = 'border-[#5dcaa5] bg-[#e1f5ee] font-medium text-[#0f6e56]'
const PILL_OFF = 'border-[#E2E8F0] bg-[#FAFAFA] text-[#6B7280] hover:text-[#111827]'

export default function ProjectManagementClient({ deals }: { deals: ProjectDeal[] }) {
  const router = useRouter()
  const [docs, setDocs] = useState<Record<string, DocStatus>>(() => docsFromCache())
  const [loadingDocs, setLoadingDocs] = useState(() => deals.some((d) => !isFresh(d.id)))
  const [refreshingAll, setRefreshingAll] = useState(false)
  const [stageOverride, setStageOverride] = useState<Record<string, StageOverride>>({})
  const [catF, setCatF] = useState<string>('All')
  const [statusF, setStatusF] = useState<StatusFilter>('All')
  const [regionF, setRegionF] = useState<string>('All')
  const [ownerF, setOwnerF] = useState<string>('All')
  const [search, setSearch] = useState('')
  const [sortKey, setSortKey] = useState<SortKey>('default')
  const [invoiceDeal, setInvoiceDeal] = useState<ProjectDeal | null>(null)
  const [quoteDeal, setQuoteDeal] = useState<ProjectDeal | null>(null)
  const [poDeal, setPoDeal] = useState<ProjectDeal | null>(null)

  useEffect(() => {
    let cancelled = false
    const missing = deals.filter((d) => !isFresh(d.id))
    if (missing.length === 0) return
    Promise.all(
      missing.map(async (d) => {
        const data = await fetchDoc(d.id)
        if (data) docCache.set(d.id, { data, ts: Date.now() })
      }),
    ).then(() => {
      if (cancelled) return
      setDocs(docsFromCache())
      setLoadingDocs(false)
    })
    return () => {
      cancelled = true
    }
  }, [deals])

  async function refreshDeal(dealId: string) {
    const data = await fetchDoc(dealId)
    if (data) {
      docCache.set(dealId, { data, ts: Date.now() })
      setDocs(docsFromCache())
    }
  }
  async function refreshAll() {
    setRefreshingAll(true)
    await Promise.all(
      deals.map(async (d) => {
        const data = await fetchDoc(d.id)
        if (data) docCache.set(d.id, { data, ts: Date.now() })
      }),
    )
    setDocs(docsFromCache())
    setRefreshingAll(false)
  }

  // Write a completed stage back to the Project Management sheet (optimistic).
  async function markStage(dealId: string, stage: Stage) {
    setStageOverride((prev) => ({ ...prev, [dealId]: { ...prev[dealId], [stage]: true } }))
    try {
      const res = await fetch('/api/deal/stage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dealId, stage }),
      })
      const data = await res.json()
      if (!res.ok || data.success === false) throw new Error(data.error || 'Sheet update failed')
    } catch (e) {
      // Roll back the optimistic mark and surface the failure.
      setStageOverride((prev) => ({ ...prev, [dealId]: { ...prev[dealId], [stage]: false } }))
      toast.error('Could not update sheet stage', { description: e instanceof Error ? e.message : String(e) })
    }
  }

  function stageState(d: ProjectDeal, stage: Stage): StageState {
    const ov = stageOverride[d.id]?.[stage]
    if (ov === true) return 'done'
    if (ov === false) return 'todo'
    switch (stage) {
      case 'quote':
        return d.quoteAt ? 'done' : 'todo'
      case 'po':
        return d.poAt ? 'done' : 'todo'
      case 'invoice':
        return d.invoiceAt ? 'done' : 'todo'
      case 'ship':
        if (d.status === 'Delivered' || d.shipAt) return 'done'
        if (d.status === 'Waiting for Delivery' || d.status === 'SUBMITTED') return 'progress'
        return 'todo'
      case 'tp':
        return 'todo'
    }
  }

  const categories = useMemo(() => [...new Set(deals.map((d) => d.category).filter(Boolean))], [deals])
  const regions = useMemo(() => [...new Set(deals.map((d) => d.region).filter(Boolean))], [deals])
  const owners = useMemo(() => [...new Set(deals.map((d) => d.owner).filter(Boolean))].sort(), [deals])
  const countBy = (pred: (d: ProjectDeal) => boolean) => deals.filter(pred).length

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    const rows = deals.filter((d) => {
      if (catF !== 'All' && d.category !== catF) return false
      if (statusF === 'Waiting' && d.status !== 'Waiting for Delivery') return false
      if (statusF === 'Delivered' && d.status !== 'Delivered') return false
      if (regionF !== 'All' && d.region !== regionF) return false
      if (ownerF !== 'All' && d.owner !== ownerF) return false
      if (q && ![d.id, d.customer, d.owner].some((v) => v.toLowerCase().includes(q))) return false
      return true
    })
    if (sortKey !== 'default') {
      rows.sort((a, b) => {
        if (sortKey === 'customer') return a.customer.localeCompare(b.customer)
        if (sortKey === 'revenue') return (b.revenue ?? 0) - (a.revenue ?? 0)
        if (sortKey === 'date') return (new Date(b.date).getTime() || 0) - (new Date(a.date).getTime() || 0)
        return 0
      })
    }
    return rows
  }, [deals, catF, statusF, regionF, ownerF, search, sortKey])

  const activeFilters: { label: string; clear: () => void }[] = []
  if (catF !== 'All') activeFilters.push({ label: `Type: ${catF}`, clear: () => setCatF('All') })
  if (statusF !== 'All') activeFilters.push({ label: `Status: ${statusF}`, clear: () => setStatusF('All') })
  if (regionF !== 'All') activeFilters.push({ label: `Region: ${regionF}`, clear: () => setRegionF('All') })
  if (ownerF !== 'All') activeFilters.push({ label: `Owner: ${ownerF.split('@')[0]}`, clear: () => setOwnerF('All') })
  if (search.trim()) activeFilters.push({ label: `Search: "${search.trim()}"`, clear: () => setSearch('') })
  const clearAll = () => {
    setCatF('All'); setStatusF('All'); setRegionF('All'); setOwnerF('All'); setSearch('')
  }

  // Stat cards
  const totalProjects = deals.length
  const inProgress = countBy((d) => d.status === 'Waiting for Delivery')
  const totalRevenue = deals.filter((d) => d.category === 'B2B').reduce((s, d) => s + (d.revenue ?? 0), 0)
  const actionNeeded = deals.filter((d) => stageState(d, 'quote') !== 'done' || stageState(d, 'invoice') !== 'done').length
  const fmtRev = (n: number) => (n >= 1_000_000 ? `$${(n / 1_000_000).toFixed(2)}M` : `$${n.toLocaleString('en-US')}`)

  return (
    <main className="min-h-screen bg-[#F8F9FA]">
      <div className="flex items-start justify-between border-b border-[#E2E8F0] bg-white px-6 py-5 sm:px-10">
        <div>
          <h1 className="text-lg font-semibold text-[#111827]">Project Management</h1>
          <p className="text-xs text-[#9CA3AF]">Run each deal through Quote → PO → Invoice → Ship → TP.</p>
        </div>
      </div>

      <div className="grid grid-cols-2 border-b border-[#E2E8F0] bg-white sm:grid-cols-4">
        <Stat label="Total Projects" value={String(totalProjects)} sub="All registered projects" icon="📁" iconCls="bg-[#e1f5ee] text-[#0f6e56]" />
        <Stat label="In Progress" value={String(inProgress)} sub="Waiting for delivery" icon="▶" iconCls="bg-[#faeeda] text-[#854f0b]" />
        <Stat label="Action Needed" value={String(actionNeeded)} sub="Missing quote or invoice" icon="⚠" iconCls="bg-[#fcebeb] text-[#a32d2d]" />
        <Stat label="Total Revenue" value={fmtRev(totalRevenue)} sub="Confirmed B2B revenue" icon="📊" iconCls="bg-[#e6f1fb] text-[#185fa5]" />
      </div>

      <div className="px-6 py-5 sm:px-10">
        <div className="mb-3">
          <div className="relative max-w-xs">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[#aaa]">🔍</span>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by project, customer, owner..."
              className="w-full rounded-lg border border-[#E2E8F0] bg-white py-2 pl-9 pr-3 text-sm text-[#111827] focus:border-[#5dcaa5] focus:outline-none"
            />
          </div>
        </div>

        <div className="mb-3 flex flex-col gap-2">
          <PillRow label="Type">
            <Pill on={catF === 'All'} onClick={() => setCatF('All')}>All<Cnt n={deals.length} /></Pill>
            {categories.map((c) => (
              <Pill key={c} on={catF === c} onClick={() => setCatF(c)}>{c}<Cnt n={countBy((d) => d.category === c)} /></Pill>
            ))}
          </PillRow>
          <PillRow label="Status">
            <Pill on={statusF === 'All'} onClick={() => setStatusF('All')}>All<Cnt n={deals.length} /></Pill>
            <Pill on={statusF === 'Waiting'} onClick={() => setStatusF('Waiting')}>Waiting<Cnt n={countBy((d) => d.status === 'Waiting for Delivery')} /></Pill>
            <Pill on={statusF === 'Delivered'} onClick={() => setStatusF('Delivered')}>Delivered<Cnt n={countBy((d) => d.status === 'Delivered')} /></Pill>
          </PillRow>
          <PillRow label="Region">
            <Pill on={regionF === 'All'} onClick={() => setRegionF('All')}>All<Cnt n={deals.length} /></Pill>
            {regions.map((r) => (
              <Pill key={r} on={regionF === r} onClick={() => setRegionF(r)}>{r}<Cnt n={countBy((d) => d.region === r)} /></Pill>
            ))}
          </PillRow>
          <PillRow label="Owner">
            <Pill on={ownerF === 'All'} onClick={() => setOwnerF('All')}>All<Cnt n={deals.length} /></Pill>
            {owners.map((o) => (
              <Pill key={o} on={ownerF === o} onClick={() => setOwnerF(o)}>{o.split('@')[0]}<Cnt n={countBy((d) => d.owner === o)} /></Pill>
            ))}
          </PillRow>
        </div>

        <div className="mb-3 flex flex-wrap items-center gap-2">
          <span className="text-xs text-[#888]">{filtered.length} projects</span>
          {activeFilters.map((f) => (
            <button key={f.label} onClick={f.clear} className="inline-flex items-center gap-1 rounded-full border border-[#E2E8F0] bg-[#eef7f3] px-2 py-0.5 text-[11px] text-[#0f6e56] transition-colors hover:bg-[#dff0e8]" title="Remove this filter">
              {f.label}<span className="text-[#5dcaa5]">×</span>
            </button>
          ))}
          {activeFilters.length > 0 && (
            <button onClick={clearAll} className="text-[11px] font-medium text-[#993556] hover:underline">Clear all</button>
          )}
          <div className="ml-auto flex items-center gap-2">
            <select
              value={sortKey}
              onChange={(e) => setSortKey(e.target.value as SortKey)}
              className="rounded-md border border-[#E2E8F0] bg-white px-2 py-1 text-[11px] text-[#6B7280] focus:outline-none"
              title="Sort projects"
            >
              <option value="default">Sort: Default</option>
              <option value="revenue">Sort: Revenue</option>
              <option value="date">Sort: Date</option>
              <option value="customer">Sort: Customer</option>
            </select>
            <button
              onClick={refreshAll}
              disabled={refreshingAll}
              className="inline-flex items-center gap-1.5 rounded-md border border-[#E2E8F0] bg-white px-2.5 py-1 text-[11px] font-medium text-[#6B7280] transition-colors hover:text-[#111827] disabled:opacity-50"
              title="Re-fetch document status from Drive for all projects"
            >
              <span className={refreshingAll ? 'inline-block animate-spin' : 'inline-block'}>⟳</span>
              {refreshingAll ? 'Refreshing…' : 'Refresh docs'}
            </button>
          </div>
        </div>

        {/* Workflow rows */}
        <div className="flex flex-col gap-2.5">
          {filtered.map((d) => (
            <WorkflowRow
              key={d.id}
              d={d}
              doc={docs[d.id]}
              loadingDocs={loadingDocs && !docs[d.id]}
              stageState={(s) => stageState(d, s)}
              onQuote={() => setQuoteDeal(d)}
              onPO={() => setPoDeal(d)}
              onInvoice={() => setInvoiceDeal(d)}
              onShip={() => router.push('/shipments')}
            />
          ))}
          {filtered.length === 0 && (
            <div className="rounded-xl border border-[#E2E8F0] bg-white py-12 text-center text-sm text-[#9CA3AF]">
              No projects match the current filters.
            </div>
          )}
        </div>
      </div>

      {invoiceDeal && (
        <ProjectInvoiceModal
          deal={invoiceDeal}
          docType="invoice"
          onClose={() => setInvoiceDeal(null)}
          onSaved={() => {
            markStage(invoiceDeal.id, 'invoice')
            refreshDeal(invoiceDeal.id)
            setInvoiceDeal(null)
          }}
        />
      )}
      {quoteDeal && (
        <ProjectInvoiceModal
          deal={quoteDeal}
          docType="quote"
          onClose={() => setQuoteDeal(null)}
          onSaved={() => {
            markStage(quoteDeal.id, 'quote')
            refreshDeal(quoteDeal.id)
            setQuoteDeal(null)
          }}
        />
      )}
      {poDeal && (
        <ProjectPOModal
          deal={poDeal}
          onClose={() => setPoDeal(null)}
          onSaved={() => {
            markStage(poDeal.id, 'po')
            refreshDeal(poDeal.id)
            setPoDeal(null)
          }}
        />
      )}
    </main>
  )
}

function WorkflowRow({
  d,
  doc,
  loadingDocs,
  stageState,
  onQuote,
  onPO,
  onInvoice,
  onShip,
}: {
  d: ProjectDeal
  doc: DocStatus | undefined
  loadingDocs: boolean
  stageState: (s: Stage) => StageState
  onQuote: () => void
  onPO: () => void
  onInvoice: () => void
  onShip: () => void
}) {
  return (
    <div className="rounded-xl border border-[#E2E8F0] bg-white px-4 py-3 transition-shadow hover:shadow-sm">
      {/* Header line */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
        <span className="font-mono text-[11px] tracking-wide text-[#aaa]">{d.id}</span>
        <span className="text-[14px] font-semibold text-[#1a1a1a]">{d.customer}</span>
        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${STATUS_BADGE[d.status] ?? 'bg-[#f1efe8] text-[#5f5e5a]'}`}>
          {d.status === 'Waiting for Delivery' ? 'Waiting' : d.status}
        </span>
        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${CATEGORY_BADGE[d.category] ?? 'bg-[#f1efe8] text-[#5f5e5a]'}`}>
          {d.category}
        </span>
        <span className="text-[11px] text-[#aaa]">{d.region}</span>
        <div className="flex items-center gap-1.5">
          <span className={`flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full text-[9px] font-medium ${avatarColor(d.owner)}`}>{initials(d.owner)}</span>
          <span className="text-[11px] text-[#888]">{d.owner.split('@')[0]}</span>
        </div>
        <div className="ml-auto flex items-center gap-3">
          <span className="text-[11px] text-[#aaa]">
            {d.cards > 0 && <span className="mr-2">▢ {d.cards}</span>}
            {d.servers > 0 && <span>🖥 {d.servers}</span>}
          </span>
          <span className="text-[13px] font-semibold text-[#1a1a1a]">{d.revenue ? `$${d.revenue.toLocaleString('en-US')}` : '—'}</span>
          <span className="text-[11px] text-[#aaa]">{fmtDate(d.date)}</span>
        </div>
      </div>

      {/* Stage pipeline */}
      <div className="mt-3 flex items-center gap-1 overflow-x-auto pb-0.5">
        {STAGE_DEFS.map((sd, i) => {
          const state = stageState(sd.key)
          const folderId = sd.folderKey ? doc?.folders[sd.folderKey] ?? null : null
          return (
            <div key={sd.key} className="flex items-center">
              <StageNode label={sd.label} state={state} folderId={folderId} loading={loadingDocs && sd.key !== 'ship' && sd.key !== 'tp'} tp={sd.key === 'tp'} />
              {i < STAGE_DEFS.length - 1 && (
                <span className={`mx-1 h-px w-5 flex-shrink-0 ${state === 'done' ? 'bg-[#5dcaa5]' : 'bg-[#E2E8F0]'}`} />
              )}
            </div>
          )
        })}
      </div>

      {/* Actions */}
      <div className="mt-3 flex flex-wrap gap-2">
        <ActionBtn onClick={onQuote} icon="📋" label="Send Quote" tone={stageState('quote') === 'done' ? 'ghost' : 'primary'} />
        <ActionBtn onClick={onPO} icon="📄" label="Save PO" tone={stageState('po') === 'done' ? 'ghost' : 'primary'} />
        <ActionBtn onClick={onInvoice} icon="🧾" label="Send Invoice" tone={stageState('invoice') === 'done' ? 'ghost' : 'primary'} />
        <ActionBtn onClick={onShip} icon="🚚" label="Ship via FedEx" tone="neutral" />
        <ActionBtn icon="🤝" label="TP — coming soon" tone="disabled" />
      </div>
    </div>
  )
}

function StageNode({ label, state, folderId, loading, tp }: { label: string; state: StageState; folderId: string | null; loading?: boolean; tp?: boolean }) {
  const glyph = state === 'done' ? '✓' : state === 'progress' ? '•' : tp ? '⋯' : '○'
  const cls =
    state === 'done'
      ? 'border-[#c0dd97] bg-[#eaf3de] text-[#1d9e75]'
      : state === 'progress'
        ? 'border-[#fac775] bg-[#faeeda] text-[#854f0b]'
        : 'border-[#E2E8F0] bg-[#f7f7f4] text-[#bbb]'
  const dot = (
    <div className={`flex h-6 w-6 items-center justify-center rounded-full border text-[12px] ${cls} ${loading ? 'animate-pulse' : ''} ${folderId ? 'hover:border-[#888]' : ''}`}>
      {glyph}
    </div>
  )
  return (
    <div className="flex flex-col items-center gap-0.5">
      {folderId ? (
        <a href={folderUrl(folderId)} target="_blank" rel="noopener noreferrer" title={`${label} — open Drive folder`}>{dot}</a>
      ) : (
        dot
      )}
      <span className="text-[9px] font-medium tracking-wide text-[#999]">{label}</span>
    </div>
  )
}

function ActionBtn({ onClick, icon, label, tone }: { onClick?: () => void; icon: string; label: string; tone: 'primary' | 'ghost' | 'neutral' | 'disabled' }) {
  const cls =
    tone === 'primary'
      ? 'bg-[#1d9e75] text-white hover:bg-[#187a5a]'
      : tone === 'ghost'
        ? 'border border-[#c0dd97] bg-[#f3f9ec] text-[#0f6e56] hover:bg-[#eaf3de]'
        : tone === 'neutral'
          ? 'border border-[#E2E8F0] bg-white text-[#111827] hover:bg-[#F8F9FA]'
          : 'cursor-not-allowed border border-dashed border-[#E2E8F0] bg-[#FAFAFA] text-[#bbb]'
  return (
    <button onClick={onClick} disabled={tone === 'disabled'} className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[12px] font-medium transition-colors ${cls}`}>
      <span>{icon}</span> {label}
    </button>
  )
}

function Stat({ label, value, sub, icon, iconCls }: { label: string; value: string; sub: string; icon: string; iconCls: string }) {
  return (
    <div className="flex items-center justify-between border-b border-r border-[#E2E8F0] px-6 py-4 last:border-r-0 sm:border-b-0">
      <div>
        <div className="text-[11px] text-[#888]">{label}</div>
        <div className="mt-0.5 text-[22px] font-medium text-[#111827]">{value}</div>
        <div className="mt-0.5 text-[11px] text-[#aaa]">{sub}</div>
      </div>
      <div className={`flex h-9 w-9 items-center justify-center rounded-lg text-base ${iconCls}`}>{icon}</div>
    </div>
  )
}

function PillRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <span className="w-12 flex-shrink-0 text-[11px] text-[#aaa]">{label}</span>
      {children}
    </div>
  )
}
function Pill({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} className={`${PILL} ${on ? PILL_ON : PILL_OFF}`}>{children}</button>
  )
}
function Cnt({ n }: { n: number }) {
  return <span className="text-[11px] opacity-75">{n}</span>
}
