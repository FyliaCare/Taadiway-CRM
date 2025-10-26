"use client";

import { DashboardLayout } from "@/components/dashboard/layout";
import { trpc } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
import { 
  Bell, BellOff, Check, CheckCheck, Mail, Phone, 
  MessageSquare, Clock, CheckCircle2, XCircle, 
  AlertTriangle, DollarSign, Package, TrendingDown, 
  Calendar, Eye, X, Filter, Grid3x3, List, Store,
  Tag, FileText
} from "lucide-react";
import { useState, useMemo } from "react";

type NotificationType = "SALE_RECORDED" | "LOW_STOCK" | "SUBSCRIPTION_EXPIRING" | "SUBSCRIPTION_EXPIRED" | "PAYMENT_RECEIVED" | "PAYMENT_FAILED";
type NotificationStatus = "PENDING" | "SENT" | "FAILED" | "READ";

type TypeConfig = {
  color: string;
  bg: string;
  text: string;
  icon: any;
  label: string;
};

const TYPE_CONFIG: Record<NotificationType, TypeConfig> = {
  SALE_RECORDED: { color: "green", bg: "bg-green-100", text: "text-green-800", icon: DollarSign, label: "Sale Recorded" },
  LOW_STOCK: { color: "orange", bg: "bg-orange-100", text: "text-orange-800", icon: Package, label: "Low Stock" },
  SUBSCRIPTION_EXPIRING: { color: "amber", bg: "bg-amber-100", text: "text-amber-800", icon: Clock, label: "Subscription Expiring" },
  SUBSCRIPTION_EXPIRED: { color: "red", bg: "bg-red-100", text: "text-red-800", icon: XCircle, label: "Subscription Expired" },
  PAYMENT_RECEIVED: { color: "blue", bg: "bg-blue-100", text: "text-blue-800", icon: CheckCircle2, label: "Payment Received" },
  PAYMENT_FAILED: { color: "red", bg: "bg-red-100", text: "text-red-800", icon: AlertTriangle, label: "Payment Failed" },
};

const STATUS_CONFIG: Record<NotificationStatus, TypeConfig> = {
  PENDING: { color: "yellow", bg: "bg-yellow-100", text: "text-yellow-800", icon: Clock, label: "Pending" },
  SENT: { color: "green", bg: "bg-green-100", text: "text-green-800", icon: CheckCircle2, label: "Sent" },
  FAILED: { color: "red", bg: "bg-red-100", text: "text-red-800", icon: XCircle, label: "Failed" },
  READ: { color: "gray", bg: "bg-gray-100", text: "text-gray-800", icon: CheckCheck, label: "Read" },
};

