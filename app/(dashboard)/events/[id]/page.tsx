"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { EventForm } from "@/components/events/event-form";
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
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="container max-w-2xl py-8">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-destructive mb-4">{error || "找不到活動資料"}</p>
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
    <div className="container max-w-3xl py-8">
      <div className="mb-6 flex items-center justify-between">
        <Button variant="ghost" asChild>
          <Link href="/events">
            <ArrowLeft className="mr-2 h-4 w-4" />
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

      {/* 異動通知確認對話框 */}
      <Dialog open={notifyDialogOpen} onOpenChange={setNotifyDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-yellow-600" />
              活動異動通知
            </DialogTitle>
            <DialogDescription>
              活動已成功更新，以下關鍵資訊有變更：
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <div className="space-y-2 mb-4">
              {pendingChanges.map((change, idx) => (
                <div key={idx} className="p-3 bg-yellow-50 rounded-lg text-sm">
                  <span className="font-medium">{fieldLabels[change.field] || change.field}：</span>
                  <div className="mt-1 text-gray-600">
                    <span className="line-through">{change.oldValue || "無"}</span>
                    <span className="mx-2">→</span>
                    <span className="text-blue-600 font-medium">{change.newValue || "無"}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-3 bg-blue-50 rounded-lg text-sm">
              <p className="text-blue-800">
                目前有 <strong>{notifiedStaffCount}</strong> 位已通知的員工，
                是否要發送異動通知？
              </p>
            </div>
          </div>

          <DialogFooter className="gap-2">
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
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isSendingNotify ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  發送中...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
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
