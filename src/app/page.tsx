export const dynamic = 'force-dynamic'
import { Suspense } from 'react'
import { prisma } from '@/lib/prisma'
import type { Prisma } from '@/generated/prisma/client'
import FilterBar from '@/components/shared/FilterBar'
import StatCards from '@/components/dashboard/StatCards'
import DealStatusFlow from '@/components/dashboard/DealStatusFlow'
import InventorySection from '@/components/dashboard/InventorySection'
import PocAllocationSection from '@/components/dashboard/PocAllocationSection'

type SearchParams = Promise<{
  status?: string
  region?: string
  owner?: string
  from?: string
  to?: string
}>

export default async function DashboardPage({ searchParams }: { searchParams: SearchParams }) {
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

  const STAGES = ['Demand', 'Confirmed', 'Waiting for Delivery', 'Delivered', 'Cancelled/Lost']

  const confirmed = deals.filter((d) => d.status === 'Confirmed')
  const demand = deals.filter((d) => d.status === 'Demand')
  const delivered = deals.filter((d) => d.status === 'Delivered')

  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const byStage = STAGES.map((s) => {
    const group = deals.filter((d) => d.status === s)
    return { status: s, revenue: group.reduce((acc, d) => acc + d.revenue, 0), count: group.length }
  })

  return (
    <main className="min-h-screen bg-gray-50 p-6 sm:p-10">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">US Ops Dashboard</h1>
        <p className="text-sm text-gray-500">FuriosaAI · Deal Pipeline Overview</p>
      </div>

      <div className="space-y-6">
        <Suspense>
          <FilterBar
            regions={allRegions.map((d) => d.region)}
            owners={allOwners.map((d) => d.owner)}
          />
        </Suspense>

        <StatCards
          confirmedRevenue={confirmed.reduce((s, d) => s + d.revenue, 0)}
          confirmedCount={confirmed.length}
          demandRevenue={demand.reduce((s, d) => s + d.revenue, 0)}
          demandCount={demand.length}
          totalCards={deals.reduce((s, d) => s + d.cards, 0)}
          deliveredCards={delivered.reduce((s, d) => s + d.cards, 0)}
          totalServers={deals.reduce((s, d) => s + d.servers, 0)}
          deliveredServers={delivered.reduce((s, d) => s + d.servers, 0)}
          staleDeals={deals.filter((d) => new Date(d.updatedAt) < thirtyDaysAgo).length}
          byStage={byStage}
        />

        {/* Inventory donut charts */}
        <InventorySection />

        {/* POC allocation by sales rep */}
        <PocAllocationSection />

        <div>
          <h2 className="mb-3 text-lg font-semibold">Deal Pipeline</h2>
          <DealStatusFlow
            demand={deals.filter((d) => d.status === 'Demand')}
            confirmed={deals.filter((d) => d.status === 'Confirmed')}
            waitingForDelivery={deals.filter((d) => d.status === 'Waiting for Delivery')}
            delivered={deals.filter((d) => d.status === 'Delivered')}
          />
        </div>

      </div>
    </main>
  )
}
