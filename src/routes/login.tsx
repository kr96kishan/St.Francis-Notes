import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ShieldCheck, User } from "lucide-react";

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
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_20%_20%,oklch(0.36_0.18_268/0.08),transparent_60%),radial-gradient(circle_at_80%_80%,oklch(0.5_0.16_268/0.06),transparent_55%)]" />
      <Card className="w-full max-w-md border-border p-10 shadow-xl">
        <div className="flex flex-col items-center text-center">
          <CollegeLogo />
          <h1 className="mt-8 text-2xl font-semibold tracking-tight text-foreground">
            Notes Portal
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Sign in to access the BCA syllabus and academic materials.
          </p>
        </div>

        <div className="mt-8 space-y-3">
          <Button
            className="h-12 w-full justify-center gap-2 text-base"
            onClick={() => handle("student")}
          >
            <User className="h-4 w-4" />
            Login as Student
          </Button>
          <Button
            variant="outline"
            className="h-12 w-full justify-center gap-2 text-base"
            onClick={() => handle("admin")}
          >
            <ShieldCheck className="h-4 w-4" />
            Login as Admin
          </Button>
        </div>

        <p className="mt-8 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} St. Francis Degree College. All rights reserved.
        </p>
      </Card>
    </div>
  );
}
