import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { ArrowRight, BookMarked, GraduationCap } from "lucide-react";

import { Protected } from "@/components/protected";
import { useAuth } from "@/lib/auth-context";
import { syllabus } from "@/lib/syllabus";
import { Card, CardContent } from "@/components/ui/card";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  const { role } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!role && typeof window !== "undefined") {
      const stored = window.localStorage.getItem("sfdc-role");
      if (!stored) navigate({ to: "/login" });
    }
  }, [role, navigate]);

  if (!role) return null;

  return (
    <Protected>
      <div className="mx-auto w-full max-w-6xl">
        <div className="mb-10">
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground">
            <GraduationCap className="h-3.5 w-3.5" />
            BCA — Bengaluru City University SEP
          </div>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight text-foreground">
            Welcome back.
          </h1>
          <p className="mt-2 max-w-xl text-base text-muted-foreground">
            Browse the complete BCA syllabus by semester. Notes, chapters and topics — beautifully organised.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {syllabus.map((sem) => (
            <button
              key={sem.id}
              onClick={() => navigate({ to: "/semester/$semId", params: { semId: sem.id } })}
              className="group text-left"
            >
              <Card className="h-full overflow-hidden border-border transition-transform duration-200 hover:-translate-y-1 hover:shadow-lg">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
                        Semester
                      </div>
                      <div className="mt-1 text-3xl font-semibold tracking-tight text-foreground">
                        {sem.title}
                      </div>
                    </div>
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary transition-transform duration-200 group-hover:scale-110">
                      <BookMarked className="h-5 w-5" />
                    </div>
                  </div>
                  <div className="mt-6 flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      {sem.subjects.length} subjects
                    </span>
                    <span className="inline-flex items-center gap-1 font-medium text-primary opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                      Open <ArrowRight className="h-4 w-4" />
                    </span>
                  </div>
                </CardContent>
              </Card>
            </button>
          ))}
        </div>
      </div>
    </Protected>
  );
}
