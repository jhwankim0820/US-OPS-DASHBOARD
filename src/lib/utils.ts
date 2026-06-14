import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatRevenue(amount: number, currency = 'USD'): string {
  if (amount <= 0) return '—'
  if (currency === 'KRW') {
    if (amount >= 1_000_000_000) return `₩${(amount / 1_000_000_000).toFixed(1)}B`
    if (amount >= 1_000_000) return `₩${Math.round(amount / 1_000_000)}M`
    return `₩${amount.toLocaleString('ko-KR')}`
  }
  if (amount >= 1_000_000) return `$${(amount / 1_000_000).toFixed(2)}M`
  return `$${amount.toLocaleString('en-US')}`
}
