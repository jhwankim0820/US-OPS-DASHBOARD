export const dynamic = 'force-dynamic'
import { Suspense } from 'react'
import { getDeals } from '@/lib/sheets'
import FilterBar from '@/components/shared/FilterBar'
import DealsTable from '@/components/deals/DealsTable'

type SearchParams = Promise<{
  status?: string
  region?: string
  owner?: string
  from?: string
  to?: string
}>

export default async function DealsPage({ searchParams }: { searchParams: SearchParams }) {
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

  return (
    <main className="p-6 sm:p-10">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-white">Deals</h1>
        <p className="text-sm text-[#888888]">{deals.length} items found</p>
      </div>
      <div className="space-y-4">
        <Suspense>
          <FilterBar regions={allRegions} owners={allOwners} />
        </Suspense>
        <DealsTable deals={deals} />
      </div>
    </main>
  )
}
