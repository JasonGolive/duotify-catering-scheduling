"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Calendar,
  Users,
  CalendarCheck,
  MapPin,
  Wallet,
  Bell,
  Menu,
  X,
} from "lucide-react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";

const navItems = [
  { href: "/home", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/events", icon: Calendar, label: "活動管理" },
  { href: "/staff", icon: Users, label: "員工管理" },
  { href: "/scheduling", icon: CalendarCheck, label: "排班管理" },
  { href: "/venues", icon: MapPin, label: "場地管理" },
  { href: "/salary", icon: Wallet, label: "薪資管理" },
  { href: "/notifications", icon: Bell, label: "通知管理" },
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

  return (
    <aside className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0" style={{ backgroundColor: "#8BA4BC" }}>
      {/* Logo */}
      <div className="flex items-center gap-3 p-4 border-b border-white/10">
        <img
          src="/logo.png"
          alt="北歐餐桌"
          className="h-10 w-auto rounded-lg"
        />
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
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
      <div className="p-4 border-t border-white/10">
        <p className="text-xs text-white/50 text-center">
          © 2026 北歐餐桌到府私廚
        </p>
      </div>
    </aside>
  );
}

export function MobileNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

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

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="md:hidden"
        onClick={() => setOpen(true)}
      >
        <Menu className="h-6 w-6" />
      </Button>

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
