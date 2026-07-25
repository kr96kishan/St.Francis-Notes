import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useRef, useEffect, type FormEvent } from "react";
import { useServerFn } from "@tanstack/react-start";
import { askAssistantChat, generateStudyKit, type StudyKitData, type Citation } from "@/lib/ai-assistant.functions";
import { ingestDocument, ingestYouTubeUrl, ingestLocalVideoFile } from "@/lib/ingestion";
import { getAllChunks, type NoteEmbeddingChunk } from "@/lib/vector-store";
import { syllabus } from "@/lib/syllabus";
import {
  ArrowLeft,
  BookOpen,
  Brain,
  Check,
  ChevronRight,
  Database,
  FileText,
  HelpCircle,
  Layers,
  Link2,
  Plus,
  RotateCcw,
  Send,
  ShieldCheck,
  Sparkles,
  Target,
  Upload,
  Video,
  Youtube,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";

export const Route = createFileRoute("/chat")({
  head: () => ({
    meta: [
      { title: "AI Study Engine & Assistant — St. Francis Notes" },
      {
        name: "description",
        content: "Vector-grounded AI Study Engine & NotebookLM workspace for BCA students.",
      },
    ],
  }),
  component: WorkspacePage,
});

type ChatMsg = {
  id: string;
  role: "user" | "assistant";
  text: string;
  citations?: Citation[];
};

function WorkspacePage() {
  const navigate = useNavigate();
  const askChatFn = useServerFn(askAssistantChat);
  const genKitFn = useServerFn(generateStudyKit);

  // ── State ──
  const [selectedSem, setSelectedSem] = useState<string>("Semester 1");
  const [selectedSub, setSelectedSub] = useState<string>("Discrete Structures");

  const [activeTab, setActiveTab] = useState<"quiz" | "flashcards" | "takeaways" | "chunks">("quiz");
  const [studyKit, setStudyKit] = useState<StudyKitData | null>(null);
  const [loadingKit, setLoadingKit] = useState<boolean>(false);

  // Chat State
  const [messages, setMessages] = useState<ChatMsg[]>([
    {
      id: "m0",
      role: "assistant",
      text: "👋 Welcome to St. Francis College **AI Study Engine**!\n\nSelect your **Semester** and **Subject** on the left. You can ask questions, generate a NotebookLM study kit, or ingest custom PDFs and YouTube lectures into the vector database.",
    },
  ]);
  const [inputMsg, setInputMsg] = useState("");
  const [sendingMsg, setSendingMsg] = useState(false);

  // Ingestion Inputs
  const [ytUrl, setYtUrl] = useState("");
  const [ingesting, setIngesting] = useState(false);
  const [allVectorChunks, setAllVectorChunks] = useState<NoteEmbeddingChunk[]>([]);
  const docFileRef = useRef<HTMLInputElement>(null);
  const videoFileRef = useRef<HTMLInputElement>(null);

  // Current semester subjects
  const currentSemObj = syllabus.find((s) => s.title === selectedSem) ?? syllabus[0];
  const availableSubjects = currentSemObj.subjects;

  // Refresh vector stats
  const refreshVectorStats = () => {
    setAllVectorChunks([...getAllChunks()]);
  };

  useEffect(() => {
    refreshVectorStats();
    // Auto load study kit for current semester & subject
    handleGenerateStudyKit();
  }, [selectedSem, selectedSub]);

  // ── Study Kit Generator ──
  async function handleGenerateStudyKit() {
    setLoadingKit(true);
    try {
      const res = await genKitFn({ data: { semester: selectedSem, subject: selectedSub } });
      if (res.ok && res.data) {
        setStudyKit(res.data);
      } else {
        toast.error("Could not load study kit");
      }
    } catch {
      toast.error("Error generating study kit");
    } finally {
      setLoadingKit(false);
    }
  }

  // ── Ingestion Handlers ──
  async function handleDocUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setIngesting(true);
    try {
      const text = await file.text();
      const chunks = await ingestDocument(crypto.randomUUID(), text, {
        semester: selectedSem,
        subject: selectedSub,
        source_type: "pdf",
        source_title: file.name,
      });
      refreshVectorStats();
      toast.success(`Ingested "${file.name}" into vector database (${chunks.length} chunks)!`);
    } catch {
      toast.error("Failed to parse document");
    } finally {
      setIngesting(false);
      e.target.value = "";
    }
  }

  async function handleYtIngest() {
    if (!ytUrl.trim()) return;
    setIngesting(true);
    try {
      const chunks = await ingestYouTubeUrl(ytUrl.trim(), {
        semester: selectedSem,
        subject: selectedSub,
        source_type: "youtube",
        source_title: `YouTube Lecture (${ytUrl.slice(0, 30)})`,
      });
      refreshVectorStats();
      setYtUrl("");
      toast.success(`YouTube video ingested (${chunks.length} timestamped chunks)!`);
    } catch {
      toast.error("Failed to ingest YouTube video");
    } finally {
      setIngesting(false);
    }
  }

  async function handleVideoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setIngesting(true);
    try {
      const chunks = await ingestLocalVideoFile(file, {
        semester: selectedSem,
        subject: selectedSub,
        source_type: "video",
        source_title: file.name,
      });
      refreshVectorStats();
      toast.success(`Local video "${file.name}" processed & vectorized!`);
    } catch {
      toast.error("Failed to process video file");
    } finally {
      setIngesting(false);
      e.target.value = "";
    }
  }

  // ── Chat Handler ──
  async function handleSendChat(e: FormEvent) {
    e.preventDefault();
    if (!inputMsg.trim() || sendingMsg) return;

    const userText = inputMsg.trim();
    const userMsg: ChatMsg = { id: crypto.randomUUID(), role: "user", text: userText };
    setMessages((prev) => [...prev, userMsg]);
    setInputMsg("");
    setSendingMsg(true);

    try {
      const historyTurns = messages.map((m) => ({ role: m.role, text: m.text }));
      const res = await askChatFn({
        data: {
          message: userText,
          semester: selectedSem,
          subject: selectedSub,
          history: historyTurns,
        },
      });

      if (res.ok) {
        setMessages((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            role: "assistant",
            text: res.answer,
            citations: res.citations,
          },
        ]);
      } else {
        toast.error(res.error || "Chat failed");
      }
    } catch (err) {
      toast.error("AI Request Error");
    } finally {
      setSendingMsg(false);
    }
  }

  return (
    <div className="dark min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* ── Header ── */}
      <header className="sticky top-0 z-40 border-b border-white/10 bg-slate-950/90 backdrop-blur-xl">
        <div className="flex h-14 items-center gap-3 px-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate({ to: "/" })}
            className="gap-2 text-slate-300 hover:bg-white/5 hover:text-white px-2"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Back</span>
          </Button>

          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 shrink-0">
              <Brain className="h-4 w-4 text-white" />
            </div>
            <div>
              <div className="text-sm font-bold flex items-center gap-1.5">
                <span>AI Study Engine</span>
                <Badge variant="outline" className="border-indigo-500/40 bg-indigo-500/10 text-indigo-300 text-[10px] py-0">
                  Vector Grounded
                </Badge>
              </div>
              <div className="text-[10px] text-slate-400">Bengaluru City University · BCA</div>
            </div>
          </div>

          <div className="ml-auto flex items-center gap-2">
            <Button
              onClick={handleGenerateStudyKit}
              disabled={loadingKit}
              size="sm"
              className="gap-2 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white font-medium shadow-md"
            >
              <Sparkles className="h-4 w-4" />
              <span>{loadingKit ? "Generating..." : "Reload Study Kit"}</span>
            </Button>
          </div>
        </div>
      </header>

      {/* ── Main 3-Column Layout ── */}
      <div className="flex-1 flex overflow-hidden">
        {/* ── Left Sidebar: Ingestion & Filters ── */}
        <aside className="w-80 shrink-0 border-r border-white/10 bg-slate-900/50 flex flex-col overflow-y-auto p-4 space-y-5">
          {/* Semester Selector */}
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2 block">
              Semester Filter
            </label>
            <select
              value={selectedSem}
              onChange={(e) => {
                setSelectedSem(e.target.value);
                const firstSub = syllabus.find((s) => s.title === e.target.value)?.subjects[0]?.title;
                if (firstSub) setSelectedSub(firstSub);
              }}
              className="w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-xs font-medium text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              {syllabus.map((sem) => (
                <option key={sem.id} value={sem.title}>
                  {sem.title}
                </option>
              ))}
            </select>
          </div>

          {/* Subject Selector */}
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2 block">
              Subject Context
            </label>
            <div className="space-y-1 max-h-48 overflow-y-auto pr-1">
              {availableSubjects.map((sub) => {
                const isActive = selectedSub === sub.title;
                return (
                  <button
                    key={sub.id}
                    onClick={() => setSelectedSub(sub.title)}
                    className={`flex w-full items-center justify-between rounded-xl p-2.5 text-left text-xs transition-all ${
                      isActive
                        ? "bg-indigo-500/20 border border-indigo-500/40 text-white font-semibold shadow-sm"
                        : "border border-white/5 bg-white/[0.02] text-slate-300 hover:bg-white/5"
                    }`}
                  >
                    <span className="truncate">{sub.title}</span>
                    {isActive && <Check className="h-3.5 w-3.5 text-indigo-400 shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Ingestion Hub */}
          <div className="border-t border-white/10 pt-4">
            <div className="text-xs font-semibold uppercase tracking-wider text-indigo-400 mb-3 flex items-center gap-1.5">
              <Database className="h-3.5 w-3.5" /> Vector Ingestion Pipeline
            </div>

            <div className="space-y-2">
              {/* Document Upload */}
              <button
                onClick={() => docFileRef.current?.click()}
                disabled={ingesting}
                className="flex w-full items-center gap-2.5 rounded-xl border border-indigo-500/30 bg-indigo-500/10 p-2.5 text-xs text-indigo-200 hover:bg-indigo-500/20 transition-all font-medium disabled:opacity-50"
              >
                <FileText className="h-4 w-4 text-indigo-400 shrink-0" />
                <span>Upload PDF / Document</span>
              </button>
              <input
                ref={docFileRef}
                type="file"
                accept=".pdf,.txt,.doc,.docx"
                className="hidden"
                onChange={handleDocUpload}
              />

              {/* YouTube Ingestion */}
              <div className="flex gap-1">
                <Input
                  value={ytUrl}
                  onChange={(e) => setYtUrl(e.target.value)}
                  placeholder="Paste YouTube Link"
                  className="h-9 border-white/10 bg-slate-950 text-xs placeholder:text-slate-500"
                />
                <Button
                  size="sm"
                  onClick={handleYtIngest}
                  disabled={ingesting || !ytUrl.trim()}
                  className="h-9 px-3 bg-red-500 hover:bg-red-400 text-white shrink-0"
                >
                  <Youtube className="h-4 w-4" />
                </Button>
              </div>

              {/* Video Upload */}
              <button
                onClick={() => videoFileRef.current?.click()}
                disabled={ingesting}
                className="flex w-full items-center gap-2.5 rounded-xl border border-purple-500/30 bg-purple-500/10 p-2.5 text-xs text-purple-200 hover:bg-purple-500/20 transition-all font-medium disabled:opacity-50"
              >
                <Video className="h-4 w-4 text-purple-400 shrink-0" />
                <span>Upload Local Video (MP4)</span>
              </button>
              <input
                ref={videoFileRef}
                type="file"
                accept="video/*"
                className="hidden"
                onChange={handleVideoUpload}
              />
            </div>
          </div>

          {/* Vector Index Stats */}
          <div className="border-t border-white/10 pt-4 text-xs text-slate-400 space-y-1">
            <div className="flex justify-between">
              <span>Vector Table:</span>
              <span className="font-mono text-emerald-400">note_embeddings</span>
            </div>
            <div className="flex justify-between">
              <span>Total Ingested Chunks:</span>
              <span className="font-semibold text-white">{allVectorChunks.length}</span>
            </div>
          </div>
        </aside>

        {/* ── Center Canvas: NotebookLM Interactive Study Kit ── */}
        <main className="flex-1 flex flex-col overflow-y-auto p-6 bg-slate-950">
          {/* Navigation Tabs */}
          <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-6">
            <div className="flex gap-2">
              {[
                { id: "quiz", label: "Interactive Quiz", icon: Target },
                { id: "flashcards", label: "Flashcards", icon: Layers },
                { id: "takeaways", label: "Key Takeaways", icon: Zap },
                { id: "chunks", label: "Vector Chunks", icon: Database },
              ].map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-semibold transition-all ${
                      isActive
                        ? "bg-indigo-500 text-white shadow-md shadow-indigo-500/30"
                        : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
                    }`}
                  >
                    <tab.icon className="h-4 w-4" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Tab Content */}
          <div className="flex-1">
            {loadingKit ? (
              <div className="flex flex-col items-center justify-center h-64 text-center">
                <Brain className="h-10 w-10 text-indigo-400 animate-pulse mb-3" />
                <div className="text-sm font-semibold text-white">Synthesizing NotebookLM Study Kit...</div>
                <div className="text-xs text-slate-400 mt-1">Generating MCQs, Flashcards, and Takeaways for {selectedSub}</div>
              </div>
            ) : (
              <>
                {/* Quiz View */}
                {activeTab === "quiz" && studyKit?.quiz && (
                  <QuizView quizData={studyKit.quiz} subject={selectedSub} />
                )}

                {/* Flashcards View */}
                {activeTab === "flashcards" && studyKit?.flashcards && (
                  <FlashcardView cards={studyKit.flashcards} />
                )}

                {/* Takeaways View */}
                {activeTab === "takeaways" && studyKit?.takeaways && (
                  <div className="max-w-2xl mx-auto space-y-4">
                    <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                      <Zap className="h-5 w-5 text-amber-400" /> Core Takeaways — {selectedSub}
                    </h3>
                    {studyKit.takeaways.map((point, i) => (
                      <div key={i} className="flex gap-3 rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4">
                        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-amber-500/20 text-xs font-bold text-amber-300">
                          {i + 1}
                        </div>
                        <p className="text-sm text-slate-200 leading-relaxed">{point}</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Vector Chunks View */}
                {activeTab === "chunks" && (
                  <div className="max-w-3xl mx-auto space-y-3">
                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">
                      Active Ingested Chunks ({allVectorChunks.length})
                    </h3>
                    {allVectorChunks.length === 0 ? (
                      <div className="text-center p-8 border border-dashed border-white/10 rounded-2xl text-slate-500 text-xs">
                        No vector chunks ingested yet. Use the left panel to upload documents or YouTube lectures.
                      </div>
                    ) : (
                      allVectorChunks.map((c) => (
                        <div key={c.id} className="rounded-xl border border-white/10 bg-slate-900/60 p-3.5 space-y-2">
                          <div className="flex items-center justify-between text-xs text-indigo-300">
                            <span className="font-semibold">{c.metadata.source_title}</span>
                            <Badge variant="outline" className="text-[10px] text-slate-400 border-white/10">
                              {c.metadata.source_type}
                            </Badge>
                          </div>
                          <p className="text-xs text-slate-300 font-mono leading-relaxed">{c.chunk_content}</p>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </main>

        {/* ── Right Panel: Vector AI Chat ── */}
        <aside className="w-96 shrink-0 border-l border-white/10 bg-slate-900/60 flex flex-col">
          <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600">
                <Sparkles className="h-3.5 w-3.5 text-white" />
              </div>
              <div>
                <div className="text-xs font-bold text-white">Francis AI Tutor</div>
                <div className="text-[10px] text-emerald-400">Vector Grounded</div>
              </div>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
            {messages.map((m) => (
              <div key={m.id} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                {m.role === "assistant" && (
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 mr-2 mt-1">
                    <Sparkles className="h-3 w-3 text-white" />
                  </div>
                )}
                <div
                  className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-xs ${
                    m.role === "user"
                      ? "bg-indigo-500 text-white rounded-br-sm"
                      : "border border-white/10 bg-white/5 text-slate-100 rounded-bl-sm"
                  }`}
                >
                  <div className="whitespace-pre-wrap leading-relaxed">{m.text}</div>
                  {m.citations && m.citations.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-white/10 space-y-1">
                      <div className="text-[10px] font-semibold text-indigo-300">Citations:</div>
                      {m.citations.map((c, i) => (
                        <div key={i} className="text-[9px] text-slate-400 bg-black/30 p-1 rounded">
                          📌 <strong>{c.sourceTitle}</strong> ({c.sourceType})
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {sendingMsg && (
              <div className="text-xs text-slate-400 italic">Francis AI is querying vector index...</div>
            )}
          </div>

          {/* Input Form */}
          <form onSubmit={handleSendChat} className="border-t border-white/10 p-3 flex gap-2">
            <Input
              value={inputMsg}
              onChange={(e) => setInputMsg(e.target.value)}
              placeholder={`Ask about ${selectedSub}...`}
              className="h-9 border-white/10 bg-slate-950 text-xs placeholder:text-slate-500"
            />
            <Button
              type="submit"
              size="icon"
              disabled={sendingMsg || !inputMsg.trim()}
              className="h-9 w-9 bg-indigo-500 hover:bg-indigo-400 text-white shrink-0"
            >
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </aside>
      </div>
    </div>
  );
}

// ─── Quiz View Component ───────────────────────────────────────────────────
function QuizView({ quizData, subject }: { quizData: any[]; subject: string }) {
  const [idx, setIdx] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [showResult, setShowResult] = useState(false);

  const q = quizData[idx];

  if (!q) return null;

  function submitAnswer() {
    if (selected === null) return;
    if (selected === q.correctIndex) setScore((s) => s + 1);

    if (idx + 1 >= quizData.length) {
      setShowResult(true);
    } else {
      setIdx((i) => i + 1);
      setSelected(null);
    }
  }

  if (showResult) {
    return (
      <div className="max-w-xl mx-auto p-8 text-center border border-white/10 bg-slate-900/60 rounded-3xl">
        <div className="text-5xl mb-3">🎯</div>
        <h3 className="text-xl font-bold text-white mb-2">Quiz Complete!</h3>
        <p className="text-xs text-slate-400 mb-4">Subject: {subject}</p>
        <div className="text-2xl font-extrabold text-indigo-400 mb-4">
          {score} / {quizData.length} Correct
        </div>
        <Progress value={(score / quizData.length) * 100} className="mb-6" />
        <Button
          onClick={() => {
            setIdx(0);
            setSelected(null);
            setScore(0);
            setShowResult(false);
          }}
          className="bg-indigo-500 hover:bg-indigo-400"
        >
          Retake Quiz
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6 border border-white/10 bg-slate-900/50 rounded-3xl space-y-5">
      <div className="flex justify-between items-center text-xs text-slate-400">
        <span>Question {idx + 1} of {quizData.length}</span>
        <span>Score: {score}</span>
      </div>

      <div className="text-base font-bold text-white leading-snug">{q.question}</div>

      <div className="space-y-2">
        {q.options.map((opt: string, i: number) => {
          const isSelected = selected === i;
          return (
            <button
              key={i}
              onClick={() => setSelected(i)}
              className={`flex w-full items-center gap-3 rounded-xl border p-3.5 text-left text-xs transition-all ${
                isSelected
                  ? "border-indigo-400 bg-indigo-500/20 text-white font-medium"
                  : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10"
              }`}
            >
              <div className="flex h-5 w-5 items-center justify-center rounded-full border border-current text-[10px] shrink-0">
                {String.fromCharCode(65 + i)}
              </div>
              <span>{opt}</span>
            </button>
          );
        })}
      </div>

      <Button
        onClick={submitAnswer}
        disabled={selected === null}
        className="w-full bg-indigo-500 hover:bg-indigo-400 disabled:opacity-40"
      >
        Submit Answer
      </Button>
    </div>
  );
}

// ─── Flashcard View Component ──────────────────────────────────────────────
function FlashcardView({ cards }: { cards: any[] }) {
  const [idx, setIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const card = cards[idx];

  if (!card) return null;

  return (
    <div className="max-w-xl mx-auto flex flex-col items-center space-y-6">
      <div className="flex justify-between w-full text-xs text-slate-400">
        <span>Card {idx + 1} of {cards.length}</span>
        <span>Tap to flip</span>
      </div>

      <button
        onClick={() => setFlipped((f) => !f)}
        className="min-h-[240px] w-full flex flex-col items-center justify-center rounded-3xl border border-white/10 bg-gradient-to-b from-slate-900 to-slate-950 p-8 text-center shadow-xl transition-all active:scale-98"
      >
        <div className="text-[10px] uppercase font-bold tracking-wider text-indigo-400 mb-3">
          {flipped ? "Answer" : "Question / Concept"}
        </div>
        <p className="text-base font-semibold text-white leading-relaxed">
          {flipped ? card.back : card.front}
        </p>
      </button>

      <div className="flex gap-3 w-full">
        <Button
          variant="outline"
          onClick={() => {
            setFlipped(false);
            setIdx((i) => (i + 1) % cards.length);
          }}
          className="flex-1 border-white/10 bg-white/5 text-slate-300 hover:bg-white/10"
        >
          Next Card <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </div>
    </div>
  );
}
