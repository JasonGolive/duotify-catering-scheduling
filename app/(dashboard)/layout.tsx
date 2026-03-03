"use client";

import { Sidebar, MobileNav } from "@/components/layout/sidebar";
import { UserButton } from "@clerk/nextjs";
import { Bell } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isMobile, setIsMobile] = useState(true);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb' }}>
      {/* Sidebar - Desktop */}
      <Sidebar />

      {/* Main Content */}
      <div style={{ marginLeft: isMobile ? '0' : '16rem' }}>
        {/* Top Header */}
        <header style={{ 
          position: 'sticky', 
          top: 0, 
          zIndex: 40, 
          display: 'flex', 
          height: '4rem', 
          alignItems: 'center', 
          justifyContent: 'space-between', 
          borderBottom: '1px solid #e5e7eb', 
          backgroundColor: 'white', 
          padding: '0 1rem' 
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <MobileNav />
            <h1 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#334E68', display: isMobile ? 'none' : 'block' }}>
              北歐餐桌到府私廚
            </h1>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <Link
              href="/notifications"
              style={{ position: 'relative', padding: '0.5rem', borderRadius: '9999px' }}
            >
              <Bell style={{ height: '1.25rem', width: '1.25rem', color: '#4b5563' }} />
            </Link>
            <UserButton afterSignOutUrl="/sign-in" />
          </div>
        </header>

        {/* Page Content */}
        <main style={{ padding: '1rem' }}>
          {children}
        </main>
      </div>
    </div>
  );
}
