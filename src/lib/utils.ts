import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// 1억 KRW = 100M KRW = 0.1B KRW
export function formatRevenue(amount: number): string {
  if (amount <= 0) return '—'
  const m = amount * 100
  if (m >= 1000) {
    return `${parseFloat((m / 1000).toFixed(2))}B KRW`
  }
  return `${Math.round(m)}M KRW`
}
