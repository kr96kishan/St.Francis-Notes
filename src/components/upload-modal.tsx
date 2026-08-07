import { useState, useRef, type ChangeEvent } from "react";
import { UploadCloud, Youtube, Link2, FileText, FileQuestion, Check, Video, Image as ImageIcon, Film } from "lucide-react";
import { toast } from "sonner";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

import { syllabus } from "@/lib/syllabus";
import { useAuth } from "@/lib/auth-context";
import { 
  useAddContent, 
  extractYouTubeId, 
  buildTopicKey, 
  useAddCustomTopic, 
  buildChapterKey, 
  useCustomTopics,
  isImageFile,
  isVideoFile,
  fileToDataUrl
} from "@/lib/content-store";
import { ingestYouTubeUrl, ingestLocalVideoFile } from "@/lib/ingestion";

interface UploadModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultSemesterId?: string;
  defaultSubjectId?: string;
  defaultChapterId?: string;
  defaultTopicId?: string;
  defaultMaterialType?: "file" | "video" | "youtube" | "pyq";
}

export function UploadModal({ 
  open, 
  onOpenChange, 
  defaultSemesterId,
  defaultSubjectId,
  defaultChapterId,
  defaultTopicId,
  defaultMaterialType = "file"
}: UploadModalProps) {
  const { name: currentUserName } = useAuth();
  const [semId, setSemId] = useState<string>(defaultSemesterId || "");
  const [subId, setSubId] = useState<string>(defaultSubjectId || "");
  const [chId, setChId] = useState<string>(defaultChapterId || "");
  const [topicId, setTopicId] = useState<string>(defaultTopicId || "");

  const [customTopicTitle, setCustomTopicTitle] = useState("");
  const [materialTitle, setMaterialTitle] = useState("");
  const [materialType, setMaterialType] = useState<"file" | "video" | "pyq">(
    defaultMaterialType === "youtube" ? "video" : (defaultMaterialType as "file" | "video" | "pyq")
  );
  const [videoSource, setVideoSource] = useState<"file" | "youtube">("youtube");
  const [ytUrl, setYtUrl] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const [showSuccess, setShowSuccess] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const addContent = useAddContent();
  const addCustomTopic = useAddCustomTopic();

  const selectedSem = syllabus.find(s => s.id === semId);
  const selectedSub = selectedSem?.subjects.find(s => s.id === subId);
  
  const isSubjectCustomTopic = chId === "__subject_custom_topic__";
  
  const selectedCh = !isSubjectCustomTopic && selectedSub
    ? selectedSub.chapters.find(c => c.id === chId)
    : null;
  
  const chapterKey = selectedSem && selectedSub && selectedCh 
    ? buildChapterKey(selectedSem.id, selectedSub.id, selectedCh.id) 
    : "";
  
  const existingCustomTopics = useCustomTopics(chapterKey);
  const allTopics = selectedCh ? [...selectedCh.topics, ...existingCustomTopics] : [];

  const handleReset = () => {
    setSemId(defaultSemesterId || "");
    setSubId(defaultSubjectId || "");
    setChId(defaultChapterId || "");
    setTopicId(defaultTopicId || "");
    setCustomTopicTitle("");
    setMaterialTitle("");
    setMaterialType(defaultMaterialType === "youtube" ? "video" : (defaultMaterialType as "file" | "video" | "pyq"));
    setVideoSource("youtube");
    setYtUrl("");
    setSelectedFile(null);
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const triggerSuccessScreen = () => {
    setShowSuccess(true);
    setTimeout(() => {
      onOpenChange(false);
      handleReset();
      setShowSuccess(false);
    }, 2000);
  };

  const handleSubmit = async () => {
    if (!semId || !selectedSem) {
      toast.error("Invalid or missing Semester selection.");
      return;
    }
    if (!subId || !selectedSub) {
      toast.error("Invalid or missing Subject selection.");
      return;
    }

    // Subject-wide PYQ / Revision Upload
    if (materialType === "pyq") {
      if (!selectedFile) {
        toast.error("Please select a file to upload.");
        return;
      }
      if (selectedFile.size > 1024 * 1024 * 1024) {
        toast.error("File exceeds the 1 GB size limit.");
        return;
      }
      const pyqKey = `${selectedSem.id}/${selectedSub.id}/pyqs`;
      const customName = materialTitle.trim() || selectedFile.name;
      const isVid = isVideoFile({ name: selectedFile.name, mime: selectedFile.type });

      let fileDataUrl = "";
      if (selectedFile.size <= 50 * 1024 * 1024) {
        try {
          fileDataUrl = await fileToDataUrl(selectedFile);
        } catch (e) {
          console.error(e);
        }
      }

      addContent(pyqKey, {
        type: isVid ? "video" : "file",
        name: customName,
        size: selectedFile.size,
        mime: selectedFile.type,
        fileBlob: selectedFile,
        url: fileDataUrl,
        uploadedBy: currentUserName || "Admin",
      });

      triggerSuccessScreen();
      return;
    }

    // Topic-specific validations (file/video)
    if (!chId) {
      toast.error("Invalid or missing Unit/Chapter selection.");
      return;
    }

    let finalTopicId = topicId;

    if (isSubjectCustomTopic) {
      if (!customTopicTitle.trim()) {
        toast.error("Please enter a title for the custom topic.");
        return;
      }
      const subCustomKey = buildChapterKey(selectedSem.id, selectedSub.id, "general");
      const newTopic = addCustomTopic(subCustomKey, {
        title: customTopicTitle,
        content: "Custom topic materials",
      });
      finalTopicId = newTopic.id;
    } else {
      if (!topicId || !allTopics.find(t => t.id === topicId)) {
        toast.error("Please select a valid Topic.");
        return;
      }
    }

    const targetChId = isSubjectCustomTopic ? "general" : selectedCh!.id;
    const topicKey = buildTopicKey(selectedSem.id, selectedSub.id, targetChId, finalTopicId);

    if (materialType === "video") {
      if (videoSource === "youtube") {
        if (!ytUrl.trim()) {
          toast.error("Please paste a YouTube URL.");
          return;
        }
        const videoId = extractYouTubeId(ytUrl);
        if (!videoId) {
          toast.error("Invalid YouTube URL. Please verify the link.");
          return;
        }

        const title = materialTitle.trim() || `YouTube Lecture (${videoId})`;

        addContent(topicKey, {
          type: "youtube",
          name: title,
          url: ytUrl,
          uploadedBy: currentUserName || "Admin",
        });

        try {
          toast.loading("Indexing video for Francis AI...", { id: "video-index" });
          await ingestYouTubeUrl(ytUrl, {
            semester: selectedSem.title,
            subject: selectedSub.title,
            source_type: "youtube_video",
            source_title: title,
          });
          toast.success(`✓ Indexed for Francis AI: "${title}"`, { id: "video-index" });
        } catch (err) {
          console.error("YouTube video ingestion error:", err);
          toast.error("Video uploaded but indexing failed. Francis AI may not detect it.", { id: "video-index" });
        }

        triggerSuccessScreen();
      } else {
        // Local Video File Upload
        if (!selectedFile) {
          toast.error("Please upload a local video file.");
          return;
        }
        if (selectedFile.size > 1024 * 1024 * 1024) {
          toast.error("Video file exceeds the 1 GB size limit.");
          return;
        }
        let vidDataUrl = "";
        if (selectedFile.size <= 50 * 1024 * 1024) {
          try {
            vidDataUrl = await fileToDataUrl(selectedFile);
          } catch (e) {
            console.error(e);
          }
        }

        const title = materialTitle.trim() || selectedFile.name;

        addContent(topicKey, {
          type: "video",
          name: title,
          size: selectedFile.size,
          mime: selectedFile.type,
          fileBlob: selectedFile,
          url: vidDataUrl,
          uploadedBy: currentUserName || "Admin",
        });

        try {
          toast.loading("Indexing video for Francis AI...", { id: "video-index" });
          await ingestLocalVideoFile(selectedFile, {
            semester: selectedSem.title,
            subject: selectedSub.title,
            source_type: "local_video",
            source_title: title,
          });
          toast.success(`✓ Indexed for Francis AI: "${title}"`, { id: "video-index" });
        } catch (err) {
          console.error("Local video ingestion error:", err);
          toast.error("Video uploaded but indexing failed. Francis AI may not detect it.", { id: "video-index" });
        }

        triggerSuccessScreen();
      }
    } else {
      // General File / Document / Photo Upload
      if (!selectedFile) {
        toast.error("Please upload a local file or image.");
        return;
      }
      if (selectedFile.size > 1024 * 1024 * 1024) {
        toast.error("File exceeds the 1 GB size limit.");
        return;
      }

      const isVid = isVideoFile({ name: selectedFile.name, mime: selectedFile.type });

      let docDataUrl = "";
      if (selectedFile.size <= 50 * 1024 * 1024) {
        try {
          docDataUrl = await fileToDataUrl(selectedFile);
        } catch (e) {
          console.error(e);
        }
      }

      addContent(topicKey, {
        type: isVid ? "video" : "file",
        name: materialTitle.trim() || selectedFile.name,
        size: selectedFile.size,
        mime: selectedFile.type,
        fileBlob: selectedFile,
        url: docDataUrl,
        uploadedBy: currentUserName || "Admin",
      });
      triggerSuccessScreen();
    }
  };

  const getFileBadge = () => {
    if (!selectedFile) return null;
    if (isVideoFile({ name: selectedFile.name, mime: selectedFile.type })) {
      return (
        <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded bg-blue-500/10 text-blue-500">
          <Video className="h-3 w-3" /> Video File
        </span>
      );
    }
    if (isImageFile({ name: selectedFile.name, mime: selectedFile.type })) {
      return (
        <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-500">
          <ImageIcon className="h-3 w-3" /> Photo / Image
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded bg-amber-500/10 text-amber-500">
        <FileText className="h-3 w-3" /> Document / PDF
      </span>
    );
  };

  return (
    <Dialog open={open} onOpenChange={(val) => {
      if (showSuccess) return; // Prevent manual close during success screen
      onOpenChange(val);
      if (!val) handleReset();
    }}>
      <DialogContent className="sm:max-w-[550px]">
        {showSuccess ? (
          <div className="flex flex-col items-center justify-center py-10 text-center space-y-4 animate-in fade-in duration-300">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500 text-white animate-[scaleIn_0.3s_ease-out] shadow-lg shadow-emerald-500/20">
              <Check className="h-9 w-9 stroke-[3]" />
            </div>
            <div className="space-y-1">
              <h3 className="text-xl font-bold text-foreground">Uploaded Successfully</h3>
              <p className="text-sm text-muted-foreground">The material has been deployed to the portal.</p>
            </div>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Upload Material</DialogTitle>
              <DialogDescription>
                Attach PDFs, photos, video lectures (local files or YouTube), or subject PYQs.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Semester</Label>
                  <Select value={semId} onValueChange={(val) => { setSemId(val); setSubId(""); setChId(""); setTopicId(""); }}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select Semester" />
                    </SelectTrigger>
                    <SelectContent>
                      {syllabus.map(sem => (
                        <SelectItem key={sem.id} value={sem.id}>{sem.title}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Subject</Label>
                  <Select disabled={!selectedSem} value={subId} onValueChange={(val) => { setSubId(val); setChId(""); setTopicId(""); }}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select Subject" />
                    </SelectTrigger>
                    <SelectContent>
                      {selectedSem?.subjects.map(sub => (
                        <SelectItem key={sub.id} value={sub.id}>{sub.code} - {sub.title}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {materialType !== "pyq" && (
                <>
                  <div className="space-y-2">
                    <Label>Unit / Chapter</Label>
                    <Select disabled={!selectedSub} value={chId} onValueChange={(val) => { setChId(val); setTopicId(""); }}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select Unit" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__subject_custom_topic__" className="text-primary font-semibold">
                          + Custom Topic (Subject Level)
                        </SelectItem>
                        {selectedSub?.chapters.map(ch => (
                          <SelectItem key={ch.id} value={ch.id}>{ch.title}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {chId && (
                    <div className="space-y-3 pt-2 border-t border-border">
                      {isSubjectCustomTopic ? (
                        <div className="space-y-2 animate-in fade-in slide-in-from-top-1 duration-200">
                          <Label>Custom Topic Name</Label>
                          <Input 
                            placeholder="Enter custom topic title..." 
                            value={customTopicTitle}
                            onChange={e => setCustomTopicTitle(e.target.value)}
                            autoFocus
                          />
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <Label>Syllabus Topic</Label>
                          <Select value={topicId} onValueChange={setTopicId}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select Topic" />
                            </SelectTrigger>
                            <SelectContent>
                              {allTopics.map(topic => (
                                <SelectItem key={topic.id} value={topic.id}>{topic.title}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}

              <div className="pt-4 border-t border-border space-y-3">
                <Label>Material Category</Label>
                <RadioGroup 
                  value={materialType} 
                  onValueChange={(val) => {
                    setMaterialType(val as "file" | "video" | "pyq");
                    setSelectedFile(null);
                    setYtUrl("");
                  }}
                  className="flex flex-wrap gap-4 mt-1"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="file" id="opt-file" />
                    <Label htmlFor="opt-file" className="cursor-pointer font-normal flex items-center gap-1.5 text-xs sm:text-sm">
                      <FileText className="h-4 w-4 text-muted-foreground" /> PDF, Notes & Photos
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="video" id="opt-video" />
                    <Label htmlFor="opt-video" className="cursor-pointer font-normal flex items-center gap-1.5 text-xs sm:text-sm">
                      <Video className="h-4 w-4 text-muted-foreground" /> Video Lecture
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="pyq" id="opt-pyq" />
                    <Label htmlFor="opt-pyq" className="cursor-pointer font-normal flex items-center gap-1.5 text-xs sm:text-sm">
                      <FileQuestion className="h-4 w-4 text-muted-foreground" /> PYQs & Revisions
                    </Label>
                  </div>
                </RadioGroup>

                {/* Optional Material Title */}
                <div className="space-y-1.5 pt-2">
                  <Label>Display Title / Description (Optional)</Label>
                  <Input 
                    placeholder="e.g. Unit 1 Video Lecture, 2024 Exam Paper, Lab Diagram..." 
                    value={materialTitle}
                    onChange={e => setMaterialTitle(e.target.value)}
                  />
                </div>

                {/* Video Lecture specific source selection */}
                {materialType === "video" && (
                  <div className="space-y-3 pt-2">
                    <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Video Source</Label>
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        type="button"
                        variant={videoSource === "file" ? "default" : "outline"}
                        size="sm"
                        onClick={() => { setVideoSource("file"); setYtUrl(""); }}
                        className="gap-2 text-xs"
                      >
                        <Film className="h-4 w-4" /> Upload Local Video
                      </Button>
                      <Button
                        type="button"
                        variant={videoSource === "youtube" ? "default" : "outline"}
                        size="sm"
                        onClick={() => { setVideoSource("youtube"); setSelectedFile(null); }}
                        className="gap-2 text-xs"
                      >
                        <Youtube className="h-4 w-4" /> YouTube Link
                      </Button>
                    </div>

                    {videoSource === "youtube" ? (
                      <div className="relative mt-2">
                        <Link2 className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input 
                          placeholder="https://youtube.com/watch?v=..." 
                          className="pl-9"
                          value={ytUrl}
                          onChange={e => setYtUrl(e.target.value)}
                        />
                      </div>
                    ) : (
                      <div className="space-y-2 mt-2">
                        <div className="flex flex-wrap items-center gap-3">
                          <input
                            ref={fileInputRef}
                            type="file"
                            className="hidden"
                            accept="video/*,.mp4,.webm,.mov,.avi,.mkv"
                            onChange={handleFileChange}
                          />
                          <Button variant="outline" type="button" onClick={() => fileInputRef.current?.click()} className="gap-2">
                            <UploadCloud className="h-4 w-4" /> Choose Video File
                          </Button>
                          {getFileBadge()}
                        </div>
                        <span className="text-xs text-muted-foreground block">
                          {selectedFile ? `${selectedFile.name} (${(selectedFile.size / (1024 * 1024)).toFixed(1)} MB)` : "Supported: MP4, WEBM, MOV, MKV up to 1 GB"}
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {/* Local file inputs for "file" or "pyq" */}
                {(materialType === "file" || materialType === "pyq") && (
                  <div className="mt-3 space-y-2">
                    <div className="flex flex-wrap items-center gap-3">
                      <input
                        ref={fileInputRef}
                        type="file"
                        className="hidden"
                        accept=".pdf,.docx,.pptx,.xlsx,.txt,.jpg,.jpeg,.png,.gif,.webp,.svg,.mp4,.webm,.mov,.avi,.mkv,image/*,video/*,application/pdf"
                        onChange={handleFileChange}
                      />
                      <Button variant="outline" type="button" onClick={() => fileInputRef.current?.click()} className="gap-2">
                        <UploadCloud className="h-4 w-4" /> Choose Local File
                      </Button>
                      {getFileBadge()}
                    </div>
                    <span className="text-xs text-muted-foreground block">
                      {selectedFile 
                        ? `${selectedFile.name} (${(selectedFile.size / (1024 * 1024)).toFixed(1)} MB)` 
                        : "Supported: PDFs, Photos (PNG, JPG, WEBP), Videos (MP4, WEBM), Docs up to 1 GB"
                      }
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-2 border-t border-border pt-4">
              <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button onClick={handleSubmit}>Deploy Material</Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
