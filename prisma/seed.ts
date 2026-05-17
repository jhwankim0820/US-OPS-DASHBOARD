import dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })
import { PrismaClient } from '../src/generated/prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

const adapter = new PrismaPg(process.env.DATABASE_URL!)
const prisma = new PrismaClient({ adapter })

async function main() {
  await prisma.shipment.deleteMany()
  await prisma.deal.deleteMany()

  await prisma.deal.createMany({
    data: [
      {
        dmdId: 'DMD-80',
        customer: 'MIMOS',
        status: 'Demand',
        category: 'B2B',
        formFactor: 'Card Only',
        cards: 2,
        servers: 0,
        revenue: 16000,
        region: 'Malaysia',
        owner: 'Addison Chi',
        createdAt: new Date('2026-05-17'),
      },
      {
        dmdId: 'DMD-81',
        customer: 'CADT',
        status: 'Demand',
        category: 'B2B',
        formFactor: 'Rack Server',
        cards: 4,
        servers: 1,
        revenue: 100000,
        region: 'Cambodia',
        owner: 'Addison Chi',
        createdAt: new Date('2026-05-17'),
      },
      {
        dmdId: 'DMD-82',
        customer: 'NTU',
        status: 'Demand',
        category: 'B2B',
        formFactor: 'Rack Server',
        cards: 48,
        servers: 6,
        revenue: 800000,
        region: 'Singapore',
        owner: 'Addison Chi',
        createdAt: new Date('2026-05-17'),
      },
      {
        dmdId: 'DMD-83',
        customer: 'Flexgrid',
        status: 'Confirmed',
        category: 'B2B',
        formFactor: 'Card Only',
        cards: 10,
        servers: 0,
        revenue: 70368,
        region: 'US',
        owner: 'Alex Liu',
        createdAt: new Date('2026-05-09'),
      },
      {
        dmdId: 'DMD-84',
        customer: 'J.A.M Global',
        status: 'Confirmed',
        category: 'B2B',
        formFactor: 'Card Only',
        cards: 2,
        servers: 0,
        revenue: 15394,
        region: 'US',
        owner: 'Alex Liu',
        createdAt: new Date('2026-05-03'),
      },
      {
        dmdId: 'DMD-85',
        customer: 'I/ONX',
        status: 'Demand',
        category: 'B2B',
        formFactor: 'Card Only',
        cards: 64,
        servers: 0,
        revenue: 511680,
        region: 'US',
        owner: 'Tom Gallivan',
        createdAt: new Date('2026-05-17'),
      },
      {
        dmdId: 'DMD-86',
        customer: 'US Internal',
        status: 'Demand',
        category: 'Internal',
        formFactor: 'Rack Server',
        cards: 32,
        servers: 4,
        revenue: 0,
        region: 'US',
        owner: 'Alex Liu',
        createdAt: new Date('2026-05-17'),
      },
      {
        dmdId: 'DMD-87',
        customer: 'US Internal',
        status: 'Demand',
        category: 'Internal',
        formFactor: 'Card Only',
        cards: 24,
        servers: 0,
        revenue: 0,
        region: 'US',
        owner: 'Alex Liu',
        createdAt: new Date('2026-05-17'),
      },
      {
        dmdId: 'DMD-88',
        customer: 'SG Demo for Keppel',
        status: 'Demand',
        category: 'Rental',
        formFactor: 'Rack Server',
        cards: 8,
        servers: 1,
        revenue: 0,
        region: 'Singapore',
        owner: 'Addison Chi',
        createdAt: new Date('2026-05-17'),
      },
      {
        dmdId: 'DMD-89',
        customer: 'US Internal',
        status: 'Demand',
        category: 'Rental',
        formFactor: 'Rack Server',
        cards: 8,
        servers: 12,
        revenue: 0,
        region: 'US',
        owner: 'Alex Liu',
        createdAt: new Date('2026-05-17'),
      },
    ],
  })

  console.log('✅ Seed complete: 10 deals (real US ops data)')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
