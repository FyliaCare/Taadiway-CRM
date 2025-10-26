"use client";

import { DashboardLayout } from "@/components/dashboard/layout";
import { trpc } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
import { Plus, Search, Filter, Download, Mail, Phone, MapPin, Package, TrendingUp, Calendar, MoreVertical, Eye, Edit, Trash2, Star } from "lucide-react";
import { useState, useMemo } from "react";
import { AddClientForm } from "@/components/admin/AddClientForm";

export default function ClientsPage() {
  const [showAddForm, setShowAddForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  
  const { data: clients, isLoading, error, refetch } = trpc.client.getAll.useQuery();

  // Memoize filtered clients to avoid re-filtering on every render
  const filteredClients = useMemo(() => 
    clients?.filter((client) => {
      const matchesSearch =
        searchTerm === "" ||
        client.businessName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.user.email?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus =
        statusFilter === "all" || client.subscriptionStatus === statusFilter;

      return matchesSearch && matchesStatus;
    })
  , [clients, searchTerm, statusFilter]);

  // Memoize stats calculations
  const stats = useMemo(() => ({
    total: clients?.length || 0,
    active: clients?.filter((c) => c.subscriptionStatus === "ACTIVE").length || 0,
    trial: clients?.filter((c) => c.subscriptionStatus === "TRIAL").length || 0,
    expired: clients?.filter((c) => c.subscriptionStatus === "EXPIRED").length || 0,
    totalProducts: clients?.reduce((sum, c) => sum + c._count.products, 0) || 0,
    totalSales: clients?.reduce((sum, c) => sum + c._count.sales, 0) || 0,
  }), [clients]);

  if (error) {
    return (
      <DashboardLayout>
        <div className="rounded-lg border border-red-200 bg-red-50 p-8 text-center">
          <p className="text-red-800">
            {error.message || "Error loading clients. Please try again."}
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
            <p className="mt-4 text-muted-foreground">Loading clients...</p>
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
              Client Management
            </h1>
            <p className="mt-1 text-muted-foreground">
              Manage vendor clients, subscriptions, and track performance
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
            <Button onClick={() => setShowAddForm(true)} className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600">
              <Plus className="mr-2 h-4 w-4" />
              Add Client
            </Button>
          </div>
        </div>

        {/* Advanced Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-6">
          <div className="group relative overflow-hidden rounded-xl border bg-gradient-to-br from-white to-gray-50 p-4 shadow-sm transition-all hover:shadow-md">
            <div className="absolute right-0 top-0 h-20 w-20 rounded-full bg-gradient-to-br from-amber-400 to-orange-400 opacity-10 blur-2xl"></div>
            <div className="relative">
              <p className="text-xs font-medium text-muted-foreground">Total Clients</p>
              <p className="mt-2 text-3xl font-bold">{stats.total}</p>
              <div className="mt-1 flex items-center gap-1 text-xs text-green-600">
                <TrendingUp className="h-3 w-3" />
                <span>All time</span>
              </div>
            </div>
          </div>

          <div className="group relative overflow-hidden rounded-xl border bg-gradient-to-br from-green-50 to-white p-4 shadow-sm transition-all hover:shadow-md">
            <div className="absolute right-0 top-0 h-20 w-20 rounded-full bg-gradient-to-br from-green-400 to-green-600 opacity-10 blur-2xl"></div>
            <div className="relative">
              <p className="text-xs font-medium text-muted-foreground">Active</p>
              <p className="mt-2 text-3xl font-bold text-green-600">{stats.active}</p>
              <div className="mt-1 text-xs text-muted-foreground">
                {stats.total > 0 ? Math.round((stats.active / stats.total) * 100) : 0}% of total
              </div>
            </div>
          </div>

          <div className="group relative overflow-hidden rounded-xl border bg-gradient-to-br from-blue-50 to-white p-4 shadow-sm transition-all hover:shadow-md">
            <div className="absolute right-0 top-0 h-20 w-20 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 opacity-10 blur-2xl"></div>
            <div className="relative">
              <p className="text-xs font-medium text-muted-foreground">Trial</p>
              <p className="mt-2 text-3xl font-bold text-blue-600">{stats.trial}</p>
              <div className="mt-1 text-xs text-muted-foreground">
                {stats.total > 0 ? Math.round((stats.trial / stats.total) * 100) : 0}% of total
              </div>
            </div>
          </div>

          <div className="group relative overflow-hidden rounded-xl border bg-gradient-to-br from-red-50 to-white p-4 shadow-sm transition-all hover:shadow-md">
            <div className="absolute right-0 top-0 h-20 w-20 rounded-full bg-gradient-to-br from-red-400 to-red-600 opacity-10 blur-2xl"></div>
            <div className="relative">
              <p className="text-xs font-medium text-muted-foreground">Expired</p>
              <p className="mt-2 text-3xl font-bold text-red-600">{stats.expired}</p>
              <div className="mt-1 text-xs text-muted-foreground">
                Needs attention
              </div>
            </div>
          </div>

          <div className="group relative overflow-hidden rounded-xl border bg-gradient-to-br from-purple-50 to-white p-4 shadow-sm transition-all hover:shadow-md">
            <div className="absolute right-0 top-0 h-20 w-20 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 opacity-10 blur-2xl"></div>
            <div className="relative">
              <p className="text-xs font-medium text-muted-foreground">Products</p>
              <p className="mt-2 text-3xl font-bold text-purple-600">{stats.totalProducts}</p>
              <div className="mt-1 text-xs text-muted-foreground">
                Total catalog
              </div>
            </div>
          </div>

          <div className="group relative overflow-hidden rounded-xl border bg-gradient-to-br from-orange-50 to-white p-4 shadow-sm transition-all hover:shadow-md">
            <div className="absolute right-0 top-0 h-20 w-20 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 opacity-10 blur-2xl"></div>
            <div className="relative">
              <p className="text-xs font-medium text-muted-foreground">Sales</p>
              <p className="mt-2 text-3xl font-bold text-orange-600">{stats.totalSales}</p>
              <div className="mt-1 text-xs text-muted-foreground">
                Total deliveries
              </div>
            </div>
          </div>
        </div>

        {/* Filters & View Toggle */}
        <div className="flex flex-col gap-4 rounded-xl border bg-gradient-to-br from-white to-gray-50 p-4 shadow-sm md:flex-row md:items-center md:justify-between">
          <div className="flex flex-1 items-center gap-3 rounded-lg border bg-white px-4 py-2">
            <Search className="h-5 w-5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by business name, contact, or email..."
              className="flex-1 border-0 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 rounded-lg border bg-white px-3 py-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <select
                className="border-0 bg-transparent text-sm outline-none"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">All Status</option>
                <option value="ACTIVE">Active</option>
                <option value="TRIAL">Trial</option>
                <option value="EXPIRED">Expired</option>
                <option value="SUSPENDED">Suspended</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>
            <div className="flex rounded-lg border bg-white p-1">
              <button
                onClick={() => setViewMode("grid")}
                className={`rounded px-3 py-1 text-sm font-medium transition-colors ${
                  viewMode === "grid"
                    ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Grid
              </button>
              <button
                onClick={() => setViewMode("table")}
                className={`rounded px-3 py-1 text-sm font-medium transition-colors ${
                  viewMode === "table"
                    ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Table
              </button>
            </div>
          </div>
        </div>

        {/* Grid View */}
        {viewMode === "grid" && (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredClients?.map((client) => (
              <div
                key={client.id}
                className="group relative overflow-hidden rounded-xl border bg-gradient-to-br from-white to-gray-50 shadow-sm transition-all duration-300 hover:shadow-xl"
              >
                {/* Gradient background */}
                <div className="absolute right-0 top-0 h-32 w-32 rounded-full bg-gradient-to-br from-amber-400 to-orange-400 opacity-5 blur-3xl transition-all duration-500 group-hover:scale-150 group-hover:opacity-10"></div>
                
                {/* Header */}
                <div className="relative border-b bg-gradient-to-r from-gray-50 to-white p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-orange-500 text-lg font-bold text-white shadow-lg">
                        {client.businessName.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900">{client.businessName}</h3>
                        {client.businessType && (
                          <p className="text-xs text-muted-foreground">{client.businessType}</p>
                        )}
                      </div>
                    </div>
                    <button className="rounded-lg p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600">
                      <MoreVertical className="h-5 w-5" />
                    </button>
                  </div>
                  
                  {/* Status Badge */}
                  <div className="mt-4">
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${
                        client.subscriptionStatus === "ACTIVE"
                          ? "bg-green-100 text-green-800 dark:bg-green-950"
                          : client.subscriptionStatus === "TRIAL"
                          ? "bg-blue-100 text-blue-800 dark:bg-blue-950"
                          : client.subscriptionStatus === "EXPIRED"
                          ? "bg-red-100 text-red-800 dark:bg-red-950"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      <div className={`h-2 w-2 rounded-full ${
                        client.subscriptionStatus === "ACTIVE"
                          ? "bg-green-500"
                          : client.subscriptionStatus === "TRIAL"
                          ? "bg-blue-500"
                          : "bg-red-500"
                      }`}></div>
                      {client.subscriptionStatus}
                    </span>
                  </div>
                </div>

                {/* Body */}
                <div className="relative space-y-4 p-6">
                  {/* Contact Info */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-600">{client.user.email}</span>
                    </div>
                    {client.user.phone && (
                      <div className="flex items-center gap-2 text-sm">
                        <Phone className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-600">{client.user.phone}</span>
                      </div>
                    )}
                    {client.businessAddress && (
                      <div className="flex items-center gap-2 text-sm">
                        <MapPin className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-600 truncate">{client.businessAddress}</span>
                      </div>
                    )}
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-lg border bg-gradient-to-br from-purple-50 to-white p-3">
                      <div className="flex items-center gap-2">
                        <Package className="h-4 w-4 text-purple-600" />
                        <span className="text-xs text-muted-foreground">Products</span>
                      </div>
                      <p className="mt-1 text-xl font-bold text-purple-600">{client._count.products}</p>
                    </div>
                    <div className="rounded-lg border bg-gradient-to-br from-orange-50 to-white p-3">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-orange-600" />
                        <span className="text-xs text-muted-foreground">Sales</span>
                      </div>
                      <p className="mt-1 text-xl font-bold text-orange-600">{client._count.sales}</p>
                    </div>
                  </div>

                  {/* Subscription Info */}
                  {client.subscriptionEnd && (
                    <div className="flex items-center gap-2 rounded-lg bg-gray-50 p-3 text-sm">
                      <Calendar className="h-4 w-4 text-gray-500" />
                      <span className="text-gray-600">
                        Expires: {new Date(client.subscriptionEnd).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </div>

                {/* Footer Actions */}
                <div className="relative border-t bg-gray-50 p-4">
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1">
                      <Eye className="mr-2 h-4 w-4" />
                      View
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1">
                      <Edit className="mr-2 h-4 w-4" />
                      Edit
                    </Button>
                  </div>
                </div>

                {/* Bottom accent */}
                <div className="absolute bottom-0 left-0 h-1 w-0 bg-gradient-to-r from-amber-400 to-orange-500 transition-all duration-500 group-hover:w-full"></div>
              </div>
            ))}
          </div>
        )}

        {/* Table View */}
        {viewMode === "table" && (
          <div className="rounded-xl border bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b bg-gradient-to-r from-gray-50 to-white">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Business</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Contact</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Email</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Phone</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Status</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Products</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Sales</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Subscription</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filteredClients?.map((client) => (
                    <tr key={client.id} className="transition-colors hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-orange-500 text-sm font-bold text-white">
                            {client.businessName.substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{client.businessName}</p>
                            {client.businessType && (
                              <p className="text-xs text-muted-foreground">{client.businessType}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{client.user.name}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{client.user.email}</td>
                      <td className="px-6 py-4 text-sm">
                        <div className="space-y-1">
                          <p className="text-gray-600">{client.user.phone || "—"}</p>
                          {client.user.whatsappNumber && (
                            <p className="text-xs text-green-600">
                              WhatsApp: {client.user.whatsappNumber}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${
                            client.subscriptionStatus === "ACTIVE"
                              ? "bg-green-100 text-green-800"
                              : client.subscriptionStatus === "TRIAL"
                              ? "bg-blue-100 text-blue-800"
                              : client.subscriptionStatus === "EXPIRED"
                              ? "bg-red-100 text-red-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          <div className={`h-2 w-2 rounded-full ${
                            client.subscriptionStatus === "ACTIVE"
                              ? "bg-green-500"
                              : client.subscriptionStatus === "TRIAL"
                              ? "bg-blue-500"
                              : "bg-red-500"
                          }`}></div>
                          {client.subscriptionStatus}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center gap-1 rounded-full bg-purple-50 px-3 py-1 text-sm font-semibold text-purple-600">
                          <Package className="h-3 w-3" />
                          {client._count.products}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center gap-1 rounded-full bg-orange-50 px-3 py-1 text-sm font-semibold text-orange-600">
                          <TrendingUp className="h-3 w-3" />
                          {client._count.sales}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {client.subscriptionEnd
                          ? new Date(client.subscriptionEnd).toLocaleDateString()
                          : "—"}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Empty State */}
        {filteredClients && filteredClients.length === 0 && (
          <div className="rounded-xl border bg-gradient-to-br from-gray-50 to-white p-12 text-center shadow-sm">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-gray-100">
              <Search className="h-10 w-10 text-gray-400" />
            </div>
            <h3 className="mt-4 text-lg font-semibold text-gray-900">No clients found</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              {searchTerm || statusFilter !== "all"
                ? "Try adjusting your search or filter to find what you're looking for."
                : "Get started by adding your first client to the system."}
            </p>
            {!searchTerm && statusFilter === "all" && (
              <Button onClick={() => setShowAddForm(true)} className="mt-6 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600">
                <Plus className="mr-2 h-4 w-4" />
                Add Your First Client
              </Button>
            )}
          </div>
        )}

        {/* Add Client Form Modal */}
        {showAddForm && (
          <AddClientForm
            onClose={() => setShowAddForm(false)}
            onSuccess={() => {
              refetch();
              setShowAddForm(false);
            }}
          />
        )}
      </div>
    </DashboardLayout>
  );
}

