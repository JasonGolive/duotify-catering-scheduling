"use client";

import { useState, useEffect } from "react";
import { StaffTable } from "./staff-table";
import { StaffCard } from "./staff-card";
import { useRouter } from "next/navigation";

interface StaffListViewProps {
  staff: Array<{
    id: string;
    name: string;
    phone: string;
    skill?: "FRONT" | "HOT" | "BOTH";
    status: "ACTIVE" | "INACTIVE";
    canDrive?: boolean;
    hasLine?: boolean;
  }>;
}

export function StaffListView({ staff }: StaffListViewProps) {
  const router = useRouter();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const updateIsMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    updateIsMobile();
    window.addEventListener("resize", updateIsMobile);
    return () => window.removeEventListener("resize", updateIsMobile);
  }, []);

  const handleStaffClick = (id: string) => {
    router.push(`/staff/${id}`);
  };

  return (
    <>
      {/* Desktop: Table view */}
      <div style={{ display: isMobile ? "none" : "block" }}>
        <StaffTable staff={staff} onRowClick={handleStaffClick} />
      </div>

      {/* Mobile: Card view */}
      <div style={{ display: isMobile ? "grid" : "none", gap: "1rem" }}>
        {staff.length === 0 ? (
          <p style={{ textAlign: "center", color: "#6b7280", paddingTop: "2rem", paddingBottom: "2rem" }}>
            尚無員工資料
          </p>
        ) : (
          staff.map((member) => (
            <StaffCard
              key={member.id}
              staff={member}
              onClick={() => handleStaffClick(member.id)}
            />
          ))
        )}
      </div>
    </>
  );
}
