import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useRef, useEffect, useMemo, type FormEvent } from "react";
import { useServerFn } from "@tanstack/react-start";
import { askTutor, type TutorMessage } from "@/lib/ai-assistant.functions";
import { syllabus } from "@/lib/syllabus";
import { useAllAdminMaterials } from "@/lib/content-store";
import { ArrowLeft, Send, Sparkles, Loader2, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";

export const Route = createFileRoute("/chat")({
  head: () => ({
    meta: [
      { title: "Francis AI Tutor — BCU BCA Study Companion" },
      {
        name: "description",
        content:
          "Chat with Francis AI, your Bengaluru City University BCA tutor for summaries, analogies, exam questions, and pop quizzes.",
      },
      { property: "og:title", content: "Francis AI Tutor — BCU BCA Study Companion" },
      { property: "og:description", content: "Your always-on BCA study buddy." },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: TutorPage,
});

type ChatMsg = { id: string; role: "user" | "assistant"; text: string };

const SUGGESTIONS = [
  { emoji: "📝", label: "3-Minute Subject Summary", prompt: "Give me a crisp 3-minute summary of the entire subject, unit by unit, in bullet points." },
  { emoji: "💡", label: "Explain with Real-World Analogy", prompt: "Pick the hardest core concept from this subject and explain it using a vivid real-world analogy a first-year BCA student would remember." },
  { emoji: "🎯", label: "Top Exam Questions", prompt: "List the top 5 most likely BCU exam questions from this subject, with concise model answers." },
  { emoji: "⚡", label: "Quick 1-Question Pop Quiz", prompt: "Start a 1-on-1 pop quiz. Ask me ONE question from this subject, wait for my answer, then grade it and give the correct answer with a short explanation before moving on." },
];

function TutorPage() {
  const navigate = useNavigate();
  const askFn = useServerFn(askTutor);
  const materials = useAllAdminMaterials();

  const [semesterId, setSemesterId] = useState<string>(syllabus[0].id);
  const currentSem = syllabus.find((s) => s.id === semesterId) ?? syllabus[0];
  const [subjectId, setSubjectId] = useState<string>(currentSem.subjects[0]?.id ?? "");
  const currentSub =
    currentSem.subjects.find((s) => s.id === subjectId) ?? currentSem.subjects[0];

  useEffect(() => {
    if (!currentSem.subjects.find((s) => s.id === subjectId)) {
      setSubjectId(currentSem.subjects[0]?.id ?? "");
    }
  }, [semesterId]);

  // Materials filtered by sem+subject
  const subjectMaterials = useMemo(() => {
    const prefix = `${semesterId}/${subjectId}/`;
    return materials.filter((m) => m.topicKey.startsWith(prefix));
  }, [materials, semesterId, subjectId]);

  const [materialId, setMaterialId] = useState<string>("all");
  useEffect(() => {
    setMaterialId("all");
  }, [semesterId, subjectId]);

  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, sending]);

  // Reset chat when subject changes
  useEffect(() => {
    setMessages([]);
  }, [subjectId, semesterId]);

  const materialLabel =
    materialId === "all"
      ? "All Uploaded Notes"
      : subjectMaterials.find((m) => m.item.id === materialId)?.item.name ?? "All Uploaded Notes";

  async function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed || sending) return;
    const userMsg: ChatMsg = { id: crypto.randomUUID(), role: "user", text: trimmed };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setSending(true);

    const history: TutorMessage[] = messages.map((m) => ({ role: m.role, text: m.text }));

    try {
      const res = await askFn({
        data: {
          message: trimmed,
          semester: currentSem.title,
          subject: currentSub?.title ?? "",
          material: materialLabel,
          history,
        },
      });
      const answer = res.ok
        ? res.answer
        : `⚠️ ${res.error ?? "Something went wrong. Try again in a moment."}`;
      setMessages((prev) => [...prev, { id: crypto.randomUUID(), role: "assistant", text: answer }]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          text: `⚠️ ${err instanceof Error ? err.message : "Network error"}`,
        },
      ]);
    } finally {
      setSending(false);
    }
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    send(input);
  }

  return (
    <div className="flex h-screen w-full bg-slate-950 text-slate-100">
      {/* Sidebar */}
      <aside className="hidden md:flex w-72 shrink-0 flex-col border-r border-white/10 bg-slate-900/60 backdrop-blur">
        <div className="flex items-center gap-2 px-5 py-4 border-b border-white/10">
          <Button
            variant="ghost"
            size="icon"
            className="text-slate-300 hover:text-white hover:bg-white/5"
            onClick={() => navigate({ to: "/" })}
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 grid place-items-center shadow-lg shadow-indigo-500/20">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div className="text-sm font-semibold">Francis AI</div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          <div className="space-y-2">
            <label className="text-xs uppercase tracking-wider text-slate-400 font-medium">
              Semester
            </label>
            <Select value={semesterId} onValueChange={setSemesterId}>
              <SelectTrigger className="bg-slate-800/60 border-white/10 text-slate-100">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-slate-900 border-white/10 text-slate-100">
                {syllabus.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-xs uppercase tracking-wider text-slate-400 font-medium">
              Subject
            </label>
            <div className="space-y-1">
              {currentSem.subjects.map((s) => {
                const active = s.id === subjectId;
                return (
                  <button
                    key={s.id}
                    onClick={() => setSubjectId(s.id)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                      active
                        ? "bg-indigo-500/20 text-white border border-indigo-400/40"
                        : "text-slate-300 hover:bg-white/5 border border-transparent"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <BookOpen className="w-3.5 h-3.5 opacity-70" />
                      <span className="truncate">{s.title}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs uppercase tracking-wider text-slate-400 font-medium">
              Selected Material
            </label>
            <Select value={materialId} onValueChange={setMaterialId}>
              <SelectTrigger className="bg-slate-800/60 border-white/10 text-slate-100">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-slate-900 border-white/10 text-slate-100 max-h-64">
                <SelectItem value="all">All Uploaded Notes</SelectItem>
                {subjectMaterials.map((m) => (
                  <SelectItem key={m.item.id} value={m.item.id}>
                    {m.item.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-[11px] text-slate-500">
              {subjectMaterials.length} material{subjectMaterials.length === 1 ? "" : "s"} available
            </p>
          </div>
        </div>

        <div className="px-5 py-4 border-t border-white/10">
          <Badge className="w-full justify-center bg-emerald-500/10 text-emerald-300 border border-emerald-400/30 hover:bg-emerald-500/10">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-2 animate-pulse" />
            Francis AI Ready
          </Badge>
        </div>
      </aside>

      {/* Main chat */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="px-6 py-4 border-b border-white/10 bg-slate-900/40 backdrop-blur">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h1 className="text-lg md:text-xl font-semibold tracking-tight">Francis AI Tutor</h1>
              <p className="text-xs text-slate-400">
                Bengaluru City University · BCA Study Companion
              </p>
            </div>
            <div className="hidden sm:flex items-center gap-2 text-xs text-slate-400">
              <span className="px-2 py-1 rounded-md bg-white/5 border border-white/10">
                {currentSem.title}
              </span>
              <span className="px-2 py-1 rounded-md bg-white/5 border border-white/10 max-w-[200px] truncate">
                {currentSub?.title}
              </span>
            </div>
          </div>
        </header>

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto">
          <div className="max-w-3xl mx-auto px-4 md:px-8 py-8 space-y-6">
            {messages.length === 0 && (
              <div className="text-center py-12 space-y-4">
                <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 grid place-items-center shadow-xl shadow-indigo-500/30">
                  <Sparkles className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-semibold">Hey! I'm Francis AI 👋</h2>
                  <p className="text-slate-400 mt-2 max-w-md mx-auto">
                    Your BCU BCA tutor for{" "}
                    <span className="text-indigo-300 font-medium">{currentSub?.title}</span>. Ask me
                    anything — I'll ground it in your syllabus.
                  </p>
                </div>
              </div>
            )}

            {messages.map((m) => (
              <MessageBubble key={m.id} msg={m} />
            ))}

            {sending && (
              <div className="flex items-center gap-2 text-sm text-slate-400 px-1">
                <Loader2 className="w-4 h-4 animate-spin" />
                Francis is thinking...
              </div>
            )}
          </div>
        </div>

        {/* Composer */}
        <div className="border-t border-white/10 bg-slate-900/40 backdrop-blur">
          <div className="max-w-3xl mx-auto px-4 md:px-8 py-4 space-y-3">
            {/* Suggestion chips */}
            <div className="flex flex-wrap gap-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s.label}
                  disabled={sending}
                  onClick={() => send(s.prompt)}
                  className="text-xs px-3 py-1.5 rounded-full border border-white/10 bg-white/5 hover:bg-white/10 text-slate-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="mr-1">{s.emoji}</span>
                  {s.label}
                </button>
              ))}
            </div>

            <form onSubmit={onSubmit} className="flex gap-2 items-end">
              <div className="flex-1 relative">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      send(input);
                    }
                  }}
                  placeholder={`Ask anything about ${currentSub?.title ?? "your subject"}...`}
                  rows={1}
                  className="w-full resize-none rounded-xl bg-slate-800/80 border border-white/10 focus:border-indigo-400/60 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 px-4 py-3 pr-12 text-sm text-slate-100 placeholder:text-slate-500 max-h-40"
                />
              </div>
              <Button
                type="submit"
                disabled={sending || !input.trim()}
                className="h-11 px-4 bg-indigo-500 hover:bg-indigo-400 text-white shadow-lg shadow-indigo-500/20"
              >
                {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </Button>
            </form>
            <p className="text-[11px] text-slate-500 text-center">
              Francis AI grounds answers in the BCU BCA syllabus and admin-uploaded notes.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}

function MessageBubble({ msg }: { msg: ChatMsg }) {
  const isUser = msg.role === "user";
  return (
    <div className={`flex gap-3 ${isUser ? "justify-end" : "justify-start"}`}>
      {!isUser && (
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 grid place-items-center shadow-md shadow-indigo-500/20 shrink-0">
          <Sparkles className="w-4 h-4 text-white" />
        </div>
      )}
      <div
        className={`rounded-2xl px-4 py-3 max-w-[85%] text-sm leading-relaxed ${
          isUser
            ? "bg-indigo-500 text-white rounded-br-sm"
            : "bg-slate-800/60 border border-white/10 text-slate-100 rounded-bl-sm"
        }`}
      >
        {isUser ? (
          <p className="whitespace-pre-wrap">{msg.text}</p>
        ) : (
          <div className="prose prose-sm prose-invert max-w-none prose-p:my-2 prose-pre:my-2 prose-pre:bg-slate-950/80 prose-pre:border prose-pre:border-white/10 prose-code:text-indigo-300 prose-headings:text-white prose-strong:text-white prose-a:text-indigo-300">
            <ReactMarkdown
              remarkPlugins={[remarkGfm, remarkMath]}
              rehypePlugins={[rehypeKatex]}
            >
              {msg.text}
            </ReactMarkdown>
          </div>
        )}
      </div>
    </div>
  );
}
