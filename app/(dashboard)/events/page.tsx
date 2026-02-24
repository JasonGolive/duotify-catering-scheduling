import { prisma } from "@/lib/db";
import { isAuthenticated, isManager } from "@/lib/auth";
import { EventListView } from "@/components/events/event-list-view";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { EventStatus } from "@prisma/client";

export const dynamic = "force-dynamic";

interface EventsPageProps {
  searchParams: Promise<{ status?: string }>;
}

export default async function EventsPage({ searchParams }: EventsPageProps) {
  const authenticated = await isAuthenticated();
  if (!authenticated) {
    redirect("/sign-in");
  }

  const manager = await isManager();
  if (!manager) {
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

  const params = await searchParams;
  const statusFilter = params.status || "CONFIRMED"; // 預設顯示已確認

  // Build where clause
  const where = statusFilter === "ALL" ? {} : { status: statusFilter as EventStatus };

  const events = await prisma.event.findMany({
    where,
    orderBy: { date: "asc" }, // 日期由近至遠
    select: {
      id: true,
      name: true,
      date: true,
      startTime: true,
      location: true,
      adultsCount: true,
      childrenCount: true,
      vegetarianCount: true,
      eventType: true,
      status: true,
      totalAmount: true,
      depositAmount: true,
      balanceAmount: true,
    },
  });

  // Convert Date and Decimal to string for client components
  const formattedEvents = events.map((event) => ({
    ...event,
    date: event.date.toISOString(),
    totalAmount: event.totalAmount ? Number(event.totalAmount) : null,
    depositAmount: event.depositAmount ? Number(event.depositAmount) : null,
    balanceAmount: event.balanceAmount ? Number(event.balanceAmount) : null,
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">活動管理</h1>
          <p className="text-muted-foreground">
            管理您的外燴活動場次
          </p>
        </div>
        <Button asChild>
          <Link href="/events/new">
            <Plus className="mr-2 h-4 w-4" />
            新增活動
          </Link>
        </Button>
      </div>

      <EventListView events={formattedEvents} currentStatus={statusFilter} />
    </div>
  );
}
