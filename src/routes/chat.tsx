import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import {
  ArrowLeft,
  Bot,
  BookOpen,
  Brain,
  ChevronRight,
  FileText,
  Flame,
  Layers,
  Link2,
  MessageSquare,
  Mic,
  Play,
  Plus,
  Send,
  Sparkles,
  Target,
  Upload,
  Video,
  X,
  Youtube,
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
          "Source-grounded AI study workspace with flashcards, spaced repetition, and interactive tutor mode.",
      },
      { property: "og:title", content: "AI Study Workspace" },
      {
        property: "og:description",
        content: "NotebookLM-style research workspace for BCA students.",
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
};
type Note = { id: string; title: string; body: string };
type Flashcard = { id: string; front: string; back: string; ease: number; due: number };
type ChatMsg = {
  id: string;
  role: "user" | "assistant";
  text: string;
  citations?: string[];
};

// ─── Mock Data ───────────────────────────────────────────────────
const initialSources: Source[] = [
  {
    id: "s1",
    kind: "pdf",
    title: "Unit 1: Fundamentals.pdf",
    meta: "24 pages · 1.8 MB",
    summary:
      "Covers foundational CS concepts: data representation, algorithms basics, complexity notations, and problem-solving strategies used across the semester.",
    tags: ["Data Structures", "Algorithms", "Complexity", "Foundations"],
    units: [
      { id: "u1", title: "Unit 1: Data Representation", brief: "Binary, hex, encoding schemes." },
      { id: "u2", title: "Unit 2: Algorithms Basics", brief: "Sorting, searching, big-O." },
      { id: "u3", title: "Unit 3: Problem Solving", brief: "Decomposition & pseudocode." },
    ],
  },
  {
    id: "s2",
    kind: "video",
    title: "Lecture 1: Intro",
    meta: "YouTube · 18:42",
    summary:
      "Introductory lecture walking through the semester roadmap, expectations, and a live demonstration of algorithmic thinking with a small sorting example.",
    tags: ["Introduction", "Roadmap", "Sorting"],
    units: [
      { id: "u1", title: "Chapter 1: Overview", brief: "Course outline & goals." },
      { id: "u2", title: "Chapter 2: Live Demo", brief: "Bubble sort walkthrough." },
    ],
  },
];

const initialNotes: Note[] = [
  {
    id: "n1",
    title: "Big-O Cheatsheet",
    body:
      "# Big-O Cheatsheet\n\n- **O(1)** constant\n- **O(log n)** binary search\n- **O(n)** linear scan\n- **O(n log n)** merge sort\n- **O(n²)** bubble sort\n\nComplexity :: Growth rate of runtime as input size grows.",
  },
];

const initialCards: Flashcard[] = [
  { id: "c1", front: "Big-O of binary search?", back: "O(log n)", ease: 2.5, due: 0 },
  { id: "c2", front: "Data structure with LIFO order?", back: "Stack", ease: 2.5, due: 0 },
  { id: "c3", front: "Data structure with FIFO order?", back: "Queue", ease: 2.5, due: 0 },
  { id: "c4", front: "Best-case time complexity of merge sort?", back: "O(n log n)", ease: 2.5, due: 0 },
];

const mockQuiz = [
  {
    q: "Which sorting algorithm has O(n log n) average complexity?",
    options: ["Bubble Sort", "Merge Sort", "Selection Sort", "Insertion Sort"],
    answer: 1,
  },
  {
    q: "A stack follows which order?",
    options: ["FIFO", "LIFO", "Random", "Priority"],
    answer: 1,
  },
  {
    q: "Binary search requires the array to be:",
    options: ["Unsorted", "Sorted", "Empty", "Reversed"],
    answer: 1,
  },
];

