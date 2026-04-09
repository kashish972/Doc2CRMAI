"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Building2, Contact, Loader2, Mail, Sparkles } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";

export function OnboardingContent() {
  const [companyName, setCompanyName] = useState("");
  const [slug, setSlug] = useState("");
  const [adminName, setAdminName] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);

    try {
      const response = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ companyName, slug, adminName, adminEmail, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Onboarding failed");
      }

      toast({
        title: "Workspace created",
        description: "Your tenant and admin account are ready.",
      });

      router.push("/dashboard");
      router.refresh();
    } catch (error) {
      toast({
        title: "Onboarding failed",
        description: (error as Error).message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(14,165,233,0.12),transparent_40%),linear-gradient(180deg,#f8fbff_0%,#ffffff_55%,#eef6ff_100%)] px-6 py-10">
      <div className="mx-auto grid min-h-[calc(100vh-5rem)] max-w-6xl items-center gap-10 lg:grid-cols-[0.95fr_1.05fr]">
        <section className="space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border bg-white/80 px-4 py-2 text-sm font-medium text-slate-700 shadow-sm backdrop-blur">
            <Sparkles className="h-4 w-4 text-primary" />
            Create your tenant workspace
          </div>

          <div className="space-y-4">
            <h1 className="text-4xl font-black tracking-tight text-slate-950 sm:text-5xl">
              Onboard a new tenant in minutes
            </h1>
            <p className="max-w-xl text-lg leading-8 text-slate-600">
              We create a separate MongoDB database for this tenant, provision the admin user, and sign you in immediately.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            {[
              ["Database isolation", "Every tenant gets its own database namespace."],
              ["Admin ownership", "The first account becomes the tenant owner."],
              ["Ready to use", "Land on the dashboard already authenticated."],
            ].map(([title, description]) => (
              <div key={title} className="rounded-2xl border bg-white/80 p-4 shadow-sm backdrop-blur">
                <p className="font-semibold text-slate-950">{title}</p>
                <p className="mt-1 text-sm leading-6 text-slate-600">{description}</p>
              </div>
            ))}
          </div>
        </section>

        <Card className="border-0 shadow-2xl shadow-slate-900/10">
          <CardHeader className="space-y-2">
            <CardTitle className="text-2xl">Start onboarding</CardTitle>
            <CardDescription>Set up the tenant and your first admin user.</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-5" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <Label htmlFor="companyName">Company name</Label>
                <div className="relative">
                  <Building2 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="companyName"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="Acme Inc"
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="slug">Tenant slug</Label>
                <Input
                  id="slug"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="acme-inc"
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="adminName">Admin name</Label>
                  <div className="relative">
                    <Contact className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="adminName"
                      value={adminName}
                      onChange={(e) => setAdminName(e.target.value)}
                      placeholder="Jane Doe"
                      className="pl-10"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="adminEmail">Admin email</Label>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="adminEmail"
                      type="email"
                      value={adminEmail}
                      onChange={(e) => setAdminEmail(e.target.value)}
                      placeholder="jane@acme.com"
                      className="pl-10"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Create a secure password"
                  required
                />
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating workspace...
                  </>
                ) : (
                  "Create tenant"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
