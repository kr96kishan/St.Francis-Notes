import { Link, useRouterState } from "@tanstack/react-router";
import { BookOpen, LayoutDashboard, LogOut, ShieldCheck, User } from "lucide-react";
import type { ReactNode } from "react";

import { CollegeLogo } from "./college-logo";
import { useAuth } from "@/lib/auth-context";
import { syllabus } from "@/lib/syllabus";
import { Button } from "@/components/ui/button";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";

type Crumb = { label: string; to?: string };

function useBreadcrumbs(): Crumb[] {
  const pathname = useRouterState({ select: (r) => r.location.pathname });
  const parts = pathname.split("/").filter(Boolean);
  const crumbs: Crumb[] = [{ label: "Home", to: "/" }];
  if (parts[0] !== "semester") return crumbs;

  const [, semId, subId, chId, tId] = parts;
  const sem = syllabus.find((s) => s.id === semId);
  if (!sem) return crumbs;
  crumbs.push({ label: sem.title, to: `/semester/${sem.id}` });
  const sub = sem.subjects.find((s) => s.id === subId);
  if (!sub) return crumbs;
  crumbs.push({ label: sub.title, to: `/semester/${sem.id}/${sub.id}` });
  const ch = sub.chapters.find((c) => c.id === chId);
  if (!ch) return crumbs;
  crumbs.push({ label: ch.title, to: `/semester/${sem.id}/${sub.id}/${ch.id}` });
  const topic = ch.topics.find((t) => t.id === tId);
  if (topic) crumbs.push({ label: topic.title });
  return crumbs;
}

function AppSidebar() {
  const pathname = useRouterState({ select: (r) => r.location.pathname });
  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border px-4 py-4">
        <CollegeLogo />
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={pathname === "/"}>
                  <Link to="/">
                    <LayoutDashboard className="h-4 w-4" />
                    <span>Dashboard</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel>Semesters</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {syllabus.map((sem) => (
                <SidebarMenuItem key={sem.id}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname.startsWith(`/semester/${sem.id}`)}
                  >
                    <Link to="/semester/$semId" params={{ semId: sem.id }}>
                      <BookOpen className="h-4 w-4" />
                      <span>{sem.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const { role, logout } = useAuth();
  const crumbs = useBreadcrumbs();

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <AppSidebar />
        <div className="flex flex-1 flex-col">
          <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-border bg-card/80 px-4 backdrop-blur md:px-6">
            <SidebarTrigger />
            <Breadcrumb className="flex-1">
              <BreadcrumbList>
                {crumbs.map((c, i) => {
                  const isLast = i === crumbs.length - 1;
                  return (
                    <div key={i} className="flex items-center gap-1.5">
                      {i > 0 && <BreadcrumbSeparator />}
                      <BreadcrumbItem>
                        {isLast || !c.to ? (
                          <BreadcrumbPage className="max-w-[220px] truncate">
                            {c.label}
                          </BreadcrumbPage>
                        ) : (
                          <BreadcrumbLink asChild>
                            <Link to={c.to} className="max-w-[180px] truncate">
                              {c.label}
                            </Link>
                          </BreadcrumbLink>
                        )}
                      </BreadcrumbItem>
                    </div>
                  );
                })}
              </BreadcrumbList>
            </Breadcrumb>
            <div className="flex items-center gap-3">
              <div className="hidden items-center gap-2 rounded-full border border-border bg-secondary px-3 py-1.5 text-xs font-medium text-secondary-foreground sm:flex">
                {role === "admin" ? (
                  <ShieldCheck className="h-3.5 w-3.5" />
                ) : (
                  <User className="h-3.5 w-3.5" />
                )}
                <span className="capitalize">{role}</span>
              </div>
              <Button variant="ghost" size="sm" onClick={logout} className="gap-2">
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Sign out</span>
              </Button>
            </div>
          </header>
          <main className="flex-1 px-4 py-8 md:px-8 lg:px-10">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  );
}
