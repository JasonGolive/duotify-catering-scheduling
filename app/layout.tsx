import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { zhTW } from "@clerk/localizations";
import { Providers } from "./providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "北歐餐桌到府私廚",
  description: "Duotify 外燴服務員工管理系統",
};

// Disable static generation for all pages (Clerk requires runtime)
export const dynamic = "force-dynamic";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider localization={zhTW}>
      <html lang="zh-TW">
        <body>
          <Providers>{children}</Providers>
        </body>
      </html>
    </ClerkProvider>
  );
}
