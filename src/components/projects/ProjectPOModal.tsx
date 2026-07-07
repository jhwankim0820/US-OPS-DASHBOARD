'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import type { InvoiceDeal } from '@/lib/invoice-template'

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      // result is a data URL: "data:<mime>;base64,<data>" — keep only the data.
      resolve(result.split(',')[1] ?? '')
    }
    reader.onerror = () => reject(reader.error ?? new Error('File read failed'))
    reader.readAsDataURL(file)
  })
}

export default function ProjectPOModal({
  deal,
  onClose,
  onSaved,
}: {
  deal: InvoiceDeal
  onClose: () => void
  onSaved: () => void
}) {
  const [file, setFile] = useState<File | null>(null)
  const [saving, setSaving] = useState(false)

  async function save() {
    if (!file) {
      toast.error('Choose a PO file to upload')
      return
    }
    setSaving(true)
    try {
      const contentBase64 = await fileToBase64(file)
      const res = await fetch('/api/po/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dealId: deal.id,
          fileName: file.name,
          mimeType: file.type,
          contentBase64,
        }),
      })
      const data = await res.json()
      if (!res.ok || data.success === false) throw new Error(data.error || 'Upload failed')
      toast.success('PO saved to Drive', { description: `${deal.id} · 2. PO · ${file.name}` })
      onSaved()
    } catch (e) {
      toast.error('PO upload failed', { description: e instanceof Error ? e.message : String(e) })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto bg-black/40 p-4 sm:p-8"
      onClick={onClose}
    >
      <div className="my-8 w-full max-w-lg rounded-2xl bg-white shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-[#E2E8F0] px-6 py-4">
          <div>
            <h2 className="text-base font-semibold text-[#111827]">Save Purchase Order</h2>
            <p className="text-xs text-[#9CA3AF]">
              {deal.id} · {deal.customer} → Drive “2. PO”
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-md px-2 py-1 text-xl leading-none text-[#9CA3AF] hover:bg-[#F1F3F5] hover:text-[#111827]"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <div className="space-y-4 p-6">
          <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-[#c0dd97] bg-[#f3f9ec] px-4 py-10 text-center transition-colors hover:bg-[#eaf3de]">
            <span className="text-2xl">📄</span>
            <span className="text-sm font-medium text-[#0f6e56]">
              {file ? file.name : 'Click to choose the received PO file'}
            </span>
            <span className="text-[11px] text-[#6B7280]">PDF, image, or document — stored in the deal’s “2. PO” folder</span>
            <input
              type="file"
              className="hidden"
              accept=".pdf,.png,.jpg,.jpeg,.doc,.docx,.xls,.xlsx,.csv,.txt"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
          </label>

          {file && (
            <p className="text-xs text-[#6B7280]">
              Selected: <span className="font-medium text-[#111827]">{file.name}</span> ({Math.max(1, Math.round(file.size / 1024))} KB)
            </p>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button
              onClick={onClose}
              className="rounded-lg border border-[#E2E8F0] bg-white px-4 py-2.5 text-sm font-medium text-[#6B7280] transition-colors hover:text-[#111827]"
            >
              Cancel
            </button>
            <button
              onClick={save}
              disabled={saving || !file}
              className="inline-flex items-center gap-2 rounded-lg bg-[#1d9e75] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#187a5a] disabled:opacity-50"
            >
              {saving ? (
                <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
              ) : (
                '💾'
              )}{' '}
              Save PO to Drive
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
