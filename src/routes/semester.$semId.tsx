import { createFileRoute, notFound, useNavigate } from "@tanstack/react-router";
import { ArrowRight, BookOpen } from "lucide-react";

import { Protected } from "@/components/protected";
import { Card, CardContent } from "@/components/ui/card";
import { findSemester } from "@/lib/syllabus";

export const Route = createFileRoute("/semester/$semId")({
  loader: ({ params }) => {
    const sem = findSemester(params.semId);
    if (!sem) throw notFound();
    return { sem };
  },
  component: SemesterPage,
  errorComponent: ({ error }) => (
    <div className="p-8 text-sm text-destructive">{error.message}</div>
  ),
  notFoundComponent: () => (
    <div className="p-8 text-sm text-muted-foreground">Semester not found.</div>
  ),
});

function SemesterPage() {
  const { sem } = Route.useLoaderData();
  const navigate = useNavigate();

  return (
    <Protected>
      <div className="mx-auto w-full max-w-6xl">
        <div className="mb-10">
          <div className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
            {sem.title}
          </div>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-foreground">
            Subjects
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {sem.subjects.length} subjects in this semester.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {sem.subjects.map((sub: typeof sem.subjects[number]) => (
            <button
              key={sub.id}
              onClick={() =>
                navigate({
                  to: "/semester/$semId/$subjectId",
                  params: { semId: sem.id, subjectId: sub.id },
                })
              }
              className="group text-left"
            >
              <Card className="h-full border-border transition-transform duration-200 hover:-translate-y-1 hover:shadow-lg">
                <CardContent className="p-6">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <BookOpen className="h-5 w-5" />
                  </div>
                  <div className="mt-4 text-xs font-medium tracking-wide text-muted-foreground">
                    {sub.code}
                  </div>
                  <div className="mt-1 text-lg font-semibold leading-snug text-foreground">
                    {sub.title}
                  </div>
                  <div className="mt-6 flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      {sub.chapters.length} chapters
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
