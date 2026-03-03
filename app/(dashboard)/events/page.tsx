import { prisma } from "@/lib/db";
import { isAuthenticated, isManager } from "@/lib/auth";
import { redirect } from "next/navigation";
import { EventStatus } from "@prisma/client";
import { EventsPageClient, AccessDeniedClient } from "./events-page-client";

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
    return <AccessDeniedClient />;
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
    id: event.id,
    name: event.name,
    date: event.date.toISOString(),
    startTime: event.startTime,
    location: event.location || "",
    adultsCount: event.adultsCount,
    childrenCount: event.childrenCount,
    vegetarianCount: event.vegetarianCount,
    eventType: event.eventType,
    status: event.status,
    totalAmount: event.totalAmount ? Number(event.totalAmount) : null,
  }));

  return <EventsPageClient events={formattedEvents} currentStatus={statusFilter} />;
}
