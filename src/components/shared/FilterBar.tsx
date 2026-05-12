'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { XIcon } from 'lucide-react'
import MultiSelect from '@/components/shared/MultiSelect'

interface FilterBarProps {
  regions: string[]
  owners: string[]
}

const STATUSES = ['Demand', 'Confirmed', 'Delivered']

export default function FilterBar({ regions, owners }: FilterBarProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const selectedStatuses = searchParams?.get('status')?.split(',').filter(Boolean) ?? []
  const selectedRegions = searchParams?.get('region')?.split(',').filter(Boolean) ?? []
  const selectedOwners = searchParams?.get('owner')?.split(',').filter(Boolean) ?? []
  const from: string = searchParams?.get('from') ?? ''
  const to: string = searchParams?.get('to') ?? ''

  const hasFilter =
    selectedStatuses.length > 0 ||
    selectedRegions.length > 0 ||
    selectedOwners.length > 0 ||
    from !== '' ||
    to !== ''

  function updateMultiParam(key: string, values: string[]) {
    const params = new URLSearchParams(searchParams?.toString() ?? '')
    if (values.length === 0) {
      params.delete(key)
    } else {
      params.set(key, values.join(','))
    }
    router.replace(`${pathname}?${params.toString()}`)
  }

  function updateDateParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams?.toString() ?? '')
    if (!value) {
      params.delete(key)
    } else {
      params.set(key, value)
    }
    router.replace(`${pathname}?${params.toString()}`)
  }

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3 shadow-sm">
      <MultiSelect
        label="Status"
        options={STATUSES}
        selected={selectedStatuses}
        onChange={(v) => updateMultiParam('status', v)}
      />
      <MultiSelect
        label="Region"
        options={regions}
        selected={selectedRegions}
        onChange={(v) => updateMultiParam('region', v)}
      />
      <MultiSelect
        label="Owner"
        options={owners}
        selected={selectedOwners}
        onChange={(v) => updateMultiParam('owner', v)}
      />

      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-400">Date</span>
        <input
          type="date"
          value={from}
          onChange={(e) => updateDateParam('from', e.target.value)}
          className="rounded-md border border-gray-200 px-3 py-1.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-300"
        />
        <span className="text-xs text-gray-300">—</span>
        <input
          type="date"
          value={to}
          onChange={(e) => updateDateParam('to', e.target.value)}
          className="rounded-md border border-gray-200 px-3 py-1.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-300"
        />
      </div>

      {hasFilter && (
        <button
          onClick={() => router.replace(pathname)}
          className="flex items-center gap-1 rounded-md border border-gray-200 px-3 py-1.5 text-sm text-gray-500 transition-colors hover:border-gray-400 hover:text-gray-900"
        >
          <XIcon className="h-3.5 w-3.5" />
          Clear
        </button>
      )}
    </div>
  )
}
