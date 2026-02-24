"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { EventForm } from "@/components/events/event-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function NewEventPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (data: {
    name: string;
    date: string;
    startTime?: string;
    endTime?: string;
    location: string;
    address?: string;
    expectedGuests?: number | null;
    contactName?: string;
    contactPhone?: string;
    eventType: string;
    notes?: string;
    status: string;
  }) => {
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/v1/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "建立失敗");
      }

      router.push("/events");
      router.refresh();
    } catch (error) {
      console.error("Create error:", error);
      alert(error instanceof Error ? error.message : "建立活動時發生錯誤");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container max-w-2xl py-8">
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
          <CardTitle>新增活動</CardTitle>
        </CardHeader>
        <CardContent>
          <EventForm
            onSubmit={handleSubmit}
            onCancel={() => router.push("/events")}
            isSubmitting={isSubmitting}
          />
        </CardContent>
      </Card>
    </div>
  );
}
