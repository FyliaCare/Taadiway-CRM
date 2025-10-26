"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

interface AddClientFormProps {
  onClose: () => void;
  onSuccess: () => void;
}

// @ts-ignore - Function props are valid in client components with "use client" directive
export function AddClientForm({ onClose, onSuccess }: AddClientFormProps) {
  const [formData, setFormData] = useState({
    email: "",
    name: "",
    password: "",
    phone: "",
    whatsappNumber: "",
    businessName: "",
    businessType: "",
    businessAddress: "",
    notifyByEmail: true,
    notifyByWhatsApp: false,
  });

  const createClient = trpc.client.create.useMutation({
    onSuccess: () => {
      onSuccess();
      onClose();
    },
    onError: (error) => {
      alert(`Error: ${error.message}`);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createClient.mutate(formData);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-2xl rounded-lg bg-white p-6 shadow-xl">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold">Add New Client</h2>
          <button
            onClick={onClose}
            className="rounded-md p-2 hover:bg-gray-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Business Information */}
          <div>
            <h3 className="mb-4 text-lg font-semibold">Business Information</h3>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium">
                  Business Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  className="w-full rounded-md border px-3 py-2"
                  value={formData.businessName}
                  onChange={(e) =>
                    setFormData({ ...formData, businessName: e.target.value })
                  }
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium">
                  Business Type
                </label>
                <input
                  type="text"
                  className="w-full rounded-md border px-3 py-2"
                  placeholder="e.g., Restaurant, Boutique"
                  value={formData.businessType}
                  onChange={(e) =>
                    setFormData({ ...formData, businessType: e.target.value })
                  }
                />
              </div>

              <div className="md:col-span-2">
                <label className="mb-1 block text-sm font-medium">
                  Business Address
                </label>
                <textarea
                  className="w-full rounded-md border px-3 py-2"
                  rows={2}
                  value={formData.businessAddress}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      businessAddress: e.target.value,
                    })
                  }
                />
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div>
            <h3 className="mb-4 text-lg font-semibold">Contact Information</h3>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium">
                  Contact Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  className="w-full rounded-md border px-3 py-2"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  className="w-full rounded-md border px-3 py-2"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium">
                  Phone Number
                </label>
                <input
                  type="tel"
                  className="w-full rounded-md border px-3 py-2"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium">
                  WhatsApp Number
                </label>
                <input
                  type="tel"
                  className="w-full rounded-md border px-3 py-2"
                  value={formData.whatsappNumber}
                  onChange={(e) =>
                    setFormData({ ...formData, whatsappNumber: e.target.value })
                  }
                />
              </div>

              <div className="md:col-span-2">
                <label className="mb-1 block text-sm font-medium">
                  Initial Password <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  className="w-full rounded-md border px-3 py-2"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  Minimum 6 characters. Client can change this after login.
                </p>
              </div>
            </div>
          </div>

          {/* Notification Preferences */}
          <div>
            <h3 className="mb-4 text-lg font-semibold">
              Notification Preferences
            </h3>
            <div className="space-y-2">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.notifyByEmail}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      notifyByEmail: e.target.checked,
                    })
                  }
                  className="h-4 w-4 rounded border-gray-300"
                />
                <span className="text-sm">Send notifications via Email</span>
              </label>

              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.notifyByWhatsApp}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      notifyByWhatsApp: e.target.checked,
                    })
                  }
                  className="h-4 w-4 rounded border-gray-300"
                />
                <span className="text-sm">Send notifications via WhatsApp</span>
              </label>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 border-t pt-4">
            <Button
              type="button"
              variant="ost"
              onClick={onClose}
              disabled={createClient.isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={createClient.isLoading}>
              {createClient.isLoading ? "Creating..." : "Create Client"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

