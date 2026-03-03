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
import { Calendar, Users, ChevronLeft, ChevronRight, Filter, Bell, Send, CheckCircle2, AlertCircle, Car, Truck, Download } from "lucide-react";
import Link from "next/link";
import * as XLSX from "xlsx";
import { toast } from "sonner";

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
  const [exporting, setExporting] = useState(false);

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

  // Export scheduling statistics to Excel
  const handleExportExcel = async () => {
    setExporting(true);
    try {
      const startDate = `${year}-${String(month + 1).padStart(2, "0")}-01`;
      const lastDay = new Date(year, month + 1, 0).getDate();
      const endDate = `${year}-${String(month + 1).padStart(2, "0")}-${lastDay}`;

      const response = await fetch(
        `/api/v1/reports/scheduling?startDate=${startDate}&endDate=${endDate}`
      );
      if (!response.ok) throw new Error("取得報表資料失敗");
      const data = await response.json();

      // Sheet 1: 員工統計
      const staffSheetData = data.staffStats.map((s: {
        staffName: string;
        totalEvents: number;
        eventsByRole: Record<string, number>;
        eventsByVehicle: Record<string, number>;
        attendanceStatusCounts: Record<string, number>;
      }) => ({
        "員工": s.staffName,
        "總場次": s.totalEvents,
        "外場": s.eventsByRole.FRONT || 0,
        "熱台": s.eventsByRole.HOT || 0,
        "助手": s.eventsByRole.BOTH || 0,
        "大餐車": s.eventsByVehicle.BIG_TRUCK || 0,
        "小餐車": s.eventsByVehicle.SMALL_TRUCK || 0,
        "店長車": s.eventsByVehicle.MANAGER_CAR || 0,
        "自行開車": s.eventsByVehicle.OWN_CAR || 0,
        "已確認": s.attendanceStatusCounts.CONFIRMED || 0,
        "待確認": s.attendanceStatusCounts.SCHEDULED || 0,
      }));

      // Sheet 2: 總覽
      const summarySheetData = [
        { "項目": "總排班數", "數值": data.summary.totalAssignments },
        { "項目": "員工人數", "數值": data.summary.uniqueStaffCount },
        { "項目": "活動數", "數值": data.summary.uniqueEventCount },
        { "項目": "外場總數", "數值": data.summary.overallByRole.FRONT || 0 },
        { "項目": "熱台總數", "數值": data.summary.overallByRole.HOT || 0 },
        { "項目": "助手總數", "數值": data.summary.overallByRole.BOTH || 0 },
        { "項目": "大餐車", "數值": data.summary.overallByVehicle.BIG_TRUCK || 0 },
        { "項目": "小餐車", "數值": data.summary.overallByVehicle.SMALL_TRUCK || 0 },
        { "項目": "店長車", "數值": data.summary.overallByVehicle.MANAGER_CAR || 0 },
        { "項目": "自行開車", "數值": data.summary.overallByVehicle.OWN_CAR || 0 },
        { "項目": "已確認", "數值": data.summary.overallAttendanceStatus.CONFIRMED || 0 },
        { "項目": "待確認", "數值": data.summary.overallAttendanceStatus.SCHEDULED || 0 },
      ];

      const wb = XLSX.utils.book_new();
      const ws1 = XLSX.utils.json_to_sheet(staffSheetData);
      const ws2 = XLSX.utils.json_to_sheet(summarySheetData);
      XLSX.utils.book_append_sheet(wb, ws1, "員工統計");
      XLSX.utils.book_append_sheet(wb, ws2, "總覽");

      const filename = `排班統計_${year}-${String(month + 1).padStart(2, "0")}.xlsx`;
      XLSX.writeFile(wb, filename);
      toast.success("匯出成功");
    } catch (error) {
      toast.error("匯出失敗");
    } finally {
      setExporting(false);
    }
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
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <div style={{ color: '#6b7280' }}>載入中...</div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '1.5rem 1rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>排班管理</h1>
          <p style={{ color: '#6b7280', fontSize: '0.875rem', marginTop: '0.25rem' }}>
            依月份檢視活動並整批指派人員
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          {/* 通知管理按鈕 */}
          <Button asChild className="bg-blue-600 hover:bg-blue-700">
            <Link href="/notifications">
              <Send className="w-4 h-4 mr-2" />
              批次通知管理
            </Link>
          </Button>

          {/* 匯出按鈕 */}
          <Button
            variant="outline"
            onClick={handleExportExcel}
            disabled={exporting}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <Download style={{ width: '1rem', height: '1rem' }} />
            {exporting ? "匯出中..." : "匯出"}
          </Button>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Button variant="outline" size="icon" onClick={prevMonth}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <div style={{ fontSize: '1.125rem', fontWeight: '500', padding: '0 1rem' }}>
              {year} 年 {month + 1} 月
            </div>
            <Button variant="outline" size="icon" onClick={nextMonth}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Summary Card */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
        <Card>
          <CardContent className="pt-4">
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{events.length}</div>
            <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>本月活動總數</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#16a34a' }}>
              {events.filter((e) => e.status === "CONFIRMED").length}
            </div>
            <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>已確認</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#ca8a04' }}>
              {events.filter((e) => e.status === "PENDING").length}
            </div>
            <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>待確認</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#2563eb' }}>
              {events.filter((e) => e.eventStaff.length === 0).length}
            </div>
            <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>未排班</div>
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
                  <TableCell colSpan={7} style={{ textAlign: 'center', padding: '2rem 0', color: '#6b7280' }}>
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
                        <div style={{ fontWeight: '500' }}>
                          {new Date(event.date).toLocaleDateString("zh-TW", {
                            month: "numeric",
                            day: "numeric",
                            weekday: "short",
                          })}
                        </div>
                        <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>{event.startTime}</div>
                      </TableCell>
                      <TableCell style={{ fontWeight: '500' }}>{event.name}</TableCell>
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
                          <span style={{ color: '#9ca3af' }}>尚未排班</span>
                        ) : (
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
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
                          <span style={{ color: '#9ca3af' }}>-</span>
                        ) : notifiedCount === totalCount ? (
                          <Badge style={{ backgroundColor: '#dcfce7', color: '#166534' }}>
                            <CheckCircle2 className="w-3 h-3 mr-1" />
                            全部已通知
                          </Badge>
                        ) : notifiedCount === 0 ? (
                          <Badge style={{ backgroundColor: '#fef9c3', color: '#854d0e' }}>
                            <AlertCircle className="w-3 h-3 mr-1" />
                            待通知 {totalCount}
                          </Badge>
                        ) : (
                          <Badge style={{ backgroundColor: '#dbeafe', color: '#1e40af' }}>
                            <Bell className="w-3 h-3 mr-1" />
                            {notifiedCount}/{totalCount}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell style={{ textAlign: 'right' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.5rem' }}>
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
              <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                {new Date(selectedEvent.date).toLocaleDateString("zh-TW")} {selectedEvent.startTime}
                {selectedEvent.venue && ` | ${selectedEvent.venue.name}`}
              </div>
            )}
          </DialogHeader>

          {/* Already Assigned Staff */}
          {selectedStaff.size > 0 && (
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <h4 style={{ fontSize: '0.875rem', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Users className="w-4 h-4" />
                  已排班人員 ({selectedStaff.size})
                </h4>
                {notifyStatus && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ fontSize: '0.875rem' }}>
                      {notifyStatus.pending > 0 ? (
                        <span style={{ color: '#ca8a04' }}>
                          <Bell className="w-4 h-4 inline mr-1" />
                          {notifyStatus.pending} 人待通知
                        </span>
                      ) : (
                        <span style={{ color: '#16a34a' }}>
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
                <div style={{ marginBottom: '0.75rem', padding: '0.5rem', backgroundColor: '#fff7ed', border: '1px solid #fed7aa', borderRadius: '0.5rem', fontSize: '0.875rem' }}>
                  <Truck className="w-4 h-4 inline mr-1 text-orange-600" />
                  <span style={{ color: '#c2410c' }}>
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
                  <div style={{ marginBottom: '0.75rem', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem', fontSize: '0.75rem' }}>
                    {Object.entries(usage).map(([type, { driver, passengers }]) => {
                      const capacity = vehicleCapacity[type] || 0;
                      const total = (driver ? 1 : 0) + passengers.length;
                      if (total === 0) return null;
                      
                      return (
                        <div key={type} style={{ padding: '0.5rem', backgroundColor: '#f9fafb', borderRadius: '0.25rem', border: '1px solid #e5e7eb' }}>
                          <div style={{ fontWeight: '500' }}>{vehicleLabels[type]}</div>
                          <div style={{ color: '#4b5563' }}>
                            {driver && <span>🚗 {driver}</span>}
                            {passengers.length > 0 && (
                              <span style={{ marginLeft: '0.25rem' }}>👥 {passengers.join(", ")}</span>
                            )}
                          </div>
                          <div style={{ color: '#9ca3af' }}>
                            {total}/{capacity} 人
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}

              {/* 已排班人員列表（含車輛選擇） */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {selectedEvent?.eventStaff.map((es) => {
                  const staff = availabilityData?.available.find(s => s.id === es.staff.id) ||
                               availabilityData?.conflicting.find(s => s.id === es.staff.id);
                  const canDrive = staff?.canDrive || es.staff.canDrive;
                  
                  return (
                    <div
                      key={es.id}
                      style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.5rem', border: '1px solid #e5e7eb', borderRadius: '0.5rem', backgroundColor: '#f9fafb' }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{ width: '2rem', height: '2rem', borderRadius: '50%', backgroundColor: '#dbeafe', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.875rem', fontWeight: '500', color: '#1d4ed8' }}>
                          {es.staff.name.charAt(0)}
                        </div>
                        <div>
                          <div style={{ fontWeight: '500', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                            {es.staff.name}
                            {canDrive && (
                              <span title="可當駕駛">
                                <Car className="w-3 h-3 text-green-600" />
                              </span>
                            )}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                            {skillLabels[es.staff.skill]}
                          </div>
                        </div>
                      </div>
                      
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
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
                          style={{ height: '2rem', width: '2rem', padding: 0, color: '#9ca3af' }}
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
          <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
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
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
              <Checkbox
                checked={showConflicting}
                onCheckedChange={(checked) => setShowConflicting(!!checked)}
              />
              <span style={{ fontSize: '0.875rem' }}>顯示有衝突的員工</span>
            </label>
          </div>

          {/* Summary */}
          {availabilityData && (
            <div style={{ display: 'flex', gap: '1rem', fontSize: '0.875rem', marginBottom: '1rem' }}>
              <span style={{ color: '#16a34a' }}>
                可用: {availabilityData.summary.available}
              </span>
              <span style={{ color: '#ca8a04' }}>
                有衝突: {availabilityData.summary.conflicting}
              </span>
              <span style={{ color: '#dc2626' }}>
                不可用: {availabilityData.summary.unavailable}
              </span>
            </div>
          )}

          {/* Available Staff List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <h4 style={{ fontSize: '0.875rem', fontWeight: '500', color: '#6b7280' }}>點擊加入排班</h4>
            {getFilteredStaff().filter(s => !selectedStaff.has(s.id)).map((staff) => (
              <div
                key={staff.id}
                onClick={() => handleStaffToggle(staff.id, true)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.75rem',
                  border: staff.hasConflict ? '1px solid #fde68a' : '1px solid #e5e7eb',
                  borderRadius: '0.5rem',
                  cursor: 'pointer',
                  backgroundColor: staff.hasConflict ? '#fefce8' : 'transparent',
                  transition: 'background-color 0.15s, border-color 0.15s'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{ width: '2rem', height: '2rem', borderRadius: '50%', backgroundColor: '#e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.875rem', fontWeight: '500' }}>
                    {staff.name.charAt(0)}
                  </div>
                  <div>
                    <div style={{ fontWeight: '500' }}>{staff.name}</div>
                    <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                      {skillLabels[staff.skill]} | {staff.phone}
                    </div>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  {staff.hasConflict && (
                    <Badge variant="outline" style={{ color: '#ca8a04', marginBottom: '0.25rem' }}>
                      有其他場次
                    </Badge>
                  )}
                  <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                    NT$ {staff.perEventSalary.toLocaleString()}
                  </div>
                </div>
              </div>
            ))}
            
            {getFilteredStaff().filter(s => !selectedStaff.has(s.id)).length === 0 && (
              <div style={{ textAlign: 'center', padding: '2rem 0', color: '#6b7280' }}>
                {selectedStaff.size > 0 ? "所有可用員工已排班" : "沒有符合條件的員工"}
              </div>
            )}
          </div>

          {/* Unavailable Staff */}
          {availabilityData && availabilityData.unavailable.length > 0 && (
            <div style={{ marginTop: '1rem' }}>
              <h4 style={{ fontSize: '0.875rem', fontWeight: '500', color: '#6b7280', marginBottom: '0.5rem' }}>
                不可出勤員工
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                {availabilityData.unavailable.map((staff) => (
                  <div
                    key={staff.id}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.5rem', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '0.25rem', fontSize: '0.875rem' }}
                  >
                    <span>{staff.name}</span>
                    <span style={{ color: '#dc2626' }}>
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
