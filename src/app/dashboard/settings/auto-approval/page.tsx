"use client";

import { DashboardLayout } from "@/components/dashboard/layout";
import { CurrencyDisplay } from "@/components/dashboard";
import { trpc } from "@/lib/trpc/client";
import { useState } from "react";
import {
  Shield,
  Plus,
  Edit,
  Trash2,
  Power,
  Settings,
  Users,
  Package,
  DollarSign,
  Clock,
  Layers,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Info,
  Crown,
  Zap,
  TrendingUp,
  Calendar,
  Lock,
  Unlock
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type RuleType = "CUSTOMER" | "PRODUCT" | "AMOUNT" | "TIME" | "COMBINED";

const RULE_TYPE_CONFIG = {
  CUSTOMER: {
    label: "Customer Whitelist",
    description: "Auto-approve orders from specific customers",
    icon: Users,
    color: "from-blue-500 to-indigo-600",
  },
  PRODUCT: {
    label: "Product Whitelist",
    description: "Auto-approve orders containing specific products",
    icon: Package,
    color: "from-green-500 to-emerald-600",
  },
  AMOUNT: {
    label: "Amount Threshold",
    description: "Auto-approve orders within amount range",
    icon: DollarSign,
    color: "from-purple-500 to-pink-600",
  },
  TIME: {
    label: "Time Window",
    description: "Auto-approve orders during specific times",
    icon: Clock,
    color: "from-amber-500 to-orange-600",
  },
  COMBINED: {
    label: "Combined Rules",
    description: "Auto-approve when multiple conditions are met",
    icon: Layers,
    color: "from-indigo-500 to-purple-600",
  },
};

const DAYS_OF_WEEK = [
  { value: "MON", label: "Mon" },
  { value: "TUE", label: "Tue" },
  { value: "WED", label: "Wed" },
  { value: "THU", label: "Thu" },
  { value: "FRI", label: "Fri" },
  { value: "SAT", label: "Sat" },
  { value: "SUN", label: "Sun" },
];

export default function AutoApprovalSettingsPage() {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedRule, setSelectedRule] = useState<any>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [ruleType, setRuleType] = useState<RuleType>("CUSTOMER");

  // Form state for creating/editing rules
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    priority: 1,
    customerPhones: [""],
    productIds: [""],
    minAmount: "",
    maxAmount: "",
    allowedDays: [] as string[],
    startTime: "",
    endTime: "",
  });

  const { data: rulesData, isLoading, refetch } = trpc.autoApproval.list.useQuery({
    page: 1,
    limit: 50,
  });

  const { data: products } = trpc.product.getByClient.useQuery(
    { clientProfileId: rulesData?.tierInfo.plan ? "dummy" : "" },
    { enabled: false }
  );

  const createRuleMutation = trpc.autoApproval.create.useMutation({
    onSuccess: () => {
      refetch();
      setShowCreateModal(false);
      resetForm();
    },
    onError: (error) => {
      alert(error.message);
    },
  });

  const toggleStatusMutation = trpc.autoApproval.toggleStatus.useMutation({
    onSuccess: () => {
      refetch();
    },
  });

  const deleteRuleMutation = trpc.autoApproval.delete.useMutation({
    onSuccess: () => {
      refetch();
      setShowDeleteConfirm(false);
      setSelectedRule(null);
    },
  });

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      priority: 1,
      customerPhones: [""],
      productIds: [""],
      minAmount: "",
      maxAmount: "",
      allowedDays: [],
      startTime: "",
      endTime: "",
    });
    setRuleType("CUSTOMER");
  };

  const handleCreateRule = () => {
    const data: any = {
      name: formData.name,
      description: formData.description,
      ruleType,
      priority: formData.priority,
      isActive: true,
    };

    if (ruleType === "CUSTOMER") {
      data.customerPhones = formData.customerPhones.filter((p) => p.trim() !== "");
    } else if (ruleType === "PRODUCT") {
      data.productIds = formData.productIds.filter((p) => p.trim() !== "");
    } else if (ruleType === "AMOUNT") {
      if (formData.minAmount) data.minAmount = parseFloat(formData.minAmount);
      if (formData.maxAmount) data.maxAmount = parseFloat(formData.maxAmount);
    } else if (ruleType === "TIME") {
      data.allowedDays = formData.allowedDays;
      data.startTime = formData.startTime;
      data.endTime = formData.endTime;
    } else if (ruleType === "COMBINED") {
      if (formData.customerPhones[0]) data.customerPhones = formData.customerPhones.filter((p) => p.trim() !== "");
      if (formData.productIds[0]) data.productIds = formData.productIds.filter((p) => p.trim() !== "");
      if (formData.minAmount) data.minAmount = parseFloat(formData.minAmount);
      if (formData.maxAmount) data.maxAmount = parseFloat(formData.maxAmount);
      if (formData.allowedDays.length > 0) {
        data.allowedDays = formData.allowedDays;
        data.startTime = formData.startTime;
        data.endTime = formData.endTime;
      }
    }

    createRuleMutation.mutate(data);
  };

  const handleToggleStatus = (ruleId: string, currentStatus: boolean) => {
    toggleStatusMutation.mutate({ id: ruleId, isActive: !currentStatus });
  };

  const handleDeleteRule = () => {
    if (selectedRule) {
      deleteRuleMutation.mutate({ id: selectedRule.id });
    }
  };

  const canCreateMore = rulesData
    ? rulesData.tierInfo.rulesUsed < rulesData.tierInfo.rulesLimit
    : false;

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50 p-8">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent flex items-center gap-3">
                <Shield className="w-10 h-10 text-emerald-600" />
                Auto-Approval Rules
              </h1>
              <p className="text-gray-600 mt-1">Automate delivery request approvals with smart rules</p>
            </div>
            <Button
              className="gap-2 bg-gradient-to-r from-emerald-600 to-teal-600"
              onClick={() => setShowCreateModal(true)}
              disabled={!canCreateMore}
            >
              <Plus className="w-4 h-4" />
              Create Rule
            </Button>
          </div>

          {/* Tier Info Card */}
          <Card className="p-6 bg-gradient-to-r from-emerald-50 to-teal-50 border-2 border-emerald-200 shadow-lg">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-4">
                <div className="bg-white p-3 rounded-lg shadow">
                  <Crown className="w-6 h-6 text-emerald-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-emerald-900 mb-1">
                    {rulesData?.tierInfo.plan || "BASIC"} Plan
                  </h3>
                  <p className="text-sm text-emerald-700 mb-3">
                    Using {rulesData?.tierInfo.rulesUsed || 0} of{" "}
                    {rulesData?.tierInfo.rulesLimit === 999999
                      ? "unlimited"
                      : rulesData?.tierInfo.rulesLimit || 0}{" "}
                    rules
                  </p>
                  {rulesData?.tierInfo.plan === "BASIC" && (
                    <div className="flex items-center gap-2 text-amber-700 bg-amber-50 px-3 py-2 rounded-lg">
                      <AlertTriangle className="w-4 h-4" />
                      <span className="text-sm font-semibold">
                        Upgrade to STANDARD or PREMIUM to enable auto-approval
                      </span>
                    </div>
                  )}
                  {rulesData?.tierInfo.plan === "STANDARD" && !canCreateMore && (
                    <div className="flex items-center gap-2 text-amber-700 bg-amber-50 px-3 py-2 rounded-lg">
                      <AlertTriangle className="w-4 h-4" />
                      <span className="text-sm font-semibold">
                        You've reached the limit. Upgrade to PREMIUM for unlimited rules
                      </span>
                    </div>
                  )}
                </div>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-emerald-600">
                  {rulesData?.rules.filter((r) => r.isActive).length || 0}
                </div>
                <div className="text-sm text-emerald-700">Active Rules</div>
              </div>
            </div>
          </Card>

          {/* Rule Type Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {Object.entries(RULE_TYPE_CONFIG).map(([type, config]) => {
              const Icon = config.icon;
              const count = rulesData?.rules.filter((r) => r.ruleType === type).length || 0;

              return (
                <Card
                  key={type}
                  className="p-4 hover:shadow-lg transition-all cursor-pointer border-2 hover:border-emerald-300"
                >
                  <div className={`bg-gradient-to-br ${config.color} text-white p-3 rounded-lg mb-3`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="font-semibold text-gray-900 text-sm mb-1">{config.label}</h3>
                  <p className="text-xs text-gray-600 mb-2">{config.description}</p>
                  <div className="text-2xl font-bold text-emerald-600">{count}</div>
                </Card>
              );
            })}
          </div>

          {/* Rules List */}
          {isLoading ? (
            <div className="py-12 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto"></div>
              <p className="text-gray-600 mt-4">Loading rules...</p>
            </div>
          ) : rulesData?.rules.length === 0 ? (
            <Card className="p-12 text-center shadow-lg">
              <Shield className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No auto-approval rules</h3>
              <p className="text-gray-600 mb-6">
                Create your first rule to automate delivery request approvals
              </p>
              {canCreateMore && (
                <Button
                  className="gap-2"
                  onClick={() => setShowCreateModal(true)}
                >
                  <Plus className="w-4 h-4" />
                  Create Rule
                </Button>
              )}
            </Card>
          ) : (
            <div className="space-y-4">
              {rulesData?.rules.map((rule) => {
                const config = RULE_TYPE_CONFIG[rule.ruleType as RuleType];
                const Icon = config.icon;

                return (
                  <Card
                    key={rule.id}
                    className="overflow-hidden hover:shadow-xl transition-all border-2 hover:border-emerald-300"
                  >
                    <div className="flex items-start gap-4 p-6">
                      {/* Icon */}
                      <div className={`bg-gradient-to-br ${config.color} text-white p-4 rounded-lg flex-shrink-0`}>
                        <Icon className="w-6 h-6" />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <div className="flex items-center gap-3 mb-1">
                              <h3 className="text-lg font-bold text-gray-900">{rule.name}</h3>
                              <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs font-semibold rounded">
                                Priority: {rule.priority}
                              </span>
                              {rule.isActive ? (
                                <span className="flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full">
                                  <CheckCircle2 className="w-3 h-3" />
                                  Active
                                </span>
                              ) : (
                                <span className="flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-600 text-xs font-semibold rounded-full">
                                  <XCircle className="w-3 h-3" />
                                  Inactive
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-gray-600 mb-3">{rule.description || config.description}</p>
                          </div>
                        </div>

                        {/* Rule Details */}
                        <div className="flex flex-wrap gap-3 text-sm">
                          {rule.ruleType === "CUSTOMER" && rule.customerPhones && (
                            <div className="flex items-center gap-2 bg-blue-50 px-3 py-2 rounded-lg">
                              <Users className="w-4 h-4 text-blue-600" />
                              <span className="text-blue-900 font-semibold">
                                {rule.customerPhones.length} customers
                              </span>
                            </div>
                          )}

                          {rule.ruleType === "PRODUCT" && rule.productIds && (
                            <div className="flex items-center gap-2 bg-green-50 px-3 py-2 rounded-lg">
                              <Package className="w-4 h-4 text-green-600" />
                              <span className="text-green-900 font-semibold">
                                {rule.productIds.length} products
                              </span>
                            </div>
                          )}

                          {rule.ruleType === "AMOUNT" && (
                            <div className="flex items-center gap-2 bg-purple-50 px-3 py-2 rounded-lg">
                              <DollarSign className="w-4 h-4 text-purple-600" />
                              <span className="text-purple-900 font-semibold">
                                {rule.minAmount && <CurrencyDisplay amount={rule.minAmount} />}
                                {rule.minAmount && rule.maxAmount && " - "}
                                {rule.maxAmount && <CurrencyDisplay amount={rule.maxAmount} />}
                              </span>
                            </div>
                          )}

                          {rule.ruleType === "TIME" && rule.allowedDays && (
                            <>
                              <div className="flex items-center gap-2 bg-amber-50 px-3 py-2 rounded-lg">
                                <Calendar className="w-4 h-4 text-amber-600" />
                                <span className="text-amber-900 font-semibold">
                                  {rule.allowedDays.join(", ")}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 bg-amber-50 px-3 py-2 rounded-lg">
                                <Clock className="w-4 h-4 text-amber-600" />
                                <span className="text-amber-900 font-semibold">
                                  {rule.startTime} - {rule.endTime}
                                </span>
                              </div>
                            </>
                          )}

                          {rule.ruleType === "COMBINED" && (
                            <div className="flex items-center gap-2 bg-indigo-50 px-3 py-2 rounded-lg">
                              <Layers className="w-4 h-4 text-indigo-600" />
                              <span className="text-indigo-900 font-semibold">
                                Multiple conditions
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex flex-col gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className={rule.isActive ? "text-red-600 border-red-300" : "text-green-600 border-green-300"}
                          onClick={() => handleToggleStatus(rule.id, rule.isActive)}
                        >
                          {rule.isActive ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-red-600 border-red-300"
                          onClick={() => {
                            setSelectedRule(rule);
                            setShowDeleteConfirm(true);
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}

          {/* Info Section */}
          <Card className="p-6 bg-blue-50 border-blue-200">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-blue-900">
                <h4 className="font-semibold mb-2">How Auto-Approval Works</h4>
                <ul className="space-y-1 list-disc list-inside">
                  <li>Rules are evaluated in priority order (1 = highest priority)</li>
                  <li>First matching rule triggers auto-approval</li>
                  <li>Combined rules require ALL conditions to be met</li>
                  <li>Inactive rules are skipped during evaluation</li>
                  <li>Manual approval is always available as a fallback</li>
                </ul>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Create Rule Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 overflow-y-auto" onClick={() => setShowCreateModal(false)}>
          <Card className="max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl my-8" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-emerald-50 to-teal-50">
              <h3 className="text-2xl font-bold text-gray-900">Create Auto-Approval Rule</h3>
              <p className="text-sm text-gray-600 mt-1">Set up conditions for automatic approval</p>
            </div>

            <div className="p-6 space-y-6">
              {/* Basic Info */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Rule Name *
                </label>
                <Input
                  placeholder="e.g., VIP Customer Auto-Approval"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description (Optional)
                </label>
                <Input
                  placeholder="Describe what this rule does"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Priority (1 = Highest)
                </label>
                <Input
                  type="number"
                  min="1"
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) || 1 })}
                />
              </div>

              {/* Rule Type Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Rule Type *
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {Object.entries(RULE_TYPE_CONFIG).map(([type, config]) => {
                    const Icon = config.icon;
                    return (
                      <button
                        key={type}
                        onClick={() => setRuleType(type as RuleType)}
                        className={`p-4 rounded-lg border-2 text-left transition-all ${ruleType === type
                            ? "border-emerald-500 bg-emerald-50"
                            : "border-gray-200 hover:border-emerald-300"
                          }`}
                      >
                        <div className="flex items-center gap-3 mb-2">
                          <Icon className={`w-5 h-5 ${ruleType === type ? "text-emerald-600" : "text-gray-600"}`} />
                          <span className="font-semibold text-sm">{config.label}</span>
                        </div>
                        <p className="text-xs text-gray-600">{config.description}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Conditional Fields Based on Rule Type */}
              {ruleType === "CUSTOMER" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Customer Phone Numbers *
                  </label>
                  {formData.customerPhones.map((phone, index) => (
                    <div key={index} className="flex gap-2 mb-2">
                      <Input
                        placeholder="+234xxxxxxxxxx"
                        value={phone}
                        onChange={(e) => {
                          const newPhones = [...formData.customerPhones];
                          newPhones[index] = e.target.value;
                          setFormData({ ...formData, customerPhones: newPhones });
                        }}
                      />
                      {index === formData.customerPhones.length - 1 && (
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setFormData({ ...formData, customerPhones: [...formData.customerPhones, ""] })}
                        >
                          <Plus className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {ruleType === "PRODUCT" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Product IDs * (Contact admin for product IDs)
                  </label>
                  {formData.productIds.map((id, index) => (
                    <div key={index} className="flex gap-2 mb-2">
                      <Input
                        placeholder="Product ID"
                        value={id}
                        onChange={(e) => {
                          const newIds = [...formData.productIds];
                          newIds[index] = e.target.value;
                          setFormData({ ...formData, productIds: newIds });
                        }}
                      />
                      {index === formData.productIds.length - 1 && (
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setFormData({ ...formData, productIds: [...formData.productIds, ""] })}
                        >
                          <Plus className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {ruleType === "AMOUNT" && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Minimum Amount (Optional)
                    </label>
                    <Input
                      type="number"
                      placeholder="0"
                      value={formData.minAmount}
                      onChange={(e) => setFormData({ ...formData, minAmount: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Maximum Amount (Optional)
                    </label>
                    <Input
                      type="number"
                      placeholder="100000"
                      value={formData.maxAmount}
                      onChange={(e) => setFormData({ ...formData, maxAmount: e.target.value })}
                    />
                  </div>
                </div>
              )}

              {ruleType === "TIME" && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Allowed Days *
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {DAYS_OF_WEEK.map((day) => (
                        <button
                          key={day.value}
                          type="button"
                          onClick={() => {
                            const newDays = formData.allowedDays.includes(day.value)
                              ? formData.allowedDays.filter((d) => d !== day.value)
                              : [...formData.allowedDays, day.value];
                            setFormData({ ...formData, allowedDays: newDays });
                          }}
                          className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all ${formData.allowedDays.includes(day.value)
                              ? "bg-emerald-600 text-white"
                              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                            }`}
                        >
                          {day.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Start Time *
                      </label>
                      <Input
                        type="time"
                        value={formData.startTime}
                        onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        End Time *
                      </label>
                      <Input
                        type="time"
                        value={formData.endTime}
                        onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                      />
                    </div>
                  </div>
                </>
              )}

              {ruleType === "COMBINED" && (
                <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-700 font-semibold">
                    Add any combination of conditions (all must be met):
                  </p>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Customer Phones (Optional)
                    </label>
                    <Input
                      placeholder="+234xxxxxxxxxx (comma separated)"
                      value={formData.customerPhones[0]}
                      onChange={(e) => setFormData({ ...formData, customerPhones: [e.target.value] })}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Min Amount
                      </label>
                      <Input
                        type="number"
                        value={formData.minAmount}
                        onChange={(e) => setFormData({ ...formData, minAmount: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Max Amount
                      </label>
                      <Input
                        type="number"
                        value={formData.maxAmount}
                        onChange={(e) => setFormData({ ...formData, maxAmount: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-gray-200 flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setShowCreateModal(false);
                  resetForm();
                }}
              >
                Cancel
              </Button>
              <Button
                className="flex-1 bg-gradient-to-r from-emerald-600 to-teal-600"
                onClick={handleCreateRule}
                disabled={!formData.name || createRuleMutation.isPending}
              >
                {createRuleMutation.isPending ? "Creating..." : "Create Rule"}
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && selectedRule && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={() => setShowDeleteConfirm(false)}>
          <Card className="max-w-md w-full shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-xl font-bold text-gray-900">Delete Rule</h3>
              <p className="text-sm text-gray-600 mt-1">This action cannot be undone</p>
            </div>
            <div className="p-6">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                <p className="text-sm text-red-900">
                  Are you sure you want to delete <strong>"{selectedRule.name}"</strong>?
                  This will permanently remove the auto-approval rule.
                </p>
              </div>
            </div>
            <div className="p-6 border-t border-gray-200 flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setSelectedRule(null);
                }}
              >
                Cancel
              </Button>
              <Button
                className="flex-1 bg-red-600 hover:bg-red-700"
                onClick={handleDeleteRule}
                disabled={deleteRuleMutation.isPending}
              >
                {deleteRuleMutation.isPending ? "Deleting..." : "Delete Rule"}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </DashboardLayout>
  );
}
