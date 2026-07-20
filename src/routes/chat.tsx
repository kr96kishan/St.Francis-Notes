import { createFileRoute } from "@tanstack/react-router";
import {
  useState,
  useRef,
  useEffect,
  type FormEvent,
  type ChangeEvent,
} from "react";
import { askGemini, type ChatMessage, type AttachedMedia } from "@/lib/gemini";
import {
  Bot,
  SendHorizonal,
  Sparkles,
  ImagePlus,
  X,
  Copy,
  Check,
  RotateCcw,
  ChevronDown,
  Lightbulb,
  BookOpen,
  FileQuestion,
  Zap,
  Link,
  Paperclip,
} from "lucide-react";

export const Route = createFileRoute("/chat")({
  component: Chat,
});

// ─── Types ────────────────────────────────────────────────────────────────────
interface UIMessage {
  id: number;
  role: "user" | "assistant";
  text: string;
  attachments?: AttachedMedia[];
  isError?: boolean;
  isStreaming?: boolean;
}

// ─── Quick action prompts ─────────────────────────────────────────────────────
const QUICK_ACTIONS = [
  {
    icon: <FileQuestion className="h-4 w-4" />,
    label: "Generate MCQs",
    prompt: "Generate 10 multiple-choice questions for Semester 1 Data Structures covering Arrays and Linked Lists.",
  },
  {
    icon: <BookOpen className="h-4 w-4" />,
    label: "Summarise a topic",
    prompt: "Give me a concise summary of Process Scheduling in Operating Systems.",
  },
  {
    icon: <Lightbulb className="h-4 w-4" />,
    label: "Study tips",
    prompt: "What are the best study techniques for my BCA exams? Give me a practical schedule.",
  },
  {
    icon: <Zap className="h-4 w-4" />,
    label: "Explain a concept",
    prompt: "Explain Prim's algorithm step by step with a simple example.",
  },
];

