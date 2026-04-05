"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [sentTo, setSentTo] = useState("");
  const [error, setError] = useState("");

  async function handleSend() {
    const trimmed = email.trim();
    if (!trimmed) {
      setError("נא להכניס כתובת אימייל.");
      return;
    }

    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimmed }),
      });
      if (!res.ok) throw new Error("server error");
      setSentTo(trimmed);
      setSent(true);
    } catch {
      setError("שגיאה בשליחה. נסי שוב.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm mx-auto">
        <div className="text-center mb-8">
          <span className="text-3xl font-black tracking-tight">
            AP<span className="text-[#1CA9C9]">.</span>
          </span>
          <p className="text-sm font-medium text-muted-foreground tracking-widest uppercase mt-1">Automations</p>
        </div>

        <Card className="border-border bg-card">
          <CardHeader className="pb-2 text-center">
            <h1 className="text-xl font-bold">
              {sent ? "מייל נשלח!" : "איפוס סיסמה"}
            </h1>
          </CardHeader>
          <CardContent>
            {sent ? (
              <div className="text-center py-4 space-y-4">
                <div className="text-5xl">📧</div>
                <p className="text-sm text-muted-foreground">
                  שלחנו קישור לאיפוס סיסמה לכתובת <strong>{sentTo}</strong>.<br />
                  בדקי את תיבת הדואר.
                </p>
                <Link href="/login" className="block text-sm text-[#1CA9C9] hover:underline">
                  חזרה לכניסה
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
                <div className="space-y-1.5">
                  <Label htmlFor="email">אימייל</Label>
                  <Input
                    id="email"
                    type="text"
                    inputMode="email"
                    dir="ltr"
                    placeholder="your@email.com"
                    autoComplete="email"
                    autoFocus
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSend()}
                  />
                </div>
                <Button
                  type="button"
                  onClick={handleSend}
                  className="w-full ap-gradient text-white font-semibold"
                  disabled={loading}
                >
                  {loading ? "שולחת..." : "שלחי קישור לאיפוס"}
                </Button>
                <Link
                  href="/login"
                  className="block text-center text-xs text-muted-foreground hover:text-foreground"
                >
                  חזרה לכניסה
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
