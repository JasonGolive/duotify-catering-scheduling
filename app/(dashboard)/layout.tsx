import { Sidebar, MobileNav } from "@/components/layout/sidebar";
import { getCurrentUserRole } from "@/lib/auth";
import { redirect } from "next/navigation";
import { UserButton } from "@clerk/nextjs";
import { Bell } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const role = await getCurrentUserRole();

  if (!role) {
    redirect("/sign-in");
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar - Desktop */}
      <Sidebar />

      {/* Main Content */}
      <div className="md:pl-64">
        {/* Top Header */}
        <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b bg-white px-4 md:px-6">
          <div className="flex items-center gap-4">
            <MobileNav />
            <h1 className="text-lg font-semibold text-nordic-700 hidden sm:block">
              北歐餐桌到府私廚
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/notifications"
              className="relative p-2 rounded-full hover:bg-gray-100 transition"
            >
              <Bell className="h-5 w-5 text-gray-600" />
            </Link>
            <UserButton afterSignOutUrl="/sign-in" />
          </div>
        </header>

        {/* Page Content */}
        <main className="p-4 md:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
