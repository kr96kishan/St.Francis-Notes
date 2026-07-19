import { Link, useRouterState } from "@tanstack/react-router";
import { BookOpen, LayoutDashboard, LogOut, ShieldCheck, User, Upload, Trash2, Sun, Moon, MoreVertical } from "lucide-react";
import { type ReactNode, useState, useEffect } from "react";

import { CollegeLogo } from "./college-logo";
import { useAuth } from "@/lib/auth-context";
import { syllabus } from "@/lib/syllabus";
import { UploadModal } from "@/components/upload-modal";
import { DeleteModal } from "./delete-modal";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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
  const { role, name, logout } = useAuth();
  const crumbs = useBreadcrumbs();
  const [uploadOpen, setUploadOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    const saved = localStorage.getItem("theme") as "light" | "dark" | null;
    const systemDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const initial = saved || (systemDark ? "dark" : "light");
    setTheme(initial);
    if (initial === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === "light" ? "dark" : "light";
    setTheme(nextTheme);
    if (nextTheme === "dark") {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  };

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full flex-col bg-background">
        {/* Brand gradient accent line */}
        <div className="brand-gradient-line h-[2px] w-full shrink-0" />

        <div className="flex flex-1">
          <AppSidebar />
          <div className="flex flex-1 flex-col">
            <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border bg-card/80 px-3 backdrop-blur sm:h-16 sm:gap-4 sm:px-6">
              <SidebarTrigger />
              <Breadcrumb className="flex-1 overflow-hidden">
                <BreadcrumbList className="flex-nowrap">
                  {crumbs.map((c, i) => {
                    const isLast = i === crumbs.length - 1;
                    return (
                      <div key={i} className="flex items-center gap-1.5">
                        {i > 0 && <BreadcrumbSeparator />}
                        <BreadcrumbItem>
                          {isLast || !c.to ? (
                            <BreadcrumbPage className="max-w-[140px] truncate sm:max-w-[220px]">
                              {c.label}
                            </BreadcrumbPage>
                          ) : (
                            <BreadcrumbLink asChild>
                              <Link to={c.to} className="max-w-[120px] truncate sm:max-w-[180px]">
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
              {/* Desktop Header Actions */}
              <div className="hidden sm:flex items-center gap-2 sm:gap-3">
                <div className="flex items-center gap-2 rounded-full border border-border bg-secondary px-3 py-1.5 text-xs font-medium text-secondary-foreground">
                  {role === "admin" ? (
                    <ShieldCheck className="h-3.5 w-3.5" />
                  ) : (
                    <User className="h-3.5 w-3.5" />
                  )}
                  <span className="capitalize">{name ? `${name} (${role})` : role}</span>
                </div>
                
                {role === "admin" && (
                  <>
                    <Button variant="default" size="sm" onClick={() => setUploadOpen(true)} className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90">
                      <Upload className="h-4 w-4" />
                      <span>Upload Material</span>
                    </Button>
                    <UploadModal open={uploadOpen} onOpenChange={setUploadOpen} />

                    <Button variant="outline" size="sm" onClick={() => setDeleteOpen(true)} className="gap-2 text-destructive border-destructive/20 hover:bg-destructive/5 hover:text-destructive">
                      <Trash2 className="h-4 w-4" />
                      <span>Delete Content</span>
                    </Button>
                    <DeleteModal open={deleteOpen} onOpenChange={setDeleteOpen} />
                  </>
                )}

                <Button variant="ghost" size="icon" onClick={toggleTheme} className="h-9 w-9 rounded-lg text-muted-foreground hover:text-foreground">
                  {theme === "light" ? <Moon className="h-[18px] w-[18px]" /> : <Sun className="h-[18px] w-[18px]" />}
                </Button>
                
                <Button variant="ghost" size="sm" onClick={logout} className="gap-2">
                  <LogOut className="h-4 w-4" />
                  <span>Sign out</span>
                </Button>
              </div>

              {/* Mobile Header Actions */}
              <div className="flex sm:hidden items-center gap-1">
                <Button variant="ghost" size="icon" onClick={toggleTheme} className="h-9 w-9 rounded-lg text-muted-foreground hover:text-foreground">
                  {theme === "light" ? <Moon className="h-[18px] w-[18px]" /> : <Sun className="h-[18px] w-[18px]" />}
                </Button>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-9 w-9 rounded-lg text-muted-foreground hover:text-foreground">
                      <MoreVertical className="h-[18px] w-[18px]" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuLabel className="text-xs font-semibold capitalize text-muted-foreground">
                      {name ? `${name} (${role})` : role}
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {role === "admin" && (
                      <>
                        <DropdownMenuItem onClick={() => setUploadOpen(true)} className="gap-2 cursor-pointer">
                          <Upload className="h-4 w-4 text-muted-foreground" />
                          <span>Upload Material</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setDeleteOpen(true)} className="gap-2 text-destructive focus:text-destructive cursor-pointer">
                          <Trash2 className="h-4 w-4 text-destructive" />
                          <span>Delete Content</span>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                      </>
                    )}
                    <DropdownMenuItem onClick={logout} className="gap-2 cursor-pointer">
                      <LogOut className="h-4 w-4 text-muted-foreground" />
                      <span>Sign out</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                {role === "admin" && (
                  <>
                    <UploadModal open={uploadOpen} onOpenChange={setUploadOpen} />
                    <DeleteModal open={deleteOpen} onOpenChange={setDeleteOpen} />
                  </>
                )}
              </div>
            </header>
            <main className="flex-1 px-4 py-6 sm:py-8 md:px-8 lg:px-10">{children}</main>
          </div>
        </div>
      </div>
    </SidebarProvider>
  );
}
