"use client";

import { usePreferences } from "@/lib/preferences-context";

interface RevenueSummaryCardsProps {
    totalRevenue: number;
    monthlyRevenue: number;
}

export function RevenueSummaryCards({ totalRevenue, monthlyRevenue }: RevenueSummaryCardsProps) {
    const { formatCurrency } = usePreferences();

    return (
        <div className="grid gap-6 md:grid-cols-2">
            <div className="rounded-xl border border-gray-200 bg-gradient-to-br from-green-50 to-emerald-50 p-6">
                <h3 className="mb-2 text-sm font-medium text-gray-600">Total Revenue (All Time)</h3>
                <p className="text-xl font-bold text-green-600">{formatCurrency(totalRevenue)}</p>
            </div>
            <div className="rounded-xl border border-gray-200 bg-gradient-to-br from-blue-50 to-indigo-50 p-6">
                <h3 className="mb-2 text-sm font-medium text-gray-600">This Month&apos;s Revenue</h3>
                <p className="text-xl font-bold text-blue-600">{formatCurrency(monthlyRevenue)}</p>
            </div>
        </div>
    );
}
