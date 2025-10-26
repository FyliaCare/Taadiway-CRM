import { CurrencyDisplay } from './CurrencyDisplay'

type Stats = {
  totalSales?: number
  activeClients?: number
  totalClients?: number
  totalRevenue?: number
  totalProducts?: number
  lowStockProducts?: number
}

type Props = {
  stats?: Stats
}

export default function AdvancedAnalyticsHub({ stats }: Props) {
  const totalProducts = stats?.totalProducts ?? 0
  const lowStock = stats?.lowStockProducts ?? 0
  const healthyCount = Math.max(0, totalProducts - lowStock)
  const healthPct = totalProducts > 0 ? (healthyCount / totalProducts) * 100 : 0

  const kpis = [
    { id: 'sales', label: 'Total Sales', value: stats?.totalSales ?? 0 },
    { id: 'revenue', label: 'Revenue', value: stats?.totalRevenue ?? 0 },
    { id: 'clients', label: 'Active Clients', value: stats?.activeClients ?? 0 },
    { id: 'products', label: 'Products', value: totalProducts },
  ]

  return (
    <section className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold">Analytics Hub</h2>
          <p className="text-sm text-muted-foreground">Quick business metrics and health overview</p>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((k) => (
          <div key={k.id} className="rounded-xl border bg-card p-4 shadow-sm">
            <p className="text-xs font-medium text-muted-foreground">{k.label}</p>
            <div className="mt-2 flex items-baseline gap-2">
              <p className="text-2xl font-semibold">
                {k.id === 'revenue' ? <CurrencyDisplay amount={k.value} /> : formatNumber(k.value)}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="col-span-2 rounded-xl border bg-card p-6 shadow-sm">
          <h3 className="text-sm font-semibold">Stock Health</h3>
          <div className="mt-4 flex items-center gap-6">
            <div className="relative h-36 w-36">
              <svg viewBox="0 0 120 120" className="h-36 w-36">
                <defs>
                  <linearGradient id="g1" x1="0%" x2="100%">
                    <stop offset="0%" stopColor="#ef4444" />
                    <stop offset="50%" stopColor="#f59e0b" />
                    <stop offset="100%" stopColor="#10b981" />
                  </linearGradient>
                </defs>
                <circle cx="60" cy="60" r="54" fill="#0f172a" opacity={0.06} />
                <circle cx="60" cy="60" r="48" fill="#fff" stroke="#e6edf3" strokeWidth="2" />
                <path d="M 12 60 A 48 48 0 0 1 108 60" fill="none" stroke="#e5e7eb" strokeWidth="8" strokeLinecap="round" />
                <circle cx="60" cy="60" r="48" fill="none" stroke="url(#g1)" strokeWidth="8" strokeLinecap="round" strokeDasharray={`${(healthPct / 100) * (2 * Math.PI * 48)} ${2 * Math.PI * 48}`} transform="rotate(-90 60 60)" style={{ transition: 'stroke-dasharray 900ms ease-out' }} />
                <g transform={`rotate(${(healthPct / 100) * 180 - 90} 60 60)`} style={{ transition: 'transform 900ms ease-out' }}>
                  <rect x="59" y="14" width="2" height="46" rx="1" fill="#dc2626" />
                  <circle cx="60" cy="60" r="4" fill="#111827" stroke="#ffffff" strokeWidth="1" />
                </g>
              </svg>
            </div>
            <div>
              <p className="text-3xl font-bold">{healthPct.toFixed(0)}%</p>
              <p className="mt-1 text-sm text-muted-foreground">{healthyCount} of {totalProducts} items well-stocked</p>
              <div className="mt-3 flex gap-2">
                <span className="inline-flex items-center gap-2 rounded-md bg-green-50 px-2 py-1 text-sm font-medium text-green-700">Healthy</span>
                <span className="inline-flex items-center gap-2 rounded-md bg-orange-50 px-2 py-1 text-sm font-medium text-orange-700">Low stock: {lowStock}</span>
              </div>
            </div>
          </div>
        </div>
        <div className="rounded-xl border bg-card p-6 shadow-sm">
          <h3 className="text-sm font-semibold">Quick Actions</h3>
          <div className="mt-4 grid gap-3">
            <button className="w-full rounded-md border px-3 py-2 text-sm font-medium hover:bg-muted">View Inventory</button>
            <button className="w-full rounded-md border px-3 py-2 text-sm font-medium hover:bg-muted">Create Purchase Order</button>
            <button className="w-full rounded-md border px-3 py-2 text-sm font-medium hover:bg-muted">Export Report</button>
          </div>
        </div>
      </div>
    </section>
  )
}

function formatNumber(value?: number) {
  if (value == null) return '0'
  return Number.isInteger(value) ? value.toString() : value.toFixed(2)
}
