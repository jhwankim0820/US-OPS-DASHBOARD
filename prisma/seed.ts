import 'dotenv/config'
import { PrismaClient } from '../src/generated/prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

const adapter = new PrismaPg(process.env.DATABASE_URL!)
const prisma = new PrismaClient({ adapter })

async function main() {
  await prisma.deal.deleteMany()
  await prisma.shipment.deleteMany()

  await prisma.deal.createMany({
    data: [
      {
        dmdId: 'DMD-62',
        customer: 'LG CNS',
        status: 'Delivered',
        category: 'B2B',
        formFactor: 'Rack Server',
        cards: 0,
        servers: 4,
        revenue: 18.5,
        region: 'Korea',
        owner: 'Ji-eun Lee',
        createdAt: new Date('2025-11-05'),
      },
      {
        dmdId: 'DMD-63',
        customer: 'KT Cloud',
        status: 'Waiting for Delivery',
        category: 'B2B',
        formFactor: 'Card Only',
        cards: 8,
        servers: 0,
        revenue: 9.2,
        region: 'Korea',
        owner: 'Jun-hyuk Park',
        createdAt: new Date('2025-12-12'),
      },
      {
        dmdId: 'DMD-64',
        customer: 'Samsung SDS',
        status: 'Demand',
        category: 'B2B',
        formFactor: 'Custom System',
        cards: 16,
        servers: 0,
        revenue: 24.0,
        region: 'Korea',
        owner: 'Ji-eun Lee',
        createdAt: new Date('2026-01-08'),
      },
      {
        dmdId: 'DMD-65',
        customer: 'Kakao Cloud',
        status: 'Delivered',
        category: 'B2B',
        formFactor: 'Card Only',
        cards: 4,
        servers: 0,
        revenue: 6.8,
        region: 'Korea',
        owner: 'Jun-hyuk Park',
        createdAt: new Date('2025-10-20'),
      },
      {
        dmdId: 'DMD-66',
        customer: 'ETRI',
        status: 'Waiting for Delivery',
        category: 'B2G',
        formFactor: 'Rack Server',
        cards: 0,
        servers: 8,
        revenue: 36.0,
        region: 'Korea',
        owner: 'Su-yeon Choi',
        createdAt: new Date('2026-02-03'),
      },
      {
        dmdId: 'DMD-67',
        customer: 'NAVER Cloud',
        status: 'Delivered',
        category: 'B2B',
        formFactor: 'Rack Server',
        cards: 0,
        servers: 16,
        revenue: 72.0,
        region: 'Korea',
        owner: 'Ji-eun Lee',
        createdAt: new Date('2025-09-15'),
      },
      {
        dmdId: 'DMD-68',
        customer: 'SK Telecom',
        status: 'Demand',
        category: 'B2B',
        formFactor: 'Workstation',
        cards: 2,
        servers: 0,
        revenue: 2.4,
        region: 'Korea',
        owner: 'Jun-hyuk Park',
        createdAt: new Date('2026-03-22'),
      },
      {
        dmdId: 'DMD-69',
        customer: 'MSIT',
        status: 'Confirmed',
        category: 'B2G',
        formFactor: 'Custom System',
        cards: 32,
        servers: 0,
        revenue: 48.0,
        region: 'Korea',
        owner: 'Su-yeon Choi',
        createdAt: new Date('2026-01-30'),
      },
      {
        dmdId: 'DMD-70',
        customer: 'FuriosaAI (Internal)',
        status: 'Delivered',
        category: 'Internal',
        formFactor: 'Workstation',
        cards: 4,
        servers: 0,
        revenue: 0.0,
        region: 'Korea',
        owner: 'Jun-hyuk Park',
        createdAt: new Date('2025-08-01'),
      },
      {
        dmdId: 'DMD-71',
        customer: 'US Cloud Provider',
        status: 'Demand',
        category: 'B2B',
        formFactor: 'Rack Server',
        cards: 0,
        servers: 2,
        revenue: 15.0,
        region: 'US',
        owner: 'Ji-eun Lee',
        createdAt: new Date('2026-04-10'),
      },
    ],
  })

  await prisma.shipment.createMany({
    data: [
      {
        trackingNo: '748923472384',
        carrier: 'FedEx',
        status: 'DELIVERED',
        origin: 'Incheon, Korea',
        destination: 'Seoul, Korea',
        eta: new Date('2025-11-20'),
      },
      {
        trackingNo: '823492783401',
        carrier: 'FedEx',
        status: 'DELIVERED',
        origin: 'Incheon, Korea',
        destination: 'Seongnam, Korea',
        eta: new Date('2025-10-30'),
      },
      {
        carrier: 'FedEx',
        status: 'IN_TRANSIT',
        origin: 'Incheon, Korea',
        destination: 'San Jose, US',
        eta: new Date('2026-05-20'),
      },
    ],
  })

  console.log('✅ Seed complete: 10 deals (with varied dates), 3 shipments')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
