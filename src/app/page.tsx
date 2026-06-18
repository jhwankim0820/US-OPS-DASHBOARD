export const dynamic = 'force-dynamic'
import { Suspense } from 'react'
import { getDeals } from '@/lib/sheets'
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

  const allDeals = await getDeals()

  const statuses = status?.split(',').filter(Boolean) ?? []
  const regions = region?.split(',').filter(Boolean) ?? []
  const owners = owner?.split(',').filter(Boolean) ?? []

  let deals = allDeals
  if (statuses.length) deals = deals.filter((d) => statuses.includes(d.status))
  if (regions.length) deals = deals.filter((d) => regions.includes(d.region))
  if (owners.length) deals = deals.filter((d) => owners.includes(d.owner))
  if (from) deals = deals.filter((d) => d.createdAt >= new Date(from))
  if (to) {
    deals = deals.filter((d) => {
      const toDate = new Date(to)
      toDate.setDate(toDate.getDate() + 1)
      return d.createdAt < toDate
    })
  }

  const allOwners = [...new Set(allDeals.map((d) => d.owner).filter(Boolean))].sort()
  const allRegions = [...new Set(allDeals.map((d) => d.region).filter(Boolean))].sort()

  const STAGES = ['Demand', 'Confirmed', 'Waiting for Delivery', 'Delivered', 'Cancelled/Lost']
  const delivered = deals.filter((d) => d.status === 'Delivered')
  const byStage = STAGES.map((s) => {
    const group = deals.filter((d) => d.status === s)
    return { status: s, revenue: group.reduce((acc, d) => acc + d.revenue, 0), count: group.length }
  })

  return (
    <main className="min-h-screen bg-[#1c1c22] p-6 sm:p-10">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-white">US Ops Dashboard</h1>
        <p className="text-sm text-[#AAAAAA]">FuriosaAI · Deal Pipeline Overview</p>
      </div>

      <div className="space-y-6">
        <Suspense>
          <FilterBar regions={allRegions} owners={allOwners} />
        </Suspense>

        <StatCards
          totalCards={deals.reduce((s, d) => s + d.cards, 0)}
          deliveredCards={delivered.reduce((s, d) => s + d.cards, 0)}
          totalServers={deals.reduce((s, d) => s + d.servers, 0)}
          deliveredServers={delivered.reduce((s, d) => s + d.servers, 0)}
          byStage={byStage}
        />

        <InventorySection />
        <PocAllocationSection />

        <div>
          <h2 className="mb-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#888888]">Deal Pipeline</h2>
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
