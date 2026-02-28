"use client";

import { StaffTable } from "./staff-table";
import { StaffCard } from "./staff-card";
import { useRouter } from "next/navigation";

interface StaffListViewProps {
  staff: Array<{
    id: string;
    name: string;
    phone: string;
    skill?: "FRONT" | "HOT" | "BOTH";
    perEventSalary: number | string;
    status: "ACTIVE" | "INACTIVE";
  }>;
}

export function StaffListView({ staff }: StaffListViewProps) {
  const router = useRouter();

  const handleStaffClick = (id: string) => {
    router.push(`/staff/${id}`);
  };

  return (
    <>
      {/* Desktop: Table view */}
      <div className="hidden md:block">
        <StaffTable staff={staff} onRowClick={handleStaffClick} />
      </div>

      {/* Mobile: Card view */}
      <div className="grid gap-4 md:hidden">
        {staff.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
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
