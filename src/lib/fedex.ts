const BASE = process.env.FEDEX_ENV === 'production'
  ? 'https://apis.fedex.com'
  : 'https://apis-sandbox.fedex.com'

let cached: { token: string; exp: number } | null = null

async function getToken(): Promise<string> {
  if (cached && Date.now() < cached.exp - 60_000) return cached.token
  const res = await fetch(`${BASE}/oauth/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: process.env.FEDEX_API_KEY!,
      client_secret: process.env.FEDEX_SECRET_KEY!,
    }),
    cache: 'no-store',
  })
  if (!res.ok) throw new Error(`FedEx auth ${res.status}: ${await res.text()}`)
  const d = await res.json()
  cached = { token: d.access_token, exp: Date.now() + d.expires_in * 1000 }
  return cached.token
}

export async function fedexTrack(trackingNumber: string) {
  const token = await getToken()
  const res = await fetch(`${BASE}/track/v1/trackingnumbers`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, 'X-locale': 'en_US' },
    body: JSON.stringify({
      trackingInfo: [{ trackingNumberInfo: { trackingNumber } }],
      includeDetailedScans: true,
    }),
    cache: 'no-store',
  })
  if (!res.ok) throw new Error(`FedEx track ${res.status}: ${await res.text()}`)
  return res.json()
}

export const HW_WEIGHT_LBS: Record<string, number> = {
  'RNGD Cards': 0.3,
  'Rack Server': 40,
  'Workstation': 20,
}

export const SERVICE_CODE: Record<string, string> = {
  'FedEx Priority Overnight': 'PRIORITY_OVERNIGHT',
  'FedEx 2Day': 'FEDEX_2_DAY',
  'FedEx Ground': 'FEDEX_GROUND',
  'FedEx International Priority': 'INTERNATIONAL_PRIORITY',
}

export interface RateInput {
  destZip: string
  destCountry: string
  hwType: string
  qty: number
  service: string
}

export async function fedexRates(input: RateInput) {
  const token = await getToken()
  const acct = process.env.FEDEX_ACCOUNT_NUMBER ?? '740561073'
  const weightLbs = Math.max(1, (HW_WEIGHT_LBS[input.hwType] ?? 1) * input.qty)

  const res = await fetch(`${BASE}/rate/v1/rates/quotes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, 'X-locale': 'en_US' },
    body: JSON.stringify({
      accountNumber: { value: acct },
      requestedShipment: {
        shipper: { address: { postalCode: '95134', countryCode: 'US' } },
        recipient: { address: { postalCode: input.destZip, countryCode: input.destCountry || 'US' } },
        pickupType: 'DROPOFF_AT_FEDEX_LOCATION',
        rateRequestType: ['LIST'],
        serviceType: SERVICE_CODE[input.service],
        requestedPackageLineItems: [{ weight: { units: 'LB', value: weightLbs } }],
      },
    }),
    cache: 'no-store',
  })
  if (!res.ok) throw new Error(`FedEx rates ${res.status}: ${await res.text()}`)
  return res.json()
}

export interface ShipInput {
  recipientCompany: string
  contactName: string
  contactPhone: string
  street: string
  city: string
  state: string
  zip: string
  country: string
  hwType: string
  qty: number
  service: string
}

export async function fedexShip(input: ShipInput) {
  const token = await getToken()
  const acct = process.env.FEDEX_ACCOUNT_NUMBER ?? '740561073'
  const weightLbs = Math.max(1, (HW_WEIGHT_LBS[input.hwType] ?? 1) * input.qty)
  const serviceType = SERVICE_CODE[input.service] ?? 'FEDEX_GROUND'

  const res = await fetch(`${BASE}/ship/v1/shipments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, 'X-locale': 'en_US' },
    body: JSON.stringify({
      labelResponseOptions: 'URL_ONLY',
      requestedShipment: {
        shipper: {
          contact: { personName: 'US Operations', companyName: 'FuriosaAI Inc.', phoneNumber: '4085550100' },
          address: {
            streetLines: ['2880 Zanker Rd Ste 203'],
            city: 'San Jose',
            stateOrProvinceCode: 'CA',
            postalCode: '95134',
            countryCode: 'US',
          },
        },
        recipients: [{
          contact: {
            personName: input.contactName,
            companyName: input.recipientCompany,
            phoneNumber: input.contactPhone,
          },
          address: {
            streetLines: [input.street],
            city: input.city,
            stateOrProvinceCode: input.state,
            postalCode: input.zip,
            countryCode: input.country || 'US',
          },
        }],
        shipDatestamp: new Date().toISOString().split('T')[0],
        serviceType,
        packagingType: 'YOUR_PACKAGING',
        pickupType: 'DROPOFF_AT_FEDEX_LOCATION',
        shippingChargesPayment: {
          paymentType: 'SENDER',
          payor: { responsibleParty: { accountNumber: { value: acct } } },
        },
        labelSpecification: {
          labelFormatType: 'COMMON2D',
          labelRotation: 'NONE',
          imageType: 'PDF',
          labelStockType: 'PAPER_85X11_TOP_HALF_LABEL',
        },
        requestedPackageLineItems: [{ weight: { units: 'LB', value: weightLbs } }],
      },
      accountNumber: { value: acct },
    }),
    cache: 'no-store',
  })
  if (!res.ok) throw new Error(`FedEx ship ${res.status}: ${await res.text()}`)
  return res.json()
}
