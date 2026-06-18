'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { XIcon } from 'lucide-react'
import MultiSelect from '@/components/shared/MultiSelect'
import DatePicker from '@/components/shared/DatePicker'

interface FilterBarProps {
  regions: string[]
  owners: string[]
}

const STATUSES = ['Demand', 'Confirmed', 'Waiting for Delivery', 'SUBMITTED', 'Delivered']

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
    <div className="flex flex-wrap items-center gap-3 rounded-xl border border-[#333333] bg-[#252525] px-4 py-3">
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
        <span className="text-sm text-[#666666]">Date</span>
        <DatePicker
          value={from}
          onChange={(v) => updateDateParam('from', v)}
          placeholder="From"
        />
        <span className="text-xs text-[#444444]">—</span>
        <DatePicker
          value={to}
          onChange={(v) => updateDateParam('to', v)}
          placeholder="To"
        />
      </div>

      {hasFilter && (
        <button
          onClick={() => router.replace(pathname)}
          className="flex items-center gap-1 rounded-md border border-[#333333] px-3 py-1.5 text-sm text-[#888888] transition-colors hover:border-[#555555] hover:text-white"
        >
          <XIcon className="h-3.5 w-3.5" />
          Clear
        </button>
      )}
    </div>
  )
}
