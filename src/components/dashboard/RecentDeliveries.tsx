"use client";

import { usePreferences } from "@/lib/preferences-context";

interface RecentDeliveriesProps {
    sales: Array<{
        id: string;
        saleNumber: string;
        totalAmount: number;
        status: string;
        saleDate: Date;
        clientProfile: {
            businessName: string;
        };
        items: any[];
    }>;
}

export function RecentDeliveries({ sales }: RecentDeliveriesProps) {
    const { formatCurrency, formatDate } = usePreferences();

    const getStatusColor = (status: string) => {
        switch (status) {
            case "DELIVERED":
                return "bg-green-100 text-green-800 dark:bg-green-950";
            case "PROCESSING":
                return "bg-blue-100 text-blue-800 dark:bg-blue-950";
            case "PENDING":
                return "bg-yellow-100 text-yellow-800 dark:bg-yellow-950";
            default:
                return "bg-red-100 text-red-800 dark:bg-red-950";
        }
    };

    return (
        <div className="space-y-4">
            {sales.slice(0, 5).map((sale) => (
                <div key={sale.id} className="flex items-center justify-between border-b pb-4 last:border-0">
                    <div className="space-y-1">
                        <p className="text-sm font-medium">{sale.saleNumber}</p>
                        <p className="text-xs text-muted-foreground">
                            {sale.clientProfile.businessName} • {sale.items.length} items
                        </p>
                        <p className="text-xs text-muted-foreground">
                            {formatDate(sale.saleDate.toString())} at{" "}
                            {new Date(sale.saleDate).toLocaleTimeString()}
                        </p>
                    </div>
                    <div className="text-right">
                        <p className="text-sm font-semibold">{formatCurrency(sale.totalAmount)}</p>
                        <span
                            className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${getStatusColor(sale.status)}`}
                        >
                            {sale.status}
                        </span>
                    </div>
                </div>
            ))}
        </div>
    );
}
