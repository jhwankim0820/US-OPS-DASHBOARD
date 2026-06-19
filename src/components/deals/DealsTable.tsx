import Link from 'next/link'
import { formatRevenue } from '@/lib/utils'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

interface Deal {
  id: string
  dmdId: string
  customer: string
  summary?: string
  npuModel?: string
  status: string
  category: string
  formFactor: string
  owner: string
  region: string
  revenue: number
  currency?: string
  cards: number
  servers: number
  createdAt: Date | string
}

const STATUS_STYLE: Record<string, string> = {
  Demand: 'bg-amber-100 text-amber-700',
  Confirmed: 'bg-blue-100 text-blue-700',
  'Waiting for Delivery': 'bg-sky-100 text-sky-700',
  Delivered: 'bg-emerald-100 text-emerald-700',
  SUBMITTED: 'bg-violet-100 text-violet-700',
}

const CATEGORY_STYLE: Record<string, string> = {
  B2B: 'bg-violet-100 text-violet-700',
  B2G: 'bg-indigo-100 text-indigo-700',
  Internal: 'bg-gray-100 text-gray-600',
  Rental: 'bg-orange-100 text-orange-700',
}

export default function DealsTable({ deals }: { deals: Deal[] }) {
  return (
    <div className="rounded-xl border border-[#E2E8F0] bg-white shadow-sm">
      <Table>
        <TableHeader>
          <TableRow className="bg-[#F8F9FA] border-[#E2E8F0]">
            <TableHead className="w-24 text-[#6B7280]">DMD ID</TableHead>
            <TableHead className="text-[#6B7280]">Customer</TableHead>
            <TableHead className="text-[#6B7280]">Status</TableHead>
            <TableHead className="text-[#6B7280]">Category</TableHead>
            <TableHead className="text-[#6B7280]">Form Factor</TableHead>
            <TableHead className="text-[#6B7280]">Owner</TableHead>
            <TableHead className="text-[#6B7280]">Region</TableHead>
            <TableHead className="text-right text-[#6B7280]">Revenue</TableHead>
            <TableHead className="text-right text-[#6B7280]">Cards</TableHead>
            <TableHead className="text-right text-[#6B7280]">Servers</TableHead>
            <TableHead className="text-right text-[#6B7280]">Date</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {deals.length === 0 ? (
            <TableRow>
              <TableCell colSpan={11} className="py-12 text-center text-sm text-[#9CA3AF]">
                No deals match the current filters.
              </TableCell>
            </TableRow>
          ) : (
            deals.map((deal) => (
              <TableRow key={deal.id} className="border-[#E2E8F0] hover:bg-[#F8F9FA]">
                <TableCell>
                  <Link
                    href={`/deals/${deal.dmdId}`}
                    className="font-mono text-sm font-semibold text-blue-600 hover:underline"
                  >
                    {deal.dmdId}
                  </Link>
                </TableCell>
                <TableCell className="font-medium text-[#111827]">{deal.customer}</TableCell>
                <TableCell>
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${STATUS_STYLE[deal.status] ?? 'bg-gray-100 text-gray-600'}`}
                  >
                    {deal.status}
                  </span>
                </TableCell>
                <TableCell>
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${CATEGORY_STYLE[deal.category] ?? 'bg-gray-100 text-gray-600'}`}
                  >
                    {deal.category}
                  </span>
                </TableCell>
                <TableCell className="text-sm text-[#4B5563]">{deal.formFactor}</TableCell>
                <TableCell className="text-sm text-[#111827]">{deal.owner}</TableCell>
                <TableCell className="text-sm text-[#111827]">{deal.region}</TableCell>
                <TableCell className="text-right text-sm font-medium text-[#111827]">
                  {formatRevenue(deal.revenue, deal.currency)}
                </TableCell>
                <TableCell className="text-right text-sm text-[#4B5563]">{deal.cards || '—'}</TableCell>
                <TableCell className="text-right text-sm text-[#4B5563]">{deal.servers || '—'}</TableCell>
                <TableCell className="text-right text-sm text-[#9CA3AF]">
                  {new Date(deal.createdAt).toLocaleDateString('en-US', {
                    year: '2-digit',
                    month: 'short',
                    day: 'numeric',
                  })}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  )
}
