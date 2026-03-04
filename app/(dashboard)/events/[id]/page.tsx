"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { EventForm } from "@/components/events/event-form";
import { EventPayments } from "@/components/events/event-payments";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { ArrowLeft, Loader2, Bell, Send } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

interface EventData {
  id: string;
  name: string;
  date: string;
  assemblyTime?: string | null;
  startTime?: string | null;
  mealTime?: string | null;
  venueId?: string | null;
  location: string;
  address?: string | null;
  adultsCount?: number | null;
  childrenCount?: number | null;
  vegetarianCount?: number | null;
  contactName?: string | null;
  contactPhone?: string | null;
  eventType: "WEDDING" | "YEAREND" | "SPRING" | "BIRTHDAY" | "CORPORATE" | "OTHER";
  menu?: string | null;
  reminders?: string | null;
  totalAmount?: number | null;
  depositAmount?: number | null;
  depositMethod?: "TRANSFER" | "CASH" | "HOTEL_PAID" | "OTHER" | null;
  depositDate?: string | null;
  balanceAmount?: number | null;
  balanceMethod?: "TRANSFER" | "CASH" | "HOTEL_PAID" | "OTHER" | null;
  balanceDate?: string | null;
  notes?: string | null;
  status: "PENDING" | "CONFIRMED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
}

interface FieldChange {
  field: string;
  oldValue: string | null;
  newValue: string | null;
}

const fieldLabels: Record<string, string> = {
  date: "日期",
  assemblyTime: "集合時間",
  mealTime: "用餐時間",
  location: "地點",
  address: "地址",
};

// Inline style constants
const styles = {
  loadingContainer: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "400px",
  } as React.CSSProperties,
  errorContainer: {
    maxWidth: "42rem",
    margin: "0 auto",
    padding: "2rem 1rem",
  } as React.CSSProperties,
  errorText: {
    textAlign: "center" as const,
  } as React.CSSProperties,
  errorMessage: {
    color: "hsl(var(--destructive))",
    marginBottom: "1rem",
  } as React.CSSProperties,
  mainContainer: {
    maxWidth: "48rem",
    margin: "0 auto",
    padding: "2rem 1rem",
  } as React.CSSProperties,
  headerRow: {
    marginBottom: "1.5rem",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  } as React.CSSProperties,
  arrowIcon: {
    marginRight: "0.5rem",
    height: "1rem",
    width: "1rem",
  } as React.CSSProperties,
  dialogPadding: {
    padding: "1rem 0",
  } as React.CSSProperties,
  changesContainer: {
    display: "flex",
    flexDirection: "column" as const,
    gap: "0.5rem",
    marginBottom: "1rem",
  } as React.CSSProperties,
  changeItem: {
    padding: "0.75rem",
    backgroundColor: "#fefce8",
    borderRadius: "0.5rem",
    fontSize: "0.875rem",
  } as React.CSSProperties,
  changeLabel: {
    fontWeight: 500,
  } as React.CSSProperties,
  changeValues: {
    marginTop: "0.25rem",
    color: "#4b5563",
  } as React.CSSProperties,
  oldValue: {
    textDecoration: "line-through",
  } as React.CSSProperties,
  arrow: {
    margin: "0 0.5rem",
  } as React.CSSProperties,
  newValue: {
    color: "#2563eb",
    fontWeight: 500,
  } as React.CSSProperties,
  noticeBox: {
    padding: "0.75rem",
    backgroundColor: "#eff6ff",
    borderRadius: "0.5rem",
    fontSize: "0.875rem",
  } as React.CSSProperties,
  noticeText: {
    color: "#1e40af",
  } as React.CSSProperties,
  footerGap: {
    gap: "0.5rem",
  } as React.CSSProperties,
  sendButton: {
    backgroundColor: "#2563eb",
  } as React.CSSProperties,
  bellIcon: {
    width: "1.25rem",
    height: "1.25rem",
    color: "#ca8a04",
  } as React.CSSProperties,
  buttonIcon: {
    width: "1rem",
    height: "1rem",
    marginRight: "0.5rem",
  } as React.CSSProperties,
  spinnerIcon: {
    width: "1rem",
    height: "1rem",
    marginRight: "0.5rem",
    animation: "spin 1s linear infinite",
  } as React.CSSProperties,
};

