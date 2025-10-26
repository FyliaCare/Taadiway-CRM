"use client";

import { DashboardLayout } from "@/components/dashboard/layout";
import { CurrencyDisplay } from "@/components/dashboard";
import { trpc } from "@/lib/trpc/client";
import { useState, useMemo } from "react";
import { useSession } from "next-auth/react";
import {
  Package,
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  DollarSign,
  BarChart3,
  Archive,
  Eye,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Activity,
  Calendar,
  Tag,
  Box
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type StockUpdateType = "RESTOCK" | "ADJUSTMENT" | "DAMAGE" | "RETURN";

export default function MyProductsPage() {
  const { data: session } = useSession();
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [stockFilter, setStockFilter] = useState<string>("all");
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showStockModal, setShowStockModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Get vendor's client profile
  const { data: user } = trpc.user.current.useQuery();
  const { data: clientProfile } = trpc.client.getCurrent.useQuery();

  // Get products for this vendor
  const { data: products, isLoading, refetch } = trpc.product.getByClient.useQuery(
    { clientProfileId: clientProfile?.id || "" },
    { enabled: !!clientProfile?.id }
  );

  // Get low stock products
  const { data: lowStockProducts } = trpc.product.getLowStock.useQuery(
    { clientProfileId: clientProfile?.id },
    { enabled: !!clientProfile?.id }
  );

  const updateProductMutation = trpc.product.update.useMutation({
    onSuccess: () => {
      refetch();
      setSelectedProduct(null);
    },
  });

  const updateStockMutation = trpc.product.updateStock.useMutation({
    onSuccess: () => {
      refetch();
      setShowStockModal(false);
      setSelectedProduct(null);
    },
  });

  // Filter and search products
  const filteredProducts = useMemo(() => {
    if (!products) return [];

    return products.filter((product) => {
      // Search filter
      const matchesSearch =
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.sku?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.category?.toLowerCase().includes(searchQuery.toLowerCase());

      // Category filter
      const matchesCategory =
        categoryFilter === "all" ||
        product.category === categoryFilter;

      // Stock filter
      let matchesStock = true;
      if (stockFilter === "low") {
        matchesStock = product.reorderLevel !== null && product.currentStock <= product.reorderLevel;
      } else if (stockFilter === "out") {
        matchesStock = product.currentStock === 0;
      } else if (stockFilter === "active") {
        matchesStock = product.isActive;
      } else if (stockFilter === "inactive") {
        matchesStock = !product.isActive;
      }

      return matchesSearch && matchesCategory && matchesStock;
    });
  }, [products, searchQuery, categoryFilter, stockFilter]);

  // Get unique categories
  const categories = useMemo(() => {
    if (!products) return [];
    const cats = new Set(products.map((p) => p.category).filter(Boolean));
    return Array.from(cats);
  }, [products]);

  // Calculate stats
  const stats = useMemo(() => {
    if (!products) return {
      total: 0,
      active: 0,
      lowStock: 0,
      outOfStock: 0,
      totalValue: 0,
      totalCost: 0,
    };

    return {
      total: products.length,
      active: products.filter((p) => p.isActive).length,
      lowStock: lowStockProducts?.length || 0,
      outOfStock: products.filter((p) => p.currentStock === 0).length,
      totalValue: products.reduce((sum, p) => sum + ((p.unitPrice || 0) * p.currentStock), 0),
      totalCost: products.reduce((sum, p) => sum + ((p.costPrice || 0) * p.currentStock), 0),
    };
  }, [products, lowStockProducts]);

  const handleToggleActive = (productId: string, isActive: boolean) => {
    updateProductMutation.mutate({
      id: productId,
      isActive: !isActive,
    });
  };

  const handleStockUpdate = (productId: string, quantity: number, type: StockUpdateType, reason?: string) => {
    updateStockMutation.mutate({
      productId,
      quantity,
      type,
      reason,
    });
  };

  const getStockStatus = (product: any) => {
    if (product.currentStock === 0) {
      return { label: "Out of Stock", color: "text-red-600 bg-red-50 border-red-200", icon: XCircle };
    }
    if (product.reorderLevel && product.currentStock <= product.reorderLevel) {
      return { label: "Low Stock", color: "text-amber-600 bg-amber-50 border-amber-200", icon: AlertTriangle };
    }
    return { label: "In Stock", color: "text-green-600 bg-green-50 border-green-200", icon: CheckCircle2 };
  };

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-purple-50 p-8">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                My Products
              </h1>
              <p className="text-gray-600 mt-1">Manage your product inventory and stock levels</p>
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="gap-2"
                onClick={() => refetch()}
              >
                <RefreshCw className="w-4 h-4" />
                Refresh
              </Button>
              <Button
                className="gap-2 bg-gradient-to-r from-purple-600 to-pink-600"
                onClick={() => setShowCreateModal(true)}
              >
                <Plus className="w-4 h-4" />
                Add Product
              </Button>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="p-6 bg-gradient-to-br from-purple-500 to-purple-600 text-white shadow-lg">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-purple-100 text-sm font-medium">Total Products</p>
                  <p className="text-4xl font-bold mt-2">{stats.total}</p>
                </div>
                <div className="bg-white/20 p-3 rounded-lg">
                  <Package className="w-6 h-6" />
                </div>
              </div>
              <p className="text-purple-100 text-sm">{stats.active} active</p>
            </Card>

            <Card className="p-6 bg-gradient-to-br from-green-500 to-emerald-600 text-white shadow-lg">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-green-100 text-sm font-medium">Inventory Value</p>
                  <p className="text-4xl font-bold mt-2">
                    <CurrencyDisplay amount={stats.totalValue} compact />
                  </p>
                </div>
                <div className="bg-white/20 p-3 rounded-lg">
                  <DollarSign className="w-6 h-6" />
                </div>
              </div>
              <p className="text-green-100 text-sm">
                Cost: <CurrencyDisplay amount={stats.totalCost} compact />
              </p>
            </Card>

            <Card className="p-6 bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-lg">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-amber-100 text-sm font-medium">Low Stock</p>
                  <p className="text-4xl font-bold mt-2">{stats.lowStock}</p>
                </div>
                <div className="bg-white/20 p-3 rounded-lg">
                  <AlertTriangle className="w-6 h-6" />
                </div>
              </div>
              <p className="text-amber-100 text-sm">Requires restocking</p>
            </Card>

            <Card className="p-6 bg-gradient-to-br from-red-500 to-rose-600 text-white shadow-lg">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-red-100 text-sm font-medium">Out of Stock</p>
                  <p className="text-4xl font-bold mt-2">{stats.outOfStock}</p>
                </div>
                <div className="bg-white/20 p-3 rounded-lg">
                  <XCircle className="w-6 h-6" />
                </div>
              </div>
              <p className="text-red-100 text-sm">Needs immediate attention</p>
            </Card>
          </div>

          {/* Filters & Search */}
          <Card className="p-6 shadow-lg">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <Input
                    placeholder="Search by name, SKU, category..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-purple-500"
                >
                  <option value="all">All Categories</option>
                  {categories.map((cat) => (
                    <option key={cat || 'uncategorized'} value={cat || ''}>
                      {cat || 'Uncategorized'}
                    </option>
                  ))}
                </select>
                <select
                  value={stockFilter}
                  onChange={(e) => setStockFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-purple-500"
                >
                  <option value="all">All Stock</option>
                  <option value="low">Low Stock</option>
                  <option value="out">Out of Stock</option>
                  <option value="active">Active Only</option>
                  <option value="inactive">Inactive Only</option>
                </select>
              </div>
            </div>
          </Card>

          {/* Products Grid */}
          {isLoading ? (
            <div className="py-12 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
              <p className="text-gray-600 mt-4">Loading products...</p>
            </div>
          ) : filteredProducts.length === 0 ? (
            <Card className="p-12 text-center shadow-lg">
              <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No products found</h3>
              <p className="text-gray-600 mb-6">
                {searchQuery || categoryFilter !== "all" || stockFilter !== "all"
                  ? "Try adjusting your filters"
                  : "Create your first product to get started"}
              </p>
              {!searchQuery && categoryFilter === "all" && stockFilter === "all" && (
                <Button
                  className="gap-2"
                  onClick={() => setShowCreateModal(true)}
                >
                  <Plus className="w-4 h-4" />
                  Add Product
                </Button>
              )}
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProducts.map((product) => {
                const stockStatus = getStockStatus(product);
                const StatusIcon = stockStatus.icon;
                const profitMargin = product.unitPrice && product.costPrice
                  ? ((product.unitPrice - product.costPrice) / product.unitPrice * 100).toFixed(1)
                  : 0;

                return (
                  <Card
                    key={product.id}
                    className="overflow-hidden hover:shadow-xl transition-all duration-300 border-2 hover:border-purple-300"
                  >
                    {/* Product Header */}
                    <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-4 border-b">
                      <div className="flex items-start justify-between mb-2">
                        <div className="bg-white p-3 rounded-lg shadow-sm">
                          <Package className="w-6 h-6 text-purple-600" />
                        </div>
                        <div className="flex gap-2">
                          {!product.isActive && (
                            <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs font-semibold rounded-full">
                              Inactive
                            </span>
                          )}
                          <span className={`px-2 py-1 text-xs font-semibold rounded-full border ${stockStatus.color}`}>
                            <StatusIcon className="w-3 h-3 inline mr-1" />
                            {stockStatus.label}
                          </span>
                        </div>
                      </div>
                      <h3 className="text-lg font-bold text-gray-900 mb-1">{product.name}</h3>
                      {product.category && (
                        <div className="flex items-center gap-1 text-sm text-purple-600">
                          <Tag className="w-3 h-3" />
                          {product.category}
                        </div>
                      )}
                    </div>

                    {/* Product Stats */}
                    <div className="p-4 space-y-3">
                      {product.sku && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-500">SKU</span>
                          <span className="font-mono font-semibold text-gray-900">{product.sku}</span>
                        </div>
                      )}

                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-500">Current Stock</span>
                        <div className="flex items-center gap-2">
                          <span className="text-2xl font-bold text-gray-900">{product.currentStock}</span>
                          {product.reorderLevel && (
                            <span className="text-xs text-gray-400">/ {product.reorderLevel}</span>
                          )}
                        </div>
                      </div>

                      {product.unitPrice && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-500">Unit Price</span>
                          <span className="text-lg font-bold text-green-700">
                            <CurrencyDisplay amount={product.unitPrice} />
                          </span>
                        </div>
                      )}

                      {product.costPrice && product.unitPrice && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-500">Profit Margin</span>
                          <span className="text-sm font-semibold text-purple-600">
                            {profitMargin}%
                          </span>
                        </div>
                      )}

                      {product.unitPrice && (
                        <div className="pt-3 border-t border-gray-200">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-500">Inventory Value</span>
                            <span className="text-lg font-bold text-blue-700">
                              <CurrencyDisplay amount={product.unitPrice * product.currentStock} />
                            </span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="p-4 bg-gray-50 border-t flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 gap-1"
                        onClick={() => setSelectedProduct(product)}
                      >
                        <Eye className="w-4 h-4" />
                        View
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 gap-1 text-purple-600 border-purple-300 hover:bg-purple-50"
                        onClick={() => {
                          setSelectedProduct(product);
                          setShowStockModal(true);
                        }}
                      >
                        <RefreshCw className="w-4 h-4" />
                        Stock
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleToggleActive(product.id, product.isActive)}
                        className={product.isActive ? "text-red-600" : "text-green-600"}
                      >
                        {product.isActive ? <Archive className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
                      </Button>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Product Detail Modal */}
      {
        selectedProduct && !showStockModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={() => setSelectedProduct(null)}>
            <Card className="max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl" onClick={(e) => e.stopPropagation()}>
              <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-pink-50">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900">{selectedProduct.name}</h3>
                    <div className="flex items-center gap-3 mt-2">
                      {selectedProduct.category && (
                        <span className="flex items-center gap-1 text-sm text-purple-600">
                          <Tag className="w-3 h-3" />
                          {selectedProduct.category}
                        </span>
                      )}
                      {selectedProduct.sku && (
                        <span className="text-sm text-gray-500 font-mono">
                          SKU: {selectedProduct.sku}
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedProduct(null)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <XCircle className="w-6 h-6" />
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-6">
                {/* Description */}
                {selectedProduct.description && (
                  <div>
                    <h4 className="text-sm font-semibold text-gray-500 mb-2">Description</h4>
                    <p className="text-gray-700">{selectedProduct.description}</p>
                  </div>
                )}

                {/* Key Stats */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <div className="text-xs text-blue-600 font-medium mb-1">Current Stock</div>
                    <div className="text-2xl font-bold text-blue-900">{selectedProduct.currentStock}</div>
                  </div>
                  {selectedProduct.reorderLevel && (
                    <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
                      <div className="text-xs text-amber-600 font-medium mb-1">Reorder Level</div>
                      <div className="text-2xl font-bold text-amber-900">{selectedProduct.reorderLevel}</div>
                    </div>
                  )}
                  {selectedProduct.unitPrice && (
                    <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                      <div className="text-xs text-green-600 font-medium mb-1">Unit Price</div>
                      <div className="text-xl font-bold text-green-900">
                        <CurrencyDisplay amount={selectedProduct.unitPrice} />
                      </div>
                    </div>
                  )}
                  {selectedProduct.costPrice && (
                    <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                      <div className="text-xs text-purple-600 font-medium mb-1">Cost Price</div>
                      <div className="text-xl font-bold text-purple-900">
                        <CurrencyDisplay amount={selectedProduct.costPrice} />
                      </div>
                    </div>
                  )}
                </div>

                {/* Status */}
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <div className="text-sm font-semibold text-gray-700 mb-1">Product Status</div>
                    <div className="flex items-center gap-2">
                      {selectedProduct.isActive ? (
                        <span className="flex items-center gap-1 text-green-700 font-semibold">
                          <CheckCircle2 className="w-4 h-4" />
                          Active
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-gray-600 font-semibold">
                          <Archive className="w-4 h-4" />
                          Inactive
                        </span>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => handleToggleActive(selectedProduct.id, selectedProduct.isActive)}
                  >
                    {selectedProduct.isActive ? "Deactivate" : "Activate"}
                  </Button>
                </div>

                {/* Dates */}
                <div className="text-xs text-gray-500 space-y-1">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3 h-3" />
                    Created: {new Date(selectedProduct.createdAt).toLocaleDateString()}
                  </div>
                  <div className="flex items-center gap-2">
                    <Activity className="w-3 h-3" />
                    Updated: {new Date(selectedProduct.updatedAt).toLocaleDateString()}
                  </div>
                </div>
              </div>

              <div className="p-6 border-t border-gray-200 flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1 gap-2"
                  onClick={() => {
                    setShowStockModal(true);
                  }}
                >
                  <RefreshCw className="w-4 h-4" />
                  Update Stock
                </Button>
                <Button
                  variant="outline"
                  className="flex-1 gap-2"
                  onClick={() => {
                    // Edit functionality - would open edit modal
                    alert("Edit functionality coming soon");
                  }}
                >
                  <Edit className="w-4 h-4" />
                  Edit Product
                </Button>
              </div>
            </Card>
          </div>
        )
      }

      {/* Stock Update Modal */}
      {
        showStockModal && selectedProduct && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={() => setShowStockModal(false)}>
            <Card className="max-w-md w-full shadow-2xl" onClick={(e) => e.stopPropagation()}>
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-xl font-bold text-gray-900">Update Stock</h3>
                <p className="text-sm text-gray-500 mt-1">{selectedProduct.name}</p>
                <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                  <div className="text-sm text-blue-700">Current Stock</div>
                  <div className="text-3xl font-bold text-blue-900">{selectedProduct.currentStock}</div>
                </div>
              </div>

              <div className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    variant="outline"
                    className="h-20 flex flex-col gap-2 hover:bg-green-50 hover:border-green-400"
                    onClick={() => {
                      const quantity = prompt("Enter quantity to add:");
                      if (quantity) {
                        handleStockUpdate(selectedProduct.id, parseInt(quantity), "RESTOCK", "Manual restock");
                      }
                    }}
                  >
                    <TrendingUp className="w-6 h-6 text-green-600" />
                    <span className="text-sm font-semibold">Restock</span>
                  </Button>
                  <Button
                    variant="outline"
                    className="h-20 flex flex-col gap-2 hover:bg-blue-50 hover:border-blue-400"
                    onClick={() => {
                      const quantity = prompt("Enter adjustment (+/-) quantity:");
                      if (quantity) {
                        handleStockUpdate(selectedProduct.id, parseInt(quantity), "ADJUSTMENT", "Stock adjustment");
                      }
                    }}
                  >
                    <BarChart3 className="w-6 h-6 text-blue-600" />
                    <span className="text-sm font-semibold">Adjust</span>
                  </Button>
                  <Button
                    variant="outline"
                    className="h-20 flex flex-col gap-2 hover:bg-red-50 hover:border-red-400"
                    onClick={() => {
                      const quantity = prompt("Enter damaged quantity:");
                      if (quantity) {
                        handleStockUpdate(selectedProduct.id, -Math.abs(parseInt(quantity)), "DAMAGE", "Damaged stock");
                      }
                    }}
                  >
                    <AlertTriangle className="w-6 h-6 text-red-600" />
                    <span className="text-sm font-semibold">Damage</span>
                  </Button>
                  <Button
                    variant="outline"
                    className="h-20 flex flex-col gap-2 hover:bg-purple-50 hover:border-purple-400"
                    onClick={() => {
                      const quantity = prompt("Enter return quantity:");
                      if (quantity) {
                        handleStockUpdate(selectedProduct.id, parseInt(quantity), "RETURN", "Customer return");
                      }
                    }}
                  >
                    <RefreshCw className="w-6 h-6 text-purple-600" />
                    <span className="text-sm font-semibold">Return</span>
                  </Button>
                </div>
              </div>

              <div className="p-6 border-t border-gray-200">
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => setShowStockModal(false)}
                >
                  Cancel
                </Button>
              </div>
            </Card>
          </div>
        )
      }

      {/* Create Product Modal (Placeholder) */}
      {
        showCreateModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={() => setShowCreateModal(false)}>
            <Card className="max-w-md w-full shadow-2xl" onClick={(e) => e.stopPropagation()}>
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-xl font-bold text-gray-900">Add Product</h3>
                <p className="text-sm text-gray-500 mt-1">Contact admin to add new products</p>
              </div>
              <div className="p-6">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-900">
                    Product creation is currently managed by administrators to ensure data quality and consistency.
                    Please contact your administrator to add new products to your inventory.
                  </p>
                </div>
              </div>
              <div className="p-6 border-t border-gray-200">
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => setShowCreateModal(false)}
                >
                  Close
                </Button>
              </div>
            </Card>
          </div>
        )
      }
    </DashboardLayout >
  );
}

