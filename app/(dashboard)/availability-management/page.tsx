"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

interface Staff {
  id: string;
  name: string;
  phone: string;
  lineUserId: string | null;
}

interface AvailabilityToken {
  id: string;
  staffId: string;
  token: string;
  month: number;
  year: number;
  expiresAt: string;
  sentAt: string | null;
  completedAt: string | null;
  staff: Staff;
}

export default function AvailabilityManagementPage() {
  const [staff, setStaff] = useState<Staff[]>([]);
  const [tokens, setTokens] = useState<AvailabilityToken[]>([]);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedStaff, setSelectedStaff] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    fetchData();
  }, [selectedMonth, selectedYear]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [staffRes, tokensRes] = await Promise.all([
        fetch("/api/v1/staff?status=ACTIVE"),
        fetch(`/api/v1/availability-tokens?month=${selectedMonth}&year=${selectedYear}`),
      ]);

      if (staffRes.ok) {
        const staffData = await staffRes.json();
        // API returns { staff: [...] }
        setStaff(staffData.staff || []);
      }

      if (tokensRes.ok) {
        const tokensData = await tokensRes.json();
        setTokens(tokensData);
      }
    } catch (err) {
      console.error("Error fetching data:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSendToAll = async () => {
    const staffWithoutToken = staff.filter(
      (s) => !tokens.find((t) => t.staffId === s.id)
    );

    if (staffWithoutToken.length === 0) {
      toast.info("所有員工都已發送過連結");
      return;
    }

    setSending(true);
    try {
      const response = await fetch("/api/v1/availability-tokens", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          staffIds: staffWithoutToken.map((s) => s.id),
          month: selectedMonth,
          year: selectedYear,
          expiresInDays: 7,
          sendNotification: true,
        }),
      });

      if (!response.ok) throw new Error("發送失敗");

      const result = await response.json();
      toast.success(`已發送 ${result.success} 封通知`);
      fetchData();
    } catch (err) {
      toast.error("發送失敗");
    } finally {
      setSending(false);
    }
  };

  const handleSendToSelected = async () => {
    if (selectedStaff.length === 0) {
      toast.error("請先選擇員工");
      return;
    }

    setSending(true);
    try {
      const response = await fetch("/api/v1/availability-tokens", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          staffIds: selectedStaff,
          month: selectedMonth,
          year: selectedYear,
          expiresInDays: 7,
          sendNotification: true,
        }),
      });

      if (!response.ok) throw new Error("發送失敗");

      const result = await response.json();
      toast.success(`已發送 ${result.success} 封通知`);
      setSelectedStaff([]);
      fetchData();
    } catch (err) {
      toast.error("發送失敗");
    } finally {
      setSending(false);
    }
  };

  const handleResend = async (staffId: string) => {
    setSending(true);
    try {
      const response = await fetch("/api/v1/availability-tokens", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          staffIds: [staffId],
          month: selectedMonth,
          year: selectedYear,
          expiresInDays: 7,
          sendNotification: true,
        }),
      });

      if (!response.ok) throw new Error("發送失敗");

      toast.success("已重新發送");
      fetchData();
    } catch (err) {
      toast.error("發送失敗");
    } finally {
      setSending(false);
    }
  };

  const toggleStaffSelection = (staffId: string) => {
    setSelectedStaff((prev) =>
      prev.includes(staffId)
        ? prev.filter((id) => id !== staffId)
        : [...prev, staffId]
    );
  };

  const selectAllStaff = () => {
    const notSentStaff = staff.filter(
      (s) => !tokens.find((t) => t.staffId === s.id)
    );
    setSelectedStaff(notSentStaff.map((s) => s.id));
  };

  // Stats
  const totalStaff = staff.length;
  const sentCount = tokens.length;
  const completedCount = tokens.filter((t) => t.completedAt).length;
  const pendingCount = sentCount - completedCount;
  const notSentCount = totalStaff - sentCount;

  // Combine staff with their token status
  const staffWithStatus = staff.map((s) => {
    const token = tokens.find((t) => t.staffId === s.id);
    return {
      ...s,
      token,
      status: token
        ? token.completedAt
          ? "completed"
          : "pending"
        : "not_sent",
    };
  });

  return (
    <div style={{ padding: "24px" }}>
      {/* Header */}
      <div style={{ marginBottom: "24px" }}>
        <h1 style={{ fontSize: "24px", fontWeight: "bold", marginBottom: "8px" }}>
          📅 員工行事曆管理
        </h1>
        <p style={{ color: "#666" }}>發送行事曆填寫連結給員工，追蹤填寫狀態</p>
      </div>

      {/* Month/Year Selector */}
      <div style={{ display: "flex", gap: "12px", marginBottom: "24px", flexWrap: "wrap", alignItems: "center" }}>
        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          <Select
            value={String(selectedYear)}
            onValueChange={(v) => setSelectedYear(parseInt(v))}
          >
            <SelectTrigger style={{ width: "120px" }}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[2025, 2026, 2027].map((y) => (
                <SelectItem key={y} value={String(y)}>
                  {y} 年
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={String(selectedMonth)}
            onValueChange={(v) => setSelectedMonth(parseInt(v))}
          >
            <SelectTrigger style={{ width: "100px" }}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                <SelectItem key={m} value={String(m)}>
                  {m} 月
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div style={{ display: "flex", gap: "8px" }}>
          <Button
            onClick={handleSendToAll}
            disabled={sending || notSentCount === 0}
            style={{ backgroundColor: "#3b82f6", color: "white" }}
          >
            {sending ? "發送中..." : `📤 發送給所有未發送員工 (${notSentCount})`}
          </Button>

          {selectedStaff.length > 0 && (
            <Button
              onClick={handleSendToSelected}
              disabled={sending}
              variant="outline"
            >
              發送給已選 ({selectedStaff.length})
            </Button>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "16px", marginBottom: "24px" }}>
        <div style={{ backgroundColor: "#f3f4f6", padding: "16px", borderRadius: "12px", textAlign: "center" }}>
          <div style={{ fontSize: "28px", fontWeight: "bold" }}>{totalStaff}</div>
          <div style={{ color: "#666", fontSize: "14px" }}>總員工數</div>
        </div>
        <div style={{ backgroundColor: "#fef3c7", padding: "16px", borderRadius: "12px", textAlign: "center" }}>
          <div style={{ fontSize: "28px", fontWeight: "bold", color: "#d97706" }}>{notSentCount}</div>
          <div style={{ color: "#666", fontSize: "14px" }}>未發送</div>
        </div>
        <div style={{ backgroundColor: "#dbeafe", padding: "16px", borderRadius: "12px", textAlign: "center" }}>
          <div style={{ fontSize: "28px", fontWeight: "bold", color: "#2563eb" }}>{pendingCount}</div>
          <div style={{ color: "#666", fontSize: "14px" }}>待填寫</div>
        </div>
        <div style={{ backgroundColor: "#dcfce7", padding: "16px", borderRadius: "12px", textAlign: "center" }}>
          <div style={{ fontSize: "28px", fontWeight: "bold", color: "#16a34a" }}>{completedCount}</div>
          <div style={{ color: "#666", fontSize: "14px" }}>已完成</div>
        </div>
      </div>

      {/* Staff List */}
      <div style={{ backgroundColor: "white", borderRadius: "12px", border: "1px solid #e5e7eb", overflow: "hidden" }}>
        <div style={{ padding: "16px", borderBottom: "1px solid #e5e7eb", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2 style={{ fontWeight: "600", margin: 0 }}>員工填寫狀態</h2>
          <Button variant="outline" size="sm" onClick={selectAllStaff}>
            選擇所有未發送
          </Button>
        </div>

        {loading ? (
          <div style={{ padding: "40px", textAlign: "center", color: "#666" }}>載入中...</div>
        ) : (
          <div style={{ maxHeight: "500px", overflow: "auto" }}>
            {staffWithStatus.map((s) => (
              <div
                key={s.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  padding: "12px 16px",
                  borderBottom: "1px solid #f3f4f6",
                  gap: "12px",
                }}
              >
                {/* Checkbox for not sent */}
                {s.status === "not_sent" && (
                  <input
                    type="checkbox"
                    checked={selectedStaff.includes(s.id)}
                    onChange={() => toggleStaffSelection(s.id)}
                    style={{ width: "18px", height: "18px", cursor: "pointer" }}
                  />
                )}
                {s.status !== "not_sent" && <div style={{ width: "18px" }}></div>}

                {/* Avatar */}
                <div
                  style={{
                    width: "40px",
                    height: "40px",
                    borderRadius: "50%",
                    backgroundColor: s.status === "completed" ? "#22c55e" : s.status === "pending" ? "#3b82f6" : "#9ca3af",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "white",
                    fontWeight: "bold",
                    flexShrink: 0,
                  }}
                >
                  {s.name.charAt(0)}
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: "500", display: "flex", alignItems: "center", gap: "8px" }}>
                    {s.name}
                    {s.lineUserId && (
                      <span style={{ fontSize: "12px", color: "#22c55e" }}>📱 LINE</span>
                    )}
                  </div>
                  <div style={{ fontSize: "12px", color: "#666" }}>{s.phone}</div>
                </div>

                {/* Status */}
                <div style={{ textAlign: "right", minWidth: "120px" }}>
                  {s.status === "completed" && (
                    <div>
                      <span style={{ backgroundColor: "#dcfce7", color: "#166534", padding: "4px 8px", borderRadius: "4px", fontSize: "12px", fontWeight: "500" }}>
                        ✓ 已完成
                      </span>
                      <div style={{ fontSize: "11px", color: "#888", marginTop: "4px" }}>
                        {new Date(s.token!.completedAt!).toLocaleDateString("zh-TW")}
                      </div>
                    </div>
                  )}
                  {s.status === "pending" && (
                    <div>
                      <span style={{ backgroundColor: "#fef3c7", color: "#92400e", padding: "4px 8px", borderRadius: "4px", fontSize: "12px", fontWeight: "500" }}>
                        ⏳ 待填寫
                      </span>
                      <div style={{ fontSize: "11px", color: "#888", marginTop: "4px" }}>
                        已發送 {new Date(s.token!.sentAt!).toLocaleDateString("zh-TW")}
                      </div>
                    </div>
                  )}
                  {s.status === "not_sent" && (
                    <span style={{ backgroundColor: "#f3f4f6", color: "#6b7280", padding: "4px 8px", borderRadius: "4px", fontSize: "12px" }}>
                      未發送
                    </span>
                  )}
                </div>

                {/* Actions */}
                <div>
                  {s.status === "pending" && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleResend(s.id)}
                      disabled={sending}
                    >
                      重發
                    </Button>
                  )}
                  {s.status === "completed" && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => window.open(`/staff/${s.id}/availability`, "_blank")}
                    >
                      查看
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
