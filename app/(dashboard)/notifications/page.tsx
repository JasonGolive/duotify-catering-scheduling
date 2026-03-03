"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
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
  DialogFooter,
} from "@/components/ui/dialog";
import { Calendar, Users, Send, Download, Bell, CheckCircle2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { zhTW } from "date-fns/locale";

interface EventStaffInfo {
  id: string;
  staff: {
    id: string;
    name: string;
    phone: string;
    email?: string;
    lineUserId?: string;
  };
  workRole: string;
  notified: boolean;
  notifiedAt?: string;
}

interface EventWithStaff {
  id: string;
  name: string;
  date: string;
  assemblyTime?: string;
  startTime?: string;
  location: string;
  venue?: { name: string };
  status: string;
  eventStaff: EventStaffInfo[];
}

interface NotificationPreview {
  eventId: string;
  eventName: string;
  eventDate: string;
  staffId: string;
  staffName: string;
  staffPhone: string;
  hasLine: boolean;
  hasEmail: boolean;
  notified: boolean;
}

const statusLabels: Record<string, string> = {
  PENDING: "待確認",
  CONFIRMED: "已確認",
  IN_PROGRESS: "進行中",
  COMPLETED: "已完成",
  CANCELLED: "已取消",
};

const workRoleLabels: Record<string, string> = {
  FRONT: "外場",
  HOT: "熱台",
  ASSIST: "助手",
  LEAD: "領班",
};

export default function NotificationsPage() {
  const [startDate, setStartDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [endDate, setEndDate] = useState(
    format(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), "yyyy-MM-dd")
  );
  const [events, setEvents] = useState<EventWithStaff[]>([]);
  const [selectedEvents, setSelectedEvents] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewData, setPreviewData] = useState<NotificationPreview[]>([]);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/v1/events?startDate=${startDate}&endDate=${endDate}`
      );
      if (!response.ok) throw new Error("取得活動失敗");
      const data = await response.json();

      // Fetch staff for each event
      const eventsWithStaff = await Promise.all(
        data.map(async (event: EventWithStaff) => {
          const staffRes = await fetch(`/api/v1/events/${event.id}/staff`);
          const staffData = staffRes.ok ? await staffRes.json() : { eventStaff: [] };
          return { ...event, eventStaff: staffData.eventStaff || [] };
        })
      );

      setEvents(eventsWithStaff);
      // Auto-select events with pending notifications
      const pendingEventIds = eventsWithStaff
        .filter((e: EventWithStaff) => e.eventStaff.some((es: EventStaffInfo) => !es.notified))
        .map((e: EventWithStaff) => e.id);
      setSelectedEvents(new Set(pendingEventIds));
    } catch (error) {
      toast.error("無法載入活動");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const handleSearch = () => {
    fetchEvents();
  };

  const toggleEventSelection = (eventId: string) => {
    setSelectedEvents((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(eventId)) {
        newSet.delete(eventId);
      } else {
        newSet.add(eventId);
      }
      return newSet;
    });
  };

  const selectAll = () => {
    const eventsWithPending = events.filter((e) =>
      e.eventStaff.some((es) => !es.notified)
    );
    setSelectedEvents(new Set(eventsWithPending.map((e) => e.id)));
  };

  const deselectAll = () => {
    setSelectedEvents(new Set());
  };

  const generatePreview = () => {
    const preview: NotificationPreview[] = [];

    events
      .filter((e) => selectedEvents.has(e.id))
      .forEach((event) => {
        event.eventStaff
          .filter((es) => !es.notified)
          .forEach((es) => {
            preview.push({
              eventId: event.id,
              eventName: event.name,
              eventDate: event.date,
              staffId: es.staff.id,
              staffName: es.staff.name,
              staffPhone: es.staff.phone,
              hasLine: !!es.staff.lineUserId,
              hasEmail: !!es.staff.email,
              notified: es.notified,
            });
          });
      });

    setPreviewData(preview);
    setPreviewOpen(true);
  };

  const handleSendNotifications = async () => {
    setSending(true);
    let totalSent = 0;
    let totalFailed = 0;

    try {
      for (const eventId of selectedEvents) {
        try {
          const response = await fetch(`/api/v1/events/${eventId}/notify`, {
            method: "POST",
          });

          if (response.ok) {
            const data = await response.json();
            totalSent += data.sent;
            totalFailed += data.failed;
          }
        } catch (error) {
          console.error(`Failed to notify for event ${eventId}:`, error);
        }
      }

      if (totalSent > 0) {
        toast.success(
          `已發送 ${totalSent} 筆通知${totalFailed > 0 ? `，${totalFailed} 筆失敗` : ""}`
        );
      } else if (totalFailed > 0) {
        toast.error(`發送失敗 ${totalFailed} 筆`);
      } else {
        toast.info("沒有需要發送的通知");
      }

      setPreviewOpen(false);
      fetchEvents();
    } catch (error) {
      toast.error("批次發送失敗");
    } finally {
      setSending(false);
    }
  };

  const exportToCSV = () => {
    const headers = [
      "活動日期",
      "活動名稱",
      "員工姓名",
      "電話",
      "LINE",
      "Email",
      "職位",
      "已通知",
    ];

    const rows = events
      .filter((e) => selectedEvents.has(e.id))
      .flatMap((event) =>
        event.eventStaff.map((es) => [
          format(new Date(event.date), "yyyy/MM/dd"),
          event.name,
          es.staff.name,
          es.staff.phone,
          es.staff.lineUserId ? "已綁定" : "未綁定",
          es.staff.email || "-",
          workRoleLabels[es.workRole] || es.workRole,
          es.notified ? "是" : "否",
        ])
      );

    const csvContent =
      "\uFEFF" +
      headers.join(",") +
      "\n" +
      rows.map((row) => row.map((cell) => `"${cell}"`).join(",")).join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `通知總表_${startDate}_${endDate}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success("已匯出 CSV 檔案");
  };

  // Calculate statistics
  const stats = {
    totalEvents: events.length,
    selectedEvents: selectedEvents.size,
    totalStaff: events.reduce((sum, e) => sum + e.eventStaff.length, 0),
    pendingNotifications: events.reduce(
      (sum, e) => sum + e.eventStaff.filter((es) => !es.notified).length,
      0
    ),
    selectedPending: events
      .filter((e) => selectedEvents.has(e.id))
      .reduce((sum, e) => sum + e.eventStaff.filter((es) => !es.notified).length, 0),
  };

  return (
    <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '1.5rem 1rem' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>批次通知管理</h1>
        <p style={{ color: '#6b7280', fontSize: '0.875rem', marginTop: '0.25rem' }}>
          篩選場次、預覽通知清單、匯出報表、批次發送通知
        </p>
      </div>

      {/* Date Filter */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            篩選條件
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'flex-end' }}>
            <div>
              <label style={{ fontSize: '0.875rem', color: '#6b7280', display: 'block', marginBottom: '0.25rem' }}>開始日期</label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-44"
              />
            </div>
            <div>
              <label style={{ fontSize: '0.875rem', color: '#6b7280', display: 'block', marginBottom: '0.25rem' }}>結束日期</label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-44"
              />
            </div>
            <Button onClick={handleSearch} disabled={loading}>
              {loading ? "載入中..." : "查詢"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Statistics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
        <Card>
          <CardContent className="pt-4">
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{stats.totalEvents}</div>
            <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>總場次</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#2563eb' }}>{stats.selectedEvents}</div>
            <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>已選場次</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{stats.totalStaff}</div>
            <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>總排班人數</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#ca8a04' }}>
              {stats.pendingNotifications}
            </div>
            <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>待通知人數</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#16a34a' }}>
              {stats.selectedPending}
            </div>
            <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>本次將發送</div>
          </CardContent>
        </Card>
      </div>

      {/* Action Buttons */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1rem' }}>
        <Button variant="outline" onClick={selectAll}>
          全選待通知場次
        </Button>
        <Button variant="outline" onClick={deselectAll}>
          取消全選
        </Button>
        <div style={{ flex: 1 }} />
        <Button
          variant="outline"
          onClick={exportToCSV}
          disabled={selectedEvents.size === 0}
        >
          <Download className="w-4 h-4 mr-2" />
          匯出 CSV
        </Button>
        <Button
          onClick={generatePreview}
          disabled={stats.selectedPending === 0}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Send className="w-4 h-4 mr-2" />
          預覽並發送通知 ({stats.selectedPending})
        </Button>
      </div>

      {/* Events List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Users className="w-5 h-5" />
            場次列表
          </CardTitle>
          <CardDescription>勾選要發送通知的場次</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '2rem 0', color: '#6b7280' }}>載入中...</div>
          ) : events.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem 0', color: '#6b7280' }}>
              此日期範圍內沒有活動
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">選取</TableHead>
                  <TableHead>日期</TableHead>
                  <TableHead>活動名稱</TableHead>
                  <TableHead>地點</TableHead>
                  <TableHead>狀態</TableHead>
                  <TableHead>排班</TableHead>
                  <TableHead>通知狀態</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {events
                  .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                  .map((event) => {
                    const notifiedCount = event.eventStaff.filter((es) => es.notified).length;
                    const totalCount = event.eventStaff.length;
                    const hasPending = notifiedCount < totalCount;

                    return (
                      <TableRow key={event.id}>
                        <TableCell>
                          <Checkbox
                            checked={selectedEvents.has(event.id)}
                            onCheckedChange={() => toggleEventSelection(event.id)}
                            disabled={totalCount === 0}
                          />
                        </TableCell>
                        <TableCell>
                          <div style={{ fontWeight: 500 }}>
                            {format(new Date(event.date), "M/d (E)", { locale: zhTW })}
                          </div>
                          <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                            {event.assemblyTime || event.startTime || "-"}
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">{event.name}</TableCell>
                        <TableCell>
                          {event.venue?.name || event.location || "-"}
                        </TableCell>
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
                            <span style={{ color: '#9ca3af' }}>未排班</span>
                          ) : (
                            <span>{totalCount} 人</span>
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
                              {notifiedCount}/{totalCount} 已通知
                            </Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Preview Dialog */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Send className="w-5 h-5" />
              通知發送預覽
            </DialogTitle>
          </DialogHeader>

          <div style={{ padding: '1rem 0' }}>
            <div style={{ marginBottom: '1rem', padding: '1rem', backgroundColor: '#eff6ff', borderRadius: '0.5rem', fontSize: '0.875rem' }}>
              <p style={{ fontWeight: 500, color: '#1e40af' }}>
                即將發送 {previewData.length} 筆通知
              </p>
              <p style={{ color: '#2563eb', marginTop: '0.25rem' }}>
                LINE 綁定: {previewData.filter((p) => p.hasLine).length} 人 |
                Email: {previewData.filter((p) => p.hasEmail).length} 人
              </p>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>活動日期</TableHead>
                  <TableHead>活動名稱</TableHead>
                  <TableHead>員工姓名</TableHead>
                  <TableHead>電話</TableHead>
                  <TableHead>通知管道</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {previewData.map((item, idx) => (
                  <TableRow key={idx}>
                    <TableCell>
                      {format(new Date(item.eventDate), "M/d (E)", { locale: zhTW })}
                    </TableCell>
                    <TableCell className="font-medium">{item.eventName}</TableCell>
                    <TableCell>{item.staffName}</TableCell>
                    <TableCell>{item.staffPhone}</TableCell>
                    <TableCell>
                      <div style={{ display: 'flex', gap: '0.25rem' }}>
                        {item.hasLine && (
                          <Badge style={{ backgroundColor: '#dcfce7', color: '#166534' }}>LINE</Badge>
                        )}
                        {item.hasEmail && (
                          <Badge style={{ backgroundColor: '#dbeafe', color: '#1e40af' }}>Email</Badge>
                        )}
                        {!item.hasLine && !item.hasEmail && (
                          <span style={{ color: '#9ca3af' }}>無通知管道</span>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setPreviewOpen(false)}>
              取消
            </Button>
            <Button
              onClick={handleSendNotifications}
              disabled={sending}
              className="bg-green-600 hover:bg-green-700"
            >
              {sending ? "發送中..." : `確認發送 (${previewData.length} 筆)`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
