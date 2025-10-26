"use client";

import { DashboardLayout } from "@/components/dashboard/layout";
import { CurrencyDisplay } from "@/components/dashboard";
import { trpc } from "@/lib/trpc/client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Package,
  Plus,
  X,
  Truck,
  Calendar as CalendarIcon,
  MapPin,
  Phone,
  User,
  CreditCard,
  FileText,
  ArrowLeft,
  Search
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type PaymentMethod = "PAYMENT_BEFORE_DELIVERY" | "PAYMENT_ON_DELIVERY" | "BANK_TRANSFER" | "CARD" | "CASH" | "MOBILE_MONEY";
type PreferredTime = "morning" | "afternoon" | "evening";

interface DeliveryItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  availableStock: number;
}

export default function NewDeliveryRequestPage() {
  const router = useRouter();

  // Form state
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("PAYMENT_ON_DELIVERY");
  const [scheduledDate, setScheduledDate] = useState("");
  const [preferredTime, setPreferredTime] = useState<PreferredTime | "">("");
  const [specialInstructions, setSpecialInstructions] = useState("");
  const [items, setItems] = useState<DeliveryItem[]>([]);

  // Product selection
  const [productSearch, setProductSearch] = useState("");
  const [showProductPicker, setShowProductPicker] = useState(false);

  const { data: products, isLoading: productsLoading } = trpc.vendor.getMyProducts.useQuery({
    page: 1,
    limit: 100,
    search: productSearch,
    stockStatus: "in-stock"
  });

  const createMutation = trpc.deliveryRequest.create.useMutation({
    onSuccess: (data) => {
      router.push('/dashboard/delivery-requests');
    },
    onError: (error) => {
      alert(`Error: ${error.message}`);
    }
  });

  const addItem = (product: any) => {
    const existing = items.find(i => i.productId === product.id);
    if (existing) {
      updateItemQuantity(product.id, existing.quantity + 1);
    } else {
      setItems([...items, {
        productId: product.id,
        productName: product.name,
        quantity: 1,
        unitPrice: product.sellingPrice,
        totalPrice: product.sellingPrice,
        availableStock: product.currentStock
      }]);
    }
    setShowProductPicker(false);
    setProductSearch("");
  };

  const removeItem = (productId: string) => {
    setItems(items.filter(i => i.productId !== productId));
  };

  const updateItemQuantity = (productId: string, quantity: number) => {
    setItems(items.map(item => {
      if (item.productId === productId) {
        const validQuantity = Math.max(1, Math.min(quantity, item.availableStock));
        return {
          ...item,
          quantity: validQuantity,
          totalPrice: validQuantity * item.unitPrice
        };
      }
      return item;
    }));
  };

  const calculateTotal = () => {
    return items.reduce((sum, item) => sum + item.totalPrice, 0);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (items.length === 0) {
      alert("Please add at least one product");
      return;
    }

    createMutation.mutate({
      customerName,
      customerPhone,
      customerEmail: customerEmail || undefined,
      deliveryAddress,
      paymentMethod,
      scheduledDate: scheduledDate ? new Date(scheduledDate) : undefined,
      preferredTime: preferredTime || undefined,
      specialInstructions: specialInstructions || undefined,
      items: items.map(item => ({
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: item.unitPrice
      }))
    });
  };

  const paymentMethods: { value: PaymentMethod; label: string; description: string }[] = [
    { value: "PAYMENT_ON_DELIVERY", label: "Payment On Delivery (POD)", description: "Customer pays when receiving goods" },
    { value: "PAYMENT_BEFORE_DELIVERY", label: "Payment Before Delivery (PBD)", description: "Customer already paid" },
    { value: "MOBILE_MONEY", label: "Mobile Money", description: "Paid via mobile money" },
    { value: "BANK_TRANSFER", label: "Bank Transfer", description: "Paid via bank transfer" },
    { value: "CARD", label: "Card Payment", description: "Paid with debit/credit card" },
    { value: "CASH", label: "Cash", description: "Cash payment" }
  ];

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link href="/dashboard/delivery-requests">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </Link>
          <div className="flex-1">
            <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Create Delivery Request
            </h1>
            <p className="text-muted-foreground mt-1">
              Request authorization to deliver products to customer
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Customer Information */}
          <div className="rounded-xl border bg-white p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <User className="h-5 w-5 text-blue-600" />
              <h2 className="text-lg font-semibold">Customer Information</h2>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Customer Name <span className="text-red-500">*</span>
                </label>
                <Input
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Enter customer name"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number <span className="text-red-500">*</span>
                </label>
                <Input
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="0XX XXX XXXX"
                  required
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email (Optional)
                </label>
                <Input
                  type="email"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  placeholder="customer@example.com"
                />
              </div>
            </div>
          </div>

          {/* Delivery Details */}
          <div className="rounded-xl border bg-white p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <MapPin className="h-5 w-5 text-green-600" />
              <h2 className="text-lg font-semibold">Delivery Details</h2>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Delivery Address <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={deliveryAddress}
                  onChange={(e) => setDeliveryAddress(e.target.value)}
                  placeholder="Enter full delivery address including landmarks"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  rows={3}
                  required
                />
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Preferred Date (Optional)
                  </label>
                  <Input
                    type="date"
                    value={scheduledDate}
                    onChange={(e) => setScheduledDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Preferred Time (Optional)
                  </label>
                  <select
                    value={preferredTime}
                    onChange={(e) => setPreferredTime(e.target.value as PreferredTime)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  >
                    <option value="">Select time slot</option>
                    <option value="morning">Morning (8AM - 12PM)</option>
                    <option value="afternoon">Afternoon (12PM - 5PM)</option>
                    <option value="evening">Evening (5PM - 9PM)</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Special Instructions (Optional)
                </label>
                <textarea
                  value={specialInstructions}
                  onChange={(e) => setSpecialInstructions(e.target.value)}
                  placeholder="Any special delivery instructions..."
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  rows={2}
                />
              </div>
            </div>
          </div>

          {/* Payment Method */}
          <div className="rounded-xl border bg-white p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <CreditCard className="h-5 w-5 text-purple-600" />
              <h2 className="text-lg font-semibold">Payment Method</h2>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              {paymentMethods.map((method) => (
                <label
                  key={method.value}
                  className={`relative flex cursor-pointer rounded-lg border-2 p-4 transition-all ${paymentMethod === method.value
                      ? "border-blue-600 bg-blue-50"
                      : "border-gray-200 hover:border-gray-300"
                    }`}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    value={method.value}
                    checked={paymentMethod === method.value}
                    onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                    className="sr-only"
                  />
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900">{method.label}</p>
                    <p className="text-sm text-gray-600">{method.description}</p>
                  </div>
                  {paymentMethod === method.value && (
                    <div className="absolute right-3 top-3 h-5 w-5 rounded-full bg-blue-600 flex items-center justify-center">
                      <div className="h-2 w-2 rounded-full bg-white"></div>
                    </div>
                  )}
                </label>
              ))}
            </div>
          </div>

          {/* Products */}
          <div className="rounded-xl border bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Package className="h-5 w-5 text-amber-600" />
                <h2 className="text-lg font-semibold">Products</h2>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowProductPicker(!showProductPicker)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Product
              </Button>
            </div>

            {/* Product Picker */}
            {showProductPicker && (
              <div className="mb-4 p-4 border-2 border-dashed rounded-lg bg-gray-50">
                <div className="relative mb-3">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    placeholder="Search products..."
                    className="pl-10"
                  />
                </div>
                <div className="max-h-60 overflow-y-auto space-y-2">
                  {productsLoading ? (
                    <p className="text-sm text-gray-500 text-center py-4">Loading products...</p>
                  ) : products?.products && products.products.length > 0 ? (
                    products.products
                      .filter(p => !items.find(i => i.productId === p.id))
                      .map((product: any) => (
                        <button
                          key={product.id}
                          type="button"
                          onClick={() => addItem(product)}
                          className="w-full flex items-center justify-between p-3 bg-white rounded-lg border hover:border-blue-500 hover:bg-blue-50 transition-colors text-left"
                        >
                          <div className="flex-1">
                            <p className="font-medium text-gray-900">{product.name}</p>
                            <p className="text-sm text-gray-600">
                              Stock: {product.currentStock} • SKU: {product.sku}
                            </p>
                          </div>
                          <p className="font-semibold text-gray-900">
                            <CurrencyDisplay amount={product.sellingPrice} />
                          </p>
                        </button>
                      ))
                  ) : (
                    <p className="text-sm text-gray-500 text-center py-4">No products found</p>
                  )}
                </div>
              </div>
            )}

            {/* Selected Items */}
            {items.length > 0 ? (
              <div className="space-y-3">
                {items.map((item) => (
                  <div key={item.productId} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{item.productName}</p>
                      <p className="text-sm text-gray-600">
                        <CurrencyDisplay amount={item.unitPrice} /> × {item.quantity} = <CurrencyDisplay amount={item.totalPrice} />
                      </p>
                      <p className="text-xs text-gray-500">Available stock: {item.availableStock}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => updateItemQuantity(item.productId, item.quantity - 1)}
                        className="h-8 w-8 flex items-center justify-center rounded-md bg-white border hover:bg-gray-100"
                      >
                        -
                      </button>
                      <input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => updateItemQuantity(item.productId, parseInt(e.target.value) || 1)}
                        min={1}
                        max={item.availableStock}
                        className="w-16 text-center rounded-md border px-2 py-1"
                      />
                      <button
                        type="button"
                        onClick={() => updateItemQuantity(item.productId, item.quantity + 1)}
                        className="h-8 w-8 flex items-center justify-center rounded-md bg-white border hover:bg-gray-100"
                      >
                        +
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeItem(item.productId)}
                      className="h-8 w-8 flex items-center justify-center rounded-md bg-red-100 text-red-600 hover:bg-red-200"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
                <div className="pt-4 border-t">
                  <div className="flex items-center justify-between">
                    <p className="text-lg font-semibold text-gray-900">Total Amount</p>
                    <p className="text-2xl font-bold text-green-600">
                      <CurrencyDisplay amount={calculateTotal()} />
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <Package className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                <p className="text-sm">No products added yet</p>
                <p className="text-xs mt-1">Click &quot;Add Product&quot; to select items</p>
              </div>
            )}
          </div>

          {/* Submit Buttons */}
          <div className="flex items-center gap-4 pt-4">
            <Button
              type="submit"
              disabled={createMutation.isLoading || items.length === 0}
              className="flex-1 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
            >
              <Truck className="mr-2 h-4 w-4" />
              {createMutation.isLoading ? "Creating Request..." : "Submit Request"}
            </Button>
            <Link href="/dashboard/delivery-requests">
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </Link>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
