"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { EventForm } from "@/components/events/event-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";

interface EventData {
  id: string;
  name: string;
  date: string;
  startTime?: string | null;
  venueId?: string | null;
  location: string;
  address?: string | null;
  adultsCount?: number | null;
  childrenCount?: number | null;
  vegetarianCount?: number | null;
  contactName?: string | null;
  contactPhone?: string | null;
  eventType: "WEDDING" | "YEAREND" | "SPRING" | "BIRTHDAY" | "CORPORATE" | "OTHER";
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

export default function EditEventPage() {
  const router = useRouter();
  const params = useParams();
  const eventId = params.id as string;

  const [event, setEvent] = useState<EventData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchEvent() {
      try {
        const response = await fetch(`/api/v1/events/${eventId}`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "找不到活動資料");
        }

        const evt = data.event;
        setEvent({
          ...evt,
          date: new Date(evt.date).toISOString().split("T")[0],
          totalAmount: evt.totalAmount ? Number(evt.totalAmount) : null,
          depositAmount: evt.depositAmount ? Number(evt.depositAmount) : null,
          depositDate: evt.depositDate ? new Date(evt.depositDate).toISOString().split("T")[0] : null,
          balanceAmount: evt.balanceAmount ? Number(evt.balanceAmount) : null,
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

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "更新失敗");
      }

      router.push("/events");
      router.refresh();
    } catch (error) {
      console.error("Update error:", error);
      alert(error instanceof Error ? error.message : "更新活動時發生錯誤");
    } finally {
      setIsSubmitting(false);
    }
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
      <div className="mb-6">
        <Button variant="ghost" asChild>
          <Link href="/events">
            <ArrowLeft className="mr-2 h-4 w-4" />
            返回活動列表
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
              startTime: event.startTime || "",
              venueId: event.venueId || "",
              location: event.location,
              address: event.address || "",
              adultsCount: event.adultsCount,
              childrenCount: event.childrenCount,
              vegetarianCount: event.vegetarianCount,
              contactName: event.contactName || "",
              contactPhone: event.contactPhone || "",
              eventType: event.eventType,
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
    </div>
  );
}
