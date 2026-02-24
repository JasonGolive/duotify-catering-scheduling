"use client";

import { useState } from "react";
import { UserButton } from "@clerk/nextjs";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Nav } from "./nav";
import Link from "next/link";

interface HeaderProps {
  role?: "MANAGER" | "STAFF";
}

export function Header({ role }: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
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
            <Link href="/" className="font-bold text-sm">
              外燴人員管理系統
            </Link>
          </div>

          <div className="flex items-center justify-end space-x-2">
            <nav className="flex items-center">
              <UserButton afterSignOutUrl="/" />
            </nav>
          </div>
        </div>
      </header>

      {/* Mobile menu overlay */}
      {mobileMenuOpen && role && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div 
            className="fixed inset-0 bg-black/50" 
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="fixed top-0 left-0 bottom-0 w-64 bg-white dark:bg-gray-900 shadow-xl p-4 pt-16 overflow-y-auto">
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-3 left-3"
              onClick={() => setMobileMenuOpen(false)}
            >
              <X className="h-5 w-5" />
            </Button>
            <Nav role={role} className="mt-2" />
            <div className="mt-6 pt-6 border-t">
              <Link 
                href="/" 
                className="block px-3 py-2 text-sm text-muted-foreground hover:text-foreground"
                onClick={() => setMobileMenuOpen(false)}
              >
                返回首頁
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
