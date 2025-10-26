"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Cell } from "recharts";

interface RevenueByClientChartProps {
  data: Array<{
    client: string;
    revenue: number;
    salesCount: number;
  }>;
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#f97316', '#14b8a6', '#a855f7', '#ec4899'];

export function RevenueByClientChart({ data }: RevenueByClientChartProps) {
  return (
    <ResponsiveContainer width="100%" height={400}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
        <XAxis 
          dataKey="client" 
          className="text-xs"
          tick={{ fill: 'currentColor' }}
          angle={-45}
          textAnchor="end"
          height={100}
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
          formatter={(value: number, name: string) => {
            if (name === 'revenue') return [`?${value.toLocaleString()}`, 'Total Revenue'];
            return [value, 'Sales Count'];
          }}
        />
        <Legend />
        <Bar 
          dataKey="revenue" 
          radius={[8, 8, 0, 0]}
          name="Revenue"
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

