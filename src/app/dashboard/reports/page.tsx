"use client";

import { DashboardLayout } from "@/components/dashboard/layout";
import { CurrencyDisplay } from "@/components/dashboard";
import { trpc } from "@/lib/trpc/client";
import { useState, useMemo } from "react";
import { useSession } from "next-auth/react";
import {
    BarChart3,
    TrendingUp,
    TrendingDown,
    Download,
    Calendar,
    Filter,
    FileText,
    Package,
    Users,
    Truck,
    DollarSign,
    PieChart,
    Activity,
    Target,
    CheckCircle2,
    XCircle,
    Clock,
    Award,
    AlertTriangle,
    ArrowUpRight,
    ArrowDownRight,
    RefreshCw
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type ReportType = "sales" | "inventory" | "customer" | "delivery";

export default function ReportsPage() {
    const { data: session } = useSession();
    const [activeReport, setActiveReport] = useState<ReportType>("sales");
    const [startDate, setStartDate] = useState(() => {
        const date = new Date();
        date.setDate(date.getDate() - 30);
        return date.toISOString().split('T')[0];
    });
    const [endDate, setEndDate] = useState(() => {
        return new Date().toISOString().split('T')[0];
    });
    const [groupBy, setGroupBy] = useState<"day" | "week" | "month" | "product" | "customer" | "paymentMethod">("day");

    // Get vendor's client profile
    const { data: clientProfile } = trpc.client.getCurrent.useQuery();

    // Sales Report
    const { data: salesReport, isLoading: salesLoading, error: salesError, refetch: refetchSales } = trpc.reports.getSalesReport.useQuery(
        {
            startDate: new Date(startDate),
            endDate: new Date(endDate),
            groupBy,
        },
        { enabled: activeReport === "sales" }
    );

    // Inventory Report
    const { data: inventoryReport, isLoading: inventoryLoading, refetch: refetchInventory } = trpc.reports.getInventoryReport.useQuery(
        { includeInactive: false },
        { enabled: activeReport === "inventory" }
    );

    // Customer Report
    const { data: customerReport, isLoading: customerLoading, refetch: refetchCustomer } = trpc.reports.getCustomerReport.useQuery(
        {
            startDate: new Date(startDate),
            endDate: new Date(endDate),
            minOrders: 1,
        },
        { enabled: activeReport === "customer" }
    );

    // Delivery Report
    const { data: deliveryReport, isLoading: deliveryLoading, refetch: refetchDelivery } = trpc.reports.getDeliveryReport.useQuery(
        {
            startDate: new Date(startDate),
            endDate: new Date(endDate),
        },
        { enabled: activeReport === "delivery" }
    );

    const handleRefresh = () => {
        if (activeReport === "sales") refetchSales();
        if (activeReport === "inventory") refetchInventory();
        if (activeReport === "customer") refetchCustomer();
        if (activeReport === "delivery") refetchDelivery();
    };

    const handleExport = (format: "excel" | "pdf") => {
        // In a real app, this would trigger the export API and download the file
        alert(`Export to ${format.toUpperCase()} - Feature coming soon!`);
    };

    const isLoading = salesLoading || inventoryLoading || customerLoading || deliveryLoading;

    // Check for tier restriction errors
    const tierError = salesError?.message?.includes("BASIC plan") || salesError?.message?.includes("STANDARD plan");

    return (
        <DashboardLayout>
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50 p-8">
                <div className="max-w-7xl mx-auto space-y-8">
                    {/* Header */}
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div>
                            <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                                Reports & Analytics
                            </h1>
                            <p className="text-gray-600 mt-1">Comprehensive insights into your business performance</p>
                        </div>
                        <div className="flex gap-3">
                            <Button
                                variant="outline"
                                className="gap-2"
                                onClick={handleRefresh}
                            >
                                <RefreshCw className="w-4 h-4" />
                                Refresh
                            </Button>
                            <Button
                                variant="outline"
                                className="gap-2"
                                onClick={() => handleExport("pdf")}
                            >
                                <Download className="w-4 h-4" />
                                Export PDF
                            </Button>
                            <Button
                                className="gap-2 bg-gradient-to-r from-indigo-600 to-purple-600"
                                onClick={() => handleExport("excel")}
                            >
                                <Download className="w-4 h-4" />
                                Export Excel
                            </Button>
                        </div>
                    </div>

                    {/* Tier Error Message */}
                    {tierError && (
                        <Card className="p-6 bg-amber-50 border-amber-300">
                            <div className="flex items-start gap-3">
                                <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5" />
                                <div>
                                    <h3 className="font-semibold text-amber-900">Subscription Limitation</h3>
                                    <p className="text-sm text-amber-800 mt-1">{salesError?.message}</p>
                                </div>
                            </div>
                        </Card>
                    )}

                    {/* Report Type Selector */}
                    <Card className="p-6 shadow-lg">
                        <div className="flex flex-wrap gap-3">
                            <Button
                                variant={activeReport === "sales" ? "default" : "outline"}
                                className="gap-2"
                                onClick={() => setActiveReport("sales")}
                            >
                                <TrendingUp className="w-4 h-4" />
                                Sales Report
                            </Button>
                            <Button
                                variant={activeReport === "inventory" ? "default" : "outline"}
                                className="gap-2"
                                onClick={() => setActiveReport("inventory")}
                            >
                                <Package className="w-4 h-4" />
                                Inventory Report
                            </Button>
                            <Button
                                variant={activeReport === "customer" ? "default" : "outline"}
                                className="gap-2"
                                onClick={() => setActiveReport("customer")}
                            >
                                <Users className="w-4 h-4" />
                                Customer Report
                            </Button>
                            <Button
                                variant={activeReport === "delivery" ? "default" : "outline"}
                                className="gap-2"
                                onClick={() => setActiveReport("delivery")}
                            >
                                <Truck className="w-4 h-4" />
                                Delivery Report
                            </Button>
                        </div>
                    </Card>

                    {/* Date Range Filter (for time-based reports) */}
                    {(activeReport === "sales" || activeReport === "customer" || activeReport === "delivery") && (
                        <Card className="p-6 shadow-lg">
                            <div className="flex flex-col md:flex-row gap-4 items-end">
                                <div className="flex-1">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Start Date
                                    </label>
                                    <Input
                                        type="date"
                                        value={startDate}
                                        onChange={(e) => setStartDate(e.target.value)}
                                    />
                                </div>
                                <div className="flex-1">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        End Date
                                    </label>
                                    <Input
                                        type="date"
                                        value={endDate}
                                        onChange={(e) => setEndDate(e.target.value)}
                                    />
                                </div>
                                {activeReport === "sales" && (
                                    <div className="flex-1">
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Group By
                                        </label>
                                        <select
                                            value={groupBy}
                                            onChange={(e) => setGroupBy(e.target.value as any)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500"
                                        >
                                            <option value="day">Daily</option>
                                            <option value="week">Weekly</option>
                                            <option value="month">Monthly</option>
                                            <option value="product">By Product</option>
                                            <option value="customer">By Customer</option>
                                            <option value="paymentMethod">By Payment Method</option>
                                        </select>
                                    </div>
                                )}
                                <Button onClick={handleRefresh} className="gap-2">
                                    <Filter className="w-4 h-4" />
                                    Apply
                                </Button>
                            </div>
                        </Card>
                    )}

                    {/* Sales Report */}
                    {activeReport === "sales" && !tierError && (
                        <>
                            {/* Sales Summary */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <Card className="p-6 bg-gradient-to-br from-green-500 to-emerald-600 text-white shadow-lg">
                                    <div className="flex items-start justify-between mb-4">
                                        <div>
                                            <p className="text-green-100 text-sm font-medium">Total Revenue</p>
                                            <p className="text-4xl font-bold mt-2">
                                                <CurrencyDisplay amount={salesReport?.summary.totalRevenue || 0} compact />
                                            </p>
                                        </div>
                                        <div className="bg-white/20 p-3 rounded-lg">
                                            <DollarSign className="w-6 h-6" />
                                        </div>
                                    </div>
                                    <p className="text-green-100 text-sm">
                                        {new Date(startDate).toLocaleDateString()} - {new Date(endDate).toLocaleDateString()}
                                    </p>
                                </Card>

                                <Card className="p-6 bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg">
                                    <div className="flex items-start justify-between mb-4">
                                        <div>
                                            <p className="text-blue-100 text-sm font-medium">Total Orders</p>
                                            <p className="text-4xl font-bold mt-2">{salesReport?.summary.totalOrders || 0}</p>
                                        </div>
                                        <div className="bg-white/20 p-3 rounded-lg">
                                            <BarChart3 className="w-6 h-6" />
                                        </div>
                                    </div>
                                    <p className="text-blue-100 text-sm">Completed deliveries</p>
                                </Card>

                                <Card className="p-6 bg-gradient-to-br from-purple-500 to-pink-600 text-white shadow-lg">
                                    <div className="flex items-start justify-between mb-4">
                                        <div>
                                            <p className="text-purple-100 text-sm font-medium">Average Order</p>
                                            <p className="text-4xl font-bold mt-2">
                                                <CurrencyDisplay amount={salesReport?.summary.averageOrderValue || 0} />
                                            </p>
                                        </div>
                                        <div className="bg-white/20 p-3 rounded-lg">
                                            <Target className="w-6 h-6" />
                                        </div>
                                    </div>
                                    <p className="text-purple-100 text-sm">Per transaction</p>
                                </Card>
                            </div>

                            {/* Grouped Data */}
                            {salesReport?.groupedData && salesReport.groupedData.length > 0 && (
                                <Card className="shadow-lg">
                                    <div className="p-6 border-b border-gray-200">
                                        <h2 className="text-xl font-semibold flex items-center gap-2">
                                            <PieChart className="w-5 h-5 text-indigo-600" />
                                            Breakdown by {groupBy.charAt(0).toUpperCase() + groupBy.slice(1)}
                                        </h2>
                                    </div>
                                    <div className="overflow-x-auto">
                                        <table className="w-full">
                                            <thead className="bg-gray-50 border-b border-gray-200">
                                                <tr>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                                        {groupBy === "product" ? "Product" : groupBy === "customer" ? "Customer" : "Payment Method"}
                                                    </th>
                                                    {groupBy !== "paymentMethod" && (
                                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                                                            {groupBy === "product" ? "Quantity" : "Orders"}
                                                        </th>
                                                    )}
                                                    {groupBy === "paymentMethod" && (
                                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Orders</th>
                                                    )}
                                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Revenue</th>
                                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">% of Total</th>
                                                </tr>
                                            </thead>
                                            <tbody className="bg-white divide-y divide-gray-200">
                                                {salesReport.groupedData.map((item: any, idx) => {
                                                    const percentage = salesReport.summary.totalRevenue > 0
                                                        ? (item.revenue / salesReport.summary.totalRevenue * 100).toFixed(1)
                                                        : 0;

                                                    return (
                                                        <tr key={idx} className="hover:bg-gray-50">
                                                            <td className="px-6 py-4 text-sm font-medium text-gray-900">
                                                                {item.productName || item.customerName || item.paymentMethod}
                                                            </td>
                                                            <td className="px-6 py-4 text-sm text-gray-600 text-right">
                                                                {item.quantity || item.orders}
                                                            </td>
                                                            <td className="px-6 py-4 text-sm font-bold text-green-700 text-right">
                                                                <CurrencyDisplay amount={item.revenue} />
                                                            </td>
                                                            <td className="px-6 py-4 text-sm text-gray-600 text-right">
                                                                {percentage}%
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                </Card>
                            )}
                        </>
                    )}

                    {/* Inventory Report */}
                    {activeReport === "inventory" && (
                        <>
                            {/* Inventory Summary */}
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                <Card className="p-6 bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg">
                                    <div className="flex items-start justify-between mb-4">
                                        <div>
                                            <p className="text-blue-100 text-sm font-medium">Total Products</p>
                                            <p className="text-4xl font-bold mt-2">{inventoryReport?.summary.totalProducts || 0}</p>
                                        </div>
                                        <div className="bg-white/20 p-3 rounded-lg">
                                            <Package className="w-6 h-6" />
                                        </div>
                                    </div>
                                    <p className="text-blue-100 text-sm">Active inventory</p>
                                </Card>

                                <Card className="p-6 bg-gradient-to-br from-green-500 to-emerald-600 text-white shadow-lg">
                                    <div className="flex items-start justify-between mb-4">
                                        <div>
                                            <p className="text-green-100 text-sm font-medium">Total Value</p>
                                            <p className="text-4xl font-bold mt-2">
                                                <CurrencyDisplay amount={inventoryReport?.summary.totalValue || 0} compact />
                                            </p>
                                        </div>
                                        <div className="bg-white/20 p-3 rounded-lg">
                                            <DollarSign className="w-6 h-6" />
                                        </div>
                                    </div>
                                    <p className="text-green-100 text-sm">Current value</p>
                                </Card>

                                <Card className="p-6 bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-lg">
                                    <div className="flex items-start justify-between mb-4">
                                        <div>
                                            <p className="text-amber-100 text-sm font-medium">Low Stock</p>
                                            <p className="text-4xl font-bold mt-2">{inventoryReport?.summary.lowStockCount || 0}</p>
                                        </div>
                                        <div className="bg-white/20 p-3 rounded-lg">
                                            <AlertTriangle className="w-6 h-6" />
                                        </div>
                                    </div>
                                    <p className="text-amber-100 text-sm">Needs restocking</p>
                                </Card>

                                <Card className="p-6 bg-gradient-to-br from-red-500 to-rose-600 text-white shadow-lg">
                                    <div className="flex items-start justify-between mb-4">
                                        <div>
                                            <p className="text-red-100 text-sm font-medium">Out of Stock</p>
                                            <p className="text-4xl font-bold mt-2">{inventoryReport?.summary.outOfStockCount || 0}</p>
                                        </div>
                                        <div className="bg-white/20 p-3 rounded-lg">
                                            <XCircle className="w-6 h-6" />
                                        </div>
                                    </div>
                                    <p className="text-red-100 text-sm">Immediate action</p>
                                </Card>
                            </div>

                            {/* Products List */}
                            {inventoryReport?.products && inventoryReport.products.length > 0 && (
                                <Card className="shadow-lg">
                                    <div className="p-6 border-b border-gray-200">
                                        <h2 className="text-xl font-semibold flex items-center gap-2">
                                            <Package className="w-5 h-5 text-indigo-600" />
                                            Product Inventory Status
                                        </h2>
                                    </div>
                                    <div className="overflow-x-auto">
                                        <table className="w-full">
                                            <thead className="bg-gray-50 border-b border-gray-200">
                                                <tr>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">SKU</th>
                                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Stock</th>
                                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Reorder</th>
                                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Unit Price</th>
                                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total Value</th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                                </tr>
                                            </thead>
                                            <tbody className="bg-white divide-y divide-gray-200">
                                                {inventoryReport.products.map((product) => (
                                                    <tr key={product.id} className="hover:bg-gray-50">
                                                        <td className="px-6 py-4 text-sm font-medium text-gray-900">{product.name}</td>
                                                        <td className="px-6 py-4 text-sm text-gray-600 font-mono">{product.sku || "-"}</td>
                                                        <td className="px-6 py-4 text-sm text-gray-900 text-right font-semibold">
                                                            {product.currentStock}
                                                        </td>
                                                        <td className="px-6 py-4 text-sm text-gray-600 text-right">
                                                            {product.reorderPoint || "-"}
                                                        </td>
                                                        <td className="px-6 py-4 text-sm text-gray-900 text-right">
                                                            <CurrencyDisplay amount={product.unitPrice || 0} />
                                                        </td>
                                                        <td className="px-6 py-4 text-sm font-bold text-green-700 text-right">
                                                            <CurrencyDisplay amount={product.totalValue} />
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${product.status === "OUT_OF_STOCK"
                                                                ? "bg-red-100 text-red-800"
                                                                : product.status === "LOW_STOCK"
                                                                    ? "bg-amber-100 text-amber-800"
                                                                    : "bg-green-100 text-green-800"
                                                                }`}>
                                                                {product.status === "OUT_OF_STOCK" ? (
                                                                    <XCircle className="w-3 h-3 mr-1" />
                                                                ) : product.status === "LOW_STOCK" ? (
                                                                    <AlertTriangle className="w-3 h-3 mr-1" />
                                                                ) : (
                                                                    <CheckCircle2 className="w-3 h-3 mr-1" />
                                                                )}
                                                                {product.status.replace("_", " ")}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </Card>
                            )}
                        </>
                    )}

                    {/* Customer Report */}
                    {activeReport === "customer" && (
                        <>
                            {/* Customer Summary */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <Card className="p-6 bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg">
                                    <div className="flex items-start justify-between mb-4">
                                        <div>
                                            <p className="text-blue-100 text-sm font-medium">Total Customers</p>
                                            <p className="text-4xl font-bold mt-2">{customerReport?.summary.totalCustomers || 0}</p>
                                        </div>
                                        <div className="bg-white/20 p-3 rounded-lg">
                                            <Users className="w-6 h-6" />
                                        </div>
                                    </div>
                                    <p className="text-blue-100 text-sm">Active customers</p>
                                </Card>

                                <Card className="p-6 bg-gradient-to-br from-green-500 to-emerald-600 text-white shadow-lg">
                                    <div className="flex items-start justify-between mb-4">
                                        <div>
                                            <p className="text-green-100 text-sm font-medium">Total Revenue</p>
                                            <p className="text-4xl font-bold mt-2">
                                                <CurrencyDisplay amount={customerReport?.summary.totalRevenue || 0} compact />
                                            </p>
                                        </div>
                                        <div className="bg-white/20 p-3 rounded-lg">
                                            <DollarSign className="w-6 h-6" />
                                        </div>
                                    </div>
                                    <p className="text-green-100 text-sm">From all customers</p>
                                </Card>

                                <Card className="p-6 bg-gradient-to-br from-purple-500 to-pink-600 text-white shadow-lg">
                                    <div className="flex items-start justify-between mb-4">
                                        <div>
                                            <p className="text-purple-100 text-sm font-medium">Avg Customer Value</p>
                                            <p className="text-4xl font-bold mt-2">
                                                <CurrencyDisplay amount={customerReport?.summary.averageCustomerValue || 0} />
                                            </p>
                                        </div>
                                        <div className="bg-white/20 p-3 rounded-lg">
                                            <Award className="w-6 h-6" />
                                        </div>
                                    </div>
                                    <p className="text-purple-100 text-sm">Lifetime value</p>
                                </Card>
                            </div>

                            {/* Top Customers */}
                            {customerReport?.topCustomers && customerReport.topCustomers.length > 0 && (
                                <Card className="shadow-lg">
                                    <div className="p-6 border-b border-gray-200">
                                        <h2 className="text-xl font-semibold flex items-center gap-2">
                                            <Award className="w-5 h-5 text-indigo-600" />
                                            Top 10 Customers
                                        </h2>
                                    </div>
                                    <div className="overflow-x-auto">
                                        <table className="w-full">
                                            <thead className="bg-gray-50 border-b border-gray-200">
                                                <tr>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rank</th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Orders</th>
                                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total Spent</th>
                                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Avg Order</th>
                                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Reliability</th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Last Order</th>
                                                </tr>
                                            </thead>
                                            <tbody className="bg-white divide-y divide-gray-200">
                                                {customerReport.topCustomers.map((customer, idx) => (
                                                    <tr key={customer.phone} className="hover:bg-gray-50">
                                                        <td className="px-6 py-4 text-sm">
                                                            <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full font-bold ${idx === 0 ? "bg-yellow-100 text-yellow-800" :
                                                                idx === 1 ? "bg-gray-100 text-gray-800" :
                                                                    idx === 2 ? "bg-orange-100 text-orange-800" :
                                                                        "bg-blue-50 text-blue-700"
                                                                }`}>
                                                                {idx + 1}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <div className="text-sm font-medium text-gray-900">{customer.name}</div>
                                                            <div className="text-xs text-gray-500">{customer.phone}</div>
                                                        </td>
                                                        <td className="px-6 py-4 text-sm text-gray-900 text-right font-semibold">
                                                            {customer.orders}
                                                        </td>
                                                        <td className="px-6 py-4 text-sm font-bold text-green-700 text-right">
                                                            <CurrencyDisplay amount={customer.totalSpent} />
                                                        </td>
                                                        <td className="px-6 py-4 text-sm text-gray-900 text-right">
                                                            <CurrencyDisplay amount={customer.averageOrderValue} />
                                                        </td>
                                                        <td className="px-6 py-4 text-sm text-right">
                                                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${customer.paymentReliability >= 80
                                                                ? "bg-green-100 text-green-800"
                                                                : customer.paymentReliability >= 50
                                                                    ? "bg-amber-100 text-amber-800"
                                                                    : "bg-red-100 text-red-800"
                                                                }`}>
                                                                {customer.paymentReliability.toFixed(0)}%
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4 text-sm text-gray-600">
                                                            {customer.lastOrderDate ? new Date(customer.lastOrderDate).toLocaleDateString() : "-"}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </Card>
                            )}
                        </>
                    )}

                    {/* Delivery Report */}
                    {activeReport === "delivery" && (
                        <>
                            {/* Delivery Summary */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                <Card className="p-6 bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg">
                                    <div className="flex items-start justify-between mb-4">
                                        <div>
                                            <p className="text-blue-100 text-sm font-medium">Total Requests</p>
                                            <p className="text-4xl font-bold mt-2">{deliveryReport?.summary.totalRequests || 0}</p>
                                        </div>
                                        <div className="bg-white/20 p-3 rounded-lg">
                                            <Truck className="w-6 h-6" />
                                        </div>
                                    </div>
                                    <p className="text-blue-100 text-sm">All deliveries</p>
                                </Card>

                                <Card className="p-6 bg-gradient-to-br from-green-500 to-emerald-600 text-white shadow-lg">
                                    <div className="flex items-start justify-between mb-4">
                                        <div>
                                            <p className="text-green-100 text-sm font-medium">Success Rate</p>
                                            <p className="text-4xl font-bold mt-2">
                                                {(deliveryReport?.summary.successRate || 0).toFixed(1)}%
                                            </p>
                                        </div>
                                        <div className="bg-white/20 p-3 rounded-lg">
                                            <CheckCircle2 className="w-6 h-6" />
                                        </div>
                                    </div>
                                    <p className="text-green-100 text-sm">{deliveryReport?.summary.delivered || 0} delivered</p>
                                </Card>

                                <Card className="p-6 bg-gradient-to-br from-purple-500 to-pink-600 text-white shadow-lg">
                                    <div className="flex items-start justify-between mb-4">
                                        <div>
                                            <p className="text-purple-100 text-sm font-medium">On-Time Delivery</p>
                                            <p className="text-4xl font-bold mt-2">
                                                {(deliveryReport?.summary.onTimePercentage || 0).toFixed(1)}%
                                            </p>
                                        </div>
                                        <div className="bg-white/20 p-3 rounded-lg">
                                            <Clock className="w-6 h-6" />
                                        </div>
                                    </div>
                                    <p className="text-purple-100 text-sm">Punctuality rate</p>
                                </Card>

                                <Card className="p-6 bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-lg">
                                    <div className="flex items-start justify-between mb-4">
                                        <div>
                                            <p className="text-amber-100 text-sm font-medium">Avg Delivery Time</p>
                                            <p className="text-4xl font-bold mt-2">
                                                {(deliveryReport?.summary.avgDeliveryTimeHours || 0).toFixed(1)}h
                                            </p>
                                        </div>
                                        <div className="bg-white/20 p-3 rounded-lg">
                                            <Activity className="w-6 h-6" />
                                        </div>
                                    </div>
                                    <p className="text-amber-100 text-sm">From approval</p>
                                </Card>
                            </div>

                            {/* Status Breakdown */}
                            {deliveryReport?.statusBreakdown && (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                    {deliveryReport.statusBreakdown.map((status) => (
                                        <Card key={status.status} className="p-6 border-2 hover:shadow-lg transition-shadow">
                                            <div className="flex items-center justify-between mb-3">
                                                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${status.status === "DELIVERED"
                                                    ? "bg-green-100 text-green-800"
                                                    : status.status === "FAILED"
                                                        ? "bg-red-100 text-red-800"
                                                        : status.status === "PENDING_APPROVAL"
                                                            ? "bg-amber-100 text-amber-800"
                                                            : "bg-gray-100 text-gray-800"
                                                    }`}>
                                                    {status.status.replace("_", " ")}
                                                </span>
                                            </div>
                                            <div className="text-3xl font-bold text-gray-900">{status.count}</div>
                                            <div className="mt-2 text-sm text-gray-500">
                                                {deliveryReport.summary.totalRequests > 0
                                                    ? ((status.count / deliveryReport.summary.totalRequests) * 100).toFixed(1)
                                                    : 0}% of total
                                            </div>
                                        </Card>
                                    ))}
                                </div>
                            )}
                        </>
                    )}

                    {/* Loading State */}
                    {isLoading && !tierError && (
                        <div className="py-12 text-center">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
                            <p className="text-gray-600 mt-4">Loading report data...</p>
                        </div>
                    )}

                    {/* Empty State */}
                    {!isLoading && !tierError && (
                        activeReport === "sales" && salesReport?.summary.totalOrders === 0 ||
                        activeReport === "inventory" && inventoryReport?.summary.totalProducts === 0 ||
                        activeReport === "customer" && customerReport?.summary.totalCustomers === 0 ||
                        activeReport === "delivery" && deliveryReport?.summary.totalRequests === 0
                    ) && (
                            <Card className="p-12 text-center">
                                <BarChart3 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                                <h3 className="text-lg font-semibold text-gray-900 mb-2">No data available</h3>
                                <p className="text-gray-600">
                                    No data found for the selected period. Try adjusting your date range.
                                </p>
                            </Card>
                        )}
                </div>
            </div>
        </DashboardLayout>
    );
}
