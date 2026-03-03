"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(2, 1fr)', 
        gap: '1rem',
      }}>
        <Card style={{ 
          backgroundColor: 'white', 
          borderRadius: '1rem', 
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          border: 'none',
        }}>
          <CardContent style={{ padding: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem' }}>
              <div>
                <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>本月場次</p>
                <p style={{ fontSize: '1.875rem', fontWeight: 'bold', marginTop: '0.25rem' }}>{stats?.monthlyEvents ?? 0}</p>
                {stats?.monthlyEventsChange !== undefined && (
                  <p style={{ 
                    fontSize: '0.75rem', 
                    marginTop: '0.25rem', 
                    color: (stats?.monthlyEventsChange ?? 0) >= 0 ? '#16a34a' : '#dc2626' 
                  }}>
                    {(stats?.monthlyEventsChange ?? 0) >= 0 ? "↑" : "↓"} {Math.abs(stats?.monthlyEventsChange ?? 0)} 較上月
                  </p>
                )}
              </div>
              <div style={{ 
                width: '2.5rem', 
                height: '2.5rem', 
                flexShrink: 0, 
                borderRadius: '0.75rem', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                backgroundColor: '#D9E2EC' 
              }}>
                <Calendar style={{ width: '1.25rem', height: '1.25rem', color: '#5A7A9A' }} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card style={{ 
          backgroundColor: 'white', 
          borderRadius: '1rem', 
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          border: 'none',
        }}>
          <CardContent style={{ padding: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem' }}>
              <div>
                <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>在職員工</p>
                <p style={{ fontSize: '1.875rem', fontWeight: 'bold', marginTop: '0.25rem' }}>{stats?.activeStaff ?? 0}</p>
              </div>
              <div style={{ 
                width: '2.5rem', 
                height: '2.5rem', 
                flexShrink: 0, 
                borderRadius: '0.75rem', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                backgroundColor: '#dcfce7' 
              }}>
                <Users style={{ width: '1.25rem', height: '1.25rem', color: '#6BAB73' }} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card style={{ 
          backgroundColor: 'white', 
          borderRadius: '1rem', 
          boxShadow: !!stats && stats.pendingEvents > 0 ? '0 0 0 2px #F5C242' : '0 1px 3px rgba(0,0,0,0.1)',
          border: 'none',
        }}>
          <CardContent style={{ padding: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem' }}>
              <div>
                <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>待確認</p>
                <p style={{ fontSize: '1.875rem', fontWeight: 'bold', marginTop: '0.25rem' }}>{stats?.pendingEvents ?? 0}</p>
              </div>
              <div style={{ 
                width: '2.5rem', 
                height: '2.5rem', 
                flexShrink: 0, 
                borderRadius: '0.75rem', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                backgroundColor: '#fef9c3' 
              }}>
                <Clock style={{ width: '1.25rem', height: '1.25rem', color: '#F5C242' }} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card style={{ 
          backgroundColor: 'white', 
          borderRadius: '1rem', 
          boxShadow: !!stats && stats.pendingNotifications > 0 ? '0 0 0 2px #E8A5B8' : '0 1px 3px rgba(0,0,0,0.1)',
          border: 'none',
        }}>
          <CardContent style={{ padding: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem' }}>
              <div>
                <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>待通知</p>
                <p style={{ fontSize: '1.875rem', fontWeight: 'bold', marginTop: '0.25rem' }}>{stats?.pendingNotifications ?? 0}</p>
              </div>
              <div style={{ 
                width: '2.5rem', 
                height: '2.5rem', 
                flexShrink: 0, 
                borderRadius: '0.75rem', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                backgroundColor: '#fce7f3' 
              }}>
                <Bell style={{ width: '1.25rem', height: '1.25rem', color: '#E8A5B8' }} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Upcoming Events */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Calendar className="w-4 h-4" style={{ color: "#5A7A9A" }} />
              即將到來的活動
            </CardTitle>
            <Link
              href="/events"
              className="text-sm flex items-center gap-1" style={{ color: "#5A7A9A" }}
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
                    <div className="w-11 h-11 shrink-0 rounded-xl flex flex-col items-center justify-center" style={{ backgroundColor: "#D9E2EC" }}>
                      <span className="text-[10px] leading-tight" style={{ color: "#5A7A9A" }}>{month}月</span>
                      <span className="text-base font-bold leading-tight" style={{ color: "#486A8C" }}>{day}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">{event.name}</p>
                      <p className="text-sm text-gray-500 truncate">{event.location}</p>
                    </div>
                    <div className="shrink-0 text-right flex items-center gap-2">
                      <StatusBadge status={event.status} />
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
              <Clock className="w-4 h-4" style={{ color: "#5A7A9A" }} />
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
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={
                    activity.type === "NOTIFICATION_SENT" ? { backgroundColor: "#fce7f3" } : { backgroundColor: "#D9E2EC" }
                  }>
                    {activity.type === "NOTIFICATION_SENT" ? (
                      <Bell className="w-4 h-4" style={{ color: "#E8A5B8" }} />
                    ) : (
                      <Users className="w-4 h-4" style={{ color: "#486A8C" }} />
                    )}
                  </div>
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
            <Link href="/events/new" className="flex flex-col items-center p-4 rounded-xl border hover:bg-gray-50 transition">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-2" style={{ backgroundColor: "#D9E2EC" }}>
                <Plus className="w-6 h-6" style={{ color: "#486A8C" }} />
              </div>
              <span className="text-sm font-medium text-gray-700">新增活動</span>
            </Link>
            <Link href="/scheduling" className="flex flex-col items-center p-4 rounded-xl border hover:bg-gray-50 transition">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-2" style={{ backgroundColor: "#f3e8ff" }}>
                <CalendarCheck className="w-6 h-6" style={{ color: "#9333ea" }} />
              </div>
              <span className="text-sm font-medium text-gray-700">排班管理</span>
            </Link>
            <Link href="/notifications" className="flex flex-col items-center p-4 rounded-xl border hover:bg-gray-50 transition">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-2" style={{ backgroundColor: "#fce7f3" }}>
                <Bell className="w-6 h-6" style={{ color: "#E8A5B8" }} />
              </div>
              <span className="text-sm font-medium text-gray-700">發送通知</span>
            </Link>
            <Link href="/salary/report" className="flex flex-col items-center p-4 rounded-xl border hover:bg-gray-50 transition">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-2" style={{ backgroundColor: "#cffafe" }}>
                <FileText className="w-6 h-6" style={{ color: "#0891b2" }} />
              </div>
              <span className="text-sm font-medium text-gray-700">薪資報表</span>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { bg: string; color: string; label: string }> = {
    PENDING: { bg: "#fef9c3", color: "#a16207", label: "待確認" },
    CONFIRMED: { bg: "#dcfce7", color: "#15803d", label: "已確認" },
    IN_PROGRESS: { bg: "#D9E2EC", color: "#334E68", label: "進行中" },
    COMPLETED: { bg: "#f3f4f6", color: "#374151", label: "已完成" },
    CANCELLED: { bg: "#fee2e2", color: "#b91c1c", label: "已取消" },
  };
  const { bg, color, label } = config[status] || config.PENDING;
  return (
    <span className="inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold" style={{ backgroundColor: bg, color }}>
      {label}
    </span>
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
