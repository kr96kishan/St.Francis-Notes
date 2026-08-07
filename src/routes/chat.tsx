import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useRef, useEffect, useMemo } from "react";
import { useServerFn } from "@tanstack/react-start";
import { askTutor, type TutorMessage, type AttachedImagePart } from "@/lib/ai-assistant.functions";
import { syllabus, type Semester, type Subject } from "@/lib/syllabus";
import {
  useAllAdminMaterials,
  useUploadedContent,
  buildTopicKey,
  isImageFile,
  isPdfFile,
  isVideoFile,
  resolveItemUrl,
  type UploadedItem,
} from "@/lib/content-store";
import { getVideoTranscripts, checkUploadedMaterials } from "@/lib/vector-store";
import {
  ArrowLeft,
  Sparkles,
  Loader2,
  BookOpen,
  RotateCcw,
  Home,
  Layers,
  ChevronRight,
  Lock,
  FileText,
  Film,
  Image as ImageIcon,
  Youtube,
  Paperclip,
  AlertCircle,
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
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";

export const Route = createFileRoute("/chat")({
  head: () => ({
    meta: [
      { title: "Copo Tutor — BCU BCA Guided Assistant" },
      {
        name: "description",
        content:
          "100% Guided Choice-Based Copo Tutor for Bengaluru City University BCA students with dynamic file detection.",
      },
      { property: "og:title", content: "Copo Tutor — BCU BCA Guided Assistant" },
      { property: "og:description", content: "Interactive choice-based BCA study companion." },
      { name: "twitter:card", content: "summary" },
    ],
    links: [
      {
        rel: "stylesheet",
        href: "https://cdn.jsdelivr.net/npm/katex@0.16.8/dist/katex.min.css",
      },
    ],
  }),
  component: TutorPage,
});

// ─── Types ───────────────────────────────────────────────────────────────────

type Step =
  | "select-sem"
  | "select-sub"
  | "select-unit"
  | "select-action"
  | "generating"
  | "response-ready";

type ChatMsg = {
  id: string;
  role: "user" | "assistant";
  text: string;
};

// Categorised materials for the active topic
interface DetectedMaterials {
  pdfs: UploadedItem[];
  images: UploadedItem[];
  videos: UploadedItem[]; // local MP4s
  youtubes: UploadedItem[]; // YouTube links
  hasTranscripts: boolean; // YouTube transcripts indexed in vector store
  transcriptTitles: string[];
}

// ─── Standard Action Options (always shown) ──────────────────────────────────

const STANDARD_ACTIONS = [
  {
    id: "summary",
    emoji: "📝",
    title: "3-Minute Summary",
    prompt: (unit: string, sub: string, sem: string) =>
      `Provide a crisp 3-minute summary of ${unit} in ${sub} (${sem}), broken down with key bullet points and core takeaways.`,
  },
  {
    id: "analogy",
    emoji: "💡",
    title: "Real-World Analogy",
    prompt: (unit: string, sub: string, sem: string) =>
      `Explain the core concepts of ${unit} in ${sub} (${sem}) using vivid real-world analogies that a BCA student will never forget.`,
  },
  {
    id: "exam",
    emoji: "🎯",
    title: "Top 10-Mark Exam Questions",
    prompt: (unit: string, sub: string, sem: string) =>
      `List the top 10-mark and 5-mark BCU exam questions for ${unit} in ${sub} (${sem}) with structured model answer outlines.`,
  },
  {
    id: "quiz",
    emoji: "⚡",
    title: "Interactive Pop Quiz",
    prompt: (unit: string, sub: string, sem: string) =>
      `Start an interactive pop quiz for ${unit} in ${sub} (${sem}). Ask ONE high-yield exam question, provide choices/criteria, and give a model answer.`,
  },
  {
    id: "cheatsheet",
    emoji: "📌",
    title: "Formula & Definition Cheat-Sheet",
    prompt: (unit: string, sub: string, sem: string) =>
      `Create a complete Formula & Definition Cheat-Sheet for ${unit} in ${sub} (${sem}). Include formulas in LaTeX, key definitions, and theorems.`,
  },
];

const INITIAL_MESSAGE: ChatMsg = {
  id: "init",
  role: "assistant",
  text: "Hello! I am **Copo** 👋 — your 100% Guided Study Assistant for Bengaluru City University (BCU) BCA.\n\nPlease select your **Semester** below to get started:",
};

// ─── Utility helpers ─────────────────────────────────────────────────────────

/** Convert a file blob / URL to a base64 string (raw bytes, no data: prefix) */
async function fileItemToBase64(item: UploadedItem): Promise<string | null> {
  try {
    let blob: Blob;
    if (item.fileBlob) {
      blob = item.fileBlob;
    } else if (item.url.startsWith("data:")) {
      // data URI — strip header
      const base64 = item.url.split(",")[1];
      return base64 || null;
    } else {
      const resp = await fetch(resolveItemUrl(item));
      blob = await resp.blob();
    }
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        const base64 = result.split(",")[1]; // strip data:...;base64,
        resolve(base64 || null);
      };
      reader.onerror = () => reject(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

/** Extract readable text from a PDF or text file */
async function extractFileText(item: UploadedItem): Promise<string> {
  try {
    let blob: Blob;
    if (item.fileBlob) {
      blob = item.fileBlob;
    } else if (item.url.startsWith("data:")) {
      // decode base64 data URI
      const [header, b64] = item.url.split(",");
      const mime = header.match(/:(.*?);/)?.[1] || "application/octet-stream";
      const bytes = atob(b64);
      const arr = new Uint8Array(bytes.length);
      for (let i = 0; i < bytes.length; i++) arr[i] = bytes.charCodeAt(i);
      blob = new Blob([arr], { type: mime });
    } else {
      const resp = await fetch(resolveItemUrl(item));
      blob = await resp.blob();
    }

    // Try to read as plain text (works for .txt, sometimes readable PDFs)
    const text = await blob.text();
    // PDF raw bytes will have binary garbage; filter to printable ASCII lines
    if (item.name.toLowerCase().endsWith(".pdf")) {
      const lines = text.split("\n").filter((l) => {
        const printable = l.replace(/[^\x20-\x7E\n\t]/g, "").trim();
        return printable.length > 15; // only lines with substance
      });
      return lines.join("\n").slice(0, 10000);
    }
    return text.slice(0, 10000);
  } catch {
    return "";
  }
}

// ─── Dynamic Material Detector Hook ──────────────────────────────────────────

function useDetectedMaterials(
  semId: string | null,
  subId: string | null,
  chId: string | null,
  semTitle: string,
  subTitle: string
): DetectedMaterials {
  // We need a topic key, but at the unit (chapter) level we detect ALL topics under the chapter
  // For simplicity, use the chapter-level prefix to scan all topics in that chapter
  const topicKey = semId && subId && chId ? `${semId}/${subId}/${chId}` : "";
  const allMaterials = useAllAdminMaterials();

  return useMemo(() => {
    if (!topicKey) {
      return { pdfs: [], images: [], videos: [], youtubes: [], hasTranscripts: false, transcriptTitles: [] };
    }

    // Get all items whose topicKey starts with our chapter prefix
    const relevantItems = allMaterials
      .filter((m) => m.topicKey.startsWith(topicKey))
      .map((m) => m.item);

    const pdfs = relevantItems.filter((i) => isPdfFile(i) && !isVideoFile(i) && !isImageFile(i));
    const images = relevantItems.filter((i) => isImageFile(i));
    const videos = relevantItems.filter((i) => isVideoFile(i) && i.type !== "youtube");
    const youtubes = relevantItems.filter((i) => i.type === "youtube");

    // Check vector store for indexed YouTube transcripts
    const matSummary = checkUploadedMaterials(semTitle, subTitle);
    const hasTranscripts = matSummary.videos.length > 0;
    const transcriptTitles = matSummary.videos.map((v) => v.title);

    return { pdfs, images, videos, youtubes, hasTranscripts, transcriptTitles };
  }, [allMaterials, topicKey, semTitle, subTitle]);
}

// ─── Main Component ───────────────────────────────────────────────────────────

function TutorPage() {
  const navigate = useNavigate();
  const askFn = useServerFn(askTutor);
  const allMaterials = useAllAdminMaterials();

  const [step, setStep] = useState<Step>("select-sem");
  const [selectedSem, setSelectedSem] = useState<Semester | null>(null);
  const [selectedSub, setSelectedSub] = useState<Subject | null>(null);
  const [selectedUnit, setSelectedUnit] = useState<string>("");
  // Store the chapter ID for the selected unit (to look up its materials)
  const [selectedChapterId, setSelectedChapterId] = useState<string | null>(null);

  const [messages, setMessages] = useState<ChatMsg[]>([INITIAL_MESSAGE]);
  const [sending, setSending] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, step, sending]);

  // Sidebar material count
  const currentSem = selectedSem ?? syllabus[0];
  const currentSub = selectedSub ?? currentSem.subjects[0];
  const subjectMaterials = useMemo(() => {
    if (!currentSem || !currentSub) return [];
    const prefix = `${currentSem.id}/${currentSub.id}/`;
    return allMaterials.filter((m) => m.topicKey.startsWith(prefix));
  }, [allMaterials, currentSem, currentSub]);

  const [materialId, setMaterialId] = useState<string>("all");
  const materialLabel =
    materialId === "all"
      ? "All Uploaded Notes"
      : subjectMaterials.find((m) => m.item.id === materialId)?.item.name ?? "All Uploaded Notes";

  // Detect materials for the active chapter/unit
  const detectedMaterials = useDetectedMaterials(
    selectedSem?.id ?? null,
    selectedSub?.id ?? null,
    selectedChapterId,
    selectedSem?.title ?? "",
    selectedSub?.title ?? ""
  );

  // Topic-specific items (for a specific topic key, not just chapter)
  const activeTopicKey = selectedSem && selectedSub && selectedChapterId
    ? `${selectedSem.id}/${selectedSub.id}/${selectedChapterId}`
    : "";

  // ── Navigation handlers ──────────────────────────────────────────────────

  function handleSemesterSelect(sem: Semester) {
    setSelectedSem(sem);
    setSelectedSub(null);
    setSelectedUnit("");
    setSelectedChapterId(null);
    setStep("select-sub");
    addBotExchange(sem.title, `Great! You've selected **${sem.title}**.\n\nNow pick a **Subject** to focus on:`);
  }

  function handleSubjectSelect(sub: Subject) {
    setSelectedSub(sub);
    setSelectedUnit("");
    setSelectedChapterId(null);
    setStep("select-unit");
    addBotExchange(sub.title, `Got it! Subject: **${sub.title}**.\n\nSelect a **Unit / Topic** to explore:`);
  }

  function handleUnitSelect(unitName: string, chapterId: string) {
    setSelectedUnit(unitName);
    setSelectedChapterId(chapterId);
    setStep("select-action");
    addBotExchange(unitName, `Awesome! What would you like to generate for **${unitName}**?`);
  }

  function handleNavDifferentAction() {
    setStep("select-action");
    addBotExchange("🔄 Different Action for this Unit", `Select another action to generate for **${selectedUnit}**:`);
  }

  function handleNavChangeUnit() {
    setStep("select-unit");
    addBotExchange("📚 Change Topic / Unit", `Select another **Unit / Topic** from **${selectedSub?.title}**:`);
  }

  function handleNavMainMenu() {
    setSelectedSem(null);
    setSelectedSub(null);
    setSelectedUnit("");
    setSelectedChapterId(null);
    setStep("select-sem");
    addBotExchange("🏠 Return to Main Menu", "Welcome back to the main menu! Select your **Semester** to get started:");
  }

  function addBotExchange(userText: string, botText: string) {
    setMessages((prev) => [
      ...prev,
      { id: crypto.randomUUID(), role: "user", text: userText },
      { id: crypto.randomUUID(), role: "assistant", text: botText },
    ]);
  }

  // ── Core AI dispatch ─────────────────────────────────────────────────────

  async function dispatchAction(opts: {
    actionLabel: string;
    promptText: string;
    specificMaterialName?: string;
    pdfTextContent?: string;
    attachedImages?: AttachedImagePart[];
    extraBotIntro?: string;
  }) {
    if (!selectedSem || !selectedSub || !selectedUnit) return;
    setStep("generating");
    setSending(true);

    const userMsg: ChatMsg = { id: crypto.randomUUID(), role: "user", text: opts.actionLabel };
    if (opts.extraBotIntro) {
      setMessages((prev) => [
        ...prev,
        userMsg,
        { id: crypto.randomUUID(), role: "assistant", text: opts.extraBotIntro! },
      ]);
    } else {
      setMessages((prev) => [...prev, userMsg]);
    }

    const history: TutorMessage[] = messages.map((m) => ({ role: m.role, text: m.text }));
    const semTitle = selectedSem.title;
    const subTitle = selectedSub.title;

    const videoChunks = getVideoTranscripts(semTitle, subTitle);
    const videoContextText =
      videoChunks.length > 0
        ? videoChunks
            .map(
              (c) =>
                `• [${c.metadata.source_type.toUpperCase()}] ${c.metadata.source_title} [${c.metadata.timestamp_start ?? ""}-${c.metadata.timestamp_end ?? ""}]: ${c.chunk_content}`
            )
            .join("\n")
        : "";

    const matSummary = checkUploadedMaterials(semTitle, subTitle);
    const detectedVideos = matSummary.videos.map((v) => ({
      title: v.title,
      source_type: v.source_type,
    }));

    try {
      const res = await askFn({
        data: {
          message: opts.promptText,
          semester: semTitle,
          subject: subTitle,
          material: materialLabel,
          history,
          videoContext: videoContextText,
          detectedVideos,
          pdfTextContent: opts.pdfTextContent,
          specificMaterialName: opts.specificMaterialName,
          attachedImages: opts.attachedImages,
          topicKey: activeTopicKey,
        },
      });

      const answer = res.ok
        ? res.answer
        : `⚠️ ${res.error ?? "Something went wrong. Please select an option below to try again."}`;

      setMessages((prev) => [
        ...prev,
        { id: crypto.randomUUID(), role: "assistant", text: answer },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          text: `⚠️ ${err instanceof Error ? err.message : "Network error. Please try again."}`,
        },
      ]);
    } finally {
      setSending(false);
      setStep("response-ready");
    }
  }

  // ── Standard action handler ──────────────────────────────────────────────

  async function handleStandardAction(action: (typeof STANDARD_ACTIONS)[number]) {
    const prompt = action.prompt(selectedUnit, selectedSub?.title ?? "", selectedSem?.title ?? "");
    await dispatchAction({ actionLabel: `${action.emoji} ${action.title}`, promptText: prompt });
  }

  // ── PDF action handler ───────────────────────────────────────────────────

  async function handlePdfAction(item: UploadedItem) {
    setSending(true);
    const intro = `⏳ Extracting text from **${item.name}**...`;
    const userMsg: ChatMsg = { id: crypto.randomUUID(), role: "user", text: `📄 Summarize PDF: ${item.name}` };
    const botMsg: ChatMsg = { id: crypto.randomUUID(), role: "assistant", text: intro };
    setMessages((prev) => [...prev, userMsg, botMsg]);
    setSending(false);

    const text = await extractFileText(item);
    const prompt = text.trim().length > 50
      ? `Using the uploaded document content above, provide a detailed, exam-focused summary of "${item.name}" for ${selectedUnit} in ${selectedSub?.title} (${selectedSem?.title}). Structure it with: key concepts, important definitions, formulas (in LaTeX), and likely exam questions.`
      : `There is no readable text extracted from "${item.name}" (it may be a scanned/image-based PDF). Instead, use your knowledge of ${selectedUnit} in ${selectedSub?.title} (${selectedSem?.title}) to provide a comprehensive summary for this topic.`;

    await dispatchAction({
      actionLabel: `📄 Summarize PDF: ${item.name}`,
      promptText: prompt,
      specificMaterialName: item.name,
      pdfTextContent: text.trim().length > 50 ? text : undefined,
    });
  }

  // ── Image action handler ─────────────────────────────────────────────────

  async function handleImageAction(item: UploadedItem) {
    setSending(true);
    const intro = `📷 Loading image **${item.name}** for analysis...`;
    const userMsg: ChatMsg = { id: crypto.randomUUID(), role: "user", text: `🖼️ Analyse Image: ${item.name}` };
    const botMsg: ChatMsg = { id: crypto.randomUUID(), role: "assistant", text: intro };
    setMessages((prev) => [...prev, userMsg, botMsg]);
    setSending(false);

    const base64 = await fileItemToBase64(item);
    const mime = item.mime || item.fileBlob?.type || "image/jpeg";

    const attachedImages: AttachedImagePart[] = base64
      ? [{ base64Data: base64, mimeType: mime, name: item.name }]
      : [];

    const prompt = `Please analyse the uploaded image "${item.name}" which contains handwritten notes, diagrams, or whiteboard content for ${selectedUnit} in ${selectedSub?.title} (${selectedSem?.title}).
1. Transcribe all visible text and formulae
2. Identify and explain key concepts visible in the image
3. Provide a structured explanation connecting the content to the BCU BCA syllabus
4. Highlight any important exam-relevant points`;

    await dispatchAction({
      actionLabel: `🖼️ Analyse Image: ${item.name}`,
      promptText: prompt,
      specificMaterialName: item.name,
      attachedImages,
    });
  }

  // ── YouTube transcript action handler ────────────────────────────────────

  async function handleYouTubeAction(title?: string) {
    const label = title ? `🎥 Summarize: "${title}"` : "🎥 Summarize YouTube Lecture";
    const prompt = title
      ? `Using the indexed YouTube video transcripts, provide a detailed chapter-by-chapter summary of "${title}" related to ${selectedUnit} in ${selectedSub?.title} (${selectedSem?.title}). Include timestamps, key concepts, formulas, and top exam takeaways.`
      : `Using all indexed YouTube video transcripts for ${selectedSub?.title} (${selectedSem?.title}), provide a comprehensive summary focused on ${selectedUnit}. Include key concepts, timestamps where relevant, and exam-focused takeaways.`;

    await dispatchAction({
      actionLabel: label,
      promptText: prompt,
      specificMaterialName: title,
    });
  }

  // ─────────────────────────────────────────────────────────────────────────

  const hasAnyMedia =
    detectedMaterials.pdfs.length > 0 ||
    detectedMaterials.images.length > 0 ||
    detectedMaterials.videos.length > 0 ||
    detectedMaterials.hasTranscripts;

  return (
    <div className="flex h-screen w-full bg-slate-950 text-slate-100">
      {/* ── Sidebar ── */}
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
            <div className="w-8 h-8 rounded-lg bg-slate-900 border border-white/10 p-1 shadow-md overflow-hidden">
              <img src="/college-logo.png" alt="St. Francis College Logo" className="w-full h-full object-contain" />
            </div>
            <div>
              <div className="text-sm font-semibold">Copo</div>
              <div className="text-[10px] text-emerald-400 font-medium flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Guided Mode Active
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Active selection card */}
          <div className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-3">
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-indigo-400" /> Current Selection
            </div>
            <div className="space-y-2 text-xs">
              {[
                { label: "Semester", value: selectedSem?.title },
                { label: "Subject", value: selectedSub?.title },
                { label: "Unit", value: selectedUnit, highlight: true },
              ].map(({ label, value, highlight }) => (
                <div key={label} className="flex justify-between items-center text-slate-300">
                  <span>{label}:</span>
                  <span className={`font-semibold truncate max-w-[130px] ${highlight ? "text-indigo-300" : "text-white"}`}>
                    {value || "Not Selected"}
                  </span>
                </div>
              ))}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleNavMainMenu}
              className="w-full text-xs h-8 border-white/10 bg-slate-800/80 hover:bg-slate-800 text-slate-200"
            >
              <RotateCcw className="w-3.5 h-3.5 mr-1.5" /> Start Over
            </Button>
          </div>

          {/* Detected materials panel */}
          {(step === "select-action" || step === "response-ready" || step === "generating") && (
            <div className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-3">
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Paperclip className="w-3.5 h-3.5 text-indigo-400" /> Uploaded Materials
              </div>
              {hasAnyMedia ? (
                <div className="space-y-1.5 text-xs">
                  {detectedMaterials.pdfs.length > 0 && (
                    <div className="flex items-center gap-2 text-amber-300">
                      <FileText className="w-3 h-3" />
                      <span>{detectedMaterials.pdfs.length} PDF document{detectedMaterials.pdfs.length > 1 ? "s" : ""}</span>
                    </div>
                  )}
                  {detectedMaterials.images.length > 0 && (
                    <div className="flex items-center gap-2 text-emerald-300">
                      <ImageIcon className="w-3 h-3" />
                      <span>{detectedMaterials.images.length} image{detectedMaterials.images.length > 1 ? "s" : ""}</span>
                    </div>
                  )}
                  {detectedMaterials.videos.length > 0 && (
                    <div className="flex items-center gap-2 text-blue-300">
                      <Film className="w-3 h-3" />
                      <span>{detectedMaterials.videos.length} local video{detectedMaterials.videos.length > 1 ? "s" : ""}</span>
                    </div>
                  )}
                  {detectedMaterials.hasTranscripts && (
                    <div className="flex items-center gap-2 text-red-300">
                      <Youtube className="w-3 h-3" />
                      <span>{detectedMaterials.transcriptTitles.length} YouTube transcript{detectedMaterials.transcriptTitles.length > 1 ? "s" : ""} indexed</span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <AlertCircle className="w-3 h-3" />
                  No materials uploaded for this unit
                </div>
              )}
            </div>
          )}

          {/* Material scope selector */}
          <div className="space-y-2">
            <label className="text-xs uppercase tracking-wider text-slate-400 font-medium">Material Scope</label>
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
              {subjectMaterials.length} material{subjectMaterials.length === 1 ? "" : "s"} available for subject
            </p>
          </div>
        </div>

        <div className="px-5 py-4 border-t border-white/10">
          <Badge className="w-full justify-center bg-indigo-500/10 text-indigo-300 border border-indigo-400/30 hover:bg-indigo-500/10 py-1.5 text-xs">
            <Sparkles className="w-3.5 h-3.5 mr-1.5 text-indigo-400" />
            Dynamic File-Aware Chips
          </Badge>
        </div>
      </aside>

      {/* ── Main area ── */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="px-4 md:px-6 py-4 border-b border-white/10 bg-slate-900/40 backdrop-blur">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden text-slate-300 hover:text-white"
                onClick={() => navigate({ to: "/" })}
              >
                <ArrowLeft className="w-4 h-4" />
              </Button>
              <div>
                <h1 className="text-base md:text-xl font-semibold tracking-tight flex items-center gap-2">
                  Copo Assistant
                  <Badge className="bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 text-[10px]">
                    Guided Mode
                  </Badge>
                </h1>
                <p className="text-xs text-slate-400">
                  BCU BCA · Dynamic Context-Aware Tutor
                </p>
              </div>
            </div>

            {/* Breadcrumb */}
            <div className="hidden lg:flex items-center gap-1.5 text-xs">
              {[
                { value: selectedSem?.title, fallback: "Semester" },
                { value: selectedSub?.title, fallback: "Subject" },
                { value: selectedUnit, fallback: "Unit" },
              ].map(({ value, fallback }, i) => (
                <span key={fallback} className="flex items-center gap-1.5">
                  {i > 0 && <ChevronRight className="w-3.5 h-3.5 text-slate-600" />}
                  <span
                    className={`px-2.5 py-1 rounded-full border transition-colors max-w-[150px] truncate ${
                      value
                        ? "bg-indigo-500/20 border-indigo-400/40 text-indigo-200"
                        : "bg-white/5 border-white/10 text-slate-400"
                    }`}
                  >
                    {value || fallback}
                  </span>
                </span>
              ))}
            </div>
          </div>
        </header>

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto">
          <div className="max-w-3xl mx-auto px-4 md:px-8 py-6 space-y-6">
            {messages.map((m) => (
              <MessageBubble key={m.id} msg={m} />
            ))}

            {sending && (
              <div className="flex items-center gap-3 text-sm text-indigo-300 bg-indigo-500/10 border border-indigo-400/20 px-4 py-3 rounded-2xl animate-pulse">
                <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
                Copo is generating your detailed answer...
              </div>
            )}

            {/* ── Interactive Choice Panels ── */}
            <div className="pt-2 space-y-4">

              {/* STEP 1: Semester */}
              {step === "select-sem" && (
                <ChoicePanel title="Step 1 — Choose Semester" icon={<BookOpen className="w-3.5 h-3.5" />}>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                    {syllabus.map((sem) => (
                      <ChipButton key={sem.id} onClick={() => handleSemesterSelect(sem)}>
                        <span className="flex-1">{sem.title}</span>
                        <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-300 group-hover:translate-x-0.5 transition-all" />
                      </ChipButton>
                    ))}
                  </div>
                </ChoicePanel>
              )}

              {/* STEP 2: Subject */}
              {step === "select-sub" && selectedSem && (
                <ChoicePanel
                  title={`Step 2 — Choose Subject (${selectedSem.title})`}
                  icon={<BookOpen className="w-3.5 h-3.5" />}
                  onBack={handleNavMainMenu}
                  backLabel="Main Menu"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {selectedSem.subjects.map((sub) => (
                      <ChipButton key={sub.id} onClick={() => handleSubjectSelect(sub)} className="text-left flex-col items-start gap-0.5">
                        <div className="flex items-center justify-between w-full">
                          <span className="font-medium text-sm group-hover:text-indigo-200 transition-colors">{sub.title}</span>
                          <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-300 shrink-0 ml-2" />
                        </div>
                        <span className="text-[11px] text-slate-400">{sub.code}</span>
                      </ChipButton>
                    ))}
                  </div>
                </ChoicePanel>
              )}

              {/* STEP 3: Unit */}
              {step === "select-unit" && selectedSub && (
                <ChoicePanel
                  title={`Step 3 — Choose Unit (${selectedSub.title})`}
                  icon={<Layers className="w-3.5 h-3.5" />}
                  onBack={handleNavMainMenu}
                  backLabel="Main Menu"
                >
                  <div className="grid grid-cols-1 gap-2">
                    {selectedSub.chapters.length > 0 ? (
                      selectedSub.chapters.map((ch) => (
                        <ChipButton key={ch.id} onClick={() => handleUnitSelect(ch.title, ch.id)}>
                          <span className="font-medium text-sm group-hover:text-indigo-200 transition-colors flex-1">
                            {ch.title}
                          </span>
                          <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-300 shrink-0 ml-2" />
                        </ChipButton>
                      ))
                    ) : (
                      <ChipButton onClick={() => handleUnitSelect(`Entire ${selectedSub.title} Syllabus`, "general")}>
                        <span className="font-medium text-sm group-hover:text-indigo-200 flex-1">
                          Full Subject Overview & All Units
                        </span>
                        <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-300 shrink-0 ml-2" />
                      </ChipButton>
                    )}
                  </div>
                </ChoicePanel>
              )}

              {/* STEP 4: Context-Aware Action Selection */}
              {step === "select-action" && selectedUnit && (
                <ChoicePanel
                  title="Step 4 — Choose What to Generate"
                  icon={<Sparkles className="w-3.5 h-3.5" />}
                  onBack={handleNavChangeUnit}
                  backLabel="Change Unit"
                >
                  <div className="space-y-3">
                    {/* ── Dynamic File-Aware Chips ── */}
                    {hasAnyMedia && (
                      <div className="space-y-2">
                        <div className="text-[11px] uppercase tracking-wider text-emerald-400 font-semibold flex items-center gap-1.5 pb-1 border-b border-white/5">
                          <Paperclip className="w-3 h-3" /> Analyse Uploaded Materials
                        </div>
                        <div className="grid grid-cols-1 gap-2">
                          {/* PDF chips */}
                          {detectedMaterials.pdfs.map((pdf) => (
                            <MaterialChip
                              key={pdf.id}
                              icon={<FileText className="w-4 h-4 text-amber-400 shrink-0" />}
                              label={`Summarize PDF: "${pdf.name}"`}
                              badge="PDF"
                              badgeColor="amber"
                              onClick={() => handlePdfAction(pdf)}
                              disabled={sending}
                            />
                          ))}

                          {/* Image chips */}
                          {detectedMaterials.images.map((img) => (
                            <MaterialChip
                              key={img.id}
                              icon={<ImageIcon className="w-4 h-4 text-emerald-400 shrink-0" />}
                              label={`Transcribe & Explain: "${img.name}"`}
                              badge="IMAGE"
                              badgeColor="emerald"
                              onClick={() => handleImageAction(img)}
                              disabled={sending}
                            />
                          ))}

                          {/* YouTube transcript chips */}
                          {detectedMaterials.hasTranscripts &&
                            detectedMaterials.transcriptTitles.map((title) => (
                              <MaterialChip
                                key={title}
                                icon={<Youtube className="w-4 h-4 text-red-400 shrink-0" />}
                                label={`Summarize YouTube Lecture: "${title}"`}
                                badge="VIDEO"
                                badgeColor="red"
                                onClick={() => handleYouTubeAction(title)}
                                disabled={sending}
                              />
                            ))}

                          {/* Local video note (no transcript) */}
                          {detectedMaterials.videos.length > 0 && !detectedMaterials.hasTranscripts && (
                            <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-slate-800/60 border border-white/10 text-slate-400 text-xs">
                              <Film className="w-4 h-4 text-blue-400 shrink-0" />
                              <span>{detectedMaterials.videos.length} local video{detectedMaterials.videos.length > 1 ? "s" : ""} uploaded — transcript indexing required for AI analysis</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* ── Standard AI Actions ── */}
                    <div className="space-y-2">
                      {hasAnyMedia && (
                        <div className="text-[11px] uppercase tracking-wider text-indigo-300 font-semibold flex items-center gap-1.5 pb-1 border-b border-white/5">
                          <Sparkles className="w-3 h-3" /> Standard Study Actions
                        </div>
                      )}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {STANDARD_ACTIONS.map((action) => (
                          <button
                            key={action.id}
                            disabled={sending}
                            onClick={() => handleStandardAction(action)}
                            className="group text-left px-4 py-3.5 rounded-xl bg-slate-800/90 hover:bg-indigo-600/30 border border-white/10 hover:border-indigo-400/60 text-slate-100 transition-all duration-200 shadow-sm active:scale-95 flex items-center gap-3 disabled:opacity-50"
                          >
                            <span className="text-xl shrink-0 p-1 bg-white/5 rounded-lg border border-white/10 group-hover:border-indigo-400/40">
                              {action.emoji}
                            </span>
                            <span className="font-medium text-sm group-hover:text-indigo-200 transition-colors">
                              {action.title}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </ChoicePanel>
              )}

              {/* RESPONSE READY: Re-engagement chips */}
              {step === "response-ready" && (
                <ChoicePanel title="Next Steps — Where to go next?" icon={<Sparkles className="w-3.5 h-3.5" />}>
                  <div className="flex flex-wrap gap-2.5">
                    <button
                      onClick={handleNavDifferentAction}
                      className="flex-1 min-w-[200px] px-4 py-3 rounded-xl bg-indigo-500/20 hover:bg-indigo-500/30 border border-indigo-400/40 text-indigo-200 font-medium text-sm transition-all duration-200 shadow-sm active:scale-95 flex items-center justify-center gap-2"
                    >
                      🔄 Different Action for this Unit
                    </button>
                    <button
                      onClick={handleNavChangeUnit}
                      className="flex-1 min-w-[180px] px-4 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-white/10 text-slate-200 font-medium text-sm transition-all duration-200 shadow-sm active:scale-95 flex items-center justify-center gap-2"
                    >
                      📚 Change Topic / Unit
                    </button>
                    <button
                      onClick={handleNavMainMenu}
                      className="px-4 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-white/10 text-slate-300 hover:text-white font-medium text-sm transition-all duration-200 shadow-sm active:scale-95 flex items-center justify-center gap-2"
                    >
                      🏠 Return to Main Menu
                    </button>
                  </div>
                </ChoicePanel>
              )}
            </div>
          </div>
        </div>

        {/* Status bar (replaces text input) */}
        <div className="border-t border-white/10 bg-slate-900/60 backdrop-blur py-3.5 px-4 md:px-8">
          <div className="max-w-3xl mx-auto flex items-center justify-center gap-2 text-xs text-slate-400 bg-slate-800/60 border border-white/10 rounded-xl py-2.5 px-4 text-center shadow-inner">
            <Lock className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
            <span>Select an option above to continue...</span>
          </div>
        </div>
      </main>
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function ChoicePanel({
  title,
  icon,
  children,
  onBack,
  backLabel,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  onBack?: () => void;
  backLabel?: string;
}) {
  return (
    <div className="bg-slate-900/60 border border-white/10 rounded-2xl p-4 md:p-5 space-y-3 shadow-xl backdrop-blur">
      <div className="flex items-center justify-between">
        <div className="text-xs uppercase tracking-wider text-indigo-300 font-semibold flex items-center gap-1.5">
          {icon} {title}
        </div>
        {onBack && (
          <button
            onClick={onBack}
            className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1 transition-colors"
          >
            <Home className="w-3 h-3" /> {backLabel}
          </button>
        )}
      </div>
      {children}
    </div>
  );
}

function ChipButton({
  onClick,
  children,
  className = "",
  disabled = false,
}: {
  onClick: () => void;
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`group flex items-center px-4 py-3 rounded-xl bg-slate-800/80 hover:bg-indigo-600/30 border border-white/10 hover:border-indigo-400/60 text-slate-100 font-medium text-sm transition-all duration-200 shadow-sm active:scale-95 disabled:opacity-50 w-full ${className}`}
    >
      {children}
    </button>
  );
}

function MaterialChip({
  icon,
  label,
  badge,
  badgeColor,
  onClick,
  disabled,
}: {
  icon: React.ReactNode;
  label: string;
  badge: string;
  badgeColor: "amber" | "emerald" | "red" | "blue";
  onClick: () => void;
  disabled: boolean;
}) {
  const badgeClasses = {
    amber: "bg-amber-500/20 text-amber-300 border-amber-400/30",
    emerald: "bg-emerald-500/20 text-emerald-300 border-emerald-400/30",
    red: "bg-red-500/20 text-red-300 border-red-400/30",
    blue: "bg-blue-500/20 text-blue-300 border-blue-400/30",
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="group flex items-center gap-3 px-4 py-3.5 rounded-xl bg-slate-800/90 hover:bg-slate-700/60 border border-white/10 hover:border-white/20 text-slate-100 transition-all duration-200 shadow-sm active:scale-95 disabled:opacity-50 w-full text-left"
    >
      {icon}
      <span className="font-medium text-sm group-hover:text-white transition-colors flex-1 truncate">
        {label}
      </span>
      <span
        className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded border shrink-0 ${badgeClasses[badgeColor]}`}
      >
        {badge}
      </span>
    </button>
  );
}

function MessageBubble({ msg }: { msg: ChatMsg }) {
  const isUser = msg.role === "user";
  return (
    <div className={`flex gap-3 ${isUser ? "justify-end" : "justify-start"}`}>
      {!isUser && (
        <div className="w-8 h-8 rounded-lg bg-slate-900 border border-white/10 p-1 shadow-md shrink-0 overflow-hidden">
          <img
            src="/college-logo.png"
            alt="St. Francis College Logo"
            className="w-full h-full object-contain"
          />
        </div>
      )}
      <div
        className={`rounded-2xl px-4 py-3 max-w-[85%] text-sm leading-relaxed ${
          isUser
            ? "bg-indigo-600 text-white rounded-br-sm shadow-md"
            : "bg-slate-800/80 border border-white/10 text-slate-100 rounded-bl-sm shadow-md"
        }`}
      >
        {isUser ? (
          <p className="whitespace-pre-wrap font-medium">{msg.text}</p>
        ) : (
          <div className="prose prose-sm prose-invert max-w-none prose-p:my-2 prose-pre:my-2 prose-pre:bg-slate-950/80 prose-pre:border prose-pre:border-white/10 prose-code:text-indigo-300 prose-headings:text-white prose-strong:text-white prose-a:text-indigo-300">
            <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]}>
              {msg.text}
            </ReactMarkdown>
          </div>
        )}
      </div>
    </div>
  );
}
