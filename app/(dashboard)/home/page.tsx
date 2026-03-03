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
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <div style={{ color: '#6b7280' }}>載入中...</div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Welcome Banner */}
      <div style={{ 
        borderRadius: '1rem', 
        background: 'linear-gradient(to right, #8BA4BC, #6B8AAB)', 
        padding: '1.5rem', 
        color: 'white' 
      }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{greeting}！👋</h1>
        <p style={{ color: 'rgba(255,255,255,0.8)', marginTop: '0.25rem' }}>
          {dateStr}
          {stats && stats.pendingEvents > 0 && (
            <span style={{ marginLeft: '0.5rem' }}>
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
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(1, 1fr)', 
        gap: '1.5rem',
      }}>
        {/* Upcoming Events */}
        <Card style={{ 
          backgroundColor: 'white', 
          borderRadius: '1rem', 
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          border: 'none',
        }}>
          <CardHeader style={{ 
            display: 'flex', 
            flexDirection: 'row', 
            alignItems: 'center', 
            justifyContent: 'space-between', 
            paddingBottom: '0.5rem' 
          }}>
            <CardTitle style={{ fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Calendar style={{ width: '1rem', height: '1rem', color: '#5A7A9A' }} />
              即將到來的活動
            </CardTitle>
            <Link
              href="/events"
              style={{ fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.25rem', color: '#5A7A9A', textDecoration: 'none' }}
            >
              查看全部 <ArrowRight style={{ width: '0.75rem', height: '0.75rem' }} />
            </Link>
          </CardHeader>
          <CardContent style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {upcomingEvents.length === 0 ? (
              <p style={{ textAlign: 'center', color: '#6b7280', padding: '2rem 0' }}>
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
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      padding: '0.75rem',
                      borderRadius: '0.75rem',
                      backgroundColor: '#f9fafb',
                      textDecoration: 'none',
                      color: 'inherit',
                    }}
                  >
                    <div style={{ 
                      width: '2.75rem', 
                      height: '2.75rem', 
                      flexShrink: 0, 
                      borderRadius: '0.75rem', 
                      display: 'flex', 
                      flexDirection: 'column', 
                      alignItems: 'center', 
                      justifyContent: 'center', 
                      backgroundColor: '#D9E2EC' 
                    }}>
                      <span style={{ fontSize: '0.625rem', lineHeight: 1, color: '#5A7A9A' }}>{month}月</span>
                      <span style={{ fontSize: '1rem', fontWeight: 'bold', lineHeight: 1, color: '#486A8C' }}>{day}</span>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontWeight: 500, color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{event.name}</p>
                      <p style={{ fontSize: '0.875rem', color: '#6b7280', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{event.location}</p>
                    </div>
                    <div style={{ flexShrink: 0, textAlign: 'right', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <StatusBadge status={event.status} />
                      <span style={{ fontSize: '0.75rem', color: '#9ca3af', whiteSpace: 'nowrap' }}>
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
        <Card style={{ 
          backgroundColor: 'white', 
          borderRadius: '1rem', 
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          border: 'none',
        }}>
          <CardHeader style={{ 
            display: 'flex', 
            flexDirection: 'row', 
            alignItems: 'center', 
            justifyContent: 'space-between', 
            paddingBottom: '0.5rem' 
          }}>
            <CardTitle style={{ fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Clock style={{ width: '1rem', height: '1rem', color: '#5A7A9A' }} />
              最近動態
            </CardTitle>
          </CardHeader>
          <CardContent style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {recentActivity.length === 0 ? (
              <p style={{ textAlign: 'center', color: '#6b7280', padding: '2rem 0' }}>
                尚無最近動態
              </p>
            ) : (
              recentActivity.map((activity) => (
                <div
                  key={activity.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    padding: '0.75rem',
                    borderRadius: '0.75rem',
                    backgroundColor: '#f9fafb',
                  }}
                >
                  <div style={{ 
                    width: '2rem', 
                    height: '2rem', 
                    borderRadius: '0.5rem', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    flexShrink: 0,
                    backgroundColor: activity.type === "NOTIFICATION_SENT" ? '#fce7f3' : '#D9E2EC'
                  }}>
                    {activity.type === "NOTIFICATION_SENT" ? (
                      <Bell style={{ width: '1rem', height: '1rem', color: '#E8A5B8' }} />
                    ) : (
                      <Users style={{ width: '1rem', height: '1rem', color: '#486A8C' }} />
                    )}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontWeight: 500, color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {activity.title}
                    </p>
                    <p style={{ fontSize: '0.875rem', color: '#6b7280', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {activity.description}
                    </p>
                  </div>
                  <span style={{ fontSize: '0.75rem', color: '#9ca3af', whiteSpace: 'nowrap', flexShrink: 0 }}>
                    {formatRelativeTime(activity.createdAt)}
                  </span>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card style={{ 
        backgroundColor: 'white', 
        borderRadius: '1rem', 
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        border: 'none',
      }}>
        <CardHeader style={{ paddingBottom: '0.5rem' }}>
          <CardTitle style={{ fontSize: '1rem' }}>⚡ 快速操作</CardTitle>
        </CardHeader>
        <CardContent>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
            <Link href="/events/new" style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              padding: '1rem', 
              borderRadius: '0.75rem', 
              border: '1px solid #e5e7eb',
              textDecoration: 'none',
              color: 'inherit',
            }}>
              <div style={{ width: '3rem', height: '3rem', borderRadius: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '0.5rem', backgroundColor: '#D9E2EC' }}>
                <Plus style={{ width: '1.5rem', height: '1.5rem', color: '#486A8C' }} />
              </div>
              <span style={{ fontSize: '0.875rem', fontWeight: 500, color: '#374151' }}>新增活動</span>
            </Link>
            <Link href="/scheduling" style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              padding: '1rem', 
              borderRadius: '0.75rem', 
              border: '1px solid #e5e7eb',
              textDecoration: 'none',
              color: 'inherit',
            }}>
              <div style={{ width: '3rem', height: '3rem', borderRadius: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '0.5rem', backgroundColor: '#f3e8ff' }}>
                <CalendarCheck style={{ width: '1.5rem', height: '1.5rem', color: '#9333ea' }} />
              </div>
              <span style={{ fontSize: '0.875rem', fontWeight: 500, color: '#374151' }}>排班管理</span>
            </Link>
            <Link href="/notifications" style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              padding: '1rem', 
              borderRadius: '0.75rem', 
              border: '1px solid #e5e7eb',
              textDecoration: 'none',
              color: 'inherit',
            }}>
              <div style={{ width: '3rem', height: '3rem', borderRadius: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '0.5rem', backgroundColor: '#fce7f3' }}>
                <Bell style={{ width: '1.5rem', height: '1.5rem', color: '#E8A5B8' }} />
              </div>
              <span style={{ fontSize: '0.875rem', fontWeight: 500, color: '#374151' }}>發送通知</span>
            </Link>
            <Link href="/salary/report" style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              padding: '1rem', 
              borderRadius: '0.75rem', 
              border: '1px solid #e5e7eb',
              textDecoration: 'none',
              color: 'inherit',
            }}>
              <div style={{ width: '3rem', height: '3rem', borderRadius: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '0.5rem', backgroundColor: '#cffafe' }}>
                <FileText style={{ width: '1.5rem', height: '1.5rem', color: '#0891b2' }} />
              </div>
              <span style={{ fontSize: '0.875rem', fontWeight: 500, color: '#374151' }}>薪資報表</span>
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
