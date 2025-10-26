"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

interface TopProductsChartProps {
  data: Array<{
    name: string;
    revenue: number;
    quantity: number;
    client: string;
  }>;
}

export function TopProductsChart({ data }: TopProductsChartProps) {
  return (
    <ResponsiveContainer width="100%" height={400}>
      <BarChart data={data} layout="vertical">
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
        <XAxis 
          type="number"
          className="text-xs"
          tick={{ fill: 'currentColor' }}
          tickFormatter={(value) => `?${(value / 1000).toFixed(0)}k`}
        />
        <YAxis 
          type="category"
          dataKey="name" 
          className="text-xs"
          tick={{ fill: 'currentColor' }}
          width={150}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: 'hsl(var(--background))',
            border: '1px solid hsl(var(--border))',
            borderRadius: '0.5rem',
          }}
          formatter={(value: number, name: string) => {
            if (name === 'revenue') return [`?${value.toLocaleString()}`, 'Revenue'];
            return [value, 'Quantity Sold'];
          }}
        />
        <Legend />
        <Bar 
          dataKey="revenue" 
          fill="#3b82f6" 
          radius={[0, 4, 4, 0]}
          name="Revenue"
        />
        <Bar 
          dataKey="quantity" 
          fill="#10b981" 
          radius={[0, 4, 4, 0]}
          name="Quantity"
        />
      </BarChart>
    </ResponsiveContainer>
  );
}

