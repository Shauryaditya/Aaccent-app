import { authMiddleware } from "@clerk/nextjs";
import { NextRequest, NextResponse } from "next/server";

// UploadThing calls back into /api/uploadthing from its own servers to run
// onUploadComplete. That request carries no Clerk session, so Clerk would 401 it.
// It is authenticated instead by an HMAC signature that the UploadThing SDK verifies
// itself, so we let it past the auth middleware and leave verification to the route.
const isUploadThingCallback = (req: NextRequest) =>
  req.nextUrl.pathname.startsWith("/api/uploadthing") &&
  req.method === "POST" &&
  req.headers.has("uploadthing-hook") &&
  req.headers.has("x-uploadthing-signature");

const isPublicRequest = (req: NextRequest) => {
  const { pathname, searchParams } = req.nextUrl;
  const isGet = req.method === "GET";

  if (pathname === "/") return true;
  if (pathname.startsWith("/api/webhook")) return true;
  if (isUploadThingCallback(req)) return true;

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
  if (isUploadThingCallback(req)) return true;

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
