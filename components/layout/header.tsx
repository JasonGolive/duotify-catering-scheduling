"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { UserButton } from "@clerk/nextjs";
import { Menu, X, Home, Users, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface HeaderProps {
  role?: "MANAGER" | "STAFF";
}

export function Header({ role }: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const router = useRouter();

  const handleNavigation = (href: string) => {
    setMobileMenuOpen(false);
    router.push(href);
  };

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b bg-white dark:bg-gray-950">
        <div className="container flex h-14 items-center">
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            <span className="sr-only">開關選單</span>
          </Button>
          
          <div className="mr-4 hidden md:flex">
            <Link href="/" className="mr-6 flex items-center space-x-2">
              <span className="hidden font-bold sm:inline-block">
                外燴人員管理系統
              </span>
            </Link>
          </div>

          <div className="flex-1 md:hidden">
            <span className="font-bold text-sm">外燴人員管理系統</span>
          </div>

          <div className="flex items-center justify-end space-x-2">
            <nav className="flex items-center">
              <UserButton afterSignOutUrl="/" />
            </nav>
          </div>
        </div>
      </header>

      {/* Mobile menu overlay */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 z-50 md:hidden"
          style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
          onClick={() => setMobileMenuOpen(false)}
        >
          <div 
            className="absolute top-0 left-0 bottom-0 w-72 bg-white dark:bg-gray-950 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <div className="flex items-center justify-between p-4 border-b">
              <span className="font-bold">選單</span>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setMobileMenuOpen(false)}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
            
            {/* Menu items */}
            <nav className="p-4 space-y-2">
              <button
                onClick={() => handleNavigation("/")}
                className="flex items-center w-full px-3 py-3 text-left rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <Home className="h-5 w-5 mr-3" />
                首頁
              </button>
              
              {role === "MANAGER" && (
                <>
                  <button
                    onClick={() => handleNavigation("/staff")}
                    className="flex items-center w-full px-3 py-3 text-left rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
                  >
                    <Users className="h-5 w-5 mr-3" />
                    員工目錄
                  </button>
                  <button
                    onClick={() => handleNavigation("/events")}
                    className="flex items-center w-full px-3 py-3 text-left rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
                  >
                    <Calendar className="h-5 w-5 mr-3" />
                    活動管理
                  </button>
                </>
              )}
            </nav>
          </div>
        </div>
      )}
    </>
  );
}
