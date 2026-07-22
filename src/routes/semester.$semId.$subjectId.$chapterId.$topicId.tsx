import { createFileRoute, notFound } from "@tanstack/react-router";
import { Download, ExternalLink, FileText, Play, Trash2, Youtube, Image as ImageIcon, Film, Video } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";
import JSZip from "jszip";

import { Protected } from "@/components/protected";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAuth } from "@/lib/auth-context";
import { findChapter, findSemester, findSubject, findTopic } from "@/lib/syllabus";
import {
  buildTopicKey,
  buildChapterKey,
  getYouTubeEmbedUrl,
  useUploadedContent,
  useRemoveContent,
  useCustomTopics,
  resolveItemUrl,
  isImageFile,
  isVideoFile,
  isPdfFile,
  type UploadedItem,
} from "@/lib/content-store";

export const Route = createFileRoute(
  "/semester/$semId/$subjectId/$chapterId/$topicId",
)({
  loader: ({ params }) => {
    const sem = findSemester(params.semId);
    const sub = findSubject(params.semId, params.subjectId);
    let ch = findChapter(params.semId, params.subjectId, params.chapterId);
    if (params.chapterId === "general") {
      ch = { id: "general", title: "General Resources", topics: [] };
    }
    const topic = findTopic(
      params.semId,
      params.subjectId,
      params.chapterId,
      params.topicId,
    );
    if (!sem || !sub || !ch) throw notFound();
    return { sem, sub, ch, topic, topicId: params.topicId };
  },
  component: TopicPage,
});

