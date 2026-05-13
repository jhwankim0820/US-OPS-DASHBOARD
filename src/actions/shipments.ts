'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

function generateMockTrackingNo(): string {
  return Array.from({ length: 12 }, () => Math.floor(Math.random() * 10)).join('')
}

function requireMock() {
  if (process.env.FEDEX_USE_MOCK !== 'true') {
    throw new Error('FedEx live API not yet implemented. Set FEDEX_USE_MOCK=true.')
  }
}

export interface CreateShipmentInput {
  dmdId: string
  destination: string
  recipient: string
  weightKg: number
}

export async function createShipment(
  input: CreateShipmentInput,
): Promise<{ trackingNo: string }> {
  requireMock()

  const trackingNo = generateMockTrackingNo()

  await prisma.$transaction(async (tx) => {
    await tx.shipment.create({
      data: {
        dmdId: input.dmdId,
        trackingNo,
        carrier: 'FedEx',
        status: 'SUBMITTED',
        origin: 'Incheon, Korea',
        destination: input.destination,
      },
    })
    await tx.deal.update({
      where: { dmdId: input.dmdId },
      data: { status: 'SUBMITTED' },
    })
  })

  revalidatePath(`/deals/${input.dmdId}`)

  return { trackingNo }
}

const STATUS_PROGRESSION: Record<string, string> = {
  SUBMITTED: 'IN_TRANSIT',
  IN_TRANSIT: 'OUT_FOR_DELIVERY',
  OUT_FOR_DELIVERY: 'DELIVERED',
}

export async function syncShipmentStatus(shipmentId: string): Promise<{ status: string }> {
  requireMock()

  const shipment = await prisma.shipment.findUnique({ where: { id: shipmentId } })
  if (!shipment) throw new Error('Shipment not found.')

  const nextStatus = STATUS_PROGRESSION[shipment.status]
  if (!nextStatus) return { status: shipment.status }

  await prisma.$transaction(async (tx) => {
    await tx.shipment.update({
      where: { id: shipmentId },
      data: { status: nextStatus },
    })
    if (nextStatus === 'DELIVERED' && shipment.dmdId) {
      await tx.deal.update({
        where: { dmdId: shipment.dmdId },
        data: { status: 'Delivered' },
      })
    }
  })

  if (shipment.dmdId) revalidatePath(`/deals/${shipment.dmdId}`)
  revalidatePath('/shipments')

  return { status: nextStatus }
}
