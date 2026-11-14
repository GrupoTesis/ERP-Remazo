import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseConfig } from "@/lib/supabase/env";

export async function middleware(request: NextRequest) {
  const { url, anonKey } = getSupabaseConfig();
  let response = NextResponse.next({ request });
  let cookiesToSet: Array<{
    name: string;
    value: string;
    options: CookieOptions;
  }> = [];

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(
        cookies: Array<{
          name: string;
          value: string;
          options: CookieOptions;
        }>,
      ) {
        cookiesToSet = cookies;
        cookies.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookies.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
      },
    },
  });

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return redirectWithCookies(request, "/login", cookiesToSet);
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("active, reauth_required")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError) {
    return redirectWithCookies(request, "/acceso-denegado?error=verificacion", cookiesToSet);
  }

  if (!profile || !profile.active) {
    const { error: signOutError } = await supabase.auth.signOut();
    if (signOutError) {
      return redirectWithCookies(
        request,
        "/acceso-denegado?error=verificacion",
        cookiesToSet,
      );
    }
    return redirectWithCookies(request, "/login?error=inactive", cookiesToSet);
  }

  if (profile.reauth_required) {
    const { error: signOutError } = await supabase.auth.signOut();
    if (signOutError) {
      return redirectWithCookies(
        request,
        "/acceso-denegado?error=verificacion",
        cookiesToSet,
      );
    }
    return redirectWithCookies(request, "/login?error=reauth", cookiesToSet);
  }

  return response;
}

function redirectWithCookies(
  request: NextRequest,
  path: string,
  cookiesToSet: Array<{
    name: string;
    value: string;
    options: CookieOptions;
  }>,
) {
  const response = NextResponse.redirect(new URL(path, request.url));
  cookiesToSet.forEach(({ name, value, options }) =>
    response.cookies.set(name, value, options),
  );
  return response;
}

export const config = {
  matcher: ["/admin/:path*", "/recepcion/:path*", "/limpieza/:path*", "/caja/:path*", "/inventario/:path*"],
};
