"use client";

import { DashboardLayout } from "@/components/dashboard/layout";
import { trpc } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
import { 
  Plus, Search, Download, Filter, Grid3x3, List, 
  Package, TrendingUp, TrendingDown, AlertTriangle, 
  ArrowUpCircle, ArrowDownCircle, Eye, X, Store, 
  Calendar, User, FileText, RotateCcw, XCircle, 
  CheckCircle2, DollarSign
} from "lucide-react";
import { useState, useMemo } from "react";

type InventoryType = "RESTOCK" | "SALE" | "ADJUSTMENT" | "DAMAGE" | "RETURN";

type TypeConfig = {
  color: string;
  bg: string;
  text: string;
  icon: any;
  label: string;
};

const TYPE_CONFIG: Record<InventoryType, TypeConfig> = {
  RESTOCK: { color: "green", bg: "bg-green-100", text: "text-green-800", icon: ArrowUpCircle, label: "Restock" },
  SALE: { color: "blue", bg: "bg-blue-100", text: "text-blue-800", icon: TrendingDown, label: "Sale" },
  ADJUSTMENT: { color: "purple", bg: "bg-purple-100", text: "text-purple-800", icon: RotateCcw, label: "Adjustment" },
  DAMAGE: { color: "red", bg: "bg-red-100", text: "text-red-800", icon: XCircle, label: "Damage" },
  RETURN: { color: "amber", bg: "bg-amber-100", text: "text-amber-800", icon: CheckCircle2, label: "Return" },
};

