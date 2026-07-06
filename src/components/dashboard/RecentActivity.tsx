import { formatDistanceToNow } from 'date-fns'
import { prisma } from '@/lib/prisma'

const ACTION_LABELS: Record<string, string> = {
  CREATE_SHIPMENT: 'created a shipment',
  UPDATE_SHIPMENT_STATUS: 'updated shipment status',
  UPDATE_DEAL_STATUS: 'updated deal status',
  CREATE_INVOICE: 'created an invoice',
  UPDATE_INVOICE_STATUS: 'updated invoice status',
}

const SOURCE_LABELS: Record<string, string> = {
  ui: 'UI',
  'fedex-mock': 'FedEx',
  sheets: 'Sheets',
}

type AuditRow = {
  id: string
  actor: string
  action: string
  dealId: string | null
  field: string | null
  oldValue: string | null
  newValue: string | null
  source: string
  timestamp: Date
}

async function loadLogs(): Promise<{ logs: AuditRow[]; error: boolean }> {
  // Isolate the DB read: the dashboard ("/") otherwise renders purely from Google
  // Sheets, so it must NOT 500 just because Postgres is unreachable.
  try {
    const logs = await prisma.auditLog.findMany({ orderBy: { timestamp: 'desc' }, take: 10 })
    return { logs, error: false }
  } catch (e) {
    console.error('[RecentActivity] audit log query failed:', e)
    return { logs: [], error: true }
  }
}

export default async function RecentActivity() {
  const { logs, error } = await loadLogs()

  return (
    <div className="mt-3">
      <div className="mb-2 flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wider text-[#888]">
        <span>🕑</span> Recent Activity
      </div>
      <div className="rounded-[10px] border border-[#e5e5e0] bg-white p-3.5">
        {error ? (
          <p className="text-[11px] text-[#aaa]">Activity log is temporarily unavailable.</p>
        ) : logs.length === 0 ? (
          <p className="text-[11px] text-[#aaa]">No activity yet.</p>
        ) : (
          <ul className="divide-y divide-[#f0f0f0]">
            {logs.map((log) => (
              <li key={log.id} className="flex items-start justify-between gap-4 py-2 first:pt-0 last:pb-0">
                <div className="min-w-0">
                  <p className="text-[11px] text-[#1a1a1a]">
                    <span className="font-medium">{log.actor}</span>{' '}
                    {ACTION_LABELS[log.action] ?? log.action}
                    {log.dealId && <span className="text-[#888]"> · {log.dealId}</span>}
                    <span className="ml-1.5 inline-flex items-center rounded-full bg-[#f0f0ea] px-1.5 py-0.5 text-[9px] text-[#888]">
                      {SOURCE_LABELS[log.source] ?? log.source}
                    </span>
                  </p>
                  {log.field ? (
                    <p className="mt-0.5 text-[10px] text-[#888]">
                      {log.field}: {log.oldValue ?? '—'} → <span className="font-medium">{log.newValue ?? '—'}</span>
                    </p>
                  ) : (
                    log.newValue && <p className="mt-0.5 truncate text-[10px] text-[#888]">{log.newValue}</p>
                  )}
                </div>
                <time className="flex-shrink-0 text-[10px] text-[#aaa]">
                  {formatDistanceToNow(log.timestamp, { addSuffix: true })}
                </time>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
