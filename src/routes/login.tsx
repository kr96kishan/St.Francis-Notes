import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { GraduationCap, ShieldCheck, User, Lock, Calendar } from "lucide-react";
import { toast } from "sonner";

import { useAuth, type Role } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const Route = createFileRoute("/login")({
  component: LoginPage,
});

const VALID_USERS = [
  { uucms: "U18IW25S0052", dobs: ["01-10-2007", "1-10-2007"], name: "Kishan" },
  { uucms: "U18IW25S0126", dobs: ["13-06-2006", "13-6-2006"], name: "Pooja" }
];

function LoginPage() {
  const { role, login } = useAuth();
  const navigate = useNavigate();
  const [hydrated, setHydrated] = useState(false);
  
  const [selectedRole, setSelectedRole] = useState<Role>("student");
  const [uucms, setUucms] = useState("");
  const [dob, setDob] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => setHydrated(true), []);
  useEffect(() => {
    if (hydrated && role) navigate({ to: "/" });
  }, [hydrated, role, navigate]);

  const handleQuickLogin = (role: Role, name: string) => {
    toast.success(`Welcome back, ${name}!`);
    login(role, name);
    navigate({ to: "/" });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!uucms.trim()) {
      toast.error("Please enter your UUCMS number or Name.");
      return;
    }

    setLoading(true);

    const cleanUucms = uucms.trim().toUpperCase();
    const cleanDob = dob.trim().replace(/[\/\.]/g, "-");

    const matchedUser = VALID_USERS.find(user => 
      user.uucms === cleanUucms && user.dobs.includes(cleanDob)
    );

    const displayName = matchedUser ? matchedUser.name : uucms.trim();
    toast.success(`Welcome, ${displayName}!`);
    login(selectedRole, displayName);
    navigate({ to: "/" });
    
    setLoading(false);
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4">
      {/* Animated background orbs */}
      <div className="login-orb login-orb-1" />
      <div className="login-orb login-orb-2" />
      <div className="login-orb login-orb-3" />

      {/* Subtle grid pattern */}
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_20%_20%,oklch(0.36_0.18_268/0.08),transparent_60%),radial-gradient(circle_at_80%_80%,oklch(0.5_0.16_268/0.06),transparent_55%)]" />

      <Card className="animate-fade-in-up relative z-10 w-full max-w-md border-border p-8 shadow-xl backdrop-blur-sm">
        <div className="flex flex-col items-center text-center">
          <div className="animate-pulse-glow flex h-24 w-24 items-center justify-center rounded-full bg-card p-2 shadow-inner border border-border">
            <img 
              src="/college-logo.png" 
              alt="St. Francis College Logo" 
              className="h-full w-full object-contain"
            />
          </div>
          <h1 className="mt-5 text-2xl font-bold tracking-tight text-foreground">
            St.Francis College
          </h1>
          <p className="text-sm font-medium text-primary mt-1">
            Notes Portal
          </p>
          <p className="mt-2 text-xs text-muted-foreground max-w-[280px]">
            Please enter your UUCMS number and Date of Birth to log in.
          </p>
        </div>

        <Tabs 
          value={selectedRole} 
          onValueChange={(val) => setSelectedRole(val as Role)} 
          className="mt-6 w-full"
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="student" className="gap-2">
              <User className="h-3.5 w-3.5" />
              Student
            </TabsTrigger>
            <TabsTrigger value="admin" className="gap-2">
              <ShieldCheck className="h-3.5 w-3.5" />
              Admin
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="uucms">UUCMS Number</Label>
            <div className="relative">
              <Lock className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="uucms"
                type="text"
                placeholder="Enter UUCMS Number"
                value={uucms}
                onChange={(e) => setUucms(e.target.value)}
                className="pl-9"
                disabled={loading}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="dob">Date of Birth</Label>
            <div className="relative">
              <Calendar className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="dob"
                type="text"
                placeholder="DD-MM-YYYY"
                value={dob}
                onChange={(e) => setDob(e.target.value)}
                className="pl-9"
                disabled={loading}
              />
            </div>
          </div>

          <Button
            type="submit"
            className="w-full h-11 text-sm font-semibold transition-all duration-200 hover:scale-[1.01] active:scale-[0.99] mt-2"
            disabled={loading}
          >
            {loading ? "Authenticating..." : `Sign In as ${selectedRole === "admin" ? "Admin" : "Student"}`}
          </Button>
        </form>

        <div className="mt-5 border-t border-border pt-4 text-center">
          <p className="text-xs text-muted-foreground mb-2">Or use 1-click Demo Login:</p>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="flex-1 text-xs gap-1.5"
              onClick={() => handleQuickLogin("student", "Kishan")}
            >
              <User className="h-3.5 w-3.5 text-primary" />
              Student Login
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="flex-1 text-xs gap-1.5"
              onClick={() => handleQuickLogin("admin", "Admin")}
            >
              <ShieldCheck className="h-3.5 w-3.5 text-primary" />
              Admin Login
            </Button>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-center gap-2 text-xs text-muted-foreground border-t border-border pt-4">
          <GraduationCap className="h-3.5 w-3.5" />
          <span>© {new Date().getFullYear()} St.Francis College</span>
        </div>
      </Card>
    </div>
  );
}
