import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isPublicRoute = createRouteMatcher([
  "/login(.*)",
  "/signup(.*)",
  "/unsubscribe(.*)",
  "/preferences(.*)",
  "/track(.*)",
  "/api/webhooks/clerk(.*)",
  "/api/webhooks/ses(.*)",
  "/api/cron/process-schedule(.*)",
  "/api/debug-campaigns(.*)",
  "/api/force-dispatch(.*)",
]);

const clerk = clerkMiddleware(async (auth, request) => {
  if (!isPublicRoute(request)) {
    await auth.protect();
  }
});

export const proxy = clerk;
export default clerk;

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.[\\w]+$|_next/image|favicon.ico).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
