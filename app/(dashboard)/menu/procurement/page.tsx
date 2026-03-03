"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Download, Calendar, ShoppingCart } from "lucide-react";
import { toast } from "sonner";

interface ProcurementItem {
  ingredientName: string;
  unit: string;
  totalQuantity: number;
  events: Array<{
    eventId: string;
    eventName: string;
    eventDate: string;
    quantity: number;
  }>;
}

interface EventSummary {
  id: string;
  name: string;
  date: string;
  hasMenu: boolean;
  totalGuests: number;
}

interface Summary {
  totalEvents: number;
  eventsWithMenu: number;
  totalIngredients: number;
  dateRange: {
    start: string;
    end: string;
  };
}

export default function ProcurementPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [procurement, setProcurement] = useState<ProcurementItem[]>([]);
  const [events, setEvents] = useState<EventSummary[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [expandedIngredient, setExpandedIngredient] = useState<string | null>(null);

  // 預設為本週
  useEffect(() => {
    const today = new Date();
    const nextWeek = new Date(today);
    nextWeek.setDate(today.getDate() + 7);

    setStartDate(today.toISOString().split("T")[0]);
    setEndDate(nextWeek.toISOString().split("T")[0]);
  }, []);

  const fetchProcurement = async () => {
    if (!startDate || !endDate) {
      toast.error("請選擇日期範圍");
      return;
    }

    setLoading(true);
    try {
      const params = new URLSearchParams({
        startDate,
        endDate,
      });

      const response = await fetch(`/api/v1/menu/procurement?${params}`);
      const data = await response.json();

      if (response.ok) {
        setProcurement(data.procurement);
        setEvents(data.events);
        setSummary(data.summary);
      } else {
        toast.error(data.error || "載入失敗");
      }
    } catch (error) {
      toast.error("載入失敗");
    } finally {
      setLoading(false);
    }
  };

  const exportCSV = async () => {
    try {
      const response = await fetch("/api/v1/menu/procurement", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          startDate,
          endDate,
          format: "csv",
        }),
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `procurement_${startDate}_${endDate}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        toast.success("已下載採購單");
      } else {
        const data = await response.json();
        toast.error(data.error || "匯出失敗");
      }
    } catch (error) {
      toast.error("匯出失敗");
    }
  };

  return (
    <div style={{ padding: "24px" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "24px" }}>
        <Button
          variant="ghost"
          onClick={() => router.push("/menu")}
          style={{ padding: "8px" }}
        >
          <ArrowLeft style={{ width: "20px", height: "20px" }} />
        </Button>
        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: "24px", fontWeight: "bold", color: "#111827" }}>
            備料彙總
          </h1>
          <p style={{ color: "#6b7280", marginTop: "4px" }}>
            跨場次材料需求彙總
          </p>
        </div>
      </div>

      {/* Date Filter */}
      <Card style={{ marginBottom: "24px" }}>
        <CardContent style={{ padding: "16px" }}>
          <div style={{ display: "flex", gap: "16px", alignItems: "flex-end", flexWrap: "wrap" }}>
            <div>
              <label style={{ display: "block", marginBottom: "4px", fontSize: "14px", fontWeight: 500 }}>
                開始日期
              </label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                style={{ width: "160px" }}
              />
            </div>
            <div>
              <label style={{ display: "block", marginBottom: "4px", fontSize: "14px", fontWeight: 500 }}>
                結束日期
              </label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                style={{ width: "160px" }}
              />
            </div>
            <Button
              onClick={fetchProcurement}
              disabled={loading}
              style={{ backgroundColor: "#8BA4BC" }}
            >
              {loading ? "查詢中..." : "查詢"}
            </Button>
            {procurement.length > 0 && (
              <Button variant="outline" onClick={exportCSV}>
                <Download style={{ width: "16px", height: "16px", marginRight: "6px" }} />
                匯出 CSV
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Summary */}
      {summary && (
        <div style={{ 
          display: "grid", 
          gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", 
          gap: "16px",
          marginBottom: "24px" 
        }}>
          <Card>
            <CardContent style={{ padding: "16px", textAlign: "center" }}>
              <Calendar style={{ width: "24px", height: "24px", color: "#2563eb", margin: "0 auto 8px" }} />
              <div style={{ fontSize: "24px", fontWeight: "bold", color: "#111827" }}>
                {summary.totalEvents}
              </div>
              <div style={{ fontSize: "14px", color: "#6b7280" }}>場次</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent style={{ padding: "16px", textAlign: "center" }}>
              <ShoppingCart style={{ width: "24px", height: "24px", color: "#16a34a", margin: "0 auto 8px" }} />
              <div style={{ fontSize: "24px", fontWeight: "bold", color: "#111827" }}>
                {summary.eventsWithMenu}
              </div>
              <div style={{ fontSize: "14px", color: "#6b7280" }}>有菜單</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent style={{ padding: "16px", textAlign: "center" }}>
              <div style={{ fontSize: "24px", fontWeight: "bold", color: "#111827" }}>
                {summary.totalIngredients}
              </div>
              <div style={{ fontSize: "14px", color: "#6b7280" }}>種材料</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Events without menu warning */}
      {events.filter(e => !e.hasMenu).length > 0 && (
        <Card style={{ marginBottom: "24px", backgroundColor: "#fef3c7" }}>
          <CardContent style={{ padding: "16px" }}>
            <div style={{ fontWeight: 500, color: "#92400e", marginBottom: "8px" }}>
              ⚠️ 以下場次尚未設定菜單：
            </div>
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
              {events.filter(e => !e.hasMenu).map(event => (
                <span
                  key={event.id}
                  style={{
                    padding: "4px 8px",
                    backgroundColor: "white",
                    borderRadius: "4px",
                    fontSize: "13px",
                  }}
                >
                  {event.date} {event.name}
                </span>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Procurement List */}
      {procurement.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle style={{ fontSize: "18px" }}>採購清單</CardTitle>
          </CardHeader>
          <CardContent>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: "2px solid #e5e7eb" }}>
                    <th style={{ padding: "12px", textAlign: "left", fontWeight: 600 }}>材料名稱</th>
                    <th style={{ padding: "12px", textAlign: "right", fontWeight: 600 }}>總需求量</th>
                    <th style={{ padding: "12px", textAlign: "left", fontWeight: 600 }}>單位</th>
                    <th style={{ padding: "12px", textAlign: "center", fontWeight: 600 }}>場次數</th>
                  </tr>
                </thead>
                <tbody>
                  {procurement.map((item, index) => (
                    <>
                      <tr
                        key={`${item.ingredientName}-${item.unit}`}
                        style={{
                          borderBottom: "1px solid #e5e7eb",
                          backgroundColor: index % 2 === 0 ? "white" : "#f9fafb",
                          cursor: "pointer",
                        }}
                        onClick={() =>
                          setExpandedIngredient(
                            expandedIngredient === `${item.ingredientName}-${item.unit}`
                              ? null
                              : `${item.ingredientName}-${item.unit}`
                          )
                        }
                      >
                        <td style={{ padding: "12px", fontWeight: 500 }}>{item.ingredientName}</td>
                        <td style={{ padding: "12px", textAlign: "right", fontFamily: "monospace" }}>
                          {item.totalQuantity.toFixed(2)}
                        </td>
                        <td style={{ padding: "12px" }}>{item.unit}</td>
                        <td style={{ padding: "12px", textAlign: "center" }}>{item.events.length}</td>
                      </tr>
                      {expandedIngredient === `${item.ingredientName}-${item.unit}` && (
                        <tr>
                          <td colSpan={4} style={{ padding: "12px", backgroundColor: "#f0f9ff" }}>
                            <div style={{ fontSize: "13px" }}>
                              <div style={{ fontWeight: 500, marginBottom: "8px" }}>場次明細：</div>
                              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "8px" }}>
                                {item.events.map((event) => (
                                  <div
                                    key={event.eventId}
                                    style={{
                                      padding: "8px",
                                      backgroundColor: "white",
                                      borderRadius: "4px",
                                      border: "1px solid #e5e7eb",
                                    }}
                                  >
                                    <div style={{ fontWeight: 500 }}>{event.eventName}</div>
                                    <div style={{ color: "#6b7280", fontSize: "12px" }}>
                                      {event.eventDate} • {event.quantity.toFixed(2)} {item.unit}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      ) : (
        !loading && summary === null && (
          <Card>
            <CardContent style={{ padding: "48px", textAlign: "center" }}>
              <ShoppingCart style={{ width: "48px", height: "48px", color: "#9ca3af", margin: "0 auto 16px" }} />
              <p style={{ color: "#6b7280" }}>選擇日期範圍後點擊查詢</p>
            </CardContent>
          </Card>
        )
      )}
    </div>
  );
}
