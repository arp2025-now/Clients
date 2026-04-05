import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  // Public routes — always accessible
  const publicPaths = ["/login", "/forgot-password", "/onboarding", "/auth/callback", "/reset-password"];
  if (publicPaths.some((p) => pathname.startsWith(p))) {
    // If already logged in and trying to access /login — redirect to the right place
    if (pathname === "/login" && user) {
      const isAdmin = user.email === process.env.ADMIN_EMAIL;
      return NextResponse.redirect(
        new URL(isAdmin ? "/admin" : "/dashboard", request.url)
      );
    }
    return supabaseResponse;
  }

  // Not logged in — send to login
  if (!user) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // /admin routes — only for admin
  if (pathname.startsWith("/admin")) {
    if (user.email !== process.env.ADMIN_EMAIL) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  // /dashboard, /tickets, /documents, /payments — only for non-admin clients
  const clientPaths = ["/dashboard", "/tickets", "/documents", "/payments"];
  if (clientPaths.some((p) => pathname.startsWith(p))) {
    if (user.email === process.env.ADMIN_EMAIL) {
      return NextResponse.redirect(new URL("/admin", request.url));
    }
  }

  return supabaseResponse;
}

export const proxyConfig = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
