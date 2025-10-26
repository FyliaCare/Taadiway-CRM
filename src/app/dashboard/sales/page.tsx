"use client";

import { DashboardLayout } from "@/components/dashboard/layout";
import { trpc } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
import { CurrencyDisplay } from "@/components/dashboard";
import {
  Plus, Search, Download, Filter, Grid3x3, List,
  DollarSign, TrendingUp, Package, Calendar, Eye, Edit,
  CheckCircle2, Clock, XCircle, Truck, Store, Tag, X
} from "lucide-react";
import { useState, useMemo } from "react";
import Image from "next/image";

type SaleStatus = "PENDING" | "IN_TRANSIT" | "DELIVERED" | "CANCELLED";

type StatusConfig = {
  color: string;
  bg: string;
  text: string;
  icon: any;
};

const STATUS_CONFIG: Record<SaleStatus, StatusConfig> = {
  PENDING: { color: "orange", bg: "bg-orange-100", text: "text-orange-800", icon: Clock },
  IN_TRANSIT: { color: "purple", bg: "bg-purple-100", text: "text-purple-800", icon: Truck },
  DELIVERED: { color: "green", bg: "bg-green-100", text: "text-green-800", icon: CheckCircle2 },
  CANCELLED: { color: "red", bg: "bg-red-100", text: "text-red-800", icon: XCircle },
};

