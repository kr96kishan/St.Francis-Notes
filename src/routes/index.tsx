import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowRight, BookMarked, GraduationCap, Library, Layers, ShieldCheck } from "lucide-react";

import { Protected } from "@/components/protected";
import { useAuth } from "@/lib/auth-context";
import { syllabus } from "@/lib/syllabus";
import { Card, CardContent } from "@/components/ui/card";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard — St. Francis Notes Hub | BCA Syllabus" },
      {
        name: "description",
        content:
          "Browse the complete Bengaluru City University SEP BCA syllabus by semester — subjects, chapters and admin-verified notes.",
      },
      { property: "og:title", content: "St. Francis Notes Hub — BCA Dashboard" },
      {
        property: "og:description",
        content: "Semester-wise BCA notes, chapters and topics for St. Francis College students.",
      },
    ],
  }),
  component: Index,
});

const ACCENTS = [
  { ring: "hover:border-emerald-400/50 hover:shadow-[0_18px_45px_-18px_rgba(16,185,129,0.55)]", chip: "text-emerald-400 bg-emerald-400/10 border-emerald-400/25", icon: "text-emerald-400 bg-emerald-400/10", glow: "from-emerald-400/25" },
  { ring: "hover:border-cyan-400/50 hover:shadow-[0_18px_45px_-18px_rgba(34,211,238,0.55)]", chip: "text-cyan-400 bg-cyan-400/10 border-cyan-400/25", icon: "text-cyan-400 bg-cyan-400/10", glow: "from-cyan-400/25" },
  { ring: "hover:border-purple-400/50 hover:shadow-[0_18px_45px_-18px_rgba(168,85,247,0.55)]", chip: "text-purple-400 bg-purple-400/10 border-purple-400/25", icon: "text-purple-400 bg-purple-400/10", glow: "from-purple-400/25" },
  { ring: "hover:border-rose-400/50 hover:shadow-[0_18px_45px_-18px_rgba(251,113,133,0.55)]", chip: "text-rose-400 bg-rose-400/10 border-rose-400/25", icon: "text-rose-400 bg-rose-400/10", glow: "from-rose-400/25" },
  { ring: "hover:border-amber-400/50 hover:shadow-[0_18px_45px_-18px_rgba(251,191,36,0.55)]", chip: "text-amber-400 bg-amber-400/10 border-amber-400/25", icon: "text-amber-400 bg-amber-400/10", glow: "from-amber-400/25" },
  { ring: "hover:border-indigo-400/50 hover:shadow-[0_18px_45px_-18px_rgba(129,140,248,0.55)]", chip: "text-indigo-400 bg-indigo-400/10 border-indigo-400/25", icon: "text-indigo-400 bg-indigo-400/10", glow: "from-indigo-400/25" },
];

function Index() {
  const { name } = useAuth();
  const navigate = useNavigate();
  const subjectCount = syllabus.reduce((n, s) => n + s.subjects.length, 0);

  return (
    <Protected>
      <div className="mx-auto w-full max-w-6xl">
        {/* Hero */}
        <div className="glass-panel relative mb-8 overflow-hidden rounded-3xl p-6 sm:p-9">
          <div className="pointer-events-none absolute -right-16 -top-24 h-64 w-64 rounded-full bg-indigo-500/20 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 left-1/3 h-56 w-56 rounded-full bg-cyan-400/15 blur-3xl" />
          <svg
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.14]"
          >
            <defs>
              <pattern id="circuit" width="44" height="44" patternUnits="userSpaceOnUse">
                <path d="M0 22h14m8 0h22M22 0v14m0 8v22" stroke="currentColor" strokeWidth="1" fill="none" />
                <circle cx="22" cy="22" r="2" fill="currentColor" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#circuit)" className="text-primary" />
          </svg>

          <div className="relative">
            <div className="glass-soft inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium text-foreground/80">
              <GraduationCap className="h-3.5 w-3.5 text-primary" />
              BCA — Bengaluru City University SEP
            </div>
            <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
              Welcome back, {name || "Student"}.
            </h1>
            <p className="mt-2 max-w-xl text-sm text-muted-foreground sm:text-base">
              Browse the complete BCA syllabus by semester. Notes, chapters and topics — beautifully organised.
            </p>

            {/* Quick stats strip */}
            <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
              {[
                { icon: Layers, label: "Semesters", value: `${syllabus.length}`, tone: "text-cyan-400 bg-cyan-400/10" },
                { icon: Library, label: "Subjects", value: `${subjectCount}+`, tone: "text-indigo-400 bg-indigo-400/10" },
                { icon: ShieldCheck, label: "Admin-Verified Notes", value: "Live", tone: "text-emerald-400 bg-emerald-400/10" },
              ].map((s) => (
                <div
                  key={s.label}
                  className="glass-soft flex items-center gap-3 rounded-2xl px-4 py-3 transition-transform duration-200 hover:-translate-y-0.5"
                >
                  <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${s.tone}`}>
                    <s.icon className="h-4 w-4" />
                  </span>
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-foreground">{s.value}</div>
                    <div className="truncate text-[11px] uppercase tracking-wider text-muted-foreground">
                      {s.label}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {syllabus.map((sem, i) => {
            const a = ACCENTS[i % ACCENTS.length];
            return (
              <button
                key={sem.id}
                onClick={() => navigate({ to: "/semester/$semId", params: { semId: sem.id } })}
                className="group text-left"
              >
                <Card
                  className={`glass-panel card-glow relative h-full overflow-hidden rounded-2xl hover:-translate-y-1.5 ${a.ring}`}
                >
                  <span
                    className={`pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b ${a.glow} to-transparent opacity-0 transition-opacity duration-200 group-hover:opacity-100`}
                  />
                  <CardContent className="relative p-6">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                          Semester
                        </div>
                        <div className="mt-1 text-3xl font-extrabold tracking-tight text-foreground">
                          {sem.title}
                        </div>
                      </div>
                      <div
                        className={`flex h-11 w-11 items-center justify-center rounded-xl ${a.icon} transition-transform duration-200 group-hover:scale-110`}
                      >
                        <BookMarked className="h-5 w-5" />
                      </div>
                    </div>
                    <div className="mt-6 flex items-center justify-between text-sm">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${a.chip}`}
                      >
                        <Library className="h-3 w-3" />
                        {sem.subjects.length} subjects
                      </span>
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-primary opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                        Open <ArrowRight className="h-4 w-4" />
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </button>
            );
          })}
        </div>
      </div>
    </Protected>
  );
}

