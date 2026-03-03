"use client";

import { useState, useEffect } from "react";
import { EventCard } from "./event-card";
import { useRouter } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
}

interface EventListViewProps {
  events: Event[];
  currentStatus?: string;
}

const statusOptions = [
  { value: "ALL", label: "全部" },
  { value: "PENDING", label: "待確認" },
  { value: "CONFIRMED", label: "已確認" },
  { value: "IN_PROGRESS", label: "進行中" },
  { value: "COMPLETED", label: "已完成" },
  { value: "CANCELLED", label: "已取消" },
];

export function EventListView({ events, currentStatus = "CONFIRMED" }: EventListViewProps) {
  const router = useRouter();
  const [gridCols, setGridCols] = useState(1);

  useEffect(() => {
    const updateGridCols = () => {
      const width = window.innerWidth;
      if (width >= 1024) {
        setGridCols(3);
      } else if (width >= 768) {
        setGridCols(2);
      } else {
        setGridCols(1);
      }
    };
    updateGridCols();
    window.addEventListener("resize", updateGridCols);
    return () => window.removeEventListener("resize", updateGridCols);
  }, []);

  const handleEventClick = (id: string) => {
    router.push(`/events/${id}`);
  };

  const handleStatusChange = (status: string) => {
    router.push(`/events?status=${status}`);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      {/* 篩選器 */}
      <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
        <label style={{ fontSize: "0.875rem", fontWeight: "500" }}>狀態篩選：</label>
        <Select value={currentStatus} onValueChange={handleStatusChange}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="選擇狀態" />
          </SelectTrigger>
          <SelectContent>
            {statusOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span style={{ fontSize: "0.875rem", color: "#6b7280" }}>
          共 {events.length} 筆
        </span>
      </div>

      {/* 活動列表 */}
      {events.length === 0 ? (
        <div style={{ textAlign: "center", paddingTop: "3rem", paddingBottom: "3rem" }}>
          <p style={{ color: "#6b7280" }}>尚無活動資料</p>
        </div>
      ) : (
        <div style={{ display: "grid", gap: "1rem", gridTemplateColumns: `repeat(${gridCols}, 1fr)` }}>
          {events.map((event) => (
            <EventCard
              key={event.id}
              event={event}
              onClick={() => handleEventClick(event.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
