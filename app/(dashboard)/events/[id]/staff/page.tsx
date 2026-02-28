"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Plus, Trash2, User, AlertTriangle } from "lucide-react";
import Link from "next/link";

interface Staff {
  id: string;
  name: string;
  phone: string;
  skill: string;
  perEventSalary: number;
}

interface EventStaffItem {
  id: string;
  staffId: string;
  role: string;
  salary: number;
  attendanceStatus: string;
  actualHours: number | null;
  adjustedSalary: number | null;
  notes: string | null;
  staff: Staff;
  conflicts?: { eventId: string; eventName: string }[];
}

interface EventData {
  id: string;
  name: string;
  date: string;
}

const roleLabels: Record<string, string> = {
  FRONT: "外場",
  HOT: "熱台",
  DECK: "皆可",
};

const attendanceLabels: Record<string, string> = {
  SCHEDULED: "已排班",
  CONFIRMED: "已確認",
  ATTENDED: "已出勤",
  LATE: "遲到",
  ABSENT: "缺勤",
  CANCELLED: "取消",
};

const attendanceColors: Record<string, string> = {
  SCHEDULED: "bg-gray-100 text-gray-800",
  CONFIRMED: "bg-blue-100 text-blue-800",
  ATTENDED: "bg-green-100 text-green-800",
  LATE: "bg-yellow-100 text-yellow-800",
  ABSENT: "bg-red-100 text-red-800",
  CANCELLED: "bg-gray-100 text-gray-500",
};

export default function EventStaffPage() {
  const router = useRouter();
  const params = useParams();
  const eventId = params.id as string;

  const [event, setEvent] = useState<EventData | null>(null);
  const [eventStaff, setEventStaff] = useState<EventStaffItem[]>([]);
  const [availableStaff, setAvailableStaff] = useState<Staff[]>([]);
  const [selectedStaffId, setSelectedStaffId] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);

  // Fetch event and staff data
  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch event details
        const eventRes = await fetch(`/api/v1/events/${eventId}`);
        const eventData = await eventRes.json();
        if (eventRes.ok) {
          setEvent(eventData.event);
        }

        // Fetch assigned staff
        const staffRes = await fetch(`/api/v1/events/${eventId}/staff`);
        const staffData = await staffRes.json();
        if (staffRes.ok) {
          setEventStaff(staffData.eventStaff);
        }

        // Fetch all available staff
        const allStaffRes = await fetch("/api/v1/staff");
        const allStaffData = await allStaffRes.json();
        if (allStaffRes.ok) {
          setAvailableStaff(
            allStaffData.staff.map((s: Staff & { perEventSalary: number }) => ({
              ...s,
              perEventSalary: Number(s.perEventSalary),
            }))
          );
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, [eventId]);

  // Add staff to event
  const handleAddStaff = async () => {
    if (!selectedStaffId) return;

    const staff = availableStaff.find((s) => s.id === selectedStaffId);
    if (!staff) return;

    setIsAdding(true);
    try {
      const res = await fetch(`/api/v1/events/${eventId}/staff`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          staffId: staff.id,
          role: staff.skill,
          salary: staff.perEventSalary,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setEventStaff([...eventStaff, data.eventStaff]);
        setSelectedStaffId("");
      } else {
        const error = await res.json();
        alert(error.error || "新增失敗");
      }
    } catch (error) {
      console.error("Error adding staff:", error);
      alert("新增失敗");
    } finally {
      setIsAdding(false);
    }
  };

  // Remove staff from event
  const handleRemoveStaff = async (staffId: string) => {
    if (!confirm("確定要移除此員工嗎？")) return;

    try {
      const res = await fetch(`/api/v1/events/${eventId}/staff/${staffId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setEventStaff(eventStaff.filter((es) => es.staffId !== staffId));
      } else {
        const error = await res.json();
        alert(error.error || "移除失敗");
      }
    } catch (error) {
      console.error("Error removing staff:", error);
      alert("移除失敗");
    }
  };

  // Update attendance status
  const handleUpdateAttendance = async (staffId: string, status: string) => {
    try {
      const res = await fetch(`/api/v1/events/${eventId}/staff/${staffId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ attendanceStatus: status }),
      });

      if (res.ok) {
        const data = await res.json();
        setEventStaff(
          eventStaff.map((es) =>
            es.staffId === staffId ? data.eventStaff : es
          )
        );
      }
    } catch (error) {
      console.error("Error updating attendance:", error);
    }
  };

  // Filter out already assigned staff
  const unassignedStaff = availableStaff.filter(
    (s) => !eventStaff.some((es) => es.staffId === s.id)
  );

  // Calculate total salary
  const totalSalary = eventStaff.reduce((sum, es) => {
    const salary = es.adjustedSalary ?? es.salary;
    return sum + salary;
  }, 0);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="container max-w-4xl py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" asChild>
          <Link href={`/events/${eventId}`}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            返回活動
          </Link>
        </Button>
      </div>

      <div>
        <h1 className="text-3xl font-bold">人員排班</h1>
        {event && (
          <p className="text-muted-foreground">
            {event.name} -{" "}
            {new Date(event.date).toLocaleDateString("zh-TW", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        )}
      </div>

      {/* Add Staff */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            新增人員
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Select value={selectedStaffId} onValueChange={setSelectedStaffId}>
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="選擇員工" />
              </SelectTrigger>
              <SelectContent>
                {unassignedStaff.map((staff) => (
                  <SelectItem key={staff.id} value={staff.id}>
                    {staff.name} ({roleLabels[staff.skill]}) - TWD{" "}
                    {staff.perEventSalary.toLocaleString()}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              onClick={handleAddStaff}
              disabled={!selectedStaffId || isAdding}
            >
              {isAdding ? "新增中..." : "新增"}
            </Button>
          </div>
          {unassignedStaff.length === 0 && (
            <p className="text-sm text-muted-foreground mt-2">
              所有員工都已指派到此活動
            </p>
          )}
        </CardContent>
      </Card>

      {/* Staff List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <User className="h-5 w-5" />
              已指派人員 ({eventStaff.length})
            </span>
            <span className="text-lg">
              總薪資: TWD {totalSalary.toLocaleString()}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {eventStaff.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              尚未指派人員
            </p>
          ) : (
            <div className="space-y-4">
              {eventStaff.map((es) => (
                <div
                  key={es.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{es.staff.name}</span>
                      <Badge variant="outline">{roleLabels[es.role]}</Badge>
                      <Badge className={attendanceColors[es.attendanceStatus]}>
                        {attendanceLabels[es.attendanceStatus]}
                      </Badge>
                      {es.conflicts && es.conflicts.length > 0 && (
                        <Badge variant="destructive" className="flex items-center gap-1">
                          <AlertTriangle className="h-3 w-3" />
                          衝突
                        </Badge>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">
                      {es.staff.phone} • TWD {es.salary.toLocaleString()}
                      {es.adjustedSalary !== null &&
                        es.adjustedSalary !== es.salary && (
                          <span className="text-green-600 ml-2">
                            → TWD {es.adjustedSalary.toLocaleString()}
                          </span>
                        )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Select
                      value={es.attendanceStatus}
                      onValueChange={(v) => handleUpdateAttendance(es.staffId, v)}
                    >
                      <SelectTrigger className="w-[120px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(attendanceLabels).map(([value, label]) => (
                          <SelectItem key={value} value={value}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveStaff(es.staffId)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
