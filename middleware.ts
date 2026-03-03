import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// Define public routes that don't require authentication
const isPublicRoute = createRouteMatcher([
  "/",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/api/webhooks(.*)",
  "/api/line/webhook",
  "/api/cron(.*)",
  "/api/health",
  "/staff/event/(.*)",           // 員工活動詳情頁（公開）
  "/api/staff/event/(.*)",       // 員工活動詳情 API（公開）
  "/staff/availability/(.*)",    // 員工行事曆填寫（Token 驗證）
  "/api/v1/staff/availability-edit/(.*)",  // 員工行事曆 API（Token 驗證）
  "/invite/(.*)",                // 員工邀請註冊頁面
  "/api/v1/invite",              // 邀請驗證 API（GET 是公開的）
]);

export default clerkMiddleware(async (auth, req) => {
  // Protect all routes except public ones
  if (!isPublicRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
