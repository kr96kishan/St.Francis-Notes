// ─── Vector Store & Embedding Types ──────────────────────────────────────────

export type SourceType = "pdf" | "youtube" | "video" | "doc" | "syllabus" | "youtube_video" | "local_video";

export interface ChunkMetadata {
  semester: string;
  subject: string;
  unit_id?: string;
  topic?: string;
  source_type: SourceType;
  source_title: string;
  source_url?: string;
  timestamp_start?: string;
  timestamp_end?: string;
  [key: string]: any;
}

export interface NoteEmbeddingChunk {
  id: string;
  doc_id: string;
  chunk_content: string;
  embedding: number[];
  metadata: ChunkMetadata;
  created_at: string;
}

export interface MatchResult {
  chunk: NoteEmbeddingChunk;
  similarity: number;
}

export interface UploadedMaterialsSummary {
  totalChunks: number;
  videoChunks: number;
  videos: Array<{ title: string; source_type: SourceType; doc_id: string; url?: string }>;
}

// ─── Persistent Vector Store (localStorage-backed) ───────────────────────────
const STORAGE_KEY = "SFCN_VECTOR_STORE_V1";

function loadFromStorage(): NoteEmbeddingChunk[] {
  if (typeof window === "undefined" || typeof localStorage === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveToStorage(chunks: NoteEmbeddingChunk[]): void {
  if (typeof window === "undefined" || typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(chunks));
  } catch (e) {
    console.warn("[VectorStore] localStorage quota exceeded, clearing old data:", e);
    try {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(chunks.slice(-200)));
    } catch {
      // silently fail if quota is truly exhausted
    }
  }
}

// Lazily hydrated in-memory cache
let _memCache: NoteEmbeddingChunk[] | null = null;

function getMemory(): NoteEmbeddingChunk[] {
  if (_memCache === null) {
    _memCache = loadFromStorage();
  }
  return _memCache;
}

function commitMemory(): void {
  if (_memCache !== null) {
    saveToStorage(_memCache);
  }
}

// ─── Cosine Similarity ────────────────────────────────────────────────────────
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length || a.length === 0) return 0;
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

// ─── Semester / Subject Normalizer ───────────────────────────────────────────
function normSem(s: string): string {
  return s.toLowerCase().replace(/[^0-9a-z]/g, "");
}

function semMatches(a: string, b: string): boolean {
  if (!a || !b) return true;
  const na = normSem(a);
  const nb = normSem(b);
  return na === nb || na.includes(nb) || nb.includes(na);
}

function subMatches(a: string, b: string): boolean {
  if (!a || !b) return true;
  return a.toLowerCase().includes(b.toLowerCase()) || b.toLowerCase().includes(a.toLowerCase());
}

// ─── CRUD Operations ─────────────────────────────────────────────────────────

/** Save a chunk and persist immediately to localStorage */
export function saveEmbeddingChunk(
  chunk: Omit<NoteEmbeddingChunk, "id" | "created_at">
): NoteEmbeddingChunk {
  const record: NoteEmbeddingChunk = {
    ...chunk,
    id: crypto.randomUUID(),
    created_at: new Date().toISOString(),
  };
  const mem = getMemory();
  mem.push(record);
  commitMemory();
  return record;
}

/**
 * Remove all existing chunks for a given doc_id (prevents duplicate ingestion
 * when an admin re-uploads the same video).
 */
export function clearChunksByDocId(docId: string): void {
  if (_memCache === null) _memCache = loadFromStorage();
  _memCache = _memCache.filter((c) => c.doc_id !== docId);
  commitMemory();
}

/**
 * Remove all video transcript chunks for a specific semester + subject scope
 * (allows clean re-ingestion of all videos for a subject).
 */
