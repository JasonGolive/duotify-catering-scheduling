"use client";

import { EventCard } from "./event-card";
import { useRouter } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Event {
  id: string;
  name: string;
  date: string;
  startTime?: string | null;
  location: string;
  adultsCount?: number | null;
  childrenCount?: number | null;
  vegetarianCount?: number | null;
  eventType: string;
  status: string;
  totalAmount?: number | null;
}

interface EventListViewProps {
  events: Event[];
  currentStatus?: string;
}

const statusOptions = [
  { value: "ALL", label: "全部" },
  { value: "PENDING", label: "待確認" },
  { value: "CONFIRMED", label: "已確認" },
  { value: "IN_PROGRESS", label: "進行中" },
  { value: "COMPLETED", label: "已完成" },
  { value: "CANCELLED", label: "已取消" },
];

export function EventListView({ events, currentStatus = "CONFIRMED" }: EventListViewProps) {
  const router = useRouter();

  const handleEventClick = (id: string) => {
    router.push(`/events/${id}`);
  };

  const handleStatusChange = (status: string) => {
    router.push(`/events?status=${status}`);
  };

  return (
    <div className="space-y-4">
      {/* 篩選器 */}
      <div className="flex items-center gap-4">
        <label className="text-sm font-medium">狀態篩選：</label>
        <Select value={currentStatus} onValueChange={handleStatusChange}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="選擇狀態" />
          </SelectTrigger>
          <SelectContent>
            {statusOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className="text-sm text-muted-foreground">
          共 {events.length} 筆
        </span>
      </div>

      {/* 活動列表 */}
      {events.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">尚無活動資料</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {events.map((event) => (
            <EventCard
              key={event.id}
              event={event}
              onClick={() => handleEventClick(event.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
