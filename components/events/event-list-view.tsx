"use client";

import { EventCard } from "./event-card";
import { useRouter } from "next/navigation";

interface Event {
  id: string;
  name: string;
  date: string;
  startTime?: string | null;
  endTime?: string | null;
  location: string;
  expectedGuests?: number | null;
  eventType: string;
  status: string;
}

interface EventListViewProps {
  events: Event[];
}

export function EventListView({ events }: EventListViewProps) {
  const router = useRouter();

  const handleEventClick = (id: string) => {
    router.push(`/events/${id}`);
  };

  if (events.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">尚無活動資料</p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {events.map((event) => (
        <EventCard
          key={event.id}
          event={event}
          onClick={() => handleEventClick(event.id)}
        />
      ))}
    </div>
  );
}
