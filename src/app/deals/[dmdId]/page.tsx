import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { formatRevenue } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

export const dynamic = 'force-dynamic'

const STATUS_STYLE: Record<string, string> = {
  Demand: 'bg-amber-100 text-amber-800',
  Confirmed: 'bg-blue-100 text-blue-800',
  'Waiting for Delivery': 'bg-sky-100 text-sky-800',
  Delivered: 'bg-emerald-100 text-emerald-800',
}

const SHIPMENT_STATUS_STYLE: Record<string, string> = {
  DELIVERED: 'bg-emerald-100 text-emerald-800',
  IN_TRANSIT: 'bg-blue-100 text-blue-800',
  SUBMITTED: 'bg-amber-100 text-amber-800',
}

export default async function DealDetailPage({
  params,
}: {
  params: Promise<{ dmdId: string }>
}) {
  const { dmdId } = await params
  const deal = await prisma.deal.findUnique({ where: { dmdId } })
  if (!deal) notFound()

  // Phase 5: will be linked via dealId FK — for now show all shipments as placeholder
  const shipments = await prisma.shipment.findMany({ orderBy: { createdAt: 'desc' } })

  const specs = [
    { label: 'DMD ID', value: deal.dmdId },
    { label: 'Customer', value: deal.customer },
    { label: 'Category', value: deal.category },
    { label: 'Region', value: deal.region },
    { label: 'Form Factor', value: deal.formFactor },
    { label: 'Owner', value: deal.owner },
    {
      label: 'Deal Date',
      value: deal.createdAt.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }),
    },
  ]

  return (
    <main className="mx-auto max-w-4xl p-6 sm:p-10">
      {/* Back + Header */}
      <div className="mb-8">
        <Link
          href="/deals"
          className="mb-4 inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900"
        >
          ← Back to Deals
        </Link>
        <div className="mt-3 flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold">{deal.customer}</h1>
            <span className="font-mono text-sm text-gray-400">{deal.dmdId}</span>
          </div>
          <span
            className={`mt-1 inline-flex items-center rounded-full px-3 py-1 text-sm font-semibold ${STATUS_STYLE[deal.status] ?? 'bg-gray-100 text-gray-700'}`}
          >
            {deal.status}
          </span>
        </div>
      </div>

      {/* Revenue KPI */}
      <div className="mb-6 grid grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-1">
            <CardTitle className="text-xs font-medium text-gray-500">Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {formatRevenue(deal.revenue)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-1">
            <CardTitle className="text-xs font-medium text-gray-500">Cards</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {deal.cards > 0 ? deal.cards : '—'}
              {deal.cards > 0 && (
                <span className="ml-1 text-sm font-normal text-gray-400">ea</span>
              )}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-1">
            <CardTitle className="text-xs font-medium text-gray-500">Servers</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {deal.servers > 0 ? deal.servers : '—'}
              {deal.servers > 0 && (
                <span className="ml-1 text-sm font-normal text-gray-400">ea</span>
              )}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Spec Grid */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-base">Deal Specifications</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-2 gap-x-8 gap-y-4 sm:grid-cols-3">
            {specs.map((s) => (
              <div key={s.label}>
                <dt className="text-xs font-medium text-gray-500">{s.label}</dt>
                <dd className="mt-1 text-sm font-semibold text-gray-900">{s.value}</dd>
              </div>
            ))}
          </dl>
        </CardContent>
      </Card>

      {/* Shipment History — Phase 5 preview */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Shipment History</h2>
          <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-600">
            Phase 5: FedEx Integration
          </span>
        </div>
        <div className="rounded-lg border bg-white">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead>Tracking No</TableHead>
                <TableHead>Carrier</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Origin</TableHead>
                <TableHead>Destination</TableHead>
                <TableHead>ETA</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {shipments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-8 text-center text-sm text-gray-400">
                    No shipments linked. FedEx tracking will be auto-connected in Phase 5.
                  </TableCell>
                </TableRow>
              ) : (
                shipments.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell className="font-mono text-sm">
                      {s.trackingNo ?? '—'}
                    </TableCell>
                    <TableCell>{s.carrier ?? '—'}</TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${SHIPMENT_STATUS_STYLE[s.status] ?? 'bg-gray-100 text-gray-700'}`}
                      >
                        {s.status}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm">{s.origin}</TableCell>
                    <TableCell className="text-sm">{s.destination}</TableCell>
                    <TableCell className="text-sm">
                      {s.eta ? s.eta.toLocaleDateString('en-US') : '—'}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </main>
  )
}
