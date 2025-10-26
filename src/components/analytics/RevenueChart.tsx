"use client";

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

interface RevenueChartProps {
  data: Array<{
    month: string;
    revenue: number;
    sales: number;
  }>;
}

export function RevenueChart({ data }: RevenueChartProps) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
        <XAxis 
          dataKey="month" 
          className="text-xs"
          tick={{ fill: 'currentColor' }}
        />
        <YAxis 
          className="text-xs"
          tick={{ fill: 'currentColor' }}
          tickFormatter={(value) => `?${(value / 1000).toFixed(0)}k`}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: 'hsl(var(--background))',
            border: '1px solid hsl(var(--border))',
            borderRadius: '0.5rem',
          }}
          formatter={(value: number) => [`?${value.toLocaleString()}`, 'Revenue']}
        />
        <Legend />
        <Line
          type="monotone"
          dataKey="revenue"
          stroke="#3b82f6"
          strokeWidth={2}
          dot={{ fill: '#3b82f6', r: 4 }}
          activeDot={{ r: 6 }}
          name="Revenue"
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

