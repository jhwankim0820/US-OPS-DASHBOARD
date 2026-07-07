import { google } from 'googleapis'
import { unstable_cache } from 'next/cache'
import { logAuditSafe } from '@/lib/audit'

const SPREADSHEET_ID = process.env.GOOGLE_SPREADSHEET_ID!.replace(/^﻿/, '').trim()
// A~R = original deal columns; S~W = workflow-stage columns written by the ops tool.
const RANGE = 'A2:W200'

// Ops-tool workflow stages tracked in the Deals tab (source of truth for progress).
export type DealStage = 'quote' | 'po' | 'invoice' | 'ship' | 'tp'
const STAGE_COL: Record<DealStage, string> = { quote: 'S', po: 'T', invoice: 'U', ship: 'V', tp: 'W' }
const STAGE_HEADER: Record<DealStage, string> = { quote: 'Quote', po: 'PO', invoice: 'Invoice', ship: 'Ship', tp: 'TP' }
// 0-indexed positions of the stage columns within a row (S=18 … W=22).
const STAGE_IDX: Record<DealStage, number> = { quote: 18, po: 19, invoice: 20, ship: 21, tp: 22 }

const US_TEAM = new Set([
  'alex.liu@furiosa.ai',
  'tom.gallivan@furiosa.ai',
  'sean.berner@furiosa.ai',
  'elil@furiosa.ai',
  'addison@furiosa.ai',
  'bill.leszinske@furiosa.ai',
])

export interface SheetDeal {
  id: string
  dmdId: string
  summary: string
  priority: string
  owner: string
  customer: string
  npuModel: string
  formFactor: string
  servers: number
  cards: number
  deliveryPurpose: string
  poDate: Date | null
  etdDate: Date | null
  billingDate: Date | null
  salesParty: string
  currency: string
  revenue: number
  category: string
  status: string
  region: string
  createdAt: Date
  /** 1-based physical row number in the Deals tab (for stage write-back). */
  rowNumber: number
  /** Workflow-stage cells (S~W). Empty string = not done. Usually an ISO date. */
  quoteAt: string
  poAt: string
  invoiceAt: string
  shipAt: string
}

function isDealRow(r: string[]): boolean {
  const owner = r[3]?.trim().toLowerCase() ?? ''
  const customer = r[4]?.trim() ?? ''
  return US_TEAM.has(owner) && customer !== ''
}

function getAuth() {
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_JSON
  if (!raw) throw new Error('GOOGLE_SERVICE_ACCOUNT_JSON is not set')
  const credentials = JSON.parse(raw.replace(/^﻿/, '').trim())
  return new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
  })
}

function parseDate(raw: string | undefined): Date | null {
  if (!raw?.trim()) return null
  const s = raw.replace(/\s*12:00\s*AM/i, '').trim()
  const m = s.match(/^(\d{1,2})\/([\w]+)\/(\d{2,4})$/)
  if (!m) return null
  const months: Record<string, string> = {
    jan: '01', feb: '02', mar: '03', apr: '04', may: '05',
    jun: '06', june: '06', jul: '07', aug: '08', sep: '09',
    oct: '10', nov: '11', dec: '12',
  }
  const mo = months[m[2].toLowerCase()]
  if (!mo) return null
  const yr = m[3].length === 2 ? 2000 + parseInt(m[3]) : parseInt(m[3])
  return new Date(`${yr}-${mo}-${m[1].padStart(2, '0')}`)
}

function parseAmount(raw: string | undefined): number {
  if (!raw?.trim()) return 0
  return parseFloat(raw.replace(/,/g, '')) || 0
}

function mapRegion(party: string): string {
  const p = party?.toLowerCase() ?? ''
  if (p.includes('korea') || p.includes('hq')) return 'Korea'
  if (p === 'us') return 'US'
  if (['malaysia', 'singapore', 'cambodia'].some((x) => p.includes(x))) return 'APAC'
  if (p.includes('europe')) return 'Europe'
  return party || 'Unknown'
}

function inferStatus(po: Date | null, etd: Date | null, billing: Date | null): string {
  const now = new Date()
  if (billing && billing < now) return 'Delivered'
  if (etd) return 'Waiting for Delivery'
  if (po) return 'Confirmed'
  return 'Demand'
}

