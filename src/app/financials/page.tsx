export const dynamic = 'force-dynamic'

import { getDeals } from '@/lib/sheets'
import type { InvoiceDeal } from '@/lib/invoice-template'
import FinancialsClient from '@/components/financials/FinancialsClient'

function toISO(d: Date | null): string {
  if (!d) return ''
  return d.toISOString().split('T')[0]
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

  return <FinancialsClient deals={deals} />
}
