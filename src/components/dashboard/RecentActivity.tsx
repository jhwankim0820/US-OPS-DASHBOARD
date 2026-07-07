import { formatDistanceToNow } from 'date-fns'
import { prisma } from '@/lib/prisma'

const ACTION_META: Record<string, { label: string; icon: string; cls: string }> = {
  CREATE_SHIPMENT: { label: 'created a shipment', icon: '📦', cls: 'bg-[#e6f1fb] text-[#185fa5]' },
  UPDATE_DEAL_STATUS: { label: 'updated deal status', icon: '🏷', cls: 'bg-[#faeeda] text-[#854f0b]' },
  UPDATE_SHIPMENT_STATUS: { label: 'updated shipment status', icon: '🚚', cls: 'bg-[#eaf3de] text-[#3b6d11]' },
}

function meta(action: string) {
  return ACTION_META[action] ?? { label: action, icon: '•', cls: 'bg-[#f0f0ea] text-[#888]' }
}

export default async function RecentActivity() {
  let logs: Awaited<ReturnType<typeof prisma.auditLog.findMany>> = []
  try {
    logs = await prisma.auditLog.findMany({ orderBy: { timestamp: 'desc' }, take: 8 })
  } catch {
    // AuditLog table may not exist yet — fail soft so the dashboard still renders.
    logs = []
  }

  return (
    <div className="rounded-[10px] border border-[#e5e5e0] bg-white p-3.5">
      <div className="mb-2.5 flex items-center gap-1.5 text-[11px] font-medium">
        <span style={{ color: '#534ab7' }}>🕘</span> Recent Activity
      </div>
      {logs.length === 0 ? (
        <p className="text-[10px] italic text-[#aaa]">No activity recorded yet.</p>
      ) : (
        <ul className="divide-y divide-[#f0f0f0]">
          {logs.map((log) => {
            const m = meta(log.action)
            return (
              <li key={log.id} className="flex items-start justify-between gap-3 py-1.5 first:pt-0 last:pb-0">
                <div className="flex min-w-0 items-start gap-2">
                  <span className={`mt-0.5 flex h-[22px] w-[22px] flex-shrink-0 items-center justify-center rounded-[5px] text-[11px] ${m.cls}`}>
                    {m.icon}
                  </span>
                  <div className="min-w-0">
                    <div className="text-[11px] text-[#1a1a1a]">
                      <span className="font-medium">{log.actor}</span> {m.label}
                      {log.dealId && <span className="text-[#888]"> · {log.dealId}</span>}
                    </div>
                    {log.field ? (
                      <div className="mt-0.5 text-[10px] text-[#888]">
                        {log.field}: {log.oldValue ?? '—'} → <span className="font-medium text-[#1a1a1a]">{log.newValue ?? '—'}</span>
                      </div>
                    ) : (
                      log.newValue && <div className="mt-0.5 truncate text-[10px] text-[#888]">{log.newValue}</div>
                    )}
                  </div>
                </div>
                <time className="flex-shrink-0 text-[9px] text-[#aaa]">
                  {formatDistanceToNow(log.timestamp, { addSuffix: true })}
                </time>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
