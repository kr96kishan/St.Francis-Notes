import { useNavigate } from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import { AppShell } from "./app-shell";
import { useAuth } from "@/lib/auth-context";

export function Protected({ children }: { children: ReactNode }) {
  const { role } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (role === null && typeof window !== "undefined") {
      const stored = window.localStorage.getItem("sfdc-role");
      if (!stored) navigate({ to: "/login" });
    }
  }, [role, navigate]);

  if (!role) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-sm text-muted-foreground">Loading…</div>
      </div>
    );
  }

  return <AppShell>{children}</AppShell>;
}
