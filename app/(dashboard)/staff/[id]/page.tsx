"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { StaffForm } from "@/components/staff/staff-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";

interface StaffData {
  id: string;
  name: string;
  phone: string;
  skill: "FRONT" | "HOT" | "DECK";
  perEventSalary: number;
  notes: string | null;
  status: "ACTIVE" | "INACTIVE";
}

export default function EditStaffPage() {
  const router = useRouter();
  const params = useParams();
  const staffId = params.id as string;

  const [staff, setStaff] = useState<StaffData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchStaff() {
      try {
        const response = await fetch(`/api/v1/staff/${staffId}`);
        if (!response.ok) {
          throw new Error("找不到員工資料");
        }
        const data = await response.json();
        setStaff({
          ...data.staff,
          perEventSalary: parseFloat(data.staff.perEventSalary),
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : "載入失敗");
      } finally {
        setIsLoading(false);
      }
    }

    fetchStaff();
  }, [staffId]);

  const handleSubmit = async (data: {
    name: string;
    phone: string;
    skill: "FRONT" | "HOT" | "DECK";
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
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !staff) {
    return (
      <div className="container max-w-2xl py-8">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-destructive mb-4">{error || "找不到員工資料"}</p>
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
    <div className="container max-w-2xl py-8">
      <div className="mb-6">
        <Button variant="ghost" asChild>
          <Link href="/staff">
            <ArrowLeft className="mr-2 h-4 w-4" />
            返回員工列表
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>編輯員工資料</CardTitle>
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
