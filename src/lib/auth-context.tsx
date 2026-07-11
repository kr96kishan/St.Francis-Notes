import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type Role = "student" | "admin";

type AuthState = {
  role: Role | null;
  login: (role: Role) => void;
  logout: () => void;
};

const AuthCtx = createContext<AuthState | null>(null);
const STORAGE_KEY = "sfdc-role";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [role, setRole] = useState<Role | null>(null);

  useEffect(() => {
    const stored = typeof window !== "undefined" ? window.localStorage.getItem(STORAGE_KEY) : null;
    if (stored === "student" || stored === "admin") setRole(stored);
  }, []);

  const login = (r: Role) => {
    window.localStorage.setItem(STORAGE_KEY, r);
    setRole(r);
  };
  const logout = () => {
    window.localStorage.removeItem(STORAGE_KEY);
    setRole(null);
  };

  return <AuthCtx.Provider value={{ role, login, logout }}>{children}</AuthCtx.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthCtx);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
