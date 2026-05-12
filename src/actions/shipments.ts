'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

function generateMockTrackingNo(): string {
  return Array.from({ length: 12 }, () => Math.floor(Math.random() * 10)).join('')
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
  if (process.env.FEDEX_USE_MOCK !== 'true') {
    throw new Error('FedEx live API not yet implemented. Set FEDEX_USE_MOCK=true.')
  }

  const trackingNo = generateMockTrackingNo()

  await prisma.$transaction([
    prisma.shipment.create({
      data: {
        trackingNo,
        carrier: 'FedEx',
        status: 'SUBMITTED',
        origin: 'Incheon, Korea',
        destination: input.destination,
      },
    }),
    prisma.deal.update({
      where: { dmdId: input.dmdId },
      data: { status: 'SUBMITTED' },
    }),
  ])

  revalidatePath(`/deals/${input.dmdId}`)

  return { trackingNo }
}
