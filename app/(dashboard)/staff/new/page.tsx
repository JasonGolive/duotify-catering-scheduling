"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { StaffForm } from "@/components/staff/staff-form";
import { api } from "@/lib/api-client";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

// Disable static generation - requires authentication
export const dynamic = "force-dynamic";

export default function NewStaffPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (data: any) => {
    setIsSubmitting(true);

    try {
      await api.post("/api/v1/staff", data);
      toast.success("員工新增成功！");
      router.push("/staff");
      router.refresh();
    } catch (error: any) {
      console.error("Error creating staff:", error);
      
      if (error.status === 409) {
        toast.error("此電話號碼已有員工使用");
      } else if (error.status === 400) {
        toast.error("請檢查表單是否有錯誤");
      } else {
        toast.error("新增員工失敗，請重試");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    router.back();
  };

  return (
    <div style={{ maxWidth: "42rem", display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      <div>
        <h1 style={{ fontSize: "1.875rem", lineHeight: "2.25rem", fontWeight: 700, letterSpacing: "-0.025em" }}>新增員工</h1>
        <p style={{ color: "var(--muted-foreground, #6b7280)" }}>
          為您的外燴服務建立新的員工資料
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>員工資料</CardTitle>
          <CardDescription>
            請輸入新員工的詳細資料。標示 * 的欄位為必填。
          </CardDescription>
        </CardHeader>
        <CardContent>
          <StaffForm
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            isSubmitting={isSubmitting}
          />
        </CardContent>
      </Card>
    </div>
  );
}
