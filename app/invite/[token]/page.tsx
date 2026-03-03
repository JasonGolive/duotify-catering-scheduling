"use client";

import { useEffect, useState, use } from "react";
import { useUser, SignIn, SignUp } from "@clerk/nextjs";
import { useRouter } from "next/navigation";

interface InviteInfo {
  valid: boolean;
  staffId: string;
  staffName: string;
  staffPhone: string;
  staffEmail: string | null;
  expiresAt: string;
}

export default function InvitePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  const { user, isLoaded, isSignedIn } = useUser();
  const router = useRouter();

  const [inviteInfo, setInviteInfo] = useState<InviteInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [completing, setCompleting] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [showSignUp, setShowSignUp] = useState(true);

  useEffect(() => {
    validateToken();
  }, [token]);

  useEffect(() => {
    // Auto-complete when user is signed in
    if (isLoaded && isSignedIn && inviteInfo && !completed && !completing) {
      completeInvite();
    }
  }, [isLoaded, isSignedIn, inviteInfo, completed, completing]);

  const validateToken = async () => {
    try {
      const response = await fetch(`/api/v1/invite?token=${token}`);
      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "無效的邀請連結");
        setLoading(false);
        return;
      }

      setInviteInfo(data);
      setLoading(false);
    } catch (err) {
      setError("驗證失敗");
      setLoading(false);
    }
  };

  const completeInvite = async () => {
    setCompleting(true);
    try {
      const response = await fetch("/api/v1/invite/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "綁定失敗");
        setCompleting(false);
        return;
      }

      setCompleted(true);
      setCompleting(false);

      // Redirect to my-schedule after 2 seconds
      setTimeout(() => {
        router.push("/my-schedule");
      }, 2000);
    } catch (err) {
      setError("綁定失敗");
      setCompleting(false);
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "#f5f5f5" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: "24px", marginBottom: "16px" }}>⏳</div>
          <p>驗證邀請連結中...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "#f5f5f5" }}>
        <div style={{ textAlign: "center", padding: "32px", backgroundColor: "white", borderRadius: "12px", boxShadow: "0 2px 8px rgba(0,0,0,0.1)", maxWidth: "400px" }}>
          <div style={{ fontSize: "48px", marginBottom: "16px" }}>❌</div>
          <h1 style={{ fontSize: "20px", fontWeight: "bold", marginBottom: "8px", color: "#dc2626" }}>
            邀請連結無效
          </h1>
          <p style={{ color: "#666" }}>{error}</p>
          <p style={{ color: "#888", marginTop: "16px", fontSize: "14px" }}>
            請聯繫管理員重新發送邀請連結
          </p>
        </div>
      </div>
    );
  }

  if (completed) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "#f5f5f5" }}>
        <div style={{ textAlign: "center", padding: "32px", backgroundColor: "white", borderRadius: "12px", boxShadow: "0 2px 8px rgba(0,0,0,0.1)", maxWidth: "400px" }}>
          <div style={{ fontSize: "48px", marginBottom: "16px" }}>🎉</div>
          <h1 style={{ fontSize: "20px", fontWeight: "bold", marginBottom: "8px", color: "#16a34a" }}>
            帳號綁定成功！
          </h1>
          <p style={{ color: "#666" }}>
            {inviteInfo?.staffName}，歡迎加入！
          </p>
          <p style={{ color: "#888", marginTop: "16px", fontSize: "14px" }}>
            正在跳轉至排班頁面...
          </p>
        </div>
      </div>
    );
  }

  if (completing) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "#f5f5f5" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: "24px", marginBottom: "16px" }}>⏳</div>
          <p>正在綁定帳號...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f5f5f5", padding: "24px" }}>
      <div style={{ maxWidth: "450px", margin: "0 auto" }}>
        {/* Welcome Card */}
        <div style={{ backgroundColor: "white", borderRadius: "12px", padding: "24px", marginBottom: "24px", boxShadow: "0 2px 8px rgba(0,0,0,0.1)", textAlign: "center" }}>
          <div style={{ fontSize: "48px", marginBottom: "16px" }}>👋</div>
          <h1 style={{ fontSize: "22px", fontWeight: "bold", marginBottom: "8px", color: "#111827" }}>
            歡迎加入，{inviteInfo?.staffName}！
          </h1>
          <p style={{ color: "#666", marginBottom: "16px" }}>
            請完成帳號註冊以使用排班系統
          </p>
          <div style={{ backgroundColor: "#f0f9ff", padding: "12px", borderRadius: "8px", fontSize: "14px", color: "#0369a1" }}>
            <p>📱 手機號碼：{inviteInfo?.staffPhone}</p>
            {inviteInfo?.staffEmail && <p>📧 Email：{inviteInfo.staffEmail}</p>}
          </div>
        </div>

        {/* Auth Tabs */}
        <div style={{ display: "flex", marginBottom: "16px", backgroundColor: "white", borderRadius: "8px", padding: "4px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
          <button
            onClick={() => setShowSignUp(true)}
            style={{
              flex: 1,
              padding: "10px",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
              fontWeight: 500,
              backgroundColor: showSignUp ? "#3b82f6" : "transparent",
              color: showSignUp ? "white" : "#666",
            }}
          >
            註冊新帳號
          </button>
          <button
            onClick={() => setShowSignUp(false)}
            style={{
              flex: 1,
              padding: "10px",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
              fontWeight: 500,
              backgroundColor: !showSignUp ? "#3b82f6" : "transparent",
              color: !showSignUp ? "white" : "#666",
            }}
          >
            已有帳號登入
          </button>
        </div>

        {/* Clerk Auth */}
        <div style={{ display: "flex", justifyContent: "center" }}>
          {showSignUp ? (
            <SignUp
              appearance={{
                elements: {
                  rootBox: { width: "100%" },
                  card: { boxShadow: "0 2px 8px rgba(0,0,0,0.1)" },
                },
              }}
              redirectUrl={`/invite/${token}`}
              afterSignUpUrl={`/invite/${token}`}
            />
          ) : (
            <SignIn
              appearance={{
                elements: {
                  rootBox: { width: "100%" },
                  card: { boxShadow: "0 2px 8px rgba(0,0,0,0.1)" },
                },
              }}
              redirectUrl={`/invite/${token}`}
              afterSignInUrl={`/invite/${token}`}
            />
          )}
        </div>
      </div>
    </div>
  );
}
