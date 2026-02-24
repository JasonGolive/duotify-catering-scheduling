import { prisma } from "@/lib/db";
import { isAuthenticated, isManager } from "@/lib/auth";
import { StaffListView } from "@/components/staff/staff-list-view";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function StaffPage() {
  // Check if user is authenticated
  const authenticated = await isAuthenticated();
  if (!authenticated) {
    redirect("/sign-in");
  }

  // Check if user is a manager
  const manager = await isManager();
  if (!manager) {
    // User is logged in but not a manager - show access denied
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-8">
        <h1 className="text-2xl font-bold text-red-600">存取被拒絕</h1>
        <p className="mt-4 text-gray-600">您沒有權限存取此頁面。需要管理員權限。</p>
        <Link href="/" className="mt-6 text-blue-600 hover:underline">
          返回首頁
        </Link>
      </div>
    );
  }

  // Fetch all staff from database
  const staffMembers = await prisma.staff.findMany({
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      phone: true,
      skill: true,
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
          <h1 className="text-3xl font-bold tracking-tight">員工目錄</h1>
          <p className="text-muted-foreground">
            管理您的外燴服務員工
          </p>
        </div>
        <Button asChild>
          <Link href="/staff/new">
            <Plus className="mr-2 h-4 w-4" />
            新增員工
          </Link>
        </Button>
      </div>

      <StaffListView staff={staff} />
    </div>
  );
}