async function fetchDeals(): Promise<SheetDeal[]> {
  let auth: ReturnType<typeof getAuth>
  try {
    auth = getAuth()
  } catch (e) {
    console.error('[sheets] auth init failed:', e)
    return []
  }
  const sheets = google.sheets({ version: 'v4', auth })
  let rows: string[][] = []
  try {
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: RANGE,
    })
    rows = (res.data.values ?? []) as string[][]
  } catch (e) {
    console.error('[sheets] spreadsheet fetch failed:', e)
    return []
  }

  return rows
    .map((r, idx) => ({ r, rowNumber: idx + 2 })) // A2 is physical row 2
    .filter(({ r }) => isDealRow(r))
    .map(({ r, rowNumber }, i) => {
      const [
        summary, , priority, owner, customer, npuModel, formFactor,
        systemQty, cardQty, deliveryPurpose, ,
        poRaw, etdRaw, billingRaw, salesParty, currency, totalAmount, b2x,
      ] = r

      const poDate = parseDate(poRaw)
      const etdDate = parseDate(etdRaw)
      const billingDate = parseDate(billingRaw)
      const revenue = parseAmount(totalAmount)
      const cards = parseInt(cardQty) || 0
      const servers = parseInt(systemQty) || 0
      const dmdId = `SHT-${String(i + 1).padStart(3, '0')}`

      return {
        id: dmdId,
        dmdId,
        summary: summary ?? '',
        priority: priority ?? 'Medium',
        owner: owner ?? '',
        customer: customer ?? '',
        npuModel: npuModel ?? 'RNGD',
        formFactor: formFactor ?? '',
        servers,
        cards,
        deliveryPurpose: deliveryPurpose ?? '',
        poDate,
        etdDate,
        billingDate,
        salesParty: salesParty ?? '',
        currency: currency ?? 'USD',
        revenue,
        category: b2x ?? 'B2B',
        status: inferStatus(poDate, etdDate, billingDate),
        region: mapRegion(salesParty ?? ''),
        createdAt: poDate ?? new Date(),
        rowNumber,
        quoteAt: r[STAGE_IDX.quote]?.trim() ?? '',
        poAt: r[STAGE_IDX.po]?.trim() ?? '',
        invoiceAt: r[STAGE_IDX.invoice]?.trim() ?? '',
        shipAt: r[STAGE_IDX.ship]?.trim() ?? '',
      }
    })
}

/**
 * Write a workflow-stage value into the Deals tab for a given synthetic dealId
 * (SHT-00N). The id is positional over the filtered rows, so we re-read and
 * replicate the same filter to resolve the physical row. Also ensures the S~W
 * header labels exist. Returns false if the deal can't be located.
 */
export async function updateDealStage(dealId: string, stage: DealStage, value: string): Promise<boolean> {
  const col = STAGE_COL[stage]
  if (!col) throw new Error(`Unknown stage: ${stage}`)

  const auth = getWriteAuth()
  const sheetsApi = google.sheets({ version: 'v4', auth })

  const res = await sheetsApi.spreadsheets.values.get({ spreadsheetId: SPREADSHEET_ID, range: RANGE })
  const rows = (res.data.values ?? []) as string[][]

  const matched = rows
    .map((r, idx) => ({ r, rowNumber: idx + 2 }))
    .filter(({ r }) => isDealRow(r))
  const target = matched.find((_, i) => `SHT-${String(i + 1).padStart(3, '0')}` === dealId)
  if (!target) return false

  // Ensure the column header exists (idempotent), then write the value.
  await sheetsApi.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range: `${col}1`,
    valueInputOption: 'RAW',
    requestBody: { values: [[STAGE_HEADER[stage]]] },
  })
  await sheetsApi.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range: `${col}${target.rowNumber}`,
    valueInputOption: 'USER_ENTERED',
    requestBody: { values: [[value]] },
  })

  await logAuditSafe({
    action: `UPDATE_STAGE_${stage.toUpperCase()}`,
    source: 'sheets',
    dealId,
    field: stage,
    newValue: value,
  })
  return true
}

export const getDeals = unstable_cache(fetchDeals, ['sheets-deals'], { revalidate: 15 })

function getWriteAuth() {
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_JSON
  if (!raw) throw new Error('GOOGLE_SERVICE_ACCOUNT_JSON is not set')
  const credentials = JSON.parse(raw.replace(/^﻿/, '').trim())
  return new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  })
}

export interface SheetShipment {
  trackingNumber: string
  direction: 'inbound' | 'outbound'
  company: string
  hwType: string
  qty: number
  service: string
  shipDate: string
  route: string
  notes: string
}

async function fetchShipments(): Promise<SheetShipment[]> {
  let auth: ReturnType<typeof getAuth>
  try {
    auth = getAuth()
  } catch (e) {
    console.error('[sheets/shipments]', e)
    return []
  }
  const sheets = google.sheets({ version: 'v4', auth })
  let rows: string[][] = []
  try {
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Shipments!A2:I500',
    })
    rows = (res.data.values ?? []) as string[][]
  } catch (e) {
    console.error('[sheets/shipments]', e)
    return []
  }

  return rows
    .filter((r) => r[0]?.trim())
    .map((r) => ({
      trackingNumber: r[0] ?? '',
      direction: (r[1] === 'outbound' ? 'outbound' : 'inbound') as 'inbound' | 'outbound',
      company: r[2] ?? '',
      hwType: r[3] ?? '',
      qty: parseInt(r[4]) || 0,
      service: r[5] ?? '',
      shipDate: r[6] ?? '',
      route: r[7] ?? '',
      notes: r[8] ?? '',
    }))
}

export const getShipments = unstable_cache(fetchShipments, ['sheets-shipments'], { revalidate: 30 })

export async function addShipment(s: SheetShipment): Promise<void> {
  const auth = getWriteAuth()
  const sheets = google.sheets({ version: 'v4', auth })
  await sheets.spreadsheets.values.append({
    spreadsheetId: SPREADSHEET_ID,
    range: 'Shipments!A:I',
    valueInputOption: 'RAW',
    requestBody: {
      values: [[s.trackingNumber, s.direction, s.company, s.hwType, s.qty, s.service, s.shipDate, s.route, s.notes]],
    },
  })

  // Best-effort audit log (Sheets has no transaction — never fail the write on this).
  await logAuditSafe({
    action: 'CREATE_SHIPMENT',
    source: 'sheets',
    dealId: null,
    newValue: `${s.direction} · ${s.company} · ${s.trackingNumber}`,
  })
}
