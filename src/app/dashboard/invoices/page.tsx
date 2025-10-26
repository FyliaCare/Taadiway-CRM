"use client";

import { DashboardLayout } from "@/components/dashboard/layout";
import { CurrencyDisplay } from "@/components/dashboard";
import { trpc } from "@/lib/trpc/client";
import { useState } from "react";
import {
    FileText,
    Download,
    Mail,
    Eye,
    Receipt,
    Filter,
    Search,
    ChevronLeft,
    ChevronRight,
    CheckCircle2,
    Clock,
    XCircle,
    Calendar,
    DollarSign,
    Printer,
    Send,
    Plus,
    TrendingUp,
    Package
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";

const STATUS_CONFIG = {
    DRAFT: {
        label: "Draft",
        color: "bg-gray-100 text-gray-800 border-gray-300",
        icon: Clock,
    },
    SENT: {
        label: "Sent",
        color: "bg-blue-100 text-blue-800 border-blue-300",
        icon: Send,
    },
    PAID: {
        label: "Paid",
        color: "bg-green-100 text-green-800 border-green-300",
        icon: CheckCircle2,
    },
    OVERDUE: {
        label: "Overdue",
        color: "bg-red-100 text-red-800 border-red-300",
        icon: XCircle,
    },
    CANCELLED: {
        label: "Cancelled",
        color: "bg-gray-100 text-gray-600 border-gray-300",
        icon: XCircle,
    },
};

export default function InvoicesPage() {
    const [page, setPage] = useState(1);
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState<string>("all");
    const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
    const [showReceiptModal, setShowReceiptModal] = useState(false);

    const { data: invoices, isLoading, refetch } = trpc.invoice.list.useQuery({
        page,
        limit: 10,
        status: statusFilter !== "all" ? (statusFilter as any) : undefined,
    });

    const { data: receipts } = trpc.invoice.listReceipts.useQuery({
        page: 1,
        limit: 5,
    });

    const generateReceiptMutation = trpc.invoice.generateReceipt.useMutation({
        onSuccess: () => {
            refetch();
            setShowReceiptModal(false);
            setSelectedInvoice(null);
        },
    });

    const updateStatusMutation = trpc.invoice.updateStatus.useMutation({
        onSuccess: () => {
            refetch();
            setSelectedInvoice(null);
        },
    });

    const handleGenerateReceipt = (invoiceId: string, paymentMethod: string) => {
        const invoice = invoices?.invoices.find(inv => inv.id === invoiceId);
        if (!invoice) return;

        generateReceiptMutation.mutate({
            invoiceId,
            paymentMethod: paymentMethod as "CASH" | "BANK_TRANSFER" | "CARD" | "MOBILE_MONEY" | "PAYMENT_ON_DELIVERY" | "PAYMENT_BEFORE_DELIVERY",
            amountPaid: invoice.totalAmount,
            transactionReference: `PAY-${Date.now()}`,
        });
    };

    const handleDownloadPdf = (invoiceId: string) => {
        // In a real app, this would trigger PDF generation
        window.open(`/api/invoices/${invoiceId}/pdf`, '_blank');
    };

    const handleSendEmail = (invoiceId: string) => {
        // In a real app, this would send the invoice via email
        updateStatusMutation.mutate({
            id: invoiceId,
            status: "SENT",
        });
    };

    // Calculate stats
    const stats = {
        total: invoices?.pagination.total || 0,
        paid: invoices?.invoices.filter(i => i.status === 'PAID').length || 0,
        pending: invoices?.invoices.filter(i => i.status === 'SENT').length || 0,
        overdue: invoices?.invoices.filter(i => i.status === 'OVERDUE').length || 0,
        totalAmount: invoices?.invoices.reduce((sum, i) => sum + i.totalAmount, 0) || 0,
        paidAmount: invoices?.invoices.filter(i => i.status === 'PAID').reduce((sum, i) => sum + i.totalAmount, 0) || 0,
    };

    return (
        <DashboardLayout>
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 p-8">
                <div className="max-w-7xl mx-auto space-y-8">
                    {/* Header */}
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div>
                            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                                Invoices & Receipts
                            </h1>
                            <p className="text-gray-600 mt-1">Manage invoices, generate receipts, and track payments</p>
                        </div>
                        <div className="flex gap-3">
                            <Link href="/dashboard/delivery-requests/new">
                                <Button className="gap-2 bg-gradient-to-r from-blue-600 to-indigo-600">
                                    <Plus className="w-4 h-4" />
                                    New Invoice
                                </Button>
                            </Link>
                        </div>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <Card className="p-6 bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg">
                            <div className="flex items-start justify-between mb-4">
                                <div>
                                    <p className="text-blue-100 text-sm font-medium">Total Invoices</p>
                                    <p className="text-4xl font-bold mt-2">{stats.total}</p>
                                </div>
                                <div className="bg-white/20 p-3 rounded-lg">
                                    <FileText className="w-6 h-6" />
                                </div>
                            </div>
                            <p className="text-blue-100 text-sm">
                                <CurrencyDisplay amount={stats.totalAmount} />
                            </p>
                        </Card>

                        <Card className="p-6 bg-gradient-to-br from-green-500 to-emerald-600 text-white shadow-lg">
                            <div className="flex items-start justify-between mb-4">
                                <div>
                                    <p className="text-green-100 text-sm font-medium">Paid</p>
                                    <p className="text-4xl font-bold mt-2">{stats.paid}</p>
                                </div>
                                <div className="bg-white/20 p-3 rounded-lg">
                                    <CheckCircle2 className="w-6 h-6" />
                                </div>
                            </div>
                            <p className="text-green-100 text-sm">
                                <CurrencyDisplay amount={stats.paidAmount} />
                            </p>
                        </Card>

                        <Card className="p-6 bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-lg">
                            <div className="flex items-start justify-between mb-4">
                                <div>
                                    <p className="text-amber-100 text-sm font-medium">Pending</p>
                                    <p className="text-4xl font-bold mt-2">{stats.pending}</p>
                                </div>
                                <div className="bg-white/20 p-3 rounded-lg">
                                    <Clock className="w-6 h-6" />
                                </div>
                            </div>
                            <p className="text-amber-100 text-sm">Awaiting payment</p>
                        </Card>

                        <Card className="p-6 bg-gradient-to-br from-red-500 to-rose-600 text-white shadow-lg">
                            <div className="flex items-start justify-between mb-4">
                                <div>
                                    <p className="text-red-100 text-sm font-medium">Overdue</p>
                                    <p className="text-4xl font-bold mt-2">{stats.overdue}</p>
                                </div>
                                <div className="bg-white/20 p-3 rounded-lg">
                                    <XCircle className="w-6 h-6" />
                                </div>
                            </div>
                            <p className="text-red-100 text-sm">Requires attention</p>
                        </Card>
                    </div>

                    {/* Filters & Search */}
                    <Card className="p-6 shadow-lg">
                        <div className="flex flex-col md:flex-row gap-4">
                            <div className="flex-1">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                                    <Input
                                        placeholder="Search by invoice number, customer name..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="pl-10"
                                    />
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <Button
                                    variant={statusFilter === "all" ? "default" : "outline"}
                                    onClick={() => setStatusFilter("all")}
                                    size="sm"
                                >
                                    All
                                </Button>
                                <Button
                                    variant={statusFilter === "DRAFT" ? "default" : "outline"}
                                    onClick={() => setStatusFilter("DRAFT")}
                                    size="sm"
                                >
                                    Draft
                                </Button>
                                <Button
                                    variant={statusFilter === "SENT" ? "default" : "outline"}
                                    onClick={() => setStatusFilter("SENT")}
                                    size="sm"
                                >
                                    Sent
                                </Button>
                                <Button
                                    variant={statusFilter === "PAID" ? "default" : "outline"}
                                    onClick={() => setStatusFilter("PAID")}
                                    size="sm"
                                >
                                    Paid
                                </Button>
                                <Button
                                    variant={statusFilter === "OVERDUE" ? "default" : "outline"}
                                    onClick={() => setStatusFilter("OVERDUE")}
                                    size="sm"
                                >
                                    Overdue
                                </Button>
                            </div>
                        </div>
                    </Card>

                    {/* Invoices List */}
                    <Card className="shadow-lg">
                        <div className="p-6 border-b border-gray-200">
                            <h2 className="text-xl font-semibold flex items-center gap-2">
                                <FileText className="w-5 h-5 text-blue-600" />
                                Invoices
                            </h2>
                        </div>

                        {isLoading ? (
                            <div className="p-12 text-center">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                                <p className="text-gray-600 mt-4">Loading invoices...</p>
                            </div>
                        ) : invoices?.invoices.length === 0 ? (
                            <div className="p-12 text-center">
                                <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                                <h3 className="text-lg font-semibold text-gray-900 mb-2">No invoices found</h3>
                                <p className="text-gray-600 mb-6">
                                    Create your first invoice from a delivery request
                                </p>
                                <Link href="/dashboard/delivery-requests">
                                    <Button className="gap-2">
                                        <Package className="w-4 h-4" />
                                        View Delivery Requests
                                    </Button>
                                </Link>
                            </div>
                        ) : (
                            <>
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead className="bg-gray-50 border-b border-gray-200">
                                            <tr>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Invoice
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Customer
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Amount
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Due Date
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Status
                                                </th>
                                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Actions
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {invoices?.invoices.map((invoice) => {
                                                const StatusIcon = STATUS_CONFIG[invoice.status as keyof typeof STATUS_CONFIG]?.icon;
                                                const statusConfig = STATUS_CONFIG[invoice.status as keyof typeof STATUS_CONFIG];

                                                return (
                                                    <tr key={invoice.id} className="hover:bg-gray-50 transition-colors">
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <div className="flex items-center gap-2">
                                                                <div className="bg-blue-100 p-2 rounded-lg">
                                                                    <FileText className="w-4 h-4 text-blue-600" />
                                                                </div>
                                                                <div>
                                                                    <div className="text-sm font-semibold text-gray-900">
                                                                        {invoice.invoiceNumber}
                                                                    </div>
                                                                    <div className="text-xs text-gray-500">
                                                                        {new Date(invoice.createdAt).toLocaleDateString()}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <div className="text-sm font-medium text-gray-900">
                                                                {invoice.customerName}
                                                            </div>
                                                            <div className="text-xs text-gray-500">
                                                                {invoice.customerEmail}
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <div className="text-sm font-bold text-gray-900">
                                                                <CurrencyDisplay amount={invoice.totalAmount} />
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <div className="flex items-center gap-1 text-sm text-gray-600">
                                                                <Calendar className="w-4 h-4" />
                                                                {invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString() : 'N/A'}
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold border ${statusConfig?.color}`}>
                                                                {StatusIcon && <StatusIcon className="w-3 h-3" />}
                                                                {statusConfig?.label}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-right">
                                                            <div className="flex items-center justify-end gap-2">
                                                                <Button
                                                                    variant="outline"
                                                                    size="sm"
                                                                    className="gap-1"
                                                                    onClick={() => setSelectedInvoice(invoice)}
                                                                >
                                                                    <Eye className="w-4 h-4" />
                                                                    View
                                                                </Button>
                                                                <Button
                                                                    variant="outline"
                                                                    size="sm"
                                                                    className="gap-1"
                                                                    onClick={() => handleDownloadPdf(invoice.id)}
                                                                >
                                                                    <Download className="w-4 h-4" />
                                                                    PDF
                                                                </Button>
                                                                {invoice.status === 'SENT' && (
                                                                    <Button
                                                                        variant="outline"
                                                                        size="sm"
                                                                        className="gap-1 text-green-600 border-green-300 hover:bg-green-50"
                                                                        onClick={() => {
                                                                            setSelectedInvoice(invoice);
                                                                            setShowReceiptModal(true);
                                                                        }}
                                                                    >
                                                                        <Receipt className="w-4 h-4" />
                                                                        Mark Paid
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

                                {/* Pagination */}
                                {invoices && invoices.pagination.totalPages > 1 && (
                                    <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                                        <div className="text-sm text-gray-600">
                                            Showing {((page - 1) * 10) + 1} to {Math.min(page * 10, invoices.pagination.total)} of {invoices.pagination.total} invoices
                                        </div>
                                        <div className="flex gap-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                                disabled={page === 1}
                                            >
                                                <ChevronLeft className="w-4 h-4" />
                                                Previous
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => setPage(p => Math.min(invoices.pagination.totalPages, p + 1))}
                                                disabled={page === invoices.pagination.totalPages}
                                            >
                                                Next
                                                <ChevronRight className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </Card>

                    {/* Recent Receipts */}
                    {receipts && receipts.receipts.length > 0 && (
                        <Card className="shadow-lg">
                            <div className="p-6 border-b border-gray-200">
                                <h2 className="text-xl font-semibold flex items-center gap-2">
                                    <Receipt className="w-5 h-5 text-green-600" />
                                    Recent Receipts
                                </h2>
                            </div>
                            <div className="p-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {receipts.receipts.map((receipt) => (
                                        <div
                                            key={receipt.id}
                                            className="p-4 border-2 border-gray-200 rounded-lg hover:border-green-400 hover:shadow-md transition-all"
                                        >
                                            <div className="flex items-start justify-between mb-3">
                                                <div className="bg-green-100 p-2 rounded-lg">
                                                    <Receipt className="w-5 h-5 text-green-600" />
                                                </div>
                                                <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-semibold">
                                                    Paid
                                                </span>
                                            </div>
                                            <div className="space-y-2">
                                                <div>
                                                    <div className="text-sm font-semibold text-gray-900">
                                                        {receipt.receiptNumber}
                                                    </div>
                                                    <div className="text-xs text-gray-500">
                                                        {new Date(receipt.createdAt).toLocaleDateString()}
                                                    </div>
                                                </div>
                                                <div className="text-lg font-bold text-green-700">
                                                    <CurrencyDisplay amount={receipt.amountPaid} />
                                                </div>
                                                <div className="text-xs text-gray-600">
                                                    {receipt.paymentMethod}
                                                </div>
                                            </div>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="w-full mt-3 gap-2"
                                                onClick={() => window.open(`/api/receipts/${receipt.id}/pdf`, '_blank')}
                                            >
                                                <Download className="w-4 h-4" />
                                                Download PDF
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </Card>
                    )}
                </div>
            </div>

            {/* Invoice Detail Modal */}
            {selectedInvoice && !showReceiptModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={() => setSelectedInvoice(null)}>
                    <Card className="max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl" onClick={(e) => e.stopPropagation()}>
                        <div className="p-6 border-b border-gray-200">
                            <div className="flex items-start justify-between">
                                <div>
                                    <h3 className="text-2xl font-bold text-gray-900">{selectedInvoice.invoiceNumber}</h3>
                                    <p className="text-sm text-gray-500 mt-1">
                                        Created {new Date(selectedInvoice.createdAt).toLocaleDateString()}
                                    </p>
                                </div>
                                <button
                                    onClick={() => setSelectedInvoice(null)}
                                    className="text-gray-400 hover:text-gray-600"
                                >
                                    <XCircle className="w-6 h-6" />
                                </button>
                            </div>
                        </div>

                        <div className="p-6 space-y-6">
                            {/* Customer Info */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <h4 className="text-sm font-semibold text-gray-500 mb-2">Bill To</h4>
                                    <div className="text-sm">
                                        <div className="font-semibold text-gray-900">{selectedInvoice.customerName}</div>
                                        <div className="text-gray-600">{selectedInvoice.customerEmail}</div>
                                        <div className="text-gray-600">{selectedInvoice.customerPhone}</div>
                                        <div className="text-gray-600">{selectedInvoice.customerAddress}</div>
                                    </div>
                                </div>
                                <div>
                                    <h4 className="text-sm font-semibold text-gray-500 mb-2">Invoice Details</h4>
                                    <div className="text-sm space-y-1">
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Amount:</span>
                                            <span className="font-bold">
                                                <CurrencyDisplay amount={selectedInvoice.totalAmount} />
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Due Date:</span>
                                            <span>{new Date(selectedInvoice.dueDate).toLocaleDateString()}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Status:</span>
                                            <span className={`px-2 py-1 rounded text-xs font-semibold ${STATUS_CONFIG[selectedInvoice.status as keyof typeof STATUS_CONFIG]?.color}`}>
                                                {STATUS_CONFIG[selectedInvoice.status as keyof typeof STATUS_CONFIG]?.label}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Items */}
                            <div>
                                <h4 className="text-sm font-semibold text-gray-500 mb-3">Items</h4>
                                <div className="border rounded-lg overflow-hidden">
                                    <table className="w-full text-sm">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-4 py-2 text-left">Item</th>
                                                <th className="px-4 py-2 text-right">Qty</th>
                                                <th className="px-4 py-2 text-right">Price</th>
                                                <th className="px-4 py-2 text-right">Total</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y">
                                            {selectedInvoice.items && selectedInvoice.items.map((item: any, idx: number) => (
                                                <tr key={idx}>
                                                    <td className="px-4 py-2">{item.productName}</td>
                                                    <td className="px-4 py-2 text-right">{item.quantity}</td>
                                                    <td className="px-4 py-2 text-right">
                                                        <CurrencyDisplay amount={item.unitPrice} />
                                                    </td>
                                                    <td className="px-4 py-2 text-right font-semibold">
                                                        <CurrencyDisplay amount={item.totalPrice} />
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                        <tfoot className="bg-gray-50 font-bold">
                                            <tr>
                                                <td colSpan={3} className="px-4 py-2 text-right">Total</td>
                                                <td className="px-4 py-2 text-right">
                                                    <CurrencyDisplay amount={selectedInvoice.totalAmount} />
                                                </td>
                                            </tr>
                                        </tfoot>
                                    </table>
                                </div>
                            </div>
                        </div>

                        <div className="p-6 border-t border-gray-200 flex gap-3">
                            <Button
                                variant="outline"
                                className="flex-1 gap-2"
                                onClick={() => handleDownloadPdf(selectedInvoice.id)}
                            >
                                <Download className="w-4 h-4" />
                                Download PDF
                            </Button>
                            {selectedInvoice.status === 'DRAFT' && (
                                <Button
                                    className="flex-1 gap-2"
                                    onClick={() => handleSendEmail(selectedInvoice.id)}
                                >
                                    <Send className="w-4 h-4" />
                                    Send to Customer
                                </Button>
                            )}
                            {selectedInvoice.status === 'SENT' && (
                                <Button
                                    className="flex-1 gap-2 bg-green-600 hover:bg-green-700"
                                    onClick={() => setShowReceiptModal(true)}
                                >
                                    <Receipt className="w-4 h-4" />
                                    Generate Receipt
                                </Button>
                            )}
                        </div>
                    </Card>
                </div>
            )}

            {/* Generate Receipt Modal */}
            {showReceiptModal && selectedInvoice && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={() => setShowReceiptModal(false)}>
                    <Card className="max-w-md w-full shadow-2xl" onClick={(e) => e.stopPropagation()}>
                        <div className="p-6 border-b border-gray-200">
                            <h3 className="text-xl font-bold text-gray-900">Generate Receipt</h3>
                            <p className="text-sm text-gray-500 mt-1">
                                Mark invoice as paid and generate receipt
                            </p>
                        </div>

                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Payment Method
                                </label>
                                <select
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    onChange={(e) => {
                                        const method = e.target.value;
                                        handleGenerateReceipt(selectedInvoice.id, method);
                                    }}
                                    defaultValue=""
                                >
                                    <option value="" disabled>Select payment method</option>
                                    <option value="CASH">Cash</option>
                                    <option value="BANK_TRANSFER">Bank Transfer</option>
                                    <option value="CARD">Card Payment</option>
                                    <option value="MOBILE_MONEY">Mobile Money</option>
                                    <option value="CHEQUE">Cheque</option>
                                </select>
                            </div>

                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                <div className="flex items-start gap-3">
                                    <DollarSign className="w-5 h-5 text-blue-600 mt-0.5" />
                                    <div className="text-sm">
                                        <div className="font-semibold text-blue-900">Amount to be paid</div>
                                        <div className="text-2xl font-bold text-blue-700 mt-1">
                                            <CurrencyDisplay amount={selectedInvoice.totalAmount} />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="p-6 border-t border-gray-200 flex gap-3">
                            <Button
                                variant="outline"
                                className="flex-1"
                                onClick={() => setShowReceiptModal(false)}
                            >
                                Cancel
                            </Button>
                        </div>
                    </Card>
                </div>
            )}
        </DashboardLayout>
    );
}
