import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic()

export interface ParsedPO {
  customer: string
  poNumber: string
  poDate: string
  amount: number
  currency: string
  items: { description: string; qty: number; unitPrice: number; total: number }[]
  billingAddress: string
  shippingAddress: string
  paymentTerms: string
  destination: string
  notes: string
}

export async function parsePOWithClaude(
  content: string,
  pdfBase64?: string,
): Promise<ParsedPO> {
  const messages: Anthropic.MessageParam[] = []

  if (pdfBase64) {
    messages.push({
      role: 'user',
      content: [
        {
          type: 'document',
          source: { type: 'base64', media_type: 'application/pdf', data: pdfBase64 },
        },
        {
          type: 'text',
          text: `이 Purchase Order에서 다음 정보를 추출해서 JSON만 반환해줘. 다른 텍스트는 절대 포함하지 마.

{
  "customer": "회사명",
  "poNumber": "PO 번호",
  "poDate": "YYYY-MM-DD",
  "amount": 숫자,
  "currency": "USD",
  "items": [
    { "description": "제품명", "qty": 수량, "unitPrice": 단가, "total": 합계 }
  ],
  "billingAddress": "청구지 주소",
  "shippingAddress": "배송지 주소",
  "paymentTerms": "Net 30 등",
  "destination": "US / SG / KR 등",
  "notes": "특이사항"
}`,
        },
      ],
    })
  } else {
    messages.push({
      role: 'user',
      content: `다음 PO 이메일 내용에서 정보를 추출해서 JSON만 반환해줘. 다른 텍스트는 절대 포함하지 마.

이메일 내용:
${content}

반환 형식:
{
  "customer": "회사명",
  "poNumber": "PO 번호",
  "poDate": "YYYY-MM-DD",
  "amount": 숫자,
  "currency": "USD",
  "items": [
    { "description": "제품명", "qty": 수량, "unitPrice": 단가, "total": 합계 }
  ],
  "billingAddress": "청구지 주소",
  "shippingAddress": "배송지 주소",
  "paymentTerms": "Net 30 등",
  "destination": "US / SG / KR 등",
  "notes": "특이사항"
}`,
    })
  }

  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1024,
    messages,
  })

  const text = response.content[0].type === 'text' ? response.content[0].text : ''
  const clean = text.replace(/```json|```/g, '').trim()
  return JSON.parse(clean) as ParsedPO
}
