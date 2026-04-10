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
          <CardContent>
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

            <p className="text-center text-xs text-muted-foreground mt-6">
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
