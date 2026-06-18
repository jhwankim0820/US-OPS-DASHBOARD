import { google } from 'googleapis'
import { unstable_cache } from 'next/cache'

const SPREADSHEET_ID = process.env.GOOGLE_SPREADSHEET_ID!.replace(/^﻿/, '').trim()
const RANGE = 'A2:R200'

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
    .filter((r) => {
      const owner = r[3]?.trim().toLowerCase() ?? ''
      const customer = r[4]?.trim() ?? ''
      return US_TEAM.has(owner) && customer !== ''
    })
    .map((r, i) => {
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
      }
    })
}

export const getDeals = unstable_cache(fetchDeals, ['sheets-deals'], { revalidate: 15 })
