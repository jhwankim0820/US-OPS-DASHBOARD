import type { Prisma } from '@/generated/prisma/client'

export interface AuditEntry {
  actor?: string // defaults to 'system'; inject the real user once auth exists
  action: string
  dealId?: string | null
  field?: string
  oldValue?: string | null
  newValue?: string | null
  source: string
}

/**
 * Record an audit log entry. Always call this with the transaction client (`tx`)
 * inside the same `prisma.$transaction` as the change it describes, so the log
 * commits atomically with the mutation it records.
 */
export async function logAudit(tx: Prisma.TransactionClient, entry: AuditEntry): Promise<void> {
  await tx.auditLog.create({
    data: {
      actor: entry.actor ?? 'system',
      action: entry.action,
      dealId: entry.dealId ?? null,
      field: entry.field ?? null,
      oldValue: entry.oldValue ?? null,
      newValue: entry.newValue ?? null,
      source: entry.source,
    },
  })
}
