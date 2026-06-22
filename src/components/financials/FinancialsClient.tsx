'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import type { InvoiceDeal } from '@/lib/invoice-template'
import OverviewTab from './OverviewTab'
import InvoicesTab from './InvoicesTab'

type Tab = 'overview' | 'invoices'

export default function FinancialsClient({ deals }: { deals: InvoiceDeal[] }) {
  const [tab, setTab] = useState<Tab>('overview')

  return (
    <main className="min-h-screen bg-[#F8F9FA]">
      {/* Tab bar */}
      <div className="flex items-center gap-1 border-b border-[#E2E8F0] bg-white px-6 sm:px-10">
        <TabButton active={tab === 'overview'} onClick={() => setTab('overview')}>
          Overview
        </TabButton>
        <TabButton active={tab === 'invoices'} onClick={() => setTab('invoices')}>
          🧾 Invoices
        </TabButton>
      </div>

      {tab === 'overview' ? <OverviewTab /> : <InvoicesTab deals={deals} />}
    </main>
  )
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'border-b-2 px-4 py-3.5 text-sm transition-colors',
        active
          ? 'border-[#E21500] font-semibold text-[#E21500]'
          : 'border-transparent text-[#6B7280] hover:text-[#111827]',
      )}
    >
      {children}
    </button>
  )
}
