"use client";

import { DashboardLayout } from "@/components/dashboard/layout";
import { CurrencyDisplay } from "@/components/dashboard";
import { trpc } from "@/lib/trpc/client";
import { useState } from "react";
import {
  Package,
  Truck,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Plus,
  Eye,
  Filter,
  Calendar as CalendarIcon,
  MapPin,
  Phone,
  User,
  CreditCard
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

type DeliveryStatus = "PENDING_APPROVAL" | "APPROVED" | "REJECTED" | "SCHEDULED" | "OUT_FOR_DELIVERY" | "DELIVERED" | "FAILED" | "CANCELLED";

export default function DeliveryRequestsPage() {
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedRequest, setSelectedRequest] = useState<any>(null);

  const { data: requests, isLoading, refetch } = trpc.deliveryRequest.getMyRequests.useQuery({
    page: currentPage,
    limit: 10,
    status: selectedStatus !== "all" ? (selectedStatus as DeliveryStatus) : undefined
  });

  const cancelMutation = trpc.deliveryRequest.cancel.useMutation({
    onSuccess: () => {
      // Refetch the list after cancellation
      refetch();
      setSelectedRequest(null);
    }
  });

  const getStatusConfig = (status: string) => {
    const configs: Record<string, { color: string; bg: string; icon: any; label: string }> = {
      PENDING_APPROVAL: { color: "text-yellow-700", bg: "bg-yellow-100", icon: Clock, label: "Pending Approval" },
      APPROVED: { color: "text-green-700", bg: "bg-green-100", icon: CheckCircle, label: "Approved" },
      REJECTED: { color: "text-red-700", bg: "bg-red-100", icon: XCircle, label: "Rejected" },
      SCHEDULED: { color: "text-blue-700", bg: "bg-blue-100", icon: CalendarIcon, label: "Scheduled" },
      OUT_FOR_DELIVERY: { color: "text-purple-700", bg: "bg-purple-100", icon: Truck, label: "Out for Delivery" },
      DELIVERED: { color: "text-green-700", bg: "bg-green-100", icon: CheckCircle, label: "Delivered" },
      FAILED: { color: "text-red-700", bg: "bg-red-100", icon: XCircle, label: "Failed" },
      CANCELLED: { color: "text-gray-700", bg: "bg-gray-100", icon: XCircle, label: "Cancelled" }
    };
    return configs[status] || configs.PENDING_APPROVAL;
  };

  const getPaymentMethodLabel = (method: string) => {
    const labels: Record<string, string> = {
      PAYMENT_BEFORE_DELIVERY: "Payment Before Delivery",
      PAYMENT_ON_DELIVERY: "Payment On Delivery",
      BANK_TRANSFER: "Bank Transfer",
      CARD: "Card",
      CASH: "Cash",
      MOBILE_MONEY: "Mobile Money"
    };
    return labels[method] || method;
  };

  const statusCounts = {
    all: requests?.pagination.total || 0,
    PENDING_APPROVAL: 0,
    APPROVED: 0,
    SCHEDULED: 0,
    OUT_FOR_DELIVERY: 0,
    DELIVERED: 0
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Delivery Requests
            </h1>
            <p className="text-muted-foreground mt-1">
              Create and track delivery authorization requests
            </p>
          </div>
          <Link href="/dashboard/delivery-requests/new">
            <Button className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600">
              <Plus className="mr-2 h-4 w-4" />
              New Request
            </Button>
          </Link>
        </div>

        {/* Status Filter Tabs */}
        <div className="border-b">
          <div className="flex gap-6 overflow-x-auto">
            {[
              { key: "all", label: "All Requests", count: statusCounts.all },
              { key: "PENDING_APPROVAL", label: "Pending", count: statusCounts.PENDING_APPROVAL },
              { key: "APPROVED", label: "Approved", count: statusCounts.APPROVED },
              { key: "SCHEDULED", label: "Scheduled", count: statusCounts.SCHEDULED },
              { key: "OUT_FOR_DELIVERY", label: "In Transit", count: statusCounts.OUT_FOR_DELIVERY },
              { key: "DELIVERED", label: "Delivered", count: statusCounts.DELIVERED }
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => {
                  setSelectedStatus(tab.key);
                  setCurrentPage(1);
                }}
                className={`pb-3 px-1 border-b-2 transition-colors whitespace-nowrap ${selectedStatus === tab.key
                    ? "border-blue-600 text-blue-600 font-semibold"
                    : "border-transparent text-gray-600 hover:text-gray-900"
                  }`}
              >
                {tab.label}
                <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${selectedStatus === tab.key ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-600"
                  }`}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Requests List */}
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-gray-200 rounded-xl animate-pulse"></div>
            ))}
          </div>
        ) : requests && requests.requests.length > 0 ? (
          <div className="space-y-4">
            {requests.requests.map((request: any) => {
              const statusConfig = getStatusConfig(request.status);
              const StatusIcon = statusConfig.icon;

              return (
                <div
                  key={request.id}
                  className="rounded-xl border bg-white shadow-sm hover:shadow-md transition-all overflow-hidden"
                >
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {request.requestNumber}
                          </h3>
                          <span className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${statusConfig.bg} ${statusConfig.color}`}>
                            <StatusIcon className="h-3.5 w-3.5" />
                            {statusConfig.label}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div className="flex items-center gap-2 text-gray-600">
                            <User className="h-4 w-4" />
                            <span>{request.customerName}</span>
                          </div>
                          <div className="flex items-center gap-2 text-gray-600">
                            <Phone className="h-4 w-4" />
                            <span>{request.customerPhone}</span>
                          </div>
                          <div className="flex items-center gap-2 text-gray-600">
                            <CreditCard className="h-4 w-4" />
                            <span>{getPaymentMethodLabel(request.paymentMethod)}</span>
                          </div>
                          <div className="flex items-center gap-2 text-gray-600">
                            <Package className="h-4 w-4" />
                            <span>{request.items?.length || 0} items</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right ml-4">
                        <p className="text-2xl font-bold text-gray-900">
                          <CurrencyDisplay amount={request.totalAmount} />
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(request.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    {/* Delivery Address */}
                    <div className="flex items-start gap-2 text-sm text-gray-600 mb-4 p-3 bg-gray-50 rounded-lg">
                      <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
                      <p>{request.deliveryAddress}</p>
                    </div>

                    {/* Items Preview */}
                    {request.items && request.items.length > 0 && (
                      <div className="mb-4">
                        <p className="text-sm font-medium text-gray-700 mb-2">Items:</p>
                        <div className="flex flex-wrap gap-2">
                          {request.items.slice(0, 3).map((item: any, index: number) => (
                            <span
                              key={index}
                              className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium"
                            >
                              {item.product?.name || 'Product'} × {item.quantity}
                            </span>
                          ))}
                          {request.items.length > 3 && (
                            <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-medium">
                              +{request.items.length - 3} more
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Scheduled Date */}
                    {request.scheduledDate && (
                      <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
                        <CalendarIcon className="h-4 w-4" />
                        <span>
                          Scheduled: {new Date(request.scheduledDate).toLocaleDateString()}
                          {request.preferredTime && ` (${request.preferredTime})`}
                        </span>
                      </div>
                    )}

                    {/* Special Instructions */}
                    {request.specialInstructions && (
                      <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                        <p className="text-xs font-semibold text-amber-900 mb-1">Special Instructions:</p>
                        <p className="text-sm text-amber-800">{request.specialInstructions}</p>
                      </div>
                    )}

                    {/* Rejection Reason */}
                    {request.status === "REJECTED" && request.rejectionReason && (
                      <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-xs font-semibold text-red-900 mb-1">Rejection Reason:</p>
                        <p className="text-sm text-red-800">{request.rejectionReason}</p>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center gap-3 pt-4 border-t">
                      <button
                        onClick={() => setSelectedRequest(request)}
                        className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium text-gray-700 transition-colors"
                      >
                        <Eye className="h-4 w-4" />
                        View Details
                      </button>

                      {(request.status === "PENDING_APPROVAL" || request.status === "APPROVED" || request.status === "SCHEDULED") && (
                        <button
                          onClick={() => {
                            if (confirm("Are you sure you want to cancel this delivery request?")) {
                              cancelMutation.mutate({ id: request.id });
                            }
                          }}
                          disabled={cancelMutation.isLoading}
                          className="flex items-center gap-2 px-4 py-2 bg-red-100 hover:bg-red-200 rounded-lg text-sm font-medium text-red-700 transition-colors disabled:opacity-50"
                        >
                          <XCircle className="h-4 w-4" />
                          Cancel Request
                        </button>
                      )}

                      {request.status === "DELIVERED" && (
                        <Link
                          href={`/dashboard/invoices/${request.id}`}
                          className="flex items-center gap-2 px-4 py-2 bg-green-100 hover:bg-green-200 rounded-lg text-sm font-medium text-green-700 transition-colors"
                        >
                          <CheckCircle className="h-4 w-4" />
                          View Invoice
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Pagination */}
            {requests.pagination.totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 pt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <span className="text-sm text-gray-600">
                  Page {currentPage} of {requests.pagination.totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.min(requests.pagination.totalPages, p + 1))}
                  disabled={currentPage === requests.pagination.totalPages}
                >
                  Next
                </Button>
              </div>
            )}
          </div>
        ) : (
          <div className="rounded-xl border-2 border-dashed bg-gray-50 p-12 text-center">
            <Truck className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No delivery requests yet
            </h3>
            <p className="text-gray-600 mb-6">
              Create your first delivery request to get started with order management
            </p>
            <Link href="/dashboard/delivery-requests/new">
              <Button className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600">
                <Plus className="mr-2 h-4 w-4" />
                Create First Request
              </Button>
            </Link>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selectedRequest && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
          onClick={() => setSelectedRequest(null)}
        >
          <div
            className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">Request Details</h2>
                <button
                  onClick={() => setSelectedRequest(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle className="h-6 w-6" />
                </button>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <p className="text-sm font-medium text-gray-500">Request Number</p>
                <p className="text-lg font-semibold">{selectedRequest.requestNumber}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Status</p>
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-semibold mt-1 ${getStatusConfig(selectedRequest.status).bg} ${getStatusConfig(selectedRequest.status).color}`}>
                  {getStatusConfig(selectedRequest.status).label}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">Customer Name</p>
                  <p className="font-medium">{selectedRequest.customerName}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Phone</p>
                  <p className="font-medium">{selectedRequest.customerPhone}</p>
                </div>
              </div>
              {selectedRequest.customerEmail && (
                <div>
                  <p className="text-sm font-medium text-gray-500">Email</p>
                  <p className="font-medium">{selectedRequest.customerEmail}</p>
                </div>
              )}
              <div>
                <p className="text-sm font-medium text-gray-500">Delivery Address</p>
                <p className="font-medium">{selectedRequest.deliveryAddress}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">Payment Method</p>
                  <p className="font-medium">{getPaymentMethodLabel(selectedRequest.paymentMethod)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Total Amount</p>
                  <p className="text-xl font-bold text-green-600">
                    <CurrencyDisplay amount={selectedRequest.totalAmount} />
                  </p>
                </div>
              </div>
              {selectedRequest.items && selectedRequest.items.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-2">Items</p>
                  <div className="space-y-2">
                    {selectedRequest.items.map((item: any, index: number) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium">{item.product?.name || 'Product'}</p>
                          <p className="text-sm text-gray-600">Quantity: {item.quantity}</p>
                        </div>
                        <p className="font-semibold">
                          <CurrencyDisplay amount={item.totalPrice} />
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <div className="pt-4 border-t">
                <Button
                  onClick={() => setSelectedRequest(null)}
                  variant="outline"
                  className="w-full"
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
