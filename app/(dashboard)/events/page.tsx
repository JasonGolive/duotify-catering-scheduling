"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Calendar,
  Plus,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  Bell,
  Users,
  UtensilsCrossed,
  Download,
  Eye,
} from "lucide-react";
import Link from "next/link";
import * as XLSX from "xlsx";
import { toast } from "sonner";

type ViewRange = "day" | "week" | "month";

interface EventStaffInfo {
  id: string;
  notified: boolean;
  staff: { id: string; name: string };
}

interface EventMenuInfo {
  id: string;
  lockedAt: string | null;
}

interface Event {
  id: string;
  name: string;
  date: string;
  startTime?: string | null;
  location: string;
  adultsCount?: number | null;
  childrenCount?: number | null;
  vegetarianCount?: number | null;
  eventType: string;
  status: string;
  totalAmount?: number | null;
  venue?: { id: string; name: string } | null;
  eventMenu?: EventMenuInfo | null;
  eventStaff: EventStaffInfo[];
}

const statusLabels: Record<string, string> = {
  PENDING: "待確認",
  CONFIRMED: "已確認",
  IN_PROGRESS: "進行中",
  COMPLETED: "已完成",
  CANCELLED: "已取消",
};

const eventTypeLabels: Record<string, string> = {
  WEDDING: "婚宴",
  BANQUET: "宴會",
  CORPORATE: "企業活動",
  BIRTHDAY: "生日宴",
  OTHER: "其他",
};

