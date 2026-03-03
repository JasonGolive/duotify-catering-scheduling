"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { zhTW } from "date-fns/locale";

interface LeaveRequest {
  id: string;
  attendanceStatus: string;
  leaveReason: string | null;
  createdAt: string;
  event: {
    id: string;
    name: string;
    date: string;
    assemblyTime: string | null;
    startTime: string | null;
    location: string;
    venue?: { name: string } | null;
  };
  staff: {
    id: string;
    name: string;
    phone: string;
    email: string | null;
    lineUserId: string | null;
  };
}

type TabStatus = "LEAVE_REQUESTED" | "LEAVE_APPROVED" | "LEAVE_REJECTED";

const tabLabels: Record<TabStatus, string> = {
  LEAVE_REQUESTED: "待審核",
  LEAVE_APPROVED: "已核准",
  LEAVE_REJECTED: "已拒絕",
};

export default function LeaveRequestsPage() {
  const [activeTab, setActiveTab] = useState<TabStatus>("LEAVE_REQUESTED");
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<LeaveRequest | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const fetchLeaveRequests = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/v1/leave-requests?status=${activeTab}`);
      if (!response.ok) throw new Error("取得請假申請失敗");
      const data = await response.json();
      setLeaveRequests(data.leaveRequests || []);
    } catch (error) {
      console.error("Error fetching leave requests:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaveRequests();
  }, [activeTab]);

  const handleApprove = async (request: LeaveRequest) => {
    setProcessing(request.id);
    try {
      const response = await fetch(`/api/v1/leave-requests/${request.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "approve" }),
      });
      if (!response.ok) throw new Error("核准失敗");
      await fetchLeaveRequests();
    } catch (error) {
      console.error("Error approving leave request:", error);
      alert("核准失敗，請稍後再試");
    } finally {
      setProcessing(null);
    }
  };

  const openRejectDialog = (request: LeaveRequest) => {
    setSelectedRequest(request);
    setRejectReason("");
    setRejectDialogOpen(true);
  };

  const handleReject = async () => {
    if (!selectedRequest) return;
    setProcessing(selectedRequest.id);
    try {
      const response = await fetch(`/api/v1/leave-requests/${selectedRequest.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reject", reason: rejectReason }),
      });
      if (!response.ok) throw new Error("拒絕失敗");
      setRejectDialogOpen(false);
      setSelectedRequest(null);
      await fetchLeaveRequests();
    } catch (error) {
      console.error("Error rejecting leave request:", error);
      alert("拒絕失敗，請稍後再試");
    } finally {
      setProcessing(null);
    }
  };

  const formatEventDate = (dateStr: string) => {
    return format(new Date(dateStr), "yyyy/MM/dd (E)", { locale: zhTW });
  };

  const formatCreatedAt = (dateStr: string) => {
    return format(new Date(dateStr), "yyyy/MM/dd HH:mm");
  };

  return (
    <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "1.5rem 1rem" }}>
      <div style={{ marginBottom: "1.5rem" }}>
        <h1 style={{ fontSize: "1.5rem", fontWeight: "bold", color: "#1f2937" }}>請假管理</h1>
        <p style={{ color: "#6b7280", fontSize: "0.875rem", marginTop: "0.25rem" }}>
          審核員工的請假申請
        </p>
      </div>

      {/* Tabs */}
      <div style={{ 
        display: "flex", 
        gap: "0.5rem", 
        marginBottom: "1.5rem",
        borderBottom: "1px solid #e5e7eb",
        paddingBottom: "0.5rem"
      }}>
        {(Object.keys(tabLabels) as TabStatus[]).map((status) => (
          <button
            key={status}
            onClick={() => setActiveTab(status)}
            style={{
              padding: "0.5rem 1rem",
              borderRadius: "0.375rem",
              border: "none",
              cursor: "pointer",
              fontWeight: activeTab === status ? "600" : "400",
              backgroundColor: activeTab === status ? "#3b82f6" : "transparent",
              color: activeTab === status ? "white" : "#6b7280",
              transition: "all 0.2s",
            }}
          >
            {tabLabels[status]}
          </button>
        ))}
      </div>

      {/* Table */}
      <div style={{ 
        backgroundColor: "white", 
        borderRadius: "0.5rem", 
        boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
        overflow: "hidden"
      }}>
        {loading ? (
          <div style={{ textAlign: "center", padding: "3rem", color: "#6b7280" }}>
            載入中...
          </div>
        ) : leaveRequests.length === 0 ? (
          <div style={{ textAlign: "center", padding: "3rem", color: "#6b7280" }}>
            沒有{tabLabels[activeTab]}的請假申請
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ backgroundColor: "#f9fafb", borderBottom: "1px solid #e5e7eb" }}>
                  <th style={{ padding: "0.75rem 1rem", textAlign: "left", fontWeight: "600", color: "#374151", fontSize: "0.875rem" }}>員工姓名</th>
                  <th style={{ padding: "0.75rem 1rem", textAlign: "left", fontWeight: "600", color: "#374151", fontSize: "0.875rem" }}>活動名稱</th>
                  <th style={{ padding: "0.75rem 1rem", textAlign: "left", fontWeight: "600", color: "#374151", fontSize: "0.875rem" }}>活動日期</th>
                  <th style={{ padding: "0.75rem 1rem", textAlign: "left", fontWeight: "600", color: "#374151", fontSize: "0.875rem" }}>請假原因</th>
                  <th style={{ padding: "0.75rem 1rem", textAlign: "left", fontWeight: "600", color: "#374151", fontSize: "0.875rem" }}>申請時間</th>
                  {activeTab === "LEAVE_REQUESTED" && (
                    <th style={{ padding: "0.75rem 1rem", textAlign: "center", fontWeight: "600", color: "#374151", fontSize: "0.875rem" }}>操作</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {leaveRequests.map((request) => (
                  <tr key={request.id} style={{ borderBottom: "1px solid #e5e7eb" }}>
                    <td style={{ padding: "0.75rem 1rem", fontSize: "0.875rem", color: "#1f2937" }}>
                      <div style={{ fontWeight: "500" }}>{request.staff.name}</div>
                      <div style={{ color: "#6b7280", fontSize: "0.75rem" }}>{request.staff.phone}</div>
                    </td>
                    <td style={{ padding: "0.75rem 1rem", fontSize: "0.875rem", color: "#1f2937" }}>
                      {request.event.name}
                    </td>
                    <td style={{ padding: "0.75rem 1rem", fontSize: "0.875rem", color: "#1f2937" }}>
                      <div>{formatEventDate(request.event.date)}</div>
                      <div style={{ color: "#6b7280", fontSize: "0.75rem" }}>
                        {request.event.assemblyTime || request.event.startTime || "-"}
                      </div>
                    </td>
                    <td style={{ padding: "0.75rem 1rem", fontSize: "0.875rem", color: "#1f2937", maxWidth: "200px" }}>
                      {request.leaveReason || "-"}
                    </td>
                    <td style={{ padding: "0.75rem 1rem", fontSize: "0.875rem", color: "#6b7280" }}>
                      {formatCreatedAt(request.createdAt)}
                    </td>
                    {activeTab === "LEAVE_REQUESTED" && (
                      <td style={{ padding: "0.75rem 1rem", textAlign: "center" }}>
                        <div style={{ display: "flex", gap: "0.5rem", justifyContent: "center" }}>
                          <button
                            onClick={() => handleApprove(request)}
                            disabled={processing === request.id}
                            style={{
                              padding: "0.375rem 0.75rem",
                              borderRadius: "0.375rem",
                              border: "none",
                              cursor: processing === request.id ? "not-allowed" : "pointer",
                              backgroundColor: "#22c55e",
                              color: "white",
                              fontSize: "0.875rem",
                              fontWeight: "500",
                              opacity: processing === request.id ? 0.6 : 1,
                            }}
                          >
                            {processing === request.id ? "處理中..." : "核准"}
                          </button>
                          <button
                            onClick={() => openRejectDialog(request)}
                            disabled={processing === request.id}
                            style={{
                              padding: "0.375rem 0.75rem",
                              borderRadius: "0.375rem",
                              border: "none",
                              cursor: processing === request.id ? "not-allowed" : "pointer",
                              backgroundColor: "#ef4444",
                              color: "white",
                              fontSize: "0.875rem",
                              fontWeight: "500",
                              opacity: processing === request.id ? 0.6 : 1,
                            }}
                          >
                            拒絕
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Reject Dialog */}
      {rejectDialogOpen && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
          }}
          onClick={() => setRejectDialogOpen(false)}
        >
          <div
            style={{
              backgroundColor: "white",
              borderRadius: "0.5rem",
              padding: "1.5rem",
              width: "90%",
              maxWidth: "400px",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ fontSize: "1.125rem", fontWeight: "600", marginBottom: "1rem", color: "#1f2937" }}>
              拒絕請假申請
            </h2>
            <p style={{ fontSize: "0.875rem", color: "#6b7280", marginBottom: "1rem" }}>
              {selectedRequest?.staff.name} - {selectedRequest?.event.name}
            </p>
            <div style={{ marginBottom: "1rem" }}>
              <label style={{ display: "block", fontSize: "0.875rem", fontWeight: "500", color: "#374151", marginBottom: "0.25rem" }}>
                拒絕原因（選填）
              </label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="請輸入拒絕原因..."
                style={{
                  width: "100%",
                  minHeight: "80px",
                  padding: "0.5rem",
                  borderRadius: "0.375rem",
                  border: "1px solid #d1d5db",
                  fontSize: "0.875rem",
                  resize: "vertical",
                  boxSizing: "border-box",
                }}
              />
            </div>
            <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end" }}>
              <button
                onClick={() => setRejectDialogOpen(false)}
                style={{
                  padding: "0.5rem 1rem",
                  borderRadius: "0.375rem",
                  border: "1px solid #d1d5db",
                  backgroundColor: "white",
                  color: "#374151",
                  fontSize: "0.875rem",
                  cursor: "pointer",
                }}
              >
                取消
              </button>
              <button
                onClick={handleReject}
                disabled={processing !== null}
                style={{
                  padding: "0.5rem 1rem",
                  borderRadius: "0.375rem",
                  border: "none",
                  backgroundColor: "#ef4444",
                  color: "white",
                  fontSize: "0.875rem",
                  fontWeight: "500",
                  cursor: processing !== null ? "not-allowed" : "pointer",
                  opacity: processing !== null ? 0.6 : 1,
                }}
              >
                {processing !== null ? "處理中..." : "確認拒絕"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
