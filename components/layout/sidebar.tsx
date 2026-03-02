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
import { useState } from "react";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
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
  return (
    <Link
      href={href}
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 px-4 py-3 rounded-xl transition-all",
        isActive
          ? "bg-white/20 text-white font-medium"
          : "text-white/70 hover:bg-white/10 hover:text-white"
      )}
    >
      <Icon className="w-5 h-5" />
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

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
        >
          <Menu className="h-6 w-6" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-64 p-0 border-none" style={{ backgroundColor: "#8BA4BC" }}>
        <SheetTitle className="sr-only">導航選單</SheetTitle>
        {/* Logo */}
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <img
            src="/logo.png"
            alt="北歐餐桌"
            className="h-10 w-auto rounded-lg"
          />
        </div>

        {/* Navigation */}
        <nav className="p-3 space-y-1">
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
      </SheetContent>
    </Sheet>
  );
}
