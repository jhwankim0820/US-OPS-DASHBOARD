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
  Internal: 'bg-[#35353f] text-[#AAAAAA]',
  Rental: 'bg-orange-900/40 text-orange-400',
}

export default function DealsTable({ deals }: { deals: Deal[] }) {
  return (
    <div className="rounded-xl border border-[#3a3a48] bg-[#2a2a35] shadow-sm">
      <Table>
        <TableHeader>
          <TableRow className="bg-[#20202c] border-[#3a3a48]">
            <TableHead className="w-24 text-[#AAAAAA]">DMD ID</TableHead>
            <TableHead className="text-[#AAAAAA]">Customer</TableHead>
            <TableHead className="text-[#AAAAAA]">Status</TableHead>
            <TableHead className="text-[#AAAAAA]">Category</TableHead>
            <TableHead className="text-[#AAAAAA]">Form Factor</TableHead>
            <TableHead className="text-[#AAAAAA]">Owner</TableHead>
            <TableHead className="text-[#AAAAAA]">Region</TableHead>
            <TableHead className="text-right text-[#AAAAAA]">Revenue</TableHead>
            <TableHead className="text-right text-[#AAAAAA]">Cards</TableHead>
            <TableHead className="text-right text-[#AAAAAA]">Servers</TableHead>
            <TableHead className="text-right text-[#AAAAAA]">Date</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {deals.length === 0 ? (
            <TableRow>
              <TableCell colSpan={11} className="py-12 text-center text-sm text-[#888888]">
                No deals match the current filters.
              </TableCell>
            </TableRow>
          ) : (
            deals.map((deal) => (
              <TableRow key={deal.id} className="border-[#3a3a48] hover:bg-[#35353f]">
                <TableCell>
                  <Link
                    href={`/deals/${deal.dmdId}`}
                    className="font-mono text-sm font-semibold text-[#B3C6E7] hover:underline"
                  >
                    {deal.dmdId}
                  </Link>
                </TableCell>
                <TableCell className="font-medium text-white">{deal.customer}</TableCell>
                <TableCell>
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${STATUS_STYLE[deal.status] ?? 'bg-[#35353f] text-[#AAAAAA]'}`}
                  >
                    {deal.status}
                  </span>
                </TableCell>
                <TableCell>
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${CATEGORY_STYLE[deal.category] ?? 'bg-[#35353f] text-[#AAAAAA]'}`}
                  >
                    {deal.category}
                  </span>
                </TableCell>
                <TableCell className="text-sm text-[#C0C0C0]">{deal.formFactor}</TableCell>
                <TableCell className="text-sm text-white">{deal.owner}</TableCell>
                <TableCell className="text-sm text-white">{deal.region}</TableCell>
                <TableCell className="text-right text-sm font-medium text-white">
                  {formatRevenue(deal.revenue, deal.currency)}
                </TableCell>
                <TableCell className="text-right text-sm text-[#C0C0C0]">{deal.cards || '—'}</TableCell>
                <TableCell className="text-right text-sm text-[#C0C0C0]">{deal.servers || '—'}</TableCell>
                <TableCell className="text-right text-sm text-[#888888]">
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
