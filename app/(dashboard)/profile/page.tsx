import { prisma } from "@/lib/db";
import { requireAuth, getCurrentSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/staff/status-badge";
import { formatPhone, formatCurrency } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  try {
    // Require authentication
    await requireAuth();
  } catch {
    redirect("/sign-in");
  }

  // Get current user ID
  const { userId } = await getCurrentSession();

  if (!userId) {
    redirect("/sign-in");
  }

  // Fetch staff profile
  const staff = await prisma.staff.findUnique({
    where: { userId },
    select: {
      name: true,
      phone: true,
      perEventSalary: true,
      notes: true,
      status: true,
    },
  });

  if (!staff) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold tracking-tight">My Profile</h1>
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground">
              Your staff profile has not been set up yet. Please contact your manager.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">My Profile</h1>
        <p className="text-muted-foreground">View your staff information</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-2xl">{staff.name}</CardTitle>
            <StatusBadge status={staff.status} />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium text-muted-foreground">Phone</label>
            <p className="text-lg">{formatPhone(staff.phone)}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-muted-foreground">
              Per Event Salary
            </label>
            <p className="text-lg font-semibold">
              {formatCurrency(Number(staff.perEventSalary))}
            </p>
          </div>
          {staff.notes && (
            <div>
              <label className="text-sm font-medium text-muted-foreground">Notes</label>
              <p className="text-sm mt-1 whitespace-pre-wrap">{staff.notes}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
