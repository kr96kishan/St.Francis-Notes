import { useState, useEffect } from "react";
import { Trash2, FileText, Youtube, FileQuestion, BookOpen, AlertCircle } from "lucide-react";
import { toast } from "sonner";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { syllabus } from "@/lib/syllabus";
import { 
  useUploadedContent, 
  useRemoveContent, 
  useCustomTopics, 
  useRemoveCustomTopic,
  buildTopicKey, 
  buildChapterKey 
} from "@/lib/content-store";

interface DeleteModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DeleteModal({ open, onOpenChange }: DeleteModalProps) {
  const [semId, setSemId] = useState<string>("");
  const [subId, setSubId] = useState<string>("");
  const [chId, setChId] = useState<string>("");
  const [topicId, setTopicId] = useState<string>("");
  const [activeTab, setActiveTab] = useState<string>("topic-content");

  const selectedSem = syllabus.find(s => s.id === semId);
  const selectedSub = selectedSem?.subjects.find(s => s.id === subId);
  const selectedCh = selectedSub?.chapters.find(c => c.id === chId);

  const chapterKey = selectedSem && selectedSub && selectedCh ? buildChapterKey(selectedSem.id, selectedSub.id, selectedCh.id) : "";
  const customTopics = useCustomTopics(chapterKey);
  const allTopics = selectedCh ? [...selectedCh.topics, ...customTopics] : [];

  const topicKey = selectedSem && selectedSub && selectedCh && topicId ? buildTopicKey(selectedSem.id, selectedSub.id, selectedCh.id, topicId) : "";
  const topicMaterials = useUploadedContent(topicKey);

  const pyqKey = selectedSem && selectedSub ? `${selectedSem.id}/${selectedSub.id}/pyqs` : "";
  const pyqMaterials = useUploadedContent(pyqKey);

  const removeContent = useRemoveContent();
  const removeCustomTopic = useRemoveCustomTopic();

  const handleReset = () => {
    setSemId("");
    setSubId("");
    setChId("");
    setTopicId("");
  };

