"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { StaffForm } from "@/components/staff/staff-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2, Mail, CheckCircle, UserCheck } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

interface StaffData {
  id: string;
  name: string;
  phone: string;
  skill: "FRONT" | "HOT" | "BOTH";
  perEventSalary: number;
  notes: string | null;
  status: "ACTIVE" | "INACTIVE";
  userId: string | null;
  lineUserId: string | null;
}

export default function EditStaffPage() {
  const router = useRouter();
  const params = useParams();
  const staffId = params.id as string;

  const [staff, setStaff] = useState<StaffData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSendingInvite, setIsSendingInvite] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchStaff() {
      try {
        const response = await fetch(`/api/v1/staff/${staffId}`);
        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.error || "找不到員工資料");
        }
        
        setStaff({
          ...data.staff,
          perEventSalary: parseFloat(data.staff.perEventSalary),
          userId: data.staff.userId || null,
          lineUserId: data.staff.lineUserId || null,
        });
      } catch (err) {
        console.error("Fetch staff error:", err);
        setError(err instanceof Error ? err.message : "載入失敗");
      } finally {
        setIsLoading(false);
      }
    }

    fetchStaff();
  }, [staffId]);

  const handleSendInvite = async () => {
    if (!staff) return;
    
    setIsSendingInvite(true);
    try {
      const response = await fetch("/api/v1/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ staffId: staff.id }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.alreadyBound) {
          toast.info("此員工已綁定 LINE 帳號");
        } else {
          throw new Error(data.error || "發送失敗");
        }
        return;
      }

      // Show LINE binding instructions
      toast.success(`請通知 ${staff.name} 完成 LINE 綁定`, { duration: 5000 });
      toast.info(
        `步驟：加入 LINE 官方帳號 → 輸入「綁定 ${staff.phone}」`,
        { duration: 8000 }
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "發送邀請失敗");
    } finally {
      setIsSendingInvite(false);
    }
  };

  const handleSubmit = async (data: {
    name: string;
    phone: string;
    skill: "FRONT" | "HOT" | "BOTH";
    perEventSalary: number;
    notes?: string;
    status: "ACTIVE" | "INACTIVE";
  }) => {
    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/v1/staff/${staffId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "更新失敗");
      }

      router.push("/staff");
      router.refresh();
    } catch (error) {
      console.error("Update error:", error);
      alert(error instanceof Error ? error.message : "更新員工資料時發生錯誤");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "400px" }}>
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !staff) {
    return (
      <div style={{ maxWidth: "42rem", margin: "0 auto", paddingTop: "2rem", paddingBottom: "2rem" }}>
        <Card>
          <CardContent className="pt-6">
            <div style={{ textAlign: "center" }}>
              <p style={{ color: "var(--destructive, #ef4444)", marginBottom: "1rem" }}>{error || "找不到員工資料"}</p>
              <Button asChild>
                <Link href="/staff">返回員工列表</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: "42rem", margin: "0 auto", paddingTop: "2rem", paddingBottom: "2rem" }}>
      <div style={{ marginBottom: "1.5rem" }}>
        <Button variant="ghost" asChild>
          <Link href="/staff">
            <ArrowLeft className="mr-2 h-4 w-4" />
            返回員工列表
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
            <CardTitle>編輯員工資料</CardTitle>
            {staff.lineUserId ? (
              <div style={{ display: "flex", alignItems: "center", gap: "6px", padding: "6px 12px", backgroundColor: "#dcfce7", borderRadius: "6px", fontSize: "14px", color: "#166534" }}>
                <CheckCircle style={{ width: "16px", height: "16px" }} />
                已綁定 LINE
              </div>
            ) : (
              <Button
                onClick={handleSendInvite}
                disabled={isSendingInvite}
                style={{ backgroundColor: "#00B900" }}
              >
                {isSendingInvite ? (
                  <>
                    <Loader2 style={{ width: "16px", height: "16px", marginRight: "6px", animation: "spin 1s linear infinite" }} />
                    處理中...
                  </>
                ) : (
                  <>
                    <Mail style={{ width: "16px", height: "16px", marginRight: "6px" }} />
                    LINE 綁定指引
                  </>
                )}
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <StaffForm
            initialData={{
              name: staff.name,
              phone: staff.phone,
              skill: staff.skill,
              perEventSalary: staff.perEventSalary,
              notes: staff.notes || "",
              status: staff.status,
            }}
            onSubmit={handleSubmit}
            onCancel={() => router.push("/staff")}
            isSubmitting={isSubmitting}
          />
        </CardContent>
      </Card>
    </div>
  );
}
