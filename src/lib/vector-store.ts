// ─── Vector Store & Embedding Types ─────────────────────────────────────────

export type SourceType = "pdf" | "youtube" | "video" | "doc" | "syllabus";

export interface ChunkMetadata {
  semester: string;
  subject: string;
  topic?: string;
  source_type: SourceType;
  source_title: string;
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

// ─── Local Vector Index (Storage Cache) ──────────────────────────────────────
const localVectorMemory: NoteEmbeddingChunk[] = [];

// Cosine similarity calculation helper
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

// Save chunk to vector store
export function saveEmbeddingChunk(chunk: Omit<NoteEmbeddingChunk, "id" | "created_at">): NoteEmbeddingChunk {
  const record: NoteEmbeddingChunk = {
    ...chunk,
    id: crypto.randomUUID(),
    created_at: new Date().toISOString(),
  };
  localVectorMemory.push(record);
  return record;
}

// Perform vector similarity search with Semester & Subject filters
export function searchVectorStore(
  queryEmbedding: number[],
  semester?: string,
  subject?: string,
  topK: number = 5
): MatchResult[] {
  const filtered = localVectorMemory.filter((item) => {
    if (semester && semester !== "all" && item.metadata.semester !== semester) {
      // Flexible match (e.g. "Sem 1" vs "Semester 1")
      const s1 = semester.toLowerCase().replace(/\D/g, "");
      const s2 = item.metadata.semester.toLowerCase().replace(/\D/g, "");
      if (s1 && s2 && s1 !== s2) return false;
    }
    if (subject && subject !== "all" && item.metadata.subject.toLowerCase() !== subject.toLowerCase()) {
      if (!item.metadata.subject.toLowerCase().includes(subject.toLowerCase())) {
        return false;
      }
    }
    return true;
  });

  const candidates = filtered.length > 0 ? filtered : localVectorMemory;

  const matches = candidates.map((chunk) => ({
    chunk,
    similarity: cosineSimilarity(queryEmbedding, chunk.embedding),
  }));

  matches.sort((a, b) => b.similarity - a.similarity);
  return matches.slice(0, topK);
}

export function getAllChunks(): NoteEmbeddingChunk[] {
  return localVectorMemory;
}
