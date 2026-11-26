import { useState } from 'react'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useBusiness } from '@/providers/business-provider'
import { useReportsData, type ReportRange } from '@/features/reports/reports-queries'

function formatMoney(n: number) {
  return `₹${n.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`
}

const RANGE_LABELS: Record<ReportRange, string> = {
  '7d': 'Last 7 days',
  '30d': 'Last 30 days',
  '90d': 'Last 90 days',
  year: 'This year',
  all: 'All time',
}

export function ReportsPage() {
  const { currentBusiness } = useBusiness()
  const [range, setRange] = useState<ReportRange>('30d')
  const { data, isLoading } = useReportsData(currentBusiness?.id, range)

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Reports</h1>
          <p className="text-sm text-muted-foreground">
            Built from your real orders and expenses — empty until you record some.
          </p>
        </div>
        <Select value={range} onValueChange={(v) => setRange(v as ReportRange)}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(RANGE_LABELS).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Revenue</p>
            <p className="mt-1 text-2xl font-semibold">{formatMoney(data?.totalRevenue ?? 0)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Expenses</p>
            <p className="mt-1 text-2xl font-semibold">{formatMoney(data?.totalExpenses ?? 0)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Orders</p>
            <p className="mt-1 text-2xl font-semibold">{data?.orderCount ?? 0}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Revenue vs expenses</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-72 w-full" />
          ) : data && data.trend.length > 0 ? (
            <ResponsiveContainer width="100%" height={288}>
              <AreaChart data={data.trend} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="expensesFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--chart-2)" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="var(--chart-2)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} stroke="var(--border)" />
                <XAxis
                  dataKey="bucket"
                  tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }}
                  axisLine={{ stroke: 'var(--border)' }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                  width={56}
                  tickFormatter={(v) => formatMoney(Number(v))}
                />
                <Tooltip
                  contentStyle={{
                    background: 'var(--popover)',
                    border: '1px solid var(--border)',
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                  formatter={(value) => formatMoney(Number(value))}
                />
                <Legend wrapperStyle={{ fontSize: 12, color: 'var(--muted-foreground)' }} />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  name="Revenue"
                  stroke="var(--chart-1)"
                  strokeWidth={2}
                  fill="url(#revenueFill)"
                />
                <Area
                  type="monotone"
                  dataKey="expenses"
                  name="Expenses"
                  stroke="var(--chart-2)"
                  strokeWidth={2}
                  fill="url(#expensesFill)"
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <p className="flex h-72 items-center justify-center text-sm text-muted-foreground">
              No data in this range yet.
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Top products by revenue</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-64 w-full" />
          ) : data && data.topProducts.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={data.topProducts} layout="vertical" margin={{ left: 16 }}>
                <CartesianGrid horizontal={false} stroke="var(--border)" />
                <XAxis
                  type="number"
                  tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }}
                  axisLine={{ stroke: 'var(--border)' }}
                  tickLine={false}
                  tickFormatter={(v) => formatMoney(Number(v))}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  tick={{ fill: 'var(--foreground)', fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                  width={120}
                />
                <Tooltip
                  contentStyle={{
                    background: 'var(--popover)',
                    border: '1px solid var(--border)',
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                  formatter={(value) => formatMoney(Number(value))}
                />
                <Bar dataKey="revenue" name="Revenue" fill="var(--chart-1)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="flex h-40 items-center justify-center text-sm text-muted-foreground">
              No sales in this range yet.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
