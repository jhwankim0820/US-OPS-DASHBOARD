'use client'

import { useRouter } from 'next/navigation'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

const STATUS_STYLE: Record<string, string> = {
  SUBMITTED: 'bg-amber-100 text-amber-800',
  IN_TRANSIT: 'bg-blue-100 text-blue-800',
  OUT_FOR_DELIVERY: 'bg-orange-100 text-orange-800',
  DELIVERED: 'bg-emerald-100 text-emerald-800',
}

const STATUS_LABEL: Record<string, string> = {
  SUBMITTED: 'Submitted',
  IN_TRANSIT: 'In Transit',
  OUT_FOR_DELIVERY: 'Out for Delivery',
  DELIVERED: 'Delivered',
}

export interface ShipmentRow {
  id: string
  trackingNo: string | null
  status: string
  origin: string
  destination: string
  createdAt: string
  deal: { customer: string; dmdId: string } | null
}

export default function ShipmentsTable({ shipments }: { shipments: ShipmentRow[] }) {
  const router = useRouter()

  return (
    <div className="rounded-lg border bg-white">
      <Table>
        <TableHeader>
          <TableRow className="bg-gray-50">
            <TableHead>Tracking ID</TableHead>
            <TableHead>Customer (Deal)</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Origin</TableHead>
            <TableHead>Destination</TableHead>
            <TableHead>Created At</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {shipments.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="py-10 text-center text-gray-400">
                No shipments found.
              </TableCell>
            </TableRow>
          ) : (
            shipments.map((s) => (
              <TableRow
                key={s.id}
                className="cursor-pointer hover:bg-gray-50"
                onClick={() => s.deal?.dmdId && router.push(`/deals/${s.deal.dmdId}`)}
              >
                <TableCell className="font-mono text-sm font-semibold text-gray-700">
                  {s.trackingNo ?? '—'}
                </TableCell>
                <TableCell>
                  <span className="font-medium text-gray-900">{s.deal?.customer ?? '—'}</span>
                  {s.deal?.dmdId && (
                    <span className="ml-1.5 font-mono text-xs text-gray-400">
                      {s.deal.dmdId}
                    </span>
                  )}
                </TableCell>
                <TableCell>
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${STATUS_STYLE[s.status] ?? 'bg-gray-100 text-gray-700'}`}
                  >
                    {STATUS_LABEL[s.status] ?? s.status}
                  </span>
                </TableCell>
                <TableCell className="text-sm">{s.origin}</TableCell>
                <TableCell className="text-sm">{s.destination}</TableCell>
                <TableCell className="text-sm text-gray-400">
                  {new Date(s.createdAt).toLocaleDateString('en-US', {
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
