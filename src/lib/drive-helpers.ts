import { drive } from './google-auth'
import { Readable } from 'stream'

const ROOT = process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID!

// Per-deal Drive folder IDs. Each folder contains 4 subfolders:
// "0. Rental", "1. Quote", "2. PO", "3. Invoice".
export const DEAL_FOLDER_IDS: Record<string, string> = {
  'SHT-001': '15Xu3Dm_TDjDN6kOgGmxOmk9C7y-jCCXb',
  'SHT-002': '1sPj0Q6NkyyKFHa8KEzXOjHbbY0PgZYWW',
  'SHT-003': '1CQp2wXqpw5vQtzEfXEXzbm1HVDj_z9OI',
  'SHT-004': '1nFKFK2wvEE7nKMRe65RQ7K_3hivwchGI',
  'SHT-005': '1D6l1tI9q1EqJsSZxadA7MNol5vykd9Yj',
  'SHT-006': '1EZBTlx0EXB2Y8SvZ1BQDkKRXv-zrDSQw',
  'SHT-007': '1BFSO29aioiKTY_wv0sUrN_FTWRCmfuDu',
  'SHT-008': '1m2srYQ3Zx9UgI98zdNOHeDEO38cs3dWp',
  'SHT-009': '1fTxCOdPTb_VldQ2qmKYVHpohPl6oSuQ9',
  'SHT-010': '1V_oNkW1OgSLY9Tle1EVdc0QvEoHnfjC6',
}

type DocKey = 'rental' | 'quote' | 'po' | 'invoice'

const SUBFOLDERS: { name: string; key: DocKey; type: string }[] = [
  { name: '0. Rental', key: 'rental', type: 'Rental' },
  { name: '1. Quote', key: 'quote', type: 'Quote' },
  { name: '2. PO', key: 'po', type: 'PO' },
  { name: '3. Invoice', key: 'invoice', type: 'Invoice' },
]

export interface DealDocStatus {
  rental: boolean
  quote: boolean
  po: boolean
  invoice: boolean
  /** Drive folder IDs for each subfolder (null if the subfolder is missing). */
  folders: Record<DocKey, string | null>
  latestAction: { type: string; filename: string; modifiedTime: string } | null
}

/** List the 4 doc subfolders of a deal folder, reporting which contain files. */
export async function getDealDocStatus(dealFolderId: string): Promise<DealDocStatus> {
  const driveClient = drive()

  const subRes = await driveClient.files.list({
    q: `'${dealFolderId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`,
    fields: 'files(id,name)',
    supportsAllDrives: true,
    includeItemsFromAllDrives: true,
  })
  const subs = subRes.data.files ?? []

  const status: DealDocStatus = {
    rental: false,
    quote: false,
    po: false,
    invoice: false,
    folders: { rental: null, quote: null, po: null, invoice: null },
    latestAction: null,
  }
  let latest: { type: string; filename: string; modifiedTime: string } | null = null

  await Promise.all(
    SUBFOLDERS.map(async (sf) => {
      const folder = subs.find((f) => f.name === sf.name)
      if (!folder?.id) return
      status.folders[sf.key] = folder.id

      const fileRes = await driveClient.files.list({
        q: `'${folder.id}' in parents and trashed=false`,
        fields: 'files(id,name,modifiedTime)',
        orderBy: 'modifiedTime desc',
        pageSize: 1000,
        supportsAllDrives: true,
        includeItemsFromAllDrives: true,
      })
      const files = fileRes.data.files ?? []
      if (files.length > 0) {
        status[sf.key] = true
        const top = files[0]
        if (top.modifiedTime && (!latest || top.modifiedTime > latest.modifiedTime)) {
          latest = { type: sf.type, filename: top.name ?? '', modifiedTime: top.modifiedTime }
        }
      }
    }),
  )

  status.latestAction = latest
  return status
}

/** Find a named subfolder inside a parent folder. */
export async function findSubfolder(parentId: string, name: string): Promise<string | null> {
  const driveClient = drive()
  const res = await driveClient.files.list({
    q: `'${parentId}' in parents and name='${name.replace(/'/g, "\\'")}' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
    fields: 'files(id)',
    supportsAllDrives: true,
    includeItemsFromAllDrives: true,
  })
  return res.data.files?.[0]?.id ?? null
}

export async function getOrCreateDealFolder(dealId: string, customer: string): Promise<string> {
  const driveClient = drive()
  const folderName = `${dealId}-${customer.replace(/\s+/g, '_')}`

  const existing = await driveClient.files.list({
    q: `name='${folderName}' and '${ROOT}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`,
    fields: 'files(id, name)',
    supportsAllDrives: true,
    includeItemsFromAllDrives: true,
  })

  if (existing.data.files?.length) {
    return existing.data.files[0].id!
  }

  const folder = await driveClient.files.create({
    requestBody: {
      name: folderName,
      mimeType: 'application/vnd.google-apps.folder',
      parents: [ROOT],
    },
    fields: 'id',
    supportsAllDrives: true,
  })

  return folder.data.id!
}

export async function uploadFileToDrive({
  folderId,
  fileName,
  mimeType,
  content,
}: {
  folderId: string
  fileName: string
  mimeType: string
  content: Buffer | string
}): Promise<string> {
  const driveClient = drive()

  const buffer = typeof content === 'string'
    ? Buffer.from(content, 'base64')
    : content

  const stream = Readable.from(buffer)

  const file = await driveClient.files.create({
    requestBody: {
      name: fileName,
      parents: [folderId],
    },
    media: {
      mimeType,
      body: stream,
    },
    fields: 'id, webViewLink',
    supportsAllDrives: true,
  })

  return file.data.webViewLink ?? file.data.id!
}
