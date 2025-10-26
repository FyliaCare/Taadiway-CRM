'use client';

import { DashboardLayout } from '@/components/dashboard/layout';
import { CurrencyDisplay } from '@/components/dashboard';
import { trpc } from '@/lib/trpc/client';
import { useSession } from 'next-auth/react';
import { useState, useMemo } from 'react';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  MapPin,
  Package,
  User,
  CheckCircle2,
  XCircle,
  Truck,
  TrendingUp,
  Filter,
  Download,
  RefreshCw,
  Navigation,
  Phone,
  Mail,
  Edit3,
  BarChart3,
  Zap,
  Target,
  DollarSign,
  Activity
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Link from 'next/link';

type ViewMode = 'month' | 'week' | 'day';

interface CalendarDay {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  deliveryCount: number;
  revenue: number;
  itemCount: number;
}

interface TimeSlot {
  value: string;
  label: string;
  emoji: string;
}

const TIME_SLOTS: TimeSlot[] = [
  { value: 'morning', label: '8AM - 12PM', emoji: '🌅' },
  { value: 'afternoon', label: '12PM - 5PM', emoji: '☀️' },
  { value: 'evening', label: '5PM - 9PM', emoji: '🌆' },
];

const STATUS_COLORS = {
  PENDING: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  SCHEDULED: 'bg-blue-100 text-blue-800 border-blue-300',
  OUT_FOR_DELIVERY: 'bg-purple-100 text-purple-800 border-purple-300',
  DELIVERED: 'bg-green-100 text-green-800 border-green-300',
  CANCELLED: 'bg-red-100 text-red-800 border-red-300',
};

