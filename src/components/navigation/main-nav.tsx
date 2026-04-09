"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  Users,
  Building2,
  Contact,
  Upload,
  File,
  Sparkles,
  UserPlus,
  cn,
  Button,
} from "@/components/icons";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Upload", href: "/upload", icon: Upload },
  { name: "Documents", href: "/crm/documents", icon: File },
  { name: "Leads", href: "/crm/leads", icon: Users },
  { name: "Companies", href: "/crm/companies", icon: Building2 },
  { name: "Contacts", href: "/crm/contacts", icon: Contact },
  { name: "Team", href: "/team", icon: UserPlus },
];

interface CurrentUserSession {
  userId: string;
  tenantId: string;
  email: string;
  role: "owner" | "admin" | "member";
}

export function MainNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);
  const [currentUser, setCurrentUser] = useState<CurrentUserSession | null>(null);
  const [sessionLoaded, setSessionLoaded] = useState(false);

  useEffect(() => {
    const loadSession = async () => {
      try {
        const response = await fetch("/api/auth/me");

        if (!response.ok) {
          setCurrentUser(null);
          return;
        }

        const data = (await response.json()) as { user?: CurrentUserSession | null };
        setCurrentUser(data.user || null);
      } finally {
        setSessionLoaded(true);
      }
    };

    loadSession();
  }, []);

  const visibleNavigation = navigation.filter((item) => {
    if (item.href === "/team") {
      return sessionLoaded && (currentUser?.role === "owner" || currentUser?.role === "admin");
    }

    return true;
  });

  const handleLogout = async () => {
    setLoggingOut(true);

    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
      router.refresh();
    } finally {
      setLoggingOut(false);
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div className="flex h-16 items-center px-6">
        <Link href="/dashboard" className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-primary/80 shadow-md shadow-primary/25">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <span className="text-lg font-bold tracking-tight">
            Doc2CRM<span className="text-primary">AI</span>
          </span>
        </Link>
        
        <nav className="ml-10 flex items-center gap-1">
          {visibleNavigation.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium transition-all duration-200",
                  isActive
                    ? "bg-primary/10 text-primary shadow-sm"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                )}
              >
                <item.icon className={cn("h-4 w-4", isActive && "text-primary")} />
                {item.name}
              </Link>
            );
          })}
        </nav>
        
        <div className="ml-auto flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={handleLogout} disabled={loggingOut}>
            {loggingOut ? "Signing out..." : "Sign out"}
          </Button>
          <div className="h-8 w-8 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white text-sm font-medium shadow-md">
            {currentUser?.email?.charAt(0)?.toUpperCase() || "U"}
          </div>
        </div>
      </div>
    </header>
  );
}
