'use client'

import Link from 'next/link'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface Deal {
  id: string
  dmdId: string
  customer: string
  status: string
  category: string
  formFactor: string
  owner: string
  region: string
  revenue: number
  cards: number
  servers: number
  createdAt: Date
}

interface DealsTableProps {
  deals: Deal[]
  owners: string[]
  regions: string[]
}

const STATUS_STYLE: Record<string, string> = {
  Demand: 'bg-amber-100 text-amber-800',
  Confirmed: 'bg-blue-100 text-blue-800',
  Delivered: 'bg-emerald-100 text-emerald-800',
}

const CATEGORY_STYLE: Record<string, string> = {
  B2B: 'bg-violet-100 text-violet-800',
  B2G: 'bg-indigo-100 text-indigo-800',
  Internal: 'bg-gray-100 text-gray-700',
  Rental: 'bg-orange-100 text-orange-800',
}

const STATUSES = ['Demand', 'Confirmed', 'Delivered']

export default function DealsTable({ deals, owners, regions }: DealsTableProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const currentRegion: string = searchParams?.get('region') ?? 'all'
  const currentStatus: string = searchParams?.get('status') ?? 'all'
  const currentOwner: string = searchParams?.get('owner') ?? 'all'
  const currentFrom: string = searchParams?.get('from') ?? ''
  const currentTo: string = searchParams?.get('to') ?? ''

  const hasFilter = [currentRegion, currentStatus, currentOwner].some((v) => v !== 'all')
    || currentFrom !== ''
    || currentTo !== ''

  function updateParam(key: string, value: string | null) {
    const params = new URLSearchParams(searchParams?.toString() ?? '')
    if (!value || value === 'all') {
      params.delete(key)
    } else {
      params.set(key, value)
    }
    router.push(`${pathname}?${params.toString()}`)
  }

  function clearFilters() {
    router.push(pathname)
  }

  return (
    <div className="space-y-4">
      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-3 rounded-lg border bg-white p-4">
        <Select value={currentRegion} onValueChange={(v) => updateParam('region', v)}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder="Region" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Regions</SelectItem>
            {regions.map((r) => (
              <SelectItem key={r} value={r}>{r}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={currentStatus} onValueChange={(v) => updateParam('status', v)}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {STATUSES.map((s) => (
              <SelectItem key={s} value={s}>{s}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={currentOwner} onValueChange={(v) => updateParam('owner', v)}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder="Owner" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Owners</SelectItem>
            {owners.map((o) => (
              <SelectItem key={o} value={o}>{o}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">Date</span>
          <input
            type="date"
            value={currentFrom}
            onChange={(e) => updateParam('from', e.target.value)}
            className="rounded-md border border-gray-200 px-3 py-1.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-300"
          />
          <span className="text-sm text-gray-400">~</span>
          <input
            type="date"
            value={currentTo}
            onChange={(e) => updateParam('to', e.target.value)}
            className="rounded-md border border-gray-200 px-3 py-1.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-300"
          />
        </div>

        {hasFilter && (
          <button
            onClick={clearFilters}
            className="rounded-md border border-gray-200 px-3 py-1.5 text-sm text-gray-500 transition-colors hover:bg-gray-50 hover:text-gray-900"
          >
            ✕ Clear
          </button>
        )}
      </div>

      {/* Table */}
      <div className="rounded-lg border bg-white">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50">
              <TableHead className="w-24">DMD ID</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Form Factor</TableHead>
              <TableHead>Owner</TableHead>
              <TableHead>Region</TableHead>
              <TableHead className="text-right">Revenue</TableHead>
              <TableHead className="text-right">Cards</TableHead>
              <TableHead className="text-right">Servers</TableHead>
              <TableHead className="text-right">Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {deals.length === 0 ? (
              <TableRow>
                <TableCell colSpan={11} className="py-10 text-center text-gray-400">
                  조건에 맞는 딜이 없습니다.
                </TableCell>
              </TableRow>
            ) : (
              deals.map((deal) => (
                <TableRow key={deal.id} className="hover:bg-gray-50">
                  <TableCell>
                    <Link
                      href={`/deals/${deal.dmdId}`}
                      className="font-mono text-sm font-semibold text-blue-600 hover:underline"
                    >
                      {deal.dmdId}
                    </Link>
                  </TableCell>
                  <TableCell className="font-medium">{deal.customer}</TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${STATUS_STYLE[deal.status] ?? 'bg-gray-100 text-gray-700'}`}>
                      {deal.status}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${CATEGORY_STYLE[deal.category] ?? 'bg-gray-100 text-gray-700'}`}>
                      {deal.category}
                    </span>
                  </TableCell>
                  <TableCell className="text-sm text-gray-600">{deal.formFactor}</TableCell>
                  <TableCell className="text-sm">{deal.owner}</TableCell>
                  <TableCell className="text-sm">{deal.region}</TableCell>
                  <TableCell className="text-right text-sm font-medium">
                    {deal.revenue > 0 ? `${deal.revenue.toFixed(1)}억` : '—'}
                  </TableCell>
                  <TableCell className="text-right text-sm">{deal.cards || '—'}</TableCell>
                  <TableCell className="text-right text-sm">{deal.servers || '—'}</TableCell>
                  <TableCell className="text-right text-sm text-gray-400">
                    {new Date(deal.createdAt).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric', year: '2-digit' })}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
