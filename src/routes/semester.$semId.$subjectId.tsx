import { createFileRoute, notFound, useNavigate } from "@tanstack/react-router";
import { ChevronRight, FolderOpen } from "lucide-react";

import { Protected } from "@/components/protected";
import { Card } from "@/components/ui/card";
import { findSemester, findSubject } from "@/lib/syllabus";

export const Route = createFileRoute("/semester/$semId/$subjectId")({
  loader: ({ params }) => {
    const sem = findSemester(params.semId);
    const sub = findSubject(params.semId, params.subjectId);
    if (!sem || !sub) throw notFound();
    return { sem, sub };
  },
  component: SubjectPage,
  errorComponent: ({ error }) => (
    <div className="p-8 text-sm text-destructive">{error.message}</div>
  ),
  notFoundComponent: () => (
    <div className="p-8 text-sm text-muted-foreground">Subject not found.</div>
  ),
});

function SubjectPage() {
  const { sem, sub } = Route.useLoaderData();
  const navigate = useNavigate();

  return (
    <Protected>
      <div className="mx-auto w-full max-w-4xl">
        <div className="mb-10">
          <div className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
            {sem.title} · {sub.code}
          </div>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-foreground">
            {sub.title}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {sub.chapters.length} chapters
          </p>
        </div>

        <div className="space-y-3">
          {sub.chapters.map((ch, i) => (
            <button
              key={ch.id}
              onClick={() =>
                navigate({
                  to: "/semester/$semId/$subjectId/$chapterId",
                  params: { semId: sem.id, subjectId: sub.id, chapterId: ch.id },
                })
              }
              className="group block w-full text-left"
            >
              <Card className="flex items-center gap-4 border-border p-5 transition-transform duration-200 hover:-translate-y-0.5 hover:shadow-md">
                <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <FolderOpen className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <div className="text-xs font-medium text-muted-foreground">
                    Chapter {i + 1}
                  </div>
                  <div className="text-base font-semibold text-foreground">
                    {ch.title}
                  </div>
                </div>
                <div className="text-sm text-muted-foreground">
                  {ch.topics.length} topics
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground transition-transform duration-200 group-hover:translate-x-1 group-hover:text-primary" />
              </Card>
            </button>
          ))}
        </div>
      </div>
    </Protected>
  );
}
