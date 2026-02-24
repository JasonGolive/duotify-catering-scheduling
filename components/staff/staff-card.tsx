"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { StatusBadge } from "./status-badge";
import { formatPhone, formatCurrency } from "@/lib/utils";
import { Phone, DollarSign, Briefcase } from "lucide-react";

const skillLabels: Record<string, string> = {
  FRONT: "外場",
  HOT: "熱台",
  DECK: "階可",
};

interface StaffCardProps {
  staff: {
    id: string;
    name: string;
    phone: string;
    skill?: "FRONT" | "HOT" | "DECK";
    perEventSalary: number | string;
    status: "ACTIVE" | "INACTIVE";
  };
  onClick?: () => void;
}

export function StaffCard({ staff, onClick }: StaffCardProps) {
  return (
    <Card
      className="cursor-pointer transition-all hover:shadow-md active:scale-[0.98]"
      onClick={onClick}
    >
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
        <div className="flex-1">
          <h3 className="font-semibold text-lg">{staff.name}</h3>
        </div>
        <StatusBadge status={staff.status} />
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex items-center text-sm text-muted-foreground">
          <Phone className="mr-2 h-4 w-4" />
          {formatPhone(staff.phone)}
        </div>
        {staff.skill && (
          <div className="flex items-center text-sm text-muted-foreground">
            <Briefcase className="mr-2 h-4 w-4" />
            {skillLabels[staff.skill] || staff.skill}
          </div>
        )}
        <div className="flex items-center text-sm font-medium">
          <DollarSign className="mr-2 h-4 w-4" />
          {formatCurrency(staff.perEventSalary)} / 場
        </div>
      </CardContent>
    </Card>
  );
}
