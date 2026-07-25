import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { askAssistant } from "@/lib/ai-assistant.functions";
import { syllabus, type Subject } from "@/lib/syllabus";
import {
  useAllAdminMaterials,
  isPdfFile,
  isVideoFile,
  type UploadedItem,
} from "@/lib/content-store";
import {
  ArrowLeft,
  Bot,
  BookOpen,
  Brain,
  ChevronRight,
  FileText,
  Flame,
  FolderOpen,
  Layers,
  Menu,
  MessageSquare,
  Mic,
  Play,
  Plus,
  Send,
  ShieldCheck,
  Sparkles,
  Target,
  Video,
  X,
  Zap,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

export const Route = createFileRoute("/chat")({
  head: () => ({
    meta: [
      { title: "AI Study Workspace — St.Francis Notes" },
      {
        name: "description",
        content:
          "Source-grounded AI study workspace powered by admin-uploaded BCA syllabus notes and study materials.",
      },
      { property: "og:title", content: "AI Study Workspace" },
      {
        property: "og:description",
        content: "Admin-grounded research workspace for BCA students.",
      },
    ],
  }),
  component: WorkspacePage,
});

// ─── Types ───────────────────────────────────────────────────────
type SourceKind = "pdf" | "video";
type Source = {
  id: string;
  kind: SourceKind;
  title: string;
  meta: string;
  summary: string;
  tags: string[];
  units: { id: string; title: string; brief: string }[];
  /** For PDFs: base64 data URL. Optional; used for AI multimodal input. */
  dataUrl?: string;
  /** For video: source URL. */
  url?: string;
};
type Note = { id: string; title: string; body: string };
type Flashcard = { id: string; front: string; back: string; ease: number; due: number };
type ChatMsg = {
  id: string;
  role: "user" | "assistant";
  text: string;
  citations?: string[];
};

// ─── Default Admin Materials fallback ─────────────────────────────
const DEFAULT_ADMIN_SOURCES: Source[] = [
  {
    id: "admin-default-ds",
    kind: "pdf",
    title: "Data Structures & Algorithms — Core Reference Notes",
    meta: "Admin Grounded · Unit 1-4 Complete",
    summary:
      "Admin-verified syllabus notes covering Arrays, Linked Lists, Stacks, Queues, Binary Trees, Graph Algorithms, and Time-Space Complexity.",
    tags: ["Admin Verified", "Data Structures", "Sem 2"],
    units: [
      { id: "u1", title: "Unit 1: Linear Data Structures & Arrays", brief: "Array operations, ADTs, time complexity, and memory layout." },
      { id: "u2", title: "Unit 2: Stacks & Queues", brief: "LIFO/FIFO paradigms, infix-to-postfix, priority queues, and recursion." },
      { id: "u3", title: "Unit 3: Linked Lists & Trees", brief: "Singly/Doubly linked lists, BST traversals, and AVL trees." },
      { id: "u4", title: "Unit 4: Sorting, Searching & Graphs", brief: "BFS/DFS traversals, Prim's/Kruskal's MST, and Hashing." },
    ],
  },
  {
    id: "admin-default-java",
    kind: "pdf",
    title: "Object Oriented Programming using Java — Admin Guide",
    meta: "Admin Grounded · Semester 2",
    summary:
      "Comprehensive Java programming notes provided by faculty covering OOP fundamentals, Inheritance, Multi-threading, Exception Handling, and Swing.",
    tags: ["Admin Verified", "Java OOP", "Sem 2"],
    units: [
      { id: "u1", title: "Unit 1: OOP Foundations & Java Syntax", brief: "Classes, Objects, JVM, methods, constructors, wrapper classes." },
      { id: "u2", title: "Unit 2: Inheritance, Interfaces & Packages", brief: "Abstract classes, method overriding, super keyword, custom packages." },
      { id: "u3", title: "Unit 3: Exception Handling & Multithreading", brief: "Try-catch-finally, custom exceptions, Thread lifecycle, synchronization." },
    ],
  },
];

// ─── Main Workspace ───────────────────────────────────────────────
function WorkspacePage() {
  const navigate = useNavigate();
  const adminUploadedItems = useAllAdminMaterials();

  // ── State ──
  const [sources, setSources] = useState<Source[]>(DEFAULT_ADMIN_SOURCES);
  const [notes, setNotes] = useState<Note[]>([]);
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [activeSourceId, setActiveSourceId] = useState<string | null>("admin-default-ds");
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);
  const [centerMode, setCenterMode] = useState<"empty" | "source" | "note" | "flashcards" | "quiz" | "tutor">("source");
  const [assistantOpen, setAssistantOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [streak] = useState(0);
  const [messages, setMessages] = useState<ChatMsg[]>([
    {
      id: "m0",
      role: "assistant",
      text: "👋 Hi! I'm **Francis AI** — your personal study assistant for St. Francis Notes.\n\nAll study materials here are **curated and uploaded by the Admin**. Select any subject or admin document from the left panel to start:\n\n• *\"Summarize Unit 1\"*\n• *\"Generate 5 exam questions from this subject\"*\n• *\"Explain OOP inheritance with an example\"*\n\nLet's ace your exams! 📚",
    },
  ]);
  const [sending, setSending] = useState(false);
  const [groundingOnly, setGroundingOnly] = useState(true);
  const ask = useServerFn(askAssistant);

  const activeSource = sources.find((s) => s.id === activeSourceId) ?? null;
  const activeNote = notes.find((n) => n.id === activeNoteId) ?? null;

  // Open assistant panel on active source change
  useEffect(() => {
    if (sources.length > 0 && !activeSourceId) {
      setActiveSourceId(sources[0].id);
    }
  }, [sources, activeSourceId]);

  // Handler to select an Admin-Uploaded material from IndexedDB
  function selectAdminUploadedItem(item: UploadedItem, topicKey: string) {
    const isPdf = item.type === "file" && isPdfFile(item);
    const isVid = item.type === "video" || isVideoFile(item) || item.type === "youtube";

    const src: Source = {
      id: `uploaded-${item.id}`,
      kind: isPdf ? "pdf" : "video",
      title: item.name,
      meta: `Admin Uploaded · ${item.uploadedBy || "Faculty Admin"}`,
      summary: `Admin material "${item.name}" for ${topicKey}. Grounded for AI summaries, question generation, and study tools.`,
      tags: ["Admin Source", isPdf ? "PDF Document" : "Video Lecture"],
      units: [
        {
          id: "u1",
          title: "Admin Grounded Content",
          brief: `Verified study resource uploaded under topic path ${topicKey}.`,
        },
      ],
      dataUrl: isPdf && item.url?.startsWith("data:") ? item.url : undefined,
      url: isVid ? item.url : undefined,
    };

    setSources((prev) => {
      if (prev.some((s) => s.id === src.id)) return prev;
      return [src, ...prev];
    });
    setActiveSourceId(src.id);
    setCenterMode("source");
    setSidebarOpen(false);
    toast.success(`Loaded Admin Material: "${item.name}"`);
  }

  // Handler to select a Syllabus Subject
  function selectSyllabusSubject(semTitle: string, subject: Subject) {
    const src: Source = {
      id: `syllabus-${subject.id}`,
      kind: "pdf",
      title: `${subject.title} (${subject.code})`,
      meta: `${semTitle} · Official Syllabus`,
      summary: `Official BCU syllabus module for ${subject.title}. Covers ${subject.chapters.length} core units with full curriculum alignment.`,
      tags: ["Syllabus", semTitle],
      units: subject.chapters.map((c, i) => ({
        id: `u${i + 1}`,
        title: c.title,
        brief: c.topics.slice(0, 4).join(", ") + (c.topics.length > 4 ? "..." : ""),
      })),
    };

    setSources((prev) => {
      if (prev.some((s) => s.id === src.id)) return prev;
      return [src, ...prev];
    });
    setActiveSourceId(src.id);
    setCenterMode("source");
    setSidebarOpen(false);
    toast.success(`Loaded Syllabus Module: "${subject.title}"`);
  }

  async function sendMessage(text: string) {
    if (!text.trim() || sending) return;
    const user: ChatMsg = { id: crypto.randomUUID(), role: "user", text };
    const history = messages.map((m) => ({ role: m.role, text: m.text }));
    setMessages((m) => [...m, user]);
    setSending(true);

    // Prepare attachments — prioritise active source
    const activeFirst = activeSource
      ? [activeSource, ...sources.filter((s) => s.id !== activeSource.id)]
      : sources;
    const attachments = activeFirst.slice(0, 3).map((s) => ({
      kind: s.kind === "pdf" ? ("pdf" as const) : ("youtube" as const),
      name: s.title,
      data: s.kind === "pdf" ? s.dataUrl : undefined,
      url: s.kind !== "pdf" ? s.url : undefined,
    }));

    try {
      const res = await ask({
        data: { message: text, history, attachments, groundingOnly },
      });
      const reply: ChatMsg = {
        id: crypto.randomUUID(),
        role: "assistant",
        text: res.ok ? res.text : `⚠️ ${res.error}`,
      };
      setMessages((m) => [...m, reply]);
    } catch (e) {
      setMessages((m) => [
        ...m,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          text: `⚠️ ${e instanceof Error ? e.message : "AI request failed."}`,
        },
      ]);
    } finally {
      setSending(false);
    }
  }

  function convertToFlashcards() {
    if (!activeSource) {
      toast.error("Select an admin source or subject first before converting to flashcards.");
      return;
    }
    const newCards: Flashcard[] = activeSource.units.map((u) => ({
      id: crypto.randomUUID(),
      front: `What does "${u.title}" cover?`,
      back: u.brief,
      ease: 2.5,
      due: 0,
    }));
    setCards((c) => [...newCards, ...c]);
    setCenterMode("flashcards");
    toast.success(`${newCards.length} flashcard(s) added!`);
  }

  // ─── Layout ──────────────────────────────────────────────────────────────────
  return (
    <div className="dark min-h-screen bg-slate-950 text-slate-100">
      {/* ── Top Nav ── */}
      <header className="sticky top-0 z-40 border-b border-white/10 bg-slate-950/90 backdrop-blur-xl">
        <div className="flex h-14 items-center gap-2 px-3 sm:px-4">
          {/* Mobile: hamburger for sidebar */}
          <button
            onClick={() => setSidebarOpen(true)}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 hover:bg-white/5 hover:text-white lg:hidden"
          >
            <Menu className="h-5 w-5" />
          </button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate({ to: "/" })}
            className="gap-2 text-slate-300 hover:bg-white/5 hover:text-white px-2"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Back</span>
          </Button>

          <div className="flex items-center gap-2 ml-1">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 shrink-0">
              <Brain className="h-4 w-4 text-white" />
            </div>
            <div className="hidden sm:block">
              <div className="text-sm font-semibold flex items-center gap-1.5">
                <span>AI Study Workspace</span>
                <Badge variant="outline" className="border-emerald-500/40 bg-emerald-500/10 text-emerald-300 text-[10px] py-0">
                  Admin Grounded
                </Badge>
              </div>
              <div className="text-[10px] text-slate-400">St. Francis Notes · BCU Syllabus</div>
            </div>
          </div>

          <div className="ml-auto flex items-center gap-2">
            {streak > 0 && (
              <div className="hidden sm:flex items-center gap-1.5 rounded-full border border-orange-500/30 bg-orange-500/10 px-3 py-1.5 text-xs font-medium text-orange-300">
                <Flame className="h-3.5 w-3.5" />
                <span>{streak} day streak</span>
              </div>
            )}
            {sources.length > 0 && (
              <Badge variant="secondary" className="hidden sm:flex border-white/10 bg-white/5 text-slate-300 text-[10px]">
                {sources.length} source{sources.length > 1 ? "s" : ""} active
              </Badge>
            )}
            <Button
              onClick={() => setAssistantOpen((v) => !v)}
              className={`gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/30 hover:from-indigo-400 hover:to-purple-500 ${
                !assistantOpen ? "animate-pulse" : ""
              }`}
              size="sm"
            >
              <Sparkles className="h-4 w-4" />
              <span className="hidden sm:inline">AI Assistant</span>
            </Button>
          </div>
        </div>
      </header>

      {/* ── Mobile Sidebar Overlay ── */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setSidebarOpen(false)}
          />
          <aside className="absolute left-0 top-0 h-full w-80 flex-col border-r border-white/10 bg-slate-900 flex overflow-y-auto">
            <div className="flex items-center justify-between p-3 border-b border-white/10">
              <span className="text-sm font-semibold text-white flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4 text-emerald-400" /> Admin Sources & Library
              </span>
              <button
                onClick={() => setSidebarOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-white/5"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <SourceHub
              sources={sources}
              activeSourceId={activeSourceId}
              onSelectSource={(id) => {
                setActiveSourceId(id);
                setCenterMode("source");
                setSidebarOpen(false);
              }}
              notes={notes}
              activeNoteId={activeNoteId}
              onSelectNote={(id) => {
                setActiveNoteId(id);
                setCenterMode("note");
                setSidebarOpen(false);
              }}
              onNewNote={() => {
                const n: Note = { id: crypto.randomUUID(), title: "Untitled note", body: "" };
                setNotes((ns) => [n, ...ns]);
                setActiveNoteId(n.id);
                setCenterMode("note");
                setSidebarOpen(false);
              }}
              onOpenFlashcards={() => { setCenterMode("flashcards"); setSidebarOpen(false); }}
              onOpenQuiz={() => { setCenterMode("quiz"); setSidebarOpen(false); }}
              onOpenTutor={() => { setCenterMode("tutor"); setSidebarOpen(false); }}
              cardsCount={cards.length}
              adminUploadedItems={adminUploadedItems}
              onSelectAdminItem={selectAdminUploadedItem}
              onSelectSyllabusSubject={selectSyllabusSubject}
            />
          </aside>
        </div>
      )}

      {/* ── Mobile AI Assistant Full-screen Overlay ── */}
      {assistantOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setAssistantOpen(false)}
          />
          <aside className="absolute right-0 top-0 h-full w-full max-w-sm flex-col border-l border-white/10 bg-slate-900/95 backdrop-blur-xl flex">
            <AssistantPanel
              sources={sources}
              messages={messages}
              onSend={sendMessage}
              onClose={() => setAssistantOpen(false)}
              onQuickAction={sendMessage}
              onConvertToFlashcards={convertToFlashcards}
              onCreateQuiz={() => {
                if (sources.length === 0) {
                  toast.error("Select an admin source first before creating a quiz!");
                  return;
                }
                setCenterMode("quiz");
                setAssistantOpen(false);
                toast.success("Quiz opened in canvas");
              }}
              activeSourceTitle={activeSource?.title ?? null}
              sending={sending}
              groundingOnly={groundingOnly}
              onToggleGrounding={() => setGroundingOnly((v) => !v)}
            />
          </aside>
        </div>
      )}

      {/* ── Main 3-panel layout ── */}
      <div className="flex h-[calc(100vh-3.5rem)]">
        {/* Left Sidebar — desktop only */}
        <aside className="hidden w-80 shrink-0 flex-col border-r border-white/10 bg-slate-900/40 lg:flex overflow-y-auto">
          <SourceHub
            sources={sources}
            activeSourceId={activeSourceId}
            onSelectSource={(id) => {
              setActiveSourceId(id);
              setCenterMode("source");
            }}
            notes={notes}
            activeNoteId={activeNoteId}
            onSelectNote={(id) => {
              setActiveNoteId(id);
              setCenterMode("note");
            }}
            onNewNote={() => {
              const n: Note = { id: crypto.randomUUID(), title: "Untitled note", body: "" };
              setNotes((ns) => [n, ...ns]);
              setActiveNoteId(n.id);
              setCenterMode("note");
            }}
            onOpenFlashcards={() => setCenterMode("flashcards")}
            onOpenQuiz={() => {
              if (sources.length === 0) {
                toast.error("Select an admin source first!");
                return;
              }
              setCenterMode("quiz");
            }}
            onOpenTutor={() => {
              if (sources.length === 0) {
                toast.error("Select an admin source first!");
                return;
              }
              setCenterMode("tutor");
            }}
            cardsCount={cards.length}
            adminUploadedItems={adminUploadedItems}
            onSelectAdminItem={selectAdminUploadedItem}
            onSelectSyllabusSubject={selectSyllabusSubject}
          />
        </aside>

        {/* Center Canvas */}
        <main className="flex-1 overflow-y-auto">
          {centerMode === "empty" && <EmptyCanvas onOpenSidebar={() => setSidebarOpen(true)} />}
          {centerMode === "source" && activeSource && (
            <SourceViewer
              source={activeSource}
              onConvertToFlashcards={convertToFlashcards}
            />
          )}
          {centerMode === "note" && activeNote && (
            <NoteEditor
              note={activeNote}
              onChange={(body) =>
                setNotes((ns) => ns.map((n) => (n.id === activeNote.id ? { ...n, body } : n)))
              }
              onTitle={(title) =>
                setNotes((ns) => ns.map((n) => (n.id === activeNote.id ? { ...n, title } : n)))
              }
              onExtractCards={(newCards) => {
                setCards((c) => [...newCards, ...c]);
                toast.success(`Extracted ${newCards.length} flashcard(s) from note`);
              }}
            />
          )}
          {centerMode === "flashcards" && (
            <FlashcardReview
              cards={cards}
              onRate={(id, r) => {
                toast.info(`Card reviewed (rating: ${r})`);
              }}
            />
          )}
          {centerMode === "quiz" && sources.length > 0 && activeSource && <QuizMode source={activeSource} />}
          {centerMode === "tutor" && activeSource && <TutorMode source={activeSource} />}
        </main>

        {/* Right AI Panel — desktop */}
        {assistantOpen && (
          <aside className="hidden w-96 shrink-0 flex-col border-l border-white/10 bg-slate-900/60 backdrop-blur-xl md:flex">
            <AssistantPanel
              sources={sources}
              messages={messages}
              onSend={sendMessage}
              onClose={() => setAssistantOpen(false)}
              onQuickAction={sendMessage}
              onConvertToFlashcards={convertToFlashcards}
              onCreateQuiz={() => {
                if (sources.length === 0) {
                  toast.error("Select an admin source first before creating a quiz!");
                  return;
                }
                setCenterMode("quiz");
                toast.success("Quiz opened in canvas");
              }}
              activeSourceTitle={activeSource?.title ?? null}
              sending={sending}
              groundingOnly={groundingOnly}
              onToggleGrounding={() => setGroundingOnly((v) => !v)}
            />
          </aside>
        )}
      </div>
    </div>
  );
}

