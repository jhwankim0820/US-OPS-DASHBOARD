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
  SUBMITTED: 'bg-amber-100 text-amber-700',
  IN_TRANSIT: 'bg-blue-100 text-blue-700',
  OUT_FOR_DELIVERY: 'bg-orange-100 text-orange-700',
  DELIVERED: 'bg-emerald-100 text-emerald-700',
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
    <div className="rounded-lg border border-[#E2E8F0] bg-white">
      <Table>
        <TableHeader>
          <TableRow className="bg-[#F8F9FA] border-[#E2E8F0]">
            <TableHead className="text-[#6B7280]">Tracking ID</TableHead>
            <TableHead className="text-[#6B7280]">Customer (Deal)</TableHead>
            <TableHead className="text-[#6B7280]">Status</TableHead>
            <TableHead className="text-[#6B7280]">Origin</TableHead>
            <TableHead className="text-[#6B7280]">Destination</TableHead>
            <TableHead className="text-[#6B7280]">Created At</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {shipments.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="py-10 text-center text-[#9CA3AF]">
                No shipments found.
              </TableCell>
            </TableRow>
          ) : (
            shipments.map((s) => (
              <TableRow
                key={s.id}
                className="border-[#E2E8F0] cursor-pointer hover:bg-[#F8F9FA]"
                onClick={() => s.deal?.dmdId && router.push(`/projects/${s.deal.dmdId}`)}
              >
                <TableCell className="font-mono text-sm font-semibold text-[#4B5563]">
                  {s.trackingNo ?? '—'}
                </TableCell>
                <TableCell>
                  <span className="font-medium text-[#111827]">{s.deal?.customer ?? '—'}</span>
                  {s.deal?.dmdId && (
                    <span className="ml-1.5 font-mono text-xs text-[#9CA3AF]">
                      {s.deal.dmdId}
                    </span>
                  )}
                </TableCell>
                <TableCell>
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${STATUS_STYLE[s.status] ?? 'bg-gray-100 text-gray-600'}`}
                  >
                    {STATUS_LABEL[s.status] ?? s.status}
                  </span>
                </TableCell>
                <TableCell className="text-sm text-[#4B5563]">{s.origin}</TableCell>
                <TableCell className="text-sm text-[#4B5563]">{s.destination}</TableCell>
                <TableCell className="text-sm text-[#9CA3AF]">
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