export default function EditEventPage() {
  const router = useRouter();
  const params = useParams();
  const eventId = params.id as string;

  const [event, setEvent] = useState<EventData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // 異動通知對話框
  const [notifyDialogOpen, setNotifyDialogOpen] = useState(false);
  const [pendingChanges, setPendingChanges] = useState<FieldChange[]>([]);
  const [notifiedStaffCount, setNotifiedStaffCount] = useState(0);
  const [isSendingNotify, setIsSendingNotify] = useState(false);

  useEffect(() => {
    async function fetchEvent() {
      try {
        const response = await fetch(`/api/v1/events/${eventId}`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "找不到活動資料");
        }

        const evt = data.event;
        if (!evt) {
          throw new Error("找不到活動資料");
        }

        setEvent({
          ...evt,
          date: evt.date ? new Date(evt.date).toISOString().split("T")[0] : "",
          totalAmount: evt.totalAmount != null ? Number(evt.totalAmount) : null,
          depositAmount: evt.depositAmount != null ? Number(evt.depositAmount) : null,
          depositDate: evt.depositDate ? new Date(evt.depositDate).toISOString().split("T")[0] : null,
          balanceAmount: evt.balanceAmount != null ? Number(evt.balanceAmount) : null,
          balanceDate: evt.balanceDate ? new Date(evt.balanceDate).toISOString().split("T")[0] : null,
        });
      } catch (err) {
        console.error("Fetch event error:", err);
        setError(err instanceof Error ? err.message : "載入失敗");
      } finally {
        setIsLoading(false);
      }
    }

    fetchEvent();
  }, [eventId]);

  const handleSubmit = async (data: Record<string, unknown>) => {
    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/v1/events/${eventId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "更新失敗");
      }

      // 檢查是否有關鍵欄位變更
      if (result.changes && result.changes.length > 0 && result.notifiedStaffCount > 0) {
        setPendingChanges(result.changes);
        setNotifiedStaffCount(result.notifiedStaffCount);
        setNotifyDialogOpen(true);
      } else {
        toast.success("活動已更新");
        router.push("/events");
        router.refresh();
      }
    } catch (error) {
      console.error("Update error:", error);
      toast.error(error instanceof Error ? error.message : "更新活動時發生錯誤");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSendChangeNotify = async () => {
    setIsSendingNotify(true);
    try {
      const response = await fetch(`/api/v1/events/${eventId}/notify`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ changes: pendingChanges }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "發送通知失敗");
      }

      toast.success(result.message);
      setNotifyDialogOpen(false);
      router.push("/events");
      router.refresh();
    } catch (error) {
      console.error("Send notify error:", error);
      toast.error(error instanceof Error ? error.message : "發送通知失敗");
    } finally {
      setIsSendingNotify(false);
    }
  };

  const handleSkipNotify = () => {
    setNotifyDialogOpen(false);
    toast.success("活動已更新（未發送異動通知）");
    router.push("/events");
    router.refresh();
  };

  if (isLoading) {
    return (
      <div style={styles.loadingContainer}>
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !event) {
    return (
      <div style={styles.errorContainer}>
        <Card>
          <CardContent className="pt-6">
            <div style={styles.errorText}>
              <p style={styles.errorMessage}>{error || "找不到活動資料"}</p>
              <Button asChild>
                <Link href="/events">返回活動列表</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div style={styles.mainContainer}>
      <div style={styles.headerRow}>
        <Button variant="ghost" asChild>
          <Link href="/events">
            <ArrowLeft style={styles.arrowIcon} />
            返回活動列表
          </Link>
        </Button>
        <Button asChild>
          <Link href={`/events/${eventId}/staff`}>
            人員排班
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>編輯活動</CardTitle>
        </CardHeader>
        <CardContent>
          <EventForm
            initialData={{
              name: event.name,
              date: event.date,
              assemblyTime: event.assemblyTime || "",
              startTime: event.startTime || "",
              mealTime: event.mealTime || "",
              venueId: event.venueId || "",
              location: event.location,
              address: event.address || "",
              adultsCount: event.adultsCount,
              childrenCount: event.childrenCount,
              vegetarianCount: event.vegetarianCount,
              contactName: event.contactName || "",
              contactPhone: event.contactPhone || "",
              eventType: event.eventType,
              menu: event.menu || "",
              reminders: event.reminders || "",
              totalAmount: event.totalAmount,
              depositAmount: event.depositAmount,
              depositMethod: event.depositMethod,
              depositDate: event.depositDate || "",
              balanceAmount: event.balanceAmount,
              balanceMethod: event.balanceMethod,
              balanceDate: event.balanceDate || "",
              notes: event.notes || "",
              status: event.status,
            }}
            onSubmit={handleSubmit}
            onCancel={() => router.push("/events")}
            isSubmitting={isSubmitting}
          />
        </CardContent>
      </Card>

      {/* 收款管理區塊 */}
      <EventPayments
        eventId={eventId}
        eventName={event.name}
        contactName={event.contactName || undefined}
        contactPhone={event.contactPhone || undefined}
      />

      {/* 異動通知確認對話框 */}
      <Dialog open={notifyDialogOpen} onOpenChange={setNotifyDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <Bell style={styles.bellIcon} />
              活動異動通知
            </DialogTitle>
            <DialogDescription>
              活動已成功更新，以下關鍵資訊有變更：
            </DialogDescription>
          </DialogHeader>

          <div style={styles.dialogPadding}>
            <div style={styles.changesContainer}>
              {pendingChanges.map((change, idx) => (
                <div key={idx} style={styles.changeItem}>
                  <span style={styles.changeLabel}>{fieldLabels[change.field] || change.field}：</span>
                  <div style={styles.changeValues}>
                    <span style={styles.oldValue}>{change.oldValue || "無"}</span>
                    <span style={styles.arrow}>→</span>
                    <span style={styles.newValue}>{change.newValue || "無"}</span>
                  </div>
                </div>
              ))}
            </div>

            <div style={styles.noticeBox}>
              <p style={styles.noticeText}>
                目前有 <strong>{notifiedStaffCount}</strong> 位已通知的員工，
                是否要發送異動通知？
              </p>
            </div>
          </div>

          <DialogFooter style={styles.footerGap}>
            <Button
              variant="outline"
              onClick={handleSkipNotify}
              disabled={isSendingNotify}
            >
              稍後再說
            </Button>
            <Button
              onClick={handleSendChangeNotify}
              disabled={isSendingNotify}
              style={styles.sendButton}
            >
              {isSendingNotify ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  發送中...
                </>
              ) : (
                <>
                  <Send style={styles.buttonIcon} />
                  發送異動通知
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
