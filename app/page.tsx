import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export default async function Home() {
  const { userId } = await auth();
  
  // If user is already logged in, redirect to dashboard
  if (userId) {
    redirect("/home");
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24 bg-gradient-to-br from-nordic-400 to-nordic-500">
      <div className="text-center">
        <img src="/logo.png" alt="北歐餐桌" className="h-24 mx-auto mb-6" />
        <h1 className="text-4xl font-bold text-white">北歐餐桌到府私廚</h1>
        <p className="mt-4 text-lg text-nordic-100">員工排班管理系統</p>
        
        <div className="mt-8 flex gap-4 justify-center">
          <Link
            href="/sign-in"
            className="rounded-xl bg-accent-yellow px-8 py-3 text-nordic-800 font-medium hover:bg-yellow-400 transition-colors"
          >
            登入
          </Link>
          <Link
            href="/sign-up"
            className="rounded-xl border-2 border-white/30 px-8 py-3 text-white font-medium hover:bg-white/10 transition-colors"
          >
            註冊
          </Link>
        </div>
      </div>
    </main>
  );
}
