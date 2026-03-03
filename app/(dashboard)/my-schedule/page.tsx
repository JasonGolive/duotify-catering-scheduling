"use client";

import { useState, useEffect, useCallback } from "react";
import { useUser } from "@clerk/nextjs";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Clock,
  CheckCircle,
  AlertCircle,
  X,
} from "lucide-react";

interface StaffEvent {
  id: string;
  name: string;
  date: string;
  assemblyTime: string | null;
  startTime: string | null;
  location: string;
  address: string | null;
  eventType: string;
  eventStatus: string;
  workRole: string;
  attendanceStatus: string;
  confirmedAt: string | null;
  leaveReason: string | null;
  // GPS check-in/check-out data
  checkInTime: string | null;
  checkInLatitude: number | null;
  checkInLongitude: number | null;
  checkOutTime: string | null;
  checkOutLatitude: number | null;
  checkOutLongitude: number | null;
  actualHours: number | null;
}

interface MonthlySummary {
  month: number;
  year: number;
  totalEvents: number;
  confirmedEvents: number;
  pendingEvents: number;
  leaveRequested: number;
}

interface ApiResponse {
  events: StaffEvent[];
  summary: MonthlySummary | null;
}

export default function MySchedulePage() {
  const { user, isLoaded } = useUser();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<StaffEvent[]>([]);
  const [summary, setSummary] = useState<MonthlySummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [leaveDialogOpen, setLeaveDialogOpen] = useState(false);
  const [leaveEventId, setLeaveEventId] = useState<string | null>(null);
  const [leaveReason, setLeaveReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [gpsStatus, setGpsStatus] = useState<"idle" | "loading" | "error">("idle");
  const [gpsError, setGpsError] = useState<string | null>(null);

  const month = currentDate.getMonth() + 1;
  const year = currentDate.getFullYear();

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/v1/staff/me/events?month=${month}&year=${year}`);
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to fetch events");
      }
      const data: ApiResponse = await response.json();
      setEvents(data.events);
      setSummary(data.summary);
    } catch (err) {
      setError(err instanceof Error ? err.message : "發生錯誤");
    } finally {
      setLoading(false);
    }
  }, [month, year]);

  useEffect(() => {
    if (isLoaded && user) {
      fetchEvents();
    }
  }, [isLoaded, user, fetchEvents]);

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 2, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month, 1));
  };

  const handleConfirmAttendance = async (eventId: string) => {
    setSubmitting(true);
    try {
      const response = await fetch(`/api/v1/staff/me/events/${eventId}/confirm`, {
        method: "POST",
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to confirm attendance");
      }
      await fetchEvents();
    } catch (err) {
      alert(err instanceof Error ? err.message : "確認出勤失敗");
    } finally {
      setSubmitting(false);
    }
  };

  const openLeaveDialog = (eventId: string) => {
    setLeaveEventId(eventId);
    setLeaveReason("");
    setLeaveDialogOpen(true);
  };

  const closeLeaveDialog = () => {
    setLeaveDialogOpen(false);
    setLeaveEventId(null);
    setLeaveReason("");
  };

  const handleSubmitLeave = async () => {
    if (!leaveEventId || !leaveReason.trim()) {
      alert("請輸入請假原因");
      return;
    }
    setSubmitting(true);
    try {
      const response = await fetch(`/api/v1/staff/me/events/${leaveEventId}/leave`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: leaveReason.trim() }),
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to submit leave request");
      }
      closeLeaveDialog();
      await fetchEvents();
    } catch (err) {
      alert(err instanceof Error ? err.message : "請假申請失敗");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCheckIn = async (eventId: string) => {
    if (!navigator.geolocation) {
      alert("您的瀏覽器不支援定位功能");
      return;
    }

    setGpsStatus("loading");
    setGpsError(null);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const response = await fetch(`/api/v1/staff/me/events/${eventId}/checkin`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ latitude, longitude }),
          });
          if (!response.ok) {
            const data = await response.json();
            throw new Error(data.error || "打卡上班失敗");
          }
          setGpsStatus("idle");
          await fetchEvents();
        } catch (err) {
          setGpsStatus("error");
          setGpsError(err instanceof Error ? err.message : "打卡上班失敗");
          alert(err instanceof Error ? err.message : "打卡上班失敗");
        }
      },
      (error) => {
        setGpsStatus("error");
        let errorMsg = "無法取得位置";
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMsg = "請允許網站存取您的位置";
            break;
          case error.POSITION_UNAVAILABLE:
            errorMsg = "位置資訊無法取得";
            break;
          case error.TIMEOUT:
            errorMsg = "取得位置逾時";
            break;
        }
        setGpsError(errorMsg);
        alert(errorMsg);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const handleCheckOut = async (eventId: string) => {
    if (!navigator.geolocation) {
      alert("您的瀏覽器不支援定位功能");
      return;
    }

    setGpsStatus("loading");
    setGpsError(null);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const response = await fetch(`/api/v1/staff/me/events/${eventId}/checkout`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ latitude, longitude }),
          });
          if (!response.ok) {
            const data = await response.json();
            throw new Error(data.error || "打卡下班失敗");
          }
          setGpsStatus("idle");
          await fetchEvents();
        } catch (err) {
          setGpsStatus("error");
          setGpsError(err instanceof Error ? err.message : "打卡下班失敗");
          alert(err instanceof Error ? err.message : "打卡下班失敗");
        }
      },
      (error) => {
        setGpsStatus("error");
        let errorMsg = "無法取得位置";
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMsg = "請允許網站存取您的位置";
            break;
          case error.POSITION_UNAVAILABLE:
            errorMsg = "位置資訊無法取得";
            break;
          case error.TIMEOUT:
            errorMsg = "取得位置逾時";
            break;
        }
        setGpsError(errorMsg);
        alert(errorMsg);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  // Check if user is a manager
  const userRole = user?.publicMetadata?.role as string | undefined;
  const isManager = userRole === "MANAGER";

  if (!isLoaded) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "60vh" }}>
        <div style={{ color: "#6b7280" }}>載入中...</div>
      </div>
    );
  }

  if (isManager) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "60vh", gap: "1rem" }}>
        <AlertCircle style={{ width: "3rem", height: "3rem", color: "#f59e0b" }} />
        <h1 style={{ fontSize: "1.5rem", fontWeight: "bold", color: "#374151" }}>此頁面僅供員工使用</h1>
        <p style={{ color: "#6b7280" }}>管理者請使用排班管理功能</p>
        <Link
          href="/home"
          style={{
            marginTop: "1rem",
            padding: "0.75rem 1.5rem",
            backgroundColor: "#8BA4BC",
            color: "white",
            borderRadius: "0.5rem",
            textDecoration: "none",
            fontWeight: 500,
          }}
        >
          返回首頁
        </Link>
      </div>
    );
  }

  const getWorkRoleLabel = (role: string) => {
    switch (role) {
      case "FRONT": return "外場";
      case "HOT": return "熱台";
      case "BOTH": return "皆可";
      default: return role;
    }
  };

  const getStatusBadge = (status: string) => {
    const configs: Record<string, { bg: string; color: string; label: string }> = {
      SCHEDULED: { bg: "#fef9c3", color: "#a16207", label: "待確認" },
      CONFIRMED: { bg: "#dcfce7", color: "#15803d", label: "已確認" },
      LEAVE_REQUESTED: { bg: "#fee2e2", color: "#b91c1c", label: "請假中" },
      LEAVE_APPROVED: { bg: "#f3f4f6", color: "#374151", label: "請假核准" },
      LEAVE_REJECTED: { bg: "#fef9c3", color: "#a16207", label: "請假被拒" },
      ATTENDED: { bg: "#dcfce7", color: "#15803d", label: "已出勤" },
      COMPLETED: { bg: "#f3f4f6", color: "#374151", label: "已完成" },
      CANCELLED: { bg: "#f3f4f6", color: "#6b7280", label: "已取消" },
    };
    const config = configs[status] || { bg: "#f3f4f6", color: "#374151", label: status };
    return (
      <span style={{
        display: "inline-flex",
        alignItems: "center",
        padding: "0.25rem 0.5rem",
        borderRadius: "0.375rem",
        fontSize: "0.75rem",
        fontWeight: 600,
        backgroundColor: config.bg,
        color: config.color,
      }}>
        {config.label}
      </span>
    );
  };

  // Build calendar data
  const firstDayOfMonth = new Date(year, month - 1, 1);
  const lastDayOfMonth = new Date(year, month, 0);
  const daysInMonth = lastDayOfMonth.getDate();
  const startDayOfWeek = firstDayOfMonth.getDay();

  const calendarDays: (number | null)[] = [];
  for (let i = 0; i < startDayOfWeek; i++) {
    calendarDays.push(null);
  }
  for (let i = 1; i <= daysInMonth; i++) {
    calendarDays.push(i);
  }

  const eventsByDate: Record<string, StaffEvent[]> = {};
  events.forEach((event) => {
    const dateKey = event.date;
    if (!eventsByDate[dateKey]) {
      eventsByDate[dateKey] = [];
    }
    eventsByDate[dateKey].push(event);
  });

  const monthNames = ["一月", "二月", "三月", "四月", "五月", "六月", "七月", "八月", "九月", "十月", "十一月", "十二月"];
  const weekDays = ["日", "一", "二", "三", "四", "五", "六"];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      {/* Header */}
      <div>
        <h1 style={{ fontSize: "1.5rem", fontWeight: "bold", color: "#111827" }}>我的排班</h1>
        <p style={{ color: "#6b7280", marginTop: "0.25rem" }}>查看您的活動安排並確認出勤</p>
      </div>

      {/* Month Navigation */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <button
          onClick={handlePrevMonth}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.25rem",
            padding: "0.5rem 1rem",
            backgroundColor: "white",
            border: "1px solid #e5e7eb",
            borderRadius: "0.5rem",
            cursor: "pointer",
            color: "#374151",
          }}
        >
          <ChevronLeft style={{ width: "1rem", height: "1rem" }} />
          上一月
        </button>
        <h2 style={{ fontSize: "1.25rem", fontWeight: 600, color: "#111827" }}>
          {year} 年 {monthNames[month - 1]}
        </h2>
        <button
          onClick={handleNextMonth}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.25rem",
            padding: "0.5rem 1rem",
            backgroundColor: "white",
            border: "1px solid #e5e7eb",
            borderRadius: "0.5rem",
            cursor: "pointer",
            color: "#374151",
          }}
        >
          下一月
          <ChevronRight style={{ width: "1rem", height: "1rem" }} />
        </button>
      </div>

      {/* Monthly Summary Stats */}
      {summary && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "1rem" }}>
          <Card style={{ backgroundColor: "white", borderRadius: "0.75rem", border: "none", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
            <CardContent style={{ padding: "1rem", textAlign: "center" }}>
              <p style={{ fontSize: "0.875rem", color: "#6b7280" }}>本月場次</p>
              <p style={{ fontSize: "1.5rem", fontWeight: "bold", color: "#111827", marginTop: "0.25rem" }}>{summary.totalEvents} 場</p>
            </CardContent>
          </Card>
          <Card style={{ backgroundColor: "white", borderRadius: "0.75rem", border: "none", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
            <CardContent style={{ padding: "1rem", textAlign: "center" }}>
              <p style={{ fontSize: "0.875rem", color: "#6b7280" }}>已確認</p>
              <p style={{ fontSize: "1.5rem", fontWeight: "bold", color: "#15803d", marginTop: "0.25rem" }}>{summary.confirmedEvents} 場</p>
            </CardContent>
          </Card>
          <Card style={{ backgroundColor: "white", borderRadius: "0.75rem", border: "none", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
            <CardContent style={{ padding: "1rem", textAlign: "center" }}>
              <p style={{ fontSize: "0.875rem", color: "#6b7280" }}>待確認</p>
              <p style={{ fontSize: "1.5rem", fontWeight: "bold", color: "#a16207", marginTop: "0.25rem" }}>{summary.pendingEvents} 場</p>
            </CardContent>
          </Card>
          <Card style={{ backgroundColor: "white", borderRadius: "0.75rem", border: "none", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
            <CardContent style={{ padding: "1rem", textAlign: "center" }}>
              <p style={{ fontSize: "0.875rem", color: "#6b7280" }}>請假中</p>
              <p style={{ fontSize: "1.5rem", fontWeight: "bold", color: "#b91c1c", marginTop: "0.25rem" }}>{summary.leaveRequested} 場</p>
            </CardContent>
          </Card>
        </div>
      )}

      {error && (
        <div style={{ padding: "1rem", backgroundColor: "#fee2e2", borderRadius: "0.5rem", color: "#b91c1c" }}>
          {error}
        </div>
      )}

      {loading ? (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "3rem" }}>
          <div style={{ color: "#6b7280" }}>載入中...</div>
        </div>
      ) : (
        <>
          {/* Calendar View */}
          <Card style={{ backgroundColor: "white", borderRadius: "1rem", border: "none", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
            <CardHeader>
              <CardTitle style={{ fontSize: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <Calendar style={{ width: "1rem", height: "1rem", color: "#5A7A9A" }} />
                月曆檢視
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "0.25rem" }}>
                {/* Week headers */}
                {weekDays.map((day) => (
                  <div key={day} style={{ textAlign: "center", padding: "0.5rem", fontWeight: 600, color: "#6b7280", fontSize: "0.875rem" }}>
                    {day}
                  </div>
                ))}
                {/* Calendar days */}
                {calendarDays.map((day, index) => {
                  if (day === null) {
                    return <div key={`empty-${index}`} style={{ padding: "0.5rem" }} />;
                  }
                  const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                  const dayEvents = eventsByDate[dateStr] || [];
                  const hasEvents = dayEvents.length > 0;
                  const today = new Date();
                  const isToday = day === today.getDate() && month === today.getMonth() + 1 && year === today.getFullYear();

                  return (
                    <div
                      key={day}
                      style={{
                        padding: "0.5rem",
                        minHeight: "4rem",
                        borderRadius: "0.5rem",
                        backgroundColor: isToday ? "#D9E2EC" : hasEvents ? "#f0f9ff" : "#f9fafb",
                        border: isToday ? "2px solid #8BA4BC" : "1px solid #e5e7eb",
                      }}
                    >
                      <div style={{ fontWeight: isToday ? 600 : 400, color: isToday ? "#334E68" : "#374151", marginBottom: "0.25rem" }}>
                        {day}
                      </div>
                      {dayEvents.map((event) => (
                        <div
                          key={event.id}
                          style={{
                            fontSize: "0.625rem",
                            padding: "0.125rem 0.25rem",
                            borderRadius: "0.25rem",
                            backgroundColor: event.attendanceStatus === "CONFIRMED" ? "#dcfce7" : event.attendanceStatus === "LEAVE_REQUESTED" ? "#fee2e2" : "#fef9c3",
                            color: event.attendanceStatus === "CONFIRMED" ? "#15803d" : event.attendanceStatus === "LEAVE_REQUESTED" ? "#b91c1c" : "#a16207",
                            marginBottom: "0.125rem",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {event.name}
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Event List */}
          <Card style={{ backgroundColor: "white", borderRadius: "1rem", border: "none", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
            <CardHeader>
              <CardTitle style={{ fontSize: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <Clock style={{ width: "1rem", height: "1rem", color: "#5A7A9A" }} />
                活動列表
              </CardTitle>
            </CardHeader>
            <CardContent style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {events.length === 0 ? (
                <p style={{ textAlign: "center", color: "#6b7280", padding: "2rem 0" }}>
                  本月沒有排定的活動
                </p>
              ) : (
                events.map((event) => {
                  const eventDate = new Date(event.date);
                  const day = eventDate.getDate();
                  const monthNum = eventDate.getMonth() + 1;
                  const weekDay = weekDays[eventDate.getDay()];

                  return (
                    <div
                      key={event.id}
                      style={{
                        display: "flex",
                        alignItems: "flex-start",
                        gap: "1rem",
                        padding: "1rem",
                        borderRadius: "0.75rem",
                        backgroundColor: "#f9fafb",
                        border: "1px solid #e5e7eb",
                      }}
                    >
                      {/* Date */}
                      <div style={{
                        width: "3.5rem",
                        flexShrink: 0,
                        textAlign: "center",
                        padding: "0.5rem",
                        borderRadius: "0.5rem",
                        backgroundColor: "#D9E2EC",
                      }}>
                        <div style={{ fontSize: "0.75rem", color: "#5A7A9A" }}>{monthNum}月</div>
                        <div style={{ fontSize: "1.25rem", fontWeight: "bold", color: "#334E68" }}>{day}</div>
                        <div style={{ fontSize: "0.75rem", color: "#5A7A9A" }}>週{weekDay}</div>
                      </div>

                      {/* Event Details */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
                          <h3 style={{ fontWeight: 600, color: "#111827" }}>{event.name}</h3>
                          {getStatusBadge(event.attendanceStatus)}
                          <span style={{
                            display: "inline-flex",
                            alignItems: "center",
                            padding: "0.125rem 0.375rem",
                            borderRadius: "0.25rem",
                            fontSize: "0.75rem",
                            fontWeight: 500,
                            backgroundColor: "#e0e7ff",
                            color: "#3730a3",
                          }}>
                            {getWorkRoleLabel(event.workRole)}
                          </span>
                        </div>

                        <div style={{ marginTop: "0.5rem", display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                          {event.assemblyTime && (
                            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.875rem", color: "#6b7280" }}>
                              <Clock style={{ width: "0.875rem", height: "0.875rem" }} />
                              集合時間: {event.assemblyTime}
                              {event.startTime && ` / 活動開始: ${event.startTime}`}
                            </div>
                          )}
                          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.875rem", color: "#6b7280" }}>
                            <MapPin style={{ width: "0.875rem", height: "0.875rem" }} />
                            {event.location}
                          </div>
                        </div>

                        {event.leaveReason && (
                          <div style={{ marginTop: "0.5rem", padding: "0.5rem", backgroundColor: "#fef2f2", borderRadius: "0.375rem", fontSize: "0.875rem", color: "#991b1b" }}>
                            請假原因: {event.leaveReason}
                          </div>
                        )}

                        {/* Check-in/Check-out Info */}
                        {(event.checkInTime || event.checkOutTime) && (
                          <div style={{ marginTop: "0.5rem", padding: "0.5rem", backgroundColor: "#f0fdf4", borderRadius: "0.375rem", fontSize: "0.875rem" }}>
                            {event.checkInTime && (
                              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "#15803d" }}>
                                <span style={{ display: "inline-flex", width: "6px", height: "6px", borderRadius: "50%", backgroundColor: "#22c55e" }} />
                                上班打卡: {new Date(event.checkInTime).toLocaleTimeString("zh-TW", { hour: "2-digit", minute: "2-digit" })}
                              </div>
                            )}
                            {event.checkOutTime && (
                              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "#15803d", marginTop: "0.25rem" }}>
                                <span style={{ display: "inline-flex", width: "6px", height: "6px", borderRadius: "50%", backgroundColor: "#22c55e" }} />
                                下班打卡: {new Date(event.checkOutTime).toLocaleTimeString("zh-TW", { hour: "2-digit", minute: "2-digit" })}
                                {event.actualHours !== null && ` (工時: ${event.actualHours.toFixed(2)} 小時)`}
                              </div>
                            )}
                          </div>
                        )}

                        {/* Actions */}
                        <div style={{ marginTop: "0.75rem", display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                          {event.attendanceStatus === "SCHEDULED" && (
                            <>
                              <button
                                onClick={() => handleConfirmAttendance(event.id)}
                                disabled={submitting}
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "0.25rem",
                                  padding: "0.5rem 1rem",
                                  backgroundColor: "#16a34a",
                                  color: "white",
                                  border: "none",
                                  borderRadius: "0.5rem",
                                  cursor: submitting ? "not-allowed" : "pointer",
                                  fontWeight: 500,
                                  fontSize: "0.875rem",
                                  opacity: submitting ? 0.6 : 1,
                                }}
                              >
                                <CheckCircle style={{ width: "1rem", height: "1rem" }} />
                                確認出勤
                              </button>
                              <button
                                onClick={() => openLeaveDialog(event.id)}
                                disabled={submitting}
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "0.25rem",
                                  padding: "0.5rem 1rem",
                                  backgroundColor: "white",
                                  color: "#b91c1c",
                                  border: "1px solid #fca5a5",
                                  borderRadius: "0.5rem",
                                  cursor: submitting ? "not-allowed" : "pointer",
                                  fontWeight: 500,
                                  fontSize: "0.875rem",
                                  opacity: submitting ? 0.6 : 1,
                                }}
                              >
                                請假
                              </button>
                            </>
                          )}
                          {event.attendanceStatus === "CONFIRMED" && !event.checkInTime && (
                            <>
                              <button
                                onClick={() => handleCheckIn(event.id)}
                                disabled={gpsStatus === "loading"}
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "0.25rem",
                                  padding: "0.5rem 1rem",
                                  backgroundColor: "#0284c7",
                                  color: "white",
                                  border: "none",
                                  borderRadius: "0.5rem",
                                  cursor: gpsStatus === "loading" ? "not-allowed" : "pointer",
                                  fontWeight: 500,
                                  fontSize: "0.875rem",
                                  opacity: gpsStatus === "loading" ? 0.6 : 1,
                                }}
                              >
                                <MapPin style={{ width: "1rem", height: "1rem" }} />
                                {gpsStatus === "loading" ? "定位中..." : "打卡上班"}
                              </button>
                              <button
                                onClick={() => openLeaveDialog(event.id)}
                                disabled={submitting}
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "0.25rem",
                                  padding: "0.5rem 1rem",
                                  backgroundColor: "white",
                                  color: "#b91c1c",
                                  border: "1px solid #fca5a5",
                                  borderRadius: "0.5rem",
                                  cursor: submitting ? "not-allowed" : "pointer",
                                  fontWeight: 500,
                                  fontSize: "0.875rem",
                                  opacity: submitting ? 0.6 : 1,
                                }}
                              >
                                請假
                              </button>
                            </>
                          )}
                          {event.checkInTime && !event.checkOutTime && (
                            <button
                              onClick={() => handleCheckOut(event.id)}
                              disabled={gpsStatus === "loading"}
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "0.25rem",
                                padding: "0.5rem 1rem",
                                backgroundColor: "#dc2626",
                                color: "white",
                                border: "none",
                                borderRadius: "0.5rem",
                                cursor: gpsStatus === "loading" ? "not-allowed" : "pointer",
                                fontWeight: 500,
                                fontSize: "0.875rem",
                                opacity: gpsStatus === "loading" ? 0.6 : 1,
                              }}
                            >
                              <MapPin style={{ width: "1rem", height: "1rem" }} />
                              {gpsStatus === "loading" ? "定位中..." : "打卡下班"}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>
        </>
      )}

      {/* Leave Dialog */}
      {leaveDialogOpen && (
        <>
          {/* Overlay */}
          <div
            onClick={closeLeaveDialog}
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: "rgba(0, 0, 0, 0.5)",
              zIndex: 9998,
            }}
          />
          {/* Dialog */}
          <div
            style={{
              position: "fixed",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              backgroundColor: "white",
              borderRadius: "1rem",
              padding: "1.5rem",
              width: "90%",
              maxWidth: "400px",
              zIndex: 9999,
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
              <h3 style={{ fontSize: "1.125rem", fontWeight: 600, color: "#111827" }}>請假申請</h3>
              <button
                onClick={closeLeaveDialog}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: "0.25rem",
                  color: "#6b7280",
                }}
              >
                <X style={{ width: "1.25rem", height: "1.25rem" }} />
              </button>
            </div>
            <div style={{ marginBottom: "1rem" }}>
              <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 500, color: "#374151" }}>
                請假原因 <span style={{ color: "#dc2626" }}>*</span>
              </label>
              <textarea
                value={leaveReason}
                onChange={(e) => setLeaveReason(e.target.value)}
                placeholder="請輸入請假原因..."
                style={{
                  width: "100%",
                  minHeight: "100px",
                  padding: "0.75rem",
                  borderRadius: "0.5rem",
                  border: "1px solid #d1d5db",
                  resize: "vertical",
                  fontSize: "0.875rem",
                  boxSizing: "border-box",
                }}
              />
            </div>
            <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end" }}>
              <button
                onClick={closeLeaveDialog}
                style={{
                  padding: "0.5rem 1rem",
                  backgroundColor: "white",
                  color: "#374151",
                  border: "1px solid #d1d5db",
                  borderRadius: "0.5rem",
                  cursor: "pointer",
                  fontWeight: 500,
                }}
              >
                取消
              </button>
              <button
                onClick={handleSubmitLeave}
                disabled={submitting || !leaveReason.trim()}
                style={{
                  padding: "0.5rem 1rem",
                  backgroundColor: submitting || !leaveReason.trim() ? "#9ca3af" : "#dc2626",
                  color: "white",
                  border: "none",
                  borderRadius: "0.5rem",
                  cursor: submitting || !leaveReason.trim() ? "not-allowed" : "pointer",
                  fontWeight: 500,
                }}
              >
                {submitting ? "提交中..." : "提交請假"}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
