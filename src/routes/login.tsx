import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { GraduationCap, ShieldCheck, User } from "lucide-react";

import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CollegeLogo } from "@/components/college-logo";

export const Route = createFileRoute("/login")({
  component: LoginPage,
});

function LoginPage() {
  const { role, login } = useAuth();
  const navigate = useNavigate();
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => setHydrated(true), []);
  useEffect(() => {
    if (hydrated && role) navigate({ to: "/" });
  }, [hydrated, role, navigate]);

  const handle = (r: "student" | "admin") => {
    login(r);
    navigate({ to: "/" });
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4">
      {/* Animated background orbs */}
      <div className="login-orb login-orb-1" />
      <div className="login-orb login-orb-2" />
      <div className="login-orb login-orb-3" />

      {/* Subtle grid pattern */}
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_20%_20%,oklch(0.36_0.18_268/0.08),transparent_60%),radial-gradient(circle_at_80%_80%,oklch(0.5_0.16_268/0.06),transparent_55%)]" />

      <Card className="animate-fade-in-up relative z-10 w-full max-w-md border-border p-10 shadow-xl backdrop-blur-sm">
        <div className="flex flex-col items-center text-center">
          <div className="animate-pulse-glow rounded-2xl p-1">
            <CollegeLogo />
          </div>
          <h1 className="mt-8 text-2xl font-semibold tracking-tight text-foreground">
            Notes Portal
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Sign in to access the BCA syllabus and academic materials.
          </p>
        </div>

        <div className="mt-8 space-y-3">
          <Button
            className="h-12 w-full justify-center gap-2 text-base transition-all duration-200 hover:scale-[1.02] hover:shadow-md active:scale-[0.98]"
            onClick={() => handle("student")}
          >
            <User className="h-4 w-4" />
            Login as Student
          </Button>

          <div className="relative flex items-center py-1">
            <div className="flex-1 border-t border-border" />
            <span className="px-3 text-xs text-muted-foreground">or</span>
            <div className="flex-1 border-t border-border" />
          </div>

          <Button
            variant="outline"
            className="h-12 w-full justify-center gap-2 text-base transition-all duration-200 hover:scale-[1.02] hover:shadow-md active:scale-[0.98]"
            onClick={() => handle("admin")}
          >
            <ShieldCheck className="h-4 w-4" />
            Login as Admin
          </Button>
        </div>

        <div className="mt-8 flex items-center justify-center gap-2 text-xs text-muted-foreground">
          <GraduationCap className="h-3.5 w-3.5" />
          <span>© {new Date().getFullYear()} St. Francis Degree College</span>
        </div>
      </Card>
    </div>
  );
}
