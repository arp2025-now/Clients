"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { updatePasswordAction } from "./actions";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState(updatePasswordAction, null);

  useEffect(() => {
    if (state && "success" in state) {
      router.push(state.redirectTo);
    }
  }, [state, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm mx-auto">
        <div className="text-center mb-8">
          <span className="text-3xl font-black tracking-tight">
            AP<span className="text-[#1CA9C9]">.</span>
          </span>
          <p className="text-sm font-medium text-muted-foreground tracking-widest uppercase mt-1">
            Automations
          </p>
        </div>

        <Card className="border-border bg-card">
          <CardHeader className="pb-2 text-center">
            <h1 className="text-xl font-bold">בחירת סיסמה חדשה</h1>
          </CardHeader>
          <CardContent>
            <form action={formAction} className="space-y-4">
              {state && "error" in state && (
                <Alert variant="destructive">
                  <AlertDescription>{state.error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-1.5">
                <Label>סיסמה חדשה</Label>
                <Input
                  name="password"
                  type="password"
                  dir="ltr"
                  autoComplete="new-password"
                  placeholder="לפחות 8 תווים"
                  required
                  minLength={8}
                />
              </div>

              <div className="space-y-1.5">
                <Label>אימות סיסמה</Label>
                <Input
                  name="confirm"
                  type="password"
                  dir="ltr"
                  autoComplete="new-password"
                  placeholder="הקלידי שוב"
                  required
                />
              </div>

              <Button
                type="submit"
                className="w-full ap-gradient text-white font-semibold"
                disabled={isPending}
              >
                {isPending ? "שומר/ת..." : "עדכון סיסמה"}
              </Button>

              <Link
                href="/login"
                className="block text-center text-xs text-muted-foreground hover:text-foreground"
              >
                חזרה לכניסה
              </Link>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
