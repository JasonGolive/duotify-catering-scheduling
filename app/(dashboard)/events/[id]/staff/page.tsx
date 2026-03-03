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
  BOTH: "皆可",
};

const attendanceLabels: Record<string, string> = {
  SCHEDULED: "已排班",
  CONFIRMED: "已確認",
  ATTENDED: "已出勤",
  LATE: "遲到",
  ABSENT: "缺勤",
  CANCELLED: "取消",
};

const attendanceInlineColors: Record<string, React.CSSProperties> = {
  SCHEDULED: { backgroundColor: "#f3f4f6", color: "#1f2937" },
  CONFIRMED: { backgroundColor: "#dbeafe", color: "#1e40af" },
  ATTENDED: { backgroundColor: "#dcfce7", color: "#166534" },
  LATE: { backgroundColor: "#fef9c3", color: "#854d0e" },
  ABSENT: { backgroundColor: "#fee2e2", color: "#991b1b" },
  CANCELLED: { backgroundColor: "#f3f4f6", color: "#6b7280" },
};

// Inline style constants
const styles = {
  loadingContainer: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "400px",
  } as React.CSSProperties,
  spinner: {
    width: "2rem",
    height: "2rem",
    borderWidth: "4px",
    borderStyle: "solid",
    borderColor: "hsl(var(--primary))",
    borderTopColor: "transparent",
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
  } as React.CSSProperties,
  mainContainer: {
    maxWidth: "56rem",
    margin: "0 auto",
    padding: "2rem 1rem",
    display: "flex",
    flexDirection: "column" as const,
    gap: "1.5rem",
  } as React.CSSProperties,
  headerRow: {
    display: "flex",
    alignItems: "center",
    gap: "1rem",
  } as React.CSSProperties,
  arrowIcon: {
    marginRight: "0.5rem",
    height: "1rem",
    width: "1rem",
  } as React.CSSProperties,
  pageTitle: {
    fontSize: "1.875rem",
    fontWeight: 700,
  } as React.CSSProperties,
  pageSubtitle: {
    color: "hsl(var(--muted-foreground))",
  } as React.CSSProperties,
  addStaffRow: {
    display: "flex",
    gap: "1rem",
  } as React.CSSProperties,
  helperText: {
    fontSize: "0.875rem",
    color: "hsl(var(--muted-foreground))",
    marginTop: "0.5rem",
  } as React.CSSProperties,
  emptyState: {
    textAlign: "center" as const,
    color: "hsl(var(--muted-foreground))",
    padding: "2rem 0",
  } as React.CSSProperties,
  staffList: {
    display: "flex",
    flexDirection: "column" as const,
    gap: "1rem",
  } as React.CSSProperties,
  staffCard: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "1rem",
    border: "1px solid hsl(var(--border))",
    borderRadius: "0.5rem",
  } as React.CSSProperties,
  staffInfo: {
    flex: 1,
  } as React.CSSProperties,
  staffNameRow: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
  } as React.CSSProperties,
  staffName: {
    fontWeight: 500,
  } as React.CSSProperties,
  staffDetails: {
    fontSize: "0.875rem",
    color: "hsl(var(--muted-foreground))",
    marginTop: "0.25rem",
  } as React.CSSProperties,
  adjustedSalary: {
    color: "#16a34a",
    marginLeft: "0.5rem",
  } as React.CSSProperties,
  actionRow: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
  } as React.CSSProperties,
  deleteIcon: {
    height: "1rem",
    width: "1rem",
    color: "hsl(var(--destructive))",
  } as React.CSSProperties,
  cardTitleRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  } as React.CSSProperties,
  cardTitleLeft: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
  } as React.CSSProperties,
  totalSalary: {
    fontSize: "1.125rem",
  } as React.CSSProperties,
  iconSmall: {
    height: "1.25rem",
    width: "1.25rem",
  } as React.CSSProperties,
  conflictIcon: {
    height: "0.75rem",
    width: "0.75rem",
  } as React.CSSProperties,
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
      <div style={styles.loadingContainer}>
        <div style={styles.spinner} />
      </div>
    );
  }

  return (
    <div style={styles.mainContainer}>
      {/* Header */}
      <div style={styles.headerRow}>
        <Button variant="ghost" asChild>
          <Link href={`/events/${eventId}`}>
            <ArrowLeft style={styles.arrowIcon} />
            返回活動
          </Link>
        </Button>
      </div>

      <div>
        <h1 style={styles.pageTitle}>人員排班</h1>
        {event && (
          <p style={styles.pageSubtitle}>
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
          <CardTitle style={styles.cardTitleLeft}>
            <Plus style={styles.iconSmall} />
            新增人員
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div style={styles.addStaffRow}>
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
            <p style={styles.helperText}>
              所有員工都已指派到此活動
            </p>
          )}
        </CardContent>
      </Card>

      {/* Staff List */}
      <Card>
        <CardHeader>
          <CardTitle style={styles.cardTitleRow}>
            <span style={styles.cardTitleLeft}>
              <User style={styles.iconSmall} />
              已指派人員 ({eventStaff.length})
            </span>
            <span style={styles.totalSalary}>
              總薪資: TWD {totalSalary.toLocaleString()}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {eventStaff.length === 0 ? (
            <p style={styles.emptyState}>
              尚未指派人員
            </p>
          ) : (
            <div style={styles.staffList}>
              {eventStaff.map((es) => (
                <div
                  key={es.id}
                  style={styles.staffCard}
                >
                  <div style={styles.staffInfo}>
                    <div style={styles.staffNameRow}>
                      <span style={styles.staffName}>{es.staff.name}</span>
                      <Badge variant="outline">{roleLabels[es.role]}</Badge>
                      <Badge style={attendanceInlineColors[es.attendanceStatus]}>
                        {attendanceLabels[es.attendanceStatus]}
                      </Badge>
                      {es.conflicts && es.conflicts.length > 0 && (
                        <Badge variant="destructive" style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
                          <AlertTriangle style={styles.conflictIcon} />
                          衝突
                        </Badge>
                      )}
                    </div>
                    <div style={styles.staffDetails}>
                      {es.staff.phone} • TWD {es.salary.toLocaleString()}
                      {es.adjustedSalary !== null &&
                        es.adjustedSalary !== es.salary && (
                          <span style={styles.adjustedSalary}>
                            → TWD {es.adjustedSalary.toLocaleString()}
                          </span>
                        )}
                    </div>
                  </div>

                  <div style={styles.actionRow}>
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
                      <Trash2 style={styles.deleteIcon} />
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
