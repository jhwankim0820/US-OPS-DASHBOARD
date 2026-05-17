export const dynamic = 'force-dynamic'
import { Suspense } from 'react'
import { prisma } from '@/lib/prisma'
import type { Prisma } from '@/generated/prisma/client'
import FilterBar from '@/components/shared/FilterBar'
import StatCards from '@/components/dashboard/StatCards'
import DealStatusFlow from '@/components/dashboard/DealStatusFlow'
import DonutChart from '@/components/dashboard/DonutChart'
import InventorySection from '@/components/dashboard/InventorySection'
import PocAllocationSection from '@/components/dashboard/PocAllocationSection'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

const FORM_FACTORS = ['Card Only', 'Custom System', 'Rack Server', 'Workstation']

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

  const totalRevenue = deals.reduce((s, d) => s + d.revenue, 0)
  const delivered = deals.filter((d) => d.status === 'Delivered')
  const deliveredCards = delivered.reduce((s, d) => s + d.cards, 0)
  const deliveredServers = delivered.reduce((s, d) => s + d.servers, 0)

  const formFactorData = FORM_FACTORS.map((ff) => {
    const group = deals.filter((d) => d.formFactor === ff)
    return {
      name: ff,
      value: group.length,
      revenue: group.reduce((s, d) => s + d.revenue, 0),
    }
  }).filter((d) => d.value > 0)

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
          totalDeals={deals.length}
          totalRevenue={totalRevenue}
          deliveredCards={deliveredCards}
          deliveredServers={deliveredServers}
        />

        {/* Inventory donut charts */}
        <InventorySection />

        <div>
          <h2 className="mb-3 text-lg font-semibold">Deal Pipeline</h2>
          <DealStatusFlow
            demand={deals.filter((d) => d.status === 'Demand')}
            confirmed={deals.filter((d) => d.status === 'Confirmed')}
            waitingForDelivery={deals.filter((d) => d.status === 'Waiting for Delivery')}
            delivered={deals.filter((d) => d.status === 'Delivered')}
          />
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Form Factor Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <DonutChart data={formFactorData} />
          </CardContent>
        </Card>

        {/* POC allocation by sales rep */}
        <PocAllocationSection />
      </div>
    </main>
  )
}
