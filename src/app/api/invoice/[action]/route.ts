import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

export const runtime = 'nodejs'
export const maxDuration = 60

const MODEL = 'claude-sonnet-4-6'
const MCP_BETA = 'mcp-client-2025-04-04'

// Remote MCP endpoints (Google). Optional bearer tokens are read from env so the
// Anthropic API key — and any MCP OAuth token — never reach the browser.
const DRIVE_MCP_URL = process.env.GOOGLE_DRIVE_MCP_URL ?? 'https://drivemcp.googleapis.com/mcp/v1'
const GMAIL_MCP_URL = process.env.GMAIL_MCP_URL ?? 'https://gmailmcp.googleapis.com/mcp/v1'

type McpServer = {
  type: 'url'
  name: string
  url: string
  authorization_token?: string
}

function driveServer(): McpServer {
  const s: McpServer = { type: 'url', name: 'gdrive', url: DRIVE_MCP_URL }
  if (process.env.GOOGLE_DRIVE_MCP_TOKEN) s.authorization_token = process.env.GOOGLE_DRIVE_MCP_TOKEN
  return s
}

function gmailServer(): McpServer {
  const s: McpServer = { type: 'url', name: 'gmail', url: GMAIL_MCP_URL }
  if (process.env.GMAIL_MCP_TOKEN) s.authorization_token = process.env.GMAIL_MCP_TOKEN
  return s
}

interface ContentBlock {
  type: string
  text?: string
  is_error?: boolean
  content?: unknown
}

/** Pull the human-readable text + any MCP tool error out of a Messages response. */
function summarize(content: ContentBlock[]) {
  const text = content
    .filter((c) => c.type === 'text' && typeof c.text === 'string')
    .map((c) => c.text as string)
    .join('\n')
    .trim()
  const toolError = content.find((c) => c.type === 'mcp_tool_result' && c.is_error)
  return { text, toolError }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ action: string }> },
) {
  const { action } = await params

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'ANTHROPIC_API_KEY is not configured' }, { status: 500 })
  }

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const anthropic = new Anthropic({ apiKey })

  let system: string
  let userMessage: string
  let mcpServers: McpServer[]

  if (action === 'save-drive') {
    const { fileName, htmlContent } = body as { fileName?: string; htmlContent?: string }
    if (!fileName || !htmlContent) {
      return NextResponse.json({ error: 'fileName and htmlContent are required' }, { status: 400 })
    }
    system =
      'You are a Google Drive file manager. Use the available Drive tools to create files. ' +
      'Always confirm success and report the resulting file URL.'
    userMessage =
      `Save the following commercial invoice as an HTML file named "${fileName}" in Google Drive. ` +
      `Place it inside a folder named "Invoices" at the root of My Drive (create the folder if it does not exist). ` +
      `Here is the exact file content:\n\n${htmlContent}`
    mcpServers = [driveServer()]
  } else if (action === 'send-email') {
    const { to, cc, subject, emailBody, fileName, htmlContent } = body as {
      to?: string
      cc?: string
      subject?: string
      emailBody?: string
      fileName?: string
      htmlContent?: string
    }
    if (!to || !htmlContent) {
      return NextResponse.json({ error: 'to and htmlContent are required' }, { status: 400 })
    }
    system =
      'You are an email assistant. Send emails via Gmail using the available tools. ' +
      'When attaching HTML content, encode it as base64 and attach it as a file.'
    userMessage =
      `Send an email via Gmail with these details:\n` +
      `- To: ${to}\n` +
      (cc ? `- CC: ${cc}\n` : '') +
      `- Subject: ${subject ?? ''}\n` +
      `- Body:\n${emailBody ?? ''}\n\n` +
      `Attach the following HTML content as a file named "${fileName ?? 'invoice.html'}":\n\n${htmlContent}`
    mcpServers = [gmailServer()]
  } else {
    return NextResponse.json({ error: `Unknown action "${action}"` }, { status: 404 })
  }

  try {
    const message = await anthropic.beta.messages.create({
      model: MODEL,
      max_tokens: 1500,
      system,
      messages: [{ role: 'user', content: userMessage }],
      mcp_servers: mcpServers,
      betas: [MCP_BETA],
    })

    const { text, toolError } = summarize(message.content as ContentBlock[])

    if (toolError) {
      return NextResponse.json(
        { success: false, error: 'MCP tool reported an error', detail: text || toolError },
        { status: 502 },
      )
    }

    return NextResponse.json({ success: true, message: text })
  } catch (e) {
    const detail = e instanceof Error ? e.message : String(e)
    return NextResponse.json({ success: false, error: detail }, { status: 502 })
  }
}
