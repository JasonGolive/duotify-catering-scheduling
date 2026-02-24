"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin, Users, Clock, Wallet } from "lucide-react";

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
    location: string;
    adultsCount?: number | null;
    childrenCount?: number | null;
    vegetarianCount?: number | null;
    eventType: string;
    status: string;
    totalAmount?: number | null;
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

  // 計算總人數
  const totalGuests = (event.adultsCount || 0) + (event.childrenCount || 0);

  // 格式化金額
  const formatAmount = (amount: number | null | undefined) => {
    if (!amount) return null;
    return `TWD ${amount.toLocaleString()}`;
  };

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
        {event.startTime && (
          <div className="flex items-center text-sm text-muted-foreground">
            <Clock className="mr-2 h-4 w-4" />
            {event.startTime}
          </div>
        )}
        <div className="flex items-center text-sm text-muted-foreground">
          <MapPin className="mr-2 h-4 w-4" />
          {event.location}
        </div>
        {totalGuests > 0 && (
          <div className="flex items-center text-sm text-muted-foreground">
            <Users className="mr-2 h-4 w-4" />
            {event.adultsCount || 0} 大人
            {event.childrenCount ? ` / ${event.childrenCount} 小孩` : ""}
            {event.vegetarianCount ? ` (素${event.vegetarianCount})` : ""}
          </div>
        )}
        {event.totalAmount && (
          <div className="flex items-center text-sm font-medium text-green-700">
            <Wallet className="mr-2 h-4 w-4" />
            {formatAmount(event.totalAmount)}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
