"use client";

import { useEffect, useState, use } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface AvailabilityRecord {
  id: string;
  date: string;
  available: boolean;
  reason: string | null;
}

interface TokenInfo {
  id: string;
  staffId: string;
  staffName: string;
  month: number;
  year: number;
  expiresAt: string;
  completedAt: string | null;
}

export default function StaffAvailabilityEditPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  const [tokenInfo, setTokenInfo] = useState<TokenInfo | null>(null);
  const [availability, setAvailability] = useState<Record<string, AvailabilityRecord>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [expired, setExpired] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bulkUpdating, setBulkUpdating] = useState(false);

  useEffect(() => {
    fetchTokenInfo();
  }, [token]);

  const fetchTokenInfo = async () => {
    try {
      const response = await fetch(`/api/v1/staff/availability-edit/${token}`);
      if (!response.ok) {
        const data = await response.json();
        if (response.status === 410) {
          setExpired(true);
          setError(data.error || "連結已過期");
        } else {
          setError(data.error || "無效的連結");
        }
        setLoading(false);
        return;
      }

      const data = await response.json();
      setTokenInfo(data.tokenInfo);
      
      // Convert availability array to record
      const availRecord: Record<string, AvailabilityRecord> = {};
      for (const item of data.availability) {
        availRecord[item.date] = item;
      }
      setAvailability(availRecord);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching token info:", err);
      setError("無法載入資料");
      setLoading(false);
    }
  };

  const handleDateClick = async (dateStr: string) => {
    const current = availability[dateStr];
    const newAvailable = current ? !current.available : true;

    try {
      const response = await fetch(`/api/v1/staff/availability-edit/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: dateStr,
          available: newAvailable,
          reason: newAvailable ? null : "不可出勤",
        }),
      });

      if (!response.ok) {
        throw new Error("更新失敗");
      }

      const result = await response.json();
      setAvailability((prev) => ({
        ...prev,
        [dateStr]: result.record,
      }));
    } catch (err) {
      toast.error("更新失敗");
    }
  };

  const handleBulkSetAvailable = async () => {
    if (!tokenInfo) return;
    setBulkUpdating(true);

    try {
      const daysInMonth = new Date(tokenInfo.year, tokenInfo.month, 0).getDate();
      const emptyDates: string[] = [];

      for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = `${tokenInfo.year}-${String(tokenInfo.month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
        if (!availability[dateStr]) {
          emptyDates.push(dateStr);
        }
      }

      if (emptyDates.length === 0) {
        toast.info("所有日期已設定完成");
        setBulkUpdating(false);
        return;
      }

      const response = await fetch(`/api/v1/staff/availability-edit/${token}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dates: emptyDates,
          available: true,
        }),
      });

      if (!response.ok) throw new Error("批量更新失敗");

      const result = await response.json();
      const newAvailability = { ...availability };
      for (const record of result.records) {
        newAvailability[record.date] = record;
      }
      setAvailability(newAvailability);
      toast.success(`已將 ${emptyDates.length} 天標記為可出勤`);
    } catch (err) {
      toast.error("批量更新失敗");
    } finally {
      setBulkUpdating(false);
    }
  };

  const handleBulkSetUnavailable = async () => {
    if (!tokenInfo) return;
    setBulkUpdating(true);

    try {
      const daysInMonth = new Date(tokenInfo.year, tokenInfo.month, 0).getDate();
      const emptyDates: string[] = [];

      for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = `${tokenInfo.year}-${String(tokenInfo.month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
        if (!availability[dateStr]) {
          emptyDates.push(dateStr);
        }
      }

      if (emptyDates.length === 0) {
        toast.info("所有日期已設定完成");
        setBulkUpdating(false);
        return;
      }

      const response = await fetch(`/api/v1/staff/availability-edit/${token}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dates: emptyDates,
          available: false,
          reason: "批量設定不可出勤",
        }),
      });

      if (!response.ok) throw new Error("批量更新失敗");

      const result = await response.json();
      const newAvailability = { ...availability };
      for (const record of result.records) {
        newAvailability[record.date] = record;
      }
      setAvailability(newAvailability);
      toast.success(`已將 ${emptyDates.length} 天標記為不可出勤`);
    } catch (err) {
      toast.error("批量更新失敗");
    } finally {
      setBulkUpdating(false);
    }
  };

  const handleComplete = async () => {
    setSaving(true);
    try {
      const response = await fetch(`/api/v1/staff/availability-edit/${token}/complete`, {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("完成失敗");
      }

      toast.success("已完成行事曆填寫！");
      setTokenInfo((prev) => prev ? { ...prev, completedAt: new Date().toISOString() } : null);
    } catch (err) {
      toast.error("完成失敗");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "#f5f5f5" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: "24px", marginBottom: "16px" }}>⏳</div>
          <p>載入中...</p>
        </div>
      </div>
    );
  }

  if (error || expired) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "#f5f5f5" }}>
        <div style={{ textAlign: "center", padding: "32px", backgroundColor: "white", borderRadius: "8px", boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}>
          <div style={{ fontSize: "48px", marginBottom: "16px" }}>{expired ? "⏰" : "❌"}</div>
          <h1 style={{ fontSize: "20px", fontWeight: "bold", marginBottom: "8px" }}>
            {expired ? "連結已過期" : "無效的連結"}
          </h1>
          <p style={{ color: "#666" }}>{error}</p>
          <p style={{ color: "#888", marginTop: "16px", fontSize: "14px" }}>
            請聯繫管理員取得新的連結
          </p>
        </div>
      </div>
    );
  }

  if (!tokenInfo) return null;

  const daysInMonth = new Date(tokenInfo.year, tokenInfo.month, 0).getDate();
  const firstDayOfMonth = new Date(tokenInfo.year, tokenInfo.month - 1, 1).getDay();
  const dayNames = ["日", "一", "二", "三", "四", "五", "六"];

  // Count completed vs total
  const totalDays = daysInMonth;
  const completedDays = Object.keys(availability).length;

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f5f5f5", padding: "16px" }}>
      <div style={{ maxWidth: "600px", margin: "0 auto" }}>
        {/* Header */}
        <div style={{ backgroundColor: "white", borderRadius: "12px", padding: "20px", marginBottom: "16px", boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
            <div style={{ width: "48px", height: "48px", borderRadius: "50%", backgroundColor: "#3b82f6", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: "20px", fontWeight: "bold" }}>
              {tokenInfo.staffName.charAt(0)}
            </div>
            <div>
              <h1 style={{ fontSize: "18px", fontWeight: "bold", margin: 0 }}>{tokenInfo.staffName}</h1>
              <p style={{ color: "#666", margin: 0, fontSize: "14px" }}>
                {tokenInfo.year}年{tokenInfo.month}月 出勤行事曆
              </p>
            </div>
          </div>

          {tokenInfo.completedAt ? (
            <div style={{ backgroundColor: "#dcfce7", padding: "12px", borderRadius: "8px", display: "flex", alignItems: "center", gap: "8px" }}>
              <span>✅</span>
              <span style={{ color: "#166534", fontWeight: "500" }}>已完成填寫</span>
            </div>
          ) : (
            <div style={{ backgroundColor: "#fef3c7", padding: "12px", borderRadius: "8px" }}>
              <p style={{ color: "#92400e", margin: 0, fontSize: "14px" }}>
                ⏰ 請在 {new Date(tokenInfo.expiresAt).toLocaleDateString("zh-TW")} 前完成填寫
              </p>
            </div>
          )}

          <div style={{ marginTop: "12px", display: "flex", gap: "8px", flexWrap: "wrap" }}>
            <div style={{ fontSize: "14px", color: "#666" }}>
              已填寫: {completedDays}/{totalDays} 天
            </div>
          </div>
        </div>

        {/* Bulk Actions */}
        <div style={{ backgroundColor: "white", borderRadius: "12px", padding: "16px", marginBottom: "16px", boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}>
          <p style={{ margin: "0 0 12px 0", fontSize: "14px", color: "#666" }}>快速填寫（僅套用到未設定的日期）：</p>
          <div style={{ display: "flex", gap: "8px" }}>
            <Button
              onClick={handleBulkSetAvailable}
              disabled={bulkUpdating}
              style={{ flex: 1, backgroundColor: "#22c55e", color: "white" }}
            >
              {bulkUpdating ? "處理中..." : "✓ 全部可出勤"}
            </Button>
            <Button
              onClick={handleBulkSetUnavailable}
              disabled={bulkUpdating}
              variant="outline"
              style={{ flex: 1 }}
            >
              {bulkUpdating ? "處理中..." : "✗ 全部不可出勤"}
            </Button>
          </div>
        </div>

        {/* Calendar */}
        <div style={{ backgroundColor: "white", borderRadius: "12px", padding: "16px", marginBottom: "16px", boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}>
          <div style={{ marginBottom: "12px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "16px", justifyContent: "center", fontSize: "14px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                <div style={{ width: "16px", height: "16px", backgroundColor: "#22c55e", borderRadius: "4px" }}></div>
                <span>可出勤</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                <div style={{ width: "16px", height: "16px", backgroundColor: "#ef4444", borderRadius: "4px" }}></div>
                <span>不可出勤</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                <div style={{ width: "16px", height: "16px", backgroundColor: "#e5e7eb", borderRadius: "4px" }}></div>
                <span>未設定</span>
              </div>
            </div>
          </div>

          {/* Day headers */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "4px", marginBottom: "8px" }}>
            {dayNames.map((day, i) => (
              <div key={day} style={{ textAlign: "center", fontSize: "12px", fontWeight: "bold", color: i === 0 ? "#ef4444" : i === 6 ? "#3b82f6" : "#666", padding: "4px" }}>
                {day}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "4px" }}>
            {/* Empty cells for offset */}
            {Array.from({ length: firstDayOfMonth }).map((_, i) => (
              <div key={`empty-${i}`} style={{ aspectRatio: "1", backgroundColor: "#f9fafb", borderRadius: "8px" }}></div>
            ))}

            {/* Days */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const dateStr = `${tokenInfo.year}-${String(tokenInfo.month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
              const record = availability[dateStr];
              const dayOfWeek = (firstDayOfMonth + i) % 7;

              let bgColor = "#e5e7eb"; // 未設定
              let textColor = "#374151";
              if (record) {
                bgColor = record.available ? "#22c55e" : "#ef4444";
                textColor = "white";
              }

              return (
                <button
                  key={day}
                  onClick={() => handleDateClick(dateStr)}
                  style={{
                    aspectRatio: "1",
                    backgroundColor: bgColor,
                    color: textColor,
                    borderRadius: "8px",
                    border: "none",
                    cursor: "pointer",
                    fontSize: "14px",
                    fontWeight: "500",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    transition: "transform 0.1s",
                  }}
                >
                  {day}
                </button>
              );
            })}
          </div>
        </div>

        {/* Complete Button */}
        {!tokenInfo.completedAt && (
          <Button
            onClick={handleComplete}
            disabled={saving}
            style={{ width: "100%", padding: "16px", fontSize: "16px", backgroundColor: "#3b82f6", color: "white" }}
          >
            {saving ? "處理中..." : "✓ 完成填寫"}
          </Button>
        )}
      </div>
    </div>
  );
}