export default function NotificationsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  const [viewingNotification, setViewingNotification] = useState<any>(null);
  const [showViewModal, setShowViewModal] = useState(false);

  const { data: notifications, isLoading, error, refetch } = trpc.notification.getMine.useQuery();
  const markAsReadMutation = trpc.notification.markAsRead.useMutation();
  const markAllAsReadMutation = trpc.notification.markAllAsRead.useMutation();

  // Memoize filtered notifications
  const filteredNotifications = useMemo(() => 
    (notifications || []).filter((notification: any) => {
      const matchesSearch =
        searchTerm === "" ||
        notification.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        notification.message.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesType =
        typeFilter === "all" || notification.type === typeFilter;

      const matchesStatus =
        statusFilter === "all" || notification.status === statusFilter;

      return matchesSearch && matchesType && matchesStatus;
    })
  , [notifications, searchTerm, typeFilter, statusFilter]);

  // Calculate stats
  const stats = useMemo(() => {
    const allNotifications = notifications || [];
    const unread = allNotifications.filter((n: any) => n.status !== "READ").length;
    const sent = allNotifications.filter((n: any) => n.status === "SENT").length;
    const pending = allNotifications.filter((n: any) => n.status === "PENDING").length;
    const failed = allNotifications.filter((n: any) => n.status === "FAILED").length;

    return { total: allNotifications.length, unread, sent, pending, failed };
  }, [notifications]);

  const handleMarkAsRead = async (id: string) => {
    await markAsReadMutation.mutateAsync({ id });
    refetch();
  };

  const handleMarkAllAsRead = async () => {
    await markAllAsReadMutation.mutateAsync();
    refetch();
  };

  if (error) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Notifications</h1>
            <p className="text-muted-foreground">View all system notifications</p>
          </div>
          <div className="rounded-lg border border-red-200 bg-red-50 p-8 text-center">
            <p className="text-red-800">Error loading notifications. Please try again.</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex h-[400px] items-center justify-center">
          <div className="text-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
            <p className="mt-4 text-muted-foreground">Loading notifications...</p>
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
            <h1 className="text-3xl font-bold tracking-tight">Notifications</h1>
            <p className="text-muted-foreground">
              Manage your system notifications and alerts
            </p>
          </div>
          <Button 
            className="bg-gradient-to-r from-amber-500 to-orange-600 text-white hover:from-amber-600 hover:to-orange-700"
            onClick={handleMarkAllAsRead}
            disabled={stats.unread === 0 || markAllAsReadMutation.isLoading}
          >
            <CheckCheck className="mr-2 h-4 w-4" />
            Mark All as Read
          </Button>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-6 md:grid-cols-4">
          {/* Total Notifications */}
          <div className="group relative overflow-hidden rounded-xl border bg-gradient-to-br from-blue-50 to-indigo-50 p-6 shadow-sm transition-all duration-300 hover:shadow-xl">
            <div className="absolute right-0 top-0 h-24 w-24 rounded-full bg-gradient-to-br from-blue-400 to-indigo-400 opacity-10 blur-2xl transition-all duration-500 group-hover:scale-150"></div>
            <div className="relative">
              <div className="flex items-center justify-between">
                <div className="rounded-lg bg-blue-100 p-3">
                  <Bell className="h-6 w-6 text-blue-600" />
                </div>
              </div>
              <div className="mt-4">
                <p className="text-sm font-medium text-blue-900/70">Total</p>
                <p className="mt-1 text-3xl font-bold text-blue-900">{stats.total}</p>
              </div>
            </div>
          </div>

          {/* Unread */}
          <div className="group relative overflow-hidden rounded-xl border bg-gradient-to-br from-orange-50 to-amber-50 p-6 shadow-sm transition-all duration-300 hover:shadow-xl">
            <div className="absolute right-0 top-0 h-24 w-24 rounded-full bg-gradient-to-br from-orange-400 to-amber-400 opacity-10 blur-2xl transition-all duration-500 group-hover:scale-150"></div>
            <div className="relative">
              <div className="flex items-center justify-between">
                <div className="rounded-lg bg-orange-100 p-3">
                  <BellOff className="h-6 w-6 text-orange-600" />
                </div>
              </div>
              <div className="mt-4">
                <p className="text-sm font-medium text-orange-900/70">Unread</p>
                <p className="mt-1 text-3xl font-bold text-orange-900">{stats.unread}</p>
              </div>
            </div>
          </div>

          {/* Sent */}
          <div className="group relative overflow-hidden rounded-xl border bg-gradient-to-br from-green-50 to-emerald-50 p-6 shadow-sm transition-all duration-300 hover:shadow-xl">
            <div className="absolute right-0 top-0 h-24 w-24 rounded-full bg-gradient-to-br from-green-400 to-emerald-400 opacity-10 blur-2xl transition-all duration-500 group-hover:scale-150"></div>
            <div className="relative">
              <div className="flex items-center justify-between">
                <div className="rounded-lg bg-green-100 p-3">
                  <CheckCircle2 className="h-6 w-6 text-green-600" />
                </div>
              </div>
              <div className="mt-4">
                <p className="text-sm font-medium text-green-900/70">Sent</p>
                <p className="mt-1 text-3xl font-bold text-green-900">{stats.sent}</p>
              </div>
            </div>
          </div>

          {/* Failed */}
          <div className="group relative overflow-hidden rounded-xl border bg-gradient-to-br from-red-50 to-rose-50 p-6 shadow-sm transition-all duration-300 hover:shadow-xl">
            <div className="absolute right-0 top-0 h-24 w-24 rounded-full bg-gradient-to-br from-red-400 to-rose-400 opacity-10 blur-2xl transition-all duration-500 group-hover:scale-150"></div>
            <div className="relative">
              <div className="flex items-center justify-between">
                <div className="rounded-lg bg-red-100 p-3">
                  <XCircle className="h-6 w-6 text-red-600" />
                </div>
              </div>
              <div className="mt-4">
                <p className="text-sm font-medium text-red-900/70">Failed</p>
                <p className="mt-1 text-3xl font-bold text-red-900">{stats.failed}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-4 rounded-xl border bg-white p-4 shadow-sm">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Bell className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search notifications..."
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
            <option value="SALE_RECORDED">Sale Recorded</option>
            <option value="LOW_STOCK">Low Stock</option>
            <option value="SUBSCRIPTION_EXPIRING">Subscription Expiring</option>
            <option value="SUBSCRIPTION_EXPIRED">Subscription Expired</option>
            <option value="PAYMENT_RECEIVED">Payment Received</option>
            <option value="PAYMENT_FAILED">Payment Failed</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border bg-white px-4 py-2 text-sm focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
          >
            <option value="all">All Status</option>
            <option value="PENDING">Pending</option>
            <option value="SENT">Sent</option>
            <option value="FAILED">Failed</option>
            <option value="READ">Read</option>
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
          {(searchTerm || typeFilter !== "all" || statusFilter !== "all") && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSearchTerm("");
                setTypeFilter("all");
                setStatusFilter("all");
              }}
            >
              Clear Filters
            </Button>
          )}
        </div>

        {/* Notifications Grid/Table */}
        {viewMode === "grid" ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredNotifications.map((notification: any) => {
              const typeConfig = TYPE_CONFIG[notification.type as NotificationType];
              const statusConfig = STATUS_CONFIG[notification.status as NotificationStatus];
              const TypeIcon = typeConfig?.icon || Bell;
              const isUnread = notification.status !== "READ";

              return (
                <div
                  key={notification.id}
                  className={`group relative overflow-hidden rounded-xl border bg-gradient-to-br from-white to-gray-50 shadow-sm transition-all duration-300 hover:shadow-xl ${isUnread ? 'border-l-4 border-l-amber-500' : ''}`}
                >
                  {/* Gradient background */}
                  <div className="absolute right-0 top-0 h-32 w-32 rounded-full bg-gradient-to-br from-amber-400 to-orange-400 opacity-5 blur-3xl transition-all duration-500 group-hover:scale-150 group-hover:opacity-10"></div>
                  
                  {/* Header */}
                  <div className="relative border-b bg-gradient-to-r from-gray-50 to-white p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <TypeIcon className="h-5 w-5 text-amber-600" />
                          <h3 className="font-bold text-gray-900">{notification.title}</h3>
                        </div>
                        {isUnread && (
                          <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800">
                            <div className="h-2 w-2 rounded-full bg-amber-500"></div>
                            New
                          </span>
                        )}
                      </div>
                      <span className={`flex items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold ${typeConfig?.bg} ${typeConfig?.text}`}>
                        <Tag className="h-3 w-3" />
                        {typeConfig?.label}
                      </span>
                    </div>
                  </div>

                  {/* Body */}
                  <div className="relative space-y-4 p-6">
                    {/* Message */}
                    <p className="text-sm text-gray-700 line-clamp-3">{notification.message}</p>

                    {/* Channels */}
                    <div className="flex flex-wrap gap-2">
                      {notification.channels.map((channel: string) => {
                        const channelIcon = 
                          channel === "EMAIL" ? Mail : 
                          channel === "WHATSAPP" ? MessageSquare : 
                          Phone;
                        const ChannelIcon = channelIcon;
                        
                        return (
                          <span
                            key={channel}
                            className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700"
                          >
                            <ChannelIcon className="h-3 w-3" />
                            {channel}
                          </span>
                        );
                      })}
                    </div>

                    {/* Status */}
                    <div className="rounded-lg bg-gray-50 p-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-gray-600">Status</span>
                        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold ${statusConfig?.bg} ${statusConfig?.text}`}>
                          {statusConfig?.label}
                        </span>
                      </div>
                    </div>

                    {/* Date */}
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      {new Date(notification.createdAt).toLocaleDateString()} at {new Date(notification.createdAt).toLocaleTimeString()}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <Button 
                        className="flex-1 bg-gradient-to-r from-amber-500 to-orange-600 text-white hover:from-amber-600 hover:to-orange-700"
                        size="sm"
                        onClick={() => {
                          setViewingNotification(notification);
                          setShowViewModal(true);
                        }}
                      >
                        <Eye className="mr-2 h-4 w-4" />
                        View
                      </Button>
                      {isUnread && (
                        <Button 
                          variant="outline"
                          size="sm"
                          onClick={() => handleMarkAsRead(notification.id)}
                          disabled={markAsReadMutation.isLoading}
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
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
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Type</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Title</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Message</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Channels</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Status</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Date</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filteredNotifications.map((notification: any) => {
                    const typeConfig = TYPE_CONFIG[notification.type as NotificationType];
                    const statusConfig = STATUS_CONFIG[notification.status as NotificationStatus];
                    const TypeIcon = typeConfig?.icon || Bell;
                    const isUnread = notification.status !== "READ";

                    return (
                      <tr key={notification.id} className={`transition-colors hover:bg-gray-50 ${isUnread ? 'bg-amber-50/30' : ''}`}>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${typeConfig?.bg} ${typeConfig?.text}`}>
                            <TypeIcon className="h-3 w-3" />
                            {typeConfig?.label}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-gray-900">{notification.title}</span>
                            {isUnread && (
                              <div className="h-2 w-2 rounded-full bg-amber-500"></div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <p className="max-w-md truncate text-sm text-gray-600">{notification.message}</p>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex gap-1">
                            {notification.channels.map((channel: string) => {
                              const channelIcon = 
                                channel === "EMAIL" ? Mail : 
                                channel === "WHATSAPP" ? MessageSquare : 
                                Phone;
                              const ChannelIcon = channelIcon;
                              
                              return (
                                <span
                                  key={channel}
                                  className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700"
                                  title={channel}
                                >
                                  <ChannelIcon className="h-3 w-3" />
                                </span>
                              );
                            })}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${statusConfig?.bg} ${statusConfig?.text}`}>
                            {statusConfig?.label}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {new Date(notification.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex gap-2">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => {
                                setViewingNotification(notification);
                                setShowViewModal(true);
                              }}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            {isUnread && (
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleMarkAsRead(notification.id)}
                                disabled={markAsReadMutation.isLoading}
                              >
                                <Check className="h-4 w-4" />
                              </Button>
                            )}
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
        {filteredNotifications.length === 0 && (
          <div className="rounded-xl border bg-gradient-to-br from-gray-50 to-white p-12 text-center shadow-sm">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-gray-100">
              <Bell className="h-10 w-10 text-gray-400" />
            </div>
            <h3 className="mt-4 text-lg font-semibold text-gray-900">No notifications found</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              {searchTerm || typeFilter !== "all" || statusFilter !== "all"
                ? "Try adjusting your filters"
                : "You're all caught up!"}
            </p>
          </div>
        )}
      </div>

      {/* View Notification Modal */}
      {showViewModal && viewingNotification && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="relative w-full max-w-2xl rounded-xl border bg-white shadow-2xl">
            {/* Header */}
            <div className="border-b bg-gradient-to-r from-blue-50 to-indigo-50 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Notification Details</h2>
                  <p className="mt-1 text-sm text-muted-foreground">ID: #{viewingNotification.id.slice(0, 12)}</p>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    setShowViewModal(false);
                    setViewingNotification(null);
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
                    const typeConfig = TYPE_CONFIG[viewingNotification.type as NotificationType];
                    const TypeIcon = typeConfig?.icon || Bell;

                    return (
                      <span className={`inline-flex items-center gap-2 rounded-full px-6 py-3 text-lg font-semibold ${typeConfig?.bg} ${typeConfig?.text}`}>
                        <TypeIcon className="h-6 w-6" />
                        {typeConfig?.label}
                      </span>
                    );
                  })()}
                </div>

                {/* Title */}
                <div className="rounded-lg border-2 border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 p-4">
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-amber-100 p-3">
                      <FileText className="h-6 w-6 text-amber-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-amber-900/70">Title</p>
                      <p className="text-lg font-bold text-amber-900">{viewingNotification.title}</p>
                    </div>
                  </div>
                </div>

                {/* Message */}
                <div className="rounded-lg border bg-gray-50 p-4">
                  <p className="text-sm font-medium text-gray-600 mb-2">Message</p>
                  <p className="text-gray-900">{viewingNotification.message}</p>
                </div>

                {/* Channels */}
                <div className="rounded-lg border bg-blue-50 p-4">
                  <p className="text-sm font-medium text-blue-900 mb-3">Delivery Channels</p>
                  <div className="flex flex-wrap gap-3">
                    {viewingNotification.channels.map((channel: string) => {
                      const channelIcon = 
                        channel === "EMAIL" ? Mail : 
                        channel === "WHATSAPP" ? MessageSquare : 
                        Phone;
                      const ChannelIcon = channelIcon;
                      
                      return (
                        <div
                          key={channel}
                          className="flex items-center gap-2 rounded-lg bg-white px-4 py-2 shadow-sm"
                        >
                          <ChannelIcon className="h-5 w-5 text-blue-600" />
                          <span className="font-medium text-blue-900">{channel}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Status */}
                <div className="rounded-lg border bg-gray-50 p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-600">Current Status</span>
                    {(() => {
                      const statusConfig = STATUS_CONFIG[viewingNotification.status as NotificationStatus];
                      const StatusIcon = statusConfig?.icon;

                      return (
                        <span className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold ${statusConfig?.bg} ${statusConfig?.text}`}>
                          <StatusIcon className="h-4 w-4" />
                          {statusConfig?.label}
                        </span>
                      );
                    })()}
                  </div>
                </div>

                {/* Metadata */}
                <div className="rounded-lg border bg-gray-50 p-4">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-gray-600" />
                      <div>
                        <p className="text-xs text-gray-600">Created At</p>
                        <p className="text-sm font-medium text-gray-900">
                          {new Date(viewingNotification.createdAt).toLocaleDateString()} at {new Date(viewingNotification.createdAt).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                    {viewingNotification.sentAt && (
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                        <div>
                          <p className="text-xs text-gray-600">Sent At</p>
                          <p className="text-sm font-medium text-gray-900">
                            {new Date(viewingNotification.sentAt).toLocaleDateString()} at {new Date(viewingNotification.sentAt).toLocaleTimeString()}
                          </p>
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
                {viewingNotification.status !== "READ" && (
                  <Button 
                    className="bg-gradient-to-r from-amber-500 to-orange-600 text-white hover:from-amber-600 hover:to-orange-700"
                    onClick={async () => {
                      await handleMarkAsRead(viewingNotification.id);
                      setShowViewModal(false);
                      setViewingNotification(null);
                    }}
                    disabled={markAsReadMutation.isLoading}
                  >
                    <Check className="mr-2 h-4 w-4" />
                    Mark as Read
                  </Button>
                )}
                <Button 
                  variant="outline"
                  onClick={() => {
                    setShowViewModal(false);
                    setViewingNotification(null);
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
