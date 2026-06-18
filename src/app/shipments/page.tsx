import { prisma } from '@/lib/prisma'
import ShipmentsTable from '@/components/shipments/ShipmentsTable'
import ShipmentTracker from '@/components/shipments/ShipmentTracker'
import type { ShipmentRow } from '@/components/shipments/ShipmentsTable'

export const dynamic = 'force-dynamic'

export default async function ShipmentsPage() {
  const shipments = await prisma.shipment.findMany({
    orderBy: { createdAt: 'desc' },
    include: { deal: { select: { customer: true, dmdId: true } } },
  })

  const rows: ShipmentRow[] = shipments.map((s) => ({
    id: s.id,
    trackingNo: s.trackingNo,
    status: s.status,
    origin: s.origin,
    destination: s.destination,
    createdAt: s.createdAt.toISOString(),
    deal: s.deal,
  }))

  return (
    <main className="p-6 sm:p-10">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-white">Shipments</h1>
        <p className="text-sm text-[#888888]">Track inbound and outbound hardware shipments.</p>
      </div>

      {/* Inbound / Outbound tracker + FedEx dispatch */}
      <ShipmentTracker />

      {/* Existing shipments table */}
      <div className="mt-10">
        <h2 className="text-lg font-semibold mb-3 text-white">All Shipment Records</h2>
        <ShipmentsTable shipments={rows} />
      </div>
    </main>
  )
}
