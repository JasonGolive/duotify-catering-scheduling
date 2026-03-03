"use client";

import { useState, useEffect } from "react";
import { EventCard } from "./event-card";
import { useRouter } from "next/navigation";
import { Download } from "lucide-react";
import * as XLSX from "xlsx";
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

// 狀態標籤對照
const statusLabels: Record<string, string> = {
  PENDING: "待確認",
  CONFIRMED: "已確認",
  IN_PROGRESS: "進行中",
  COMPLETED: "已完成",
  CANCELLED: "已取消",
};

// 活動類型對照
const eventTypeLabels: Record<string, string> = {
  WEDDING: "婚宴",
  BANQUET: "宴會",
  CORPORATE: "企業活動",
  BIRTHDAY: "生日宴",
  OTHER: "其他",
};

export function EventListView({ events, currentStatus = "CONFIRMED" }: EventListViewProps) {
  const router = useRouter();
  const [gridCols, setGridCols] = useState(1);
  const [isExporting, setIsExporting] = useState(false);

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

  const handleExport = async () => {
    setIsExporting(true);
    try {
      // Build query params based on current filter
      const params = new URLSearchParams();
      if (currentStatus && currentStatus !== "ALL") {
        params.append("status", currentStatus);
      }

      const response = await fetch(`/api/v1/reports/events?${params.toString()}`);
      if (!response.ok) {
        throw new Error("匯出失敗");
      }

      const data = await response.json();

      // Transform data for Excel
      const excelData = data.events.map((event: Record<string, unknown>) => ({
        "活動名稱": event.name || "",
        "日期": event.date || "",
        "集合時間": event.assemblyTime || "",
        "開始時間": event.startTime || "",
        "地點": event.location || "",
        "場地": event.venueName || "",
        "成人數": event.adultsCount ?? "",
        "兒童數": event.childrenCount ?? "",
        "素食數": event.vegetarianCount ?? "",
        "類型": eventTypeLabels[event.eventType as string] || event.eventType || "",
        "狀態": statusLabels[event.status as string] || event.status || "",
        "聯絡人": event.contactName || "",
        "電話": event.contactPhone || "",
        "總金額": event.totalAmount ?? "",
        "訂金": event.depositAmount ?? "",
        "尾款": event.balanceAmount ?? "",
        "已派人數": event.staffCount ?? "",
        "已通知數": event.notifiedCount ?? "",
      }));

      // Create workbook and worksheet
      const ws = XLSX.utils.json_to_sheet(excelData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "活動報表");

      // Generate filename with current date
      const today = new Date().toISOString().split("T")[0];
      const filename = `活動報表_${today}.xlsx`;

      // Download file
      XLSX.writeFile(wb, filename);
    } catch (error) {
      console.error("Export error:", error);
      alert("匯出失敗，請稍後再試");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      {/* 篩選器 */}
      <div style={{ display: "flex", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>
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
        <button
          onClick={handleExport}
          disabled={isExporting}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.5rem",
            padding: "0.5rem 1rem",
            fontSize: "0.875rem",
            fontWeight: "500",
            color: "#ffffff",
            backgroundColor: isExporting ? "#9ca3af" : "#10b981",
            border: "none",
            borderRadius: "0.375rem",
            cursor: isExporting ? "not-allowed" : "pointer",
            marginLeft: "auto",
          }}
        >
          <Download style={{ width: "1rem", height: "1rem" }} />
          {isExporting ? "匯出中..." : "匯出 Excel"}
        </button>
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
