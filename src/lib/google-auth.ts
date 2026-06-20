import { google } from 'googleapis'

function parseServiceAccount() {
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_JSON
  if (!raw) throw new Error('GOOGLE_SERVICE_ACCOUNT_JSON is not set')
  return JSON.parse(raw.replace(/^﻿/, '').trim())
}

export function getServiceAccountAuth() {
  return new google.auth.GoogleAuth({
    credentials: parseServiceAccount(),
    scopes: [
      'https://www.googleapis.com/auth/spreadsheets',
      'https://www.googleapis.com/auth/drive',
    ],
  })
}

export function getGmailAuth() {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GMAIL_CLIENT_ID,
    process.env.GMAIL_CLIENT_SECRET,
  )
  oauth2Client.setCredentials({
    refresh_token: process.env.GMAIL_REFRESH_TOKEN,
  })
  return oauth2Client
}

export const sheets = () => google.sheets({ version: 'v4', auth: getServiceAccountAuth() })
export const drive  = () => google.drive({ version: 'v3', auth: getServiceAccountAuth() })
export const gmail  = () => google.gmail({ version: 'v1', auth: getGmailAuth() })
