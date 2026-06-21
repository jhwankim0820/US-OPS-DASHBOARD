import { drive } from './google-auth'
import { Readable } from 'stream'

const ROOT = process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID!

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
