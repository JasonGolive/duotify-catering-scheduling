import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export default async function Home() {
  const { userId } = await auth();
  
  // If user is already logged in, redirect to staff page
  if (userId) {
    redirect("/staff");
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <h1 className="text-4xl font-bold">北歐餐桌到府私廚</h1>
      <p className="mt-4 text-lg text-gray-600">Duotify 員工管理平台</p>
      
      <div className="mt-8 flex gap-4">
        <Link
          href="/sign-in"
          className="rounded-md bg-blue-600 px-6 py-3 text-white font-medium hover:bg-blue-700 transition-colors"
        >
          登入
        </Link>
        <Link
          href="/sign-up"
          className="rounded-md border border-gray-300 px-6 py-3 font-medium hover:bg-gray-50 transition-colors"
        >
          註冊
        </Link>
      </div>
    </main>
  );
}
