import { Suspense } from 'react'
import { prisma } from '@/lib/prisma'
import type { Prisma } from '@/generated/prisma/client'
import FilterBar from '@/components/shared/FilterBar'
import DealsTable from '@/components/deals/DealsTable'

export const dynamic = 'force-dynamic'

type SearchParams = Promise<{
  status?: string
  region?: string
  owner?: string
  from?: string
  to?: string
}>

export default async function DealsPage({ searchParams }: { searchParams: SearchParams }) {
  const { status, region, owner, from, to } = await searchParams

  const where: Prisma.DealWhereInput = {}
  const statuses = status?.split(',').filter(Boolean) ?? []
  const regions = region?.split(',').filter(Boolean) ?? []
  const owners = owner?.split(',').filter(Boolean) ?? []

  if (statuses.length > 0) where.status = { in: statuses }
  if (regions.length > 0) where.region = { in: regions }
  if (owners.length > 0) where.owner = { in: owners }
  if (from || to) {
    const dateFilter: { gte?: Date; lt?: Date } = {}
    if (from) dateFilter.gte = new Date(from)
    if (to) {
      const toDate = new Date(to)
      toDate.setDate(toDate.getDate() + 1)
      dateFilter.lt = toDate
    }
    where.createdAt = dateFilter
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
        <p className="text-sm text-gray-500">{deals.length} items found</p>
      </div>
      <div className="space-y-4">
        <Suspense>
          <FilterBar
            regions={allRegions.map((d) => d.region)}
            owners={allOwners.map((d) => d.owner)}
          />
        </Suspense>
        <DealsTable deals={deals} />
      </div>
    </main>
  )
}
