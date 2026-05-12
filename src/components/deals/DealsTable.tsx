import Link from 'next/link'
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

const STATUS_STYLE: Record<string, string> = {
  Demand: 'bg-amber-100 text-amber-800',
  Confirmed: 'bg-blue-100 text-blue-800',
  'Waiting for Delivery': 'bg-sky-100 text-sky-800',
  Delivered: 'bg-emerald-100 text-emerald-800',
}

const CATEGORY_STYLE: Record<string, string> = {
  B2B: 'bg-violet-100 text-violet-800',
  B2G: 'bg-indigo-100 text-indigo-800',
  Internal: 'bg-gray-100 text-gray-700',
  Rental: 'bg-orange-100 text-orange-800',
}

export default function DealsTable({ deals }: { deals: Deal[] }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
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
              <TableCell colSpan={11} className="py-12 text-center text-sm text-gray-400">
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
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${STATUS_STYLE[deal.status] ?? 'bg-gray-100 text-gray-700'}`}
                  >
                    {deal.status}
                  </span>
                </TableCell>
                <TableCell>
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${CATEGORY_STYLE[deal.category] ?? 'bg-gray-100 text-gray-700'}`}
                  >
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
                  {new Date(deal.createdAt).toLocaleDateString('ko-KR', {
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