  useEffect(() => {
    if (!open) handleReset();
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-destructive flex items-center gap-2">
            <Trash2 className="h-5 w-5" /> Manage & Delete Content
          </DialogTitle>
          <DialogDescription>
            Locate and delete materials, PYQs, or custom topics from the system.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-3">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Semester</Label>
              <Select value={semId} onValueChange={(val) => { setSemId(val); setSubId(""); setChId(""); setTopicId(""); }}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Select Semester" />
                </SelectTrigger>
                <SelectContent>
                  {syllabus.map(sem => (
                    <SelectItem key={sem.id} value={sem.id}>{sem.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Subject</Label>
              <Select disabled={!selectedSem} value={subId} onValueChange={(val) => { setSubId(val); setChId(""); setTopicId(""); }}>
                <SelectTrigger className="h-9">
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

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Unit / Chapter</Label>
              <Select disabled={!selectedSub} value={chId} onValueChange={(val) => { setChId(val); setTopicId(""); }}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Select Unit" />
                </SelectTrigger>
                <SelectContent>
                  {selectedSub?.chapters.map(ch => (
                    <SelectItem key={ch.id} value={ch.id}>{ch.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Topic</Label>
              <Select disabled={!selectedCh} value={topicId} onValueChange={setTopicId}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Select Topic" />
                </SelectTrigger>
                <SelectContent>
                  {allTopics.map(t => (
                    <SelectItem key={t.id} value={t.id}>{t.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full pt-3 border-t border-border">
            <TabsList className="grid w-full grid-cols-3 bg-muted rounded-lg p-0.5 h-9">
              <TabsTrigger value="topic-content" className="text-xs">Topic Notes</TabsTrigger>
              <TabsTrigger value="pyqs" className="text-xs">PYQs & Class Notes</TabsTrigger>
              <TabsTrigger value="custom-topics" className="text-xs">Custom Topics</TabsTrigger>
            </TabsList>

            {/* TAB: Topic Notes */}
            <TabsContent value="topic-content" className="pt-4 space-y-3">
              {!topicKey ? (
                <div className="flex items-center gap-2 text-xs text-muted-foreground bg-secondary/35 p-3 rounded-lg">
                  <AlertCircle className="h-4 w-4" /> Please select Semester, Subject, Unit, and Topic to view uploaded files.
                </div>
              ) : topicMaterials.length > 0 ? (
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Uploaded Materials ({topicMaterials.length})</Label>
                  <div className="space-y-2 border border-border/80 rounded-xl p-3 bg-card max-h-[160px] overflow-y-auto">
                    {topicMaterials.map(item => (
                      <div key={item.id} className="flex items-center justify-between gap-3 bg-secondary/30 rounded-lg p-2.5 border border-border/20">
                        <div className="flex items-center gap-2 min-w-0">
                          {item.type === "youtube" ? (
                            <Youtube className="h-4 w-4 text-red-500 shrink-0" />
                          ) : (
                            <FileText className="h-4 w-4 text-primary shrink-0" />
                          )}
                          <span className="text-xs font-semibold text-foreground truncate">{item.name}</span>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            removeContent(topicKey, item.id);
                            toast.success("Material deleted successfully");
                          }}
                          className="h-7 w-7 text-destructive hover:bg-destructive/10 shrink-0"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center p-6 border border-dashed border-border rounded-xl">
                  <p className="text-xs text-muted-foreground">No notes or videos uploaded for this topic.</p>
                </div>
              )}
            </TabsContent>

            {/* TAB: PYQs */}
            <TabsContent value="pyqs" className="pt-4 space-y-3">
              {!subId ? (
                <div className="flex items-center gap-2 text-xs text-muted-foreground bg-secondary/35 p-3 rounded-lg">
                  <AlertCircle className="h-4 w-4" /> Please select Semester and Subject to view uploaded PYQ papers.
                </div>
              ) : pyqMaterials.length > 0 ? (
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Uploaded PYQs & Class Notes ({pyqMaterials.length})</Label>
                  <div className="space-y-2 border border-border/80 rounded-xl p-3 bg-card max-h-[160px] overflow-y-auto">
                    {pyqMaterials.map(item => (
                      <div key={item.id} className="flex items-center justify-between gap-3 bg-secondary/30 rounded-lg p-2.5 border border-border/20">
                        <div className="flex items-center gap-2 min-w-0">
                          <FileQuestion className="h-4 w-4 text-primary shrink-0" />
                          <span className="text-xs font-semibold text-foreground truncate">{item.name}</span>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            removeContent(pyqKey, item.id);
                            toast.success("PYQ deleted successfully");
                          }}
                          className="h-7 w-7 text-destructive hover:bg-destructive/10 shrink-0"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center p-6 border border-dashed border-border rounded-xl">
                  <p className="text-xs text-muted-foreground">No PYQs uploaded for this subject yet.</p>
                </div>
              )}
            </TabsContent>

            {/* TAB: Custom Topics */}
            <TabsContent value="custom-topics" className="pt-4 space-y-3">
              {!chId ? (
                <div className="flex items-center gap-2 text-xs text-muted-foreground bg-secondary/35 p-3 rounded-lg">
                  <AlertCircle className="h-4 w-4" /> Please select Semester, Subject, and Unit to view custom topics.
                </div>
              ) : customTopics.length > 0 ? (
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Custom Topics under Unit ({customTopics.length})</Label>
                  <div className="space-y-2 border border-border/80 rounded-xl p-3 bg-card max-h-[160px] overflow-y-auto">
                    {customTopics.map(topic => (
                      <div key={topic.id} className="flex items-center justify-between gap-3 bg-secondary/30 rounded-lg p-2.5 border border-border/20">
                        <div className="flex items-center gap-2 min-w-0">
                          <BookOpen className="h-4 w-4 text-primary shrink-0" />
                          <span className="text-xs font-semibold text-foreground truncate">{topic.title}</span>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            if (confirm(`Delete custom topic "${topic.title}" and all its materials?`)) {
                              removeCustomTopic(chapterKey, topic.id);
                              toast.success("Custom topic and resources deleted");
                              setTopicId("");
                            }
                          }}
                          className="h-7 w-7 text-destructive hover:bg-destructive/10 shrink-0"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center p-6 border border-dashed border-border rounded-xl">
                  <p className="text-xs text-muted-foreground">No custom topics created for this unit yet.</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>

        <div className="flex justify-end gap-2 border-t border-border pt-4">
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>Close Manager</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
