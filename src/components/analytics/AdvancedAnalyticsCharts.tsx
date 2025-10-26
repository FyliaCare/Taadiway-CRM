"use client";

import { useState } from "react";
import { ChevronDown, TrendingUp, Download } from "lucide-react";
import { CurrencyDisplay } from "@/components/dashboard/CurrencyDisplay";

interface AdvancedAnalyticsChartsProps {
  revenueData: Array<{ month: string; revenue: number; sales: number }>;
  clientData: Array<{ month: string; newClients: number; activeClients: number }>;
  topProducts: Array<{ name: string; revenue: number; quantity: number; client: string }>;
  statusData: Array<{ status: string; count: number; revenue: number }>;
  clientRevenueData: Array<{ client: string; revenue: number; salesCount: number }>;
}

export function AdvancedAnalyticsCharts({
  revenueData,
  clientData,
  topProducts,
  statusData,
  clientRevenueData,
}: AdvancedAnalyticsChartsProps) {
  const [selectedPeriod, setSelectedPeriod] = useState("All months");
  const [selectedCategory, setSelectedCategory] = useState("All categories");
  const [selectedStats, setSelectedStats] = useState("All stats");

  // Calculate totals and percentages
  const totalRevenue = revenueData.reduce((sum, item) => sum + item.revenue, 0);
  const totalSales = revenueData.reduce((sum, item) => sum + item.sales, 0);
  const maxRevenue = revenueData.length > 0 ? Math.max(...revenueData.map((item) => item.revenue)) : 1;

  // Generate gauge percentages
  const gaugePercentages = [
    { label: "Revenue", value: 75, color: "from-blue-400 to-blue-600" },
    { label: "Growth", value: 50, color: "from-orange-400 to-orange-600" },
    { label: "Efficiency", value: 100, color: "from-amber-400 to-amber-600" },
    { label: "Performance", value: 25, color: "from-red-400 to-red-600" },
  ];

  return (
    <div className="space-y-6">
      {/* Control Panel */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="mb-6 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Statistic Graph</h3>
          <button className="text-gray-400 hover:text-gray-600">
            <Download className="h-5 w-5" />
          </button>
        </div>

        <div className="mb-6 grid grid-cols-3 gap-4">
          <div>
            <label className="mb-2 block text-xs text-gray-600">All mentions</label>
            <div className="relative">
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="w-full appearance-none rounded-lg border border-gray-200 bg-white px-4 py-2 pr-10 text-sm focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-100"
              >
                <option>All months</option>
                <option>Last 6 months</option>
                <option>Last 3 months</option>
                <option>Last month</option>
              </select>
              <ChevronDown className="pointer-events-none absolute rit-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            </div>
          </div>

          <div>
            <label className="mb-2 block text-xs text-gray-600">All categories</label>
            <div className="relative">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full appearance-none rounded-lg border border-gray-200 bg-white px-4 py-2 pr-10 text-sm focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-100"
              >
                <option>All categories</option>
                <option>Revenue</option>
                <option>Sales</option>
                <option>Clients</option>
              </select>
              <ChevronDown className="pointer-events-none absolute rit-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            </div>
          </div>

          <div>
            <label className="mb-2 block text-xs text-gray-600">All stats</label>
            <div className="relative">
              <select
                value={selectedStats}
                onChange={(e) => setSelectedStats(e.target.value)}
                className="w-full appearance-none rounded-lg border border-gray-200 bg-white px-4 py-2 pr-10 text-sm focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-100"
              >
                <option>All stats</option>
                <option>Performance</option>
                <option>Growth</option>
                <option>Efficiency</option>
              </select>
              <ChevronDown className="pointer-events-none absolute rit-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            </div>
          </div>
        </div>

        {/* Main Stats Display */}
        <div className="mb-6">
          <div className="mb-1 flex items-baseline gap-2">
            <span className="text-xs text-gray-600">Total stats:</span>
            <span className="text-sm text-green-600">+24.8%</span>
          </div>
          <div className="text-4xl font-bold text-gray-900">
            ?{(totalRevenue / 1000).toFixed(3)}k
          </div>
        </div>

        {/* Area Chart - Revenue Trend */}
        <div className="relative h-64">
          <svg className="h-full w-full" viewBox="0 0 800 256" preserveAspectRatio="none">
            {/* Grid lines */}
            {[0, 1, 2, 3, 4].map((i) => (
              <line
                key={i}
                x1="0"
                y1={i * 64}
                x2="800"
                y2={i * 64}
                stroke="#f3f4f6"
                strokeWidth="1"
              />
            ))}

            {/* Area fill */}
            <defs>
              <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
              </linearGradient>
            </defs>

            {/* Generate path for area chart */}
            {revenueData.length > 0 && (
              <>
                <path
                  d={`M 0 ${256 - ((revenueData[0]?.revenue ?? 0) / maxRevenue) * 200} ${revenueData
                    .map(
                      (item, index) =>
                        `L ${(index * 800) / Math.max(1, revenueData.length - 1)} ${256 - (item.revenue / maxRevenue) * 200
                        }`
                    )
                    .join(" ")} L 800 256 L 0 256 Z`}
                  fill="url(#areaGradient)"
                />

                {/* Line */}
                <path
                  d={`M 0 ${256 - ((revenueData[0]?.revenue ?? 0) / maxRevenue) * 200} ${revenueData
                    .map(
                      (item, index) =>
                        `L ${(index * 800) / Math.max(1, revenueData.length - 1)} ${256 - (item.revenue / maxRevenue) * 200
                        }`
                    )
                    .join(" ")}`}
                  fill="none"
                  stroke="#3b82f6"
                  strokeWidth="2"
                />
              </>
            )}

            {/* Data points */}
            {revenueData.map((item, index) => (
              <circle
                key={index}
                cx={(index * 800) / (revenueData.length - 1)}
                cy={256 - (item.revenue / maxRevenue) * 200}
                r="4"
                fill="#3b82f6"
                className="cursor-pointer transition-all hover:r-6"
              />
            ))}
          </svg>
        </div>
      </div>

      {/* Secondary Stats Grid - Gauges and Donut Chart */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Gauge Charts */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h3 className="mb-6 text-lg font-semibold text-gray-900">Performance Metrics</h3>

          <div className="grid grid-cols-4 gap-4">
            {gaugePercentages.map((gauge, index) => (
              <div key={index} className="flex flex-col items-center">
                <div className="relative h-24 w-24">
                  {/* Gauge background */}
                  <svg className="h-full w-full -rotate-90" viewBox="0 0 100 100">
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      fill="none"
                      stroke="#f3f4f6"
                      strokeWidth="8"
                      strokeDasharray="251.2"
                    />
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      fill="none"
                      stroke={`url(#gradient-${index})`}
                      strokeWidth="8"
                      strokeDasharray="251.2"
                      strokeDashoffset={251.2 - (251.2 * gauge.value) / 100}
                      className="transition-all duration-1000"
                    />
                    <defs>
                      <linearGradient id={`gradient-${index}`} x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" className={`stop-color-${gauge.color.split(' ')[0].replace('from-', '')}`} />
                        <stop offset="100%" className={`stop-color-${gauge.color.split(' ')[1].replace('to-', '')}`} />
                      </linearGradient>
                    </defs>
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-sm font-bold text-gray-900">{gauge.value}%</span>
                  </div>
                </div>
                <span className="mt-2 text-xs text-gray-600">{gauge.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Donut Chart with Stats */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h3 className="mb-6 text-lg font-semibold text-gray-900">Revenue Distribution</h3>

          <div className="flex items-center gap-6">
            {/* Donut Chart */}
            <div className="relative h-40 w-40">
              <svg className="h-full w-full -rotate-90" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="none"
                  stroke="#fbbf24"
                  strokeWidth="12"
                  strokeDasharray="157 251"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="none"
                  stroke="#f87171"
                  strokeWidth="12"
                  strokeDasharray="62 251"
                  strokeDashoffset="-157"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="none"
                  stroke="#a78bfa"
                  strokeWidth="12"
                  strokeDasharray="20 251"
                  strokeDashoffset="-219"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="none"
                  stroke="#60a5fa"
                  strokeWidth="12"
                  strokeDasharray="12 251"
                  strokeDashoffset="-239"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-xs text-gray-600">Total</span>
                <span className="text-sm font-bold text-gray-900">?{(totalRevenue / 1000).toFixed(1)}k</span>
              </div>
            </div>

            {/* Legend */}
            <div className="flex-1 space-y-3">
              {[
                { label: "Delivered", value: "62.5%", color: "bg-amber-400" },
                { label: "Processing", value: "24.7%", color: "bg-red-400" },
                { label: "Pending", value: "7.9%", color: "bg-purple-400" },
                { label: "Cancelled", value: "4.9%", color: "bg-blue-400" },
              ].map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`h-3 w-3 rounded-sm ${item.color}`} />
                    <span className="text-sm text-gray-700">{item.label}</span>
                  </div>
                  <span className="text-sm font-semibold text-gray-900">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Bar Chart - Top Products */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <h3 className="mb-6 text-lg font-semibold text-gray-900">Top Products Performance</h3>

        <div className="space-y-4">
          {topProducts.length > 0 && (() => {
            const maxProductRevenue = Math.max(...topProducts.map((p) => p.revenue));
            return topProducts.slice(0, 8).map((product, index) => {
              const percentage = maxProductRevenue > 0 ? (product.revenue / maxProductRevenue) * 100 : 0;

              return (
                <div key={index} className="flex items-center gap-4">
                  <div className="w-32 text-sm text-gray-700 truncate">{product.name}</div>
                  <div className="flex-1">
                    <div className="h-8 w-full overflow-hidden rounded-full bg-gray-100">
                      <div
                        className="h-full bg-gradient-to-r from-blue-400 to-blue-600 transition-all duration-1000"
                        style={{
                          width: `${percentage}%`,
                          animation: `growBar 1s ease-out ${index * 0.1}s both`,
                        }}
                      />
                    </div>
                    <div className="w-24 text-right text-sm font-semibold text-gray-900">
                      <CurrencyDisplay amount={product.revenue} compact />
                    </div>
                  </div>
                </div>
              );
            });
          })()}
        </div>
      </div>

      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes growBar {
            from {
              width: 0%;
            }
          }
        `
      }} />
    </div>
  );
}