// ─── Utility: mock AI reply ─────────────────────────────────────
function mockAiReply(prompt: string, grounded: boolean, sources: Source[]): ChatMsg {
  const s = sources[0];
  const cite = grounded && s
    ? s.kind === "pdf"
      ? [`[${s.title} · Page 4]`]
      : [`[${s.title} @ 03:15]`]
    : undefined;
  let text = "";
  const p = prompt.toLowerCase();
  if (p.includes("summar")) {
    text =
      "**Summary of Unit 1:**\n\n• Data representation covers how numbers and characters are stored in memory.\n• Algorithm basics introduce sorting and searching primitives.\n• Complexity notation (Big-O) is used to compare algorithm efficiency.\n\nKey takeaway: efficiency matters as input sizes scale.";
  } else if (p.includes("exam") || p.includes("question")) {
    text =
      "**5 Exam Questions:**\n\n1. Define time complexity and give an example.\n2. Explain the difference between stack and queue.\n3. Write pseudocode for binary search.\n4. Compare bubble sort vs merge sort.\n5. What is the significance of Big-O notation?";
  } else if (p.includes("explain")) {
    text =
      "Sure — think of it this way: an algorithm is just a recipe. Big-O tells you how the cooking time grows if you invite more guests. O(n) means twice the guests, twice the time. O(n²) means twice the guests, four times the time. 🧠";
  } else {
    text = grounded
      ? "Based on your uploaded sources, here's a focused answer drawing from Unit 1 fundamentals and the intro lecture. The core idea revolves around efficient computation and structured problem solving."
      : "Great question! Here's a general explanation drawing on common CS knowledge. Let me know if you want me to ground this in your uploaded sources.";
  }
  return { id: crypto.randomUUID(), role: "assistant", text, citations: cite };
}