export default function InventoryPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [clientFilter, setClientFilter] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  const [viewingLog, setViewingLog] = useState<any>(null);
  const [showViewModal, setShowViewModal] = useState(false);

  const { data: clients, isLoading, error } = trpc.client.getAll.useQuery();

  // Aggregate all inventory logs from all clients' products
  const allLogs = useMemo(() => 
    clients?.flatMap((client) =>
      (client as any).products?.flatMap((product: any) =>
        product.inventoryLogs?.map((log: any) => ({
          ...log,
          productInfo: {
            id: product.id,
            name: product.name,
            sku: product.sku,
            category: product.category,
          },
          clientInfo: {
            id: client.id,
            businessName: client.businessName,
          },
        })) || []
      ) || []
    ) || []
  , [clients]);

  // Memoize filtered logs
  const filteredLogs = useMemo(() => 
    allLogs.filter((log: any) => {
      const matchesSearch =
        searchTerm === "" ||
        log.productInfo.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.productInfo.sku?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.clientInfo.businessName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.reason?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesType =
        typeFilter === "all" || log.type === typeFilter;

      const matchesClient =
        clientFilter === "all" || log.clientInfo.id === clientFilter;

      return matchesSearch && matchesType && matchesClient;
    })
  , [allLogs, searchTerm, typeFilter, clientFilter]);

  // Calculate stats
  const stats = useMemo(() => {
    const totalProducts = new Set(allLogs.map((log: any) => log.productInfo.id)).size;
    const totalRestocks = allLogs.filter((log: any) => log.type === "RESTOCK").length;
    const totalSales = allLogs.filter((log: any) => log.type === "SALE").length;
    const totalAdjustments = allLogs.filter((log: any) => log.type === "ADJUSTMENT" || log.type === "DAMAGE" || log.type === "RETURN").length;

    return {
      totalProducts,
      totalRestocks,
      totalSales,
      totalAdjustments,
    };
  }, [allLogs]);

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex h-[400px] items-center justify-center">
          <div className="text-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
            <p className="mt-4 text-muted-foreground">Loading inventory...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Inventory Management</h1>
            <p className="text-muted-foreground">
              Track stock movements and inventory updates
            </p>
          </div>
          <Button className="bg-gradient-to-r from-amber-500 to-orange-600 text-white hover:from-amber-600 hover:to-orange-700">
            <Download className="mr-2 h-4 w-4" />
            Export Logs
          </Button>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-6 md:grid-cols-4">
          {/* Total Products */}
          <div className="group relative overflow-hidden rounded-xl border bg-gradient-to-br from-blue-50 to-indigo-50 p-6 shadow-sm transition-all duration-300 hover:shadow-xl">
            <div className="absolute right-0 top-0 h-24 w-24 rounded-full bg-gradient-to-br from-blue-400 to-indigo-400 opacity-10 blur-2xl transition-all duration-500 group-hover:scale-150"></div>
            <div className="relative">
              <div className="flex items-center justify-between">
                <div className="rounded-lg bg-blue-100 p-3">
                  <Package className="h-6 w-6 text-blue-600" />
                </div>
              </div>
              <div className="mt-4">
                <p className="text-sm font-medium text-blue-900/70">Active Products</p>
                <p className="mt-1 text-3xl font-bold text-blue-900">{stats.totalProducts}</p>
              </div>
            </div>
          </div>

          {/* Total Restocks */}
          <div className="group relative overflow-hidden rounded-xl border bg-gradient-to-br from-green-50 to-emerald-50 p-6 shadow-sm transition-all duration-300 hover:shadow-xl">
            <div className="absolute right-0 top-0 h-24 w-24 rounded-full bg-gradient-to-br from-green-400 to-emerald-400 opacity-10 blur-2xl transition-all duration-500 group-hover:scale-150"></div>
            <div className="relative">
              <div className="flex items-center justify-between">
                <div className="rounded-lg bg-green-100 p-3">
                  <ArrowUpCircle className="h-6 w-6 text-green-600" />
                </div>
              </div>
              <div className="mt-4">
                <p className="text-sm font-medium text-green-900/70">Restocks</p>
                <p className="mt-1 text-3xl font-bold text-green-900">{stats.totalRestocks}</p>
              </div>
            </div>
          </div>

          {/* Total Sales */}
          <div className="group relative overflow-hidden rounded-xl border bg-gradient-to-br from-orange-50 to-amber-50 p-6 shadow-sm transition-all duration-300 hover:shadow-xl">
            <div className="absolute right-0 top-0 h-24 w-24 rounded-full bg-gradient-to-br from-orange-400 to-amber-400 opacity-10 blur-2xl transition-all duration-500 group-hover:scale-150"></div>
            <div className="relative">
              <div className="flex items-center justify-between">
                <div className="rounded-lg bg-orange-100 p-3">
                  <TrendingDown className="h-6 w-6 text-orange-600" />
                </div>
              </div>
              <div className="mt-4">
                <p className="text-sm font-medium text-orange-900/70">Sales</p>
                <p className="mt-1 text-3xl font-bold text-orange-900">{stats.totalSales}</p>
              </div>
            </div>
          </div>

          {/* Total Adjustments */}
          <div className="group relative overflow-hidden rounded-xl border bg-gradient-to-br from-purple-50 to-violet-50 p-6 shadow-sm transition-all duration-300 hover:shadow-xl">
            <div className="absolute right-0 top-0 h-24 w-24 rounded-full bg-gradient-to-br from-purple-400 to-violet-400 opacity-10 blur-2xl transition-all duration-500 group-hover:scale-150"></div>
            <div className="relative">
              <div className="flex items-center justify-between">
                <div className="rounded-lg bg-purple-100 p-3">
                  <RotateCcw className="h-6 w-6 text-purple-600" />
                </div>
              </div>
              <div className="mt-4">
                <p className="text-sm font-medium text-purple-900/70">Adjustments</p>
                <p className="mt-1 text-3xl font-bold text-purple-900">{stats.totalAdjustments}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-4 rounded-xl border bg-white p-4 shadow-sm">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search by product, SKU, vendor, or reason..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-lg border bg-white py-2 pl-10 pr-4 text-sm focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
              />
            </div>
          </div>

          {/* Type Filter */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="rounded-lg border bg-white px-4 py-2 text-sm focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
          >
            <option value="all">All Types</option>
            <option value="RESTOCK">Restock</option>
            <option value="SALE">Sale</option>
            <option value="ADJUSTMENT">Adjustment</option>
            <option value="DAMAGE">Damage</option>
            <option value="RETURN">Return</option>
          </select>

          {/* Client Filter */}
          <select
            value={clientFilter}
            onChange={(e) => setClientFilter(e.target.value)}
            className="rounded-lg border bg-white px-4 py-2 text-sm focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
          >
            <option value="all">All Vendors</option>
            {clients?.map((client) => (
              <option key={client.id} value={client.id}>
                {client.businessName}
              </option>
            ))}
          </select>

          {/* View Toggle */}
          <div className="flex gap-2 rounded-lg border bg-gray-50 p-1">
            <Button
              variant={viewMode === "grid" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("grid")}
              className={viewMode === "grid" ? "bg-gradient-to-r from-amber-500 to-orange-600 text-white" : ""}
            >
              <Grid3x3 className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "table" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("table")}
              className={viewMode === "table" ? "bg-gradient-to-r from-amber-500 to-orange-600 text-white" : ""}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>

          {/* Clear Filters */}
          {(searchTerm || typeFilter !== "all" || clientFilter !== "all") && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSearchTerm("");
                setTypeFilter("all");
                setClientFilter("all");
              }}
            >
              Clear Filters
            </Button>
          )}
        </div>

        {/* Inventory Logs Grid/Table */}
        {viewMode === "grid" ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredLogs.map((log: any) => {
              const typeConfig = TYPE_CONFIG[log.type as InventoryType] || TYPE_CONFIG.ADJUSTMENT;
              const TypeIcon = typeConfig.icon;

              return (
                <div
                  key={log.id}
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
                          <h3 className="font-bold text-gray-900">{log.productInfo.name}</h3>
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">
                          SKU: {log.productInfo.sku || "N/A"}
                        </p>
                      </div>
                      <span className={`flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${typeConfig.bg} ${typeConfig.text}`}>
                        <TypeIcon className="h-3 w-3" />
                        {typeConfig.label}
                      </span>
                    </div>
                  </div>

                  {/* Body */}
                  <div className="relative space-y-4 p-6">
                    {/* Vendor */}
                    <div className="rounded-lg border-2 border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 p-3">
                      <div className="flex items-center gap-2">
                        <Store className="h-4 w-4 text-amber-600" />
                        <div>
                          <p className="text-xs font-medium text-amber-900/70">Vendor</p>
                          <p className="text-sm font-semibold text-amber-900">{log.clientInfo.businessName}</p>
                        </div>
                      </div>
                    </div>

                    {/* Stock Change */}
                    <div className="grid grid-cols-3 gap-3">
                      <div className="rounded-lg bg-gray-50 p-3">
                        <p className="text-xs text-gray-600">Previous</p>
                        <p className="text-lg font-bold text-gray-900">{log.previousStock}</p>
                      </div>
                      <div className="flex items-center justify-center">
                        <ArrowDownCircle className="h-5 w-5 text-amber-600" />
                      </div>
                      <div className="rounded-lg bg-gradient-to-br from-green-50 to-emerald-50 p-3">
                        <p className="text-xs text-green-600">New</p>
                        <p className="text-lg font-bold text-green-900">{log.newStock}</p>
                      </div>
                    </div>

                    {/* Quantity Change */}
                    <div className="rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50 p-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-blue-900">Quantity Change</span>
                        <span className={`text-lg font-bold ${log.quantity > 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {log.quantity > 0 ? '+' : ''}{log.quantity}
                        </span>
                      </div>
                    </div>

                    {/* Date */}
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      {new Date(log.createdAt).toLocaleDateString()} at {new Date(log.createdAt).toLocaleTimeString()}
                    </div>

                    {/* View Details */}
                    <Button 
                      className="w-full bg-gradient-to-r from-amber-500 to-orange-600 text-white hover:from-amber-600 hover:to-orange-700"
                      onClick={() => {
                        setViewingLog(log);
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
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Product</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Vendor</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Type</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Previous</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Change</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">New Stock</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Date</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filteredLogs.map((log: any) => {
                    const typeConfig = TYPE_CONFIG[log.type as InventoryType] || TYPE_CONFIG.ADJUSTMENT;
                    const TypeIcon = typeConfig.icon;

                    return (
                      <tr key={log.id} className="transition-colors hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <Package className="h-4 w-4 text-amber-600" />
                            <div>
                              <p className="text-sm font-medium text-gray-900">{log.productInfo.name}</p>
                              <p className="text-xs text-muted-foreground">SKU: {log.productInfo.sku || "N/A"}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <Store className="h-4 w-4 text-amber-600" />
                            <span className="text-sm font-medium text-gray-900">{log.clientInfo.businessName}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${typeConfig.bg} ${typeConfig.text}`}>
                            <TypeIcon className="h-3 w-3" />
                            {typeConfig.label}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {log.previousStock}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold ${log.quantity > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                            {log.quantity > 0 ? <ArrowUpCircle className="h-3 w-3" /> : <ArrowDownCircle className="h-3 w-3" />}
                            {log.quantity > 0 ? '+' : ''}{log.quantity}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-3 py-1 text-sm font-semibold text-blue-600">
                            {log.newStock}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {new Date(log.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => {
                              setViewingLog(log);
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
        {filteredLogs.length === 0 && (
          <div className="rounded-xl border bg-gradient-to-br from-gray-50 to-white p-12 text-center shadow-sm">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-gray-100">
              <Package className="h-10 w-10 text-gray-400" />
            </div>
            <h3 className="mt-4 text-lg font-semibold text-gray-900">No inventory logs found</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              {searchTerm || typeFilter !== "all" || clientFilter !== "all"
                ? "Try adjusting your filters"
                : "Inventory activity will appear here"}
            </p>
          </div>
        )}
      </div>

      {/* View Log Modal */}
      {showViewModal && viewingLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="relative w-full max-w-2xl rounded-xl border bg-white shadow-2xl">
            {/* Header */}
            <div className="border-b bg-gradient-to-r from-blue-50 to-indigo-50 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Inventory Log Details</h2>
                  <p className="mt-1 text-sm text-muted-foreground">Transaction ID: #{viewingLog.id.slice(0, 12)}</p>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    setShowViewModal(false);
                    setViewingLog(null);
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Body */}
            <div className="max-h-[600px] overflow-y-auto p-6">
              <div className="space-y-6">
                {/* Type Badge */}
                <div className="flex justify-center">
                  {(() => {
                    const typeConfig = TYPE_CONFIG[viewingLog.type as InventoryType] || TYPE_CONFIG.ADJUSTMENT;
                    const TypeIcon = typeConfig.icon;

                    return (
                      <span className={`inline-flex items-center gap-2 rounded-full px-6 py-3 text-lg font-semibold ${typeConfig.bg} ${typeConfig.text}`}>
                        <TypeIcon className="h-6 w-6" />
                        {typeConfig.label}
                      </span>
                    );
                  })()}
                </div>

                {/* Product Info */}
                <div className="rounded-lg border-2 border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 p-4">
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-amber-100 p-3">
                      <Package className="h-6 w-6 text-amber-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-amber-900/70">Product</p>
                      <p className="text-lg font-bold text-amber-900">{viewingLog.productInfo.name}</p>
                      <p className="text-xs text-amber-900/70">SKU: {viewingLog.productInfo.sku || "N/A"} • Category: {viewingLog.productInfo.category || "N/A"}</p>
                    </div>
                  </div>
                </div>

                {/* Vendor Info */}
                <div className="rounded-lg border bg-gray-50 p-4">
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-gray-100 p-3">
                      <Store className="h-5 w-5 text-gray-600" />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-600">Vendor</p>
                      <p className="text-sm font-semibold text-gray-900">{viewingLog.clientInfo.businessName}</p>
                    </div>
                  </div>
                </div>

                {/* Stock Change Details */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="rounded-lg border bg-gray-50 p-4 text-center">
                    <p className="text-xs font-medium text-gray-600">Previous Stock</p>
                    <p className="mt-2 text-3xl font-bold text-gray-900">{viewingLog.previousStock}</p>
                  </div>
                  <div className="flex items-center justify-center">
                    <div className="rounded-full bg-gradient-to-r from-amber-500 to-orange-600 p-3">
                      {viewingLog.quantity > 0 ? (
                        <ArrowUpCircle className="h-6 w-6 text-white" />
                      ) : (
                        <ArrowDownCircle className="h-6 w-6 text-white" />
                      )}
                    </div>
                  </div>
                  <div className="rounded-lg border-2 border-green-200 bg-gradient-to-br from-green-50 to-emerald-50 p-4 text-center">
                    <p className="text-xs font-medium text-green-600">New Stock</p>
                    <p className="mt-2 text-3xl font-bold text-green-900">{viewingLog.newStock}</p>
                  </div>
                </div>

                {/* Quantity Change */}
                <div className="rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50 p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-blue-900">Quantity Change</span>
                    <span className={`text-2xl font-bold ${viewingLog.quantity > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {viewingLog.quantity > 0 ? '+' : ''}{viewingLog.quantity}
                    </span>
                  </div>
                </div>

                {/* Reason & Reference */}
                {(viewingLog.reason || viewingLog.reference) && (
                  <div className="space-y-3">
                    {viewingLog.reason && (
                      <div className="rounded-lg border bg-purple-50 p-4">
                        <div className="flex items-start gap-3">
                          <FileText className="mt-0.5 h-5 w-5 text-purple-600" />
                          <div className="flex-1">
                            <p className="text-xs font-medium text-purple-900/70">Reason</p>
                            <p className="mt-1 text-sm text-purple-900">{viewingLog.reason}</p>
                          </div>
                        </div>
                      </div>
                    )}
                    {viewingLog.reference && (
                      <div className="rounded-lg border bg-gray-50 p-4">
                        <div className="flex items-start gap-3">
                          <FileText className="mt-0.5 h-5 w-5 text-gray-600" />
                          <div className="flex-1">
                            <p className="text-xs font-medium text-gray-600">Reference</p>
                            <p className="mt-1 font-mono text-sm text-gray-900">{viewingLog.reference}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Metadata */}
                <div className="rounded-lg border bg-gray-50 p-4">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-gray-600" />
                      <div>
                        <p className="text-xs text-gray-600">Created At</p>
                        <p className="text-sm font-medium text-gray-900">
                          {new Date(viewingLog.createdAt).toLocaleDateString()} at {new Date(viewingLog.createdAt).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                    {viewingLog.updatedBy && (
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-gray-600" />
                        <div>
                          <p className="text-xs text-gray-600">Updated By</p>
                          <p className="text-sm font-medium text-gray-900">{viewingLog.updatedBy.name || viewingLog.updatedBy.email}</p>
                        </div>
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
                    setViewingLog(null);
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
