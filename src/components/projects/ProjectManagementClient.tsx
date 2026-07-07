'use client'

import { useEffect, useMemo, useState } from 'react'
import type { InvoiceDeal } from '@/lib/invoice-template'
import ProjectInvoiceModal from './ProjectInvoiceModal'

export type ProjectDeal = InvoiceDeal & { date: string }

interface DocStatus {
  rental: boolean
  quote: boolean
  po: boolean
  invoice: boolean
  folders: { rental: string | null; quote: string | null; po: string | null; invoice: string | null }
  latestAction: { type: string; filename: string; modifiedTime: string } | null
}

// Session-level cache so navigating away and back doesn't re-fetch Drive.
// Entries carry a timestamp so they can be treated as stale after a TTL.
const DOC_TTL_MS = 5 * 60_000
const docCache = new Map<string, { data: DocStatus; ts: number }>()

const isFresh = (id: string) => {
  const e = docCache.get(id)
  return !!e && Date.now() - e.ts < DOC_TTL_MS
}
const docsFromCache = (): Record<string, DocStatus> =>
  Object.fromEntries([...docCache.entries()].map(([k, v]) => [k, v.data]))

type StatusFilter = 'All' | 'Waiting' | 'Delivered'

const folderUrl = (id: string) => `https://drive.google.com/drive/folders/${id}`

async function fetchDoc(dealId: string): Promise<DocStatus | null> {
  try {
    const res = await fetch(`/api/drive/deal-docs?dealId=${encodeURIComponent(dealId)}`)
    if (!res.ok) return null
    return (await res.json()) as DocStatus
  } catch {
    return null
  }
}

function relTime(iso: string): string {
  const then = new Date(iso).getTime()
  if (isNaN(then)) return ''
  const days = Math.floor((Date.now() - then) / 86_400_000)
  if (days <= 0) return 'today'
  if (days === 1) return 'yesterday'
  if (days < 7) return `${days} days ago`
  if (days < 30) {
    const w = Math.floor(days / 7)
    return `${w} week${w > 1 ? 's' : ''} ago`
  }
  if (days < 365) {
    const m = Math.floor(days / 30)
    return `${m} month${m > 1 ? 's' : ''} ago`
  }
  const y = Math.floor(days / 365)
  return `${y} year${y > 1 ? 's' : ''} ago`
}

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
const ACTION_BADGE: Record<string, { cls: string; icon: string }> = {
  Rental: { cls: 'bg-[#fbeaf0] text-[#993556]', icon: '📑' },
  Quote: { cls: 'bg-[#eeedfe] text-[#534ab7]', icon: '📋' },
  PO: { cls: 'bg-[#e6f1fb] text-[#185fa5]', icon: '📄' },
  Invoice: { cls: 'bg-[#eaf3de] text-[#3b6d11]', icon: '🧾' },
}

const PILL = 'inline-flex cursor-pointer items-center gap-1.5 rounded-full border px-3 py-1 text-xs whitespace-nowrap transition-colors'
const PILL_ON = 'border-[#5dcaa5] bg-[#e1f5ee] font-medium text-[#0f6e56]'
const PILL_OFF = 'border-[#E2E8F0] bg-[#FAFAFA] text-[#6B7280] hover:text-[#111827]'

type SortKey = 'default' | 'customer' | 'revenue' | 'qty' | 'date'
type SortDir = 'asc' | 'desc'
const qtyOf = (d: ProjectDeal) => (d.cards ?? 0) + (d.servers ?? 0)

