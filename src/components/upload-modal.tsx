import { useState, useRef, type ChangeEvent } from "react";
import { UploadCloud, Youtube, Link2, FileText, FileQuestion, Check } from "lucide-react";
import { toast } from "sonner";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

import { syllabus } from "@/lib/syllabus";
import { useAddContent, fileToDataUrl, extractYouTubeId, buildTopicKey, useAddCustomTopic, buildChapterKey, useCustomTopics } from "@/lib/content-store";

interface UploadModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultSemesterId?: string;
  defaultSubjectId?: string;
  defaultChapterId?: string;
  defaultTopicId?: string;
  defaultMaterialType?: "file" | "youtube" | "pyq";
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
  const [semId, setSemId] = useState<string>(defaultSemesterId || "");
  const [subId, setSubId] = useState<string>(defaultSubjectId || "");
  const [chId, setChId] = useState<string>(defaultChapterId || "");
  const [topicId, setTopicId] = useState<string>(defaultTopicId || "");

  const [customTopicTitle, setCustomTopicTitle] = useState("");
  const [pyqTitle, setPyqTitle] = useState("");
  const [materialType, setMaterialType] = useState<"file" | "youtube" | "pyq">(defaultMaterialType);
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
    setPyqTitle("");
    setMaterialType(defaultMaterialType);
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

    // Subject-wide PYQ Upload
    if (materialType === "pyq") {
      if (!selectedFile) {
        toast.error("Please upload a local PYQ/Revision document.");
        return;
      }
      if (selectedFile.size > 1024 * 1024 * 1024) {
        toast.error("File exceeds the 1 GB size limit.");
        return;
      }
      const pyqKey = `${selectedSem.id}/${selectedSub.id}/pyqs`;
      const customName = pyqTitle.trim() || selectedFile.name;
      
      addContent(pyqKey, {
        type: "file",
        name: customName,
        size: selectedFile.size,
        mime: selectedFile.type,
        fileBlob: selectedFile,
      });

      triggerSuccessScreen();
      return;
    }

    // Topic-specific validations (file/youtube)
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

    if (materialType === "file") {
      if (!selectedFile) {
        toast.error("Please upload a local file/document.");
        return;
      }
      if (selectedFile.size > 1024 * 1024 * 1024) {
        toast.error("File exceeds the 1 GB size limit.");
        return;
      }
      addContent(topicKey, {
        type: "file",
        name: selectedFile.name,
        size: selectedFile.size,
        mime: selectedFile.type,
        fileBlob: selectedFile,
      });
      triggerSuccessScreen();
    } else {
      if (!ytUrl.trim()) {
        toast.error("Please paste a YouTube URL.");
        return;
      }
      const videoId = extractYouTubeId(ytUrl);
      if (!videoId) {
        toast.error("Invalid YouTube URL. Please verify the link.");
        return;
      }

      addContent(topicKey, {
        type: "youtube",
        name: "Video Lecture",
        url: ytUrl,
      });
      triggerSuccessScreen();
    }
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
                Attach syllabus notes, YouTube lectures, or subject PYQs & class notes.
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
                <Label>Material Attachment Option</Label>
                <RadioGroup 
                  value={materialType} 
                  onValueChange={(val) => {
                    setMaterialType(val as "file" | "youtube" | "pyq");
                    setSelectedFile(null);
                    setYtUrl("");
                  }}
                  className="flex flex-wrap gap-4 mt-1"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="file" id="opt-file" />
                    <Label htmlFor="opt-file" className="cursor-pointer font-normal flex items-center gap-1.5 text-xs sm:text-sm">
                      <FileText className="h-4 w-4 text-muted-foreground" /> Topic Notes
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="youtube" id="opt-youtube" />
                    <Label htmlFor="opt-youtube" className="cursor-pointer font-normal flex items-center gap-1.5 text-xs sm:text-sm">
                      <Youtube className="h-4 w-4 text-muted-foreground" /> Video Lecture
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="pyq" id="opt-pyq" />
                    <Label htmlFor="opt-pyq" className="cursor-pointer font-normal flex items-center gap-1.5 text-xs sm:text-sm">
                      <FileQuestion className="h-4 w-4 text-muted-foreground" /> PYQ/Revision/Class Notes
                    </Label>
                  </div>
                </RadioGroup>

                {materialType === "file" || materialType === "pyq" ? (
                  <div className="mt-3 space-y-3">
                    {materialType === "pyq" && (
                      <div className="space-y-1.5 animate-in fade-in duration-200">
                        <Label>Material Title / Description</Label>
                        <Input 
                          placeholder="e.g. 2024 End Sem Exam Paper, Unit 1 Class Notes..." 
                          value={pyqTitle}
                          onChange={e => setPyqTitle(e.target.value)}
                        />
                      </div>
                    )}

                    <div className="flex items-center gap-3">
                      <input
                        ref={fileInputRef}
                        type="file"
                        className="hidden"
                        accept=".pdf,.docx,.pptx,.jpg,.png"
                        onChange={handleFileChange}
                      />
                      <Button variant="outline" type="button" onClick={() => fileInputRef.current?.click()} className="gap-2">
                        <UploadCloud className="h-4 w-4" /> Choose Local File
                      </Button>
                      <span className="text-xs text-muted-foreground">
                        {selectedFile ? selectedFile.name : "No file chosen (PDF, DOCX up to 5 MB)"}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="mt-3 relative">
                    <Link2 className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input 
                      placeholder="https://youtube.com/watch?v=..." 
                      className="pl-9"
                      value={ytUrl}
                      onChange={e => setYtUrl(e.target.value)}
                    />
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
