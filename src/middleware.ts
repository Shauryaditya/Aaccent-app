import { authMiddleware } from "@clerk/nextjs";
import { NextRequest, NextResponse } from "next/server";

const isPublicRequest = (req: NextRequest) => {
  const { pathname, searchParams } = req.nextUrl;
  const isGet = req.method === "GET";

  if (pathname === "/") return true;
  if (pathname.startsWith("/api/webhook")) return true;

  if (pathname === "/api/courses") {
    return isGet && searchParams.get("mine") !== "true";
  }

  if (pathname.startsWith("/api/courses/")) {
    return isGet && !pathname.includes("/purchased") && !pathname.includes("/progress") && !pathname.includes("/checkout");
  }

  if (pathname.startsWith("/api/categories")) return isGet;
  if (pathname.startsWith("/api/testseries") || pathname.startsWith("/api/resources")) return isGet;

  return false;
};

const shouldSkipClerk = (req: NextRequest) => {
  const { pathname, searchParams } = req.nextUrl;
  const isGet = req.method === "GET";

  if (pathname.startsWith("/api/webhook")) return true;

  if (pathname === "/api/courses") {
    return isGet && searchParams.get("mine") !== "true";
  }

  if (pathname.startsWith("/api/categories")) return isGet;
  if (pathname === "/api/testseries" || pathname.startsWith("/api/resources")) return isGet;

  return false;
};

export default authMiddleware({
  publicRoutes: isPublicRequest,
  beforeAuth(req) {
    if (shouldSkipClerk(req)) return false;
  },
  afterAuth(auth, req) {
    if (isPublicRequest(req)) return NextResponse.next();

    if (!auth.userId && auth.isApiRoute) {
      return new NextResponse(null, { status: 401 });
    }

    if (!auth.userId) {
      return NextResponse.redirect(new URL("/", req.url));
    }

    return NextResponse.next();
  },
});

export const config = {
  matcher: ["/((?!.*\\..*|_next).*)", "/(api|trpc)(.*)"],
};
