"use client";

import { DashboardLayout } from "@/components/dashboard/layout";
import { trpc } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
import { CurrencyDisplay } from "@/components/dashboard";
import {
  Plus, Search, Package, AlertTriangle, Download, Filter,
  Grid3x3, List, TrendingUp, DollarSign, Box, BarChart3,
  Edit, Eye, Trash2, ShoppingCart, Archive, Tag, Store, X
} from "lucide-react";
import { useState, useMemo } from "react";
import Image from "next/image";

export default function ProductsPage() {
  const [selectedClient, setSelectedClient] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [stockFilter, setStockFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [viewingProduct, setViewingProduct] = useState<any>(null);
  const [showViewModal, setShowViewModal] = useState(false);

  const { data: clients, isLoading, error } = trpc.client.getAll.useQuery();

  // Memoize product aggregation for performance
  const allProducts = useMemo(() =>
    clients?.flatMap((client) =>
      (client as any).products?.map((product: any) => ({
        ...product,
        clientInfo: {
          id: client.id,
          businessName: client.businessName,
        },
      })) || []
    ) || []
    , [clients]);

  // Memoize filtered products to avoid re-filtering on every render
  const filteredProducts = useMemo(() =>
    allProducts.filter((product: any) => {
      const matchesSearch =
        searchTerm === "" ||
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.sku?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.clientInfo.businessName.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesClient =
        selectedClient === "all" || product.clientProfileId === selectedClient;

      const matchesStock =
        stockFilter === "all" ||
        (stockFilter === "low" &&
          product.reorderLevel &&
          product.currentStock <= product.reorderLevel) ||
        (stockFilter === "out" && product.currentStock === 0) ||
        (stockFilter === "good" &&
          (!product.reorderLevel || product.currentStock > product.reorderLevel));

      const matchesCategory =
        categoryFilter === "all" || product.category === categoryFilter;

      return matchesSearch && matchesClient && matchesStock && matchesCategory;
    })
    , [allProducts, searchTerm, selectedClient, stockFilter, categoryFilter]);

  // Memoize unique categories
  const categories = useMemo(() =>
    Array.from(new Set(allProducts.map((p: any) => p.category).filter(Boolean)))
    , [allProducts]);

  // Memoize expensive stats calculations
  const stats = useMemo(() => ({
    total: allProducts.length,
    lowStock: allProducts.filter(
      (p: any) => p.reorderLevel && p.currentStock <= p.reorderLevel
    ).length,
    outOfStock: allProducts.filter((p: any) => p.currentStock === 0).length,
    totalValue: allProducts.reduce(
      (sum: number, p: any) => sum + p.currentStock * (p.unitPrice || 0),
      0
    ),
    avgPrice: allProducts.length > 0
      ? allProducts.reduce((sum: number, p: any) => sum + (p.unitPrice || 0), 0) / allProducts.length
      : 0,
    totalStock: allProducts.reduce((sum: number, p: any) => sum + p.currentStock, 0),
  }), [allProducts]);

  if (error) {
    return (
      <DashboardLayout>
        <div className="rounded-lg border border-red-200 bg-red-50 p-8 text-center">
          <p className="text-red-800">
            {error.message || "Error loading products. Please try again."}
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
            <p className="mt-4 text-muted-foreground">Loading products...</p>
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
              Product Management
            </h1>
            <p className="mt-1 text-muted-foreground">
              Manage inventory across all client accounts
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
            <Button className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600">
              <Plus className="mr-2 h-4 w-4" />
              Add Product
            </Button>
          </div>
        </div>

        {/* Enhanced Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-6">
          <div className="group relative overflow-hidden rounded-xl border bg-gradient-to-br from-white to-gray-50 p-4 shadow-sm transition-all hover:shadow-md">
            <div className="absolute right-0 top-0 h-20 w-20 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 opacity-10 blur-2xl"></div>
            <div className="relative">
              <p className="text-xs font-medium text-muted-foreground">Total Products</p>
              <p className="mt-2 text-3xl font-bold">{stats.total}</p>
              <div className="mt-1 flex items-center gap-1 text-xs text-blue-600">
                <Package className="h-3 w-3" />
                <span>All items</span>
              </div>
            </div>
          </div>

          <div className="group relative overflow-hidden rounded-xl border bg-gradient-to-br from-green-50 to-white p-4 shadow-sm transition-all hover:shadow-md">
            <div className="absolute right-0 top-0 h-20 w-20 rounded-full bg-gradient-to-br from-green-400 to-green-600 opacity-10 blur-2xl"></div>
            <div className="relative">
              <p className="text-xs font-medium text-muted-foreground">Total Value</p>
              <p className="mt-2">
                <CurrencyDisplay
                  amount={stats.totalValue}
                  compact
                  className="text-3xl font-bold text-green-600"
                />
              </p>
              <div className="mt-1 text-xs text-muted-foreground">
                Inventory worth
              </div>
            </div>
          </div>

          <div className="group relative overflow-hidden rounded-xl border bg-gradient-to-br from-orange-50 to-white p-4 shadow-sm transition-all hover:shadow-md">
            <div className="absolute right-0 top-0 h-20 w-20 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 opacity-10 blur-2xl"></div>
            <div className="relative">
              <p className="text-xs font-medium text-muted-foreground">Low Stock</p>
              <p className="mt-2 text-3xl font-bold text-orange-600">{stats.lowStock}</p>
              <div className="mt-1 text-xs text-muted-foreground">
                {stats.total > 0 ? Math.round((stats.lowStock / stats.total) * 100) : 0}% of total
              </div>
            </div>
          </div>

          <div className="group relative overflow-hidden rounded-xl border bg-gradient-to-br from-red-50 to-white p-4 shadow-sm transition-all hover:shadow-md">
            <div className="absolute right-0 top-0 h-20 w-20 rounded-full bg-gradient-to-br from-red-400 to-red-600 opacity-10 blur-2xl"></div>
            <div className="relative">
              <p className="text-xs font-medium text-muted-foreground">Out of Stock</p>
              <p className="mt-2 text-3xl font-bold text-red-600">{stats.outOfStock}</p>
              <div className="mt-1 text-xs text-muted-foreground">
                Needs restock
              </div>
            </div>
          </div>

          <div className="group relative overflow-hidden rounded-xl border bg-gradient-to-br from-purple-50 to-white p-4 shadow-sm transition-all hover:shadow-md">
            <div className="absolute right-0 top-0 h-20 w-20 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 opacity-10 blur-2xl"></div>
            <div className="relative">
              <p className="text-xs font-medium text-muted-foreground">Avg Price</p>
              <p className="mt-2">
                <CurrencyDisplay
                  amount={stats.avgPrice}
                  className="text-3xl font-bold text-purple-600"
                />
              </p>
              <div className="mt-1 text-xs text-muted-foreground">
                Per item
              </div>
            </div>
          </div>

          <div className="group relative overflow-hidden rounded-xl border bg-gradient-to-br from-cyan-50 to-white p-4 shadow-sm transition-all hover:shadow-md">
            <div className="absolute right-0 top-0 h-20 w-20 rounded-full bg-gradient-to-br from-cyan-400 to-cyan-600 opacity-10 blur-2xl"></div>
            <div className="relative">
              <p className="text-xs font-medium text-muted-foreground">Total Units</p>
              <p className="mt-2 text-3xl font-bold text-cyan-600">{stats.totalStock}</p>
              <div className="mt-1 text-xs text-muted-foreground">
                In stock
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Filters & Search */}
        <div className="rounded-xl border bg-gradient-to-r from-white to-gray-50 p-4 shadow-sm">
          <div className="flex flex-col gap-4">
            {/* Search Bar */}
            <div className="flex items-center gap-2 rounded-lg border bg-white px-4 py-2.5 shadow-sm">
              <Search className="h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search products by name, SKU, or client..."
                className="flex-1 border-0 bg-transparent text-sm outline-none"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Filters Row */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-700">Filters:</span>
              </div>

              <select
                className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm shadow-sm transition-all hover:border-gray-300 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                value={selectedClient}
                onChange={(e) => setSelectedClient(e.target.value)}
              >
                <option value="all">All Clients</option>
                {clients?.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.businessName}
                  </option>
                ))}
              </select>

              <select
                className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm shadow-sm transition-all hover:border-gray-300 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
              >
                <option value="all">All Categories</option>
                {categories.map((category: string) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>

              <select
                className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm shadow-sm transition-all hover:border-gray-300 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                value={stockFilter}
                onChange={(e) => setStockFilter(e.target.value)}
              >
                <option value="all">All Stock Levels</option>
                <option value="good">In Stock</option>
                <option value="low">Low Stock</option>
                <option value="out">Out of Stock</option>
              </select>

              <div className="ml-auto flex items-center gap-2 rounded-lg border bg-white p-1">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`rounded px-3 py-1.5 text-sm font-medium transition-all ${viewMode === "grid"
                      ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-sm"
                      : "text-gray-600 hover:bg-gray-100"
                    }`}
                >
                  <Grid3x3 className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setViewMode("table")}
                  className={`rounded px-3 py-1.5 text-sm font-medium transition-all ${viewMode === "table"
                      ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-sm"
                      : "text-gray-600 hover:bg-gray-100"
                    }`}
                >
                  <List className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Grid View */}
        {viewMode === "grid" && (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredProducts.map((product: any) => {
              const stockStatus = product.currentStock === 0
                ? "out"
                : product.reorderLevel && product.currentStock <= product.reorderLevel
                  ? "low"
                  : "good";

              return (
                <div
                  key={product.id}
                  className="group relative overflow-hidden rounded-xl border bg-gradient-to-br from-white to-gray-50 shadow-sm transition-all duration-300 hover:shadow-xl"
                >
                  {/* Gradient background */}
                  <div className="absolute right-0 top-0 h-32 w-32 rounded-full bg-gradient-to-br from-amber-400 to-orange-400 opacity-5 blur-3xl transition-all duration-500 group-hover:scale-150 group-hover:opacity-10"></div>

                  {/* Image/Icon Section */}
                  <div className="relative border-b bg-gradient-to-r from-gray-50 to-white p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-gradient-to-br from-amber-100 to-orange-100">
                        {product.image ? (
                          <Image src={product.image} alt={product.name} width={64} height={64} className="h-full w-full rounded-lg object-cover" />
                        ) : (
                          <Package className="h-8 w-8 text-amber-600" />
                        )}
                      </div>
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${stockStatus === "out"
                            ? "bg-red-100 text-red-800"
                            : stockStatus === "low"
                              ? "bg-orange-100 text-orange-800"
                              : "bg-green-100 text-green-800"
                          }`}
                      >
                        {stockStatus === "out" ? "Out" : stockStatus === "low" ? "Low" : "In Stock"}
                      </span>
                    </div>
                    <div className="mt-4">
                      <h3 className="font-bold text-gray-900 line-clamp-1">{product.name}</h3>
                      {product.sku && (
                        <p className="mt-1 text-xs text-muted-foreground">SKU: {product.sku}</p>
                      )}
                    </div>
                  </div>

                  {/* Body */}
                  <div className="relative space-y-4 p-6">
                    {/* Vendor (Client) - Prominent Display */}
                    <div className="rounded-lg border border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 p-3">
                      <div className="flex items-center gap-2">
                        <Store className="h-4 w-4 text-amber-600" />
                        <span className="text-xs font-semibold text-amber-900">Vendor</span>
                      </div>
                      <p className="mt-1 font-bold text-amber-900 truncate">{product.clientInfo.businessName}</p>
                    </div>

                    {/* Category */}
                    <div className="space-y-2">
                      {product.category && (
                        <div className="flex items-center gap-2 text-sm">
                          <Tag className="h-4 w-4 text-gray-400" />
                          <span className="text-gray-600">{product.category}</span>
                        </div>
                      )}
                    </div>

                    {/* Price & Stock */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="rounded-lg border bg-gradient-to-br from-green-50 to-white p-3">
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4 text-green-600" />
                          <span className="text-xs text-muted-foreground">Price</span>
                        </div>
                        <p className="mt-1">
                          <CurrencyDisplay
                            amount={product.unitPrice || 0}
                            className="text-lg font-bold text-green-600"
                          />
                        </p>
                      </div>
                      <div className="rounded-lg border bg-gradient-to-br from-blue-50 to-white p-3">
                        <div className="flex items-center gap-2">
                          <BarChart3 className="h-4 w-4 text-blue-600" />
                          <span className="text-xs text-muted-foreground">Stock</span>
                        </div>
                        <p className="mt-1 text-lg font-bold text-blue-600">{product.currentStock}</p>
                        {product.reorderLevel && (
                          <p className="text-xs text-muted-foreground">Min: {product.reorderLevel}</p>
                        )}
                      </div>
                    </div>

                    {/* Description */}
                    {product.description && (
                      <p className="text-sm text-gray-600 line-clamp-2">{product.description}</p>
                    )}
                  </div>

                  {/* Footer Actions */}
                  <div className="relative border-t bg-gray-50 p-4">
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => {
                          setViewingProduct(product);
                          setShowViewModal(true);
                        }}
                      >
                        <Eye className="mr-2 h-4 w-4" />
                        View
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => {
                          setEditingProduct(product);
                          setShowEditModal(true);
                        }}
                      >
                        <Edit className="mr-2 h-4 w-4" />
                        Edit
                      </Button>
                    </div>
                  </div>

                  {/* Bottom accent */}
                  <div className="absolute bottom-0 left-0 h-1 w-0 bg-gradient-to-r from-amber-400 to-orange-500 transition-all duration-500 group-hover:w-full"></div>
                </div>
              );
            })}
          </div>
        )}

        {/* Table View */}
        {viewMode === "table" && (
          <div className="rounded-xl border bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b bg-gradient-to-r from-gray-50 to-white">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Product</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Client</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">SKU</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Category</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Price</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Stock</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Status</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filteredProducts.map((product: any) => {
                    const stockStatus = product.currentStock === 0
                      ? "out"
                      : product.reorderLevel && product.currentStock <= product.reorderLevel
                        ? "low"
                        : "good";

                    return (
                      <tr key={product.id} className="transition-colors hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-amber-100 to-orange-100">
                              {product.image ? (
                                <Image src={product.image} alt={product.name} width={40} height={40} className="h-full w-full rounded-lg object-cover" />
                              ) : (
                                <Package className="h-5 w-5 text-amber-600" />
                              )}
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">{product.name}</p>
                              {product.description && (
                                <p className="text-xs text-muted-foreground line-clamp-1">
                                  {product.description}
                                </p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <Store className="h-4 w-4 text-amber-600" />
                            <span className="text-sm font-medium text-gray-900">{product.clientInfo.businessName}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">{product.sku || "—"}</td>
                        <td className="px-6 py-4">
                          {product.category ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-purple-50 px-3 py-1 text-xs font-medium text-purple-600">
                              <Tag className="h-3 w-3" />
                              {product.category}
                            </span>
                          ) : (
                            <span className="text-sm text-gray-400">—</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-3 py-1 text-sm font-semibold text-green-600">
                            <DollarSign className="h-3 w-3" />
                            <CurrencyDisplay amount={product.unitPrice || 0} />
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div>
                            <p className="text-sm font-medium">{product.currentStock}</p>
                            {product.reorderLevel && (
                              <p className="text-xs text-muted-foreground">
                                Min: {product.reorderLevel}
                              </p>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${stockStatus === "out"
                                ? "bg-red-100 text-red-800"
                                : stockStatus === "low"
                                  ? "bg-orange-100 text-orange-800"
                                  : "bg-green-100 text-green-800"
                              }`}
                          >
                            <div className={`h-2 w-2 rounded-full ${stockStatus === "out"
                                ? "bg-red-500"
                                : stockStatus === "low"
                                  ? "bg-orange-500"
                                  : "bg-green-500"
                              }`}></div>
                            {stockStatus === "out" ? "Out of Stock" : stockStatus === "low" ? "Low Stock" : "In Stock"}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setViewingProduct(product);
                                setShowViewModal(true);
                              }}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setEditingProduct(product);
                                setShowEditModal(true);
                              }}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          </div>
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
        {filteredProducts.length === 0 && (
          <div className="rounded-xl border bg-gradient-to-br from-gray-50 to-white p-12 text-center shadow-sm">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-gray-100">
              <Package className="h-10 w-10 text-gray-400" />
            </div>
            <h3 className="mt-4 text-lg font-semibold text-gray-900">No products found</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              {searchTerm || selectedClient !== "all" || stockFilter !== "all" || categoryFilter !== "all"
                ? "Try adjusting your search or filters to find what you're looking for."
                : "Get started by adding your first product to the system."}
            </p>
            {!searchTerm && selectedClient === "all" && stockFilter === "all" && categoryFilter === "all" && (
              <Button className="mt-6 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600">
                <Plus className="mr-2 h-4 w-4" />
                Add Your First Product
              </Button>
            )}
          </div>
        )}
      </div>

      {/* View Product Modal */}
      {showViewModal && viewingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="relative w-full max-w-2xl rounded-xl border bg-white shadow-2xl">
            {/* Header */}
            <div className="border-b bg-gradient-to-r from-blue-50 to-indigo-50 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Product Details</h2>
                  <p className="mt-1 text-sm text-muted-foreground">View complete product information</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setShowViewModal(false);
                    setViewingProduct(null);
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Body */}
            <div className="max-h-[600px] overflow-y-auto p-6">
              <div className="space-y-6">
                {/* Product Image/Icon */}
                <div className="flex justify-center">
                  <div className="flex h-32 w-32 items-center justify-center rounded-xl bg-gradient-to-br from-amber-100 to-orange-100">
                    {viewingProduct.image ? (
                      <Image src={viewingProduct.image} alt={viewingProduct.name} width={128} height={128} className="h-full w-full rounded-xl object-cover" />
                    ) : (
                      <Package className="h-16 w-16 text-amber-600" />
                    )}
                  </div>
                </div>

                {/* Product Name */}
                <div className="text-center">
                  <h3 className="text-2xl font-bold text-gray-900">{viewingProduct.name}</h3>
                  {viewingProduct.sku && (
                    <p className="mt-1 text-sm text-muted-foreground">SKU: {viewingProduct.sku}</p>
                  )}
                </div>

                {/* Vendor Info */}
                <div className="rounded-lg border-2 border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-amber-500">
                      <Store className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-amber-900">Vendor</p>
                      <p className="text-lg font-bold text-amber-900">{viewingProduct.clientInfo.businessName}</p>
                    </div>
                  </div>
                </div>

                {/* Category & Price Grid */}
                <div className="grid grid-cols-2 gap-4">
                  {viewingProduct.category && (
                    <div className="rounded-lg border bg-purple-50 p-4">
                      <div className="flex items-center gap-2 text-purple-600">
                        <Tag className="h-5 w-5" />
                        <span className="text-xs font-semibold uppercase">Category</span>
                      </div>
                      <p className="mt-2 text-lg font-bold text-purple-900">{viewingProduct.category}</p>
                    </div>
                  )}
                  <div className="rounded-lg border bg-green-50 p-4">
                    <div className="flex items-center gap-2 text-green-600">
                      <DollarSign className="h-5 w-5" />
                      <span className="text-xs font-semibold uppercase">Unit Price</span>
                    </div>
                    <p className="mt-2">
                      <CurrencyDisplay
                        amount={viewingProduct.unitPrice || 0}
                        className="text-lg font-bold text-green-900"
                      />
                    </p>
                  </div>
                </div>

                {/* Stock Information */}
                <div className="rounded-lg border-2 border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50 p-4">
                  <h4 className="mb-3 text-sm font-semibold uppercase tracking-wide text-blue-900">Stock Information</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-blue-600">Current Stock</p>
                      <p className="mt-1 text-2xl font-bold text-blue-900">{viewingProduct.currentStock}</p>
                    </div>
                    {viewingProduct.reorderLevel && (
                      <div>
                        <p className="text-xs text-blue-600">Reorder Level</p>
                        <p className="mt-1 text-2xl font-bold text-blue-900">{viewingProduct.reorderLevel}</p>
                      </div>
                    )}
                  </div>
                  <div className="mt-3">
                    <span
                      className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold ${viewingProduct.currentStock === 0
                          ? "bg-red-100 text-red-800"
                          : viewingProduct.reorderLevel && viewingProduct.currentStock <= viewingProduct.reorderLevel
                            ? "bg-orange-100 text-orange-800"
                            : "bg-green-100 text-green-800"
                        }`}
                    >
                      <div className={`h-3 w-3 rounded-full ${viewingProduct.currentStock === 0
                          ? "bg-red-500"
                          : viewingProduct.reorderLevel && viewingProduct.currentStock <= viewingProduct.reorderLevel
                            ? "bg-orange-500"
                            : "bg-green-500"
                        }`}></div>
                      {viewingProduct.currentStock === 0
                        ? "Out of Stock"
                        : viewingProduct.reorderLevel && viewingProduct.currentStock <= viewingProduct.reorderLevel
                          ? "Low Stock"
                          : "In Stock"}
                    </span>
                  </div>
                </div>

                {/* Description */}
                {viewingProduct.description && (
                  <div className="rounded-lg border bg-gray-50 p-4">
                    <h4 className="mb-2 text-sm font-semibold uppercase tracking-wide text-gray-700">Description</h4>
                    <p className="text-gray-700">{viewingProduct.description}</p>
                  </div>
                )}

                {/* Metadata */}
                <div className="rounded-lg border bg-gray-50 p-4">
                  <h4 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-700">Additional Information</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Status:</span>
                      <span className={`font-medium ${viewingProduct.isActive ? 'text-green-600' : 'text-red-600'}`}>
                        {viewingProduct.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Created:</span>
                      <span className="font-medium text-gray-900">
                        {new Date(viewingProduct.createdAt).toLocaleDateString()}
                      </span>
                    </div>
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
                    setViewingProduct(null);
                  }}
                >
                  Close
                </Button>
                <Button
                  className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
                  onClick={() => {
                    setShowViewModal(false);
                    setEditingProduct(viewingProduct);
                    setShowEditModal(true);
                  }}
                >
                  <Edit className="mr-2 h-4 w-4" />
                  Edit Product
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Product Modal */}
      {showEditModal && editingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="relative w-full max-w-2xl rounded-xl border bg-white shadow-2xl">
            {/* Header */}
            <div className="border-b bg-gradient-to-r from-amber-50 to-orange-50 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Edit Product</h2>
                  <p className="mt-1 text-sm text-muted-foreground">Update product details for {editingProduct.name}</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingProduct(null);
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Body */}
            <div className="max-h-[600px] overflow-y-auto p-6">
              <div className="space-y-4">
                {/* Vendor Info - Read Only */}
                <div className="rounded-lg border border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 p-4">
                  <div className="flex items-center gap-2">
                    <Store className="h-5 w-5 text-amber-600" />
                    <div>
                      <p className="text-xs font-semibold text-amber-900">Vendor</p>
                      <p className="text-sm font-bold text-amber-900">{editingProduct.clientInfo.businessName}</p>
                    </div>
                  </div>
                </div>

                {/* Product Name */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">Product Name</label>
                  <input
                    type="text"
                    defaultValue={editingProduct.name}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                  />
                </div>

                {/* SKU & Category */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">SKU</label>
                    <input
                      type="text"
                      defaultValue={editingProduct.sku || ""}
                      className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">Category</label>
                    <input
                      type="text"
                      defaultValue={editingProduct.category || ""}
                      className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                    />
                  </div>
                </div>

                {/* Price & Stock */}
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">Unit Price</label>
                    <input
                      type="number"
                      step="0.01"
                      defaultValue={editingProduct.unitPrice || 0}
                      className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">Current Stock</label>
                    <input
                      type="number"
                      defaultValue={editingProduct.currentStock}
                      className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">Reorder Level</label>
                    <input
                      type="number"
                      defaultValue={editingProduct.reorderLevel || ""}
                      className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                    />
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">Description</label>
                  <textarea
                    rows={4}
                    defaultValue={editingProduct.description || ""}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                  />
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="border-t bg-gray-50 p-6">
              <div className="flex justify-end gap-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingProduct(null);
                  }}
                >
                  Cancel
                </Button>
                <Button className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600">
                  Save Changes
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

