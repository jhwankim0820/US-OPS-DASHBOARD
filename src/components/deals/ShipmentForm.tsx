'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { PackageIcon } from 'lucide-react'
import { createShipment } from '@/actions/shipments'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

interface ShipmentFormProps {
  dmdId: string
  dealStatus: string
}

export default function ShipmentForm({ dmdId, dealStatus }: ShipmentFormProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  const [destination, setDestination] = useState('')
  const [recipient, setRecipient] = useState('')
  const [weightKg, setWeightKg] = useState('')

  const isActive = dealStatus === 'Waiting for Delivery'

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    startTransition(async () => {
      try {
        const { trackingNo } = await createShipment({
          dmdId,
          destination,
          recipient,
          weightKg: parseFloat(weightKg) || 0,
        })
        setOpen(false)
        toast.success(`Shipment created — Tracking: ${trackingNo}`)
        router.refresh()
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Failed to create shipment.')
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button
            disabled={!isActive}
            className="flex items-center gap-2"
            title={isActive ? undefined : 'Only available when status is Waiting for Delivery'}
          />
        }
      >
        <PackageIcon className="h-4 w-4" />
        Create Shipment
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create FedEx Shipment</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="mt-2 space-y-4">
          <Field label="Destination">
            <input
              required
              placeholder="e.g. San Jose, US"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-gray-300"
            />
          </Field>

          <Field label="Recipient">
            <input
              required
              placeholder="Full name"
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-gray-300"
            />
          </Field>

          <Field label="Weight (kg)">
            <input
              required
              type="number"
              min="0.1"
              step="0.1"
              placeholder="e.g. 12.5"
              value={weightKg}
              onChange={(e) => setWeightKg(e.target.value)}
              className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-gray-300"
            />
          </Field>

          <DialogFooter>
            <Button type="submit" disabled={isPending} className="w-full sm:w-auto">
              {isPending ? 'Submitting…' : 'Submit to FedEx'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <label className="text-xs font-medium text-gray-500">{label}</label>
      {children}
    </div>
  )
}
