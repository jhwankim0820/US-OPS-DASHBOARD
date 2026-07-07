import { prisma } from '@/lib/prisma'
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

/** Any client that can create an AuditLog row — the base client or a $transaction client. */
type AuditWriter = Pick<Prisma.TransactionClient, 'auditLog'>

function data(entry: AuditEntry) {
  return {
    actor: entry.actor ?? 'system',
    action: entry.action,
    dealId: entry.dealId ?? null,
    field: entry.field ?? null,
    oldValue: entry.oldValue ?? null,
    newValue: entry.newValue ?? null,
    source: entry.source,
  }
}

/**
 * Record an audit log entry. Call with the transaction client (`tx`) inside the
 * same `prisma.$transaction` as the Postgres change it describes, so the log
 * commits atomically with the mutation.
 */
export async function logAudit(tx: AuditWriter, entry: AuditEntry): Promise<void> {
  await tx.auditLog.create({ data: data(entry) })
}

/**
 * Best-effort audit log for NON-transactional writes (e.g. Google Sheets, which
 * has no transaction). Call after the external write succeeds. Never throws —
 * a logging failure must not fail the request that already wrote to the sheet.
 */
export async function logAuditSafe(entry: AuditEntry): Promise<void> {
  try {
    await prisma.auditLog.create({ data: data(entry) })
  } catch (e) {
    console.error('[audit] logAuditSafe failed:', e)
  }
}
