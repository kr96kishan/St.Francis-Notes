import { createFileRoute, notFound, useNavigate, Outlet, useRouterState } from "@tanstack/react-router";
import { useState } from "react";
import { ChevronRight, FolderOpen, FileQuestion, Plus, Trash2, Download, FileText, BookOpen, Search } from "lucide-react";
import { toast } from "sonner";

import { Protected } from "@/components/protected";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { findSemester, findSubject } from "@/lib/syllabus";
import { useAuth } from "@/lib/auth-context";
import { 
  useUploadedContent, 
  useRemoveContent, 
  useMaterialCount, 
  useCustomTopics, 
  useRemoveCustomTopic, 
  buildChapterKey,
  resolveItemUrl 
} from "@/lib/content-store";
import { UploadModal } from "@/components/upload-modal";

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
  const { role } = useAuth();
  
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isExact = pathname === `/semester/${sem.id}/${sub.id}`;

  const [uploadOpen, setUploadOpen] = useState(false);
  const [previewFile, setPreviewFile] = useState<{ url: string; name: string } | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const pyqKey = `${sem.id}/${sub.id}/pyqs`;
  const pyqCount = useMaterialCount(pyqKey);
  const pyqItems = useUploadedContent(pyqKey);
  const removeContent = useRemoveContent();

  const subCustomKey = buildChapterKey(sem.id, sub.id, "general");
  const subCustomTopics = useCustomTopics(subCustomKey);
  const removeCustomTopic = useRemoveCustomTopic();

  if (!isExact) {
    return <Outlet />;
  }

  // Filter syllabus units/chapters (matches chapter title or any topic title/content inside it)
  const filteredChapters = sub.chapters.filter((ch) => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return true;
    const chMatch = ch.title.toLowerCase().includes(query);
    const topicMatch = ch.topics.some(
      (t) =>
        t.title.toLowerCase().includes(query) ||
        t.content.toLowerCase().includes(query),
    );
    return chMatch || topicMatch;
  });

  // Filter general custom topics
  const filteredCustomTopics = subCustomTopics.filter((topic) => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return true;
    return topic.title.toLowerCase().includes(query);
  });

  // Filter PYQ documents
  const filteredPyqs = pyqItems.filter((item) => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return true;
    return item.name.toLowerCase().includes(query);
  });

  const hasAnyResults = filteredChapters.length > 0 || filteredCustomTopics.length > 0 || filteredPyqs.length > 0;

  return (
    <Protected>
      <div className="mx-auto w-full max-w-4xl space-y-8">
        <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
              {sem.title} · {sub.code}
            </div>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-foreground">
              {sub.title}
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {sub.chapters.length} units in this subject
            </p>
          </div>

          {/* Search bar inside the subject */}
          <div className="relative w-full md:max-w-xs shrink-0">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search units or notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs border border-border rounded-xl bg-secondary/20 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-foreground placeholder:text-muted-foreground transition-all"
            />
          </div>
        </div>

        {hasAnyResults ? (
          <>
            {/* Units / Syllabus Portions */}
            {filteredChapters.length > 0 && (
              <div className="space-y-3">
                <h2 className="text-lg font-semibold text-foreground border-b border-border/60 pb-1.5 mb-4">
                  Syllabus Units
                </h2>
                {filteredChapters.map((ch: typeof sub.chapters[number], i: number) => {
                  const originalIndex = sub.chapters.findIndex((c) => c.id === ch.id);
                  return (
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
                            Unit {originalIndex + 1}
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
                  );
                })}
              </div>
            )}

            {/* Subject-level Custom Topics (General/Extra Topics) */}
            {filteredCustomTopics.length > 0 && (
              <div className="space-y-3 pt-4">
                <h2 className="text-lg font-semibold text-foreground border-b border-border/60 pb-1.5 mb-4">
                  General / Extra Topics
                </h2>
                <div className="space-y-3">
                  {filteredCustomTopics.map((topic) => (
                    <div
                      key={topic.id}
                      onClick={() =>
                        navigate({
                          to: "/semester/$semId/$subjectId/$chapterId/$topicId",
                          params: { semId: sem.id, subjectId: sub.id, chapterId: "general", topicId: topic.id },
                        })
                      }
                      className="group flex items-center justify-between gap-4 border border-border p-5 rounded-xl bg-card hover:shadow-md cursor-pointer transition-all duration-200"
                    >
                      <div className="flex items-center gap-4">
                        <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
                          <BookOpen className="h-5 w-5" />
                        </div>
                        <div>
                          <div className="text-xs font-medium text-muted-foreground">General Resource</div>
                          <div className="text-base font-semibold text-foreground">{topic.title}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {role === "admin" && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (confirm(`Are you sure you want to delete custom topic "${topic.title}"?`)) {
                                removeCustomTopic(subCustomKey, topic.id);
                                toast.success("Topic deleted");
                              }
                            }}
                            className="h-8 w-8 text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                        <ChevronRight className="h-5 w-5 text-muted-foreground transition-transform duration-200 group-hover:translate-x-1 group-hover:text-primary" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* PYQs, Revisions & Class Notes Section */}
            {filteredPyqs.length > 0 && (
              <div className="pt-6 border-t border-border space-y-4">
                <div className="flex items-center justify-between border-b border-border/60 pb-2">
                  <div className="flex items-center gap-2">
                    <FileQuestion className="h-5 w-5 text-primary" />
                    <h2 className="text-lg font-semibold text-foreground">
                      PYQs, Revisions & Class Notes ({filteredPyqs.length})
                    </h2>
                  </div>
                  {role === "admin" && (
                    <Button
                      size="sm"
                      onClick={() => setUploadOpen(true)}
                      className="gap-1.5 h-8 text-xs bg-primary text-primary-foreground hover:bg-primary/90"
                    >
                      <Plus className="h-3.5 w-3.5" /> Upload PYQ
                    </Button>
                  )}
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {filteredPyqs.map(item => (
                    <div 
                      key={item.id} 
                      className="flex items-center justify-between gap-4 bg-secondary/35 border border-border/40 rounded-xl p-4 shadow-sm hover:shadow hover:bg-secondary/40 transition-all duration-200 cursor-pointer"
                      onClick={() => setPreviewFile({ url: resolveItemUrl(item), name: item.name })}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                          <FileText className="h-4.5 w-4.5" />
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-sm font-semibold text-foreground truncate">{item.name}</h4>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {item.size ? `${(item.size / 1024).toFixed(1)} KB` : "Document"}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <Button size="sm" variant="outline" className="h-8 px-2.5 gap-1 text-xs">
                          <FileText className="h-3.5 w-3.5" /> View
                        </Button>
                        {role === "admin" && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => {
                              e.stopPropagation();
                              removeContent(pyqKey, item.id);
                              toast.success("PYQ deleted");
                            }}
                            className="h-8 w-8 text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="flex flex-col items-center justify-center p-16 border border-dashed border-border rounded-xl text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary text-muted-foreground mb-4">
              <Search className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-semibold text-foreground">No search matches found</h3>
            <p className="text-xs text-muted-foreground mt-1 max-w-md">
              We couldn't find any units, custom topics, or PYQ papers matching "{searchQuery}". Try using different terms.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSearchQuery("")}
              className="mt-4 text-xs"
            >
              Clear Search Query
            </Button>
          </div>
        )}

        {uploadOpen && (
          <UploadModal
            open={uploadOpen}
            onOpenChange={setUploadOpen}
            defaultSemesterId={sem.id}
            defaultSubjectId={sub.id}
            defaultMaterialType="pyq"
          />
        )}

        {/* Dynamic File Viewer Modal */}
        {previewFile && (
          <Dialog open={!!previewFile} onOpenChange={(open) => !open && setPreviewFile(null)}>
            <DialogContent className="sm:max-w-[85vw] w-full max-h-[90vh] flex flex-col p-6">
              <DialogHeader className="flex flex-row items-center justify-between border-b pb-3 border-border">
                <div>
                  <DialogTitle className="text-base font-bold text-foreground flex items-center gap-2">
                    <FileText className="h-5 w-5 text-primary" /> {previewFile.name}
                  </DialogTitle>
                </div>
                <div className="flex items-center gap-2 pr-6">
                  <a href={previewFile.url} download={previewFile.name}>
                    <Button size="sm" className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90">
                      <Download className="h-4 w-4" /> Download PDF
                    </Button>
                  </a>
                </div>
              </DialogHeader>
              <div className="flex-1 mt-4 aspect-video w-full overflow-hidden rounded-xl border border-border bg-muted shadow-inner">
                <iframe
                  className="h-full w-full bg-card"
                  src={previewFile.url}
                  title={previewFile.name}
                />
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </Protected>
  );
}
