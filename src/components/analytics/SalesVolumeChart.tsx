"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

interface SalesVolumeChartProps {
  data: Array<{
    month: string;
    sales: number;
    revenue: number;
  }>;
}

export function SalesVolumeChart({ data }: SalesVolumeChartProps) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
        <XAxis 
          dataKey="month" 
          className="text-xs"
          tick={{ fill: 'currentColor' }}
        />
        <YAxis 
          className="text-xs"
          tick={{ fill: 'currentColor' }}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: 'hsl(var(--background))',
            border: '1px solid hsl(var(--border))',
            borderRadius: '0.5rem',
          }}
          formatter={(value: number) => [value, 'Sales Count']}
        />
        <Legend />
        <Bar 
          dataKey="sales" 
          fill="#10b981" 
          radius={[8, 8, 0, 0]}
          name="Sales Count"
        />
      </BarChart>
    </ResponsiveContainer>
  );
}

