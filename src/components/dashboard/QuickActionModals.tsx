"use client";

import { useState } from "react";
import { X, Package, FileText, Receipt, Download } from "lucide-react";

export function QuickActionModals() {
  const [activeModal, setActiveModal] = useState<string | null>(null);

  return (
    <>
      {/* Create Product Modal */}
      {activeModal === "create-product" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-lg border bg-white p-6 shadow-2xl dark:bg-gray-900">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900">
                  <Package className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <h2 className="text-xl font-bold">Create New Product</h2>
              </div>
              <button
                onClick={() => setActiveModal(null)}
                className="rounded-lg p-2 hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium">Product Name</label>
                  <input
                    type="text"
                    className="w-full rounded-md border px-3 py-2 dark:bg-gray-800"
                    placeholder="Enter product name"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">SKU</label>
                  <input
                    type="text"
                    className="w-full rounded-md border px-3 py-2 dark:bg-gray-800"
                    placeholder="Product SKU"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">Category</label>
                  <select className="w-full rounded-md border px-3 py-2 dark:bg-gray-800">
                    <option>Electronics</option>
                    <option>Food & Beverage</option>
                    <option>Clothing</option>
                    <option>Other</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">Unit Price (?)</label>
                  <input
                    type="number"
                    className="w-full rounded-md border px-3 py-2 dark:bg-gray-800"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">Initial Stock</label>
                  <input
                    type="number"
                    className="w-full rounded-md border px-3 py-2 dark:bg-gray-800"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">Reorder Level</label>
                  <input
                    type="number"
                    className="w-full rounded-md border px-3 py-2 dark:bg-gray-800"
                    placeholder="10"
                  />
                </div>
              </div>
              
              <div>
                <label className="mb-1 block text-sm font-medium">Description</label>
                <textarea
                  className="w-full rounded-md border px-3 py-2 dark:bg-gray-800"
                  rows={3}
                  placeholder="Product description"
                ></textarea>
              </div>
              
              <div className="flex justify-end gap-2 pt-4">
                <button
                  onClick={() => setActiveModal(null)}
                  className="rounded-md border px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  Cancel
                </button>
                <button className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700">
                  Create Product
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Invoice Modal */}
      {activeModal === "create-invoice" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-3xl rounded-lg border bg-white p-6 shadow-2xl dark:bg-gray-900">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900">
                  <FileText className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                <h2 className="text-xl font-bold">Create Invoice</h2>
              </div>
              <button
                onClick={() => setActiveModal(null)}
                className="rounded-lg p-2 hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium">Client</label>
                  <select className="w-full rounded-md border px-3 py-2 dark:bg-gray-800">
                    <option>Select client...</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">Invoice Date</label>
                  <input
                    type="date"
                    className="w-full rounded-md border px-3 py-2 dark:bg-gray-800"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">Due Date</label>
                  <input
                    type="date"
                    className="w-full rounded-md border px-3 py-2 dark:bg-gray-800"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">Invoice Number</label>
                  <input
                    type="text"
                    className="w-full rounded-md border px-3 py-2 dark:bg-gray-800"
                    placeholder="INV-001"
                  />
                </div>
              </div>
              
              <div>
                <label className="mb-1 block text-sm font-medium">Items</label>
                <div className="rounded-md border p-4 dark:border-gray-700">
                  <p className="text-sm text-gray-500">Add invoice items here</p>
                </div>
              </div>
              
              <div className="flex justify-end gap-2 pt-4">
                <button
                  onClick={() => setActiveModal(null)}
                  className="rounded-md border px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  Cancel
                </button>
                <button className="rounded-md bg-green-600 px-4 py-2 text-white hover:bg-green-700">
                  Generate Invoice
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Receipt Modal */}
      {activeModal === "create-receipt" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-lg border bg-white p-6 shadow-2xl dark:bg-gray-900">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-900">
                  <Receipt className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                </div>
                <h2 className="text-xl font-bold">Create Receipt</h2>
              </div>
              <button
                onClick={() => setActiveModal(null)}
                className="rounded-lg p-2 hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium">Customer Name</label>
                  <input
                    type="text"
                    className="w-full rounded-md border px-3 py-2 dark:bg-gray-800"
                    placeholder="John Doe"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">Receipt Number</label>
                  <input
                    type="text"
                    className="w-full rounded-md border px-3 py-2 dark:bg-gray-800"
                    placeholder="RCP-001"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">Amount Paid (?)</label>
                  <input
                    type="number"
                    className="w-full rounded-md border px-3 py-2 dark:bg-gray-800"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">Payment Method</label>
                  <select className="w-full rounded-md border px-3 py-2 dark:bg-gray-800">
                    <option>Cash</option>
                    <option>Bank Transfer</option>
                    <option>Card</option>
                    <option>Mobile Money</option>
                  </select>
                </div>
              </div>
              
              <div>
                <label className="mb-1 block text-sm font-medium">Notes</label>
                <textarea
                  className="w-full rounded-md border px-3 py-2 dark:bg-gray-800"
                  rows={3}
                  placeholder="Additional notes..."
                ></textarea>
              </div>
              
              <div className="flex justify-end gap-2 pt-4">
                <button
                  onClick={() => setActiveModal(null)}
                  className="rounded-md border px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  Cancel
                </button>
                <button className="rounded-md bg-purple-600 px-4 py-2 text-white hover:bg-purple-700">
                  Generate Receipt
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Download Report Modal */}
      {activeModal === "download-report" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-lg border bg-white p-6 shadow-2xl dark:bg-gray-900">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-100 dark:bg-orange-900">
                  <Download className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                </div>
                <h2 className="text-xl font-bold">Download Report</h2>
              </div>
              <button
                onClick={() => setActiveModal(null)}
                className="rounded-lg p-2 hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium">Report Type</label>
                <select className="w-full rounded-md border px-3 py-2 dark:bg-gray-800">
                  <option>Sales Report</option>
                  <option>Inventory Report</option>
                  <option>Client Report</option>
                  <option>Revenue Report</option>
                  <option>Complete Business Report</option>
                </select>
              </div>
              
              <div>
                <label className="mb-1 block text-sm font-medium">Date Range</label>
                <select className="w-full rounded-md border px-3 py-2 dark:bg-gray-800">
                  <option>Last 7 Days</option>
                  <option>Last 30 Days</option>
                  <option>Last 3 Months</option>
                  <option>Last 6 Months</option>
                  <option>Last Year</option>
                  <option>All Time</option>
                </select>
              </div>
              
              <div>
                <label className="mb-1 block text-sm font-medium">Format</label>
                <select className="w-full rounded-md border px-3 py-2 dark:bg-gray-800">
                  <option>PDF</option>
                  <option>Excel (XLSX)</option>
                  <option>CSV</option>
                  <option>JSON</option>
                </select>
              </div>
              
              <div className="flex justify-end gap-2 pt-4">
                <button
                  onClick={() => setActiveModal(null)}
                  className="rounded-md border px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  Cancel
                </button>
                <button className="rounded-md bg-orange-600 px-4 py-2 text-white hover:bg-orange-700">
                  Download Report
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// Export function to trigger modals
export function openQuickAction(action: string) {
  // This can be used to trigger modals from the hub
  window.dispatchEvent(new CustomEvent("open-quick-action", { detail: { action } }));
}

