"use client";

import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import Link from "next/link";
import { StaffListView } from "@/components/staff/staff-list-view";
import { useEffect, useState } from "react";

interface StaffMember {
  id: string;
  name: string;
  phone: string;
  skill?: "FRONT" | "HOT" | "BOTH";
  status: "ACTIVE" | "INACTIVE";
  canDrive?: boolean;
  hasLine?: boolean;
}

interface StaffPageUIProps {
  staff: StaffMember[];
}

export function StaffPageUI({ staff }: StaffPageUIProps) {
  const [isSmScreen, setIsSmScreen] = useState(false);

  useEffect(() => {
    const checkScreenSize = () => {
      setIsSmScreen(window.innerWidth >= 640);
    };
    checkScreenSize();
    window.addEventListener("resize", checkScreenSize);
    return () => window.removeEventListener("resize", checkScreenSize);
  }, []);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      <div
        style={{
          display: "flex",
          flexDirection: isSmScreen ? "row" : "column",
          gap: "1rem",
          alignItems: isSmScreen ? "center" : "flex-start",
          justifyContent: isSmScreen ? "space-between" : "flex-start",
        }}
      >
        <div>
          <h1
            style={{
              fontSize: "1.875rem",
              lineHeight: "2.25rem",
              fontWeight: "bold",
              letterSpacing: "-0.025em",
            }}
          >
            員工目錄
          </h1>
          <p style={{ color: "#6b7280" }}>管理您的外燴服務員工</p>
        </div>
        <Button asChild>
          <Link href="/staff/new">
            <Plus style={{ marginRight: "0.5rem", height: "1rem", width: "1rem" }} />
            新增員工
          </Link>
        </Button>
      </div>

      <StaffListView staff={staff} />
    </div>
  );
}

interface AccessDeniedUIProps {
  // No props needed
}

export function AccessDeniedUI({}: AccessDeniedUIProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "2rem",
      }}
    >
      <h1
        style={{
          fontSize: "1.5rem",
          lineHeight: "2rem",
          fontWeight: "bold",
          color: "#dc2626",
        }}
      >
        存取被拒絕
      </h1>
      <p style={{ marginTop: "1rem", color: "#4b5563" }}>
        您沒有權限存取此頁面。需要管理員權限。
      </p>
      <Link
        href="/"
        style={{
          marginTop: "1.5rem",
          color: "#2563eb",
          textDecoration: isHovered ? "underline" : "none",
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        返回首頁
      </Link>
    </div>
  );
}
