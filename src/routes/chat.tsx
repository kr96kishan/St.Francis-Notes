import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { ArrowLeft, Brain, Send, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/chat")({
  head: () => ({
    meta: [
      { title: "AI Assistant — St.Francis Notes" },
      {
        name: "description",
        content: "AI Assistant workspace for St.Francis Notes.",
      },
    ],
  }),
  component: WorkspacePage,
});

type ChatMsg = {
  id: string;
  role: "user" | "assistant";
  text: string;
};

function WorkspacePage() {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<ChatMsg[]>([
    {
      id: "m0",
      role: "assistant",
      text: "👋 Workspace reset. Ready for your new idea!",
    },
  ]);
  const [input, setInput] = useState("");

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!input.trim()) return;

    const newMsg: ChatMsg = {
      id: crypto.randomUUID(),
      role: "user",
      text: input.trim(),
    };

    setMessages((prev) => [...prev, newMsg]);
    setInput("");

    // Minimal echo response placeholder
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          text: `Received: "${newMsg.text}". Ready for your custom logic!`,
        },
      ]);
    }, 400);
  }

  return (
    <div className="dark min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* ── Top Header ── */}
      <header className="sticky top-0 z-40 border-b border-white/10 bg-slate-950/90 backdrop-blur-xl">
        <div className="flex h-14 items-center gap-3 px-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate({ to: "/" })}
            className="gap-2 text-slate-300 hover:bg-white/5 hover:text-white px-2"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back</span>
          </Button>

          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 shrink-0">
              <Brain className="h-4 w-4 text-white" />
            </div>
            <div>
              <div className="text-sm font-semibold text-white">AI Assistant</div>
              <div className="text-[10px] text-slate-400">Clean Slate</div>
            </div>
          </div>
        </div>
      </header>

      {/* ── Main Chat Area ── */}
      <div className="flex-1 flex flex-col max-w-4xl w-full mx-auto p-4">
        <div className="flex-1 overflow-y-auto space-y-4 py-4">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
            >
              {m.role === "assistant" && (
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 mr-2.5 mt-1">
                  <Sparkles className="h-3.5 w-3.5 text-white" />
                </div>
              )}
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm ${
                  m.role === "user"
                    ? "bg-indigo-500 text-white rounded-br-sm shadow-md"
                    : "border border-white/10 bg-slate-900/80 text-slate-100 rounded-bl-sm"
                }`}
              >
                <p className="whitespace-pre-wrap">{m.text}</p>
              </div>
            </div>
          ))}
        </div>

        {/* ── Input Box ── */}
        <form onSubmit={handleSubmit} className="mt-4 flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message or prompt..."
            className="border-white/10 bg-slate-900/60 text-slate-100 h-11 placeholder:text-slate-500"
          />
          <Button
            type="submit"
            disabled={!input.trim()}
            className="h-11 px-5 bg-indigo-500 hover:bg-indigo-400 text-white gap-2 font-medium"
          >
            <span>Send</span>
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}
