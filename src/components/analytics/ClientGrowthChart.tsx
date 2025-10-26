"use client";

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

interface ClientGrowthChartProps {
  data: Array<{
    month: string;
    newClients: number;
    activeClients: number;
  }>;
}

export function ClientGrowthChart({ data }: ClientGrowthChartProps) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <AreaChart data={data}>
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
        />
        <Legend />
        <Area
          type="monotone"
          dataKey="activeClients"
          stackId="1"
          stroke="#8b5cf6"
          fill="#8b5cf6"
          fillOpacity={0.6}
          name="Active Clients"
        />
        <Area
          type="monotone"
          dataKey="newClients"
          stackId="2"
          stroke="#06b6d4"
          fill="#06b6d4"
          fillOpacity={0.6}
          name="New Clients"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

