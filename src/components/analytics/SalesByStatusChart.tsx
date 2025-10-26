"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";

interface SalesByStatusChartProps {
  data: Array<{
    status: string;
    count: number;
    revenue: number;
  }>;
}

const COLORS = {
  PENDING: "#f59e0b",
  PROCESSING: "#3b82f6",
  DELIVERED: "#10b981",
  CANCELLED: "#ef4444",
};

export function SalesByStatusChart({ data }: SalesByStatusChartProps) {
  const chartData = data.map((item) => ({
    name: item.status,
    value: item.count,
  }));

  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={chartData}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
          outerRadius={80}
          fill="#8884d8"
          dataKey="value"
        >
          {chartData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[entry.name as keyof typeof COLORS] || "#6b7280"} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{
            backgroundColor: 'hsl(var(--background))',
            border: '1px solid hsl(var(--border))',
            borderRadius: '0.5rem',
          }}
        />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}

