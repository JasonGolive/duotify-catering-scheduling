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
import { formatPhone, formatCurrency } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "lucide-react";
import Link from "next/link";

interface StaffTableProps {
  staff: Array<{
    id: string;
    name: string;
    phone: string;
    skill?: "FRONT" | "HOT" | "BOTH";
    perEventSalary: number | string;
    status: "ACTIVE" | "INACTIVE";
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
            <TableHead>每場薪資</TableHead>
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
                <TableCell>{formatCurrency(member.perEventSalary)}</TableCell>
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
