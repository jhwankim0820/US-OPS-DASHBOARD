export const dynamic = 'force-dynamic'

import { getDeals } from '@/lib/sheets'
import ProjectManagementClient, { type ProjectDeal } from '@/components/projects/ProjectManagementClient'

// getDeals() is wrapped in unstable_cache → dates may arrive as strings on a cache hit.
function toISO(d: Date | string | null): string {
  if (!d) return ''
  const date = d instanceof Date ? d : new Date(d)
  return isNaN(date.getTime()) ? '' : date.toISOString().split('T')[0]
}

export default async function ProjectsPage() {
  const sheetDeals = await getDeals()

  const deals: ProjectDeal[] = sheetDeals.map((d) => ({
    id: d.id,
    customer: d.customer,
    status: d.status,
    revenue: d.revenue > 0 ? d.revenue : null,
    cards: d.cards,
    servers: d.servers,
    owner: d.owner,
    region: d.region,
    formFactor: d.formFactor,
    category: d.category,
    npuModel: d.npuModel,
    shipDate: toISO(d.billingDate ?? d.etdDate),
    date: toISO(d.etdDate ?? d.poDate ?? d.createdAt),
  }))

  return <ProjectManagementClient deals={deals} />
}
