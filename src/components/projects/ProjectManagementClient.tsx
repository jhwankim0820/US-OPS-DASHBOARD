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
const docCache = new Map<string, DocStatus>()

type TypeFilter = 'All' | 'B2B' | 'Internal'
type StatusFilter = 'All' | 'Waiting' | 'Delivered'
type RegionFilter = 'All' | 'US' | 'APAC'

const folderUrl = (id: string) => `https://drive.google.com/drive/folders/${id}`

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

export default function ProjectManagementClient({ deals }: { deals: ProjectDeal[] }) {
  const [docs, setDocs] = useState<Record<string, DocStatus>>(() => Object.fromEntries(docCache))
  const [loadingDocs, setLoadingDocs] = useState(() => deals.some((d) => !docCache.has(d.id)))
  const [typeF, setTypeF] = useState<TypeFilter>('All')
  const [statusF, setStatusF] = useState<StatusFilter>('All')
  const [regionF, setRegionF] = useState<RegionFilter>('All')
  const [search, setSearch] = useState('')
  const [invoiceDeal, setInvoiceDeal] = useState<ProjectDeal | null>(null)

  // Fetch Drive doc status for every deal in parallel on mount (session-cached).
  useEffect(() => {
    let cancelled = false
    const missing = deals.filter((d) => !docCache.has(d.id))
    if (missing.length === 0) return // loadingDocs already initialized to false
    Promise.all(
      missing.map(async (d) => {
        try {
          const res = await fetch(`/api/drive/deal-docs?dealId=${encodeURIComponent(d.id)}`)
          if (!res.ok) return
          const data: DocStatus = await res.json()
          docCache.set(d.id, data)
        } catch {
          /* ignore per-deal failures */
        }
      }),
    ).then(() => {
      if (cancelled) return
      setDocs(Object.fromEntries(docCache))
      setLoadingDocs(false)
    })
    return () => {
      cancelled = true
    }
  }, [deals])

  function refreshDeal(dealId: string) {
    fetch(`/api/drive/deal-docs?dealId=${encodeURIComponent(dealId)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data: DocStatus | null) => {
        if (!data) return
        docCache.set(dealId, data)
        setDocs(Object.fromEntries(docCache))
      })
      .catch(() => {})
  }

  // Counts for pills (each dimension independent over the full set).
  const counts = useMemo(() => {
    return {
      typeAll: deals.length,
      b2b: deals.filter((d) => d.category === 'B2B').length,
      internal: deals.filter((d) => d.category === 'Internal').length,
      statusAll: deals.length,
      waiting: deals.filter((d) => d.status === 'Waiting for Delivery').length,
      delivered: deals.filter((d) => d.status === 'Delivered').length,
      regionAll: deals.length,
      us: deals.filter((d) => d.region === 'US').length,
      apac: deals.filter((d) => d.region === 'APAC').length,
    }
  }, [deals])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return deals.filter((d) => {
      if (typeF !== 'All' && d.category !== typeF) return false
      if (statusF === 'Waiting' && d.status !== 'Waiting for Delivery') return false
      if (statusF === 'Delivered' && d.status !== 'Delivered') return false
      if (regionF !== 'All' && d.region !== regionF) return false
      if (q && ![d.id, d.customer, d.owner].some((v) => v.toLowerCase().includes(q))) return false
      return true
    })
  }, [deals, typeF, statusF, regionF, search])

  // Stat cards
  const totalProjects = deals.length
  const inProgress = counts.waiting
  const totalRevenue = deals
    .filter((d) => d.category === 'B2B')
    .reduce((s, d) => s + (d.revenue ?? 0), 0)
  const invoicePending = loadingDocs
    ? null
    : deals.filter((d) => d.category === 'B2B' && docs[d.id] && !docs[d.id].invoice).length

  const fmtRev = (n: number) =>
    n >= 1_000_000 ? `$${(n / 1_000_000).toFixed(2)}M` : `$${n.toLocaleString('en-US')}`

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
            <Pill on={typeF === 'All'} onClick={() => setTypeF('All')}>All<Cnt n={counts.typeAll} /></Pill>
            <Pill on={typeF === 'B2B'} onClick={() => setTypeF('B2B')}>B2B<Cnt n={counts.b2b} /></Pill>
            <Pill on={typeF === 'Internal'} onClick={() => setTypeF('Internal')}>Internal<Cnt n={counts.internal} /></Pill>
          </PillRow>
          <PillRow label="Status">
            <Pill on={statusF === 'All'} onClick={() => setStatusF('All')}>All<Cnt n={counts.statusAll} /></Pill>
            <Pill on={statusF === 'Waiting'} onClick={() => setStatusF('Waiting')}>Waiting<Cnt n={counts.waiting} /></Pill>
            <Pill on={statusF === 'Delivered'} onClick={() => setStatusF('Delivered')}>Delivered<Cnt n={counts.delivered} /></Pill>
          </PillRow>
          <PillRow label="Region">
            <Pill on={regionF === 'All'} onClick={() => setRegionF('All')}>All<Cnt n={counts.regionAll} /></Pill>
            <Pill on={regionF === 'US'} onClick={() => setRegionF('US')}>US<Cnt n={counts.us} /></Pill>
            <Pill on={regionF === 'APAC'} onClick={() => setRegionF('APAC')}>APAC<Cnt n={counts.apac} /></Pill>
          </PillRow>
        </div>

        <p className="mb-2.5 text-xs text-[#888]">{filtered.length} projects</p>

        {/* Table */}
        <div className="overflow-hidden rounded-xl border border-[#E2E8F0] bg-white">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1100px] border-collapse text-xs">
              <thead>
                <tr className="border-b border-[#E2E8F0] bg-[#FAFAFA] text-left text-[11px] font-medium text-[#888]">
                  <th className="w-8 px-2.5 py-2.5"><input type="checkbox" className="h-3 w-3" /></th>
                  <th className="px-2.5 py-2.5">Deal ID</th>
                  <th className="px-2.5 py-2.5">Customer</th>
                  <th className="px-2.5 py-2.5">Status</th>
                  <th className="px-2.5 py-2.5">Category</th>
                  <th className="px-2.5 py-2.5">Region</th>
                  <th className="px-2.5 py-2.5">Owner</th>
                  <th className="px-2.5 py-2.5 text-right">Revenue</th>
                  <th className="px-2.5 py-2.5">Qty</th>
                  <th className="px-2.5 py-2.5 text-center">Documents</th>
                  <th className="px-2.5 py-2.5">Latest Action</th>
                  <th className="px-2.5 py-2.5">Date</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((d) => {
                  const doc = docs[d.id]
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
