"use client";

import { useActionState } from "react";
import Link from "next/link";
import { loginAction } from "./actions";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";

type LoginState = { error: string } | null;

// Built at compile time — hardcoded to avoid any runtime issues
const GOOGLE_OAUTH_URL =
  `${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/authorize` +
  `?provider=google` +
  `&redirect_to=${encodeURIComponent("https://clients-green-seven.vercel.app/auth/callback")}`;

export default function LoginPage() {
  const [state, formAction, isPending] = useActionState<LoginState, FormData>(
    loginAction,
    null
  );

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm mx-auto">
        <div className="text-center mb-8">
          <div className="inline-flex flex-col items-center gap-1">
            <span className="text-3xl font-black tracking-tight">
              AP<span className="text-[#1CA9C9]">.</span>
            </span>
            <span className="text-sm font-medium text-muted-foreground tracking-widest uppercase">
              Automations
            </span>
          </div>
        </div>

        <Card className="border-border bg-card">
          <CardHeader className="pb-2 text-center">
            <h1 className="text-xl font-bold">כניסה לפורטל</h1>
            <p className="text-sm text-muted-foreground mt-1">
              הכניסו את פרטי הגישה שקיבלתם מענת
            </p>
          </CardHeader>
          <CardContent className="space-y-4">

            {/* Google OAuth — plain <a> tag, cannot be disabled or blocked */}
            <a
              href={GOOGLE_OAUTH_URL}
              className="flex items-center justify-center gap-2 w-full rounded-md border border-input bg-background px-4 py-2.5 text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors"
            >
              <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
                <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
                <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
                <path d="M3.964 10.707A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.039l3.007-2.332z" fill="#FBBC05"/>
                <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.961L3.964 7.293C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
              </svg>
              כניסה עם Google
            </a>

            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-border" />
              <span className="text-xs text-muted-foreground">או עם סיסמה</span>
              <div className="flex-1 h-px bg-border" />
            </div>

            {/* Email + Password form */}
            <form action={formAction} className="space-y-4">
              {state?.error && (
                <Alert variant="destructive">
                  <AlertDescription className="text-sm font-medium">
                    {state.error}
                  </AlertDescription>
                </Alert>
              )}

              <div className="space-y-1.5">
                <Label htmlFor="email">אימייל</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  dir="ltr"
                  placeholder="your@email.com"
                  required
                  autoComplete="email"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">סיסמה</Label>
                  <Link href="/forgot-password" className="text-xs text-[#1CA9C9] hover:underline">
                    שכחתי סיסמה
                  </Link>
                </div>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  dir="ltr"
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                />
              </div>

              <Button
                type="submit"
                className="w-full ap-gradient text-white font-semibold"
                disabled={isPending}
              >
                {isPending ? "מתחבר/ת..." : "כניסה"}
              </Button>
            </form>

            <p className="text-center text-xs text-muted-foreground">
              אין גישה? צרו קשר עם{" "}
              <a href="mailto:office@apauto.co.il" className="text-[#1CA9C9] hover:underline">
                ענת
              </a>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
