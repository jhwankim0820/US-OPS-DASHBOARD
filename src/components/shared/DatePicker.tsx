'use client'

import { useState } from 'react'
import { format, parseISO } from 'date-fns'
import { enUS } from 'date-fns/locale'
import { CalendarIcon } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { cn } from '@/lib/utils'

interface DatePickerProps {
  value: string       // YYYY-MM-DD or ''
  onChange: (value: string) => void
  placeholder?: string
}

export default function DatePicker({ value, onChange, placeholder = 'Pick a date' }: DatePickerProps) {
  const [open, setOpen] = useState(false)

  const selected = value ? parseISO(value) : undefined

  function handleSelect(day: Date | undefined) {
    onChange(day ? format(day, 'yyyy-MM-dd') : '')
    setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        className={cn(
          'flex h-8 items-center gap-1.5 rounded-md border border-gray-200 bg-white px-3 text-sm transition-colors hover:border-gray-400',
          value ? 'text-gray-900' : 'text-gray-400',
        )}
      >
        <CalendarIcon className="h-3.5 w-3.5 shrink-0 text-gray-400" />
        {selected ? format(selected, 'MMM dd, yyyy', { locale: enUS }) : placeholder}
      </PopoverTrigger>
      <PopoverContent align="start" className="w-auto p-0">
        <Calendar
          mode="single"
          selected={selected}
          onSelect={handleSelect}
          locale={enUS}
          defaultMonth={selected}
        />
      </PopoverContent>
    </Popover>
  )
}