export default function ProjectManagementClient({ deals }: { deals: ProjectDeal[] }) {
  const [docs, setDocs] = useState<Record<string, DocStatus>>(() => docsFromCache())
  const [loadingDocs, setLoadingDocs] = useState(() => deals.some((d) => !isFresh(d.id)))
  const [refreshingAll, setRefreshingAll] = useState(false)
  const [refreshing, setRefreshing] = useState<Set<string>>(new Set())
  const [catF, setCatF] = useState<string>('All')
  const [statusF, setStatusF] = useState<StatusFilter>('All')
  const [regionF, setRegionF] = useState<string>('All')
  const [ownerF, setOwnerF] = useState<string>('All')
  const [search, setSearch] = useState('')
  const [sortKey, setSortKey] = useState<SortKey>('default')
  const [sortDir, setSortDir] = useState<SortDir>('asc')
  const [invoiceDeal, setInvoiceDeal] = useState<ProjectDeal | null>(null)

  // Fetch Drive doc status for every stale/missing deal in parallel on mount.
  useEffect(() => {
    let cancelled = false
    const missing = deals.filter((d) => !isFresh(d.id))
    if (missing.length === 0) return // loadingDocs already initialized to false
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
    setRefreshing((s) => new Set(s).add(dealId))
    const data = await fetchDoc(dealId)
    if (data) {
      docCache.set(dealId, { data, ts: Date.now() })
      setDocs(docsFromCache())
    }
    setRefreshing((s) => {
      const next = new Set(s)
      next.delete(dealId)
      return next
    })
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

  // Distinct dimension values present in the data (for dynamic filter pills).
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
      const dir = sortDir === 'asc' ? 1 : -1
      rows.sort((a, b) => {
        switch (sortKey) {
          case 'customer':
            return dir * a.customer.localeCompare(b.customer)
          case 'revenue':
            return dir * ((a.revenue ?? 0) - (b.revenue ?? 0))
          case 'qty':
            return dir * (qtyOf(a) - qtyOf(b))
          case 'date':
            return dir * ((new Date(a.date).getTime() || 0) - (new Date(b.date).getTime() || 0))
          default:
            return 0
        }
      })
    }
    return rows
  }, [deals, catF, statusF, regionF, ownerF, search, sortKey, sortDir])

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDir(key === 'revenue' || key === 'qty' || key === 'date' ? 'desc' : 'asc')
    }
  }

  // Active filter summary
  const activeFilters: { label: string; clear: () => void }[] = []
  if (catF !== 'All') activeFilters.push({ label: `Type: ${catF}`, clear: () => setCatF('All') })
  if (statusF !== 'All') activeFilters.push({ label: `Status: ${statusF}`, clear: () => setStatusF('All') })
  if (regionF !== 'All') activeFilters.push({ label: `Region: ${regionF}`, clear: () => setRegionF('All') })
  if (ownerF !== 'All') activeFilters.push({ label: `Owner: ${ownerF.split('@')[0]}`, clear: () => setOwnerF('All') })
  if (search.trim()) activeFilters.push({ label: `Search: "${search.trim()}"`, clear: () => setSearch('') })
  const clearAll = () => {
    setCatF('All')
    setStatusF('All')
    setRegionF('All')
    setOwnerF('All')
    setSearch('')
  }

  // Stat cards
  const totalProjects = deals.length
  const inProgress = countBy((d) => d.status === 'Waiting for Delivery')
  const totalRevenue = deals.filter((d) => d.category === 'B2B').reduce((s, d) => s + (d.revenue ?? 0), 0)
  const invoicePending = loadingDocs
    ? null
    : deals.filter((d) => d.category === 'B2B' && docs[d.id] && !docs[d.id].invoice).length

  const fmtRev = (n: number) => (n >= 1_000_000 ? `$${(n / 1_000_000).toFixed(2)}M` : `$${n.toLocaleString('en-US')}`)

  return (
    <main className="min-h-screen bg-[#F8F9FA]">
      {/* Page header */}
      <div className="flex items-start justify-between border-b border-[#E2E8F0] bg-white px-6 py-5 sm:px-10">
        <div>
          <h1 className="text-lg font-semibold text-[#111827]">Project Management</h1>
          <p className="text-xs text-[#9CA3AF]">Records never lie, even when plans do.</p>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 border-b border-[#E2E8F0] bg-white sm:grid-cols-4">
        <Stat label="Total Projects" value={String(totalProjects)} sub="All registered projects" icon="📁" iconCls="bg-[#e1f5ee] text-[#0f6e56]" />
        <Stat label="In Progress" value={String(inProgress)} sub="Waiting for delivery" icon="▶" iconCls="bg-[#faeeda] text-[#854f0b]" />
        <Stat
          label="Invoice Pending"
          value={invoicePending === null ? '…' : String(invoicePending)}
          sub="B2B deals without invoice"
          icon="📄"
          iconCls="bg-[#eeedfe] text-[#534ab7]"
        />
        <Stat label="Total Revenue" value={fmtRev(totalRevenue)} sub="Confirmed B2B revenue" icon="📊" iconCls="bg-[#e6f1fb] text-[#185fa5]" />
      </div>

      <div className="px-6 py-5 sm:px-10">
        {/* Search */}
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

        {/* Filter pills */}
        <div className="mb-3 flex flex-col gap-2">
          <PillRow label="Type">
            <Pill on={catF === 'All'} onClick={() => setCatF('All')}>All<Cnt n={deals.length} /></Pill>
            {categories.map((c) => (
              <Pill key={c} on={catF === c} onClick={() => setCatF(c)}>
                {c}
                <Cnt n={countBy((d) => d.category === c)} />
              </Pill>
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
              <Pill key={r} on={regionF === r} onClick={() => setRegionF(r)}>
                {r}
                <Cnt n={countBy((d) => d.region === r)} />
              </Pill>
            ))}
          </PillRow>
          <PillRow label="Owner">
            <Pill on={ownerF === 'All'} onClick={() => setOwnerF('All')}>All<Cnt n={deals.length} /></Pill>
            {owners.map((o) => (
              <Pill key={o} on={ownerF === o} onClick={() => setOwnerF(o)}>
                {o.split('@')[0]}
                <Cnt n={countBy((d) => d.owner === o)} />
              </Pill>
            ))}
          </PillRow>
        </div>

        {/* Active filter summary + row count + refresh */}
        <div className="mb-2.5 flex flex-wrap items-center gap-2">
          <span className="text-xs text-[#888]">{filtered.length} projects</span>
          {activeFilters.map((f) => (
            <button
              key={f.label}
              onClick={f.clear}
              className="inline-flex items-center gap-1 rounded-full border border-[#E2E8F0] bg-[#eef7f3] px-2 py-0.5 text-[11px] text-[#0f6e56] transition-colors hover:bg-[#dff0e8]"
              title="Remove this filter"
            >
              {f.label}<span className="text-[#5dcaa5]">×</span>
            </button>
          ))}
          {activeFilters.length > 0 && (
            <button onClick={clearAll} className="text-[11px] font-medium text-[#993556] hover:underline">
              Clear all
            </button>
          )}
          <button
            onClick={refreshAll}
            disabled={refreshingAll}
            className="ml-auto inline-flex items-center gap-1.5 rounded-md border border-[#E2E8F0] bg-white px-2.5 py-1 text-[11px] font-medium text-[#6B7280] transition-colors hover:text-[#111827] disabled:opacity-50"
            title="Re-fetch document status from Drive for all projects"
          >
            <span className={refreshingAll ? 'inline-block animate-spin' : 'inline-block'}>⟳</span>
            {refreshingAll ? 'Refreshing…' : 'Refresh docs'}
          </button>
        </div>

        {/* Table */}
        <div className="overflow-hidden rounded-xl border border-[#E2E8F0] bg-white">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1100px] border-collapse text-xs">
              <thead>
                <tr className="border-b border-[#E2E8F0] bg-[#FAFAFA] text-left text-[11px] font-medium text-[#888]">
                  <th className="w-8 px-2.5 py-2.5"><input type="checkbox" className="h-3 w-3" /></th>
                  <th className="px-2.5 py-2.5">Deal ID</th>
                  <SortTh label="Customer" active={sortKey === 'customer'} dir={sortDir} onClick={() => toggleSort('customer')} />
                  <th className="px-2.5 py-2.5">Status</th>
                  <th className="px-2.5 py-2.5">Category</th>
                  <th className="px-2.5 py-2.5">Region</th>
                  <th className="px-2.5 py-2.5">Owner</th>
                  <SortTh label="Revenue" active={sortKey === 'revenue'} dir={sortDir} onClick={() => toggleSort('revenue')} align="right" />
                  <SortTh label="Qty" active={sortKey === 'qty'} dir={sortDir} onClick={() => toggleSort('qty')} />
                  <th className="px-2.5 py-2.5 text-center">Documents</th>
                  <th className="px-2.5 py-2.5">Latest Action</th>
                  <SortTh label="Date" active={sortKey === 'date'} dir={sortDir} onClick={() => toggleSort('date')} />
                </tr>
              </thead>
              <tbody>
                {filtered.map((d) => {
                  const doc = docs[d.id]
                  const isRefreshing = refreshing.has(d.id)
                  return (
                    <tr key={d.id} className="border-b border-[#F0F0F0] last:border-0 hover:bg-[#FAFAFA]">
                      <td className="px-2.5 py-2.5"><input type="checkbox" className="h-3 w-3" /></td>
                      <td className="px-2.5 py-2.5"><span className="font-mono text-[11px] tracking-wide text-[#888]">{d.id}</span></td>
                      <td className="px-2.5 py-2.5 text-[13px] font-medium text-[#1a1a1a]">{d.customer}</td>
                      <td className="px-2.5 py-2.5">
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${STATUS_BADGE[d.status] ?? 'bg-[#f1efe8] text-[#5f5e5a]'}`}>
                          {d.status === 'Waiting for Delivery' ? 'Waiting' : d.status}
                        </span>
                      </td>
                      <td className="px-2.5 py-2.5">
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${CATEGORY_BADGE[d.category] ?? 'bg-[#f1efe8] text-[#5f5e5a]'}`}>
                          {d.category}
                        </span>
                      </td>
                      <td className="px-2.5 py-2.5 text-[#aaa]">{d.region}</td>
                      <td className="px-2.5 py-2.5">
                        <div className="flex items-center gap-1.5">
                          <span className={`flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-[10px] font-medium ${avatarColor(d.owner)}`}>
                            {initials(d.owner)}
                          </span>
                          <span className="text-[11px] text-[#888]">{d.owner.split('@')[0]}</span>
                        </div>
                      </td>
                      <td className="px-2.5 py-2.5 text-right">
                        {d.revenue ? <span className="font-medium">${d.revenue.toLocaleString('en-US')}</span> : <span className="text-[#aaa]">—</span>}
                      </td>
                      <td className="px-2.5 py-2.5">
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-[#666]">
                          {d.cards > 0 && <span>▢ {d.cards}</span>}
                          {d.servers > 0 && <span>🖥 {d.servers}</span>}
                          {d.cards === 0 && d.servers === 0 && <span className="text-[#aaa]">—</span>}
                        </div>
                      </td>
                      <td className="px-2.5 py-2.5">
                        {loadingDocs && !doc ? (
                          <div className="mx-auto h-6 w-32 animate-pulse rounded bg-[#F1F3F5]" />
                        ) : (
                          <div className="flex items-end justify-center gap-1.5">
                            <DocIcon label="RENT" on={!!doc?.rental} folderId={doc?.folders.rental ?? null} />
                            <DocIcon label="QT" on={!!doc?.quote} folderId={doc?.folders.quote ?? null} />
                            <DocIcon label="PO" on={!!doc?.po} folderId={doc?.folders.po ?? null} />
                            <DocIcon label="INV" on={!!doc?.invoice} folderId={doc?.folders.invoice ?? null} />
                            <button
                              onClick={() => refreshDeal(d.id)}
                              disabled={isRefreshing}
                              title="Refresh this project's Drive documents"
                              className="ml-0.5 self-center text-[12px] text-[#c4c4c4] transition-colors hover:text-[#1d9e75] disabled:opacity-60"
                            >
                              <span className={isRefreshing ? 'inline-block animate-spin' : 'inline-block'}>⟳</span>
                            </button>
                          </div>
                        )}
                      </td>
                      <td className="px-2.5 py-2.5">
                        {loadingDocs && !doc ? (
                          <div className="h-8 w-32 animate-pulse rounded bg-[#F1F3F5]" />
                        ) : doc?.latestAction ? (
                          <div className="flex flex-col gap-0.5">
                            <span className={`inline-flex w-fit items-center gap-1 rounded px-1.5 py-0.5 text-[11px] font-medium ${ACTION_BADGE[doc.latestAction.type]?.cls ?? ''}`}>
                              {ACTION_BADGE[doc.latestAction.type]?.icon} {doc.latestAction.type}
                            </span>
                            <span className="max-w-[150px] truncate text-[11px] text-[#666]" title={doc.latestAction.filename}>
                              {doc.latestAction.filename}
                            </span>
                            <span className="text-[10px] text-[#aaa]">{relTime(doc.latestAction.modifiedTime)}</span>
                          </div>
                        ) : (
                          <span className="text-[11px] text-[#aaa]">No activity yet</span>
                        )}
                        {doc && !doc.invoice && (
                          <button
                            onClick={() => setInvoiceDeal(d)}
                            className="mt-1.5 inline-flex items-center gap-1 rounded-md bg-[#1d9e75] px-2.5 py-1 text-[11px] font-medium text-white transition-colors hover:bg-[#187a5a]"
                          >
                            🧾 Invoice
                          </button>
                        )}
                      </td>
                      <td className="px-2.5 py-2.5 text-[#aaa]">{fmtDate(d.date)}</td>
                    </tr>
                  )
                })}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={12} className="py-12 text-center text-sm text-[#9CA3AF]">
                      No projects match the current filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {invoiceDeal && (
        <ProjectInvoiceModal
          deal={invoiceDeal}
          onClose={() => setInvoiceDeal(null)}
          onSaved={() => {
            refreshDeal(invoiceDeal.id)
            setInvoiceDeal(null)
          }}
        />
      )}
    </main>
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
    <button onClick={onClick} className={`${PILL} ${on ? PILL_ON : PILL_OFF}`}>
      {children}
    </button>
  )
}

