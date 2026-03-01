"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar, Users, ChevronLeft, ChevronRight, Filter, Bell, Send, CheckCircle2, AlertCircle, Car, Truck } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Event {
  id: string;
  name: string;
  date: string;
  startTime: string;
  status: string;
  requireBigTruck?: boolean;
  requireSmallTruck?: boolean;
  venue?: { name: string } | null;
  eventStaff: {
    id: string;
    staff: { id: string; name: string; skill: string; canDrive?: boolean };
    workRole: string;
    attendanceStatus: string;
    notified?: boolean;
    vehicle?: string | null;
    isDriver?: boolean;
  }[];
}

interface Staff {
  id: string;
  name: string;
  phone: string;
  skill: string;
  perEventSalary: number;
  canDrive?: boolean;
  hasOwnCar?: boolean;
  isAvailable: boolean;
  unavailableReason: string | null;
  hasConflict: boolean;
  conflicts: { eventId: string; eventTitle: string }[];
}

interface AvailabilityData {
  date: string;
  available: Staff[];
  unavailable: Staff[];
  conflicting: Staff[];
  summary: {
    total: number;
    available: number;
    unavailable: number;
    conflicting: number;
  };
}

const statusLabels: Record<string, string> = {
  PENDING: "待確認",
  CONFIRMED: "已確認",
  IN_PROGRESS: "進行中",
  COMPLETED: "已完成",
  CANCELLED: "已取消",
};

const skillLabels: Record<string, string> = {
  FRONT: "外場",
  HOT: "熱台",
  BOTH: "皆可",
};

const workRoleLabels: Record<string, string> = {
  FRONT: "外場",
  HOT: "熱台",
  ASSIST: "助手",
  LEAD: "領班",
};

const vehicleLabels: Record<string, string> = {
  BIG_TRUCK: "大餐車",
  SMALL_TRUCK: "小餐車",
  MANAGER_CAR: "店長車",
  OWN_CAR: "自行開車",
};

const vehicleCapacity: Record<string, number> = {
  BIG_TRUCK: 3,      // 駕駛 1 + 乘客 2
  SMALL_TRUCK: 2,    // 駕駛 1 + 乘客 1
  MANAGER_CAR: 4,    // 駕駛 1 + 乘客 3
};

