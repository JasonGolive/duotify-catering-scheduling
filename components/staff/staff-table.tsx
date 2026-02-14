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

interface StaffTableProps {
  staff: Array<{
    id: string;
    name: string;
    phone: string;
    perEventSalary: number | string;
    status: "ACTIVE" | "INACTIVE";
  }>;
  onRowClick?: (id: string) => void;
}

export function StaffTable({ staff, onRowClick }: StaffTableProps) {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Phone</TableHead>
            <TableHead>Per Event Salary</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {staff.length === 0 ? (
            <TableRow>
              <TableCell colSpan={4} className="text-center text-muted-foreground">
                No staff members found.
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
                <TableCell>{formatCurrency(member.perEventSalary)}</TableCell>
                <TableCell>
                  <StatusBadge status={member.status} />
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