export function clearVideoTranscripts(semester?: string, subject?: string): void {
  if (_memCache === null) _memCache = loadFromStorage();
  _memCache = _memCache.filter((c) => {
    const isVideo =
      c.metadata.source_type === "youtube_video" ||
      c.metadata.source_type === "local_video" ||
      c.metadata.source_type === "youtube" ||
      c.metadata.source_type === "video";
    if (!isVideo) return true; // keep non-video chunks
    if (semester && !semMatches(semester, c.metadata.semester)) return true; // keep different semester
    if (subject && !subMatches(subject, c.metadata.subject)) return true; // keep different subject
    return false; // remove matching video chunks
  });
  commitMemory();
}

// ─── Query: Video Transcripts ─────────────────────────────────────────────────

/** Get all indexed video transcript chunks for active semester & subject */
export function getVideoTranscripts(semester?: string, subject?: string): NoteEmbeddingChunk[] {
  const mem = getMemory();
  return mem.filter((item) => {
    const isVideo =
      item.metadata.source_type === "youtube_video" ||
      item.metadata.source_type === "local_video" ||
      item.metadata.source_type === "youtube" ||
      item.metadata.source_type === "video";
    if (!isVideo) return false;
    if (semester && semester !== "all" && !semMatches(semester, item.metadata.semester)) return false;
    if (subject && subject !== "all" && !subMatches(subject, item.metadata.subject)) return false;
    return true;
  });
}

/**
 * Check what materials are currently indexed for a given semester + subject.
 * Returns counts, unique video titles & source types so Francis AI can confirm detection.
 */
export function checkUploadedMaterials(
  semester?: string,
  subject?: string
): UploadedMaterialsSummary {
  const mem = getMemory();

  const filtered = mem.filter((c) => {
    if (semester && semester !== "all" && !semMatches(semester, c.metadata.semester)) return false;
    if (subject && subject !== "all" && !subMatches(subject, c.metadata.subject)) return false;
    return true;
  });

  const videoChunks = filtered.filter(
    (c) =>
      c.metadata.source_type === "youtube_video" ||
      c.metadata.source_type === "local_video" ||
      c.metadata.source_type === "youtube" ||
      c.metadata.source_type === "video"
  );

  // Deduplicate by doc_id so we get one entry per video
  const seen = new Set<string>();
  const videos: UploadedMaterialsSummary["videos"] = [];
  for (const chunk of videoChunks) {
    if (!seen.has(chunk.doc_id)) {
      seen.add(chunk.doc_id);
      videos.push({
        title: chunk.metadata.source_title,
        source_type: chunk.metadata.source_type,
        doc_id: chunk.doc_id,
        url: chunk.metadata.source_url,
      });
    }
  }

  return {
    totalChunks: filtered.length,
    videoChunks: videoChunks.length,
    videos,
  };
}

// ─── Query: Vector Similarity Search ─────────────────────────────────────────

export function searchVectorStore(
  queryEmbedding: number[],
  semester?: string,
  subject?: string,
  topK: number = 5
): MatchResult[] {
  const mem = getMemory();

  const filtered = mem.filter((item) => {
    if (semester && semester !== "all") {
      if (!semMatches(semester, item.metadata.semester)) return false;
    }
    if (subject && subject !== "all") {
      if (!subMatches(subject, item.metadata.subject)) return false;
    }
    return true;
  });

  const candidates = filtered.length > 0 ? filtered : mem;

  const matches = candidates.map((chunk) => ({
    chunk,
    similarity: cosineSimilarity(queryEmbedding, chunk.embedding),
  }));

  matches.sort((a, b) => b.similarity - a.similarity);
  return matches.slice(0, topK);
}

export function getAllChunks(): NoteEmbeddingChunk[] {
  return getMemory();
}

/** Wipe the entire vector store (dev/testing use only) */
export function clearAllChunks(): void {
  _memCache = [];
  if (typeof window !== "undefined" && typeof localStorage !== "undefined") {
    localStorage.removeItem(STORAGE_KEY);
  }
}
