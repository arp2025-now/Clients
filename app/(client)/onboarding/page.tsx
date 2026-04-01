"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { StepIndicator } from "@/components/onboarding/StepIndicator";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { saveBasicInfo, saveCredentials, saveCustomFields } from "./actions";

const STEP_LABELS = ["פרטי עסק", "גישות מערכות", "פרטים נוספים", "סיום"];
const TOTAL_STEPS = 4;

type Credential = {
  system_name: string;
  url: string;
  username: string;
  password: string;
  notes: string;
};

const emptyCredential = (): Credential => ({
  system_name: "",
  url: "",
  username: "",
  password: "",
  notes: "",
});

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Step 1 state
  const [basicInfo, setBasicInfo] = useState({
    business_name: "",
    phone: "",
    website_url: "",
  });

  // Step 2 state
  const [credentials, setCredentials] = useState<Credential[]>([emptyCredential()]);

  // Step 3 state
  const [customFields, setCustomFields] = useState([
    { field_name: "", field_value: "", field_type: "text" },
  ]);

  async function handleStep1() {
    setLoading(true);
    setError("");
    try {
      const fd = new FormData();
      Object.entries(basicInfo).forEach(([k, v]) => fd.set(k, v));
      await saveBasicInfo(fd);
      setStep(2);
    } catch (e: unknown) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  async function handleStep2() {
    setLoading(true);
    setError("");
    try {
      const filled = credentials.filter((c) => c.system_name.trim());
      if (filled.length > 0) await saveCredentials(filled);
      setStep(3);
    } catch (e: unknown) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  async function handleStep3() {
    setLoading(true);
    setError("");
    try {
      const filled = customFields.filter((f) => f.field_name.trim());
      if (filled.length > 0) await saveCustomFields(filled);
      setStep(4);
    } catch (e: unknown) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  function addCredential() {
    setCredentials([...credentials, emptyCredential()]);
  }

  function updateCredential(i: number, field: keyof Credential, value: string) {
    setCredentials((prev) =>
      prev.map((c, idx) => (idx === i ? { ...c, [field]: value } : c))
    );
  }

  function removeCredential(i: number) {
    setCredentials((prev) => prev.filter((_, idx) => idx !== i));
  }

  return (
    <div className="min-h-screen bg-background px-4 py-10">
      <div className="max-w-lg mx-auto">
        {/* Header */}
        <div className="text-center mb-6">
          <span className="text-2xl font-black">
            AP<span className="text-[#1CA9C9]">.</span>Automations
          </span>
          <h1 className="text-lg font-semibold mt-3">טופס קליטת לקוח</h1>
          <p className="text-sm text-muted-foreground mt-1">
            נשמח לקבל את הפרטים הנדרשים להתחלת הפרויקט
          </p>
        </div>

        <StepIndicator current={step} total={TOTAL_STEPS} labels={STEP_LABELS} />

        <Card className="border-border bg-card">
          <CardContent className="pt-6">
            {error && (
              <p className="text-destructive text-sm mb-4 bg-destructive/10 rounded-lg p-3">
                {error}
              </p>
            )}

            {/* Step 1 — Basic Info */}
            {step === 1 && (
              <div className="space-y-4">
                <CardHeader className="px-0 pt-0 pb-2">
                  <h2 className="text-base font-bold">פרטי העסק</h2>
                </CardHeader>
                <div className="space-y-1.5">
                  <Label>שם העסק *</Label>
                  <Input
                    value={basicInfo.business_name}
                    onChange={(e) => setBasicInfo({ ...basicInfo, business_name: e.target.value })}
                    placeholder="למשל: משרד עו״ד כהן"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>טלפון</Label>
                  <Input
                    dir="ltr"
                    value={basicInfo.phone}
                    onChange={(e) => setBasicInfo({ ...basicInfo, phone: e.target.value })}
                    placeholder="050-0000000"
                    type="tel"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>אתר אינטרנט</Label>
                  <Input
                    dir="ltr"
                    value={basicInfo.website_url}
                    onChange={(e) => setBasicInfo({ ...basicInfo, website_url: e.target.value })}
                    placeholder="https://your-site.co.il"
                    type="url"
                  />
                </div>
                <Button
                  className="w-full ap-gradient text-white mt-2"
                  onClick={handleStep1}
                  disabled={loading || !basicInfo.business_name.trim()}
                >
                  {loading ? "שומרת..." : "המשך ←"}
                </Button>
              </div>
            )}

            {/* Step 2 — Credentials */}
            {step === 2 && (
              <div className="space-y-5">
                <CardHeader className="px-0 pt-0 pb-2">
                  <h2 className="text-base font-bold">גישות למערכות</h2>
                  <p className="text-sm text-muted-foreground">
                    הפרטים מוצפנים ומאובטחים. ענת בלבד רואה אותם.
                  </p>
                </CardHeader>

                {credentials.map((cred, i) => (
                  <div key={i} className="bg-[oklch(0.08_0.04_296)] rounded-xl p-4 space-y-3 border border-border">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-[#1CA9C9]">
                        מערכת {i + 1}
                      </span>
                      {credentials.length > 1 && (
                        <button
                          onClick={() => removeCredential(i)}
                          className="text-xs text-muted-foreground hover:text-destructive"
                        >
                          הסר
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-xs">שם המערכת</Label>
                        <Input
                          value={cred.system_name}
                          onChange={(e) => updateCredential(i, "system_name", e.target.value)}
                          placeholder="Airtable / Gmail"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">כתובת URL</Label>
                        <Input
                          dir="ltr"
                          value={cred.url}
                          onChange={(e) => updateCredential(i, "url", e.target.value)}
                          placeholder="https://..."
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">שם משתמש / אימייל</Label>
                        <Input
                          dir="ltr"
                          value={cred.username}
                          onChange={(e) => updateCredential(i, "username", e.target.value)}
                          placeholder="user@email.com"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">סיסמה</Label>
                        <Input
                          dir="ltr"
                          type="password"
                          value={cred.password}
                          onChange={(e) => updateCredential(i, "password", e.target.value)}
                          placeholder="••••••••"
                        />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">הערות</Label>
                      <Input
                        value={cred.notes}
                        onChange={(e) => updateCredential(i, "notes", e.target.value)}
                        placeholder="למשל: גישת מנהל, 2FA כבוי..."
                      />
                    </div>
                  </div>
                ))}

                <Button variant="outline" onClick={addCredential} className="w-full">
                  + הוסף מערכת נוספת
                </Button>

                <div className="flex gap-3">
                  <Button variant="outline" onClick={() => setStep(1)} className="flex-1">
                    → חזרה
                  </Button>
                  <Button
                    className="flex-1 ap-gradient text-white"
                    onClick={handleStep2}
                    disabled={loading}
                  >
                    {loading ? "שומרת..." : "המשך ←"}
                  </Button>
                </div>
              </div>
            )}

            {/* Step 3 — Custom Fields */}
            {step === 3 && (
              <div className="space-y-4">
                <CardHeader className="px-0 pt-0 pb-2">
                  <h2 className="text-base font-bold">פרטים נוספים לפרויקט</h2>
                  <p className="text-sm text-muted-foreground">
                    שאלות ספציפיות מענת עבור הפרויקט שלך
                  </p>
                </CardHeader>

                {customFields.map((field, i) => (
                  <div key={i} className="space-y-2 bg-[oklch(0.08_0.04_296)] rounded-xl p-4 border border-border">
                    <div className="space-y-1">
                      <Label className="text-xs">שם השדה</Label>
                      <Input
                        value={field.field_name}
                        onChange={(e) =>
                          setCustomFields((prev) =>
                            prev.map((f, idx) =>
                              idx === i ? { ...f, field_name: e.target.value } : f
                            )
                          )
                        }
                        placeholder="למשל: מספר עובדים, תחום עיסוק..."
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">תשובה</Label>
                      <Textarea
                        value={field.field_value}
                        onChange={(e) =>
                          setCustomFields((prev) =>
                            prev.map((f, idx) =>
                              idx === i ? { ...f, field_value: e.target.value } : f
                            )
                          )
                        }
                        rows={2}
                        placeholder="..."
                      />
                    </div>
                  </div>
                ))}

                <Button
                  variant="outline"
                  onClick={() =>
                    setCustomFields([
                      ...customFields,
                      { field_name: "", field_value: "", field_type: "text" },
                    ])
                  }
                  className="w-full"
                >
                  + הוסף שדה
                </Button>

                <div className="flex gap-3">
                  <Button variant="outline" onClick={() => setStep(2)} className="flex-1">
                    → חזרה
                  </Button>
                  <Button
                    className="flex-1 ap-gradient text-white"
                    onClick={handleStep3}
                    disabled={loading}
                  >
                    {loading ? "שומרת..." : "סיום ←"}
                  </Button>
                </div>
              </div>
            )}

            {/* Step 4 — Done */}
            {step === 4 && (
              <div className="text-center py-6 space-y-4">
                <div className="w-16 h-16 rounded-full ap-gradient flex items-center justify-center text-3xl mx-auto ap-glow">
                  ✓
                </div>
                <h2 className="text-xl font-bold">תודה! הטופס הושלם</h2>
                <p className="text-muted-foreground text-sm max-w-xs mx-auto">
                  ענת תקבל עדכון ותיצור קשר בהקדם להתחלת הפרויקט.
                </p>
                <Button
                  className="ap-gradient text-white px-8"
                  onClick={() => router.push("/dashboard")}
                >
                  עבר לדשבורד ←
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
