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
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}>
        <div style={{ color: "#6b7280" }}>載入中...</div>
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
    <div style={{ maxWidth: "1280px", margin: "0 auto", paddingTop: "1.5rem", paddingBottom: "1.5rem", paddingLeft: "1rem", paddingRight: "1rem" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1.5rem" }}>
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 700 }}>{staff.name} - 出勤行事曆</h1>
          <p style={{ color: "#6b7280", fontSize: "0.875rem" }}>
            {skillLabels[staff.skill]} | {staff.phone}
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <CardTitle className="text-lg">
              {year} 年 {month + 1} 月
            </CardTitle>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
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
          <div style={{ display: "flex", gap: "1rem", marginBottom: "1rem", fontSize: "0.875rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
              <div style={{ width: "1rem", height: "1rem", backgroundColor: "#dcfce7", border: "1px solid #86efac", borderRadius: "0.25rem" }} />
              <span>可出勤</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
              <div style={{ width: "1rem", height: "1rem", backgroundColor: "#fee2e2", border: "1px solid #fca5a5", borderRadius: "0.25rem" }} />
              <span>不可出勤</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
              <div style={{ width: "1rem", height: "1rem", backgroundColor: "#dbeafe", border: "1px solid #93c5fd", borderRadius: "0.25rem" }} />
              <span>已排班</span>
            </div>
          </div>

          {/* Calendar Grid */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "0.25rem" }}>
            {["日", "一", "二", "三", "四", "五", "六"].map((day) => (
              <div
                key={day}
                style={{ textAlign: "center", fontWeight: 500, color: "#6b7280", paddingTop: "0.5rem", paddingBottom: "0.5rem" }}
              >
                {day}
              </div>
            ))}
            {calendarDays.map((day, index) => {
              if (day === null) {
                return <div key={index} style={{ height: "5rem" }} />;
              }

              const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
              const avail = availability[dateStr];
              const dayEvents = events[dateStr] || [];
              const isToday = dateStr === todayStr;
              const isPast = new Date(dateStr) < new Date(todayStr);

              // Compute background and border colors
              let bgColor = "transparent";
              let borderColor = "#e5e7eb";
              if (avail?.available === false) {
                bgColor = "#fef2f2";
                borderColor = "#fecaca";
              } else if (dayEvents.length > 0) {
                bgColor = "#eff6ff";
                borderColor = "#bfdbfe";
              } else if (avail?.available === true) {
                bgColor = "#f0fdf4";
                borderColor = "#bbf7d0";
              }

              return (
                <div
                  key={index}
                  onClick={() => !isPast && handleDateClick(dateStr)}
                  style={{
                    height: "5rem",
                    border: `1px solid ${borderColor}`,
                    borderRadius: "0.5rem",
                    padding: "0.25rem",
                    cursor: isPast ? "not-allowed" : "pointer",
                    backgroundColor: bgColor,
                    opacity: isPast ? 0.5 : 1,
                    boxShadow: isToday ? "0 0 0 2px var(--primary, #3b82f6)" : "none",
                    transition: "background-color 0.15s",
                  }}
                >
                  <div style={{
                    fontSize: "0.875rem",
                    fontWeight: 500,
                    color: isToday ? "var(--primary, #3b82f6)" : "inherit",
                  }}>
                    {day}
                  </div>
                  {dayEvents.length > 0 && (
                    <div style={{ marginTop: "0.25rem" }}>
                      {dayEvents.slice(0, 2).map((e, i) => (
                        <div
                          key={i}
                          style={{
                            fontSize: "0.75rem",
                            backgroundColor: "#dbeafe",
                            color: "#1e40af",
                            paddingLeft: "0.25rem",
                            paddingRight: "0.25rem",
                            borderRadius: "0.25rem",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                            marginBottom: "0.125rem",
                          }}
                        >
                          {e.eventTitle}
                        </div>
                      ))}
                      {dayEvents.length > 2 && (
                        <div style={{ fontSize: "0.75rem", color: "#2563eb" }}>
                          +{dayEvents.length - 2} 場
                        </div>
                      )}
                    </div>
                  )}
                  {avail?.available === false && dayEvents.length === 0 && (
                    <div style={{ fontSize: "0.75rem", color: "#dc2626", marginTop: "0.25rem" }}>
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
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              <Label>不可出勤原因（選填）</Label>
              <Input
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="例：私人行程"
              />
            </div>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <Button
                style={{ flex: 1 }}
                variant="outline"
                onClick={() => handleSetAvailability(true)}
              >
                <Check style={{ width: "1rem", height: "1rem", marginRight: "0.5rem", color: "#16a34a" }} />
                可出勤
              </Button>
              <Button
                style={{ flex: 1 }}
                variant="outline"
                onClick={() => handleSetAvailability(false)}
              >
                <X style={{ width: "1rem", height: "1rem", marginRight: "0.5rem", color: "#dc2626" }} />
                不可出勤
              </Button>
            </div>
            {availability[selectedDate || ""] && (
              <Button
                variant="ghost"
                style={{ width: "100%" }}
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