function TopicPage() {
  const { sem, sub, ch, topic, topicId } = Route.useLoaderData();
  const { role } = useAuth();
  const topicKey = buildTopicKey(sem.id, sub.id, ch.id, topicId);
  const items = useUploadedContent(topicKey);
  const removeContent = useRemoveContent();
  const chapterKey = buildChapterKey(sem.id, sub.id, ch.id);
  const customTopics = useCustomTopics(chapterKey);
  const customTopic = customTopics.find(t => t.id === topicId);

  const title = topic?.title || customTopic?.title || "Custom Topic";

  const videoItems = items.filter((i) => i.type === "youtube" || i.type === "video" || isVideoFile(i));
  const fileItems = items.filter((i) => i.type !== "youtube" && i.type !== "video" && !isVideoFile(i));

  const [previewFile, setPreviewFile] = useState<{ url: string; name: string; item?: UploadedItem } | null>(null);
  const [activeMaterial, setActiveMaterial] = useState<UploadedItem | null>(null);

  return (
    <Protected>
      <div className="mx-auto w-full max-w-4xl">
        <div className="mb-8">
          <div className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
            {sem.title} · {sub.title} · {ch.title}
          </div>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-foreground">
            {title}
          </h1>
        </div>

        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
          {videoItems.length > 0 && (
            <div className="space-y-4">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <Play className="h-4 w-4 text-primary" />
                Video Lectures ({videoItems.length})
              </h3>
              {videoItems.map((item) => {
                const isLocalVid = item.type === "video" || isVideoFile(item);
                const embedUrl = item.type === "youtube" ? getYouTubeEmbedUrl(item.url) : null;
                const itemUrl = isLocalVid ? resolveItemUrl(item) : item.url;

                return (
                  <Card key={item.id} className="overflow-hidden border-border relative group shadow-sm">
                    <CardContent className="p-0">
                      {isLocalVid ? (
                        <div className="aspect-video w-full bg-black">
                          <video
                            controls
                            controlsList="nodownload"
                            src={itemUrl}
                            className="h-full w-full object-contain"
                          />
                        </div>
                      ) : embedUrl ? (
                        <div className="aspect-video w-full bg-black">
                          <iframe
                            className="h-full w-full"
                            src={embedUrl}
                            title={item.name}
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                          />
                        </div>
                      ) : null}
                      <div className="flex items-center justify-between px-5 py-3 bg-secondary/20 border-t border-border/40">
                        <div className="flex items-center gap-3">
                          {isLocalVid ? (
                            <Film className="h-5 w-5 text-blue-500 shrink-0" />
                          ) : (
                            <Youtube className="h-5 w-5 text-red-500 shrink-0" />
                          )}
                          <div>
                            <span className="text-sm font-semibold text-foreground block">{item.name}</span>
                            <div className="text-xs text-muted-foreground mt-0.5 flex flex-wrap items-center gap-1.5">
                              <span>
                                {isLocalVid 
                                  ? (item.size ? `${(item.size / (1024 * 1024)).toFixed(1)} MB · Local Video` : "Local Video") 
                                  : "YouTube Stream"}
                              </span>
                              <span>·</span>
                              <span>Uploaded by <strong className="font-semibold text-foreground">{item.uploadedBy || "Admin"}</strong></span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {!isLocalVid && (
                            <a
                              href={item.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline bg-primary/10 px-3 py-1.5 rounded-lg"
                            >
                              Open in YouTube <ExternalLink className="h-3 w-3" />
                            </a>
                          )}
                          {role === "admin" && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive hover:bg-destructive/10"
                              onClick={() => {
                                removeContent(topicKey, item.id);
                                toast.success("Video material removed");
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          {fileItems.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-border/40 pb-2 mb-3">
                <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
                  <FileText className="h-4 w-4 text-primary" />
                  Study Notes, Photos & Documents ({fileItems.length})
                </h3>
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1.5 h-8 text-xs border-primary/20 hover:bg-primary/5 text-primary"
                  onClick={async () => {
                    const toastId = toast.loading("Packaging files into a ZIP...");
                    try {
                      const zip = new JSZip();
                      for (const item of fileItems) {
                        let blob: Blob;
                        if (item.fileBlob) {
                          blob = item.fileBlob;
                        } else {
                          const response = await fetch(item.url);
                          blob = await response.blob();
                        }
                        zip.file(item.name, blob);
                      }
                      
                      const content = await zip.generateAsync({ type: "blob" });
                      const zipUrl = URL.createObjectURL(content);
                      
                      const link = document.createElement("a");
                      link.href = zipUrl;
                      link.download = `${title.replace(/[^a-z0-9]/gi, "_").toLowerCase()}_materials.zip`;
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                      
                      toast.success("Downloaded all files as a ZIP archive!", { id: toastId });
                    } catch (error) {
                      console.error(error);
                      toast.error("Failed to generate ZIP archive.", { id: toastId });
                    }
                  }}
                >
                  <Download className="h-3.5 w-3.5" />
                  Download All Files as ZIP
                </Button>
              </div>
              {fileItems.map((item) => {
                const isImg = isImageFile(item);
                const isPdf = isPdfFile(item);

                return (
                  <Card 
                    key={item.id} 
                    className={`border-border bg-secondary/30 hover:bg-secondary/40 transition-colors cursor-pointer ${activeMaterial?.id === item.id ? "ring-2 ring-primary/40" : ""}`}
                    onClick={() => {
                      setActiveMaterial(item);
                      setPreviewFile({ url: resolveItemUrl(item), name: item.name, item });
                    }}
                  >
                    <CardContent className="flex items-center justify-between gap-4 p-4">
                      <div className="flex items-center gap-4">
                        <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
                          {isImg ? (
                            <ImageIcon className="h-5 w-5 text-emerald-500" />
                          ) : (
                            <FileText className="h-5 w-5 text-primary" />
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-foreground">{item.name}</span>
                            {isImg && (
                              <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-500 uppercase tracking-wide">
                                Photo / Image
                              </span>
                            )}
                            {isPdf && (
                              <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-amber-500/10 text-amber-500 uppercase tracking-wide">
                                PDF
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-muted-foreground mt-0.5">
                            {item.size ? `${(item.size / 1024).toFixed(1)} KB` : "Document"} ·{" "}
                            {new Date(item.uploadedAt).toLocaleDateString()} ·{" "}
                            Uploaded by <span className="font-medium text-foreground">{item.uploadedBy || "Admin"}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button size="sm" variant="outline" className="gap-1 text-xs">
                          {isImg ? <ImageIcon className="h-3.5 w-3.5" /> : <FileText className="h-3.5 w-3.5" />}
                          {isImg ? "View Photo" : "View Document"}
                        </Button>
                        {role === "admin" && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-9 w-9 text-destructive hover:bg-destructive/10"
                            onClick={(e) => {
                              e.stopPropagation();
                              removeContent(topicKey, item.id);
                              toast.success("Material removed");
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          {items.length === 0 && (
            <Card className="border-dashed border-border bg-secondary/30">
              <CardContent className="flex flex-col items-center justify-center gap-3 p-10 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
                  <FileText className="h-6 w-6" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-foreground">No materials uploaded yet</div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    Check back later — {role === "admin" ? "you can upload PDFs, photos, or video lectures for this topic." : "your admin will upload PDFs, photos, and video lectures here."}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Dynamic File & Image & Video Previewer Modal */}
        {previewFile && (
          <Dialog open={!!previewFile} onOpenChange={(open) => !open && setPreviewFile(null)}>
            <DialogContent className="sm:max-w-[85vw] w-full max-h-[90vh] flex flex-col p-6">
              <DialogHeader className="flex flex-row items-center justify-between border-b pb-3 border-border">
                <div>
                  <DialogTitle className="text-base font-bold text-foreground flex items-center gap-2">
                    {previewFile.item && isImageFile(previewFile.item) ? (
                      <ImageIcon className="h-5 w-5 text-emerald-500" />
                    ) : previewFile.item && isVideoFile(previewFile.item) ? (
                      <Video className="h-5 w-5 text-blue-500" />
                    ) : (
                      <FileText className="h-5 w-5 text-primary" />
                    )}
                    {previewFile.name}
                  </DialogTitle>
                  <p className="text-xs text-muted-foreground mt-1">
                    Uploaded by <span className="font-semibold text-foreground">{previewFile.item?.uploadedBy || "Admin"}</span>
                  </p>
                </div>
                <div className="flex items-center gap-2 pr-6">
                  <a href={previewFile.url} download={previewFile.name}>
                    <Button size="sm" className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90">
                      <Download className="h-4 w-4" /> Download File
                    </Button>
                  </a>
                </div>
              </DialogHeader>
              <div className="flex-1 mt-4 aspect-video w-full overflow-hidden rounded-xl border border-border bg-muted shadow-inner flex items-center justify-center">
                {previewFile.item && isImageFile(previewFile.item) ? (
                  <div className="flex items-center justify-center p-4 w-full h-full bg-black/40 overflow-auto">
                    <img 
                      src={previewFile.url} 
                      alt={previewFile.name} 
                      className="max-h-[70vh] w-auto max-w-full rounded-lg object-contain mx-auto shadow-2xl" 
                    />
                  </div>
                ) : previewFile.item && isVideoFile(previewFile.item) ? (
                  <video 
                    controls 
                    autoPlay 
                    src={previewFile.url} 
                    className="max-h-[75vh] w-full bg-black object-contain"
                  />
                ) : (
                  <iframe
                    className="h-full w-full bg-card"
                    src={previewFile.url}
                    title={previewFile.name}
                  />
                )}
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </Protected>
  );
}
