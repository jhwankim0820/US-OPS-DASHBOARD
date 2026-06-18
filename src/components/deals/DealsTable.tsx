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
  Demand: 'bg-amber-900/40 text-amber-400',
  Confirmed: 'bg-blue-900/40 text-[#B3C6E7]',
  'Waiting for Delivery': 'bg-sky-900/40 text-sky-400',
  Delivered: 'bg-emerald-900/40 text-emerald-400',
  SUBMITTED: 'bg-violet-900/40 text-violet-400',
}

const CATEGORY_STYLE: Record<string, string> = {
  B2B: 'bg-violet-900/40 text-violet-400',
  B2G: 'bg-indigo-900/40 text-indigo-400',
  Internal: 'bg-[#2A2A2A] text-[#888888]',
  Rental: 'bg-orange-900/40 text-orange-400',
}

export default function DealsTable({ deals }: { deals: Deal[] }) {
  return (
    <div className="rounded-xl border border-[#2A2A2A] bg-[#1A1A1A] shadow-sm">
      <Table>
        <TableHeader>
          <TableRow className="bg-[#161616] border-[#2A2A2A]">
            <TableHead className="w-24 text-[#888888]">DMD ID</TableHead>
            <TableHead className="text-[#888888]">Customer</TableHead>
            <TableHead className="text-[#888888]">Status</TableHead>
            <TableHead className="text-[#888888]">Category</TableHead>
            <TableHead className="text-[#888888]">Form Factor</TableHead>
            <TableHead className="text-[#888888]">Owner</TableHead>
            <TableHead className="text-[#888888]">Region</TableHead>
            <TableHead className="text-right text-[#888888]">Revenue</TableHead>
            <TableHead className="text-right text-[#888888]">Cards</TableHead>
            <TableHead className="text-right text-[#888888]">Servers</TableHead>
            <TableHead className="text-right text-[#888888]">Date</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {deals.length === 0 ? (
            <TableRow>
              <TableCell colSpan={11} className="py-12 text-center text-sm text-[#666666]">
                No deals match the current filters.
              </TableCell>
            </TableRow>
          ) : (
            deals.map((deal) => (
              <TableRow key={deal.id} className="border-[#2A2A2A] hover:bg-[#222222]">
                <TableCell>
                  <Link
                    href={`/deals/${deal.dmdId}`}
                    className="font-mono text-sm font-semibold text-[#B3C6E7] hover:underline"
                  >
                    {deal.dmdId}
                  </Link>
                </TableCell>
                <TableCell className="font-medium text-[#E0E0E0]">{deal.customer}</TableCell>
                <TableCell>
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${STATUS_STYLE[deal.status] ?? 'bg-[#2A2A2A] text-[#888888]'}`}
                  >
                    {deal.status}
                  </span>
                </TableCell>
                <TableCell>
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${CATEGORY_STYLE[deal.category] ?? 'bg-[#2A2A2A] text-[#888888]'}`}
                  >
                    {deal.category}
                  </span>
                </TableCell>
                <TableCell className="text-sm text-[#A0A0A0]">{deal.formFactor}</TableCell>
                <TableCell className="text-sm text-[#E0E0E0]">{deal.owner}</TableCell>
                <TableCell className="text-sm text-[#E0E0E0]">{deal.region}</TableCell>
                <TableCell className="text-right text-sm font-medium text-[#E0E0E0]">
                  {formatRevenue(deal.revenue, deal.currency)}
                </TableCell>
                <TableCell className="text-right text-sm text-[#A0A0A0]">{deal.cards || '—'}</TableCell>
                <TableCell className="text-right text-sm text-[#A0A0A0]">{deal.servers || '—'}</TableCell>
                <TableCell className="text-right text-sm text-[#666666]">
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
