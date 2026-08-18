import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";
import {
  ArrowLeft,
  Home,
  Send,
  Sparkles,
  FileText,
  Youtube,
  Video,
  Loader2,
  ListChecks,
  BookOpen,
  HelpCircle,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { syllabus } from "@/lib/syllabus";
import { askCopo, listCopoSources, type CopoMessage } from "@/lib/copo.functions";

export const Route = createFileRoute("/chat")({
  head: () => ({
    meta: [
      { title: "Copo AI — Study Assistant | St. Francis Notes" },
      {
        name: "description",
        content:
          "Copo AI reads the notes, documents and lecture videos uploaded by the admin and answers questions, writes summaries and extracts key points for BCA students.",
      },
      { property: "og:title", content: "Copo AI — Study Assistant" },
      {
        property: "og:description",
        content: "Ask questions, get summaries and key points from your admin-uploaded BCA notes.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: CopoAiPage,
});

const QUICK_ACTIONS = [
  { icon: BookOpen, label: "Summarize the notes", prompt: "Give me a clear unit-wise summary of everything the admin has uploaded in the current scope." },
  { icon: ListChecks, label: "Extract key points", prompt: "Extract the most important exam-ready key points from the uploaded materials as a numbered list." },
  { icon: HelpCircle, label: "Top exam questions", prompt: "Based only on the uploaded materials, list 5 likely BCU exam questions with short model answer outlines." },
  { icon: Sparkles, label: "What's uploaded?", prompt: "List every material the admin has uploaded in this scope with a one-line description of what it covers." },
];

interface ChatMessage extends CopoMessage {
  id: string;
  error?: boolean;
}

function CopoAiPage() {
  const navigate = useNavigate();
  const ask = useServerFn(askCopo);

  const [semId, setSemId] = useState<string>("all");
  const [subjectId, setSubjectId] = useState<string>("all");
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const sourcesQuery = useQuery({
    queryKey: ["copo-sources"],
    queryFn: () => listCopoSources(),
    staleTime: 30_000,
  });

  const allSources = sourcesQuery.data?.sources ?? [];
  const scopedSources = allSources.filter(
    (s) =>
      (semId === "all" || s.sem_id === semId) &&
      (subjectId === "all" || s.subject_id === subjectId),
  );

  const activeSem = syllabus.find((s) => s.id === semId);
  const subjects = activeSem?.subjects ?? [];

  useEffect(() => {
    setSubjectId("all");
  }, [semId]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, sending]);

  async function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed || sending) return;

    const userMsg: ChatMessage = { id: crypto.randomUUID(), role: "user", text: trimmed };
    const history = messages.filter((m) => !m.error).map(({ role, text }) => ({ role, text }));
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setSending(true);

    try {
      const res = await ask({
        data: {
          message: trimmed,
          semId: semId === "all" ? undefined : semId,
          subjectId: subjectId === "all" ? undefined : subjectId,
          history,
        },
      });

      setMessages((prev) => [
        ...prev,
        res.ok
          ? { id: crypto.randomUUID(), role: "assistant", text: res.answer }
          : {
              id: crypto.randomUUID(),
              role: "assistant",
              text: res.error ?? "Something went wrong.",
              error: true,
            },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          text: err instanceof Error ? err.message : "Could not reach Copo AI.",
          error: true,
        },
      ]);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="flex h-screen w-full flex-col overflow-hidden bg-slate-950 text-slate-100">
      {/* Header */}
      <header className="shrink-0 border-b border-white/10 bg-slate-900/60 px-4 py-3 backdrop-blur md:px-6">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="text-slate-300 hover:bg-white/5 hover:text-white"
              onClick={() => navigate({ to: "/" })}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="flex items-center gap-2 text-base font-semibold tracking-tight md:text-lg">
                Copo AI
                <Badge className="border border-indigo-400/30 bg-indigo-500/20 text-[10px] uppercase tracking-wider text-indigo-200">
                  Grounded in your notes
                </Badge>
              </h1>
              <p className="text-xs text-slate-400">
                St. Francis College · Bengaluru City University BCA
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate({ to: "/" })}
            className="gap-1.5 border-white/10 bg-white/5 text-xs text-slate-200 hover:bg-white/10"
          >
            <Home className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Dashboard</span>
          </Button>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-6xl flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="hidden w-72 shrink-0 flex-col gap-4 overflow-y-auto border-r border-white/10 bg-slate-900/40 p-4 md:flex">
          <div className="space-y-2">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Semester
            </label>
            <Select value={semId} onValueChange={setSemId}>
              <SelectTrigger className="border-white/10 bg-slate-900/70 text-sm text-slate-100">
                <SelectValue placeholder="All semesters" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All semesters</SelectItem>
                {syllabus.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Subject
            </label>
            <Select value={subjectId} onValueChange={setSubjectId} disabled={!activeSem}>
              <SelectTrigger className="border-white/10 bg-slate-900/70 text-sm text-slate-100">
                <SelectValue placeholder="All subjects" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All subjects</SelectItem>
                {subjects.map((sub) => (
                  <SelectItem key={sub.id} value={sub.id}>
                    {sub.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex-1 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Admin sources ({scopedSources.length})
              </label>
              <button
                onClick={() => sourcesQuery.refetch()}
                className="text-slate-400 transition-colors hover:text-slate-200"
                aria-label="Refresh sources"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${sourcesQuery.isFetching ? "animate-spin" : ""}`} />
              </button>
            </div>

            {sourcesQuery.isLoading ? (
              <div className="space-y-2">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="h-10 animate-pulse rounded-lg bg-white/5" />
                ))}
              </div>
            ) : scopedSources.length === 0 ? (
              <p className="rounded-lg border border-white/10 bg-white/5 p-3 text-xs leading-relaxed text-slate-400">
                No materials uploaded here yet. Copo AI only answers from notes, documents and
                video links the admin uploads.
              </p>
            ) : (
              <ul className="space-y-1.5">
                {scopedSources.map((s, i) => {
                  const Icon = s.type === "youtube" ? Youtube : s.type === "video" ? Video : FileText;
                  return (
                    <li
                      key={`${s.name}-${i}`}
                      className="flex items-start gap-2 rounded-lg border border-white/10 bg-white/5 px-2.5 py-2 text-xs text-slate-300"
                    >
                      <Icon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-indigo-300" />
                      <span className="break-words">{s.name}</span>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-slate-800/70 px-3 py-2 text-xs text-slate-300">
            <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
            Copo AI ready
          </div>
        </aside>

        {/* Chat */}
        <main className="flex min-w-0 flex-1 flex-col">
          <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto p-4 md:p-6">
            {messages.length === 0 && (
              <div className="mx-auto max-w-xl space-y-6 py-8 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-indigo-400/30 bg-indigo-500/15">
                  <Sparkles className="h-6 w-6 text-indigo-300" />
                </div>
                <div className="space-y-2">
                  <h2 className="text-2xl font-bold tracking-tight text-white">
                    Ask Copo about your notes
                  </h2>
                  <p className="text-sm text-slate-400">
                    Copo reads every note, document and lecture link uploaded by the admin and
                    answers strictly from them — with citations.
                  </p>
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                  {QUICK_ACTIONS.map((a) => (
                    <button
                      key={a.label}
                      onClick={() => send(a.prompt)}
                      disabled={sending}
                      className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-3 text-left text-sm text-slate-200 transition-transform duration-200 hover:-translate-y-0.5 hover:bg-white/10 disabled:opacity-50"
                    >
                      <a.icon className="h-4 w-4 shrink-0 text-indigo-300" />
                      {a.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-lg ${
                    m.role === "user"
                      ? "bg-indigo-600 text-white"
                      : m.error
                        ? "border border-rose-500/30 bg-rose-500/10 text-rose-200"
                        : "border border-white/10 bg-slate-900/80 text-slate-100"
                  }`}
                >
                  {m.role === "assistant" && !m.error ? (
                    <div className="prose prose-invert prose-sm max-w-none prose-pre:bg-slate-950 prose-headings:text-white">
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm, remarkMath]}
                        rehypePlugins={[rehypeKatex]}
                      >
                        {m.text}
                      </ReactMarkdown>
                    </div>
                  ) : (
                    <span className="whitespace-pre-wrap">{m.text}</span>
                  )}
                </div>
              </div>
            ))}

            {sending && (
              <div className="flex justify-start">
                <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-3 text-sm text-slate-300">
                  <Loader2 className="h-4 w-4 animate-spin text-indigo-300" />
                  Reading your notes…
                </div>
              </div>
            )}
          </div>

          {/* Quick chips + input */}
          <div className="shrink-0 border-t border-white/10 bg-slate-900/60 p-3 backdrop-blur md:p-4">
            {messages.length > 0 && (
              <div className="mb-2 flex gap-2 overflow-x-auto pb-1">
                {QUICK_ACTIONS.map((a) => (
                  <button
                    key={a.label}
                    onClick={() => send(a.prompt)}
                    disabled={sending}
                    className="whitespace-nowrap rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-slate-300 transition-colors hover:bg-white/10 disabled:opacity-50"
                  >
                    {a.label}
                  </button>
                ))}
              </div>
            )}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                send(input);
              }}
              className="flex items-end gap-2"
            >
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    send(input);
                  }
                }}
                rows={1}
                placeholder="Ask anything about the uploaded notes…"
                className="max-h-40 min-h-[46px] flex-1 resize-none rounded-xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-slate-100 placeholder:text-slate-500 focus:border-indigo-400/50 focus:outline-none"
              />
              <Button
                type="submit"
                disabled={sending || !input.trim()}
                className="h-[46px] rounded-xl bg-indigo-600 px-4 text-white hover:bg-indigo-500 disabled:opacity-50"
              >
                {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </Button>
            </form>
            <p className="mt-2 text-center text-[11px] text-slate-500">
              Answers are grounded only in admin-uploaded materials · {allSources.length} source
              {allSources.length === 1 ? "" : "s"} indexed
            </p>
          </div>
        </main>
      </div>
    </div>
  );
}