export default function SalesPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [clientFilter, setClientFilter] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  const [viewingSale, setViewingSale] = useState<any>(null);
  const [showViewModal, setShowViewModal] = useState(false);

  const { data: clients, isLoading, error } = trpc.client.getAll.useQuery();

  // Aggregate all sales from all clients
  const allSales = useMemo(() =>
    clients?.flatMap((client) =>
      (client as any).sales?.map((sale: any) => ({
        ...sale,
        clientInfo: {
          id: client.id,
          businessName: client.businessName,
        },
      })) || []
    ) || []
    , [clients]);

  // Memoize filtered sales
  const filteredSales = useMemo(() =>
    allSales.filter((sale: any) => {
      const matchesSearch =
        searchTerm === "" ||
        sale.clientInfo.businessName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sale.deliveryLocation?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sale.customerName?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus =
        statusFilter === "all" || sale.status === statusFilter;

      const matchesClient =
        clientFilter === "all" || sale.clientProfileId === clientFilter;

      return matchesSearch && matchesStatus && matchesClient;
    })
    , [allSales, searchTerm, statusFilter, clientFilter]);

  // Memoize stats calculations
  const stats = useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const thisWeekStart = new Date(today);
    thisWeekStart.setDate(today.getDate() - today.getDay());
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    return {
      total: allSales.length,
      totalRevenue: allSales.reduce((sum: number, s: any) => sum + (s.totalAmount || 0), 0),
      completed: allSales.filter((s: any) => s.status === "DELIVERED").length,
      pending: allSales.filter((s: any) => s.status === "PENDING").length,
      inTransit: allSales.filter((s: any) => s.status === "IN_TRANSIT").length,
      cancelled: allSales.filter((s: any) => s.status === "CANCELLED").length,
      todaySales: allSales.filter((s: any) => new Date(s.saleDate) >= today).length,
      thisWeekSales: allSales.filter((s: any) => new Date(s.saleDate) >= thisWeekStart).length,
      thisMonthSales: allSales.filter((s: any) => new Date(s.saleDate) >= thisMonthStart).length,
    };
  }, [allSales]);

  if (error) {
    return (
      <DashboardLayout>
        <div className="rounded-lg border border-red-200 bg-red-50 p-8 text-center">
          <p className="text-red-800">
            {error.message || "Error loading sales. Please try again."}
          </p>
        </div>
      </DashboardLayout>
    );
  }

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex min-h-[400px] items-center justify-center rounded-lg border bg-card">
          <div className="text-center">
            <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-gray-200 border-t-amber-500"></div>
            <p className="mt-4 text-muted-foreground">Loading sales...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-700 bg-clip-text text-4xl font-bold tracking-tight text-transparent">
              Sales Management
            </h1>
            <p className="mt-1 text-muted-foreground">
              Track and manage sales across all vendors
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
            <Button className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600">
              <Plus className="mr-2 h-4 w-4" />
              Record Sale
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="group relative overflow-hidden rounded-xl border bg-white p-6 shadow-sm transition-all duration-300 hover:shadow-lg">
            <div className="absolute right-0 top-0 h-24 w-24 rounded-full bg-gradient-to-br from-green-400 to-emerald-400 opacity-10 blur-2xl transition-all duration-500 group-hover:scale-150 group-hover:opacity-20"></div>
            <div className="relative">
              <div className="flex items-center justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 shadow-md">
                  <DollarSign className="h-6 w-6 text-white" />
                </div>
                <TrendingUp className="h-5 w-5 text-green-500" />
              </div>
              <p className="mt-4 text-sm font-medium text-gray-600">Total Revenue</p>
              <h3 className="mt-1">
                <CurrencyDisplay amount={stats.totalRevenue} className="text-2xl font-bold text-gray-900" />
              </h3>
              <p className="mt-1 text-xs text-muted-foreground">{stats.total} total sales</p>
            </div>
          </div>

          <div className="group relative overflow-hidden rounded-xl border bg-white p-6 shadow-sm transition-all duration-300 hover:shadow-lg">
            <div className="absolute right-0 top-0 h-24 w-24 rounded-full bg-gradient-to-br from-blue-400 to-indigo-400 opacity-10 blur-2xl transition-all duration-500 group-hover:scale-150 group-hover:opacity-20"></div>
            <div className="relative">
              <div className="flex items-center justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 shadow-md">
                  <CheckCircle2 className="h-6 w-6 text-white" />
                </div>
              </div>
              <p className="mt-4 text-sm font-medium text-gray-600">Completed</p>
              <h3 className="mt-1 text-2xl font-bold text-gray-900">{stats.completed}</h3>
              <p className="mt-1 text-xs text-muted-foreground">Successfully delivered</p>
            </div>
          </div>

          <div className="group relative overflow-hidden rounded-xl border bg-white p-6 shadow-sm transition-all duration-300 hover:shadow-lg">
            <div className="absolute right-0 top-0 h-24 w-24 rounded-full bg-gradient-to-br from-orange-400 to-amber-400 opacity-10 blur-2xl transition-all duration-500 group-hover:scale-150 group-hover:opacity-20"></div>
            <div className="relative">
              <div className="flex items-center justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 shadow-md">
                  <Clock className="h-6 w-6 text-white" />
                </div>
              </div>
              <p className="mt-4 text-sm font-medium text-gray-600">Pending</p>
              <h3 className="mt-1 text-2xl font-bold text-gray-900">{stats.pending}</h3>
              <p className="mt-1 text-xs text-muted-foreground">Awaiting delivery</p>
            </div>
          </div>

          <div className="group relative overflow-hidden rounded-xl border bg-white p-6 shadow-sm transition-all duration-300 hover:shadow-lg">
            <div className="absolute right-0 top-0 h-24 w-24 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 opacity-10 blur-2xl transition-all duration-500 group-hover:scale-150 group-hover:opacity-20"></div>
            <div className="relative">
              <div className="flex items-center justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 shadow-md">
                  <Truck className="h-6 w-6 text-white" />
                </div>
              </div>
              <p className="mt-4 text-sm font-medium text-gray-600">In Transit</p>
              <h3 className="mt-1 text-2xl font-bold text-gray-900">{stats.inTransit}</h3>
              <p className="mt-1 text-xs text-muted-foreground">Out for delivery</p>
            </div>
          </div>
        </div>

        {/* Filters & View Toggle */}
        <div className="flex flex-col gap-4 rounded-xl border bg-white p-4 shadow-sm md:flex-row md:items-center">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search sales, customers, locations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-4 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
            />
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border border-gray-300 px-4 py-2 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
          >
            <option value="all">All Status</option>
            <option value="PENDING">Pending</option>
            <option value="IN_TRANSIT">In Transit</option>
            <option value="DELIVERED">Delivered</option>
            <option value="CANCELLED">Cancelled</option>
          </select>

          {/* Client Filter */}
          <select
            value={clientFilter}
            onChange={(e) => setClientFilter(e.target.value)}
            className="rounded-lg border border-gray-300 px-4 py-2 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
          >
            <option value="all">All Vendors</option>
            {clients?.map((client) => (
              <option key={client.id} value={client.id}>
                {client.businessName}
              </option>
            ))}
          </select>

          {/* View Toggle */}
          <div className="flex gap-1 rounded-lg border border-gray-300 p-1">
            <Button
              variant={viewMode === "grid" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("grid")}
              className={viewMode === "grid" ? "bg-gradient-to-r from-amber-500 to-orange-500" : ""}
            >
              <Grid3x3 className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "table" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("table")}
              className={viewMode === "table" ? "bg-gradient-to-r from-amber-500 to-orange-500" : ""}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Results Count */}
        <div className="flex items-center justify-between rounded-lg border bg-gradient-to-r from-amber-50 to-orange-50 px-4 py-3">
          <p className="text-sm font-medium text-gray-700">
            Showing <span className="font-bold text-amber-900">{filteredSales.length}</span> of{" "}
            <span className="font-bold text-amber-900">{allSales.length}</span> sales
          </p>
          {(searchTerm || statusFilter !== "all" || clientFilter !== "all") && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSearchTerm("");
                setStatusFilter("all");
                setClientFilter("all");
              }}
            >
              Clear Filters
            </Button>
          )}
        </div>

        {/* Sales Grid/List */}
        {viewMode === "grid" ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredSales.map((sale: any) => {
              const statusConfig = STATUS_CONFIG[sale.status as SaleStatus] || STATUS_CONFIG.PENDING;
              const StatusIcon = statusConfig.icon;

              return (
                <div
                  key={sale.id}
                  className="group relative overflow-hidden rounded-xl border bg-gradient-to-br from-white to-gray-50 shadow-sm transition-all duration-300 hover:shadow-xl"
                >
                  {/* Gradient background */}
                  <div className="absolute right-0 top-0 h-32 w-32 rounded-full bg-gradient-to-br from-amber-400 to-orange-400 opacity-5 blur-3xl transition-all duration-500 group-hover:scale-150 group-hover:opacity-10"></div>

                  {/* Header */}
                  <div className="relative border-b bg-gradient-to-r from-gray-50 to-white p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <Package className="h-5 w-5 text-amber-600" />
                          <h3 className="font-bold text-gray-900">Sale #{sale.id.slice(0, 8)}</h3>
                        </div>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {new Date(sale.saleDate).toLocaleDateString()}
                        </p>
                      </div>
                      <span className={`flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${statusConfig.bg} ${statusConfig.text}`}>
                        <StatusIcon className="h-3 w-3" />
                        {sale.status.replace("_", " ")}
                      </span>
                    </div>
                  </div>

                  {/* Body */}
                  <div className="relative space-y-4 p-6">
                    {/* Vendor */}
                    <div className="rounded-lg border border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 p-3">
                      <div className="flex items-center gap-2">
                        <Store className="h-4 w-4 text-amber-600" />
                        <span className="text-xs font-semibold text-amber-900">Vendor</span>
                      </div>
                      <p className="mt-1 font-bold text-amber-900 truncate">{sale.clientInfo.businessName}</p>
                    </div>

                    {/* Customer & Location */}
                    {sale.customerName && (
                      <div className="text-sm">
                        <p className="text-xs text-muted-foreground">Customer</p>
                        <p className="font-medium text-gray-900">{sale.customerName}</p>
                      </div>
                    )}
                    {sale.deliveryLocation && (
                      <div className="text-sm">
                        <p className="text-xs text-muted-foreground">Delivery Location</p>
                        <p className="font-medium text-gray-900 truncate">{sale.deliveryLocation}</p>
                      </div>
                    )}

                    {/* Amount */}
                    <div className="rounded-lg border bg-gradient-to-br from-green-50 to-white p-3">
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-green-600" />
                        <span className="text-xs text-muted-foreground">Total Amount</span>
                      </div>
                      <p className="mt-1">
                        <CurrencyDisplay amount={sale.totalAmount || 0} className="text-xl font-bold text-green-600" />
                      </p>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="relative border-t bg-gray-50 p-4">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => {
                        setViewingSale(sale);
                        setShowViewModal(true);
                      }}
                    >
                      <Eye className="mr-2 h-4 w-4" />
                      View Details
                    </Button>
                  </div>

                  {/* Bottom accent */}
                  <div className="absolute bottom-0 left-0 h-1 w-0 bg-gradient-to-r from-amber-400 to-orange-500 transition-all duration-500 group-hover:w-full"></div>
                </div>
              );
            })}
          </div>
        ) : (
          // Table View
          <div className="rounded-xl border bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b bg-gradient-to-r from-gray-50 to-white">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Sale ID</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Vendor</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Customer</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Location</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Date</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Amount</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Status</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filteredSales.map((sale: any) => {
                    const statusConfig = STATUS_CONFIG[sale.status as SaleStatus] || STATUS_CONFIG.PENDING;
                    const StatusIcon = statusConfig.icon;

                    return (
                      <tr key={sale.id} className="transition-colors hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <Package className="h-4 w-4 text-amber-600" />
                            <span className="font-mono text-sm font-medium text-gray-900">
                              #{sale.id.slice(0, 8)}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <Store className="h-4 w-4 text-amber-600" />
                            <span className="text-sm font-medium text-gray-900">{sale.clientInfo.businessName}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {sale.customerName || "—"}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600 max-w-[200px] truncate">
                          {sale.deliveryLocation || "—"}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {new Date(sale.saleDate).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-3 py-1 text-sm font-semibold text-green-600">
                            <DollarSign className="h-3 w-3" />
                            <CurrencyDisplay amount={sale.totalAmount || 0} />
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${statusConfig.bg} ${statusConfig.text}`}>
                            <div className={`h-2 w-2 rounded-full ${statusConfig.bg.replace('100', '500')}`}></div>
                            {sale.status.replace("_", " ")}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setViewingSale(sale);
                              setShowViewModal(true);
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Empty State */}
        {filteredSales.length === 0 && (
          <div className="rounded-xl border bg-gradient-to-br from-gray-50 to-white p-12 text-center shadow-sm">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-gray-100">
              <Package className="h-10 w-10 text-gray-400" />
            </div>
            <h3 className="mt-4 text-lg font-semibold text-gray-900">No sales found</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              {searchTerm || statusFilter !== "all" || clientFilter !== "all"
                ? "Try adjusting your search or filters to find what you're looking for."
                : "Get started by recording your first sale."}
            </p>
            {!searchTerm && statusFilter === "all" && clientFilter === "all" && (
              <Button className="mt-6 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600">
                <Plus className="mr-2 h-4 w-4" />
                Record First Sale
              </Button>
            )}
          </div>
        )}
      </div>

      {/* View Sale Modal */}
      {showViewModal && viewingSale && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="relative w-full max-w-2xl rounded-xl border bg-white shadow-2xl">
            {/* Header */}
            <div className="border-b bg-gradient-to-r from-blue-50 to-indigo-50 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Sale Details</h2>
                  <p className="mt-1 text-sm text-muted-foreground">Sale #{viewingSale.id.slice(0, 8)}</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setShowViewModal(false);
                    setViewingSale(null);
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Body */}
            <div className="max-h-[600px] overflow-y-auto p-6">
              <div className="space-y-6">
                {/* Status Badge */}
                <div className="flex justify-center">
                  {(() => {
                    const statusConfig = STATUS_CONFIG[viewingSale.status as SaleStatus] || STATUS_CONFIG.PENDING;
                    const StatusIcon = statusConfig.icon;

                    return (
                      <span className={`inline-flex items-center gap-2 rounded-full px-6 py-3 text-lg font-semibold ${statusConfig.bg} ${statusConfig.text}`}>
                        <StatusIcon className="h-6 w-6" />
                        {viewingSale.status.replace("_", " ")}
                      </span>
                    );
                  })()}
                </div>

                {/* Vendor Info */}
                <div className="rounded-lg border-2 border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-amber-500">
                      <Store className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-amber-900">Vendor</p>
                      <p className="text-lg font-bold text-amber-900">{viewingSale.clientInfo.businessName}</p>
                    </div>
                  </div>
                </div>

                {/* Amount */}
                <div className="rounded-lg border-2 border-green-200 bg-gradient-to-r from-green-50 to-emerald-50 p-6 text-center">
                  <p className="text-sm font-semibold uppercase tracking-wide text-green-600">Total Amount</p>
                  <p className="mt-2">
                    <CurrencyDisplay amount={viewingSale.totalAmount || 0} className="text-4xl font-bold text-green-900" />
                  </p>
                </div>

                {/* Customer & Delivery Info */}
                <div className="grid grid-cols-2 gap-4">
                  {viewingSale.customerName && (
                    <div className="rounded-lg border bg-gray-50 p-4">
                      <p className="text-xs font-semibold uppercase tracking-wide text-gray-600">Customer</p>
                      <p className="mt-2 font-bold text-gray-900">{viewingSale.customerName}</p>
                    </div>
                  )}
                  <div className="rounded-lg border bg-gray-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-600">Sale Date</p>
                    <p className="mt-2 font-bold text-gray-900">{new Date(viewingSale.saleDate).toLocaleDateString()}</p>
                  </div>
                </div>

                {/* Delivery Location */}
                {viewingSale.deliveryLocation && (
                  <div className="rounded-lg border bg-purple-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-purple-600">Delivery Location</p>
                    <p className="mt-2 font-medium text-purple-900">{viewingSale.deliveryLocation}</p>
                  </div>
                )}

                {/* Notes */}
                {viewingSale.notes && (
                  <div className="rounded-lg border bg-gray-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-600">Notes</p>
                    <p className="mt-2 text-gray-700">{viewingSale.notes}</p>
                  </div>
                )}

                {/* Metadata */}
                <div className="rounded-lg border bg-gray-50 p-4">
                  <h4 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-700">Additional Information</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Created:</span>
                      <span className="font-medium text-gray-900">
                        {new Date(viewingSale.createdAt).toLocaleString()}
                      </span>
                    </div>
                    {viewingSale.updatedAt !== viewingSale.createdAt && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Last Updated:</span>
                        <span className="font-medium text-gray-900">
                          {new Date(viewingSale.updatedAt).toLocaleString()}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="border-t bg-gray-50 p-6">
              <div className="flex justify-end gap-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowViewModal(false);
                    setViewingSale(null);
                  }}
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}