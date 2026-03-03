"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { StatusBadge } from "./status-badge";
import { formatPhone } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar, Car, MessageCircle } from "lucide-react";
import Link from "next/link";

interface StaffTableProps {
  staff: Array<{
    id: string;
    name: string;
    phone: string;
    skill?: "FRONT" | "HOT" | "BOTH";
    status: "ACTIVE" | "INACTIVE";
    canDrive?: boolean;
    hasLine?: boolean;
  }>;
  onRowClick?: (id: string) => void;
}

const skillLabels: Record<string, string> = {
  FRONT: "外場",
  HOT: "熱台",
  BOTH: "皆可",
};

export function StaffTable({ staff, onRowClick }: StaffTableProps) {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>姓名</TableHead>
            <TableHead>電話</TableHead>
            <TableHead>職能</TableHead>
            <TableHead>能力</TableHead>
            <TableHead>狀態</TableHead>
            <TableHead className="text-right">操作</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {staff.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center text-muted-foreground">
                尚無員工資料
              </TableCell>
            </TableRow>
          ) : (
            staff.map((member) => (
              <TableRow
                key={member.id}
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => onRowClick?.(member.id)}
              >
                <TableCell className="font-medium">{member.name}</TableCell>
                <TableCell>{formatPhone(member.phone)}</TableCell>
                <TableCell>{member.skill ? skillLabels[member.skill] : "-"}</TableCell>
                <TableCell>
                  <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                    {member.canDrive && (
                      <span style={{ display: "flex", alignItems: "center", gap: "2px", color: "#2563eb", fontSize: "12px" }}>
                        <Car style={{ width: "14px", height: "14px" }} />
                        可駕駛
                      </span>
                    )}
                    {member.hasLine && (
                      <span style={{ display: "flex", alignItems: "center", gap: "2px", color: "#22c55e", fontSize: "12px" }}>
                        <MessageCircle style={{ width: "14px", height: "14px" }} />
                        LINE
                      </span>
                    )}
                    {!member.canDrive && !member.hasLine && "-"}
                  </div>
                </TableCell>
                <TableCell>
                  <StatusBadge status={member.status} />
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    asChild
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Link href={`/staff/${member.id}/availability`}>
                      <Calendar className="w-4 h-4 mr-1" />
                      行事曆
                    </Link>
                  </Button>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
