import { createFileRoute, notFound, useNavigate } from "@tanstack/react-router";
import { ChevronRight, FileText } from "lucide-react";

import { Protected } from "@/components/protected";
import { Card } from "@/components/ui/card";
import { findChapter, findSemester, findSubject } from "@/lib/syllabus";

export const Route = createFileRoute("/semester/$semId/$subjectId/$chapterId")({
  loader: ({ params }) => {
    const sem = findSemester(params.semId);
    const sub = findSubject(params.semId, params.subjectId);
    const ch = findChapter(params.semId, params.subjectId, params.chapterId);
    if (!sem || !sub || !ch) throw notFound();
    return { sem, sub, ch };
  },
  component: ChapterPage,
  errorComponent: ({ error }) => (
    <div className="p-8 text-sm text-destructive">{error.message}</div>
  ),
  notFoundComponent: () => (
    <div className="p-8 text-sm text-muted-foreground">Chapter not found.</div>
  ),
});

function ChapterPage() {
  const { sem, sub, ch } = Route.useLoaderData();
  const navigate = useNavigate();

  return (
    <Protected>
      <div className="mx-auto w-full max-w-4xl">
        <div className="mb-10">
          <div className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
            {sub.title}
          </div>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-foreground">
            {ch.title}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">Select a topic to view notes.</p>
        </div>

        <div className="space-y-3">
          {ch.topics.map((t) => (
            <button
              key={t.id}
              onClick={() =>
                navigate({
                  to: "/semester/$semId/$subjectId/$chapterId/$topicId",
                  params: {
                    semId: sem.id,
                    subjectId: sub.id,
                    chapterId: ch.id,
                    topicId: t.id,
                  },
                })
              }
              className="group block w-full text-left"
            >
              <Card className="flex items-center gap-4 border-border p-5 transition-transform duration-200 hover:-translate-y-0.5 hover:shadow-md">
                <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <FileText className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <div className="text-base font-semibold text-foreground">{t.title}</div>
                  <div className="line-clamp-1 text-sm text-muted-foreground">
                    {t.content}
                  </div>
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
