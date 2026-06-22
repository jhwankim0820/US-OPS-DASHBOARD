// Shared helpers for the US Ops dashboard + financials redesign.
// Deal numbers come from getDeals(); business facts not in the sheet
// (invoice/payment status) live in the curated maps below.

export interface UsDeal {
  id: string
  customer: string
  status: string
  category: string
  region: string
  country: string
  owner: string
  revenue: number
  cards: number
  servers: number
  etd: string // ISO yyyy-mm-dd
  dealDate: string // ISO yyyy-mm-dd
}

export type InvoiceState = 'issued' | 'overdue' | 'pending' | 'notyet' | 'na'
export type PaymentState = 'paid' | 'unpaid' | 'na'

export interface DealFinance {
  invoice: InvoiceState
  payment: PaymentState
  channel: string
  expectedPay: string
  paidDate: string
}

// Curated per-customer finance status (reflects current real state; the deals
// sheet has no invoice/payment columns). Keyed by customer name.
const FINANCE: Record<string, Partial<DealFinance>> = {
  Flexgrid: { invoice: 'issued', payment: 'paid', expectedPay: '2026-05-09', paidDate: '2026-05-23' },
  'J.A.M Global': { invoice: 'issued', payment: 'paid', expectedPay: '2026-05-03', paidDate: '2026-05-17' },
  'I/ONX': { invoice: 'overdue', payment: 'paid', expectedPay: '2026-06-05', paidDate: '2026-06-15' },
  MIMOS: { invoice: 'pending', payment: 'unpaid', expectedPay: '2026-06-24' },
  CADT: { invoice: 'notyet', payment: 'unpaid' },
  NTU: { invoice: 'pending', payment: 'unpaid' },
}

export function dealFinance(deal: UsDeal): DealFinance {
  if (deal.category !== 'B2B') {
    return { invoice: 'na', payment: 'na', channel: 'Internal', expectedPay: '', paidDate: '' }
  }
  const f = FINANCE[deal.customer] ?? {}
  return {
    invoice: f.invoice ?? 'pending',
    payment: f.payment ?? 'unpaid',
    channel: f.channel ?? 'Direct',
    expectedPay: f.expectedPay ?? '',
    paidDate: f.paidDate ?? '',
  }
}

/** Invoice "pending" for KPI = needs action (overdue or pending), excludes soft "notyet". */
export function isInvoicePending(deal: UsDeal): boolean {
  const s = dealFinance(deal).invoice
  return s === 'overdue' || s === 'pending'
}

// ── US ops reps ──
export interface RepMeta {
  email: string
  name: string
  initials: string
  avatar: string // tailwind classes
}

export const REPS: RepMeta[] = [
  { email: 'alex.liu@furiosa.ai', name: 'Alex Liu', initials: 'AL', avatar: 'bg-[#e6f1fb] text-[#185fa5]' },
  { email: 'tom.gallivan@furiosa.ai', name: 'Tom Gallivan', initials: 'TG', avatar: 'bg-[#faece7] text-[#993c1d]' },
  { email: 'addison@furiosa.ai', name: 'Addison Chi', initials: 'AC', avatar: 'bg-[#e1f5ee] text-[#0f6e56]' },
  { email: 'auro@furiosa.ai', name: 'Auro Tripathy', initials: 'AT', avatar: 'bg-[#f5f5f0] text-[#888]' },
  { email: 'bill.leszinske@furiosa.ai', name: 'Bill Leszinske', initials: 'BL', avatar: 'bg-[#f5f5f0] text-[#888]' },
  { email: 'sean.berner@furiosa.ai', name: 'Sean Berner', initials: 'SB', avatar: 'bg-[#f5f5f0] text-[#888]' },
]

export function repByEmail(email: string): RepMeta {
  return (
    REPS.find((r) => r.email === email) ?? {
      email,
      name: email.split('@')[0],
      initials: email.slice(0, 2).toUpperCase(),
      avatar: 'bg-[#f5f5f0] text-[#888]',
    }
  )
}

export function countryCode(salesParty: string, region: string): string {
  const p = salesParty?.toLowerCase() ?? ''
  if (p.includes('malaysia')) return 'MY'
  if (p.includes('cambodia')) return 'KH'
  if (p.includes('singapore')) return 'SG'
  if (p.includes('korea')) return 'KR'
  if (p === 'us' || p.includes('united states')) return 'US'
  return region === 'US' ? 'US' : region
}

export function fmtUsd(n: number): string {
  if (n <= 0) return '—'
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`
  if (n >= 1_000) return `$${Math.round(n / 1_000)}K`
  return `$${n.toLocaleString('en-US')}`
}

export function fmtUsdFull(n: number): string {
  return `$${n.toLocaleString('en-US')}`
}

export function fmtShortDate(iso: string): string {
  if (!iso) return '—'
  const d = new Date(iso)
  if (isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}
