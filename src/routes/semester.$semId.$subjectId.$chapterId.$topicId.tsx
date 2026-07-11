import { createFileRoute, notFound } from "@tanstack/react-router";
import { useState, type DragEvent } from "react";
import { Download, FileText, UploadCloud, X } from "lucide-react";
import { toast } from "sonner";

import { Protected } from "@/components/protected";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/lib/auth-context";
import { findChapter, findSemester, findSubject, findTopic } from "@/lib/syllabus";

export const Route = createFileRoute(
  "/semester/$semId/$subjectId/$chapterId/$topicId",
)({
  loader: ({ params }) => {
    const sem = findSemester(params.semId);
    const sub = findSubject(params.semId, params.subjectId);
    const ch = findChapter(params.semId, params.subjectId, params.chapterId);
    const topic = findTopic(
      params.semId,
      params.subjectId,
      params.chapterId,
      params.topicId,
    );
    if (!sem || !sub || !ch || !topic) throw notFound();
    return { sem, sub, ch, topic };
  },
  component: TopicPage,
  errorComponent: ({ error }) => (
    <div className="p-8 text-sm text-destructive">{error.message}</div>
  ),
  notFoundComponent: () => (
    <div className="p-8 text-sm text-muted-foreground">Topic not found.</div>
  ),
});

function TopicPage() {
  const { sem, sub, ch, topic } = Route.useLoaderData();
  const { role } = useAuth();

  return (
    <Protected>
      <div className="mx-auto w-full max-w-4xl">
        <div className="mb-8">
          <div className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
            {sem.title} · {sub.title} · {ch.title}
          </div>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-foreground">
            {topic.title}
          </h1>
        </div>

        {role === "admin" ? (
          <AdminView topicTitle={topic.title} path={`${sem.title} › ${sub.title} › ${ch.title}`} />
        ) : (
          <StudentView content={topic.content} title={topic.title} />
        )}
      </div>
    </Protected>
  );
}

function StudentView({ content, title }: { content: string; title: string }) {
  return (
    <div className="space-y-6">
      <Card className="border-border">
        <CardContent className="p-8">
          <div className="mb-4 flex items-center gap-2 text-xs font-medium uppercase tracking-widest text-muted-foreground">
            <FileText className="h-3.5 w-3.5" />
            Reading Mode
          </div>
          <article className="prose prose-slate max-w-none">
            <h2 className="text-xl font-semibold text-foreground">{title}</h2>
            <p className="mt-3 text-[15px] leading-7 text-foreground/80">{content}</p>
            <p className="mt-4 text-[15px] leading-7 text-foreground/80">
              These notes are curated by faculty at St. Francis Degree College and aligned to the
              Bengaluru City University SEP syllabus. Review each section carefully, and refer to the
              downloadable PDF for annotated diagrams and worked examples.
            </p>
            <ul className="mt-4 space-y-1.5 text-[15px] leading-7 text-foreground/80">
              <li>• Key definitions and terminology</li>
              <li>• Illustrative examples with step-by-step reasoning</li>
              <li>• Practice questions from past university papers</li>
            </ul>
          </article>
        </CardContent>
      </Card>

      <Card className="border-dashed border-border bg-secondary/50">
        <CardContent className="flex items-center justify-between gap-4 p-6">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <div className="text-sm font-semibold text-foreground">{title}.pdf</div>
              <div className="text-xs text-muted-foreground">PDF Document · 1.2 MB</div>
            </div>
          </div>
          <Button
            size="lg"
            className="gap-2"
            onClick={() => toast.success("Download started (mock)")}
          >
            <Download className="h-4 w-4" />
            Download PDF
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

function AdminView({ topicTitle, path }: { topicTitle: string; path: string }) {
  const [dragOver, setDragOver] = useState(false);
  const [files, setFiles] = useState<{ name: string; size: number }[]>([]);

  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    const list = Array.from(e.dataTransfer.files).map((f) => ({
      name: f.name,
      size: f.size,
    }));
    if (list.length) {
      setFiles((prev) => [...prev, ...list]);
      toast.success(`${list.length} file(s) mapped to ${topicTitle}`);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="border-border">
        <CardContent className="p-6">
          <div className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
            Manage Material
          </div>
          <div className="mt-1 text-sm text-foreground">
            Uploads will be mapped to: <span className="font-medium">{path} › {topicTitle}</span>
          </div>
        </CardContent>
      </Card>

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        className={`rounded-2xl border-2 border-dashed p-12 text-center transition-colors duration-200 ${
          dragOver
            ? "border-primary bg-primary/5"
            : "border-border bg-secondary/40 hover:border-primary/60"
        }`}
      >
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <UploadCloud className="h-7 w-7" />
        </div>
        <h3 className="mt-5 text-lg font-semibold text-foreground">
          Drag & drop material here
        </h3>
        <p className="mt-1 text-sm text-muted-foreground">
          PDF, DOCX, PPTX up to 25 MB. Files will be attached to this exact topic.
        </p>
        <div className="mt-5">
          <Button variant="outline" className="gap-2">
            <UploadCloud className="h-4 w-4" />
            Browse files
          </Button>
        </div>
      </div>

      {files.length > 0 && (
        <Card className="border-border">
          <CardContent className="p-2">
            <ul className="divide-y divide-border">
              {files.map((f, i) => (
                <li key={i} className="flex items-center justify-between gap-3 px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary/10 text-primary">
                      <FileText className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-foreground">{f.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {(f.size / 1024).toFixed(1)} KB
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setFiles((prev) => prev.filter((_, idx) => idx !== i))}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