// ─── Markdown renderer (lightweight) ─────────────────────────────────────────
function renderMarkdown(text: string): string {
  return text
    // Code blocks
    .replace(/```(\w*)\n?([\s\S]*?)```/g, (_m, lang, code) => {
      return `<pre class="my-2 overflow-x-auto rounded-xl bg-muted/60 p-3 text-xs font-mono border border-border"><code class="language-${lang}">${escapeHtml(code.trim())}</code></pre>`;
    })
    // Inline code
    .replace(/`([^`]+)`/g, `<code class="rounded bg-muted px-1 py-0.5 text-xs font-mono">$1</code>`)
    // Bold
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    // Italic
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    // Headers
    .replace(/^### (.+)$/gm, `<h3 class="mt-3 mb-1 text-sm font-bold">$1</h3>`)
    .replace(/^## (.+)$/gm, `<h2 class="mt-3 mb-1 text-sm font-bold">$1</h2>`)
    .replace(/^# (.+)$/gm, `<h1 class="mt-3 mb-1 text-base font-bold">$1</h1>`)
    // Bullet lists
    .replace(/^[•\-\*] (.+)$/gm, `<li class="ml-4 list-disc leading-6">$1</li>`)
    // Numbered lists
    .replace(/^\d+\. (.+)$/gm, `<li class="ml-4 list-decimal leading-6">$1</li>`)
    // Line breaks
    .replace(/\n/g, "<br />");
}

function escapeHtml(str: string) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

// ─── Copy button ──────────────────────────────────────────────────────────────
function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    await navigator.clipboard.writeText(text).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button
      onClick={handleCopy}
      title="Copy response"
      className="flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground transition hover:text-foreground"
    >
      {copied ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
    </button>
  );
}

// ─── Message bubble ───────────────────────────────────────────────────────────
function MessageBubble({ msg }: { msg: UIMessage }) {
  const isUser = msg.role === "user";

  return (
    <div className={`flex gap-2 ${isUser ? "flex-row-reverse" : "flex-row"} items-end`}>
      {/* Avatar */}
      {!isUser && (
        <div className="flex-shrink-0 w-7 h-7 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-sm">
          <Sparkles className="h-3.5 w-3.5 text-white" />
        </div>
      )}

      <div className={`group flex flex-col gap-1 ${isUser ? "items-end" : "items-start"} max-w-[82%] sm:max-w-[75%]`}>
        {/* Attached images (user only) */}
        {msg.attachments && msg.attachments.length > 0 && (
          <div className="flex flex-wrap gap-2 justify-end">
            {msg.attachments.map((a, i) => (
              <img
                key={i}
                src={a.dataUrl}
                alt={a.name}
                className="h-28 w-28 rounded-xl object-cover border border-border shadow-sm"
              />
            ))}
          </div>
        )}

        {/* Bubble */}
        <div
          className={`relative rounded-2xl px-4 py-3 text-sm leading-6 shadow-sm transition-all ${
            isUser
              ? "bg-gradient-to-br from-violet-600 to-indigo-600 text-white rounded-br-sm"
              : msg.isError
              ? "border border-destructive/30 bg-destructive/5 text-destructive rounded-bl-sm"
              : "border border-border bg-card text-card-foreground rounded-bl-sm"
          }`}
        >
          {isUser ? (
            <span className="whitespace-pre-wrap">{msg.text}</span>
          ) : msg.isStreaming ? (
            <span className="flex items-center gap-2 text-muted-foreground">
              <span className="flex gap-1">
                <span className="h-2 w-2 rounded-full bg-violet-400 animate-bounce [animation-delay:0ms]" />
                <span className="h-2 w-2 rounded-full bg-violet-400 animate-bounce [animation-delay:150ms]" />
                <span className="h-2 w-2 rounded-full bg-violet-400 animate-bounce [animation-delay:300ms]" />
              </span>
              <span className="text-xs">Francis AI is thinking…</span>
            </span>
          ) : (
            <span
              className="prose-sm prose-violet max-w-none"
              dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.text) }}
            />
          )}
        </div>

        {/* Action row (assistant only) */}
        {!isUser && !msg.isStreaming && (
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity px-1">
            <CopyButton text={msg.text} />
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main Chat Component ──────────────────────────────────────────────────────
function Chat() {
  const [uiMessages, setUiMessages] = useState<UIMessage[]>([
    {
      id: 1,
      role: "assistant",
      text: "Hey there! 👋 I'm **Francis AI**, your personal study companion for St. Francis College.\n\nI know your **entire BCA syllabus**, can read your notes from photos, summarise videos, generate MCQs, and help you prep for exams. What would you like to explore today?",
    },
  ]);

  // History stored as Gemini SDK-compatible format (excludes UI-only state)
  const [history, setHistory] = useState<ChatMessage[]>([]);

  const [input, setInput] = useState("");
  const [attachments, setAttachments] = useState<AttachedMedia[]>([]);
  const [loading, setLoading] = useState(false);
  const [showScrollBtn, setShowScrollBtn] = useState(false);

  const bottomRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textAreaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [uiMessages]);

  // Show scroll-to-bottom button
  const handleScroll = () => {
    const el = scrollAreaRef.current;
    if (!el) return;
    const distFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    setShowScrollBtn(distFromBottom > 200);
  };

  // Auto-grow textarea
  useEffect(() => {
    const el = textAreaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }, [input]);

  // Detect YouTube URL in input
  const youtubeUrl =
    /(?:youtube\.com\/watch\?v=|youtu\.be\/)[\w-]+/.exec(input)?.[0] !== undefined
      ? input.match(/https?:\/\/(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)[\w-]+/)?.[0]
      : undefined;

  async function handleSend(event?: FormEvent, quickPrompt?: string) {
    event?.preventDefault();
    const text = (quickPrompt ?? input).trim();
    if ((!text && attachments.length === 0) || loading) return;

    const userMsg: UIMessage = {
      id: Date.now(),
      role: "user",
      text,
      attachments: attachments.length > 0 ? [...attachments] : undefined,
    };

    const streamingMsg: UIMessage = {
      id: Date.now() + 1,
      role: "assistant",
      text: "",
      isStreaming: true,
    };

    setUiMessages((prev) => [...prev, userMsg, streamingMsg]);
    setInput("");
    setAttachments([]);
    setLoading(true);

    try {
      const reply = await askGemini(text, history, attachments, youtubeUrl);

      // Update streaming → real reply
      setUiMessages((prev) =>
        prev.map((m) =>
          m.id === streamingMsg.id ? { ...m, text: reply, isStreaming: false } : m
        )
      );

      // Persist history for multi-turn
      setHistory((prev) => [
        ...prev,
        { role: "user", parts: [{ text }] },
        { role: "model", parts: [{ text: reply }] },
      ]);
    } catch (err: unknown) {
      const errText =
        err instanceof Error && err.message.includes("API_KEY")
          ? "⚠️ The Gemini API key is missing or invalid. Please ask an admin to configure `VITE_GEMINI_API_KEY`."
          : "Oops, something went wrong on my end. Give it another shot! 🔄";

      setUiMessages((prev) =>
        prev.map((m) =>
          m.id === streamingMsg.id
            ? { ...m, text: errText, isStreaming: false, isError: true }
            : m
        )
      );
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    files.forEach((file) => {
      if (!file.type.startsWith("image/")) return;
      const reader = new FileReader();
      reader.onload = () => {
        setAttachments((prev) => [
          ...prev,
          {
            dataUrl: reader.result as string,
            mimeType: file.type,
            name: file.name,
          },
        ]);
      };
      reader.readAsDataURL(file);
    });
    e.target.value = "";
  }

  function removeAttachment(index: number) {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  }

  function clearConversation() {
    setUiMessages([
      {
        id: Date.now(),
        role: "assistant",
        text: "Conversation cleared! Starting fresh 🌟 — what would you like to study?",
      },
    ]);
    setHistory([]);
  }

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-0 rounded-3xl border border-border bg-card/60 shadow-xl overflow-hidden backdrop-blur-sm" style={{ minHeight: "calc(100vh - 120px)" }}>

      {/* ── Header ─────────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-3 border-b border-border bg-gradient-to-r from-violet-500/10 via-indigo-500/5 to-transparent px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 p-2.5 text-white shadow-md">
              <Bot className="h-5 w-5" />
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-card bg-green-500" />
          </div>
          <div>
            <h1 className="text-base font-bold tracking-tight">Francis AI</h1>
            <p className="text-xs text-muted-foreground">Your BCA study companion • Powered by Gemini</p>
          </div>
        </div>
        <button
          onClick={clearConversation}
          title="Clear conversation"
          className="flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-xs text-muted-foreground transition hover:border-destructive/30 hover:text-destructive"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          Clear
        </button>
      </div>

      {/* ── Messages ───────────────────────────────────────────── */}
      <div
        ref={scrollAreaRef}
        onScroll={handleScroll}
        className="relative flex-1 overflow-y-auto px-4 py-5 sm:px-6"
      >
        <div className="flex flex-col gap-5">
          {uiMessages.map((msg) => (
            <MessageBubble key={msg.id} msg={msg} />
          ))}
        </div>
        <div ref={bottomRef} />

        {/* Scroll to bottom button */}
        {showScrollBtn && (
          <button
            onClick={() => bottomRef.current?.scrollIntoView({ behavior: "smooth" })}
            className="absolute bottom-4 right-4 flex h-8 w-8 items-center justify-center rounded-full border border-border bg-card shadow-md text-muted-foreground hover:text-foreground transition"
          >
            <ChevronDown className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* ── Quick actions (shown only when history is empty) ───── */}
      {uiMessages.length <= 1 && (
        <div className="grid grid-cols-2 gap-2 px-4 pb-2 sm:grid-cols-4 sm:px-6">
          {QUICK_ACTIONS.map((action) => (
            <button
              key={action.label}
              onClick={() => handleSend(undefined, action.prompt)}
              disabled={loading}
              className="flex flex-col items-start gap-2 rounded-xl border border-border bg-background/80 p-3 text-left text-xs transition hover:border-violet-400/40 hover:bg-violet-500/5 disabled:opacity-40"
            >
              <span className="rounded-lg bg-violet-500/10 p-1.5 text-violet-600 dark:text-violet-400">
                {action.icon}
              </span>
              <span className="font-medium text-foreground">{action.label}</span>
            </button>
          ))}
        </div>
      )}

      {/* ── Attachment previews ─────────────────────────────────── */}
      {attachments.length > 0 && (
        <div className="flex flex-wrap gap-2 px-4 pb-2 sm:px-6">
          {attachments.map((att, i) => (
            <div key={i} className="relative">
              <img
                src={att.dataUrl}
                alt={att.name}
                className="h-16 w-16 rounded-xl object-cover border border-border shadow-sm"
              />
              <button
                onClick={() => removeAttachment(i)}
                className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-white shadow"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* YouTube URL chip */}
      {youtubeUrl && (
        <div className="flex items-center gap-2 px-4 pb-1 sm:px-6">
          <div className="flex items-center gap-1.5 rounded-full border border-red-300/40 bg-red-500/10 px-3 py-1 text-xs text-red-600 dark:text-red-400">
            <Link className="h-3.5 w-3.5" />
            YouTube video detected — I'll discuss it!
          </div>
        </div>
      )}

      {/* ── Input bar ──────────────────────────────────────────── */}
      <div className="border-t border-border bg-background/90 px-4 py-3 sm:px-5">
        <form
          onSubmit={handleSend}
          className="flex items-end gap-2"
        >
          {/* Attachment button */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={handleFileChange}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            title="Attach image"
            className="flex-shrink-0 flex h-10 w-10 items-center justify-center rounded-xl border border-border text-muted-foreground transition hover:border-violet-400/40 hover:text-violet-500"
          >
            <ImagePlus className="h-5 w-5" />
          </button>

          {/* Textarea */}
          <div className="relative flex-1">
            <textarea
              ref={textAreaRef}
              rows={1}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask anything — paste a YouTube link, describe a topic, or attach a photo…"
              className="w-full resize-none rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none transition focus:border-violet-400/60 focus:ring-1 focus:ring-violet-400/20 pr-10"
              style={{ minHeight: "42px", maxHeight: "160px" }}
              disabled={loading}
            />
            {input && (
              <button
                type="button"
                onClick={() => setInput("")}
                className="absolute right-2 top-2.5 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Send button */}
          <button
            type="submit"
            disabled={(!input.trim() && attachments.length === 0) || loading}
            className="flex-shrink-0 flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 text-white shadow-md transition hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <SendHorizonal className="h-4 w-4" />
          </button>
        </form>

        <p className="mt-2 text-center text-[10px] text-muted-foreground">
          Press <kbd className="rounded border border-border px-1 py-0.5 font-mono text-[10px]">Enter</kbd> to send · <kbd className="rounded border border-border px-1 py-0.5 font-mono text-[10px]">Shift+Enter</kbd> for newline
        </p>
      </div>
    </div>
  );
}