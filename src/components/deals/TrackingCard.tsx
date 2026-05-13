'use client'

import { useRouter } from 'next/navigation'
import { useTransition } from 'react'
import { toast } from 'sonner'
import { RefreshCw } from 'lucide-react'
import { syncShipmentStatus } from '@/actions/shipments'
import { Button } from '@/components/ui/button'

const STEPS = [
  {
    key: 'SUBMITTED',
    label: 'Submitted',
    activeClass: 'bg-amber-500',
    ringClass: 'ring-amber-100',
    textClass: 'text-amber-600',
  },
  {
    key: 'IN_TRANSIT',
    label: 'In Transit',
    activeClass: 'bg-blue-500',
    ringClass: 'ring-blue-100',
    textClass: 'text-blue-600',
  },
  {
    key: 'OUT_FOR_DELIVERY',
    label: 'Out for Delivery',
    activeClass: 'bg-orange-500',
    ringClass: 'ring-orange-100',
    textClass: 'text-orange-600',
  },
  {
    key: 'DELIVERED',
    label: 'Delivered',
    activeClass: 'bg-emerald-500',
    ringClass: 'ring-emerald-100',
    textClass: 'text-emerald-600',
  },
] as const

interface TrackingCardProps {
  shipmentId: string
  trackingNo: string | null
  carrier: string | null
  status: string
  origin: string
  destination: string
}

export default function TrackingCard({
  shipmentId,
  trackingNo,
  carrier,
  status,
  origin,
  destination,
}: TrackingCardProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const currentIdx = STEPS.findIndex((s) => s.key === status)
  const isDelivered = status === 'DELIVERED'

  function handleSync() {
    startTransition(async () => {
      try {
        const { status: newStatus } = await syncShipmentStatus(shipmentId)
        const label = STEPS.find((s) => s.key === newStatus)?.label ?? newStatus
        toast.success(`Status updated: ${label}`)
        router.refresh()
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Sync failed.')
      }
    })
  }

  return (
    <div className="rounded-lg border bg-white p-4">
      {/* Header */}
      <div className="mb-5 flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-gray-800">
            {carrier ?? '—'}
            <span className="mx-2 text-gray-300">·</span>
            <span className="font-mono text-gray-500">{trackingNo ?? '—'}</span>
          </p>
          <p className="mt-0.5 text-xs text-gray-400">
            {origin}&nbsp;→&nbsp;{destination}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          disabled={isPending || isDelivered}
          onClick={handleSync}
          className="shrink-0"
        >
          <RefreshCw className={isPending ? 'animate-spin' : ''} />
          {isDelivered ? 'Delivered' : 'Sync with FedEx'}
        </Button>
      </div>

      {/* Step timeline */}
      <div className="relative">
        {/* Track line connecting step circles */}
        <div
          className="absolute top-3.5 h-px bg-gray-200"
          style={{ left: 'calc(12.5% + 14px)', right: 'calc(12.5% + 14px)' }}
        />
        <div className="flex justify-between">
          {STEPS.map((step, idx) => {
            const isComplete = idx <= currentIdx
            const isCurrent = idx === currentIdx
            return (
              <div key={step.key} className="flex w-1/4 flex-col items-center gap-1.5">
                <div
                  className={[
                    'relative z-10 flex h-7 w-7 items-center justify-center rounded-full transition-all duration-200',
                    isComplete ? `${step.activeClass} shadow-sm` : 'border-2 border-gray-200 bg-white',
                    isCurrent ? `ring-4 ${step.ringClass}` : '',
                  ].join(' ')}
                >
                  {isComplete && (
                    <svg
                      className="h-3.5 w-3.5 text-white"
                      viewBox="0 0 16 16"
                      fill="currentColor"
                      aria-hidden="true"
                    >
                      <path d="M13.78 4.22a.75.75 0 0 1 0 1.06l-7.25 7.25a.75.75 0 0 1-1.06 0L2.22 9.28a.75.75 0 0 1 1.06-1.06L6 10.94l6.72-6.72a.75.75 0 0 1 1.06 0Z" />
                    </svg>
                  )}
                </div>
                <p
                  className={[
                    'text-center text-[11px] font-medium leading-snug',
                    isCurrent
                      ? step.textClass
                      : isComplete
                        ? 'text-gray-500'
                        : 'text-gray-300',
                  ].join(' ')}
                >
                  {step.label}
                </p>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