// ─── Main ───────────────────────────────────────────────────────
function WorkspacePage() {
  const navigate = useNavigate();
  const [sources, setSources] = useState<Source[]>(initialSources);
  const [notes, setNotes] = useState<Note[]>(initialNotes);
  const [cards, setCards] = useState<Flashcard[]>(initialCards);
  const [activeSourceId, setActiveSourceId] = useState<string>(initialSources[0].id);
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);
  const [centerMode, setCenterMode] = useState<"source" | "note" | "flashcards" | "quiz" | "tutor">("source");
  const [assistantOpen, setAssistantOpen] = useState(true);
  const [grounded, setGrounded] = useState(true);
  const [streak, setStreak] = useState(7);
  const [messages, setMessages] = useState<ChatMsg[]>([
    {
      id: "m0",
      role: "assistant",
      text: "Hi! I'm your source-grounded study assistant. Ask me anything about your uploaded PDFs or videos.",
    },
  ]);

  const activeSource = sources.find((s) => s.id === activeSourceId)!;
  const activeNote = notes.find((n) => n.id === activeNoteId) ?? null;

  // Upload source (mock)
  const [uploadUrl, setUploadUrl] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  function addPdfMock(file: File) {
    const src: Source = {
      id: crypto.randomUUID(),
      kind: "pdf",
      title: file.name,
      meta: `${Math.max(1, Math.round(file.size / 1024))} KB`,
      summary: "Auto-generated summary: this document covers key concepts across multiple units. AI extraction complete.",
      tags: ["Auto-tagged", "Study Material"],
      units: [
        { id: "u1", title: "Unit 1: Overview", brief: "Introductory concepts." },
        { id: "u2", title: "Unit 2: Details", brief: "Deeper dive." },
      ],
    };
    setSources((s) => [src, ...s]);
    setActiveSourceId(src.id);
    setCenterMode("source");
    toast.success("Source added — AI analysis complete");
  }

  function addYoutubeMock() {
    if (!uploadUrl.trim()) return;
    const src: Source = {
      id: crypto.randomUUID(),
      kind: "video",
      title: `Video: ${uploadUrl.slice(0, 32)}${uploadUrl.length > 32 ? "…" : ""}`,
      meta: "YouTube · auto-detected",
      summary: "Auto-generated transcript summary: the speaker covers foundational topics with practical examples throughout the lecture.",
      tags: ["Video", "Lecture"],
      units: [
        { id: "u1", title: "Chapter 1: Intro", brief: "Opening remarks." },
        { id: "u2", title: "Chapter 2: Core Content", brief: "Main lesson." },
      ],
    };
    setSources((s) => [src, ...s]);
    setActiveSourceId(src.id);
    setCenterMode("source");
    setUploadUrl("");
    toast.success("Video linked — transcript analyzed");
  }

  function sendMessage(text: string) {
    if (!text.trim()) return;
    const user: ChatMsg = { id: crypto.randomUUID(), role: "user", text };
    setMessages((m) => [...m, user]);
    setTimeout(() => {
      setMessages((m) => [...m, mockAiReply(text, grounded, sources)]);
    }, 600);
  }

  function convertToFlashcards() {
    const s = activeSource;
    const newCards: Flashcard[] = s.units.map((u) => ({
      id: crypto.randomUUID(),
      front: `What does "${u.title}" cover?`,
      back: u.brief,
      ease: 2.5,
      due: 0,
    }));
    setCards((c) => [...newCards, ...c]);
    toast.success(`Added ${newCards.length} flashcards from ${s.title}`);
  }

  return (
    <div className="dark min-h-screen bg-slate-950 text-slate-100">
      {/* Top Nav */}
      <header className="sticky top-0 z-40 border-b border-white/10 bg-slate-950/80 backdrop-blur-xl">
        <div className="flex h-14 items-center gap-3 px-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate({ to: "/" })}
            className="gap-2 text-slate-300 hover:bg-white/5 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Back</span>
          </Button>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600">
              <Brain className="h-4 w-4 text-white" />
            </div>
            <div className="hidden sm:block">
              <div className="text-sm font-semibold">AI Study Workspace</div>
              <div className="text-[10px] text-slate-400">Computer Science — Semester 2</div>
            </div>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <div className="flex items-center gap-1.5 rounded-full border border-orange-500/30 bg-orange-500/10 px-3 py-1.5 text-xs font-medium text-orange-300">
              <Flame className="h-3.5 w-3.5" />
              <span>{streak} day streak</span>
            </div>
            <Button
              onClick={() => setAssistantOpen((v) => !v)}
              className={`relative gap-2 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/30 hover:from-indigo-400 hover:to-purple-500 ${
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

      {/* Main 3-panel layout */}
      <div className="flex h-[calc(100vh-3.5rem)]">
        {/* Left Sidebar */}
        <aside className="hidden w-72 shrink-0 flex-col border-r border-white/10 bg-slate-900/40 lg:flex">
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
            onOpenQuiz={() => setCenterMode("quiz")}
            onOpenTutor={() => setCenterMode("tutor")}
            uploadUrl={uploadUrl}
            setUploadUrl={setUploadUrl}
            onAddPdf={() => fileRef.current?.click()}
            onAddYoutube={addYoutubeMock}
            cardsCount={cards.length}
          />
          <input
            ref={fileRef}
            type="file"
            accept="application/pdf"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) addPdfMock(f);
              e.target.value = "";
            }}
          />
        </aside>

        {/* Center Canvas */}
        <main className="flex-1 overflow-y-auto">
          {centerMode === "source" && (
            <SourceViewer source={activeSource} onConvertToFlashcards={convertToFlashcards} />
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
                toast.success(`Extracted ${newCards.length} flashcards from note`);
              }}
            />
          )}
          {centerMode === "flashcards" && (
            <FlashcardReview
              cards={cards}
              onRate={(id, rating) => {
                setCards((cs) =>
                  cs.map((c) =>
                    c.id === id
                      ? {
                          ...c,
                          ease: Math.max(1.3, c.ease + (rating - 2) * 0.15),
                          due: Date.now() + rating * 86400000,
                        }
                      : c,
                  ),
                );
                setStreak((s) => s + (rating >= 2 ? 0 : 0));
              }}
            />
          )}
          {centerMode === "quiz" && <QuizMode />}
          {centerMode === "tutor" && <TutorMode source={activeSource} />}
        </main>

        {/* Right AI Drawer */}
        {assistantOpen && (
          <aside className="hidden w-96 shrink-0 flex-col border-l border-white/10 bg-slate-900/60 backdrop-blur-xl md:flex">
            <AssistantPanel
              grounded={grounded}
              setGrounded={setGrounded}
              messages={messages}
              onSend={sendMessage}
              onClose={() => setAssistantOpen(false)}
              onQuickAction={(action) => {
                sendMessage(action);
              }}
              onConvertToFlashcards={convertToFlashcards}
              onCreateQuiz={() => {
                setCenterMode("quiz");
                toast.success("Quiz opened in canvas");
              }}
              activeSourceTitle={activeSource.title}
            />
          </aside>
        )}
      </div>
    </div>
  );
}

// ─── Left Sidebar ────────────────────────────────────────────────
function SourceHub(props: {
  sources: Source[];
  activeSourceId: string;
  onSelectSource: (id: string) => void;
  notes: Note[];
  activeNoteId: string | null;
  onSelectNote: (id: string) => void;
  onNewNote: () => void;
  onOpenFlashcards: () => void;
  onOpenQuiz: () => void;
  onOpenTutor: () => void;
  uploadUrl: string;
  setUploadUrl: (v: string) => void;
  onAddPdf: () => void;
  onAddYoutube: () => void;
  cardsCount: number;
}) {
  return (
    <div className="flex h-full flex-col overflow-y-auto p-3">
      <div className="mb-3">
        <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
          Add Source
        </div>
        <div className="mt-2 space-y-2">
          <Button
            onClick={props.onAddPdf}
            variant="outline"
            size="sm"
            className="w-full justify-start gap-2 border-white/10 bg-white/5 text-slate-200 hover:bg-white/10 hover:text-white"
          >
            <Upload className="h-4 w-4" />
            Upload PDF
          </Button>
          <div className="flex gap-1.5">
            <Input
              value={props.uploadUrl}
              onChange={(e) => props.setUploadUrl(e.target.value)}
              placeholder="Paste YouTube URL"
              className="h-8 border-white/10 bg-white/5 text-xs placeholder:text-slate-500"
            />
            <Button size="icon" onClick={props.onAddYoutube} className="h-8 w-8 shrink-0 bg-indigo-500 hover:bg-indigo-400">
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <SidebarSection label="Sources" count={props.sources.length}>
        {props.sources.map((s) => (
          <button
            key={s.id}
            onClick={() => props.onSelectSource(s.id)}
            className={`group flex w-full items-start gap-2 rounded-lg p-2 text-left transition-colors ${
              props.activeSourceId === s.id ? "bg-indigo-500/15 ring-1 ring-indigo-500/30" : "hover:bg-white/5"
            }`}
          >
            <div className="mt-0.5 rounded bg-white/5 p-1.5">
              {s.kind === "pdf" ? (
                <FileText className="h-3.5 w-3.5 text-rose-300" />
              ) : (
                <Youtube className="h-3.5 w-3.5 text-red-400" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-xs font-medium text-slate-100">{s.title}</div>
              <div className="truncate text-[10px] text-slate-500">{s.meta}</div>
            </div>
          </button>
        ))}
      </SidebarSection>

      <SidebarSection label="Notes" count={props.notes.length}>
        <button
          onClick={props.onNewNote}
          className="mb-1 flex w-full items-center gap-2 rounded-lg border border-dashed border-white/10 p-2 text-xs text-slate-400 hover:border-indigo-500/40 hover:text-indigo-300"
        >
          <Plus className="h-3.5 w-3.5" /> New note
        </button>
        {props.notes.map((n) => (
          <button
            key={n.id}
            onClick={() => props.onSelectNote(n.id)}
            className={`flex w-full items-center gap-2 rounded-lg p-2 text-left transition-colors ${
              props.activeNoteId === n.id ? "bg-indigo-500/15 ring-1 ring-indigo-500/30" : "hover:bg-white/5"
            }`}
          >
            <BookOpen className="h-3.5 w-3.5 text-slate-400" />
            <span className="truncate text-xs text-slate-200">{n.title}</span>
          </button>
        ))}
      </SidebarSection>

      <SidebarSection label="Study Tools">
        <button
          onClick={props.onOpenFlashcards}
          className="flex w-full items-center justify-between rounded-lg p-2 hover:bg-white/5"
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
          className="flex w-full items-center gap-2 rounded-lg p-2 text-xs text-slate-200 hover:bg-white/5"
        >
          <Target className="h-3.5 w-3.5 text-amber-400" /> Quiz
        </button>
        <button
          onClick={props.onOpenTutor}
          className="flex w-full items-center gap-2 rounded-lg p-2 text-xs text-slate-200 hover:bg-white/5"
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
    <div className="mb-4">
      <div className="mb-1 flex items-center justify-between px-1">
        <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">{label}</div>
        {count !== undefined && (
          <span className="text-[10px] text-slate-600">{count}</span>
        )}
      </div>
      <div className="space-y-0.5">{children}</div>
    </div>
  );
}

// ─── Source Viewer ──────────────────────────────────────────────
function SourceViewer({ source, onConvertToFlashcards }: { source: Source; onConvertToFlashcards: () => void }) {
  return (
    <div className="mx-auto max-w-4xl p-6 sm:p-8">
      <div className="mb-4 flex items-center gap-2 text-xs text-slate-400">
        {source.kind === "pdf" ? <FileText className="h-3.5 w-3.5" /> : <Video className="h-3.5 w-3.5" />}
        <span>{source.meta}</span>
      </div>
      <h1 className="text-2xl font-bold text-white sm:text-3xl">{source.title}</h1>

      <div className="mt-6 rounded-xl border border-white/10 bg-white/5 p-5 backdrop-blur">
        <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-indigo-300">
          <Sparkles className="h-3.5 w-3.5" /> AI Summary
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
          {source.kind === "pdf" ? "Unit Breakdown" : "Chapter Breakdown"}
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
        <Button size="sm" variant="outline" className="gap-2 border-white/10 bg-white/5 text-slate-200 hover:bg-white/10">
          <Zap className="h-4 w-4" /> Generate Audio Summary
        </Button>
      </div>

      {/* Fake reader area */}
      <div className="mt-6 rounded-xl border border-white/10 bg-slate-900/40 p-5">
        {source.kind === "pdf" ? (
          <div className="prose prose-invert prose-sm max-w-none">
            <h3 className="text-white">Preview — Page 1</h3>
            <p className="text-slate-300">
              Computer Science fundamentals begin with an understanding of how information is
              represented and manipulated. Data structures organize information; algorithms
              transform it.
            </p>
            <p className="text-slate-300">
              The efficiency of an algorithm is measured using asymptotic notation, most commonly
              Big-O. This lets us compare approaches independent of hardware.
            </p>
          </div>
        ) : (
          <div className="aspect-video overflow-hidden rounded-lg bg-black/60">
            <div className="flex h-full items-center justify-center text-slate-400">
              <div className="text-center">
                <Play className="mx-auto h-12 w-12 text-indigo-400" />
                <div className="mt-2 text-sm">Video Preview Placeholder</div>
              </div>
            </div>
          </div>
        )}
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
    <div className="mx-auto max-w-4xl p-6 sm:p-8">
      <Input
        value={note.title}
        onChange={(e) => onTitle(e.target.value)}
        className="mb-4 border-none bg-transparent px-0 text-2xl font-bold text-white focus-visible:ring-0"
      />
      <div className="mb-3 flex gap-2">
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
        placeholder="Start writing… supports markdown."
        className="min-h-[400px] border-white/10 bg-slate-900/40 font-mono text-sm text-slate-100"
      />
    </div>
  );
}

// ─── Flashcard Review (Spaced Repetition) ───────────────────────
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
      <div className="flex h-full items-center justify-center p-8 text-center text-slate-400">
        No flashcards yet. Convert a source or a note to get started.
      </div>
    );
  }

  function rate(r: 0 | 1 | 2 | 3) {
    onRate(card.id, r);
    setFlipped(false);
    setIdx((i) => (i + 1) % cards.length);
  }

  return (
    <div className="mx-auto flex max-w-2xl flex-col items-center p-6 sm:p-10">
      <div className="mb-4 flex w-full items-center justify-between text-xs text-slate-400">
        <span>
          Card {idx + 1} of {cards.length}
        </span>
        <span className="flex items-center gap-1 text-orange-300">
          <Flame className="h-3 w-3" /> Daily recall streak active
        </span>
      </div>

      <button
        onClick={() => setFlipped((f) => !f)}
        className="group relative flex min-h-[280px] w-full flex-col items-center justify-center rounded-2xl border border-white/10 bg-gradient-to-br from-slate-900/80 to-slate-800/60 p-8 text-center shadow-xl transition-transform hover:scale-[1.01]"
      >
        <div className="text-[10px] uppercase tracking-wider text-slate-500">
          {flipped ? "Answer" : "Question"}
        </div>
        <div className="mt-3 text-xl font-medium text-white">
          {flipped ? card.back : card.front}
        </div>
        <div className="mt-6 text-[10px] text-slate-600">Click to flip</div>
      </button>

      {flipped && (
        <div className="mt-6 grid w-full grid-cols-4 gap-2">
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
function QuizMode() {
  const [idx, setIdx] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);
  const q = mockQuiz[idx];

  function submit() {
    if (selected === null) return;
    if (selected === q.answer) setScore((s) => s + 1);
    if (idx + 1 >= mockQuiz.length) setDone(true);
    else {
      setIdx((i) => i + 1);
      setSelected(null);
    }
  }

  if (done) {
    return (
      <div className="mx-auto max-w-xl p-10 text-center">
        <div className="text-5xl">🎯</div>
        <h2 className="mt-4 text-2xl font-bold text-white">Quiz Complete</h2>
        <div className="mt-2 text-slate-400">
          Score: {score} / {mockQuiz.length}
        </div>
        <Progress value={(score / mockQuiz.length) * 100} className="mt-6" />
        <Button
          className="mt-6 bg-indigo-500 hover:bg-indigo-400"
          onClick={() => {
            setIdx(0);
            setSelected(null);
            setScore(0);
            setDone(false);
          }}
        >
          Retake
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl p-6 sm:p-10">
      <div className="mb-4 flex items-center justify-between text-xs text-slate-400">
        <span>
          Question {idx + 1} / {mockQuiz.length}
        </span>
        <span>Score: {score}</span>
      </div>
      <div className="rounded-2xl border border-white/10 bg-slate-900/50 p-6">
        <div className="text-lg font-medium text-white">{q.q}</div>
        <div className="mt-5 space-y-2">
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
              <div className="flex h-6 w-6 items-center justify-center rounded-full border border-current text-xs">
                {String.fromCharCode(65 + i)}
              </div>
              <span className="text-sm">{o}</span>
            </button>
          ))}
        </div>
        <Button
          onClick={submit}
          disabled={selected === null}
          className="mt-6 w-full bg-indigo-500 hover:bg-indigo-400"
        >
          Submit
        </Button>
      </div>
    </div>
  );
}

// ─── Tutor / Practice Mode ──────────────────────────────────────
function TutorMode({ source }: { source: Source }) {
  const questions = useMemo(
    () =>
      source.units.map((u) => `Explain "${u.title}" in your own words — focus on ${u.brief.toLowerCase()}`),
    [source],
  );
  const [qIdx, setQIdx] = useState(0);
  const [answer, setAnswer] = useState("");
  const [scores, setScores] = useState<{ clarity: number; grounding: number; confidence: number } | null>(null);

  function evaluate() {
    if (!answer.trim()) return;
    const len = answer.trim().length;
    setScores({
      clarity: Math.min(100, 40 + Math.round(len / 3)),
      grounding: Math.min(100, 50 + (answer.toLowerCase().includes(source.title.toLowerCase().split(" ")[0]) ? 30 : 15) + Math.round(len / 20)),
      confidence: Math.min(100, 45 + Math.round(len / 4)),
    });
  }

  function next() {
    setQIdx((i) => (i + 1) % questions.length);
    setAnswer("");
    setScores(null);
  }

  return (
    <div className="mx-auto max-w-2xl p-6 sm:p-10">
      <div className="mb-2 flex items-center gap-2 text-xs uppercase tracking-wider text-purple-300">
        <Bot className="h-3.5 w-3.5" /> Practice & Challenge Mode
      </div>
      <div className="rounded-2xl border border-purple-500/20 bg-purple-500/5 p-6">
        <div className="text-xs text-slate-400">Interactive Examiner</div>
        <div className="mt-2 text-lg font-medium text-white">{questions[qIdx]}</div>
      </div>
      <Textarea
        value={answer}
        onChange={(e) => setAnswer(e.target.value)}
        placeholder="Type your answer…"
        className="mt-4 min-h-[140px] border-white/10 bg-slate-900/40 text-sm text-slate-100"
      />
      <div className="mt-3 flex gap-2">
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
        <div className={`h-full ${color} transition-all duration-500`} style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

// ─── Assistant Panel ────────────────────────────────────────────
function AssistantPanel({
  grounded,
  setGrounded,
  messages,
  onSend,
  onClose,
  onQuickAction,
  onConvertToFlashcards,
  onCreateQuiz,
  activeSourceTitle,
}: {
  grounded: boolean;
  setGrounded: (v: boolean) => void;
  messages: ChatMsg[];
  onSend: (text: string) => void;
  onClose: () => void;
  onQuickAction: (action: string) => void;
  onConvertToFlashcards: () => void;
  onCreateQuiz: () => void;
  activeSourceTitle: string;
}) {
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  function submit(e: FormEvent) {
    e.preventDefault();
    if (!input.trim()) return;
    onSend(input);
    setInput("");
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 border-b border-white/10 px-4 py-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600">
          <Sparkles className="h-4 w-4 text-white" />
        </div>
        <div className="flex-1">
          <div className="text-sm font-semibold text-white">AI Assistant</div>
          <div className="text-[10px] text-slate-400">
            {grounded ? `Grounded in: ${activeSourceTitle}` : "General mode"}
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8 text-slate-400 hover:bg-white/5">
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="border-b border-white/10 px-4 py-2.5">
        <label className="flex cursor-pointer items-center justify-between text-xs">
          <span className="flex items-center gap-2 text-slate-300">
            <Link2 className="h-3.5 w-3.5" /> Source Grounding
          </span>
          <button
            onClick={() => setGrounded(!grounded)}
            className={`relative h-5 w-9 rounded-full transition-colors ${
              grounded ? "bg-indigo-500" : "bg-white/10"
            }`}
          >
            <span
              className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-transform ${
                grounded ? "translate-x-4" : "translate-x-0.5"
              }`}
            />
          </button>
        </label>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3">
        {messages.map((m) => (
          <div key={m.id} className={`mb-3 flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm ${
                m.role === "user"
                  ? "bg-indigo-500 text-white"
                  : "border border-white/10 bg-white/5 text-slate-100"
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
      </div>

      <div className="border-t border-white/10 px-3 py-2">
        <div className="mb-2 flex flex-wrap gap-1">
          {[
            { label: "Summarize Unit 1", icon: Sparkles },
            { label: "Generate 5 exam questions", icon: Target },
            { label: "Explain in simple terms", icon: MessageSquare },
          ].map((a) => (
            <button
              key={a.label}
              onClick={() => onQuickAction(a.label)}
              className="flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[10px] text-slate-300 hover:bg-white/10 hover:text-white"
            >
              <a.icon className="h-3 w-3" />
              {a.label}
            </button>
          ))}
        </div>
        <div className="mb-2 flex gap-1">
          <button
            onClick={onConvertToFlashcards}
            className="flex-1 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-2 py-1.5 text-[11px] font-medium text-emerald-300 hover:bg-emerald-500/20"
          >
            → Flashcards
          </button>
          <button
            onClick={onCreateQuiz}
            className="flex-1 rounded-lg border border-amber-500/30 bg-amber-500/10 px-2 py-1.5 text-[11px] font-medium text-amber-300 hover:bg-amber-500/20"
          >
            → Quiz
          </button>
          <button className="flex-1 rounded-lg border border-sky-500/30 bg-sky-500/10 px-2 py-1.5 text-[11px] font-medium text-sky-300 hover:bg-sky-500/20">
            → Audio
          </button>
        </div>
        <form onSubmit={submit} className="flex gap-1.5">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask your sources…"
            className="h-9 border-white/10 bg-white/5 text-sm placeholder:text-slate-500"
          />
          <Button type="submit" size="icon" className="h-9 w-9 shrink-0 bg-indigo-500 hover:bg-indigo-400">
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}
