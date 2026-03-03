"use client";

import { useEffect, useState } from "react";
import { EventListView } from "@/components/events/event-list-view";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import Link from "next/link";

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

interface EventsPageClientProps {
  events: Event[];
  currentStatus: string;
}

export function EventsPageClient({ events, currentStatus }: EventsPageClientProps) {
  const [isSmallScreen, setIsSmallScreen] = useState(true);

  useEffect(() => {
    const checkScreenSize = () => {
      setIsSmallScreen(window.innerWidth < 640);
    };
    
    checkScreenSize();
    window.addEventListener("resize", checkScreenSize);
    return () => window.removeEventListener("resize", checkScreenSize);
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{
        display: 'flex',
        flexDirection: isSmallScreen ? 'column' : 'row',
        gap: '1rem',
        alignItems: isSmallScreen ? 'stretch' : 'center',
        justifyContent: isSmallScreen ? 'flex-start' : 'space-between'
      }}>
        <div>
          <h1 style={{ fontSize: '1.875rem', fontWeight: 'bold', letterSpacing: '-0.025em' }}>活動管理</h1>
          <p style={{ color: '#6b7280' }}>
            管理您的外燴活動場次
          </p>
        </div>
        <Button asChild>
          <Link href="/events/new" style={{ display: 'flex', alignItems: 'center' }}>
            <Plus style={{ marginRight: '0.5rem', height: '1rem', width: '1rem' }} />
            新增活動
          </Link>
        </Button>
      </div>

      <EventListView events={events} currentStatus={currentStatus} />
    </div>
  );
}

export function AccessDeniedClient() {
  return (
    <div style={{
      display: 'flex',
      minHeight: '100vh',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem'
    }}>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#dc2626' }}>存取被拒絕</h1>
      <p style={{ marginTop: '1rem', color: '#4b5563' }}>您沒有權限存取此頁面。需要管理員權限。</p>
      <Link href="/" style={{ marginTop: '1.5rem', color: '#2563eb', textDecoration: 'none' }}>
        返回首頁
      </Link>
    </div>
  );
}
