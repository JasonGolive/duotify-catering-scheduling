"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Users, User, Calendar, CalendarDays, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";

interface NavProps {
  role: "MANAGER" | "STAFF";
  className?: string;
}

export function Nav({ role, className }: NavProps) {
  const pathname = usePathname();

  const managerLinks = [
    {
      href: "/staff",
      label: "員工目錄",
      icon: Users,
    },
    {
      href: "/events",
      label: "活動管理",
      icon: Calendar,
    },
    {
      href: "/scheduling",
      label: "排班管理",
      icon: CalendarDays,
    },
    {
      href: "/venues",
      label: "場地管理",
      icon: MapPin,
    },
  ];

  const staffLinks = [
    {
      href: "/profile",
      label: "我的資料",
      icon: User,
    },
  ];

  const links = role === "MANAGER" ? managerLinks : staffLinks;

  return (
    <nav className={cn("flex flex-col space-y-2", className)}>
      {links.map((link) => {
        const Icon = link.icon;
        const isActive = pathname === link.href || pathname.startsWith(link.href + "/");

        return (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              "flex items-center space-x-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              isActive
                ? "bg-secondary text-secondary-foreground"
                : "text-muted-foreground hover:bg-secondary hover:text-secondary-foreground"
            )}
          >
            <Icon className="h-4 w-4" />
            <span>{link.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
