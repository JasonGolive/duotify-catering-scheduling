"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ArrowLeft, ChevronLeft, ChevronRight, Check, X } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Staff {
  id: string;
  name: string;
  phone: string;
  skill: string;
}

interface AvailabilityRecord {
  id: string;
  staffId: string;
  date: string;
  available: boolean;
  reason: string | null;
}

interface EventAssignment {
  eventId: string;
  eventTitle: string;
  startTime: string;
}

export default function StaffAvailabilityPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: staffId } = use(params);
  const router = useRouter();
  const [staff, setStaff] = useState<Staff | null>(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [availability, setAvailability] = useState<Record<string, AvailabilityRecord>>({});
  const [events, setEvents] = useState<Record<string, EventAssignment[]>>({});
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [reason, setReason] = useState("");

  const skillLabels: Record<string, string> = {
    FRONT: "外場",
    HOT: "熱台",
    BOTH: "皆可",
  };

  // Get calendar data
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startOffset = firstDay.getDay(); // 0 = Sunday
  const daysInMonth = lastDay.getDate();

  const fetchData = async () => {
    try {
      // Fetch staff info
      const staffRes = await fetch(`/api/v1/staff/${staffId}`);
      if (!staffRes.ok) throw new Error("無法載入員工資料");
      const staffData = await staffRes.json();
      setStaff(staffData);

      // Fetch availability for current month
      const startDate = `${year}-${String(month + 1).padStart(2, "0")}-01`;
      const endDate = `${year}-${String(month + 1).padStart(2, "0")}-${daysInMonth}`;
      
      const availRes = await fetch(
        `/api/v1/staff/${staffId}/availability?startDate=${startDate}&endDate=${endDate}`
      );
      if (!availRes.ok) throw new Error("無法載入可用性資料");
      const availData: AvailabilityRecord[] = await availRes.json();
      
      const availMap: Record<string, AvailabilityRecord> = {};
      availData.forEach((a) => {
        availMap[a.date] = a;
      });
      setAvailability(availMap);

      // Fetch events for the month
      const eventsRes = await fetch(`/api/v1/events?startDate=${startDate}&endDate=${endDate}`);
      if (eventsRes.ok) {
        const eventsData = await eventsRes.json();
        const eventMap: Record<string, EventAssignment[]> = {};
        
        for (const event of eventsData) {
          // Check if this staff is assigned
          const staffRes = await fetch(`/api/v1/events/${event.id}/staff`);
          if (staffRes.ok) {
            const staffList = await staffRes.json();
            const isAssigned = staffList.some((s: { staffId: string }) => s.staffId === staffId);
            if (isAssigned) {
              const dateKey = event.date.split("T")[0];
              if (!eventMap[dateKey]) eventMap[dateKey] = [];
              eventMap[dateKey].push({
                eventId: event.id,
                eventTitle: event.title,
                startTime: event.startTime,
              });
            }
          }
        }
        setEvents(eventMap);
      }
    } catch (error) {
      toast.error("載入資料失敗");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    fetchData();
  }, [staffId, currentDate]);

  const handleDateClick = (dateStr: string) => {
    setSelectedDate(dateStr);
    const existing = availability[dateStr];
    setReason(existing?.reason || "");
    setDialogOpen(true);
  };

  const handleSetAvailability = async (available: boolean) => {
    if (!selectedDate) return;

    try {
      const response = await fetch(`/api/v1/staff/${staffId}/availability`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: selectedDate,
          available,
          reason: available ? null : reason,
        }),
      });

      if (!response.ok) throw new Error("設定失敗");

      const result = await response.json();
      setAvailability((prev) => ({
        ...prev,
        [selectedDate]: result,
      }));
      
      toast.success(available ? "已標記為可出勤" : "已標記為不可出勤");
      setDialogOpen(false);
    } catch (error) {
      toast.error("設定失敗，請稍後再試");
    }
  };

  const handleClearAvailability = async () => {
    if (!selectedDate) return;

    try {
      await fetch(`/api/v1/staff/${staffId}/availability?date=${selectedDate}`, {
        method: "DELETE",
      });

      setAvailability((prev) => {
        const newMap = { ...prev };
        delete newMap[selectedDate];
        return newMap;
      });
      
      toast.success("已清除設定");
      setDialogOpen(false);
    } catch (error) {
      toast.error("清除失敗");
    }
  };

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  if (loading || !staff) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-500">載入中...</div>
      </div>
    );
  }

  // Generate calendar days
  const calendarDays: (number | null)[] = [];
  for (let i = 0; i < startOffset; i++) {
    calendarDays.push(null);
  }
  for (let i = 1; i <= daysInMonth; i++) {
    calendarDays.push(i);
  }

  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

  return (
    <div className="container mx-auto py-6 px-4">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">{staff.name} - 出勤行事曆</h1>
          <p className="text-gray-500 text-sm">
            {skillLabels[staff.skill]} | {staff.phone}
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">
              {year} 年 {month + 1} 月
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={goToToday}>
                今天
              </Button>
              <Button variant="outline" size="icon" onClick={prevMonth}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="icon" onClick={nextMonth}>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Legend */}
          <div className="flex gap-4 mb-4 text-sm">
            <div className="flex items-center gap-1">
              <div className="w-4 h-4 bg-green-100 border border-green-300 rounded" />
              <span>可出勤</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-4 h-4 bg-red-100 border border-red-300 rounded" />
              <span>不可出勤</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-4 h-4 bg-blue-100 border border-blue-300 rounded" />
              <span>已排班</span>
            </div>
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1">
            {["日", "一", "二", "三", "四", "五", "六"].map((day) => (
              <div
                key={day}
                className="text-center font-medium text-gray-500 py-2"
              >
                {day}
              </div>
            ))}
            {calendarDays.map((day, index) => {
              if (day === null) {
                return <div key={index} className="h-20" />;
              }

              const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
              const avail = availability[dateStr];
              const dayEvents = events[dateStr] || [];
              const isToday = dateStr === todayStr;
              const isPast = new Date(dateStr) < new Date(todayStr);

              let bgColor = "";
              if (avail?.available === false) {
                bgColor = "bg-red-50 border-red-200";
              } else if (dayEvents.length > 0) {
                bgColor = "bg-blue-50 border-blue-200";
              } else if (avail?.available === true) {
                bgColor = "bg-green-50 border-green-200";
              }

              return (
                <div
                  key={index}
                  onClick={() => !isPast && handleDateClick(dateStr)}
                  className={cn(
                    "h-20 border rounded-lg p-1 cursor-pointer transition-colors hover:bg-gray-50",
                    bgColor,
                    isToday && "ring-2 ring-primary",
                    isPast && "opacity-50 cursor-not-allowed"
                  )}
                >
                  <div className={cn(
                    "text-sm font-medium",
                    isToday && "text-primary"
                  )}>
                    {day}
                  </div>
                  {dayEvents.length > 0 && (
                    <div className="mt-1">
                      {dayEvents.slice(0, 2).map((e, i) => (
                        <div
                          key={i}
                          className="text-xs bg-blue-100 text-blue-800 px-1 rounded truncate mb-0.5"
                        >
                          {e.eventTitle}
                        </div>
                      ))}
                      {dayEvents.length > 2 && (
                        <div className="text-xs text-blue-600">
                          +{dayEvents.length - 2} 場
                        </div>
                      )}
                    </div>
                  )}
                  {avail?.available === false && dayEvents.length === 0 && (
                    <div className="text-xs text-red-600 mt-1">
                      {avail.reason || "不可出勤"}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Availability Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>設定 {selectedDate} 出勤狀態</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>不可出勤原因（選填）</Label>
              <Input
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="例：私人行程"
              />
            </div>
            <div className="flex gap-2">
              <Button
                className="flex-1"
                variant="outline"
                onClick={() => handleSetAvailability(true)}
              >
                <Check className="w-4 h-4 mr-2 text-green-600" />
                可出勤
              </Button>
              <Button
                className="flex-1"
                variant="outline"
                onClick={() => handleSetAvailability(false)}
              >
                <X className="w-4 h-4 mr-2 text-red-600" />
                不可出勤
              </Button>
            </div>
            {availability[selectedDate || ""] && (
              <Button
                variant="ghost"
                className="w-full"
                onClick={handleClearAvailability}
              >
                清除設定
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
