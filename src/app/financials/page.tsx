export const dynamic = 'force-dynamic'

import { getDeals } from '@/lib/sheets'
import type { InvoiceDeal } from '@/lib/invoice-template'
import { type UsDeal, countryCode } from '@/lib/us-ops'
import FinancialsClient from '@/components/financials/FinancialsClient'

// getDeals() is wrapped in unstable_cache, which JSON-serializes its result —
// so on a cache hit these dates arrive as strings, not Date objects.
function toISO(d: Date | string | null): string {
  if (!d) return ''
  const date = d instanceof Date ? d : new Date(d)
  return isNaN(date.getTime()) ? '' : date.toISOString().split('T')[0]
}

export default async function FinancialsPage() {
  const sheetDeals = await getDeals()

  const deals: InvoiceDeal[] = sheetDeals.map((d) => ({
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
  }))

  const revenueDeals: UsDeal[] = sheetDeals
    .filter((d) => d.region !== 'Korea')
    .map((d) => ({
      id: d.id,
      customer: d.customer,
      status: d.status,
      category: d.category,
      region: d.region,
      country: countryCode(d.salesParty, d.region),
      owner: d.owner,
      revenue: d.revenue,
      cards: d.cards,
      servers: d.servers,
      etd: toISO(d.etdDate ?? d.billingDate),
      dealDate: toISO(d.poDate ?? d.createdAt),
    }))

  return <FinancialsClient deals={deals} revenueDeals={revenueDeals} />
}
