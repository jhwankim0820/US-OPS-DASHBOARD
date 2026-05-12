'use client'

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { formatRevenue } from '@/lib/utils'

const COLORS = ['#6366f1', '#f59e0b', '#10b981', '#3b82f6']

interface FormFactorEntry {
  name: string
  value: number
  revenue: number
}

interface DonutChartProps {
  data: FormFactorEntry[]
}

export default function DonutChart({ data }: DonutChartProps) {
  const total = data.reduce((s, d) => s + d.value, 0)

  return (
    <div className="h-72">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={70}
            outerRadius={110}
            paddingAngle={3}
            dataKey="value"
            label={({ name, value }) =>
              `${name} ${((value / total) * 100).toFixed(0)}%`
            }
            labelLine={true}
          >
            {data.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value, name, props) => [
              `${value} deals · ${formatRevenue((props.payload as FormFactorEntry).revenue)}`,
              name,
            ]}
          />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}
