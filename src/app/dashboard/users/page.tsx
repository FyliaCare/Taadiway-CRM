"use client";

import { DashboardLayout } from "@/components/dashboard/layout";
import { trpc } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
import { 
  Users, Plus, Search, Edit, Trash2, Lock, Shield, 
  CheckCircle, XCircle, Eye, Mail, Phone, UserCog,
  AlertTriangle, Key, Ban, MoreVertical, Filter
} from "lucide-react";
import { useState } from "react";
import { useSession } from "next-auth/react";

export default function UsersPage() {
  const { data: session } = useSession();
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("ALL");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Form states for creating user
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "STAFF" as const,
    phone: "",
    whatsappNumber: "",
    position: "",
    department: "",
  });

  // Permission states
  const [permissions, setPermissions] = useState({
    canManageClients: false,
    canRecordSales: false,
    canManageInventory: false,
    canManageUsers: false,
    canViewReports: true,
    canManageSettings: false,
    canDeleteData: false,
    canManagePayments: false,
    canExportData: false,
    canManageProducts: false,
    canApproveRefunds: false,
    maxDiscountPercent: 0,
    restrictedToClients: [],
  });

  const { data: currentUserPermissions } = trpc.user.getPermissions.useQuery();
  const { data: users, refetch } = trpc.user.list.useQuery({ includeInactive: false });
  const createUserMutation = trpc.user.create.useMutation();
  const updateUserMutation = trpc.user.updateUser.useMutation();
  const deleteUserMutation = trpc.user.delete.useMutation();
  const deactivateMutation = trpc.user.deactivate.useMutation();

  const canManageUsers = currentUserPermissions?.isSuperAdmin || currentUserPermissions?.permissions?.canManageUsers;

  const filteredUsers = users?.filter((user) => {
    const matchesSearch = user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         user.email?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === "ALL" || user.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const handleCreateUser = async () => {
    try {
      await createUserMutation.mutateAsync({
        ...formData,
        permissions,
      });
      setShowCreateModal(false);
      refetch();
      // Reset form
      setFormData({
        name: "",
        email: "",
        password: "",
        role: "STAFF",
        phone: "",
        whatsappNumber: "",
        position: "",
        department: "",
      });
      setPermissions({
        canManageClients: false,
        canRecordSales: false,
        canManageInventory: false,
        canManageUsers: false,
        canViewReports: true,
        canManageSettings: false,
        canDeleteData: false,
        canManagePayments: false,
        canExportData: false,
        canManageProducts: false,
        canApproveRefunds: false,
        maxDiscountPercent: 0,
        restrictedToClients: [],
      });
    } catch (error: any) {
      alert(error.message);
    }
  };

  const handleDeactivateUser = async (userId: string) => {
    try {
      await deactivateMutation.mutateAsync({ userId });
      refetch();
    } catch (error: any) {
      alert(error.message);
    }
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;
    try {
      await deleteUserMutation.mutateAsync({ userId: selectedUser.id });
      setShowDeleteConfirm(false);
      setSelectedUser(null);
      refetch();
    } catch (error: any) {
      alert(error.message);
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "SUPER_ADMIN": return "bg-purple-100 text-purple-800 border-purple-300";
      case "ADMIN": return "bg-red-100 text-red-800 border-red-300";
      case "MANAGER": return "bg-blue-100 text-blue-800 border-blue-300";
      case "STAFF": return "bg-green-100 text-green-800 border-green-300";
      default: return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  if (!canManageUsers) {
    return (
      <DashboardLayout>
        <div className="flex h-[calc(100vh-200px)] items-center justify-center">
          <div className="text-center">
            <Shield className="mx-auto h-16 w-16 text-gray-400" />
            <h2 className="mt-4 text-xl font-semibold text-gray-900">Access Denied</h2>
            <p className="mt-2 text-gray-600">You don&apos;t have permission to manage users.</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 p-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
            <p className="mt-1 text-gray-600">Manage system users and their permissions</p>
          </div>
          <Button 
            onClick={() => setShowCreateModal(true)}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add New User
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
          <div className="rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 p-6 text-white shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-100">Total Users</p>
                <p className="mt-2 text-3xl font-bold">{users?.length || 0}</p>
              </div>
              <Users className="h-12 w-12 text-blue-200" />
            </div>
          </div>

          <div className="rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 p-6 text-white shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-100">Admins</p>
                <p className="mt-2 text-3xl font-bold">
                  {users?.filter(u => u.role === "ADMIN" || u.role === "SUPER_ADMIN").length || 0}
                </p>
              </div>
              <Shield className="h-12 w-12 text-purple-200" />
            </div>
          </div>

          <div className="rounded-xl bg-gradient-to-br from-green-500 to-green-600 p-6 text-white shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-100">Active Users</p>
                <p className="mt-2 text-3xl font-bold">
                  {users?.filter(u => u.isActive).length || 0}
                </p>
              </div>
              <CheckCircle className="h-12 w-12 text-green-200" />
            </div>
          </div>

          <div className="rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 p-6 text-white shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-orange-100">Staff</p>
                <p className="mt-2 text-3xl font-bold">
                  {users?.filter(u => u.role === "STAFF").length || 0}
                </p>
              </div>
              <UserCog className="h-12 w-12 text-orange-200" />
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-4 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div className="flex items-center gap-3">
              <Filter className="h-5 w-5 text-gray-400" />
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="ALL">All Roles</option>
                <option value="SUPER_ADMIN">Super Admin</option>
                <option value="ADMIN">Admin</option>
                <option value="MANAGER">Manager</option>
                <option value="STAFF">Staff</option>
                <option value="USER">User</option>
              </select>
            </div>
          </div>
        </div>

        {/* Users Table */}
        <div className="rounded-xl bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-gray-200 bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">User</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Role</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Department</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Status</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Permissions</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredUsers?.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-white font-semibold">
                          {user.name?.[0]?.toUpperCase() || "U"}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-gray-900">{user.name}</p>
                            {user.isSuperAdmin && (
                              <Shield className="h-4 w-4 text-purple-600" aria-label="Super Admin - Cannot be deleted" />
                            )}
                          </div>
                          <p className="text-sm text-gray-500">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-semibold ${getRoleBadgeColor(user.role)}`}>
                        {user.role.replace("_", " ")}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-900">{user.adminProfile?.department || "—"}</p>
                      <p className="text-xs text-gray-500">{user.adminProfile?.position || ""}</p>
                    </td>
                    <td className="px-6 py-4">
                      {user.isActive ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-800">
                          <CheckCircle className="h-3 w-3" />
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-800">
                          <XCircle className="h-3 w-3" />
                          Inactive
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {user.adminProfile?.canManageUsers && (
                          <span className="rounded bg-purple-100 px-2 py-0.5 text-xs text-purple-800">Users</span>
                        )}
                        {user.adminProfile?.canManageClients && (
                          <span className="rounded bg-blue-100 px-2 py-0.5 text-xs text-blue-800">Clients</span>
                        )}
                        {user.adminProfile?.canManageInventory && (
                          <span className="rounded bg-green-100 px-2 py-0.5 text-xs text-green-800">Inventory</span>
                        )}
                        {user.adminProfile?.canRecordSales && (
                          <span className="rounded bg-orange-100 px-2 py-0.5 text-xs text-orange-800">Sales</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedUser(user);
                            setShowEditModal(true);
                          }}
                          disabled={user.isSuperAdmin}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        {!user.isSuperAdmin && currentUserPermissions?.isSuperAdmin && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedUser(user);
                              setShowDeleteConfirm(true);
                            }}
                            className="text-red-600 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                        {!user.isSuperAdmin && user.isActive && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeactivateUser(user.id)}
                            className="text-orange-600 hover:bg-orange-50"
                          >
                            <Ban className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Create User Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white p-8 shadow-xl">
            <div className="mb-6">
              <div className="mb-4 inline-flex rounded-lg bg-gradient-to-r from-blue-100 to-indigo-100 p-3">
                <UserCog className="h-6 w-6 text-blue-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Create New User</h2>
              <p className="mt-2 text-sm text-gray-600">Add a new user to the system with specific permissions</p>
            </div>

            <div className="space-y-6">
              {/* Basic Information */}
              <div>
                <h3 className="mb-4 text-lg font-semibold text-gray-900">Basic Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Full Name *</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      placeholder="John Doe"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Email *</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      placeholder="john@example.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Password *</label>
                    <input
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      placeholder="Min. 8 characters"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Role *</label>
                    <select
                      value={formData.role}
                      onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
                      className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="STAFF">Staff</option>
                      <option value="MANAGER">Manager</option>
                      <option value="ADMIN">Admin</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Phone</label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      placeholder="+233 XXX XXX XXX"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">WhatsApp Number</label>
                    <input
                      type="tel"
                      value={formData.whatsappNumber}
                      onChange={(e) => setFormData({ ...formData, whatsappNumber: e.target.value })}
                      className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      placeholder="+233 XXX XXX XXX"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Position</label>
                    <input
                      type="text"
                      value={formData.position}
                      onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                      className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      placeholder="Sales Manager"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Department</label>
                    <input
                      type="text"
                      value={formData.department}
                      onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                      className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      placeholder="Sales & Marketing"
                    />
                  </div>
                </div>
              </div>

              {/* Permissions */}
              <div>
                <h3 className="mb-4 text-lg font-semibold text-gray-900">Permissions</h3>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { key: "canManageClients", label: "Manage Clients", icon: Users },
                    { key: "canRecordSales", label: "Record Sales", icon: CheckCircle },
                    { key: "canManageInventory", label: "Manage Inventory", icon: UserCog },
                    { key: "canManageUsers", label: "Manage Users", icon: Shield },
                    { key: "canViewReports", label: "View Reports", icon: Eye },
                    { key: "canManageSettings", label: "Manage Settings", icon: UserCog },
                    { key: "canDeleteData", label: "Delete Data", icon: Trash2 },
                    { key: "canManagePayments", label: "Manage Payments", icon: CheckCircle },
                    { key: "canExportData", label: "Export Data", icon: CheckCircle },
                    { key: "canManageProducts", label: "Manage Products", icon: UserCog },
                    { key: "canApproveRefunds", label: "Approve Refunds", icon: CheckCircle },
                  ].map((perm) => (
                    <label key={perm.key} className="flex items-center gap-3 rounded-lg border border-gray-200 p-3 hover:bg-gray-50 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={permissions[perm.key as keyof typeof permissions] as boolean}
                        onChange={(e) => setPermissions({ ...permissions, [perm.key]: e.target.checked })}
                        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm font-medium text-gray-900">{perm.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-8 flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setShowCreateModal(false)}
              >
                Cancel
              </Button>
              <Button 
                className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                onClick={handleCreateUser}
                disabled={createUserMutation.isLoading}
              >
                {createUserMutation.isLoading ? "Creating..." : "Create User"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl">
            <div className="mb-6">
              <div className="mb-4 inline-flex rounded-lg bg-gradient-to-r from-red-100 to-red-200 p-3">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Delete User</h2>
              <p className="mt-2 text-sm text-gray-600">
                Are you sure you want to delete <strong>{selectedUser.name}</strong>? This action cannot be undone.
              </p>
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setSelectedUser(null);
                }}
              >
                Cancel
              </Button>
              <Button 
                className="flex-1 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800"
                onClick={handleDeleteUser}
                disabled={deleteUserMutation.isLoading}
              >
                {deleteUserMutation.isLoading ? "Deleting..." : "Delete User"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
