"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Calendar,
  Users,
  CalendarCheck,
  Wallet,
  Bell,
  Menu,
  X,
  ClipboardList,
  FileText,
  BarChart3,
  CalendarDays,
  UtensilsCrossed,
} from "lucide-react";
import { useState, useEffect } from "react";

// Manager-only navigation items (full access)
const managerNavItems = [
  { href: "/home", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/events", icon: Calendar, label: "場次管理" },
  { href: "/scheduling", icon: CalendarCheck, label: "排班管理" },
  { href: "/menu", icon: UtensilsCrossed, label: "菜單管理" },
  { href: "/notifications", icon: Bell, label: "通知管理" },
  { href: "/availability-management", icon: CalendarDays, label: "行事曆管理" },
  { href: "/staff", icon: Users, label: "員工管理" },
  { href: "/salary", icon: Wallet, label: "薪資管理" },
  { href: "/leave-requests", icon: FileText, label: "請假管理" },
  { href: "/analytics", icon: BarChart3, label: "數據分析" },
];

// Admin navigation items (no salary access)
const adminNavItems = [
  { href: "/home", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/events", icon: Calendar, label: "場次管理" },
  { href: "/scheduling", icon: CalendarCheck, label: "排班管理" },
  { href: "/menu", icon: UtensilsCrossed, label: "菜單管理" },
  { href: "/notifications", icon: Bell, label: "通知管理" },
  { href: "/availability-management", icon: CalendarDays, label: "行事曆管理" },
  { href: "/staff", icon: Users, label: "員工管理" },
  { href: "/leave-requests", icon: FileText, label: "請假管理" },
  { href: "/analytics", icon: BarChart3, label: "數據分析" },
];

// Staff-only navigation items
const staffNavItems = [
  { href: "/my-schedule", icon: ClipboardList, label: "我的排班" },
];

function NavItem({
  href,
  icon: Icon,
  label,
  isActive,
  onClick,
}: {
  href: string;
  icon: typeof LayoutDashboard;
  label: string;
  isActive: boolean;
  onClick?: () => void;
}) {
  const handleClick = (e: React.MouseEvent) => {
    // 無論是否在當前頁面，都執行 onClick（關閉側邊欄）
    if (onClick) {
      onClick();
    }
  };

  return (
    <Link
      href={href}
      onClick={handleClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        padding: '0.75rem 1rem',
        borderRadius: '0.75rem',
        transition: 'all 0.2s',
        backgroundColor: isActive ? 'rgba(255, 255, 255, 0.2)' : 'transparent',
        color: isActive ? 'white' : 'rgba(255, 255, 255, 0.7)',
        fontWeight: isActive ? 500 : 400,
        textDecoration: 'none',
        cursor: 'pointer',
      }}
    >
      <Icon style={{ width: '1.25rem', height: '1.25rem' }} />
      <span>{label}</span>
    </Link>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const { user } = useUser();
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const checkDesktop = () => {
      setIsDesktop(window.innerWidth >= 768);
    };
    checkDesktop();
    window.addEventListener('resize', checkDesktop);
    return () => window.removeEventListener('resize', checkDesktop);
  }, []);

  // 手機版不顯示固定側邊欄
  if (!isDesktop) {
    return null;
  }

  // Determine nav items based on user role
  const userRole = user?.publicMetadata?.role as string | undefined;
  const navItems = userRole === "STAFF" 
    ? staffNavItems 
    : userRole === "ADMIN" 
      ? adminNavItems 
      : managerNavItems;

  return (
    <aside style={{
      position: 'fixed',
      top: 0,
      left: 0,
      bottom: 0,
      width: '16rem',
      display: 'flex',
      flexDirection: 'column',
      backgroundColor: '#8BA4BC',
    }}>
      {/* Logo */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        padding: '1rem',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
      }}>
        <img
          src="/logo.png"
          alt="北歐餐桌"
          style={{ height: '2.5rem', width: 'auto', borderRadius: '0.5rem' }}
        />
      </div>

      {/* Navigation */}
      <nav style={{
        flex: 1,
        padding: '0.75rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.25rem',
        overflowY: 'auto',
      }}>
        {navItems.map((item) => (
          <NavItem
            key={item.href}
            href={item.href}
            icon={item.icon}
            label={item.label}
            isActive={
              item.href === "/home"
                ? pathname === "/home" || pathname === "/"
                : pathname.startsWith(item.href)
            }
          />
        ))}
      </nav>

      {/* Footer */}
      <div style={{
        padding: '1rem',
        borderTop: '1px solid rgba(255, 255, 255, 0.1)',
      }}>
        <p style={{
          fontSize: '0.75rem',
          color: 'rgba(255, 255, 255, 0.5)',
          textAlign: 'center',
        }}>
          © 2026 北歐餐桌到府私廚
        </p>
      </div>
    </aside>
  );
}

export function MobileNav() {
  const pathname = usePathname();
  const { user } = useUser();
  const [open, setOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(true);

  // 檢測螢幕大小
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // 防止背景滾動
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  // 桌面版不顯示漢堡選單
  if (!isMobile) {
    return null;
  }

  // Determine nav items based on user role
  const userRole = user?.publicMetadata?.role as string | undefined;
  const navItems = userRole === "STAFF" 
    ? staffNavItems 
    : userRole === "ADMIN" 
      ? adminNavItems 
      : managerNavItems;

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        style={{
          padding: '0.5rem',
          background: 'transparent',
          border: '1px solid #e5e7eb',
          borderRadius: '0.375rem',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Menu style={{ width: '1.5rem', height: '1.5rem' }} />
      </button>

      {/* Overlay */}
      {open && (
        <div
          onClick={() => setOpen(false)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            zIndex: 9998,
          }}
        />
      )}

      {/* Sidebar */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          bottom: 0,
          width: '256px',
          backgroundColor: '#8BA4BC',
          zIndex: 9999,
          transform: open ? 'translateX(0)' : 'translateX(-100%)',
          transition: 'transform 0.3s ease-in-out',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Close button */}
        <button
          onClick={() => setOpen(false)}
          style={{
            position: 'absolute',
            top: '1rem',
            right: '1rem',
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            padding: '0.5rem',
            color: 'white',
          }}
        >
          <X style={{ width: '1.5rem', height: '1.5rem' }} />
        </button>

        {/* Logo */}
        <div style={{ 
          padding: '1rem', 
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          display: 'flex',
          alignItems: 'center',
        }}>
          <img
            src="/logo.png"
            alt="北歐餐桌"
            style={{ height: '2.5rem', width: 'auto', borderRadius: '0.5rem' }}
          />
        </div>

        {/* Navigation */}
        <nav style={{ padding: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          {navItems.map((item) => (
            <NavItem
              key={item.href}
              href={item.href}
              icon={item.icon}
              label={item.label}
              isActive={
                item.href === "/home"
                  ? pathname === "/home" || pathname === "/"
                  : pathname.startsWith(item.href)
              }
              onClick={() => setOpen(false)}
            />
          ))}
        </nav>
      </div>
    </>
  );
}