export default function EventsPage() {
  const router = useRouter();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewRange, setViewRange] = useState<ViewRange>("month");
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [accessDenied, setAccessDenied] = useState(false);
  const [exporting, setExporting] = useState(false);

  // Calculate date range
  const getDateRange = () => {
    const d = new Date(currentDate);
    if (viewRange === "day") {
      const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      return { startDate: dateStr, endDate: dateStr };
    } else if (viewRange === "week") {
      const dayOfWeek = d.getDay();
      const start = new Date(d);
      start.setDate(d.getDate() - dayOfWeek);
      const end = new Date(start);
      end.setDate(start.getDate() + 6);
      const startStr = `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, "0")}-${String(start.getDate()).padStart(2, "0")}`;
      const endStr = `${end.getFullYear()}-${String(end.getMonth() + 1).padStart(2, "0")}-${String(end.getDate()).padStart(2, "0")}`;
      return { startDate: startStr, endDate: endStr };
    } else {
      const year = d.getFullYear();
      const month = d.getMonth();
      const lastDay = new Date(year, month + 1, 0).getDate();
      const startStr = `${year}-${String(month + 1).padStart(2, "0")}-01`;
      const endStr = `${year}-${String(month + 1).padStart(2, "0")}-${lastDay}`;
      return { startDate: startStr, endDate: endStr };
    }
  };

  const getDateLabel = () => {
    const d = new Date(currentDate);
    if (viewRange === "day") {
      return d.toLocaleDateString("zh-TW", { year: "numeric", month: "long", day: "numeric", weekday: "short" });
    } else if (viewRange === "week") {
      const dayOfWeek = d.getDay();
      const start = new Date(d);
      start.setDate(d.getDate() - dayOfWeek);
      const end = new Date(start);
      end.setDate(start.getDate() + 6);
      return `${start.getMonth() + 1}/${start.getDate()} - ${end.getMonth() + 1}/${end.getDate()}`;
    } else {
      return `${d.getFullYear()} 年 ${d.getMonth() + 1} 月`;
    }
  };

  const navigate = (direction: number) => {
    const d = new Date(currentDate);
    if (viewRange === "day") d.setDate(d.getDate() + direction);
    else if (viewRange === "week") d.setDate(d.getDate() + 7 * direction);
    else d.setMonth(d.getMonth() + direction);
    setCurrentDate(d);
  };

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const { startDate, endDate } = getDateRange();
      const res = await fetch(`/api/v1/events?startDate=${startDate}&endDate=${endDate}`);
      if (res.status === 401 || res.status === 403) {
        setAccessDenied(true);
        return;
      }
      if (!res.ok) throw new Error("取得活動失敗");
      const data = await res.json();
      setEvents(Array.isArray(data) ? data : []);
    } catch (error) {
      toast.error("無法載入活動資料");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [currentDate, viewRange]);

  // Export to Excel
  const handleExport = async () => {
    setExporting(true);
    try {
      const excelData = events.map((event) => ({
        日期: new Date(event.date).toLocaleDateString("zh-TW"),
        活動名稱: event.name,
        場地: event.venue?.name || event.location || "",
        類型: eventTypeLabels[event.eventType] || event.eventType,
        狀態: statusLabels[event.status] || event.status,
        菜單狀態: event.eventMenu ? (event.eventMenu.lockedAt ? "已鎖定" : "已設定") : "未設定",
        排班人數: event.eventStaff?.length || 0,
        已通知: event.eventStaff?.filter((s) => s.notified).length || 0,
        總金額: event.totalAmount ?? "",
      }));
      const ws = XLSX.utils.json_to_sheet(excelData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "場次報表");
      const today = new Date().toISOString().split("T")[0];
      XLSX.writeFile(wb, `場次報表_${today}.xlsx`);
      toast.success("匯出成功");
    } catch {
      toast.error("匯出失敗");
    } finally {
      setExporting(false);
    }
  };

  if (accessDenied) {
    return (
      <div style={{ display: "flex", minHeight: "100vh", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "2rem" }}>
        <h1 style={{ fontSize: "1.5rem", fontWeight: "bold", color: "#dc2626" }}>存取被拒絕</h1>
        <p style={{ marginTop: "1rem", color: "#4b5563" }}>您沒有權限存取此頁面。需要管理員權限。</p>
        <Link href="/" style={{ marginTop: "1.5rem", color: "#2563eb", textDecoration: "none" }}>返回首頁</Link>
      </div>
    );
  }

  // Statistics
  const totalEvents = events.length;
  const confirmedEvents = events.filter((e) => e.status === "CONFIRMED").length;
  const pendingEvents = events.filter((e) => e.status === "PENDING").length;
  const unscheduledEvents = events.filter((e) => !e.eventStaff || e.eventStaff.length === 0).length;

  return (
    <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "1.5rem 1rem" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.5rem", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h1 style={{ fontSize: "1.875rem", fontWeight: "bold", letterSpacing: "-0.025em" }}>場次管理</h1>
          <p style={{ color: "#6b7280" }}>管理您的外燴活動場次</p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
          <Button variant="outline" onClick={handleExport} disabled={exporting}>
            <Download style={{ width: "1rem", height: "1rem", marginRight: "0.5rem" }} />
            {exporting ? "匯出中..." : "匯出"}
          </Button>
          <Button asChild>
            <Link href="/events/new" style={{ display: "flex", alignItems: "center" }}>
              <Plus style={{ marginRight: "0.5rem", height: "1rem", width: "1rem" }} />
              新增場次
            </Link>
          </Button>
        </div>
      </div>

      {/* View Range Selector + Date Navigation */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.5rem", flexWrap: "wrap", gap: "0.75rem" }}>
        <div style={{ display: "flex", gap: "0.5rem", padding: "0.25rem", backgroundColor: "#f9fafb", borderRadius: "0.5rem", border: "1px solid #e5e7eb" }}>
          {([
            { key: "day" as ViewRange, label: "日" },
            { key: "week" as ViewRange, label: "週" },
            { key: "month" as ViewRange, label: "月" },
          ]).map((item) => (
            <button
              key={item.key}
              onClick={() => setViewRange(item.key)}
              style={{
                padding: "0.5rem 1rem",
                borderRadius: "0.375rem",
                border: viewRange === item.key ? "1px solid #3b82f6" : "1px solid transparent",
                backgroundColor: viewRange === item.key ? "#dbeafe" : "transparent",
                color: viewRange === item.key ? "#1d4ed8" : "#374151",
                fontWeight: viewRange === item.key ? "600" : "400",
                fontSize: "0.875rem",
                cursor: "pointer",
              }}
            >
              {item.label}
            </button>
          ))}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <Button variant="outline" size="icon" onClick={() => navigate(-1)}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <div style={{ fontSize: "1.125rem", fontWeight: "500", padding: "0 1rem", minWidth: "180px", textAlign: "center" }}>
            {getDateLabel()}
          </div>
          <Button variant="outline" size="icon" onClick={() => navigate(1)}>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "1rem", marginBottom: "1.5rem" }}>
        <Card>
          <CardContent className="pt-4">
            <div style={{ fontSize: "1.5rem", fontWeight: "bold" }}>{totalEvents}</div>
            <div style={{ fontSize: "0.875rem", color: "#6b7280" }}>活動總數</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div style={{ fontSize: "1.5rem", fontWeight: "bold", color: "#16a34a" }}>{confirmedEvents}</div>
            <div style={{ fontSize: "0.875rem", color: "#6b7280" }}>已確認</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div style={{ fontSize: "1.5rem", fontWeight: "bold", color: "#ca8a04" }}>{pendingEvents}</div>
            <div style={{ fontSize: "0.875rem", color: "#6b7280" }}>待確認</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div style={{ fontSize: "1.5rem", fontWeight: "bold", color: "#2563eb" }}>{unscheduledEvents}</div>
            <div style={{ fontSize: "0.875rem", color: "#6b7280" }}>未排班</div>
          </CardContent>
        </Card>
      </div>

      {/* Events Table */}
      {loading ? (
        <div style={{ textAlign: "center", padding: "3rem 0", color: "#6b7280" }}>載入中...</div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              場次列表
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
                  <TableHead>菜單確認</TableHead>
                  <TableHead>已排班人員</TableHead>
                  <TableHead>通知狀態</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {events.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} style={{ textAlign: "center", padding: "2rem 0", color: "#6b7280" }}>
                      此區間尚無活動
                    </TableCell>
                  </TableRow>
                ) : (
                  events
                    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                    .map((event) => {
                      const staffList = event.eventStaff || [];
                      const totalStaff = staffList.length;
                      const notifiedCount = staffList.filter((s) => s.notified).length;
                      const hasMenu = !!event.eventMenu;
                      const menuLocked = event.eventMenu?.lockedAt;

                      return (
                        <TableRow key={event.id}>
                          <TableCell>
                            <div style={{ fontWeight: "500" }}>
                              {new Date(event.date).toLocaleDateString("zh-TW", { month: "numeric", day: "numeric", weekday: "short" })}
                            </div>
                            {event.startTime && (
                              <div style={{ fontSize: "0.875rem", color: "#6b7280" }}>{event.startTime}</div>
                            )}
                          </TableCell>
                          <TableCell>
                            <div style={{ fontWeight: "500" }}>{event.name}</div>
                            <div style={{ fontSize: "0.75rem", color: "#9ca3af" }}>
                              {eventTypeLabels[event.eventType] || event.eventType}
                            </div>
                          </TableCell>
                          <TableCell>{event.venue?.name || event.location || "-"}</TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                event.status === "CONFIRMED" ? "default"
                                : event.status === "CANCELLED" ? "destructive"
                                : "secondary"
                              }
                            >
                              {statusLabels[event.status]}
                            </Badge>
                          </TableCell>
                          {/* 菜單確認狀態 */}
                          <TableCell>
                            {menuLocked ? (
                              <Badge style={{ backgroundColor: "#dcfce7", color: "#166534" }}>
                                <CheckCircle2 className="w-3 h-3 mr-1" />
                                已鎖定
                              </Badge>
                            ) : hasMenu ? (
                              <Badge style={{ backgroundColor: "#dbeafe", color: "#1e40af" }}>
                                <UtensilsCrossed className="w-3 h-3 mr-1" />
                                已設定
                              </Badge>
                            ) : (
                              <Badge style={{ backgroundColor: "#fef9c3", color: "#854d0e" }}>
                                <AlertCircle className="w-3 h-3 mr-1" />
                                未設定
                              </Badge>
                            )}
                          </TableCell>
                          {/* 已排班人員 */}
                          <TableCell>
                            {totalStaff === 0 ? (
                              <span style={{ color: "#9ca3af" }}>尚未排班</span>
                            ) : (
                              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.25rem" }}>
                                {staffList.slice(0, 3).map((es) => (
                                  <Badge key={es.id} variant="outline">{es.staff.name}</Badge>
                                ))}
                                {totalStaff > 3 && <Badge variant="outline">+{totalStaff - 3}</Badge>}
                              </div>
                            )}
                          </TableCell>
                          {/* 通知狀態 */}
                          <TableCell>
                            {totalStaff === 0 ? (
                              <span style={{ color: "#9ca3af" }}>-</span>
                            ) : notifiedCount === totalStaff ? (
                              <Badge style={{ backgroundColor: "#dcfce7", color: "#166534" }}>
                                <CheckCircle2 className="w-3 h-3 mr-1" />
                                全部已通知
                              </Badge>
                            ) : notifiedCount === 0 ? (
                              <Badge style={{ backgroundColor: "#fef9c3", color: "#854d0e" }}>
                                <AlertCircle className="w-3 h-3 mr-1" />
                                待通知 {totalStaff}
                              </Badge>
                            ) : (
                              <Badge style={{ backgroundColor: "#dbeafe", color: "#1e40af" }}>
                                <Bell className="w-3 h-3 mr-1" />
                                {notifiedCount}/{totalStaff}
                              </Badge>
                            )}
                          </TableCell>
                          {/* 操作 */}
                          <TableCell style={{ textAlign: "right" }}>
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "0.5rem" }}>
                              <Button variant="outline" size="sm" asChild>
                                <Link href={`/events/${event.id}`}>
                                  <Eye className="w-4 h-4 mr-1" />
                                  詳情
                                </Link>
                              </Button>
                              <Button variant="outline" size="sm" asChild>
                                <Link href={`/menus/events/${event.id}`}>
                                  <UtensilsCrossed className="w-4 h-4 mr-1" />
                                  菜單
                                </Link>
                              </Button>
                              <Button variant="outline" size="sm" asChild>
                                <Link href={`/scheduling?event=${event.id}`}>
                                  <Users className="w-4 h-4 mr-1" />
                                  排班
                                </Link>
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