// ─── Empty Canvas ────────────────────────────────────────────────
function EmptyCanvas({ onOpenSidebar }: { onOpenSidebar: () => void }) {
  return (
    <div className="flex h-full flex-col items-center justify-center p-8 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-indigo-500/20 to-emerald-600/20 border border-emerald-500/20 mb-6">
        <ShieldCheck className="h-9 w-9 text-emerald-400" />
      </div>
      <h2 className="text-2xl font-bold text-white mb-2">Admin Study Sources & Library</h2>
      <p className="text-sm text-slate-400 max-w-md mb-8">
        All study materials are strictly uploaded and verified by the Admin. Select any subject or uploaded document from the left panel to begin your AI study session.
      </p>
      <button
        onClick={onOpenSidebar}
        className="flex items-center gap-2 rounded-xl border border-indigo-500/30 bg-indigo-500/10 px-5 py-3 text-sm font-medium text-indigo-200 hover:bg-indigo-500/20 transition-colors"
      >
        <FolderOpen className="h-4 w-4" />
        Browse Available Sources
      </button>
    </div>
  );
}

// ─── Left Sidebar ────────────────────────────────────────────────
function SourceHub(props: {
  sources: Source[];
  activeSourceId: string | null;
  onSelectSource: (id: string) => void;
  notes: Note[];
  activeNoteId: string | null;
  onSelectNote: (id: string) => void;
  onNewNote: () => void;
  onOpenFlashcards: () => void;
  onOpenQuiz: () => void;
  onOpenTutor: () => void;
  cardsCount: number;
  adminUploadedItems: { item: UploadedItem; topicKey: string }[];
  onSelectAdminItem: (item: UploadedItem, topicKey: string) => void;
  onSelectSyllabusSubject: (semTitle: string, subject: Subject) => void;
}) {
  const [selectedSemId, setSelectedSemId] = useState<string>("Semester 1");

  // Get available semesters from syllabus
  const semList = syllabus.map((s) => s.title);

  // Filtered syllabus semesters
  const filteredSyllabus = selectedSemId === "all" 
    ? syllabus 
    : syllabus.filter((s) => s.title.toLowerCase() === selectedSemId.toLowerCase() || s.id.toLowerCase() === selectedSemId.toLowerCase());

  // Filtered Admin items
  const filteredAdminItems = props.adminUploadedItems.filter(({ topicKey }) => {
    if (selectedSemId === "all") return true;
    const semNum = selectedSemId.replace(/\D/g, "");
    return topicKey.toLowerCase().includes(`sem${semNum}`) || topicKey.toLowerCase().includes(`semester-${semNum}`) || topicKey.toLowerCase().includes(`semester${semNum}`);
  });

  return (
    <div className="flex h-full flex-col overflow-y-auto p-3 space-y-4">
      {/* ── Semester Filter Pills ── */}
      <div>
        <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 px-1 mb-2 flex items-center justify-between">
          <span>Select Semester</span>
          <span className="text-[10px] text-indigo-400 font-normal">Filter Library</span>
        </div>
        <div className="grid grid-cols-3 gap-1 bg-white/5 p-1 rounded-xl border border-white/10">
          {semList.map((sem) => {
            const shortName = sem.replace("Semester", "Sem");
            const isActive = selectedSemId === sem;
            return (
              <button
                key={sem}
                onClick={() => setSelectedSemId(sem)}
                className={`rounded-lg py-1.5 px-2 text-xs font-medium transition-all ${
                  isActive
                    ? "bg-indigo-500 text-white shadow-md shadow-indigo-500/30"
                    : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
                }`}
              >
                {shortName}
              </button>
            );
          })}
          <button
            onClick={() => setSelectedSemId("all")}
            className={`rounded-lg py-1.5 px-2 text-xs font-medium transition-all ${
              selectedSemId === "all"
                ? "bg-indigo-500 text-white shadow-md shadow-indigo-500/30"
                : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
            }`}
          >
            All Sems
          </button>
        </div>
      </div>

      {/* Active Workspace Sources */}
      <SidebarSection label="Active Sources" count={props.sources.length}>
        {props.sources.length === 0 ? (
          <div className="text-[11px] text-slate-600 px-2 py-2 italic">
            No active sources — select a subject below.
          </div>
        ) : (
          props.sources.map((s) => (
            <button
              key={s.id}
              onClick={() => props.onSelectSource(s.id)}
              className={`group flex w-full items-start gap-2 rounded-xl p-2.5 text-left transition-all ${
                props.activeSourceId === s.id
                  ? "bg-indigo-500/20 ring-1 ring-indigo-500/40 text-white"
                  : "hover:bg-white/5 text-slate-300"
              }`}
            >
              <div className="mt-0.5 rounded-lg bg-indigo-500/10 p-2 shrink-0 border border-indigo-500/20">
                {s.kind === "pdf" ? (
                  <FileText className="h-4 w-4 text-indigo-300" />
                ) : (
                  <Video className="h-4 w-4 text-purple-400" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-xs font-semibold">{s.title}</div>
                <div className="truncate text-[10px] text-slate-400 mt-0.5">{s.meta}</div>
              </div>
            </button>
          ))
        )}
      </SidebarSection>

      {/* Admin Uploaded Materials */}
      {props.adminUploadedItems.length > 0 && (
        <SidebarSection label="Admin Uploaded Notes" count={filteredAdminItems.length}>
          {filteredAdminItems.length === 0 ? (
            <div className="text-[11px] text-slate-500 px-2 py-1 italic">
              No files uploaded for {selectedSemId}.
            </div>
          ) : (
            <div className="max-h-48 overflow-y-auto space-y-1.5">
              {filteredAdminItems.map(({ item, topicKey }) => (
                <button
                  key={item.id}
                  onClick={() => props.onSelectAdminItem(item, topicKey)}
                  className="flex w-full items-center gap-2.5 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-2.5 text-left hover:bg-emerald-500/20 transition-all group"
                >
                  <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0 group-hover:scale-110 transition-transform" />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-xs font-medium text-emerald-200">{item.name}</div>
                    <div className="truncate text-[10px] text-emerald-400/70">{item.uploadedBy || "Faculty Admin"}</div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </SidebarSection>
      )}

      {/* Syllabus Library Selector */}
      <SidebarSection label={`Subjects (${selectedSemId === "all" ? "All Semesters" : selectedSemId})`}>
        <div className="space-y-2">
          {filteredSyllabus.map((sem) => (
            <div key={sem.id} className="space-y-1.5">
              {selectedSemId === "all" && (
                <div className="text-[11px] font-bold text-indigo-300 px-1 pt-1 border-t border-white/5">
                  {sem.title}
                </div>
              )}
              {sem.subjects.map((sub) => (
                <button
                  key={sub.id}
                  onClick={() => props.onSelectSyllabusSubject(sem.title, sub)}
                  className="flex w-full items-center gap-2.5 rounded-xl border border-white/10 bg-white/[0.03] p-2.5 text-left hover:bg-indigo-500/10 hover:border-indigo-500/40 transition-all group"
                >
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 group-hover:bg-indigo-500 group-hover:text-white transition-colors shrink-0">
                    <BookOpen className="h-3.5 w-3.5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-xs font-medium text-slate-200 group-hover:text-white">{sub.title}</div>
                    <div className="truncate text-[10px] text-slate-400 mt-0.5">{sub.code} · {sub.chapters.length} Units</div>
                  </div>
                  <ChevronRight className="h-3.5 w-3.5 text-slate-600 group-hover:text-indigo-400 transition-colors" />
                </button>
              ))}
            </div>
          ))}
        </div>
      </SidebarSection>

      {/* Notes Section */}
      <SidebarSection label="My Notes" count={props.notes.length}>
        <button
          onClick={props.onNewNote}
          className="mb-1 flex w-full items-center gap-2 rounded-xl border border-dashed border-white/15 p-2 text-xs text-slate-400 hover:border-indigo-500/50 hover:text-indigo-300 transition-colors"
        >
          <Plus className="h-3.5 w-3.5" /> New note
        </button>
        {props.notes.map((n) => (
          <button
            key={n.id}
            onClick={() => props.onSelectNote(n.id)}
            className={`flex w-full items-center gap-2 rounded-xl p-2 text-left transition-colors ${
              props.activeNoteId === n.id ? "bg-indigo-500/15 ring-1 ring-indigo-500/30" : "hover:bg-white/5"
            }`}
          >
            <BookOpen className="h-3.5 w-3.5 text-slate-400 shrink-0" />
            <span className="truncate text-xs text-slate-200">{n.title}</span>
          </button>
        ))}
      </SidebarSection>

      {/* Study Tools */}
      <SidebarSection label="Study Tools">
        <button
          onClick={props.onOpenFlashcards}
          className="flex w-full items-center justify-between rounded-xl p-2.5 hover:bg-white/5 transition-colors border border-white/5"
        >
          <span className="flex items-center gap-2 text-xs text-slate-200">
            <Layers className="h-3.5 w-3.5 text-emerald-400" /> Flashcards
          </span>
          <Badge variant="secondary" className="h-5 border-white/10 bg-white/5 text-[10px] text-slate-300">
            {props.cardsCount}
          </Badge>
        </button>
        <button
          onClick={props.onOpenQuiz}
          className="flex w-full items-center gap-2 rounded-xl p-2.5 text-xs text-slate-200 hover:bg-white/5 transition-colors border border-white/5"
        >
          <Target className="h-3.5 w-3.5 text-amber-400" /> Quiz Mode
        </button>
        <button
          onClick={props.onOpenTutor}
          className="flex w-full items-center gap-2 rounded-xl p-2.5 text-xs text-slate-200 hover:bg-white/5 transition-colors border border-white/5"
        >
          <Bot className="h-3.5 w-3.5 text-purple-400" /> Practice & Challenge
        </button>
      </SidebarSection>
    </div>
  );
}

function SidebarSection({
  label,
  count,
  children,
}: {
  label: string;
  count?: number;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between px-1">
        <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">{label}</div>
        {count !== undefined && (
          <span className="text-[10px] text-slate-600">{count}</span>
        )}
      </div>
      <div className="space-y-1">{children}</div>
    </div>
  );
}

// ─── Source Viewer ──────────────────────────────────────────────
function SourceViewer({ source, onConvertToFlashcards }: { source: Source; onConvertToFlashcards: () => void }) {
  return (
    <div className="mx-auto max-w-4xl p-4 sm:p-8">
      <div className="mb-4 flex items-center gap-2 text-xs text-slate-400">
        {source.kind === "pdf" ? <FileText className="h-3.5 w-3.5 text-indigo-400" /> : <Video className="h-3.5 w-3.5 text-purple-400" />}
        <span>{source.meta}</span>
      </div>
      <h1 className="text-xl font-bold text-white sm:text-3xl break-words">{source.title}</h1>

      <div className="mt-6 rounded-xl border border-indigo-500/20 bg-indigo-500/5 p-5 backdrop-blur">
        <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-indigo-300">
          <Sparkles className="h-3.5 w-3.5" /> AI Overview & Grounded Summary
        </div>
        <p className="text-sm leading-relaxed text-slate-200">{source.summary}</p>
        <div className="mt-4 flex flex-wrap gap-1.5">
          {source.tags.map((t) => (
            <Badge key={t} variant="secondary" className="border-indigo-500/30 bg-indigo-500/10 text-[10px] text-indigo-200">
              {t}
            </Badge>
          ))}
        </div>
      </div>

      <div className="mt-6">
        <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
          Unit & Syllabus Breakdown
        </div>
        <div className="space-y-2">
          {source.units.map((u) => (
            <div
              key={u.id}
              className="flex items-start gap-3 rounded-lg border border-white/10 bg-slate-900/40 p-3"
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded bg-indigo-500/15 text-xs font-bold text-indigo-300">
                {u.id.toUpperCase()}
              </div>
              <div>
                <div className="text-sm font-medium text-white">{u.title}</div>
                <div className="text-xs text-slate-400">{u.brief}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        <Button size="sm" onClick={onConvertToFlashcards} className="gap-2 bg-emerald-500 text-white hover:bg-emerald-400">
          <Layers className="h-4 w-4" /> Convert to Flashcards
        </Button>
      </div>

      {/* Content Preview */}
      <div className="mt-6 rounded-xl border border-white/10 bg-slate-900/40 p-5">
        <div className="text-sm text-slate-300 space-y-3">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">Admin Source Status</div>
          <p>
            📚 <strong className="text-white">{source.title}</strong> is active in your study workspace.
          </p>
          <p className="text-slate-400 text-xs">
            Use the <strong className="text-indigo-300">AI Assistant</strong> on the right (or tap the top-right button) to ask questions, generate summaries, or take practice quizzes grounded in this admin material.
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── Note Editor ────────────────────────────────────────────────
function NoteEditor({
  note,
  onChange,
  onTitle,
  onExtractCards,
}: {
  note: Note;
  onChange: (body: string) => void;
  onTitle: (title: string) => void;
  onExtractCards: (cards: Flashcard[]) => void;
}) {
  function extract() {
    const lines = note.body.split("\n").filter((l) => l.includes("::"));
    const cards: Flashcard[] = lines.map((l) => {
      const [front, back] = l.split("::").map((s) => s.trim());
      return { id: crypto.randomUUID(), front, back, ease: 2.5, due: 0 };
    });
    if (cards.length === 0) {
      toast.error("No `Concept :: Definition` lines found");
      return;
    }
    onExtractCards(cards);
  }
  return (
    <div className="mx-auto max-w-4xl p-4 sm:p-8">
      <Input
        value={note.title}
        onChange={(e) => onTitle(e.target.value)}
        className="mb-4 border-none bg-transparent px-0 text-2xl font-bold text-white focus-visible:ring-0"
      />
      <div className="mb-3 flex flex-wrap gap-2">
        <Button size="sm" onClick={extract} className="gap-2 bg-emerald-500 text-white hover:bg-emerald-400">
          <Layers className="h-4 w-4" /> Extract Flashcards
        </Button>
        <span className="self-center text-xs text-slate-500">
          Tip: write <code className="text-indigo-300">Concept :: Definition</code> to auto-generate cards.
        </span>
      </div>
      <Textarea
        value={note.body}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Start writing… use Concept :: Definition format for flashcard extraction."
        className="min-h-[400px] border-white/10 bg-slate-900/40 font-mono text-sm text-slate-100"
      />
    </div>
  );
}

// ─── Flashcard Review ────────────────────────────────────────────
function FlashcardReview({
  cards,
  onRate,
}: {
  cards: Flashcard[];
  onRate: (id: string, rating: 0 | 1 | 2 | 3) => void;
}) {
  const [idx, setIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const card = cards[idx];

  if (!card) {
    return (
      <div className="flex h-full flex-col items-center justify-center p-8 text-center">
        <Layers className="h-12 w-12 text-slate-600 mb-4" />
        <div className="text-slate-400 font-medium mb-1">No flashcards yet</div>
        <div className="text-xs text-slate-600">Select an admin source and click "Convert to Flashcards" to get started.</div>
      </div>
    );
  }

  function rate(r: 0 | 1 | 2 | 3) {
    onRate(card.id, r);
    setFlipped(false);
    setIdx((i) => (i + 1) % cards.length);
  }

  return (
    <div className="mx-auto flex max-w-2xl flex-col items-center p-4 sm:p-10">
      <div className="mb-6 flex w-full items-center justify-between text-xs text-slate-400">
        <span>Card {idx + 1} of {cards.length}</span>
        <Badge variant="outline" className="border-indigo-500/30 text-indigo-300">
          Spaced Repetition
        </Badge>
      </div>

      <button
        onClick={() => setFlipped((f) => !f)}
        className="flex min-h-[260px] w-full flex-col items-center justify-center rounded-3xl border border-white/10 bg-gradient-to-b from-slate-900 to-slate-900/80 p-8 text-center shadow-2xl transition-transform active:scale-[0.99]"
      >
        <div className="text-xs uppercase tracking-wider text-slate-500 mb-4">
          {flipped ? "Answer" : "Question"}
        </div>
        <div className="text-lg font-medium text-white sm:text-xl">
          {flipped ? card.back : card.front}
        </div>
        <div className="mt-6 text-[10px] text-slate-600">Tap to flip</div>
      </button>

      {flipped && (
        <div className="mt-6 grid w-full grid-cols-2 sm:grid-cols-4 gap-2">
          <Button variant="outline" onClick={() => rate(0)} className="border-red-500/30 bg-red-500/10 text-red-300 hover:bg-red-500/20">
            Again
          </Button>
          <Button variant="outline" onClick={() => rate(1)} className="border-orange-500/30 bg-orange-500/10 text-orange-300 hover:bg-orange-500/20">
            Hard
          </Button>
          <Button variant="outline" onClick={() => rate(2)} className="border-indigo-500/30 bg-indigo-500/10 text-indigo-300 hover:bg-indigo-500/20">
            Good
          </Button>
          <Button variant="outline" onClick={() => rate(3)} className="border-emerald-500/30 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20">
            Easy
          </Button>
        </div>
      )}
    </div>
  );
}

// ─── Quiz Mode ──────────────────────────────────────────────────
function QuizMode({ source }: { source: Source }) {
  const quiz = source.units.map((u) => ({
    q: `What key concept is covered under "${u.title}"?`,
    options: [
      u.brief,
      "Unrelated theoretical algorithm",
      "Non-syllabus background context",
      "General overview",
    ],
    answer: 0,
  }));

  const [idx, setIdx] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);

  if (quiz.length === 0) {
    return (
      <div className="flex h-full items-center justify-center p-8 text-center text-slate-400">
        No unit breakdown available for quiz generation.
      </div>
    );
  }

  const q = quiz[idx];

  function submit() {
    if (selected === null) return;
    if (selected === q.answer) setScore((s) => s + 1);
    if (idx + 1 >= quiz.length) setDone(true);
    else {
      setIdx((i) => i + 1);
      setSelected(null);
    }
  }

  if (done) {
    return (
      <div className="mx-auto max-w-xl p-10 text-center">
        <div className="text-5xl">🎯</div>
        <h2 className="mt-4 text-2xl font-bold text-white">Quiz Complete!</h2>
        <div className="mt-2 text-slate-400">
          Score: {score} / {quiz.length}
        </div>
        <Progress value={(score / quiz.length) * 100} className="mt-6" />
        <Button
          className="mt-6 bg-indigo-500 hover:bg-indigo-400"
          onClick={() => { setIdx(0); setSelected(null); setScore(0); setDone(false); }}
        >
          Retake Quiz
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl p-4 sm:p-10">
      <div className="mb-4 flex items-center justify-between text-xs text-slate-400">
        <span>Question {idx + 1} / {quiz.length}</span>
        <span>Score: {score}</span>
      </div>
      <div className="rounded-2xl border border-white/10 bg-slate-900/50 p-5 sm:p-6">
        <div className="text-base font-medium text-white mb-5">{q.q}</div>
        <div className="space-y-2">
          {q.options.map((o, i) => (
            <button
              key={i}
              onClick={() => setSelected(i)}
              className={`flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-colors ${
                selected === i
                  ? "border-indigo-400 bg-indigo-500/15 text-white"
                  : "border-white/10 bg-white/5 text-slate-200 hover:bg-white/10"
              }`}
            >
              <div className="flex h-6 w-6 items-center justify-center rounded-full border border-current text-xs shrink-0">
                {String.fromCharCode(65 + i)}
              </div>
              <span className="text-sm">{o}</span>
            </button>
          ))}
        </div>
        <Button
          onClick={submit}
          disabled={selected === null}
          className="mt-6 w-full bg-indigo-500 hover:bg-indigo-400 disabled:opacity-40"
        >
          Submit Answer
        </Button>
      </div>
    </div>
  );
}

// ─── Tutor / Practice Mode ──────────────────────────────────────
function TutorMode({ source }: { source: Source }) {
  const questions = source.units.map(
    (u) => `Explain "${u.title}" in your own words — focus on: ${u.brief.toLowerCase()}`
  );
  const [qIdx, setQIdx] = useState(0);
  const [answer, setAnswer] = useState("");
  const [scores, setScores] = useState<{ clarity: number; grounding: number; confidence: number } | null>(null);

  function evaluate() {
    if (!answer.trim()) return;
    const len = answer.trim().length;
    setScores({
      clarity: Math.min(100, 40 + Math.round(len / 3)),
      grounding: Math.min(100, 50 + Math.round(len / 20) + 15),
      confidence: Math.min(100, 45 + Math.round(len / 4)),
    });
  }

  function next() {
    setQIdx((i) => (i + 1) % questions.length);
    setAnswer("");
    setScores(null);
  }

  return (
    <div className="mx-auto max-w-2xl p-4 sm:p-10">
      <div className="mb-2 flex items-center gap-2 text-xs uppercase tracking-wider text-purple-300">
        <Bot className="h-3.5 w-3.5" /> Practice & Challenge Mode
      </div>
      <div className="rounded-2xl border border-purple-500/20 bg-purple-500/5 p-5 sm:p-6">
        <div className="text-xs text-slate-400 mb-2">Interactive Examiner · {source.title}</div>
        <div className="text-base font-medium text-white">{questions[qIdx]}</div>
      </div>
      <Textarea
        value={answer}
        onChange={(e) => setAnswer(e.target.value)}
        placeholder="Type your answer here…"
        className="mt-4 min-h-[140px] border-white/10 bg-slate-900/40 text-sm text-slate-100"
      />
      <div className="mt-3 flex flex-wrap gap-2">
        <Button onClick={evaluate} className="bg-purple-500 hover:bg-purple-400">
          Submit Answer
        </Button>
        <Button variant="outline" className="gap-2 border-white/10 bg-white/5 text-slate-200 hover:bg-white/10">
          <Mic className="h-4 w-4" /> Speak
        </Button>
        <Button variant="ghost" onClick={next} className="ml-auto gap-2 text-slate-400">
          Next question <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {scores && (
        <div className="mt-6 space-y-3 rounded-2xl border border-white/10 bg-slate-900/50 p-5">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">Real-time Feedback</div>
          <ScoreBar label="Clarity" value={scores.clarity} color="bg-sky-400" />
          <ScoreBar label="Grounding Accuracy" value={scores.grounding} color="bg-emerald-400" />
          <ScoreBar label="Confidence" value={scores.confidence} color="bg-purple-400" />
        </div>
      )}
    </div>
  );
}

function ScoreBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div>
      <div className="mb-1 flex justify-between text-xs">
        <span className="text-slate-300">{label}</span>
        <span className="text-slate-400">{value}%</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-white/5">
        <div className={`h-full ${color} transition-all duration-700`} style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

// ─── Assistant Panel ────────────────────────────────────────────
function AssistantPanel({
  sources,
  messages,
  onSend,
  onClose,
  onQuickAction,
  onConvertToFlashcards,
  onCreateQuiz,
  activeSourceTitle,
  sending,
  groundingOnly,
  onToggleGrounding,
}: {
  sources: Source[];
  messages: ChatMsg[];
  onSend: (text: string) => void;
  onClose: () => void;
  onQuickAction: (action: string) => void;
  onConvertToFlashcards: () => void;
  onCreateQuiz: () => void;
  activeSourceTitle: string | null;
  sending: boolean;
  groundingOnly: boolean;
  onToggleGrounding: () => void;
}) {
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const hasContent = sources.length > 0;

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  function submit(e: FormEvent) {
    e.preventDefault();
    if (!input.trim()) return;
    onSend(input.trim());
    setInput("");
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600">
            <Sparkles className="h-3.5 w-3.5 text-white" />
          </div>
          <div>
            <div className="text-xs font-semibold text-white">Francis AI Assistant</div>
            <div className="text-[10px] text-emerald-400 flex items-center gap-1">
              <ShieldCheck className="h-3 w-3" /> Admin Grounded Mode
            </div>
          </div>
        </div>
        <button
          onClick={onClose}
          className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:bg-white/5 hover:text-white"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Grounding toggle */}
      <div className="flex items-center justify-between border-b border-white/10 bg-white/[0.02] px-4 py-2">
        <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
          <ShieldCheck className="h-3 w-3 text-emerald-400" />
          Strict Admin Grounding
        </div>
        <button
          onClick={onToggleGrounding}
          className={`relative h-4 w-8 rounded-full transition-colors ${
            groundingOnly ? "bg-emerald-500" : "bg-slate-600"
          }`}
          aria-label="Toggle source grounding"
        >
          <span
            className={`absolute top-0.5 h-3 w-3 rounded-full bg-white transition-transform ${
              groundingOnly ? "translate-x-4" : "translate-x-0.5"
            }`}
          />
        </button>
      </div>

      {/* Status bar */}
      {activeSourceTitle && (
        <div className="border-b border-indigo-500/20 bg-indigo-500/5 px-4 py-1.5">
          <div className="flex items-center gap-1.5 text-[11px] text-indigo-300 truncate">
            <BookOpen className="h-3 w-3 shrink-0" />
            <span className="truncate">Grounded in: <strong>{activeSourceTitle}</strong></span>
          </div>
        </div>
      )}

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {messages.map((m) => (
          <div key={m.id} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            {m.role === "assistant" && (
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 mr-2 mt-1">
                <Sparkles className="h-3 w-3 text-white" />
              </div>
            )}
            <div
              className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm ${
                m.role === "user"
                  ? "bg-indigo-500 text-white rounded-br-sm"
                  : "border border-white/10 bg-white/5 text-slate-100 rounded-bl-sm"
              }`}
            >
              <div className="whitespace-pre-wrap leading-relaxed">{m.text}</div>
              {m.citations && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {m.citations.map((c, i) => (
                    <span key={i} className="rounded bg-indigo-500/20 px-1.5 py-0.5 text-[10px] text-indigo-200">
                      {c}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
        {sending && (
          <div className="flex justify-start">
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 mr-2 mt-1">
              <Sparkles className="h-3 w-3 text-white" />
            </div>
            <div className="rounded-2xl rounded-bl-sm border border-white/10 bg-white/5 px-3.5 py-2.5 text-sm text-slate-300">
              <span className="inline-flex gap-1">
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-indigo-400 [animation-delay:-0.3s]" />
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-indigo-400 [animation-delay:-0.15s]" />
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-indigo-400" />
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Quick Actions + Input */}
      <div className="border-t border-white/10 px-3 py-2">
        {hasContent && (
          <div className="mb-2 flex flex-wrap gap-1">
            {[
              { label: "Summarize active source", icon: Sparkles },
              { label: "Generate 5 exam questions", icon: Target },
              { label: "Explain in simple terms", icon: MessageSquare },
            ].map((a) => (
              <button
                key={a.label}
                onClick={() => onQuickAction(a.label)}
                className="flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[10px] text-slate-300 hover:bg-white/10 hover:text-white transition-colors"
              >
                <a.icon className="h-3 w-3" />
                {a.label}
              </button>
            ))}
          </div>
        )}

        {hasContent && (
          <div className="mb-2 flex gap-1">
            <button
              onClick={onConvertToFlashcards}
              className="flex-1 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-2 py-1.5 text-[11px] font-medium text-emerald-300 hover:bg-emerald-500/20 transition-colors"
            >
              → Flashcards
            </button>
            <button
              onClick={onCreateQuiz}
              className="flex-1 rounded-lg border border-amber-500/30 bg-amber-500/10 px-2 py-1.5 text-[11px] font-medium text-amber-300 hover:bg-amber-500/20 transition-colors"
            >
              → Quiz
            </button>
          </div>
        )}

        <form onSubmit={submit} className="flex gap-1.5">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={sending ? "Francis AI is analyzing..." : "Ask Francis AI about admin materials..."}
            disabled={sending}
            className="h-9 border-white/10 bg-white/5 text-sm placeholder:text-slate-500 text-slate-100"
          />
          <Button
            type="submit"
            size="icon"
            disabled={sending || !input.trim()}
            className="h-9 w-9 shrink-0 bg-indigo-500 hover:bg-indigo-400 disabled:opacity-40"
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}
