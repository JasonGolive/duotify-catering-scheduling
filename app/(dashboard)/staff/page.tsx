import { prisma } from "@/lib/db";
import { isAuthenticated, isManager } from "@/lib/auth";
import { redirect } from "next/navigation";
import { StaffPageUI, AccessDeniedUI } from "@/components/staff/staff-page-ui";

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
    return <AccessDeniedUI />;
  }

  // Fetch all staff from database
  const staffMembers = await prisma.staff.findMany({
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      phone: true,
      skill: true,
      status: true,
      canDrive: true,
      lineUserId: true,
    },
  });

  // Convert for client components (remove sensitive salary data)
  const staff = staffMembers.map((member) => ({
    ...member,
    hasLine: !!member.lineUserId,
  }));

  return <StaffPageUI staff={staff} />;
}
