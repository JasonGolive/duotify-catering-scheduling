"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin, Users, Clock } from "lucide-react";

const eventTypeLabels: Record<string, string> = {
  WEDDING: "婚宴",
  YEAREND: "尾牙",
  SPRING: "春酒",
  BIRTHDAY: "生日宴",
  CORPORATE: "企業活動",
  OTHER: "其他",
};

const eventStatusLabels: Record<string, string> = {
  PENDING: "待確認",
  CONFIRMED: "已確認",
  IN_PROGRESS: "進行中",
  COMPLETED: "已完成",
  CANCELLED: "已取消",
};

const statusColors: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-800",
  CONFIRMED: "bg-blue-100 text-blue-800",
  IN_PROGRESS: "bg-green-100 text-green-800",
  COMPLETED: "bg-gray-100 text-gray-800",
  CANCELLED: "bg-red-100 text-red-800",
};

interface EventCardProps {
  event: {
    id: string;
    name: string;
    date: string;
    startTime?: string | null;
    endTime?: string | null;
    location: string;
    expectedGuests?: number | null;
    eventType: string;
    status: string;
  };
  onClick?: () => void;
}

export function EventCard({ event, onClick }: EventCardProps) {
  const formattedDate = new Date(event.date).toLocaleDateString("zh-TW", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "short",
  });

  return (
    <Card
      className="cursor-pointer transition-all hover:shadow-md active:scale-[0.98]"
      onClick={onClick}
    >
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
        <div className="flex-1">
          <h3 className="font-semibold text-lg">{event.name}</h3>
          <Badge variant="outline" className="mt-1">
            {eventTypeLabels[event.eventType] || event.eventType}
          </Badge>
        </div>
        <Badge className={statusColors[event.status]}>
          {eventStatusLabels[event.status] || event.status}
        </Badge>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex items-center text-sm text-muted-foreground">
          <Calendar className="mr-2 h-4 w-4" />
          {formattedDate}
        </div>
        {(event.startTime || event.endTime) && (
          <div className="flex items-center text-sm text-muted-foreground">
            <Clock className="mr-2 h-4 w-4" />
            {event.startTime || "--:--"} ~ {event.endTime || "--:--"}
          </div>
        )}
        <div className="flex items-center text-sm text-muted-foreground">
          <MapPin className="mr-2 h-4 w-4" />
          {event.location}
        </div>
        {event.expectedGuests && (
          <div className="flex items-center text-sm text-muted-foreground">
            <Users className="mr-2 h-4 w-4" />
            預計 {event.expectedGuests} 人
          </div>
        )}
      </CardContent>
    </Card>
  );
}
