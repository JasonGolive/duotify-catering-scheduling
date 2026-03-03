"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "./status-badge";
import { formatPhone } from "@/lib/utils";
import { Phone, Briefcase, Calendar, Car, MessageCircle } from "lucide-react";
import Link from "next/link";

const skillLabels: Record<string, string> = {
  FRONT: "外場",
  HOT: "熱台",
  BOTH: "皆可",
};

interface StaffCardProps {
  staff: {
    id: string;
    name: string;
    phone: string;
    skill?: "FRONT" | "HOT" | "BOTH";
    status: "ACTIVE" | "INACTIVE";
    canDrive?: boolean;
    hasLine?: boolean;
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
        <div className="flex items-center gap-3 text-sm">
          {staff.canDrive && (
            <span style={{ display: "flex", alignItems: "center", gap: "4px", color: "#2563eb" }}>
              <Car style={{ width: "14px", height: "14px" }} />
              可駕駛
            </span>
          )}
          {staff.hasLine && (
            <span style={{ display: "flex", alignItems: "center", gap: "4px", color: "#22c55e" }}>
              <MessageCircle style={{ width: "14px", height: "14px" }} />
              LINE 已綁定
            </span>
          )}
        </div>
        <div className="pt-2">
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            asChild
            onClick={(e) => e.stopPropagation()}
          >
            <Link href={`/staff/${staff.id}/availability`}>
              <Calendar className="w-4 h-4 mr-2" />
              出勤行事曆
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
