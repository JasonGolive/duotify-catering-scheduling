import { prisma } from "@/lib/db";
import { requireManager } from "@/lib/auth";
import { StaffListView } from "@/components/staff/staff-list-view";
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Staff Directory</h1>
          <p className="text-muted-foreground">
            Manage your catering service staff members
          </p>
        </div>
      </div>

      <StaffListView staff={staff} />
    </div>
  );
}