export default function CalendarPage() {
  const { data: session } = useSession();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedDelivery, setSelectedDelivery] = useState<any>(null);
  const [scheduleDate, setScheduleDate] = useState('');
  const [scheduleTime, setScheduleTime] = useState('morning');
  const [viewMode, setViewMode] = useState<ViewMode>('month');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [draggedDelivery, setDraggedDelivery] = useState<any>(null);

  // Memoize month boundaries for better performance
  const startOfMonth = useMemo(() =>
    new Date(currentDate.getFullYear(), currentDate.getMonth(), 1),
    [currentDate]
  );

  const endOfMonth = useMemo(() =>
    new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0),
    [currentDate]
  );

  const { data: events, refetch: refetchEvents } = trpc.calendar.getEvents.useQuery({
    startDate: startOfMonth,
    endDate: endOfMonth,
  });

  const { data: availableSlots } = trpc.calendar.getAvailableSlots.useQuery(
    {
      date: selectedDate || new Date(),
    },
    {
      enabled: !!selectedDate,
    }
  );

  const { data: dashboardData } = trpc.vendor.getDashboard.useQuery();

  const scheduleDeliveryMutation = trpc.calendar.scheduleDelivery.useMutation({
    onSuccess: () => {
      refetchEvents();
      setSelectedDelivery(null);
      setScheduleDate('');
      setScheduleTime('morning');
    },
  });

  const rescheduleMutation = trpc.calendar.reschedule.useMutation({
    onSuccess: () => {
      refetchEvents();
      setShowRescheduleModal(false);
      setSelectedDelivery(null);
    },
  });

  // Calculate analytics - MUST be before conditional return
  const analytics = useMemo(() => {
    if (!events) return null;

    const totalDeliveries = events.length;
    const totalRevenue = events.reduce((sum, e) => sum + (e.totalAmount || 0), 0);
    const avgRevenue = totalDeliveries > 0 ? totalRevenue / totalDeliveries : 0;
    const totalItems = events.reduce((sum, e) => sum + (e.itemCount || 0), 0);

    const statusCounts = events.reduce((acc, e) => {
      acc[e.status] = (acc[e.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const byTimeSlot = events.reduce((acc, e) => {
      acc[e.time || 'morning'] = (acc[e.time || 'morning'] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const completionRate = totalDeliveries > 0
      ? ((statusCounts.DELIVERED || 0) / totalDeliveries) * 100
      : 0;

    return {
      totalDeliveries,
      totalRevenue,
      avgRevenue,
      totalItems,
      statusCounts,
      byTimeSlot,
      completionRate
    };
  }, [events]);

  // Generate calendar days
  const calendarDays: CalendarDay[] = useMemo(() => {
    const days: CalendarDay[] = [];
    const firstDayOfWeek = startOfMonth.getDay();
    const daysInMonth = endOfMonth.getDate();    // Previous month days
    const prevMonthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth(), 0);
    const prevMonthDays = prevMonthEnd.getDate();
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, prevMonthDays - i);
      const dayDeliveries = events?.filter((e) => {
        if (!e.date) return false;
        const eventDate = new Date(e.date);
        return eventDate.toDateString() === date.toDateString();
      }) || [];

      days.push({
        date,
        isCurrentMonth: false,
        isToday: false,
        deliveryCount: dayDeliveries.length,
        revenue: dayDeliveries.reduce((sum, e) => sum + (e.totalAmount || 0), 0),
        itemCount: dayDeliveries.reduce((sum, e) => sum + (e.itemCount || 0), 0),
      });
    }

    // Current month days
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
      const dayDeliveries = events?.filter((e) => {
        if (!e.date) return false;
        const eventDate = new Date(e.date);
        return eventDate.toDateString() === date.toDateString();
      }) || [];

      days.push({
        date,
        isCurrentMonth: true,
        isToday: date.toDateString() === new Date().toDateString(),
        deliveryCount: dayDeliveries.length,
        revenue: dayDeliveries.reduce((sum, e) => sum + (e.totalAmount || 0), 0),
        itemCount: dayDeliveries.reduce((sum, e) => sum + (e.itemCount || 0), 0),
      });
    }

    // Next month days
    const remainingDays = 42 - days.length;
    for (let day = 1; day <= remainingDays; day++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, day);
      const dayDeliveries = events?.filter((e) => {
        if (!e.date) return false;
        const eventDate = new Date(e.date);
        return eventDate.toDateString() === date.toDateString();
      }) || [];

      days.push({
        date,
        isCurrentMonth: false,
        isToday: false,
        deliveryCount: dayDeliveries.length,
        revenue: dayDeliveries.reduce((sum, e) => sum + (e.totalAmount || 0), 0),
        itemCount: dayDeliveries.reduce((sum, e) => sum + (e.itemCount || 0), 0),
      });
    }

    return days;
  }, [currentDate, events, startOfMonth, endOfMonth]);

  const selectedDayDeliveries = useMemo(() => {
    if (!selectedDate || !events) return [];
    return events.filter((e) => {
      if (!e.date) return false;
      const eventDate = new Date(e.date);
      return eventDate.toDateString() === selectedDate.toDateString();
    });
  }, [selectedDate, events]);

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  const handleSchedule = () => {
    if (!selectedDelivery?.id || !scheduleDate) return;
    scheduleDeliveryMutation.mutate({
      deliveryRequestId: selectedDelivery.id,
      scheduledDate: new Date(scheduleDate),
      preferredTime: scheduleTime as any,
    });
  };

  const handleReschedule = () => {
    if (!selectedDelivery?.id || !scheduleDate) return;
    rescheduleMutation.mutate({
      deliveryRequestId: selectedDelivery.id,
      newDate: new Date(scheduleDate),
      newTime: scheduleTime as any,
    });
  };

  // Tier check - AFTER all hooks
  const currentPlan = dashboardData?.subscription?.plan || 'BASIC';
  const hasCalendarAccess = currentPlan === 'STANDARD' || currentPlan === 'PREMIUM';

  if (!hasCalendarAccess) {
    return (
      <DashboardLayout>
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-8">
          <Card className="max-w-2xl mx-auto p-12 text-center shadow-2xl border-2 border-blue-100">
            <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full mx-auto mb-6 flex items-center justify-center">
              <CalendarIcon className="w-12 h-12 text-white" />
            </div>
            <h2 className="text-3xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Calendar Scheduling
            </h2>
            <p className="text-gray-600 mb-8 text-lg">
              Upgrade to <span className="font-bold text-blue-600">Standard</span> or{' '}
              <span className="font-bold text-indigo-600">Premium</span> plan to access smart calendar scheduling with capacity management.
            </p>
            <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-6 mb-8">
              <h3 className="font-semibold text-blue-900 mb-3">Calendar Features Include:</h3>
              <ul className="text-left space-y-2 text-blue-800">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-blue-600" />
                  <span>Visual monthly calendar view</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-blue-600" />
                  <span>Time slot capacity management</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-blue-600" />
                  <span>Delivery route optimization</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-blue-600" />
                  <span>Automated scheduling conflicts detection</span>
                </li>
              </ul>
            </div>
            <Link href="/dashboard/settings">
              <Button size="lg" className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-8 py-3 text-lg shadow-lg">
                Upgrade Now
              </Button>
            </Link>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 p-8">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Delivery Calendar
              </h1>
              <p className="text-gray-600 mt-1">Smart scheduling and capacity management</p>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" size="sm" className="gap-2">
                <Filter className="w-4 h-4" />
                Filter
              </Button>
              <Button variant="outline" size="sm" className="gap-2">
                <Download className="w-4 h-4" />
                Export
              </Button>
              <Button size="sm" className="gap-2 bg-gradient-to-r from-blue-600 to-indigo-600" onClick={() => refetchEvents()}>
                <RefreshCw className="w-4 h-4" />
                Refresh
              </Button>
            </div>
          </div>

          {/* Analytics Dashboard */}
          {analytics && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Total Deliveries */}
              <Card className="p-6 bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg hover:shadow-xl transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="text-blue-100 text-sm font-medium">Total Deliveries</p>
                    <p className="text-4xl font-bold mt-2">{analytics.totalDeliveries}</p>
                  </div>
                  <div className="bg-white/20 p-3 rounded-lg">
                    <Truck className="w-6 h-6" />
                  </div>
                </div>
                <p className="text-blue-100 text-sm">{analytics.totalItems} total items</p>
              </Card>

              {/* Total Revenue */}
              <Card className="p-6 bg-gradient-to-br from-green-500 to-emerald-600 text-white shadow-lg hover:shadow-xl transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="text-green-100 text-sm font-medium">Total Revenue</p>
                    <p className="text-4xl font-bold mt-2">
                      <CurrencyDisplay amount={analytics.totalRevenue} />
                    </p>
                  </div>
                  <div className="bg-white/20 p-3 rounded-lg">
                    <DollarSign className="w-6 h-6" />
                  </div>
                </div>
                <p className="text-green-100 text-sm">
                  Avg: <CurrencyDisplay amount={Math.round(analytics.avgRevenue)} />
                </p>
              </Card>

              {/* Out for Delivery */}
              <Card className="p-6 bg-gradient-to-br from-purple-500 to-purple-600 text-white shadow-lg hover:shadow-xl transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="text-purple-100 text-sm font-medium">Out for Delivery</p>
                    <p className="text-4xl font-bold mt-2">{analytics.statusCounts.OUT_FOR_DELIVERY || 0}</p>
                  </div>
                  <div className="bg-white/20 p-3 rounded-lg">
                    <Activity className="w-6 h-6" />
                  </div>
                </div>
                <p className="text-purple-100 text-sm">In transit</p>
              </Card>

              {/* Success Rate */}
              <Card className="p-6 bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-lg hover:shadow-xl transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="text-amber-100 text-sm font-medium">Success Rate</p>
                    <p className="text-4xl font-bold mt-2">{Math.round(analytics.completionRate)}%</p>
                  </div>
                  <div className="bg-white/20 p-3 rounded-lg">
                    <Target className="w-6 h-6" />
                  </div>
                </div>
                <p className="text-amber-100 text-sm">{analytics.statusCounts.DELIVERED || 0} delivered</p>
              </Card>
            </div>
          )}

          {/* Time Slot Distribution */}
          {analytics && (
            <Card className="p-6 shadow-lg">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-blue-600" />
                Delivery Time Distribution
              </h3>
              <div className="grid grid-cols-3 gap-4">
                {TIME_SLOTS.map((slot) => {
                  const count = analytics.byTimeSlot[slot.value] || 0;
                  const percentage = analytics.totalDeliveries > 0
                    ? (count / analytics.totalDeliveries) * 100
                    : 0;

                  return (
                    <div key={slot.value} className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium flex items-center gap-2">
                          <span className="text-2xl">{slot.emoji}</span>
                          {slot.label}
                        </span>
                        <span className="text-gray-600">{count}</span>
                      </div>
                      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full transition-all"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <p className="text-xs text-gray-500">{Math.round(percentage)}%</p>
                    </div>
                  );
                })}
              </div>
            </Card>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Calendar Grid */}
            <Card className="lg:col-span-2 p-6 shadow-lg">
              {/* Month Navigation */}
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">
                  {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </h2>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={handlePrevMonth}>
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleNextMonth}>
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Day Headers */}
              <div className="grid grid-cols-7 gap-2 mb-2">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                  <div key={day} className="text-center text-sm font-semibold text-gray-600 py-2">
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar Days */}
              <div className="grid grid-cols-7 gap-2">
                {calendarDays.map((day, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedDate(day.date)}
                    className={`
                    min-h-[100px] p-2 rounded-lg border-2 transition-all hover:shadow-md hover:scale-105 
                    ${day.isCurrentMonth ? 'bg-white border-gray-200' : 'bg-gray-50 border-gray-100'}
                    ${day.isToday ? 'ring-2 ring-blue-500 border-blue-500' : ''}
                    ${selectedDate?.toDateString() === day.date.toDateString() ? 'bg-blue-50 border-blue-400' : ''}
                  `}
                  >
                    <div className="flex flex-col h-full">
                      <div className="flex items-center justify-between mb-1">
                        <span className={`text-sm font-semibold ${day.isToday ? 'text-blue-600' :
                          day.isCurrentMonth ? 'text-gray-900' : 'text-gray-400'
                          }`}>
                          {day.date.getDate()}
                        </span>
                        {day.deliveryCount > 0 && (
                          <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full font-medium">
                            {day.deliveryCount}
                          </span>
                        )}
                      </div>

                      {day.revenue > 0 && (
                        <div className="mt-auto">
                          <div className="text-xs text-green-700 font-semibold bg-green-50 px-1.5 py-0.5 rounded">
                            <CurrencyDisplay amount={day.revenue} compact />
                          </div>
                        </div>
                      )}

                      {day.deliveryCount > 0 && (
                        <div className="flex gap-1 mt-1 flex-wrap">
                          {events?.filter((e) => {
                            if (!e.date) return false;
                            const eventDate = new Date(e.date);
                            return eventDate.toDateString() === day.date.toDateString();
                          }).slice(0, 2).map((delivery) => (
                            <div
                              key={delivery.id}
                              className={`w-2 h-2 rounded-full ${delivery.status === 'DELIVERED' ? 'bg-green-500' :
                                delivery.status === 'OUT_FOR_DELIVERY' ? 'bg-purple-500 animate-pulse' :
                                  delivery.status === 'SCHEDULED' ? 'bg-blue-500' :
                                    'bg-yellow-500'
                                }`}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </Card>

            {/* Selected Date Details */}
            <Card className="p-6 shadow-lg h-fit sticky top-8">
              {selectedDate ? (
                <>
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold">
                      {selectedDate.toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        weekday: 'short'
                      })}
                    </h3>
                    <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                      {selectedDayDeliveries.length} deliveries
                    </span>
                  </div>

                  {/* Time Slot Capacity */}
                  <div className="space-y-3 mb-6">
                    {TIME_SLOTS.map((slot) => {
                      const slotData = availableSlots?.find(s => s.time === slot.value);
                      const available = slotData?.available || 0;
                      const capacity = slotData?.capacity || 5;
                      const percentage = (available / capacity) * 100;

                      return (
                        <div key={slot.value} className="space-y-1.5">
                          <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2">
                              <span className="text-lg">{slot.emoji}</span>
                              <span className="font-medium">{slot.label}</span>
                            </div>
                            <span className={`text-xs font-semibold px-2 py-1 rounded ${available > 2 ? 'bg-green-100 text-green-700' :
                              available > 0 ? 'bg-yellow-100 text-yellow-700' :
                                'bg-red-100 text-red-700'
                              }`}>
                              {available}/{capacity}
                            </span>
                          </div>
                          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${percentage > 60 ? 'bg-green-500' :
                                percentage > 20 ? 'bg-yellow-500' :
                                  'bg-red-500'
                                }`}
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Deliveries List */}
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {selectedDayDeliveries.length > 0 ? (
                      selectedDayDeliveries.map((delivery) => (
                        <button
                          key={delivery.id}
                          onClick={() => setSelectedDelivery(delivery)}
                          className="w-full text-left p-3 rounded-lg border-2 hover:border-blue-400 hover:shadow-md transition-all bg-white"
                        >
                          <div className="flex items-start justify-between mb-2">
                            <h4 className="font-semibold text-sm">{delivery.title}</h4>
                            <span className={`text-xs px-2 py-0.5 rounded-full border ${STATUS_COLORS[delivery.status as keyof typeof STATUS_COLORS]
                              }`}>
                              {delivery.status}
                            </span>
                          </div>
                          <div className="space-y-1 text-xs text-gray-600">
                            <div className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              <span>{TIME_SLOTS.find(s => s.value === delivery.time)?.label || delivery.time}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              <span className="truncate">{delivery.address}</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-1">
                                <Package className="w-3 h-3" />
                                <span>{delivery.itemCount} items</span>
                              </div>
                              <span className="font-semibold text-green-700">
                                <CurrencyDisplay amount={delivery.totalAmount || 0} />
                              </span>
                            </div>
                            {delivery.assignedTo && (
                              <div className="flex items-center gap-1 text-blue-600">
                                <User className="w-3 h-3" />
                                <span>{delivery.assignedTo}</span>
                              </div>
                            )}
                          </div>
                        </button>
                      ))
                    ) : (
                      <div className="text-center py-8 text-gray-400">
                        <CalendarIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">No deliveries scheduled</p>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="text-center py-12 text-gray-400">
                  <CalendarIcon className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p className="text-sm">Select a date to view deliveries</p>
                </div>
              )}
            </Card>
          </div>

          {/* Delivery Detail Modal */}
          {selectedDelivery && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={() => setSelectedDelivery(null)}>
              <Card className="max-w-2xl w-full p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <h3 className="text-2xl font-bold mb-1">{selectedDelivery.title}</h3>
                    <span className={`text-sm px-3 py-1 rounded-full border ${STATUS_COLORS[selectedDelivery.status as keyof typeof STATUS_COLORS]
                      }`}>
                      {selectedDelivery.status}
                    </span>
                  </div>
                  <button onClick={() => setSelectedDelivery(null)} className="text-gray-400 hover:text-gray-600">
                    <XCircle className="w-6 h-6" />
                  </button>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="bg-green-50 p-4 rounded-lg text-center">
                    <p className="text-2xl font-bold text-green-700">
                      <CurrencyDisplay amount={selectedDelivery.totalAmount || 0} />
                    </p>
                    <p className="text-xs text-green-600 mt-1">Total Amount</p>
                  </div>
                  <div className="bg-blue-50 p-4 rounded-lg text-center">
                    <p className="text-2xl font-bold text-blue-700">{selectedDelivery.itemCount}</p>
                    <p className="text-xs text-blue-600 mt-1">Items</p>
                  </div>
                  <div className="bg-purple-50 p-4 rounded-lg text-center">
                    <p className="text-2xl font-bold text-purple-700">{selectedDelivery.time?.toUpperCase()}</p>
                    <p className="text-xs text-purple-600 mt-1">Time Slot</p>
                  </div>
                </div>

                <div className="space-y-4 mb-6">
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <MapPin className="w-5 h-5 text-gray-600" />
                    <div>
                      <p className="text-xs text-gray-500">Delivery Address</p>
                      <p className="font-medium">{selectedDelivery.address}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <Clock className="w-5 h-5 text-gray-600" />
                    <div>
                      <p className="text-xs text-gray-500">Scheduled Time</p>
                      <p className="font-medium">
                        {new Date(selectedDelivery.date).toLocaleDateString()} - {
                          TIME_SLOTS.find(s => s.value === selectedDelivery.time)?.label || selectedDelivery.time
                        }
                      </p>
                    </div>
                  </div>

                  {selectedDelivery.assignedTo && (
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <User className="w-5 h-5 text-gray-600" />
                      <div>
                        <p className="text-xs text-gray-500">Assigned To</p>
                        <p className="font-medium">{selectedDelivery.assignedTo}</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    className="flex-1 gap-2"
                    onClick={() => setShowRescheduleModal(true)}
                  >
                    <Edit3 className="w-4 h-4" />
                    Reschedule
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1 gap-2"
                  >
                    <Navigation className="w-4 h-4" />
                    View Route
                  </Button>
                  <Button
                    className="flex-1 gap-2 bg-gradient-to-r from-blue-600 to-indigo-600"
                    onClick={() => setSelectedDelivery(null)}
                  >
                    Close
                  </Button>
                </div>
              </Card>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
