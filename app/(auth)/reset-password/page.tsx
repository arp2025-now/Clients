"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (password.length < 8) {
      setError("הסיסמה חייבת להכיל לפחות 8 תווים");
      return;
    }
    if (password !== confirm) {
      setError("הסיסמאות אינן תואמות");
      return;
    }
    setLoading(true);
    const supabase = createClient();
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (updateError) {
      setError(updateError.message);
      return;
    }
    setDone(true);
    setTimeout(() => router.push("/dashboard"), 2000);
  }

  return (
    <div className="min-h-screen flex items-center justify-content-center bg-background px-4">
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
            <h1 className="text-xl font-bold">בחירת סיסמה חדשה</h1>
          </CardHeader>
          <CardContent>
            {done ? (
              <div className="text-center py-4 space-y-2">
                <div className="text-4xl">✓</div>
                <p className="text-sm font-medium">הסיסמה עודכנה בהצלחה!</p>
                <p className="text-xs text-muted-foreground">מעבירה לדשבורד...</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
                <div className="space-y-1.5">
                  <Label>סיסמה חדשה</Label>
                  <Input
                    type="password"
                    dir="ltr"
                    autoComplete="new-password"
                    placeholder="לפחות 8 תווים"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>אימות סיסמה</Label>
                  <Input
                    type="password"
                    dir="ltr"
                    autoComplete="new-password"
                    placeholder="הקלידי שוב"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    required
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full ap-gradient text-white font-semibold"
                  disabled={loading}
                >
                  {loading ? "שומרת..." : "עדכני סיסמה"}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
