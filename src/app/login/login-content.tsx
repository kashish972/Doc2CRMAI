"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Loader2, Mail, Sparkles } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";

export function LoginContent() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Login failed");
      }

      toast({
        title: "Signed in",
        description: "Redirecting to your dashboard.",
      });

      router.push("/dashboard");
      router.refresh();
    } catch (error) {
      toast({
        title: "Login failed",
        description: (error as Error).message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(14,165,233,0.12),transparent_40%),linear-gradient(180deg,#f8fbff_0%,#ffffff_55%,#eef6ff_100%)] px-6 py-10">
      <div className="mx-auto grid min-h-[calc(100vh-5rem)] max-w-6xl items-center gap-10 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border bg-white/80 px-4 py-2 text-sm font-medium text-slate-700 shadow-sm backdrop-blur">
            <Sparkles className="h-4 w-4 text-primary" />
            Multi-tenant document CRM
          </div>

          <div className="space-y-4">
            <h1 className="text-4xl font-black tracking-tight text-slate-950 sm:text-5xl">
              Sign in to your tenant workspace
            </h1>
            <p className="max-w-xl text-lg leading-8 text-slate-600">
              Each tenant has its own isolated database, so your CRM data, documents, and AI parsing stay separated from every other workspace.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            {[
              ["Isolated data", "Each tenant gets a dedicated MongoDB database."],
              ["Secure auth", "Session-based login with a protected onboarding flow."],
              ["AI workflow", "Upload, extract, review, and sync to CRM."],
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
            <CardTitle className="text-2xl">Welcome back</CardTitle>
            <CardDescription>Use your tenant account to continue.</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-5" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@company.com"
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  "Sign in"
                )}
              </Button>
            </form>

            <div className="mt-6 rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
              New tenant?{" "}
              <Link href="/onboarding" className="font-semibold text-primary hover:underline">
                Create your workspace
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
