export const dynamic = 'force-dynamic'

import { prisma } from '@/lib/prisma'
import StatCards from '@/components/dashboard/StatCards'
import DealStatusFlow from '@/components/dashboard/DealStatusFlow'
import DonutChart from '@/components/dashboard/DonutChart'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

const FORM_FACTORS = ['Card Only', 'Custom System', 'Rack Server', 'Workstation']

export default async function DashboardPage() {
  const deals = await prisma.deal.findMany({ orderBy: { dmdId: 'asc' } })

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
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight">US Ops Dashboard</h1>
        <p className="text-sm text-gray-500">FuriosaAI · Deal Pipeline Overview</p>
      </div>

      <div className="space-y-8">
        <StatCards
          totalDeals={deals.length}
          totalRevenue={totalRevenue}
          deliveredCards={deliveredCards}
          deliveredServers={deliveredServers}
        />

        <div>
          <h2 className="mb-3 text-lg font-semibold">Deal Pipeline</h2>
          <DealStatusFlow
            demand={deals.filter((d) => d.status === 'Demand')}
            confirmed={deals.filter((d) => d.status === 'Confirmed')}
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
      </div>
    </main>
  )
}
