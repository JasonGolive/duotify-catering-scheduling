"use client";

import { useState, useEffect } from "react";

interface AnalyticsData {
  summary: {
    totalEvents: number;
    completedEvents: number;
    pendingEvents: number;
    totalRevenue: number;
    averageAttendees: number;
    costRatio: number;
  };
  monthlyTrend: {
    month: string;
    count: number;
  }[];
  eventTypeDistribution: {
    type: string;
    count: number;
  }[];
  staffPerformance: {
    id: string;
    name: string;
    eventCount: number;
    attendanceRate: number;
    averageSalary: number;
  }[];
  keyMetrics: {
    overallAttendanceRate: number;
    leaveRate: number;
    averageEventsPerStaffPerMonth: number;
  };
}

type DateRangeOption = "本月" | "上月" | "本季" | "今年" | "自訂";

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<DateRangeOption>("本月");
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");

  const getDateRange = (): { startDate: string; endDate: string } => {
    const now = new Date();
    let startDate: Date;
    let endDate: Date = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

    switch (dateRange) {
      case "本月":
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        break;
      case "上月":
        startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        endDate = new Date(now.getFullYear(), now.getMonth(), 0);
        break;
      case "本季":
        const quarter = Math.floor(now.getMonth() / 3);
        startDate = new Date(now.getFullYear(), quarter * 3, 1);
        endDate = new Date(now.getFullYear(), (quarter + 1) * 3, 0);
        break;
      case "今年":
        startDate = new Date(now.getFullYear(), 0, 1);
        endDate = new Date(now.getFullYear(), 11, 31);
        break;
      case "自訂":
        return {
          startDate: customStartDate || new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0],
          endDate: customEndDate || now.toISOString().split("T")[0],
        };
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    return {
      startDate: startDate.toISOString().split("T")[0],
      endDate: endDate.toISOString().split("T")[0],
    };
  };

  const fetchAnalytics = async () => {
    setLoading(true);
    setError(null);
    try {
      const { startDate, endDate } = getDateRange();
      const response = await fetch(`/api/v1/analytics?startDate=${startDate}&endDate=${endDate}`);
      if (!response.ok) {
        throw new Error("Failed to fetch analytics data");
      }
      const result = await response.json();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "發生錯誤");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [dateRange, customStartDate, customEndDate]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("zh-TW", {
      style: "currency",
      currency: "TWD",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatPercent = (value: number) => {
    return `${(value * 100).toFixed(1)}%`;
  };

  const getAttendanceColor = (rate: number) => {
    if (rate >= 0.9) return "#16a34a";
    if (rate >= 0.7) return "#ca8a04";
    return "#dc2626";
  };

  const getAttendanceBgColor = (rate: number) => {
    if (rate >= 0.9) return "#dcfce7";
    if (rate >= 0.7) return "#fef9c3";
    return "#fee2e2";
  };

  const maxMonthlyCount = data?.monthlyTrend ? Math.max(...data.monthlyTrend.map((m) => m.count), 1) : 1;
  const maxEventTypeCount = data?.eventTypeDistribution ? Math.max(...data.eventTypeDistribution.map((e) => e.count), 1) : 1;

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "60vh" }}>
        <div style={{ color: "#6b7280" }}>載入中...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "60vh" }}>
        <div style={{ color: "#dc2626" }}>{error}</div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      {/* Header */}
      <div
        style={{
          borderRadius: "1rem",
          background: "linear-gradient(to right, #8BA4BC, #6B8AAB)",
          padding: "1.5rem",
          color: "white",
        }}
      >
        <h1 style={{ fontSize: "1.5rem", fontWeight: "bold" }}>📊 數據分析</h1>
        <p style={{ color: "rgba(255,255,255,0.8)", marginTop: "0.25rem" }}>
          管理報表與營運數據總覽
        </p>
      </div>

      {/* Date Range Selector */}
      <div
        style={{
          backgroundColor: "white",
          borderRadius: "1rem",
          padding: "1rem",
          boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
        }}
      >
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "0.75rem" }}>
          <span style={{ fontWeight: 500, color: "#374151" }}>日期範圍：</span>
          {(["本月", "上月", "本季", "今年", "自訂"] as DateRangeOption[]).map((option) => (
            <button
              key={option}
              onClick={() => setDateRange(option)}
              style={{
                padding: "0.5rem 1rem",
                borderRadius: "0.5rem",
                border: "none",
                cursor: "pointer",
                backgroundColor: dateRange === option ? "#8BA4BC" : "#f3f4f6",
                color: dateRange === option ? "white" : "#374151",
                fontWeight: dateRange === option ? 500 : 400,
                transition: "all 0.2s",
              }}
            >
              {option}
            </button>
          ))}
        </div>
        {dateRange === "自訂" && (
          <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "0.75rem", marginTop: "1rem" }}>
            <input
              type="date"
              value={customStartDate}
              onChange={(e) => setCustomStartDate(e.target.value)}
              style={{
                padding: "0.5rem",
                borderRadius: "0.5rem",
                border: "1px solid #d1d5db",
                fontSize: "0.875rem",
              }}
            />
            <span style={{ color: "#6b7280" }}>至</span>
            <input
              type="date"
              value={customEndDate}
              onChange={(e) => setCustomEndDate(e.target.value)}
              style={{
                padding: "0.5rem",
                borderRadius: "0.5rem",
                border: "1px solid #d1d5db",
                fontSize: "0.875rem",
              }}
            />
          </div>
        )}
      </div>

      {/* Summary Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "1rem",
        }}
      >
        {/* 總活動數 */}
        <div
          style={{
            backgroundColor: "white",
            borderRadius: "1rem",
            padding: "1.25rem",
            boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
          }}
        >
          <p style={{ fontSize: "0.875rem", color: "#6b7280" }}>總活動數</p>
          <p style={{ fontSize: "2rem", fontWeight: "bold", color: "#111827", marginTop: "0.25rem" }}>
            {data?.summary.totalEvents ?? 0}
          </p>
          <div style={{ display: "flex", gap: "0.75rem", marginTop: "0.5rem", fontSize: "0.75rem" }}>
            <span style={{ color: "#16a34a" }}>✓ 已完成 {data?.summary.completedEvents ?? 0}</span>
            <span style={{ color: "#ca8a04" }}>⏳ 待處理 {data?.summary.pendingEvents ?? 0}</span>
          </div>
        </div>

        {/* 活動營收 */}
        <div
          style={{
            backgroundColor: "white",
            borderRadius: "1rem",
            padding: "1.25rem",
            boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
          }}
        >
          <p style={{ fontSize: "0.875rem", color: "#6b7280" }}>活動營收</p>
          <p style={{ fontSize: "2rem", fontWeight: "bold", color: "#111827", marginTop: "0.25rem" }}>
            {formatCurrency(data?.summary.totalRevenue ?? 0)}
          </p>
        </div>

        {/* 平均每場人數 */}
        <div
          style={{
            backgroundColor: "white",
            borderRadius: "1rem",
            padding: "1.25rem",
            boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
          }}
        >
          <p style={{ fontSize: "0.875rem", color: "#6b7280" }}>平均每場人數</p>
          <p style={{ fontSize: "2rem", fontWeight: "bold", color: "#111827", marginTop: "0.25rem" }}>
            {(data?.summary.averageAttendees ?? 0).toFixed(1)}
          </p>
        </div>

        {/* 成本佔比 */}
        <div
          style={{
            backgroundColor: "white",
            borderRadius: "1rem",
            padding: "1.25rem",
            boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
          }}
        >
          <p style={{ fontSize: "0.875rem", color: "#6b7280" }}>成本佔比</p>
          <p style={{ fontSize: "2rem", fontWeight: "bold", color: "#111827", marginTop: "0.25rem" }}>
            {formatPercent(data?.summary.costRatio ?? 0)}
          </p>
          <p style={{ fontSize: "0.75rem", color: "#6b7280", marginTop: "0.25rem" }}>薪資成本 / 營收</p>
        </div>
      </div>

      {/* Charts Section */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
          gap: "1rem",
        }}
      >
        {/* 活動趨勢 (Bar Chart) */}
        <div
          style={{
            backgroundColor: "white",
            borderRadius: "1rem",
            padding: "1.25rem",
            boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
          }}
        >
          <h3 style={{ fontSize: "1rem", fontWeight: 600, color: "#374151", marginBottom: "1rem" }}>
            📈 活動趨勢
          </h3>
          <div style={{ display: "flex", alignItems: "flex-end", gap: "0.5rem", height: "160px" }}>
            {data?.monthlyTrend && data.monthlyTrend.length > 0 ? (
              data.monthlyTrend.map((item, index) => (
                <div
                  key={index}
                  style={{
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: "0.25rem",
                  }}
                >
                  <span style={{ fontSize: "0.75rem", color: "#374151" }}>{item.count}</span>
                  <div
                    style={{
                      width: "100%",
                      backgroundColor: "#8BA4BC",
                      borderRadius: "0.25rem 0.25rem 0 0",
                      height: `${(item.count / maxMonthlyCount) * 120}px`,
                      minHeight: "4px",
                      transition: "height 0.3s",
                    }}
                  />
                  <span style={{ fontSize: "0.625rem", color: "#6b7280", whiteSpace: "nowrap" }}>
                    {item.month}
                  </span>
                </div>
              ))
            ) : (
              <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: "#6b7280" }}>
                暫無數據
              </div>
            )}
          </div>
        </div>

        {/* 活動類型分布 */}
        <div
          style={{
            backgroundColor: "white",
            borderRadius: "1rem",
            padding: "1.25rem",
            boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
          }}
        >
          <h3 style={{ fontSize: "1rem", fontWeight: 600, color: "#374151", marginBottom: "1rem" }}>
            🎯 活動類型分布
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {data?.eventTypeDistribution && data.eventTypeDistribution.length > 0 ? (
              data.eventTypeDistribution.map((item, index) => {
                const colors = ["#8BA4BC", "#6BAB73", "#F5C242", "#E8A5B8", "#9333ea"];
                const color = colors[index % colors.length];
                const percentage = (item.count / maxEventTypeCount) * 100;
                return (
                  <div key={index}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.25rem" }}>
                      <span style={{ fontSize: "0.875rem", color: "#374151" }}>{item.type}</span>
                      <span style={{ fontSize: "0.875rem", color: "#6b7280" }}>{item.count} 場</span>
                    </div>
                    <div
                      style={{
                        width: "100%",
                        height: "0.5rem",
                        backgroundColor: "#f3f4f6",
                        borderRadius: "0.25rem",
                        overflow: "hidden",
                      }}
                    >
                      <div
                        style={{
                          width: `${percentage}%`,
                          height: "100%",
                          backgroundColor: color,
                          borderRadius: "0.25rem",
                          transition: "width 0.3s",
                        }}
                      />
                    </div>
                  </div>
                );
              })
            ) : (
              <div style={{ textAlign: "center", color: "#6b7280", padding: "2rem 0" }}>暫無數據</div>
            )}
          </div>
        </div>
      </div>

      {/* Staff Performance Table */}
      <div
        style={{
          backgroundColor: "white",
          borderRadius: "1rem",
          padding: "1.25rem",
          boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
        }}
      >
        <h3 style={{ fontSize: "1rem", fontWeight: 600, color: "#374151", marginBottom: "1rem" }}>
          👥 員工績效排行 (Top 10)
        </h3>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.875rem" }}>
            <thead>
              <tr style={{ borderBottom: "2px solid #e5e7eb" }}>
                <th style={{ textAlign: "left", padding: "0.75rem 0.5rem", color: "#6b7280", fontWeight: 500 }}>
                  排名
                </th>
                <th style={{ textAlign: "left", padding: "0.75rem 0.5rem", color: "#6b7280", fontWeight: 500 }}>
                  姓名
                </th>
                <th style={{ textAlign: "center", padding: "0.75rem 0.5rem", color: "#6b7280", fontWeight: 500 }}>
                  場次
                </th>
                <th style={{ textAlign: "center", padding: "0.75rem 0.5rem", color: "#6b7280", fontWeight: 500 }}>
                  出勤率
                </th>
                <th style={{ textAlign: "right", padding: "0.75rem 0.5rem", color: "#6b7280", fontWeight: 500 }}>
                  平均薪資
                </th>
              </tr>
            </thead>
            <tbody>
              {data?.staffPerformance && data.staffPerformance.length > 0 ? (
                data.staffPerformance.map((staff, index) => (
                  <tr key={staff.id} style={{ borderBottom: "1px solid #f3f4f6" }}>
                    <td style={{ padding: "0.75rem 0.5rem", color: "#374151" }}>
                      {index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : index + 1}
                    </td>
                    <td style={{ padding: "0.75rem 0.5rem", color: "#111827", fontWeight: 500 }}>
                      {staff.name}
                    </td>
                    <td style={{ padding: "0.75rem 0.5rem", textAlign: "center", color: "#374151" }}>
                      {staff.eventCount}
                    </td>
                    <td style={{ padding: "0.75rem 0.5rem", textAlign: "center" }}>
                      <span
                        style={{
                          display: "inline-block",
                          padding: "0.25rem 0.5rem",
                          borderRadius: "0.375rem",
                          fontSize: "0.75rem",
                          fontWeight: 500,
                          backgroundColor: getAttendanceBgColor(staff.attendanceRate),
                          color: getAttendanceColor(staff.attendanceRate),
                        }}
                      >
                        {formatPercent(staff.attendanceRate)}
                      </span>
                    </td>
                    <td style={{ padding: "0.75rem 0.5rem", textAlign: "right", color: "#374151" }}>
                      {formatCurrency(staff.averageSalary)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} style={{ textAlign: "center", color: "#6b7280", padding: "2rem" }}>
                    暫無數據
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "1rem",
        }}
      >
        {/* 整體出勤率 */}
        <div
          style={{
            backgroundColor: "white",
            borderRadius: "1rem",
            padding: "1.25rem",
            boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
            borderLeft: "4px solid #16a34a",
          }}
        >
          <p style={{ fontSize: "0.875rem", color: "#6b7280" }}>整體出勤率</p>
          <p style={{ fontSize: "2rem", fontWeight: "bold", color: "#16a34a", marginTop: "0.25rem" }}>
            {formatPercent(data?.keyMetrics.overallAttendanceRate ?? 0)}
          </p>
        </div>

        {/* 請假率 */}
        <div
          style={{
            backgroundColor: "white",
            borderRadius: "1rem",
            padding: "1.25rem",
            boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
            borderLeft: "4px solid #ca8a04",
          }}
        >
          <p style={{ fontSize: "0.875rem", color: "#6b7280" }}>請假率</p>
          <p style={{ fontSize: "2rem", fontWeight: "bold", color: "#ca8a04", marginTop: "0.25rem" }}>
            {formatPercent(data?.keyMetrics.leaveRate ?? 0)}
          </p>
        </div>

        {/* 平均每人月場次 */}
        <div
          style={{
            backgroundColor: "white",
            borderRadius: "1rem",
            padding: "1.25rem",
            boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
            borderLeft: "4px solid #8BA4BC",
          }}
        >
          <p style={{ fontSize: "0.875rem", color: "#6b7280" }}>平均每人月場次</p>
          <p style={{ fontSize: "2rem", fontWeight: "bold", color: "#8BA4BC", marginTop: "0.25rem" }}>
            {(data?.keyMetrics.averageEventsPerStaffPerMonth ?? 0).toFixed(1)}
          </p>
        </div>
      </div>
    </div>
  );
}
