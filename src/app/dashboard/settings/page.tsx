"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { DashboardLayout } from "@/components/dashboard/layout";
import { CurrencyDisplay } from "@/components/dashboard";
import { trpc } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
import {
  User, Mail, Phone, MapPin, Globe, Edit2, MoreVertical,
  Camera, ChevronDown, Plus, LogOut, Lock, Shield, Bell,
  Key, CheckCircle2, Smartphone, History, Activity, Download,
  XCircle, Eye, AlertTriangle, Save, Moon, Sun, Laptop, MessageSquare,
  CreditCard, TrendingUp, Package, DollarSign, Calendar, Building2
} from "lucide-react";
import { useSession } from "next-auth/react";
import { usePreferences, type CurrencyCode, type LanguageKey, LANGUAGES } from "@/lib/preferences-context";

type SettingsSection = "profile" | "business" | "subscription" | "security" | "notifications" | "preferences";

export default function SettingsPage() {
  const { data: session, update: updateSession } = useSession();
  const { preferences, updatePreferences } = usePreferences();
  const [activeSection, setActiveSection] = useState<SettingsSection>("profile");
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [show2FAModal, setShow2FAModal] = useState(false);

  // Toast state
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  // Show toast helper
  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Form state
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [secondaryPhone, setSecondaryPhone] = useState("");
  const [email, setEmail] = useState("");
  const [secondaryEmail, setSecondaryEmail] = useState("");
  const [primaryAddress, setPrimaryAddress] = useState("");
  const [secondaryAddress, setSecondaryAddress] = useState("");
  const [merchantId, setMerchantId] = useState("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string>("");

  // Password change state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Notification preferences
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [whatsappNotifications, setWhatsappNotifications] = useState(true);
  const [smsNotifications, setSmsNotifications] = useState(false);
  const [notifySales, setNotifySales] = useState(true);
  const [notifyLowStock, setNotifyLowStock] = useState(true);
  const [notifySubscription, setNotifySubscription] = useState(true);
  const [notifyPayments, setNotifyPayments] = useState(true);

  // Business information state
  const [businessName, setBusinessName] = useState("");
  const [businessPhone, setBusinessPhone] = useState("");
  const [businessEmail, setBusinessEmail] = useState("");
  const [businessAddress, setBusinessAddress] = useState("");
  const [businessWebsite, setBusinessWebsite] = useState("");
  const [businessDescription, setBusinessDescription] = useState("");

  // Subscription state
  const [currentPlan, setCurrentPlan] = useState<"BASIC" | "STANDARD" | "PREMIUM">("STANDARD");
  const [billingHistory] = useState([
    { id: 1, date: "2024-01-15", amount: 25000, status: "PAID", plan: "STANDARD", invoiceNumber: "INV-2024-001" },
    { id: 2, date: "2023-12-15", amount: 25000, status: "PAID", plan: "STANDARD", invoiceNumber: "INV-2023-012" },
    { id: 3, date: "2023-11-15", amount: 25000, status: "PAID", plan: "STANDARD", invoiceNumber: "INV-2023-011" },
  ]);
  const [paymentMethod, setPaymentMethod] = useState({
    type: "card",
    last4: "4242",
    brand: "Visa",
    expiryMonth: "12",
    expiryYear: "2025",
  });

  // Activity logs mock data
  const [activityLogs] = useState([
    { id: 1, action: "Profile Updated", device: "Chrome on Windows", location: "Accra, Ghana", timestamp: new Date().toISOString(), ip: "192.168.1.1" },
    { id: 2, action: "Password Changed", device: "Safari on iPhone", location: "Kumasi, Ghana", timestamp: new Date(Date.now() - 86400000).toISOString(), ip: "192.168.1.2" },
    { id: 3, action: "Login Successful", device: "Chrome on Windows", location: "Accra, Ghana", timestamp: new Date(Date.now() - 172800000).toISOString(), ip: "192.168.1.1" },
    { id: 4, action: "Settings Changed", device: "Firefox on Windows", location: "Accra, Ghana", timestamp: new Date(Date.now() - 259200000).toISOString(), ip: "192.168.1.3" },
  ]);

  // Active sessions mock data
  const [activeSessions] = useState([
    { id: 1, device: "Chrome on Windows", location: "Accra, Ghana", lastActive: "Just now", ip: "192.168.1.1", isCurrent: true },
    { id: 2, device: "Safari on iPhone 14", location: "Kumasi, Ghana", lastActive: "2 hours ago", ip: "192.168.1.2", isCurrent: false },
    { id: 3, device: "Firefox on MacBook", location: "Takoradi, Ghana", lastActive: "1 day ago", ip: "192.168.1.3", isCurrent: false },
  ]);

  const { data: user, isLoading } = trpc.user.current.useQuery();
  const { data: clientProfile } = trpc.client.getCurrent.useQuery(undefined, {
    enabled: !!user && user.role === "USER",
  });
  const updateUserMutation = trpc.user.update.useMutation();
  const updateClientMutation = trpc.client.update.useMutation();
  const changePasswordMutation = trpc.user.changePassword.useMutation();

  // Initialize form with user data
  useEffect(() => {
    if (user) {
      setName(user.name || "");
      setEmail(user.email || "");
      setPhone(user.phone || "");
      setSecondaryPhone(user.whatsappNumber || "");

      // Generate mock merchant ID if admin
      if (user.role === "SUPER_ADMIN" || user.role === "ADMIN") {
        setMerchantId("XYZ" + Math.floor(Math.random() * 1000000000000));
      }

      // Set addresses from client profile if available
      if (user.clientProfile) {
        setPrimaryAddress(user.clientProfile.businessAddress || "");
        setBusinessName(user.clientProfile.businessName || "");
        setBusinessPhone(user.phone || "");
        setBusinessEmail(user.email || "");
        setBusinessAddress(user.clientProfile.businessAddress || "");
        setEmailNotifications(user.clientProfile.notifyByEmail ?? true);
        setWhatsappNotifications(user.clientProfile.notifyByWhatsApp ?? false);
      }

      // Set current plan from client profile subscription
      if (clientProfile?.subscription?.plan) {
        setCurrentPlan(clientProfile.subscription.plan);
      }
    }
  }, [user, clientProfile]);

  const handleSaveProfile = async () => {
    try {
      await updateUserMutation.mutateAsync({
        name,
        phone: phone || undefined,
        whatsappNumber: secondaryPhone || undefined,
      });

      if (session?.user) {
        await updateSession({
          ...session,
          user: {
            ...session.user,
            name,
          },
        });
      }

      showToast("Profile updated successfully!");
      setIsEditingProfile(false);
    } catch (error) {
      console.error("Failed to update profile:", error);
      showToast("Failed to update profile. Please try again.", "error");
    }
  };

  const handleSaveBusinessInfo = async () => {
    if (!clientProfile?.id) return;

    try {
      await updateClientMutation.mutateAsync({
        id: clientProfile.id,
        businessName,
        businessAddress,
      });

      showToast("Business information updated successfully!");
    } catch (error) {
      console.error("Failed to update business info:", error);
      showToast("Failed to update business information. Please try again.", "error");
    }
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      showToast("Please fill in all password fields", "error");
      return;
    }

    if (newPassword !== confirmPassword) {
      showToast("New passwords do not match", "error");
      return;
    }

    if (newPassword.length < 8) {
      showToast("Password must be at least 8 characters long", "error");
      return;
    }

    try {
      await changePasswordMutation.mutateAsync({
        currentPassword,
        newPassword,
      });

      showToast("Password changed successfully!");
      setShowPasswordModal(false);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error: any) {
      console.error("Failed to change password:", error);
      showToast(error?.message || "Failed to change password. Please try again.", "error");
    }
  };

  const handleSaveNotificationPreferences = async () => {
    if (!clientProfile?.id) return;

    try {
      await updateClientMutation.mutateAsync({
        id: clientProfile.id,
        notifyByEmail: emailNotifications,
        notifyByWhatsApp: whatsappNotifications,
      });

      showToast("Notification preferences saved successfully!");
    } catch (error) {
      console.error("Failed to save notification preferences:", error);
      showToast("Failed to save preferences. Please try again.", "error");
    }
  };

  const handleSavePreferences = async () => {
    try {
      // Preferences are auto-saved by the global context
      // This function can be used for future server-side sync if needed
      showToast("Preferences saved successfully!");
    } catch (error) {
      console.error("Failed to save preferences:", error);
      showToast("Failed to save preferences. Please try again.", "error");
    }
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        showToast("Image size should be less than 5MB", "error");
        return;
      }

      if (!file.type.startsWith("image/")) {
        showToast("Please upload an image file", "error");
        return;
      }

      setAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUploadAvatar = async () => {
    if (!avatarPreview) return;

    try {
      await updateUserMutation.mutateAsync({
        image: avatarPreview,
      });

      showToast("Profile picture updated successfully!");
      setAvatarFile(null);
    } catch (error) {
      console.error("Failed to upload avatar:", error);
      showToast("Failed to upload profile picture. Please try again.", "error");
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-center">
            <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-gray-200 border-t-blue-500"></div>
            <p className="text-gray-600">Loading...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!user) {
    return (
      <DashboardLayout>
        <div className="flex min-h-screen items-center justify-center">
          <p className="text-gray-600">User not found</p>
        </div>
      </DashboardLayout>
    );
  }

  const joinedDate = new Date(user.createdAt).toLocaleDateString("en-US", {
    month: "2-digit",
    day: "2-digit",
    year: "2-digit",
  });

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="mx-auto max-w-7xl">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Setting</h1>
          </div>

          <div className="flex gap-8">
            {/* Sidebar */}
            <div className="w-64 flex-shrink-0">
              <div className="space-y-2">
                <button
                  onClick={() => setActiveSection("profile")}
                  className={`flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left transition-colors ${activeSection === "profile"
                    ? "bg-purple-50 text-purple-600"
                    : "text-gray-700 hover:bg-gray-100"
                    }`}
                >
                  <User className="h-5 w-5" />
                  <span className="font-medium">Profile</span>
                </button>

                {user?.role === "USER" && (
                  <>
                    <button
                      onClick={() => setActiveSection("business")}
                      className={`flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left transition-colors ${activeSection === "business"
                        ? "bg-purple-50 text-purple-600"
                        : "text-gray-700 hover:bg-gray-100"
                        }`}
                    >
                      <Building2 className="h-5 w-5" />
                      <span className="font-medium">Business Info</span>
                    </button>
                    <button
                      onClick={() => setActiveSection("subscription")}
                      className={`flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left transition-colors ${activeSection === "subscription"
                        ? "bg-purple-50 text-purple-600"
                        : "text-gray-700 hover:bg-gray-100"
                        }`}
                    >
                      <CreditCard className="h-5 w-5" />
                      <span className="font-medium">Subscription</span>
                    </button>
                  </>
                )}

                <button
                  onClick={() => setActiveSection("security")}
                  className={`flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left transition-colors ${activeSection === "security"
                    ? "bg-purple-50 text-purple-600"
                    : "text-gray-700 hover:bg-gray-100"
                    }`}
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  <span className="font-medium">Security</span>
                </button>
                <button
                  onClick={() => setActiveSection("notifications")}
                  className={`flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left transition-colors ${activeSection === "notifications"
                    ? "bg-purple-50 text-purple-600"
                    : "text-gray-700 hover:bg-gray-100"
                    }`}
                >
                  <Bell className="h-5 w-5" />
                  <span className="font-medium">Notifications</span>
                </button>
                <button
                  onClick={() => setActiveSection("preferences")}
                  className={`flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left transition-colors ${activeSection === "preferences"
                    ? "bg-purple-50 text-purple-600"
                    : "text-gray-700 hover:bg-gray-100"
                    }`}
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span className="font-medium">Preferences</span>
                </button>

                {/* Logout Button */}
                <button className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left text-gray-700 transition-colors hover:bg-gray-100 mt-8">
                  <LogOut className="h-5 w-5" />
                  <span className="font-medium">Log Out</span>
                </button>
              </div>
            </div>

            {/* Main Content */}
            <div className="flex-1">
              {activeSection === "profile" && (
                <div className="space-y-6">
                  {/* Profile Header Card */}
                  <div className="rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 p-8 shadow-lg">
                    <div className="flex items-center gap-6">
                      {/* Avatar */}
                      <div className="relative">
                        <div className="h-32 w-32 overflow-hidden rounded-full border-4 border-white bg-gradient-to-br from-blue-500 to-purple-600 shadow-xl">
                          {avatarPreview || user.image ? (
                            <div className="relative h-full w-full">
                              <Image
                                src={avatarPreview || user.image!}
                                alt={user.name || "User"}
                                fill
                                className="object-cover"
                                sizes="128px"
                              />
                            </div>
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-4xl font-bold text-white">
                              {user.name?.charAt(0).toUpperCase() || "U"}
                            </div>
                          )}
                        </div>
                        <label className="absolute bottom-0 right-0 cursor-pointer rounded-full bg-white p-2 shadow-lg hover:bg-gray-50 transition-colors">
                          <Camera className="h-5 w-5 text-purple-600" />
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleAvatarChange}
                          />
                        </label>
                        {avatarPreview && (
                          <button
                            onClick={handleUploadAvatar}
                            disabled={updateUserMutation.isLoading}
                            className="absolute -bottom-2 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-green-500 px-3 py-1 text-xs font-semibold text-white shadow-lg hover:bg-green-600 transition-colors"
                          >
                            {updateUserMutation.isLoading ? "Uploading..." : "Save Photo"}
                          </button>
                        )}
                      </div>

                      {/* User Info */}
                      <div className="flex-1">
                        <h2 className="text-3xl font-bold text-white">{user.name}</h2>
                        <p className="mt-1 text-purple-100">{user.email}</p>
                        <div className="mt-4 flex items-center gap-4">
                          <span className="inline-flex items-center gap-2 rounded-full bg-white/20 px-4 py-1.5 text-sm font-semibold text-white backdrop-blur-sm">
                            <User className="h-4 w-4" />
                            {user.role}
                          </span>
                          <span className="inline-flex items-center gap-2 rounded-full bg-white/20 px-4 py-1.5 text-sm font-semibold text-white backdrop-blur-sm">
                            <Calendar className="h-4 w-4" />
                            Joined {joinedDate}
                          </span>
                          {user.clientProfile && (
                            <span className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-green-400 to-emerald-500 px-4 py-1.5 text-sm font-semibold text-white shadow-lg">
                              <CheckCircle2 className="h-4 w-4" />
                              {clientProfile?.subscription?.plan || "BASIC"}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Personal Information Card */}
                  <div className="rounded-xl bg-white p-8 shadow-sm border border-gray-200">
                    <div className="mb-6 flex items-start justify-between">
                      <div>
                        <h3 className="text-xl font-semibold text-gray-900">Personal Information</h3>
                        <p className="mt-1 text-sm text-gray-500">Update your personal details and contact information</p>
                      </div>
                      <button
                        onClick={() => setIsEditingProfile(!isEditingProfile)}
                        className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-purple-500 to-pink-600 px-4 py-2 text-sm font-medium text-white transition-all hover:from-purple-600 hover:to-pink-700 shadow-md hover:shadow-lg"
                      >
                        <Edit2 className="h-4 w-4" />
                        {isEditingProfile ? "Cancel" : "Edit Profile"}
                      </button>
                    </div>

                    {isEditingProfile ? (
                      <div className="space-y-6">
                        <div className="grid grid-cols-2 gap-6">
                          <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                              Full Name <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="text"
                              value={name}
                              onChange={(e) => setName(e.target.value)}
                              className="w-full rounded-lg border-2 border-gray-300 px-4 py-3 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-200 transition-all"
                              placeholder="Enter your full name"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                              Email Address <span className="text-gray-400">(Read-only)</span>
                            </label>
                            <input
                              type="email"
                              value={user.email ?? ""}
                              disabled
                              className="w-full rounded-lg border-2 border-gray-200 bg-gray-50 px-4 py-3 text-gray-500"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-6">
                          <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                              <Phone className="inline h-4 w-4 mr-1" />
                              Primary Phone Number
                            </label>
                            <input
                              type="tel"
                              value={phone}
                              onChange={(e) => setPhone(e.target.value)}
                              className="w-full rounded-lg border-2 border-gray-300 px-4 py-3 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-200 transition-all"
                              placeholder="+233 XX XXX XXXX"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                              <MessageSquare className="inline h-4 w-4 mr-1" />
                              WhatsApp Number
                            </label>
                            <input
                              type="tel"
                              value={secondaryPhone}
                              onChange={(e) => setSecondaryPhone(e.target.value)}
                              className="w-full rounded-lg border-2 border-gray-300 px-4 py-3 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-200 transition-all"
                              placeholder="+233 XX XXX XXXX"
                            />
                          </div>
                        </div>

                        <div className="flex gap-3 pt-4">
                          <Button
                            onClick={handleSaveProfile}
                            disabled={updateUserMutation.isLoading || !name.trim()}
                            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-lg"
                          >
                            <Save className="mr-2 h-4 w-4" />
                            {updateUserMutation.isLoading ? "Saving..." : "Save Changes"}
                          </Button>
                          <Button
                            onClick={() => {
                              setIsEditingProfile(false);
                              setName(user.name || "");
                              setPhone(user.phone || "");
                              setSecondaryPhone(user.whatsappNumber || "");
                            }}
                            variant="outline"
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-8">
                        <div>
                          <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">Full Name</label>
                          <p className="mt-2 text-lg font-semibold text-gray-900">{user.name || "Not set"}</p>
                        </div>
                        <div>
                          <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">Email Address</label>
                          <p className="mt-2 text-lg font-semibold text-gray-900">{user.email}</p>
                        </div>
                        <div>
                          <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">Phone Number</label>
                          <p className="mt-2 text-lg font-semibold text-gray-900">{phone || "Not set"}</p>
                        </div>
                        <div>
                          <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">WhatsApp Number</label>
                          <p className="mt-2 text-lg font-semibold text-gray-900">{secondaryPhone || "Not set"}</p>
                        </div>
                        <div>
                          <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">User Role</label>
                          <p className="mt-2">
                            <span className="inline-flex items-center gap-2 rounded-full bg-purple-100 px-4 py-1.5 text-sm font-semibold text-purple-700">
                              <Shield className="h-4 w-4" />
                              {user.role}
                            </span>
                          </p>
                        </div>
                        <div>
                          <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">Account Status</label>
                          <p className="mt-2">
                            <span className={`inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-semibold ${user.isActive
                              ? "bg-green-100 text-green-700"
                              : "bg-red-100 text-red-700"
                              }`}>
                              {user.isActive ? (
                                <>
                                  <CheckCircle2 className="h-4 w-4" />
                                  Active
                                </>
                              ) : (
                                <>
                                  <XCircle className="h-4 w-4" />
                                  Inactive
                                </>
                              )}
                            </span>
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Contact Information Grid */}
                  <div className="grid grid-cols-2 gap-6">
                    {/* Emails Section */}
                    <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-200">
                      <div className="mb-4 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="rounded-lg bg-blue-100 p-2">
                            <Mail className="h-5 w-5 text-blue-600" />
                          </div>
                          <h3 className="font-semibold text-gray-900">Email Addresses</h3>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <div className="rounded-lg border-2 border-blue-200 bg-blue-50 p-4">
                          <div className="mb-2 flex items-center gap-2">
                            <span className="rounded-full bg-blue-600 px-3 py-0.5 text-xs font-bold text-white">PRIMARY</span>
                            <CheckCircle2 className="h-4 w-4 text-blue-600" />
                          </div>
                          <p className="font-semibold text-gray-900">{user.email}</p>
                          <p className="mt-1 text-xs text-blue-700">Verified • Used for login</p>
                        </div>
                        <button className="w-full rounded-lg border-2 border-dashed border-gray-300 p-4 text-center text-sm font-medium text-gray-500 transition-all hover:border-blue-400 hover:bg-blue-50 hover:text-blue-600">
                          <Plus className="mx-auto mb-1 h-5 w-5" />
                          Add Secondary Email
                        </button>
                      </div>
                    </div>

                    {/* Phone Numbers Section */}
                    <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-200">
                      <div className="mb-4 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="rounded-lg bg-green-100 p-2">
                            <Phone className="h-5 w-5 text-green-600" />
                          </div>
                          <h3 className="font-semibold text-gray-900">Phone Numbers</h3>
                        </div>
                      </div>
                      <div className="space-y-3">
                        {phone && (
                          <div className="rounded-lg border-2 border-green-200 bg-green-50 p-4">
                            <div className="mb-2 flex items-center gap-2">
                              <span className="rounded-full bg-green-600 px-3 py-0.5 text-xs font-bold text-white">PRIMARY</span>
                            </div>
                            <p className="font-semibold text-gray-900">{phone}</p>
                            <p className="mt-1 text-xs text-green-700">Main contact number</p>
                          </div>
                        )}
                        {secondaryPhone && (
                          <div className="rounded-lg border-2 border-purple-200 bg-purple-50 p-4">
                            <div className="mb-2 flex items-center gap-2">
                              <MessageSquare className="h-4 w-4 text-purple-600" />
                              <span className="text-xs font-semibold text-purple-700">WHATSAPP</span>
                            </div>
                            <p className="font-semibold text-gray-900">{secondaryPhone}</p>
                            <p className="mt-1 text-xs text-purple-700">WhatsApp enabled</p>
                          </div>
                        )}
                        {!phone && !secondaryPhone && (
                          <div className="rounded-lg border-2 border-dashed border-gray-300 p-4 text-center">
                            <p className="text-sm text-gray-500">No phone numbers added</p>
                            <button
                              onClick={() => setIsEditingProfile(true)}
                              className="mt-2 text-sm font-medium text-purple-600 hover:text-purple-700"
                            >
                              Add phone number
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Address Section */}
                  <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-200">
                    <div className="mb-4 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="rounded-lg bg-orange-100 p-2">
                          <MapPin className="h-5 w-5 text-orange-600" />
                        </div>
                        <h3 className="font-semibold text-gray-900">Addresses</h3>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      {primaryAddress && (
                        <div className="rounded-lg border-2 border-orange-200 bg-orange-50 p-4">
                          <div className="mb-2">
                            <span className="rounded-full bg-orange-600 px-3 py-0.5 text-xs font-bold text-white">PRIMARY</span>
                          </div>
                          <p className="font-semibold text-gray-900">{primaryAddress}</p>
                          <p className="mt-1 text-xs text-orange-700">Main address</p>
                        </div>
                      )}
                      {!primaryAddress && (
                        <div className="rounded-lg border-2 border-dashed border-gray-300 p-4 text-center col-span-2">
                          <MapPin className="mx-auto mb-2 h-8 w-8 text-gray-400" />
                          <p className="text-sm text-gray-500">No address added yet</p>
                          {user.clientProfile && (
                            <button
                              onClick={() => setActiveSection("business")}
                              className="mt-2 text-sm font-medium text-purple-600 hover:text-purple-700"
                            >
                              Add business address
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Account Preferences */}
                  <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-200">
                    <div className="mb-4 flex items-center gap-2">
                      <div className="rounded-lg bg-indigo-100 p-2">
                        <Globe className="h-5 w-5 text-indigo-600" />
                      </div>
                      <h3 className="font-semibold text-gray-900">Account Preferences</h3>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="rounded-lg bg-gray-50 p-4">
                        <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">Language</label>
                        <p className="mt-2 text-sm font-semibold text-gray-900">{LANGUAGES[preferences.language]?.nativeName || 'English'}</p>
                      </div>
                      <div className="rounded-lg bg-gray-50 p-4">
                        <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">Timezone</label>
                        <p className="mt-2 text-sm font-semibold text-gray-900">{preferences.timezone}</p>
                      </div>
                      {merchantId && (
                        <div className="rounded-lg bg-gray-50 p-4">
                          <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">Merchant ID</label>
                          <p className="mt-2 font-mono text-sm font-semibold text-gray-900">{merchantId}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Danger Zone */}
                  {!user?.isSuperAdmin && (
                    <div className="rounded-xl border-2 border-red-200 bg-gradient-to-br from-red-50 to-orange-50 p-6 shadow-sm">
                      <div className="flex items-start gap-4">
                        <div className="rounded-lg bg-red-100 p-3">
                          <AlertTriangle className="h-6 w-6 text-red-600" />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-red-900">Danger Zone</h3>
                          <p className="mt-1 text-sm text-red-800">
                            Once you delete your account, there is no going back. Please be certain.
                          </p>
                          <button
                            onClick={() => setShowDeleteModal(true)}
                            className="mt-4 rounded-lg border-2 border-red-600 bg-red-600 px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-red-700 hover:border-red-700 shadow-md hover:shadow-lg"
                          >
                            <XCircle className="mr-2 inline h-4 w-4" />
                            Delete Account
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeSection === "business" && user?.role === "USER" && (
                <div className="space-y-6">
                  {/* Business Information Card */}
                  <div className="rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 p-8 shadow-sm border-2 border-blue-200">
                    <div className="mb-6 flex items-start justify-between">
                      <div>
                        <h2 className="text-xl font-semibold text-blue-900">Business Information</h2>
                        <p className="mt-1 text-sm text-blue-700">Manage your business details and contact information</p>
                      </div>
                      <Building2 className="h-8 w-8 text-blue-600" />
                    </div>

                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-blue-900">Business Name</label>
                          <input
                            type="text"
                            value={businessName}
                            onChange={(e) => setBusinessName(e.target.value)}
                            className="mt-1 w-full rounded-lg border border-blue-300 bg-white px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Enter business name"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-blue-900">Business Phone</label>
                          <input
                            type="tel"
                            value={businessPhone}
                            onChange={(e) => setBusinessPhone(e.target.value)}
                            className="mt-1 w-full rounded-lg border border-blue-300 bg-white px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Enter phone number"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-blue-900">Business Email</label>
                          <input
                            type="email"
                            value={businessEmail}
                            onChange={(e) => setBusinessEmail(e.target.value)}
                            className="mt-1 w-full rounded-lg border border-blue-300 bg-white px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Enter email address"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-blue-900">Website (Optional)</label>
                          <input
                            type="url"
                            value={businessWebsite}
                            onChange={(e) => setBusinessWebsite(e.target.value)}
                            className="mt-1 w-full rounded-lg border border-blue-300 bg-white px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="https://example.com"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-blue-900">Business Address</label>
                        <input
                          type="text"
                          value={businessAddress}
                          onChange={(e) => setBusinessAddress(e.target.value)}
                          className="mt-1 w-full rounded-lg border border-blue-300 bg-white px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Enter full address"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-blue-900">Business Description</label>
                        <textarea
                          value={businessDescription}
                          onChange={(e) => setBusinessDescription(e.target.value)}
                          rows={4}
                          className="mt-1 w-full rounded-lg border border-blue-300 bg-white px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Describe your business..."
                        />
                      </div>

                      <div className="flex justify-end">
                        <Button
                          onClick={handleSaveBusinessInfo}
                          disabled={updateClientMutation.isLoading}
                          className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                        >
                          <Save className="mr-2 h-4 w-4" />
                          {updateClientMutation.isLoading ? "Saving..." : "Save Business Info"}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeSection === "subscription" && user?.role === "USER" && (
                <div className="space-y-6">
                  {/* Current Plan Card */}
                  <div className={`rounded-xl p-8 shadow-sm border-2 ${currentPlan === "PREMIUM"
                    ? "bg-gradient-to-br from-purple-50 to-pink-50 border-purple-300"
                    : currentPlan === "STANDARD"
                      ? "bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-300"
                      : "bg-gradient-to-br from-gray-50 to-slate-50 border-gray-300"
                    }`}>
                    <div className="mb-6 flex items-start justify-between">
                      <div>
                        <h2 className="text-xl font-semibold text-gray-900">Current Subscription</h2>
                        <p className="mt-1 text-sm text-gray-600">Manage your subscription and billing</p>
                      </div>
                      <div className={`rounded-full px-4 py-2 font-bold ${currentPlan === "PREMIUM"
                        ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white"
                        : currentPlan === "STANDARD"
                          ? "bg-gradient-to-r from-blue-500 to-cyan-500 text-white"
                          : "bg-gray-300 text-gray-700"
                        }`}>
                        {currentPlan}
                      </div>
                    </div>

                    {/* Plan Features */}
                    <div className="mb-6 grid grid-cols-3 gap-4">
                      <div className="rounded-lg bg-white/80 p-4 shadow-sm">
                        <Package className="mb-2 h-6 w-6 text-blue-600" />
                        <p className="text-2xl font-bold text-gray-900">
                          {currentPlan === "PREMIUM" ? "Unlimited" : currentPlan === "STANDARD" ? "3" : "0"}
                        </p>
                        <p className="text-xs text-gray-600">Auto-Approval Rules</p>
                      </div>
                      <div className="rounded-lg bg-white/80 p-4 shadow-sm">
                        <Calendar className="mb-2 h-6 w-6 text-green-600" />
                        <p className="text-2xl font-bold text-gray-900">
                          {currentPlan === "BASIC" ? "❌" : "✅"}
                        </p>
                        <p className="text-xs text-gray-600">Calendar Access</p>
                      </div>
                      <div className="rounded-lg bg-white/80 p-4 shadow-sm">
                        <TrendingUp className="mb-2 h-6 w-6 text-purple-600" />
                        <p className="text-2xl font-bold text-gray-900">
                          {currentPlan === "PREMIUM" ? "Unlimited" : currentPlan === "STANDARD" ? "90d" : "30d"}
                        </p>
                        <p className="text-xs text-gray-600">Report History</p>
                      </div>
                    </div>

                    {/* Pricing */}
                    <div className="mb-6 rounded-lg bg-white/80 p-6 shadow-sm">
                      <div className="flex items-baseline justify-between">
                        <div>
                          <p className="text-sm text-gray-600">Monthly Price</p>
                          <p className="text-3xl font-bold text-gray-900">
                            <CurrencyDisplay
                              amount={currentPlan === "PREMIUM" ? 50000 : currentPlan === "STANDARD" ? 25000 : 10000}
                            />
                            <span className="text-base font-normal text-gray-600">/month</span>
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-600">Next Billing Date</p>
                          <p className="font-semibold text-gray-900">February 15, 2024</p>
                        </div>
                      </div>
                    </div>

                    {/* Upgrade/Downgrade Options */}
                    {currentPlan !== "PREMIUM" && (
                      <div className="mb-6">
                        <h3 className="mb-4 font-semibold text-gray-900">Upgrade Your Plan</h3>
                        <div className="grid grid-cols-2 gap-4">
                          {currentPlan === "BASIC" && (
                            <div className="rounded-lg border-2 border-blue-300 bg-gradient-to-br from-blue-50 to-cyan-50 p-6">
                              <div className="mb-4 flex items-center justify-between">
                                <h4 className="text-lg font-bold text-blue-900">STANDARD</h4>
                                <span className="rounded-full bg-blue-500 px-3 py-1 text-sm font-bold text-white">Popular</span>
                              </div>
                              <p className="mb-4 text-2xl font-bold text-blue-900">
                                <CurrencyDisplay amount={25000} />
                                <span className="text-sm font-normal">/mo</span>
                              </p>
                              <ul className="mb-6 space-y-2 text-sm text-blue-800">
                                <li className="flex items-center gap-2">
                                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                                  Calendar Access
                                </li>
                                <li className="flex items-center gap-2">
                                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                                  3 Auto-Approval Rules
                                </li>
                                <li className="flex items-center gap-2">
                                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                                  90-Day Report History
                                </li>
                              </ul>
                              <Button className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700">
                                Upgrade to Standard
                              </Button>
                            </div>
                          )}
                          <div className="rounded-lg border-2 border-purple-300 bg-gradient-to-br from-purple-50 to-pink-50 p-6">
                            <div className="mb-4 flex items-center justify-between">
                              <h4 className="text-lg font-bold text-purple-900">PREMIUM</h4>
                              <span className="rounded-full bg-gradient-to-r from-purple-500 to-pink-500 px-3 py-1 text-sm font-bold text-white">Best Value</span>
                            </div>
                            <p className="mb-4 text-2xl font-bold text-purple-900">
                              <CurrencyDisplay amount={50000} />
                              <span className="text-sm font-normal">/mo</span>
                            </p>
                            <ul className="mb-6 space-y-2 text-sm text-purple-800">
                              <li className="flex items-center gap-2">
                                <CheckCircle2 className="h-4 w-4 text-green-600" />
                                Everything in Standard
                              </li>
                              <li className="flex items-center gap-2">
                                <CheckCircle2 className="h-4 w-4 text-green-600" />
                                Unlimited Auto-Approval
                              </li>
                              <li className="flex items-center gap-2">
                                <CheckCircle2 className="h-4 w-4 text-green-600" />
                                Unlimited Report History
                              </li>
                              <li className="flex items-center gap-2">
                                <CheckCircle2 className="h-4 w-4 text-green-600" />
                                Priority Support
                              </li>
                            </ul>
                            <Button className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
                              Upgrade to Premium
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Payment Method Card */}
                  <div className="rounded-xl bg-white p-8 shadow-sm">
                    <div className="mb-6 flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-gray-900">Payment Method</h3>
                      <Button variant="outline" size="sm">
                        <Plus className="mr-2 h-4 w-4" />
                        Add New
                      </Button>
                    </div>
                    <div className="rounded-lg border-2 border-green-300 bg-gradient-to-br from-green-50 to-emerald-50 p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-4">
                          <div className="rounded-lg bg-white p-3 shadow-sm">
                            <CreditCard className="h-6 w-6 text-green-600" />
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">{paymentMethod.brand} •••• {paymentMethod.last4}</p>
                            <p className="text-sm text-gray-600">Expires {paymentMethod.expiryMonth}/{paymentMethod.expiryYear}</p>
                            <span className="mt-2 inline-block rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
                              Default
                            </span>
                          </div>
                        </div>
                        <Button variant="outline" size="sm">
                          <Edit2 className="mr-2 h-4 w-4" />
                          Edit
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Billing History Card */}
                  <div className="rounded-xl bg-white p-8 shadow-sm">
                    <div className="mb-6 flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-gray-900">Billing History</h3>
                      <Button variant="outline" size="sm">
                        <Download className="mr-2 h-4 w-4" />
                        Download All
                      </Button>
                    </div>
                    <div className="overflow-hidden rounded-lg border border-gray-200">
                      <table className="w-full">
                        <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-gray-700">Date</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-gray-700">Invoice</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-gray-700">Plan</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-gray-700">Amount</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-gray-700">Status</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-gray-700">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 bg-white">
                          {billingHistory.map((bill) => (
                            <tr key={bill.id} className="hover:bg-gray-50">
                              <td className="px-6 py-4 text-sm text-gray-900">
                                {new Date(bill.date).toLocaleDateString("en-US", {
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric"
                                })}
                              </td>
                              <td className="px-6 py-4 text-sm font-mono text-gray-600">{bill.invoiceNumber}</td>
                              <td className="px-6 py-4">
                                <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
                                  {bill.plan}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                                <CurrencyDisplay amount={bill.amount} />
                              </td>
                              <td className="px-6 py-4">
                                <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
                                  <CheckCircle2 className="h-3 w-3" />
                                  {bill.status}
                                </span>
                              </td>
                              <td className="px-6 py-4">
                                <Button variant="outline" size="sm">
                                  <Download className="mr-2 h-4 w-4" />
                                  Download
                                </Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Cancel Subscription */}
                  <div className="rounded-xl border-2 border-red-200 bg-gradient-to-br from-red-50 to-orange-50 p-8 shadow-sm">
                    <div className="flex items-start gap-4">
                      <AlertTriangle className="h-6 w-6 text-red-600" />
                      <div className="flex-1">
                        <h3 className="font-semibold text-red-900">Cancel Subscription</h3>
                        <p className="mt-1 text-sm text-red-800">
                          Canceling your subscription will downgrade you to the FREE plan at the end of your billing period.
                          You&apos;ll lose access to premium features.
                        </p>
                        <Button variant="outline" className="mt-4 border-red-300 text-red-700 hover:bg-red-100">
                          Cancel Subscription
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeSection === "security" && (
                <div className="space-y-6">
                  <div className="rounded-xl bg-white p-8 shadow-sm">
                    <h2 className="mb-6 text-xl font-semibold text-gray-900">Security Settings</h2>

                    {/* Password Management */}
                    <div className="mb-6 rounded-lg border-2 border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 p-6">
                      <div className="flex items-center gap-3">
                        <Lock className="h-6 w-6 text-amber-600" />
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-amber-900">Change Password</h3>
                          <p className="text-sm text-amber-900/70">Update your password regularly for security</p>
                        </div>
                        <Button
                          className="bg-gradient-to-r from-amber-500 to-orange-600 text-white hover:from-amber-600 hover:to-orange-700"
                          onClick={() => setShowPasswordModal(true)}
                        >
                          <Key className="mr-2 h-4 w-4" />
                          Change Password
                        </Button>
                      </div>
                    </div>

                    {/* Two-Factor Authentication */}
                    <div className="mb-6 rounded-lg border bg-white p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Shield className="h-5 w-5 text-green-600" />
                          <div>
                            <h3 className="font-semibold text-gray-900">Two-Factor Authentication</h3>
                            <p className="text-sm text-gray-500">Add an extra layer of security</p>
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          onClick={() => setShow2FAModal(true)}
                        >
                          Enable 2FA
                        </Button>
                      </div>
                    </div>

                    {/* Active Sessions */}
                    <div>
                      <h3 className="mb-4 text-lg font-semibold text-gray-900">Active Sessions</h3>
                      <div className="space-y-3">
                        {activeSessions.map((session) => (
                          <div
                            key={session.id}
                            className={`flex items-center justify-between rounded-lg border p-4 ${session.isCurrent ? 'bg-green-50 border-green-200' : 'bg-white border-gray-200'
                              }`}
                          >
                            <div className="flex items-center gap-3">
                              <div className={`rounded-lg p-3 ${session.isCurrent ? 'bg-green-100' : 'bg-gray-100'}`}>
                                <Globe className={`h-5 w-5 ${session.isCurrent ? 'text-green-600' : 'text-gray-600'}`} />
                              </div>
                              <div>
                                <p className="font-semibold text-gray-900">
                                  {session.device}
                                  {session.isCurrent && <span className="ml-2 text-xs text-green-600">(Current)</span>}
                                </p>
                                <p className="text-sm text-gray-500">
                                  {session.location} • {session.ip}
                                </p>
                                <p className="text-xs text-gray-500">Last active: {session.lastActive}</p>
                              </div>
                            </div>
                            {!session.isCurrent && (
                              <Button variant="outline" size="sm" className="text-red-600 hover:bg-red-50">
                                Terminate
                              </Button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Activity Log */}
                    <div className="mt-8">
                      <div className="mb-4 flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-gray-900">Activity Log</h3>
                        <Button variant="outline" size="sm">
                          <Download className="mr-2 h-4 w-4" />
                          Export
                        </Button>
                      </div>
                      <div className="space-y-3">
                        {activityLogs.map((log) => (
                          <div key={log.id} className="flex items-start gap-3 rounded-lg border border-gray-200 bg-white p-4">
                            <div className="rounded-lg bg-purple-100 p-2">
                              <Activity className="h-5 w-5 text-purple-600" />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-start justify-between">
                                <div>
                                  <p className="font-semibold text-gray-900">{log.action}</p>
                                  <p className="text-xs text-gray-500">{log.device}</p>
                                </div>
                                <span className="text-xs text-gray-500">
                                  {new Date(log.timestamp).toLocaleDateString()}
                                </span>
                              </div>
                              <div className="mt-2 flex items-center gap-4 text-xs text-gray-500">
                                <span className="flex items-center gap-1">
                                  <MapPin className="h-3 w-3" />
                                  {log.location}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Globe className="h-3 w-3" />
                                  {log.ip}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeSection === "notifications" && (
                <div className="space-y-6">
                  <div className="rounded-xl bg-white p-8 shadow-sm">
                    <h2 className="mb-6 text-xl font-semibold text-gray-900">Notification Preferences</h2>

                    {/* Notification Channels */}
                    <div className="mb-8">
                      <h3 className="mb-4 text-lg font-semibold text-gray-900">Notification Channels</h3>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between rounded-lg border border-gray-200 p-4">
                          <div className="flex items-center gap-3">
                            <Mail className="h-5 w-5 text-blue-600" />
                            <div>
                              <h4 className="font-semibold text-gray-900">Email Notifications</h4>
                              <p className="text-sm text-gray-500">Receive updates via email</p>
                            </div>
                          </div>
                          <label className="relative inline-flex cursor-pointer items-center">
                            <input
                              type="checkbox"
                              className="peer sr-only"
                              checked={emailNotifications}
                              onChange={(e) => setEmailNotifications(e.target.checked)}
                            />
                            <div className="peer h-6 w-11 rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-blue-600 peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300"></div>
                          </label>
                        </div>

                        <div className="flex items-center justify-between rounded-lg border border-gray-200 p-4">
                          <div className="flex items-center gap-3">
                            <MessageSquare className="h-5 w-5 text-green-600" />
                            <div>
                              <h4 className="font-semibold text-gray-900">WhatsApp Notifications</h4>
                              <p className="text-sm text-gray-500">Receive updates via WhatsApp</p>
                            </div>
                          </div>
                          <label className="relative inline-flex cursor-pointer items-center">
                            <input
                              type="checkbox"
                              className="peer sr-only"
                              checked={whatsappNotifications}
                              onChange={(e) => setWhatsappNotifications(e.target.checked)}
                            />
                            <div className="peer h-6 w-11 rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-green-600 peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300"></div>
                          </label>
                        </div>

                        <div className="flex items-center justify-between rounded-lg border border-gray-200 p-4">
                          <div className="flex items-center gap-3">
                            <Phone className="h-5 w-5 text-purple-600" />
                            <div>
                              <h4 className="font-semibold text-gray-900">SMS Notifications</h4>
                              <p className="text-sm text-gray-500">Receive updates via SMS</p>
                            </div>
                          </div>
                          <label className="relative inline-flex cursor-pointer items-center">
                            <input
                              type="checkbox"
                              className="peer sr-only"
                              checked={smsNotifications}
                              onChange={(e) => setSmsNotifications(e.target.checked)}
                            />
                            <div className="peer h-6 w-11 rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-purple-600 peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300"></div>
                          </label>
                        </div>
                      </div>
                    </div>

                    {/* Notification Types */}
                    <div>
                      <h3 className="mb-4 text-lg font-semibold text-gray-900">Notification Types</h3>
                      <div className="space-y-3">
                        {[
                          { label: "New Sales", checked: notifySales, onChange: setNotifySales },
                          { label: "Low Stock Alerts", checked: notifyLowStock, onChange: setNotifyLowStock },
                          { label: "Subscription Reminders", checked: notifySubscription, onChange: setNotifySubscription },
                          { label: "Payment Confirmations", checked: notifyPayments, onChange: setNotifyPayments },
                        ].map((item, index) => (
                          <div key={index} className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
                            <span className="text-sm font-medium text-gray-900">{item.label}</span>
                            <label className="relative inline-flex cursor-pointer items-center">
                              <input
                                type="checkbox"
                                className="peer sr-only"
                                checked={item.checked}
                                onChange={(e) => item.onChange(e.target.checked)}
                              />
                              <div className="peer h-6 w-11 rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-amber-500 peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-amber-300"></div>
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="mt-6 flex justify-end">
                      <Button
                        onClick={handleSaveNotificationPreferences}
                        disabled={updateClientMutation.isLoading}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        <Save className="mr-2 h-4 w-4" />
                        {updateClientMutation.isLoading ? "Saving..." : "Save Preferences"}
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {activeSection === "preferences" && (
                <div className="space-y-6">
                  <div className="rounded-xl bg-white p-8 shadow-sm">
                    <h2 className="mb-6 text-xl font-semibold text-gray-900">Preferences</h2>

                    {/* Theme Settings */}
                    <div className="mb-8">
                      <h3 className="mb-4 text-lg font-semibold text-gray-900">Appearance</h3>
                      <div className="grid grid-cols-3 gap-4">
                        {(['light', 'dark', 'system'] as const).map((themeOption) => (
                          <button
                            key={themeOption}
                            onClick={() => updatePreferences({ theme: themeOption })}
                            className={`flex flex-col items-center gap-2 rounded-lg border-2 p-4 transition-all ${preferences.theme === themeOption
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-gray-200 hover:border-blue-400'
                              }`}
                          >
                            {themeOption === 'light' && <Sun className="h-8 w-8 text-amber-500" />}
                            {themeOption === 'dark' && <Moon className="h-8 w-8 text-indigo-500" />}
                            {themeOption === 'system' && <Laptop className="h-8 w-8 text-blue-500" />}
                            <span className={`font-semibold capitalize ${preferences.theme === themeOption ? 'text-blue-600' : 'text-gray-900'
                              }`}>
                              {themeOption}
                            </span>
                            {preferences.theme === themeOption && (
                              <CheckCircle2 className="h-5 w-5 text-blue-600" />
                            )}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Language & Region */}
                    <div className="mb-8">
                      <h3 className="mb-4 text-lg font-semibold text-gray-900">Language & Region</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Language</label>
                          <select
                            value={preferences.language}
                            onChange={(e) => updatePreferences({ language: e.target.value as LanguageKey })}
                            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                          >
                            <option value="English">🇬🇧 English</option>
                            <option value="French">🇫🇷 French (Français)</option>
                            <option value="Spanish">🇪🇸 Spanish (Español)</option>
                            <option value="Portuguese">🇵🇹 Portuguese (Português)</option>
                            <option value="Arabic">🇸🇦 Arabic (العربية)</option>
                            <option value="Swahili">🇰🇪 Swahili (Kiswahili)</option>
                            <option value="Twi">🇬🇭 Twi</option>
                            <option value="Hausa">🇳🇬 Hausa</option>
                            <option value="Yoruba">🇳🇬 Yoruba</option>
                            <option value="Igbo">🇳🇬 Igbo</option>
                            <option value="Amharic">🇪🇹 Amharic (አማርኛ)</option>
                            <option value="Zulu">🇿🇦 Zulu (isiZulu)</option>
                            <option value="Afrikaans">🇿🇦 Afrikaans</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Timezone</label>
                          <select
                            value={preferences.timezone}
                            onChange={(e) => updatePreferences({ timezone: e.target.value })}
                            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                          >
                            <optgroup label="Africa">
                              <option value="GMT">GMT+0 (Accra, Ghana)</option>
                              <option value="WAT">GMT+1 (Lagos, Nigeria)</option>
                              <option value="CAT">GMT+2 (Johannesburg, South Africa)</option>
                              <option value="EAT">GMT+3 (Nairobi, Kenya)</option>
                              <option value="Egypt">GMT+2 (Cairo, Egypt)</option>
                            </optgroup>
                            <optgroup label="Americas">
                              <option value="EST">GMT-5 (New York, USA)</option>
                              <option value="CST">GMT-6 (Chicago, USA)</option>
                              <option value="MST">GMT-7 (Denver, USA)</option>
                              <option value="PST">GMT-8 (Los Angeles, USA)</option>
                              <option value="BRT">GMT-3 (São Paulo, Brazil)</option>
                            </optgroup>
                            <optgroup label="Europe">
                              <option value="GMT_UK">GMT+0 (London, UK)</option>
                              <option value="CET">GMT+1 (Paris, France)</option>
                              <option value="EET">GMT+2 (Athens, Greece)</option>
                            </optgroup>
                            <optgroup label="Asia">
                              <option value="IST">GMT+5:30 (Mumbai, India)</option>
                              <option value="CST_China">GMT+8 (Beijing, China)</option>
                              <option value="JST">GMT+9 (Tokyo, Japan)</option>
                              <option value="SGT">GMT+8 (Singapore)</option>
                              <option value="HKT">GMT+8 (Hong Kong)</option>
                              <option value="GST">GMT+4 (Dubai, UAE)</option>
                            </optgroup>
                            <optgroup label="Oceania">
                              <option value="AEST">GMT+10 (Sydney, Australia)</option>
                              <option value="NZST">GMT+12 (Auckland, New Zealand)</option>
                            </optgroup>
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* Display Settings */}
                    <div>
                      <h3 className="mb-4 text-lg font-semibold text-gray-900">Display</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Currency</label>
                          <select
                            value={preferences.currency}
                            onChange={(e) => updatePreferences({ currency: e.target.value as CurrencyCode })}
                            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                          >
                            <optgroup label="Africa">
                              <option value="GHS">🇬🇭 Ghanaian Cedi (GH₵)</option>
                              <option value="NGN">🇳🇬 Nigerian Naira (₦)</option>
                              <option value="KES">🇰🇪 Kenyan Shilling (KSh)</option>
                              <option value="ZAR">🇿🇦 South African Rand (R)</option>
                              <option value="EGP">🇪🇬 Egyptian Pound (E£)</option>
                              <option value="TZS">🇹🇿 Tanzanian Shilling (TSh)</option>
                              <option value="UGX">🇺🇬 Ugandan Shilling (USh)</option>
                              <option value="MAD">🇲🇦 Moroccan Dirham (DH)</option>
                              <option value="XOF">West African CFA Franc (CFA)</option>
                              <option value="XAF">Central African CFA Franc (FCFA)</option>
                            </optgroup>
                            <optgroup label="Americas">
                              <option value="USD">🇺🇸 US Dollar ($)</option>
                              <option value="CAD">🇨🇦 Canadian Dollar (C$)</option>
                              <option value="BRL">🇧🇷 Brazilian Real (R$)</option>
                              <option value="MXN">🇲🇽 Mexican Peso (Mex$)</option>
                              <option value="ARS">🇦🇷 Argentine Peso ($)</option>
                              <option value="CLP">🇨🇱 Chilean Peso ($)</option>
                              <option value="COP">🇨🇴 Colombian Peso ($)</option>
                              <option value="PEN">🇵🇪 Peruvian Sol (S/)</option>
                            </optgroup>
                            <optgroup label="Europe">
                              <option value="EUR">🇪🇺 Euro (€)</option>
                              <option value="GBP">🇬🇧 British Pound (£)</option>
                              <option value="CHF">🇨🇭 Swiss Franc (CHF)</option>
                              <option value="SEK">🇸🇪 Swedish Krona (kr)</option>
                              <option value="NOK">🇳🇴 Norwegian Krone (kr)</option>
                              <option value="DKK">🇩🇰 Danish Krone (kr)</option>
                              <option value="PLN">🇵🇱 Polish Złoty (zł)</option>
                              <option value="CZK">🇨🇿 Czech Koruna (Kč)</option>
                              <option value="HUF">🇭🇺 Hungarian Forint (Ft)</option>
                              <option value="RON">🇷🇴 Romanian Leu (lei)</option>
                            </optgroup>
                            <optgroup label="Asia">
                              <option value="CNY">🇨🇳 Chinese Yuan (¥)</option>
                              <option value="JPY">🇯🇵 Japanese Yen (¥)</option>
                              <option value="INR">🇮🇳 Indian Rupee (₹)</option>
                              <option value="KRW">🇰🇷 South Korean Won (₩)</option>
                              <option value="SGD">🇸🇬 Singapore Dollar (S$)</option>
                              <option value="HKD">🇭🇰 Hong Kong Dollar (HK$)</option>
                              <option value="THB">🇹🇭 Thai Baht (฿)</option>
                              <option value="MYR">🇲🇾 Malaysian Ringgit (RM)</option>
                              <option value="IDR">🇮🇩 Indonesian Rupiah (Rp)</option>
                              <option value="PHP">🇵🇭 Philippine Peso (₱)</option>
                              <option value="VND">🇻🇳 Vietnamese Dong (₫)</option>
                              <option value="PKR">🇵🇰 Pakistani Rupee (Rs)</option>
                              <option value="BDT">🇧🇩 Bangladeshi Taka (৳)</option>
                              <option value="LKR">🇱🇰 Sri Lankan Rupee (Rs)</option>
                            </optgroup>
                            <optgroup label="Middle East">
                              <option value="AED">🇦🇪 UAE Dirham (د.إ)</option>
                              <option value="SAR">🇸🇦 Saudi Riyal (﷼)</option>
                              <option value="QAR">🇶🇦 Qatari Riyal (﷼)</option>
                              <option value="KWD">🇰🇼 Kuwaiti Dinar (د.ك)</option>
                              <option value="BHD">🇧🇭 Bahraini Dinar (د.ب)</option>
                              <option value="OMR">🇴🇲 Omani Rial (﷼)</option>
                              <option value="JOD">🇯🇴 Jordanian Dinar (د.ا)</option>
                              <option value="ILS">🇮🇱 Israeli Shekel (₪)</option>
                              <option value="TRY">🇹🇷 Turkish Lira (₺)</option>
                            </optgroup>
                            <optgroup label="Oceania">
                              <option value="AUD">🇦🇺 Australian Dollar (A$)</option>
                              <option value="NZD">🇳🇿 New Zealand Dollar (NZ$)</option>
                            </optgroup>
                            <optgroup label="Cryptocurrency">
                              <option value="BTC">₿ Bitcoin (BTC)</option>
                              <option value="ETH">Ξ Ethereum (ETH)</option>
                              <option value="USDT">₮ Tether (USDT)</option>
                            </optgroup>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Date Format</label>
                          <select
                            value={preferences.dateFormat}
                            onChange={(e) => updatePreferences({ dateFormat: e.target.value as any })}
                            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                          >
                            <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                            <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                            <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                            <option>YYYY-MM-DD</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    <div className="mt-6 flex justify-end">
                      <Button
                        onClick={handleSavePreferences}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        <Save className="mr-2 h-4 w-4" />
                        Save Preferences
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Toast Notification */}
      {
        toast && (
          <div className="fixed bottom-4 right-4 z-50 animate-slide-up">
            <div
              className={`rounded-lg px-6 py-4 shadow-lg ${toast.type === "success"
                ? "bg-gradient-to-r from-green-500 to-emerald-600 text-white"
                : "bg-gradient-to-r from-red-500 to-orange-600 text-white"
                }`}
            >
              <div className="flex items-center gap-3">
                {toast.type === "success" ? (
                  <CheckCircle2 className="h-5 w-5" />
                ) : (
                  <XCircle className="h-5 w-5" />
                )}
                <p className="font-medium">{toast.message}</p>
              </div>
            </div>
          </div>
        )
      }

      {/* Password Change Modal */}
      {
        showPasswordModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl">
              <div className="mb-6">
                <div className="mb-4 inline-flex rounded-lg bg-gradient-to-r from-red-100 to-orange-100 p-3">
                  <Lock className="h-6 w-6 text-red-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Change Password</h2>
                <p className="mt-2 text-sm text-gray-600">
                  Make sure your new password is strong and secure
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Current Password</label>
                  <div className="relative mt-1">
                    <input
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className="w-full rounded-lg border border-gray-300 px-4 py-2 pr-10 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      placeholder="Enter current password"
                    />
                    <Eye className="absolute right-3 top-2.5 h-5 w-5 text-gray-400" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">New Password</label>
                  <div className="relative mt-1">
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full rounded-lg border border-gray-300 px-4 py-2 pr-10 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      placeholder="Enter new password"
                    />
                    <Eye className="absolute right-3 top-2.5 h-5 w-5 text-gray-400" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Confirm New Password</label>
                  <div className="relative mt-1">
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full rounded-lg border border-gray-300 px-4 py-2 pr-10 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      placeholder="Confirm new password"
                    />
                    <Eye className="absolute right-3 top-2.5 h-5 w-5 text-gray-400" />
                  </div>
                </div>

                <div className="rounded-lg bg-blue-50 p-4">
                  <p className="text-xs font-semibold text-blue-900">Password Requirements:</p>
                  <ul className="mt-2 space-y-1 text-xs text-blue-800">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-3 w-3" />
                      At least 8 characters long
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-3 w-3" />
                      Contains uppercase and lowercase letters
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-3 w-3" />
                      Contains at least one number
                    </li>
                  </ul>
                </div>
              </div>

              <div className="mt-6 flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    setShowPasswordModal(false);
                    setCurrentPassword("");
                    setNewPassword("");
                    setConfirmPassword("");
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleChangePassword}
                  disabled={changePasswordMutation.isLoading}
                  className="flex-1 bg-gradient-to-r from-red-500 to-orange-600 hover:from-red-600 hover:to-orange-700"
                >
                  {changePasswordMutation.isLoading ? "Updating..." : "Update Password"}
                </Button>
              </div>
            </div>
          </div>
        )
      }

      {/* Delete Account Modal */}
      {
        showDeleteModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl">
              <div className="mb-6">
                <div className="mb-4 inline-flex rounded-lg bg-gradient-to-r from-red-100 to-red-200 p-3">
                  <AlertTriangle className="h-6 w-6 text-red-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Delete Account</h2>
                <p className="mt-2 text-sm text-gray-600">
                  This action cannot be undone. Please be certain.
                </p>
              </div>

              <div className="mb-6 space-y-3 rounded-lg bg-red-50 p-4">
                <p className="text-sm font-semibold text-red-900">This will permanently:</p>
                <ul className="space-y-2 text-sm text-red-800">
                  <li className="flex items-center gap-2">
                    <XCircle className="h-4 w-4" />
                    Delete all your data and contacts
                  </li>
                  <li className="flex items-center gap-2">
                    <XCircle className="h-4 w-4" />
                    Cancel your subscription
                  </li>
                  <li className="flex items-center gap-2">
                    <XCircle className="h-4 w-4" />
                    Remove access for all team members
                  </li>
                </ul>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700">
                  Type <span className="font-bold">DELETE</span> to confirm
                </label>
                <input
                  type="text"
                  className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
                  placeholder="Type DELETE"
                />
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setShowDeleteModal(false)}
                >
                  Cancel
                </Button>
                <Button className="flex-1 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800">
                  Delete Account
                </Button>
              </div>
            </div>
          </div>
        )
      }

      {/* 2FA Setup Modal */}
      {
        show2FAModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl">
              <div className="mb-6">
                <div className="mb-4 inline-flex rounded-lg bg-gradient-to-r from-green-100 to-emerald-100 p-3">
                  <Shield className="h-6 w-6 text-green-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Setup Two-Factor Authentication</h2>
                <p className="mt-2 text-sm text-gray-600">
                  Scan the QR code with your authenticator app
                </p>
              </div>

              <div className="mb-6">
                <div className="flex justify-center rounded-lg bg-gray-100 p-8">
                  <div className="h-48 w-48 rounded-lg bg-white p-4">
                    {/* QR Code placeholder */}
                    <div className="flex h-full items-center justify-center border-2 border-dashed border-gray-300">
                      <p className="text-xs text-gray-500">QR Code</p>
                    </div>
                  </div>
                </div>
                <p className="mt-4 text-center text-xs text-gray-600">
                  Or enter this code manually: <span className="font-mono font-semibold">ABCD EFGH IJKL MNOP</span>
                </p>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700">Verification Code</label>
                <input
                  type="text"
                  className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2 text-center text-2xl font-semibold tracking-widest focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                  placeholder="000000"
                  maxLength={6}
                />
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setShow2FAModal(false)}
                >
                  Cancel
                </Button>
                <Button className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700">
                  Enable 2FA
                </Button>
              </div>
            </div>
          </div>
        )
      }
    </DashboardLayout >
  );
}
