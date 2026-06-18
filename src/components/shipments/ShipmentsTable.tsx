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
  SUBMITTED: 'bg-amber-900/40 text-amber-400',
  IN_TRANSIT: 'bg-blue-900/40 text-[#B3C6E7]',
  OUT_FOR_DELIVERY: 'bg-orange-900/40 text-orange-400',
  DELIVERED: 'bg-emerald-900/40 text-emerald-400',
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
    <div className="rounded-lg border border-[#2A2A2A] bg-[#1A1A1A]">
      <Table>
        <TableHeader>
          <TableRow className="bg-[#161616] border-[#2A2A2A]">
            <TableHead className="text-[#888888]">Tracking ID</TableHead>
            <TableHead className="text-[#888888]">Customer (Deal)</TableHead>
            <TableHead className="text-[#888888]">Status</TableHead>
            <TableHead className="text-[#888888]">Origin</TableHead>
            <TableHead className="text-[#888888]">Destination</TableHead>
            <TableHead className="text-[#888888]">Created At</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {shipments.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="py-10 text-center text-[#666666]">
                No shipments found.
              </TableCell>
            </TableRow>
          ) : (
            shipments.map((s) => (
              <TableRow
                key={s.id}
                className="border-[#2A2A2A] cursor-pointer hover:bg-[#222222]"
                onClick={() => s.deal?.dmdId && router.push(`/deals/${s.deal.dmdId}`)}
              >
                <TableCell className="font-mono text-sm font-semibold text-[#A0A0A0]">
                  {s.trackingNo ?? '—'}
                </TableCell>
                <TableCell>
                  <span className="font-medium text-white">{s.deal?.customer ?? '—'}</span>
                  {s.deal?.dmdId && (
                    <span className="ml-1.5 font-mono text-xs text-[#666666]">
                      {s.deal.dmdId}
                    </span>
                  )}
                </TableCell>
                <TableCell>
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${STATUS_STYLE[s.status] ?? 'bg-[#2A2A2A] text-[#888888]'}`}
                  >
                    {STATUS_LABEL[s.status] ?? s.status}
                  </span>
                </TableCell>
                <TableCell className="text-sm text-[#A0A0A0]">{s.origin}</TableCell>
                <TableCell className="text-sm text-[#A0A0A0]">{s.destination}</TableCell>
                <TableCell className="text-sm text-[#666666]">
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
