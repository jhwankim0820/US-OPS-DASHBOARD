'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

const NAV_ITEMS = [
  { href: '/', label: 'Dashboard' },
  { href: '/deals', label: 'Deals' },
  { href: '/shipments', label: 'Shipments' },
  { href: '/financials', label: 'Key Financials' },
]

export default function Navbar() {
  const pathname = usePathname()

  return (
    <header className="sticky top-0 z-50 border-b border-[#35353f] bg-[#16161c]">
      <div className="flex h-14 items-center gap-8 px-6">
        <span className="text-sm font-bold tracking-tight text-white">
          FuriosaAI · US Ops
        </span>
        <nav className="flex gap-1">
          {NAV_ITEMS.map((item) => {
            const isActive =
              item.href === '/'
                ? pathname === '/'
                : pathname.startsWith(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-[#E21500] text-white'
                    : 'text-[#AAAAAA] hover:bg-[#232330] hover:text-white'
                )}
              >
                {item.label}
              </Link>
            )
          })}
        </nav>
        <div className="ml-auto">
          <Image
            src="/furiosa_logo.png"
            alt="FuriosaAI"
            height={28}
            width={120}
            style={{ height: 28, width: 'auto' }}
            priority
          />
        </div>
      </div>
    </header>
  )
}
