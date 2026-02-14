import { prisma } from "@/lib/db";
import { requireManager } from "@/lib/auth";
import { StaffListView } from "@/components/staff/staff-list-view";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function StaffPage() {
  try {
    // Require manager role
    await requireManager();
  } catch {
    redirect("/sign-in");
  }

  // Fetch all staff from database
  const staffMembers = await prisma.staff.findMany({
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      phone: true,
      perEventSalary: true,
      status: true,
    },
  });

  // Convert Decimal to number for client components
  const staff = staffMembers.map((member) => ({
    ...member,
    perEventSalary: Number(member.perEventSalary),
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Staff Directory</h1>
          <p className="text-muted-foreground">
            Manage your catering service staff members
          </p>
        </div>
        <Button asChild>
          <Link href="/staff/new">
            <Plus className="mr-2 h-4 w-4" />
            Add New Staff
          </Link>
        </Button>
      </div>

      <StaffListView staff={staff} />
    </div>
  );
}
