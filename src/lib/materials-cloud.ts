import { supabase } from "@/integrations/supabase/client";

/**
 * Cloud mirror of admin-uploaded study materials.
 * Files/videos still live locally for playback, but their metadata + any
 * readable text is stored in the database so Copo AI can ground answers on them.
 */

export interface CloudMaterialRow {
  id: string;
  topic_key: string;
  sem_id: string | null;
  subject_id: string | null;
  chapter_id: string | null;
  topic_id: string | null;
  type: string;
  name: string;
  url: string;
  mime: string | null;
  text_content: string | null;
  uploaded_by: string;
  created_at: string;
}

const TEXT_EXTRACT_LIMIT = 20000;

async function extractText(blob?: Blob | File, name?: string): Promise<string | null> {
  if (!blob) return null;
  const isText =
    blob.type.startsWith("text/") ||
    /\.(txt|md|csv|json)$/i.test(name ?? "") ||
    blob.type === "application/json";
  if (!isText) return null;
  try {
    const text = await blob.text();
    return text.slice(0, TEXT_EXTRACT_LIMIT);
  } catch {
    return null;
  }
}

export async function syncMaterialToCloud(params: {
  id: string;
  topicKey: string;
  type: string;
  name: string;
  url?: string;
  mime?: string;
  uploadedBy?: string;
  fileBlob?: Blob | File;
}): Promise<void> {
  const [semId, subjectId, chapterId, topicId] = params.topicKey.split("/");
  const textContent = await extractText(params.fileBlob, params.name);

  const { error } = await supabase.from("admin_materials").insert({
    id: params.id,
    topic_key: params.topicKey,
    sem_id: semId ?? null,
    subject_id: subjectId ?? null,
    chapter_id: chapterId ?? null,
    topic_id: topicId ?? null,
    type: params.type,
    name: params.name,
    url: params.type === "youtube" ? (params.url ?? "") : "",
    mime: params.mime ?? null,
    text_content: textContent,
    uploaded_by: params.uploadedBy ?? "Admin",
  });

  if (error) console.error("[Copo] Failed to sync material to cloud:", error.message);
}

export async function deleteMaterialFromCloud(id: string): Promise<void> {
  const { error } = await supabase.from("admin_materials").delete().eq("id", id);
  if (error) console.error("[Copo] Failed to remove material from cloud:", error.message);
}
