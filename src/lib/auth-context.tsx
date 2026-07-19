import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type Role = "student" | "admin";

type AuthState = {
  role: Role | null;
  name: string | null;
  login: (role: Role, name: string) => void;
  logout: () => void;
};

const AuthCtx = createContext<AuthState | null>(null);
const ROLE_KEY = "sfdc-role";
const NAME_KEY = "sfdc-name";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [role, setRole] = useState<Role | null>(null);
  const [name, setName] = useState<string | null>(null);

  useEffect(() => {
    const storedRole = typeof window !== "undefined" ? window.localStorage.getItem(ROLE_KEY) : null;
    const storedName = typeof window !== "undefined" ? window.localStorage.getItem(NAME_KEY) : null;
    if (storedRole === "student" || storedRole === "admin") {
      setRole(storedRole);
    }
    if (storedName) {
      setName(storedName);
    }
  }, []);

  const login = (r: Role, n: string) => {
    window.localStorage.setItem(ROLE_KEY, r);
    window.localStorage.setItem(NAME_KEY, n);
    setRole(r);
    setName(n);
  };
  const logout = () => {
    window.localStorage.removeItem(ROLE_KEY);
    window.localStorage.removeItem(NAME_KEY);
    setRole(null);
    setName(null);
  };

  return <AuthCtx.Provider value={{ role, name, login, logout }}>{children}</AuthCtx.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthCtx);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
