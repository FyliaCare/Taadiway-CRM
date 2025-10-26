"use client";

import { usePreferences } from "@/lib/preferences-context";
import { Eye } from "lucide-react";

interface Sale {
    id: string;
    saleNumber: string;
    client: { name: string; email: string };
    product: { name: string };
    quantity: number;
    totalAmount: number;
    status: string;
    createdAt: Date;
}

interface RecentSalesTableProps {
    sales: Sale[];
}

export function RecentSalesTable({ sales }: RecentSalesTableProps) {
    const { formatCurrency, formatDate } = usePreferences();

    const getStatusColor = (status: string) => {
        switch (status) {
            case "COMPLETED":
                return "bg-green-100 text-green-700";
            case "PENDING":
                return "bg-yellow-100 text-yellow-700";
            case "CANCELLED":
                return "bg-red-100 text-red-700";
            default:
                return "bg-gray-100 text-gray-700";
        }
    };

    return (
        <div className="overflow-x-auto">
            <table className="w-full">
                <thead>
                    <tr className="border-b border-gray-200">
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-600">
                            Sale #
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-600">
                            Client
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-600">
                            Product
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-600">
                            Quantity
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-600">
                            Amount
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-600">
                            Status
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-600">
                            Date
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-600">
                            Actions
                        </th>
                    </tr>
                </thead>
                <tbody>
                    {sales.map((sale) => (
                        <tr
                            key={sale.id}
                            className="border-b border-gray-100 transition-colors hover:bg-gray-50"
                        >
                            <td className="px-4 py-3">
                                <p className="font-mono text-sm font-medium text-gray-900">
                                    {sale.saleNumber}
                                </p>
                            </td>
                            <td className="px-4 py-3">
                                <div>
                                    <p className="text-sm font-medium text-gray-900">{sale.client.name}</p>
                                    <p className="text-xs text-gray-500">{sale.client.email}</p>
                                </div>
                            </td>
                            <td className="px-4 py-3">
                                <p className="text-sm text-gray-900">{sale.product.name}</p>
                            </td>
                            <td className="px-4 py-3">
                                <p className="text-sm text-gray-900">{sale.quantity}</p>
                            </td>
                            <td className="px-4 py-3">
                                <p className="text-sm font-semibold">{formatCurrency(sale.totalAmount)}</p>
                            </td>
                            <td className="px-4 py-3">
                                <span
                                    className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${getStatusColor(
                                        sale.status
                                    )}`}
                                >
                                    {sale.status}
                                </span>
                            </td>
                            <td className="px-4 py-3">
                                <p className="text-sm text-gray-600">
                                    {formatDate(sale.createdAt.toString())}
                                </p>
                            </td>
                            <td className="px-4 py-3">
                                <button className="text-blue-600 hover:text-blue-700">
                                    <Eye className="h-4 w-4" />
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
