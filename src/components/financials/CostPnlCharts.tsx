'use client'

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  type ChartOptions,
} from 'chart.js'
import { Bar } from 'react-chartjs-2'

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip)

const axisTicks = { color: '#888780', font: { size: 12 }, autoSkip: false } as const
const gridColor = 'rgba(136,135,128,0.15)'

// ── Chart 1: Quarterly P&L Trend — Revenue vs stacked Operating Expense ──
const pnlOptions: ChartOptions<'bar'> = {
  responsive: true,
  maintainAspectRatio: false,
  // index mode so a single hover lists Revenue + every opex category for that quarter
  interaction: { mode: 'index', intersect: false },
  plugins: {
    legend: { display: false }, // custom HTML legend instead
    tooltip: {
      callbacks: {
        label: (ctx) => ` ${ctx.dataset.label}: $${(ctx.parsed.y ?? 0).toFixed(2)}M`,
        // total operating expense across the stacked opex datasets
        footer: (items) => {
          const opex = items.filter((i) => i.dataset.stack === 'opex')
          if (!opex.length) return ''
          const total = opex.reduce((s, i) => s + (i.parsed.y ?? 0), 0)
          return `Operating Expense: $${total.toFixed(2)}M`
        },
      },
    },
  },
  scales: {
    x: { stacked: true, grid: { display: false }, ticks: axisTicks },
    y: {
      stacked: true,
      grid: { color: gridColor },
      ticks: {
        ...axisTicks,
        callback: (value) => `$${Number(value).toFixed(1)}M`,
      },
    },
  },
}

export function PnlBarChart({
  labels,
  revenue,
  opex,
}: {
  labels: string[]
  revenue: number[]
  opex: CostDataset[]
}) {
  return (
    <Bar
      options={pnlOptions}
      data={{
        labels,
        datasets: [
          {
            label: 'Revenue',
            data: revenue,
            backgroundColor: '#378ADD',
            borderRadius: 4,
            stack: 'revenue', // its own group, beside the opex stack
            barPercentage: 0.72,
            categoryPercentage: 0.78,
          },
          // Operating Expense — same Top 5 + Others breakdown as the stacked chart below
          ...opex.map((d) => ({
            label: d.label,
            data: d.data,
            backgroundColor: d.bg,
            stack: 'opex', // all categories share one stacked bar
            borderRadius: d.topmost ? 4 : 0,
            borderSkipped: d.topmost ? ('bottom' as const) : (false as const),
            barPercentage: 0.72,
            categoryPercentage: 0.78,
          })),
        ],
      }}
    />
  )
}

// ── Chart 2: Stacked Cost Breakdown — Top 5 + Others ──
const costOptions: ChartOptions<'bar'> = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    tooltip: {
      callbacks: {
        label: (ctx) => ` ${ctx.dataset.label}: $${(ctx.parsed.y ?? 0).toLocaleString()}K`,
      },
    },
  },
  scales: {
    x: { stacked: true, grid: { display: false }, ticks: axisTicks },
    y: {
      stacked: true,
      grid: { color: gridColor },
      ticks: {
        ...axisTicks,
        callback: (value) => `$${(Number(value) / 1000).toFixed(1)}M`,
      },
    },
  },
}

export interface CostDataset {
  label: string
  data: number[]
  bg: string
  topmost?: boolean
}

export function CostStackedChart({ labels, datasets }: { labels: string[]; datasets: CostDataset[] }) {
  return (
    <Bar
      options={costOptions}
      data={{
        labels,
        datasets: datasets.map((d) => ({
          label: d.label,
          data: d.data,
          backgroundColor: d.bg,
          stack: 'cost', // all datasets share one stack
          // round only the top of the full stacked bar (topmost = Others)
          borderRadius: d.topmost ? 4 : 0,
          borderSkipped: d.topmost ? ('bottom' as const) : (false as const),
          barPercentage: 0.78,
          categoryPercentage: 0.82,
        })),
      }}
    />
  )
}
