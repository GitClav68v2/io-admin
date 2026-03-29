'use client'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { formatCurrency } from '@/lib/utils'

interface MonthlyRevenue {
  month: string
  revenue: number
}

interface AgingBucket {
  label: string
  amount: number
  count: number
  color: string
}

function RevenueChart({ data }: { data: MonthlyRevenue[] }) {
  if (!data.length) return null

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 mb-6">
      <h2 className="font-semibold text-slate-800 mb-4">Revenue — Last 12 Months</h2>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
            <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#94A3B8' }} tickLine={false} axisLine={false} />
            <YAxis
              tickFormatter={v => v >= 1000 ? `$${(v / 1000).toFixed(0)}k` : `$${v}`}
              tick={{ fontSize: 12, fill: '#94A3B8' }}
              tickLine={false}
              axisLine={false}
              width={60}
            />
            <Tooltip
              formatter={(value) => [formatCurrency(Number(value)), 'Revenue']}
              contentStyle={{ borderRadius: '8px', border: '1px solid #E2E8F0', fontSize: '13px' }}
            />
            <Bar dataKey="revenue" fill="#06B6D4" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

function AgingReceivables({ buckets, totalOutstanding }: { buckets: AgingBucket[]; totalOutstanding: number }) {
  const maxAmount = Math.max(...buckets.map(b => b.amount), 1)

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold text-slate-800">Aging Receivables</h2>
        <div className="text-right">
          <div className="text-xs text-slate-400">Total Outstanding</div>
          <div className="text-lg font-bold text-red-600">{formatCurrency(totalOutstanding)}</div>
        </div>
      </div>
      <div className="space-y-3">
        {buckets.map(b => (
          <div key={b.label}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm text-slate-600">{b.label}</span>
              <span className="text-sm font-semibold text-slate-800">
                {formatCurrency(b.amount)} <span className="text-xs text-slate-400 font-normal">({b.count} inv.)</span>
              </span>
            </div>
            <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${Math.max((b.amount / maxAmount) * 100, b.amount > 0 ? 3 : 0)}%`,
                  backgroundColor: b.color,
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function DashboardCharts({
  monthlyRevenue,
  agingBuckets,
  totalOutstanding,
}: {
  monthlyRevenue: MonthlyRevenue[]
  agingBuckets: AgingBucket[]
  totalOutstanding: number
}) {
  return (
    <>
      <RevenueChart data={monthlyRevenue} />
      <AgingReceivables buckets={agingBuckets} totalOutstanding={totalOutstanding} />
    </>
  )
}
