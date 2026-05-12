import { prisma } from '@/lib/prisma'
import DealsTable from '@/components/deals/DealsTable'
import type { Prisma } from '@/generated/prisma/client'

export const dynamic = 'force-dynamic'

type SearchParams = Promise<{
  region?: string
  status?: string
  owner?: string
  from?: string
  to?: string
}>

export default async function DealsPage({ searchParams }: { searchParams: SearchParams }) {
  const { region, status, owner, from, to } = await searchParams

  const where: Prisma.DealWhereInput = {}
  if (region && region !== 'all') where.region = region
  if (status && status !== 'all') where.status = status
  if (owner && owner !== 'all') where.owner = owner
  if (from || to) {
    where.createdAt = {}
    if (from) (where.createdAt as Prisma.DateTimeFilter).gte = new Date(from)
    if (to) {
      const toDate = new Date(to)
      toDate.setDate(toDate.getDate() + 1)
      ;(where.createdAt as Prisma.DateTimeFilter).lte = toDate
    }
  }

  const [deals, allOwners, allRegions] = await Promise.all([
    prisma.deal.findMany({ where, orderBy: { dmdId: 'asc' } }),
    prisma.deal.findMany({ distinct: ['owner'], select: { owner: true }, orderBy: { owner: 'asc' } }),
    prisma.deal.findMany({ distinct: ['region'], select: { region: true }, orderBy: { region: 'asc' } }),
  ])

  return (
    <main className="p-6 sm:p-10">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Deals</h1>
        <p className="text-sm text-gray-500">
          {deals.length}건 조회됨
        </p>
      </div>
      <DealsTable
        deals={deals}
        owners={allOwners.map((d) => d.owner)}
        regions={allRegions.map((d) => d.region)}
      />
    </main>
  )
}