function Cnt({ n }: { n: number }) {
  return <span className="text-[11px] opacity-75">{n}</span>
}

function SortTh({ label, active, dir, onClick, align = 'left' }: { label: string; active: boolean; dir: SortDir; onClick: () => void; align?: 'left' | 'right' }) {
  return (
    <th className={`px-2.5 py-2.5 ${align === 'right' ? 'text-right' : ''}`}>
      <button
        onClick={onClick}
        className={`inline-flex items-center gap-1 transition-colors hover:text-[#111827] ${active ? 'text-[#111827]' : ''}`}
        title={`Sort by ${label}`}
      >
        {label}
        <span className={`text-[9px] ${active ? 'text-[#1d9e75]' : 'text-[#ccc]'}`}>{active ? (dir === 'asc' ? '▲' : '▼') : '↕'}</span>
      </button>
    </th>
  )
}

function DocIcon({ label, on, folderId }: { label: string; on: boolean; folderId: string | null }) {
  const icon = (
    <div
      className={`flex h-6 w-6 items-center justify-center rounded-[5px] border text-[13px] ${
        on ? 'border-[#c0dd97] bg-[#eaf3de] text-[#1d9e75]' : 'border-[#E2E8F0] bg-[#f5f5f0] text-[#ccc]'
      } ${folderId ? 'cursor-pointer hover:border-[#888]' : ''}`}
    >
      {on ? '✓' : '—'}
    </div>
  )
  return (
    <div className="flex flex-col items-center gap-0.5">
      <span className="text-[9px] font-medium tracking-wide text-[#aaa]">{label}</span>
      {folderId ? (
        <a href={folderUrl(folderId)} target="_blank" rel="noopener noreferrer" title={`${label} — open Drive folder`}>
          {icon}
        </a>
      ) : (
        icon
      )}
    </div>
  )
}
