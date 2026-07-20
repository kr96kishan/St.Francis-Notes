import { createFileRoute } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { askGemini } from "@/lib/gemini";
import { Bot, SendHorizonal, Sparkles } from "lucide-react";

export const Route = createFileRoute("/chat")({
  component: Chat,
});

type Message = {
  id: number;
  role: "user" | "assistant";
  content: string;
};

function Chat() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      role: "assistant",
      content:
        "Hi! I’m your study assistant. Ask me about your syllabus, notes, or exam prep and I’ll help you right away.",
    },
  ]);
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleAsk(event?: FormEvent) {
    event?.preventDefault();

    if (!question.trim() || loading) return;

    const userMessage = {
      id: Date.now(),
      role: "user" as const,
      content: question.trim(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setQuestion("");
    setLoading(true);

    try {
      const result = await askGemini(userMessage.content);
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          role: "assistant" as const,
          content: result ?? "No response received.",
        },
      ]);
    } catch (err) {
      console.error(err);
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 2,
          role: "assistant" as const,
          content: "Something went wrong. Please try again in a moment.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-4 rounded-3xl border border-border bg-card/70 p-4 shadow-sm sm:p-6">
      <div className="flex items-center gap-3 rounded-2xl bg-primary/10 p-4">
        <div className="rounded-2xl bg-primary p-2 text-primary-foreground">
          <Bot className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-xl font-semibold">AI Study Assistant</h1>
          <p className="text-sm text-muted-foreground">Ask anything and get quick help while you study.</p>
        </div>
      </div>

      <div className="flex min-h-[360px] flex-col gap-3 rounded-2xl border border-border bg-background/80 p-3 sm:p-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-6 shadow-sm sm:max-w-[75%] ${
                message.role === "user"
                  ? "bg-primary text-primary-foreground"
                  : "border border-border bg-card text-card-foreground"
              }`}
            >
              {message.content}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="flex items-center gap-2 rounded-2xl border border-border bg-card px-4 py-3 text-sm text-muted-foreground">
              <Sparkles className="h-4 w-4 animate-pulse" />
              Thinking...
            </div>
          </div>
        )}
      </div>

      <form onSubmit={handleAsk} className="flex flex-col gap-3 rounded-2xl border border-border bg-background/90 p-3 sm:flex-row sm:items-end">
        <textarea
          className="min-h-[90px] flex-1 resize-none rounded-xl border border-border bg-background px-3 py-3 text-sm outline-none ring-0 focus:border-primary"
          rows={3}
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Ask about your notes, subjects, or exam topics..."
        />

        <button
          type="submit"
          className="flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-medium text-primary-foreground transition hover:bg-primary/90"
        >
          <SendHorizonal className="h-4 w-4" />
          {loading ? "Sending..." : "Send"}
        </button>
      </form>
    </div>
  );
}