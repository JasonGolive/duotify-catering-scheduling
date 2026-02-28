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
import { Calendar, Users, ChevronLeft, ChevronRight, Filter } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Event {
  id: string;
  name: string;
  date: string;
  startTime: string;
  status: string;
  venue?: { name: string } | null;
  eventStaff: {
    id: string;
    staff: { id: string; name: string; skill: string };
    workRole: string;
    attendanceStatus: string;
  }[];
}

interface Staff {
  id: string;
  name: string;
  phone: string;
  skill: string;
  perEventSalary: number;
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
    setDialogOpen(true);
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
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {events.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                    本月尚無活動
                  </TableCell>
                </TableRow>
              ) : (
                events
                  .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                  .map((event) => (
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
                        {event.eventStaff.length === 0 ? (
                          <span className="text-gray-400">尚未排班</span>
                        ) : (
                          <div className="flex flex-wrap gap-1">
                            {event.eventStaff.slice(0, 3).map((es) => (
                              <Badge key={es.id} variant="outline">
                                {es.staff.name}
                              </Badge>
                            ))}
                            {event.eventStaff.length > 3 && (
                              <Badge variant="outline">
                                +{event.eventStaff.length - 3}
                              </Badge>
                            )}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEventClick(event)}
                        >
                          <Users className="w-4 h-4 mr-1" />
                          排班
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Staff Assignment Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
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

          {/* Staff List */}
          <div className="space-y-2">
            {getFilteredStaff().map((staff) => (
              <div
                key={staff.id}
                className={cn(
                  "flex items-center justify-between p-3 border rounded-lg",
                  selectedStaff.has(staff.id) && "bg-blue-50 border-blue-200",
                  staff.hasConflict && "border-yellow-200 bg-yellow-50"
                )}
              >
                <div className="flex items-center gap-3">
                  <Checkbox
                    checked={selectedStaff.has(staff.id)}
                    onCheckedChange={(checked) =>
                      handleStaffToggle(staff.id, !!checked)
                    }
                  />
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
            
            {getFilteredStaff().length === 0 && (
              <div className="text-center py-8 text-gray-500">
                沒有符合條件的員工
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
