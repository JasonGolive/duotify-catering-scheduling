"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Calendar,
  Users,
  Clock,
  Bell,
  Plus,
  CalendarCheck,
  FileText,
  ArrowRight,
} from "lucide-react";

interface DashboardStats {
  monthlyEvents: number;
  monthlyEventsChange: number;
  activeStaff: number;
  pendingEvents: number;
  pendingNotifications: number;
}

interface UpcomingEvent {
  id: string;
  name: string;
  date: string;
  location: string;
  status: string;
  staffCount: number;
}

interface RecentActivity {
  id: string;
  type: string;
  title: string;
  description: string;
  createdAt: string;
}

const statusLabels: Record<string, string> = {
  PENDING: "待確認",
  CONFIRMED: "已確認",
  IN_PROGRESS: "進行中",
  COMPLETED: "已完成",
  CANCELLED: "已取消",
};

const statusColors: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-700",
  CONFIRMED: "bg-green-100 text-green-700",
  IN_PROGRESS: "bg-nordic-100 text-nordic-700",
  COMPLETED: "bg-gray-100 text-gray-700",
  CANCELLED: "bg-red-100 text-red-700",
};

export default function HomePage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [upcomingEvents, setUpcomingEvents] = useState<UpcomingEvent[]>([]);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await fetch("/api/v1/dashboard");
      if (response.ok) {
        const data = await response.json();
        setStats(data.stats);
        setUpcomingEvents(data.upcomingEvents);
        setRecentActivity(data.recentActivity);
      }
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const today = new Date();
  const greeting = today.getHours() < 12 ? "早安" : today.getHours() < 18 ? "午安" : "晚安";
  const dateStr = today.toLocaleDateString("zh-TW", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "long",
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-gray-500">載入中...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="rounded-2xl bg-gradient-to-r from-nordic-400 to-nordic-500 p-6 text-white">
        <h1 className="text-2xl font-bold">{greeting}！👋</h1>
        <p className="text-nordic-100 mt-1">
          {dateStr}
          {stats && stats.pendingEvents > 0 && (
            <span className="ml-2">
              ，有 {stats.pendingEvents} 場活動待處理
            </span>
          )}
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="本月場次"
          value={stats?.monthlyEvents ?? 0}
          change={stats?.monthlyEventsChange}
          icon={Calendar}
          iconBg="bg-nordic-100"
          iconColor="text-nordic-500"
        />
        <StatsCard
          title="在職員工"
          value={stats?.activeStaff ?? 0}
          icon={Users}
          iconBg="bg-green-100"
          iconColor="text-accent-green"
        />
        <StatsCard
          title="待確認"
          value={stats?.pendingEvents ?? 0}
          icon={Clock}
          iconBg="bg-yellow-100"
          iconColor="text-accent-yellow"
          highlight={!!stats && stats.pendingEvents > 0}
        />
        <StatsCard
          title="待通知"
          value={stats?.pendingNotifications ?? 0}
          icon={Bell}
          iconBg="bg-pink-100"
          iconColor="text-accent-pink"
          highlight={!!stats && stats.pendingNotifications > 0}
        />
      </div>

      {/* Main Content */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Upcoming Events */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Calendar className="w-4 h-4 text-nordic-500" />
              即將到來的活動
            </CardTitle>
            <Link
              href="/events"
              className="text-sm text-nordic-500 hover:text-nordic-600 flex items-center gap-1"
            >
              查看全部 <ArrowRight className="w-3 h-3" />
            </Link>
          </CardHeader>
          <CardContent className="space-y-3">
            {upcomingEvents.length === 0 ? (
              <p className="text-center text-gray-500 py-8">
                未來 7 天沒有排定的活動
              </p>
            ) : (
              upcomingEvents.map((event) => {
                const eventDate = new Date(event.date);
                const day = eventDate.getDate();
                const month = eventDate.getMonth() + 1;

                return (
                  <Link
                    key={event.id}
                    href={`/events/${event.id}`}
                    className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition"
                  >
                    <div className="w-11 h-11 shrink-0 rounded-xl bg-nordic-100 flex flex-col items-center justify-center">
                      <span className="text-[10px] leading-tight text-nordic-500">{month}月</span>
                      <span className="text-base font-bold leading-tight text-nordic-600">{day}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">{event.name}</p>
                      <p className="text-sm text-gray-500 truncate">{event.location}</p>
                    </div>
                    <div className="shrink-0 text-right flex items-center gap-2">
                      <Badge className={statusColors[event.status]}>
                        {statusLabels[event.status]}
                      </Badge>
                      <span className="text-xs text-gray-400 whitespace-nowrap">
                        {event.staffCount}人
                      </span>
                    </div>
                  </Link>
                );
              })
            )}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="w-4 h-4 text-nordic-500" />
              最近動態
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentActivity.length === 0 ? (
              <p className="text-center text-gray-500 py-8">
                尚無最近動態
              </p>
            ) : (
              recentActivity.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-center gap-3 p-3 rounded-xl bg-gray-50"
                >
                  <ActivityIcon type={activity.type} />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">
                      {activity.title}
                    </p>
                    <p className="text-sm text-gray-500 truncate">
                      {activity.description}
                    </p>
                  </div>
                  <span className="text-xs text-gray-400 whitespace-nowrap shrink-0">
                    {formatRelativeTime(activity.createdAt)}
                  </span>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">⚡ 快速操作</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <QuickAction
              href="/events/new"
              icon={Plus}
              label="新增活動"
              color="nordic"
            />
            <QuickAction
              href="/scheduling"
              icon={CalendarCheck}
              label="排班管理"
              color="purple"
            />
            <QuickAction
              href="/notifications"
              icon={Bell}
              label="發送通知"
              color="pink"
            />
            <QuickAction
              href="/salary/report"
              icon={FileText}
              label="薪資報表"
              color="cyan"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function StatsCard({
  title,
  value,
  change,
  icon: Icon,
  iconBg,
  iconColor,
  highlight,
}: {
  title: string;
  value: number;
  change?: number;
  icon: typeof Calendar;
  iconBg: string;
  iconColor: string;
  highlight?: boolean;
}) {
  return (
    <Card className={`overflow-hidden ${highlight ? "ring-2 ring-accent-yellow" : ""}`}>
      <CardContent className="p-5">
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="text-sm text-gray-500 whitespace-nowrap">{title}</p>
            <p className="text-3xl font-bold mt-1">{value}</p>
            {change !== undefined && (
              <p
                className={`text-xs mt-1 whitespace-nowrap ${
                  change >= 0 ? "text-green-600" : "text-red-600"
                }`}
              >
                {change >= 0 ? "↑" : "↓"} {Math.abs(change)} 較上月
              </p>
            )}
          </div>
          <div className={`w-10 h-10 shrink-0 rounded-xl ${iconBg} flex items-center justify-center`}>
            <Icon className={`w-5 h-5 ${iconColor}`} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function QuickAction({
  href,
  icon: Icon,
  label,
  color,
}: {
  href: string;
  icon: typeof Plus;
  label: string;
  color: string;
}) {
  const colorClasses: Record<string, { bg: string; text: string }> = {
    nordic: { bg: "bg-nordic-100", text: "text-nordic-600" },
    purple: { bg: "bg-purple-100", text: "text-purple-600" },
    pink: { bg: "bg-pink-100", text: "text-pink-600" },
    cyan: { bg: "bg-cyan-100", text: "text-cyan-600" },
  };

  const { bg, text } = colorClasses[color] || colorClasses.nordic;

  return (
    <Link
      href={href}
      className="flex flex-col items-center p-4 rounded-xl border hover:bg-gray-50 transition"
    >
      <div className={`w-12 h-12 rounded-xl ${bg} flex items-center justify-center mb-2`}>
        <Icon className={`w-6 h-6 ${text}`} />
      </div>
      <span className="text-sm font-medium text-gray-700">{label}</span>
    </Link>
  );
}

function ActivityIcon({ type }: { type: string }) {
  const iconMap: Record<string, { icon: typeof Calendar; bg: string; color: string }> = {
    EVENT_CREATED: { icon: Calendar, bg: "bg-nordic-100", color: "text-nordic-600" },
    STAFF_ASSIGNED: { icon: Users, bg: "bg-green-100", color: "text-green-600" },
    NOTIFICATION_SENT: { icon: Bell, bg: "bg-pink-100", color: "text-pink-600" },
    LINE_BOUND: { icon: Users, bg: "bg-green-100", color: "text-green-600" },
  };

  const config = iconMap[type] || iconMap.EVENT_CREATED;
  const Icon = config.icon;

  return (
    <div className={`w-8 h-8 rounded-lg ${config.bg} flex items-center justify-center flex-shrink-0`}>
      <Icon className={`w-4 h-4 ${config.color}`} />
    </div>
  );
}

function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "剛剛";
  if (diffMins < 60) return `${diffMins} 分鐘前`;
  if (diffHours < 24) return `${diffHours} 小時前`;
  if (diffDays < 7) return `${diffDays} 天前`;
  return date.toLocaleDateString("zh-TW");
}
