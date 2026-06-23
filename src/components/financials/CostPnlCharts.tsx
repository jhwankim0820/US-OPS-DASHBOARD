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

// ── Chart 1: Quarterly P&L Trend — grouped, wider bars ──
const pnlOptions: ChartOptions<'bar'> = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false }, // custom HTML legend instead
    tooltip: {
      callbacks: {
        label: (ctx) => {
          const v = ctx.parsed.y ?? 0
          return ` ${ctx.dataset.label}: ${v < 0 ? '−' : ''}$${Math.abs(v).toFixed(2)}M`
        },
      },
    },
  },
  scales: {
    x: { grid: { display: false }, ticks: axisTicks },
    y: {
      grid: { color: gridColor },
      ticks: {
        ...axisTicks,
        // sign before $ symbol for negatives
        callback: (value) => {
          const v = Number(value)
          return `${v < 0 ? '−' : ''}$${Math.abs(v).toFixed(1)}M`
        },
      },
    },
  },
}

export function PnlBarChart({
  labels,
  revenue,
  loss,
}: {
  labels: string[]
  revenue: number[]
  loss: number[]
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
            // wider bars — key change from the original chart
            barPercentage: 0.72,
            categoryPercentage: 0.78,
          },
          {
            label: 'Operating Loss',
            data: loss,
            backgroundColor: '#E24B4A',
            borderRadius: 4,
            barPercentage: 0.72,
            categoryPercentage: 0.78,
          },
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