export default function SchedulingPage() {
  const router = useRouter();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [availabilityData, setAvailabilityData] = useState<AvailabilityData | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<Set<string>>(new Set());
  const [skillFilter, setSkillFilter] = useState<string>("all");
  const [showConflicting, setShowConflicting] = useState(false);
  const [notifyStatus, setNotifyStatus] = useState<{ pending: number; notified: number } | null>(null);
  const [sending, setSending] = useState(false);
  const [vehicleUpdating, setVehicleUpdating] = useState<string | null>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const fetchEvents = async () => {
    try {
      const startDate = `${year}-${String(month + 1).padStart(2, "0")}-01`;
      const lastDay = new Date(year, month + 1, 0).getDate();
      const endDate = `${year}-${String(month + 1).padStart(2, "0")}-${lastDay}`;
      
      const response = await fetch(
        `/api/v1/events?startDate=${startDate}&endDate=${endDate}`
      );
      if (!response.ok) throw new Error("取得活動失敗");
      const data = await response.json();
      
      // Fetch staff for each event
      const eventsWithStaff = await Promise.all(
        data.map(async (event: Event) => {
          const staffRes = await fetch(`/api/v1/events/${event.id}/staff`);
          const staffData = staffRes.ok ? await staffRes.json() : { eventStaff: [] };
          return { ...event, eventStaff: staffData.eventStaff || [] };
        })
      );
      
      setEvents(eventsWithStaff);
    } catch (error) {
      toast.error("無法載入活動");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    fetchEvents();
  }, [currentDate]);

  const fetchAvailability = async (dateStr: string) => {
    try {
      const response = await fetch(`/api/v1/availability?date=${dateStr}`);
      if (!response.ok) throw new Error("取得可用性失敗");
      const data = await response.json();
      setAvailabilityData(data);
    } catch (error) {
      toast.error("無法載入員工可用性");
    }
  };

  const handleEventClick = async (event: Event) => {
    setSelectedEvent(event);
    setSelectedStaff(new Set(event.eventStaff.map((es) => es.staff.id)));
    await fetchAvailability(event.date.split("T")[0]);
    await fetchNotifyStatus(event.id);
    setDialogOpen(true);
  };

  const fetchNotifyStatus = async (eventId: string) => {
    try {
      const response = await fetch(`/api/v1/events/${eventId}/notify`);
      if (response.ok) {
        const data = await response.json();
        setNotifyStatus({ pending: data.pending, notified: data.notified });
      }
    } catch (error) {
      console.error("Failed to fetch notify status:", error);
    }
  };

  const handleSendNotifications = async () => {
    if (!selectedEvent) return;
    
    setSending(true);
    try {
      const response = await fetch(`/api/v1/events/${selectedEvent.id}/notify`, {
        method: "POST",
      });
      
      if (!response.ok) throw new Error("發送失敗");
      
      const data = await response.json();
      toast.success(data.message);
      
      // 更新通知狀態
      await fetchNotifyStatus(selectedEvent.id);
    } catch (error) {
      toast.error("發送通知失敗");
    } finally {
      setSending(false);
    }
  };

  // 批次發送所有未通知的排班
  const handleBatchNotify = async () => {
    setSending(true);
    let totalSent = 0;
    let totalFailed = 0;
    
    try {
      // 找出所有有未通知人員的活動
      const eventsToNotify = events.filter(e => 
        e.eventStaff.some(es => !es.notified)
      );
      
      if (eventsToNotify.length === 0) {
        toast.info("所有排班人員皆已通知");
        setSending(false);
        return;
      }
      
      for (const event of eventsToNotify) {
        try {
          const response = await fetch(`/api/v1/events/${event.id}/notify`, {
            method: "POST",
          });
          
          if (response.ok) {
            const data = await response.json();
            totalSent += data.sent;
            totalFailed += data.failed;
          }
        } catch (error) {
          console.error(`Failed to notify for event ${event.id}:`, error);
        }
      }
      
      if (totalSent > 0) {
        toast.success(`已發送 ${totalSent} 筆通知${totalFailed > 0 ? `，${totalFailed} 筆失敗` : ""}`);
      } else if (totalFailed > 0) {
        toast.error(`發送失敗 ${totalFailed} 筆`);
      }
      
      // 重新載入活動
      fetchEvents();
    } catch (error) {
      toast.error("批次發送失敗");
    } finally {
      setSending(false);
    }
  };

  const handleStaffToggle = async (staffId: string, isSelected: boolean) => {
    if (!selectedEvent) return;

    try {
      if (isSelected) {
        // Add staff to event
        const response = await fetch(`/api/v1/events/${selectedEvent.id}/staff`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ staffId }),
        });
        
        if (!response.ok) throw new Error("指派失敗");
        
        setSelectedStaff((prev) => new Set([...prev, staffId]));
        toast.success("已指派員工");
      } else {
        // Remove staff from event
        const response = await fetch(
          `/api/v1/events/${selectedEvent.id}/staff/${staffId}`,
          { method: "DELETE" }
        );
        
        if (!response.ok) throw new Error("移除失敗");
        
        setSelectedStaff((prev) => {
          const newSet = new Set(prev);
          newSet.delete(staffId);
          return newSet;
        });
        toast.success("已移除員工");
      }
      
      // Refresh event list
      fetchEvents();
    } catch (error) {
      toast.error("操作失敗");
    }
  };

  // 更新員工交通安排
  const handleVehicleChange = async (
    eventStaffId: string,
    staffId: string,
    vehicle: string | null,
    isDriver: boolean
  ) => {
    if (!selectedEvent) return;
    
    setVehicleUpdating(eventStaffId);
    try {
      const response = await fetch(
        `/api/v1/events/${selectedEvent.id}/staff/${staffId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ vehicle, isDriver }),
        }
      );
      
      if (!response.ok) throw new Error("更新失敗");
      
      toast.success("已更新交通安排");
      fetchEvents();
    } catch (error) {
      toast.error("更新交通安排失敗");
    } finally {
      setVehicleUpdating(null);
    }
  };

  // 計算車輛使用情況
  const getVehicleUsage = () => {
    if (!selectedEvent) return {};
    
    const usage: Record<string, { driver: string | null; passengers: string[] }> = {
      BIG_TRUCK: { driver: null, passengers: [] },
      SMALL_TRUCK: { driver: null, passengers: [] },
      MANAGER_CAR: { driver: null, passengers: [] },
    };
    
    selectedEvent.eventStaff.forEach((es) => {
      if (es.vehicle && es.vehicle !== "OWN_CAR") {
        if (es.isDriver) {
          usage[es.vehicle].driver = es.staff.name;
        } else {
          usage[es.vehicle].passengers.push(es.staff.name);
        }
      }
    });
    
    return usage;
  };

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  // Group events by date
  const eventsByDate = events.reduce((acc, event) => {
    const dateStr = event.date.split("T")[0];
    if (!acc[dateStr]) acc[dateStr] = [];
    acc[dateStr].push(event);
    return acc;
  }, {} as Record<string, Event[]>);

  // Get available staff list with filters
  const getFilteredStaff = () => {
    if (!availabilityData) return [];
    
    let staffList = [
      ...availabilityData.available,
      ...(showConflicting ? availabilityData.conflicting : []),
    ];
    
    if (skillFilter !== "all") {
      staffList = staffList.filter(
        (s) => s.skill === skillFilter || s.skill === "BOTH"
      );
    }
    
    return staffList;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-500">載入中...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 px-4">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">排班管理</h1>
          <p className="text-gray-500 text-sm mt-1">
            依月份檢視活動並整批指派人員
          </p>
        </div>
        <div className="flex items-center gap-4">
          {/* 通知管理按鈕 */}
          <Button asChild className="bg-blue-600 hover:bg-blue-700">
            <Link href="/notifications">
              <Send className="w-4 h-4 mr-2" />
              批次通知管理
            </Link>
          </Button>
          
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={prevMonth}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <div className="text-lg font-medium px-4">
              {year} 年 {month + 1} 月
            </div>
            <Button variant="outline" size="icon" onClick={nextMonth}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Summary Card */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">{events.length}</div>
            <div className="text-sm text-gray-500">本月活動總數</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-green-600">
              {events.filter((e) => e.status === "CONFIRMED").length}
            </div>
            <div className="text-sm text-gray-500">已確認</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-yellow-600">
              {events.filter((e) => e.status === "PENDING").length}
            </div>
            <div className="text-sm text-gray-500">待確認</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-blue-600">
              {events.filter((e) => e.eventStaff.length === 0).length}
            </div>
            <div className="text-sm text-gray-500">未排班</div>
          </CardContent>
        </Card>
      </div>

      {/* Events Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            活動列表
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>日期</TableHead>
                <TableHead>活動名稱</TableHead>
                <TableHead>場地</TableHead>
                <TableHead>狀態</TableHead>
                <TableHead>已排班人員</TableHead>
                <TableHead>通知狀態</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {events.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                    本月尚無活動
                  </TableCell>
                </TableRow>
              ) : (
                events
                  .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                  .map((event) => {
                    const notifiedCount = event.eventStaff.filter((es) => es.notified).length;
                    const totalCount = event.eventStaff.length;
                    
                    return (
                    <TableRow key={event.id}>
                      <TableCell>
                        <div className="font-medium">
                          {new Date(event.date).toLocaleDateString("zh-TW", {
                            month: "numeric",
                            day: "numeric",
                            weekday: "short",
                          })}
                        </div>
                        <div className="text-sm text-gray-500">{event.startTime}</div>
                      </TableCell>
                      <TableCell className="font-medium">{event.name}</TableCell>
                      <TableCell>{event.venue?.name || "-"}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            event.status === "CONFIRMED"
                              ? "default"
                              : event.status === "CANCELLED"
                              ? "destructive"
                              : "secondary"
                          }
                        >
                          {statusLabels[event.status]}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {totalCount === 0 ? (
                          <span className="text-gray-400">尚未排班</span>
                        ) : (
                          <div className="flex flex-wrap gap-1">
                            {event.eventStaff.slice(0, 3).map((es) => (
                              <Badge key={es.id} variant="outline">
                                {es.staff.name}
                              </Badge>
                            ))}
                            {totalCount > 3 && (
                              <Badge variant="outline">
                                +{totalCount - 3}
                              </Badge>
                            )}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        {totalCount === 0 ? (
                          <span className="text-gray-400">-</span>
                        ) : notifiedCount === totalCount ? (
                          <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                            <CheckCircle2 className="w-3 h-3 mr-1" />
                            全部已通知
                          </Badge>
                        ) : notifiedCount === 0 ? (
                          <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">
                            <AlertCircle className="w-3 h-3 mr-1" />
                            待通知 {totalCount}
                          </Badge>
                        ) : (
                          <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">
                            <Bell className="w-3 h-3 mr-1" />
                            {notifiedCount}/{totalCount}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEventClick(event)}
                          >
                            <Users className="w-4 h-4 mr-1" />
                            排班
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )})
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Staff Assignment Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedEvent?.name} - 人員排班
            </DialogTitle>
            {selectedEvent && (
              <div className="text-sm text-gray-500">
                {new Date(selectedEvent.date).toLocaleDateString("zh-TW")} {selectedEvent.startTime}
                {selectedEvent.venue && ` | ${selectedEvent.venue.name}`}
              </div>
            )}
          </DialogHeader>

          {/* Already Assigned Staff */}
          {selectedStaff.size > 0 && (
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-medium flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  已排班人員 ({selectedStaff.size})
                </h4>
                {notifyStatus && (
                  <div className="flex items-center gap-3">
                    <div className="text-sm">
                      {notifyStatus.pending > 0 ? (
                        <span className="text-yellow-600">
                          <Bell className="w-4 h-4 inline mr-1" />
                          {notifyStatus.pending} 人待通知
                        </span>
                      ) : (
                        <span className="text-green-600">
                          ✓ 已全部通知
                        </span>
                      )}
                    </div>
                    {notifyStatus.pending > 0 && (
                      <Button
                        size="sm"
                        onClick={handleSendNotifications}
                        disabled={sending}
                      >
                        <Send className="w-4 h-4 mr-1" />
                        {sending ? "發送中..." : "發送通知"}
                      </Button>
                    )}
                  </div>
                )}
              </div>

              {/* 餐車需求提示 */}
              {selectedEvent && (selectedEvent.requireBigTruck || selectedEvent.requireSmallTruck) && (
                <div className="mb-3 p-2 bg-orange-50 border border-orange-200 rounded-lg text-sm">
                  <Truck className="w-4 h-4 inline mr-1 text-orange-600" />
                  <span className="text-orange-700">
                    此場次需要：
                    {selectedEvent.requireBigTruck && " 大餐車"}
                    {selectedEvent.requireBigTruck && selectedEvent.requireSmallTruck && "、"}
                    {selectedEvent.requireSmallTruck && " 小餐車"}
                  </span>
                </div>
              )}

              {/* 車輛使用摘要 */}
              {(() => {
                const usage = getVehicleUsage();
                const hasVehicleAssignment = Object.values(usage).some(
                  v => v.driver || v.passengers.length > 0
                );
                if (!hasVehicleAssignment) return null;
                
                return (
                  <div className="mb-3 grid grid-cols-3 gap-2 text-xs">
                    {Object.entries(usage).map(([type, { driver, passengers }]) => {
                      const capacity = vehicleCapacity[type] || 0;
                      const total = (driver ? 1 : 0) + passengers.length;
                      if (total === 0) return null;
                      
                      return (
                        <div key={type} className="p-2 bg-gray-50 rounded border">
                          <div className="font-medium">{vehicleLabels[type]}</div>
                          <div className="text-gray-600">
                            {driver && <span>🚗 {driver}</span>}
                            {passengers.length > 0 && (
                              <span className="ml-1">👥 {passengers.join(", ")}</span>
                            )}
                          </div>
                          <div className="text-gray-400">
                            {total}/{capacity} 人
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}

              {/* 已排班人員列表（含車輛選擇） */}
              <div className="space-y-2">
                {selectedEvent?.eventStaff.map((es) => {
                  const staff = availabilityData?.available.find(s => s.id === es.staff.id) ||
                               availabilityData?.conflicting.find(s => s.id === es.staff.id);
                  const canDrive = staff?.canDrive || es.staff.canDrive;
                  
                  return (
                    <div
                      key={es.id}
                      className="flex items-center justify-between p-2 border rounded-lg bg-gray-50"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-sm font-medium text-blue-700">
                          {es.staff.name.charAt(0)}
                        </div>
                        <div>
                          <div className="font-medium flex items-center gap-1">
                            {es.staff.name}
                            {canDrive && (
                              <span title="可當駕駛">
                                <Car className="w-3 h-3 text-green-600" />
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-gray-500">
                            {skillLabels[es.staff.skill]}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {/* 車輛選擇 */}
                        <Select
                          value={es.vehicle ? `${es.vehicle}${es.isDriver ? '_DRIVER' : '_PASSENGER'}` : "NONE"}
                          onValueChange={(value) => {
                            if (value === "NONE") {
                              handleVehicleChange(es.id, es.staff.id, null, false);
                            } else if (value === "OWN_CAR") {
                              handleVehicleChange(es.id, es.staff.id, "OWN_CAR", true);
                            } else {
                              const [vehicle, role] = value.split('_');
                              const isDriver = role === 'DRIVER';
                              handleVehicleChange(es.id, es.staff.id, vehicle, isDriver);
                            }
                          }}
                          disabled={vehicleUpdating === es.id}
                        >
                          <SelectTrigger className="w-36 h-8 text-xs">
                            <SelectValue placeholder="選擇交通" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="NONE">未指定</SelectItem>
                            <SelectItem value="OWN_CAR">自行開車</SelectItem>
                            {canDrive && (
                              <>
                                <SelectItem value="BIG_TRUCK_DRIVER">大餐車（駕駛）</SelectItem>
                                <SelectItem value="SMALL_TRUCK_DRIVER">小餐車（駕駛）</SelectItem>
                                <SelectItem value="MANAGER_CAR_DRIVER">店長車（駕駛）</SelectItem>
                              </>
                            )}
                            <SelectItem value="BIG_TRUCK_PASSENGER">大餐車（乘客）</SelectItem>
                            <SelectItem value="SMALL_TRUCK_PASSENGER">小餐車（乘客）</SelectItem>
                            <SelectItem value="MANAGER_CAR_PASSENGER">店長車（乘客）</SelectItem>
                          </SelectContent>
                        </Select>

                        {/* 移除按鈕 */}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-gray-400 hover:text-red-500 hover:bg-red-50"
                          onClick={() => handleStaffToggle(es.staff.id, false)}
                        >
                          ✕
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Filters */}
          <div className="flex gap-4 mb-4">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-400" />
              <Select value={skillFilter} onValueChange={setSkillFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部職能</SelectItem>
                  <SelectItem value="FRONT">外場</SelectItem>
                  <SelectItem value="HOT">熱台</SelectItem>
                  <SelectItem value="BOTH">皆可</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <Checkbox
                checked={showConflicting}
                onCheckedChange={(checked) => setShowConflicting(!!checked)}
              />
              <span className="text-sm">顯示有衝突的員工</span>
            </label>
          </div>

          {/* Summary */}
          {availabilityData && (
            <div className="flex gap-4 text-sm mb-4">
              <span className="text-green-600">
                可用: {availabilityData.summary.available}
              </span>
              <span className="text-yellow-600">
                有衝突: {availabilityData.summary.conflicting}
              </span>
              <span className="text-red-600">
                不可用: {availabilityData.summary.unavailable}
              </span>
            </div>
          )}

          {/* Available Staff List */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-gray-500">點擊加入排班</h4>
            {getFilteredStaff().filter(s => !selectedStaff.has(s.id)).map((staff) => (
              <div
                key={staff.id}
                onClick={() => handleStaffToggle(staff.id, true)}
                className={cn(
                  "flex items-center justify-between p-3 border rounded-lg cursor-pointer transition-colors",
                  "hover:bg-blue-50 hover:border-blue-200",
                  staff.hasConflict && "border-yellow-200 bg-yellow-50 hover:bg-yellow-100"
                )}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-sm font-medium">
                    {staff.name.charAt(0)}
                  </div>
                  <div>
                    <div className="font-medium">{staff.name}</div>
                    <div className="text-sm text-gray-500">
                      {skillLabels[staff.skill]} | {staff.phone}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  {staff.hasConflict && (
                    <Badge variant="outline" className="text-yellow-600 mb-1">
                      有其他場次
                    </Badge>
                  )}
                  <div className="text-sm text-gray-500">
                    NT$ {staff.perEventSalary.toLocaleString()}
                  </div>
                </div>
              </div>
            ))}
            
            {getFilteredStaff().filter(s => !selectedStaff.has(s.id)).length === 0 && (
              <div className="text-center py-8 text-gray-500">
                {selectedStaff.size > 0 ? "所有可用員工已排班" : "沒有符合條件的員工"}
              </div>
            )}
          </div>

          {/* Unavailable Staff */}
          {availabilityData && availabilityData.unavailable.length > 0 && (
            <div className="mt-4">
              <h4 className="text-sm font-medium text-gray-500 mb-2">
                不可出勤員工
              </h4>
              <div className="space-y-1">
                {availabilityData.unavailable.map((staff) => (
                  <div
                    key={staff.id}
                    className="flex items-center justify-between p-2 bg-red-50 border border-red-100 rounded text-sm"
                  >
                    <span>{staff.name}</span>
                    <span className="text-red-600">
                      {staff.unavailableReason || "不可出勤"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
