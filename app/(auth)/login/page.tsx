"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { getLoginRedirect } from "./actions";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<"login" | "forgot">("login");
  const [resetSent, setResetSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const supabase = createClient();
    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      setError("אימייל או סיסמה שגויים. נסי שוב.");
      setLoading(false);
      return;
    }

    const redirect = await getLoginRedirect();
    router.push(redirect);
    router.refresh();
  }

  async function handleForgot(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const supabase = createClient();
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?type=recovery&next=/reset-password`,
    });
    setLoading(false);
    if (resetError) {
      setError(resetError.message);
      return;
    }
    setResetSent(true);
  }

  return (
    <div className="min-h-screen flex items-center justify-content-center bg-background px-4">
      <div className="w-full max-w-sm mx-auto">
        {/* Logo */}
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
            <h1 className="text-xl font-bold">
              {mode === "login" ? "כניסה לפורטל" : "איפוס סיסמה"}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {mode === "login"
                ? "הכניסי את פרטי הגישה שקיבלת מענת"
                : "נשלח לך קישור לאיפוס סיסמה"}
            </p>
          </CardHeader>
          <CardContent>
            {mode === "login" ? (
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <div className="space-y-1.5">
                  <Label htmlFor="email">אימייל</Label>
                  <Input
                    id="email"
                    type="email"
                    dir="ltr"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password">סיסמה</Label>
                    <button
                      type="button"
                      onClick={() => { setMode("forgot"); setError(""); }}
                      className="text-xs text-[#1CA9C9] hover:underline"
                    >
                      שכחתי סיסמה
                    </button>
                  </div>
                  <Input
                    id="password"
                    type="password"
                    dir="ltr"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full ap-gradient text-white font-semibold"
                  disabled={loading}
                >
                  {loading ? "מתחברת..." : "כניסה"}
                </Button>
              </form>
            ) : resetSent ? (
              <div className="text-center py-4 space-y-3">
                <div className="text-4xl">📧</div>
                <p className="text-sm font-medium">נשלח מייל לאיפוס סיסמה!</p>
                <p className="text-xs text-muted-foreground">
                  בדקי את תיבת הדואר של {email} ולחצי על הקישור.
                </p>
                <button
                  onClick={() => { setMode("login"); setResetSent(false); }}
                  className="text-xs text-[#1CA9C9] hover:underline"
                >
                  חזרה לכניסה
                </button>
              </div>
            ) : (
              <form onSubmit={handleForgot} className="space-y-4">
                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
                <div className="space-y-1.5">
                  <Label htmlFor="reset-email">אימייל</Label>
                  <Input
                    id="reset-email"
                    type="email"
                    dir="ltr"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full ap-gradient text-white font-semibold"
                  disabled={loading}
                >
                  {loading ? "שולחת..." : "שלחי קישור לאיפוס"}
                </Button>
                <button
                  type="button"
                  onClick={() => { setMode("login"); setError(""); }}
                  className="w-full text-xs text-muted-foreground hover:text-foreground text-center"
                >
                  חזרה לכניסה
                </button>
              </form>
            )}

            {mode === "login" && (
              <p className="text-center text-xs text-muted-foreground mt-6">
                אין לך גישה? צרי קשר עם{" "}
                <a
                  href="mailto:office@apauto.co.il"
                  className="text-[#1CA9C9] hover:underline"
                >
                  ענת
                </a>
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
