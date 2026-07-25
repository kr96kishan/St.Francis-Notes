import { useCallback, useState, useEffect } from "react";

// ─── Types ───────────────────────────────────────────────────────────────────

export type ContentType = "file" | "youtube" | "video";

export interface UploadedItem {
  id: string;
  type: ContentType;
  name: string;
  /** For base64 fallback or youtube url */
  url: string;
  /** File size in bytes (only for type "file" or "video") */
  size?: number;
  /** MIME type (only for type "file" or "video") */
  mime?: string;
  /** ISO timestamp */
  uploadedAt: string;
  /** Name of the uploader (Admin/User) */
  uploadedBy?: string;
  /** Binary file stored natively in IndexedDB */
  fileBlob?: Blob | File;
}

export function getMimeTypeFromName(name: string): string {
  const ext = name.split(".").pop()?.toLowerCase();
  switch (ext) {
    case "pdf": return "application/pdf";
    case "png": return "image/png";
    case "jpg":
    case "jpeg": return "image/jpeg";
    case "gif": return "image/gif";
    case "webp": return "image/webp";
    case "svg": return "image/svg+xml";
    case "mp4": return "video/mp4";
    case "webm": return "video/webm";
    case "mov": return "video/quicktime";
    case "mkv": return "video/x-matroska";
    case "txt": return "text/plain";
    default: return "application/octet-stream";
  }
}

export function isImageFile(item: { name: string; mime?: string; fileBlob?: Blob | File }): boolean {
  if (item.mime?.startsWith("image/")) return true;
  if (item.fileBlob?.type?.startsWith("image/")) return true;
  return /\.(jpg|jpeg|png|gif|webp|svg|bmp|ico)$/i.test(item.name);
}

export function isVideoFile(item: { name: string; mime?: string; type?: string; fileBlob?: Blob | File }): boolean {
  if (item.type === "video") return true;
  if (item.mime?.startsWith("video/")) return true;
  if (item.fileBlob?.type?.startsWith("video/")) return true;
  return /\.(mp4|webm|ogg|mov|avi|mkv|m4v)$/i.test(item.name);
}

export function isPdfFile(item: { name: string; mime?: string; fileBlob?: Blob | File }): boolean {
  if (item.mime === "application/pdf") return true;
  if (item.fileBlob?.type === "application/pdf") return true;
  return /\.pdf$/i.test(item.name);
}

type ContentMap = Record<string, UploadedItem[]>;

export interface CustomTopic {
  id: string;
  title: string;
  content: string;
}
type CustomTopicMap = Record<string, CustomTopic[]>;

// ─── IndexedDB Utility ────────────────────────────────────────────────────────

const DB_NAME = "SparkSyllabusHubDB";
const DB_VERSION = 1;

function getDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined") {
      reject(new Error("SSR Environment"));
      return;
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains("contents")) {
        db.createObjectStore("contents");
      }
      if (!db.objectStoreNames.contains("customTopics")) {
        db.createObjectStore("customTopics");
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function dbSet(storeName: "contents" | "customTopics", key: string, value: any): Promise<void> {
  return getDB().then((db) => {
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, "readwrite");
      const store = tx.objectStore(storeName);
      const req = store.put(value, key);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  });
}

function dbDelete(storeName: "contents" | "customTopics", key: string): Promise<void> {
  return getDB().then((db) => {
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, "readwrite");
      const store = tx.objectStore(storeName);
      const req = store.delete(key);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  });
}

// ─── In-Memory Cache & Listeners ─────────────────────────────────────────────

const contentCache: ContentMap = {};
const customTopicsCache: CustomTopicMap = {};

const listeners = new Set<() => void>();
const topicListeners = new Set<() => void>();

function initDB() {
  if (typeof window === "undefined") return;
  getDB().then((db) => {
    // Load content
    const tx = db.transaction("contents", "readonly");
    const store = tx.objectStore("contents");
    const req = store.openCursor();
    req.onsuccess = (e) => {
      const cursor = (e.target as any).result;
      if (cursor) {
        contentCache[cursor.key] = cursor.value;
        cursor.continue();
      } else {
        listeners.forEach(l => l());
      }
    };

    // Load custom topics
    const txTopics = db.transaction("customTopics", "readonly");
    const storeTopics = txTopics.objectStore("customTopics");
    const reqTopics = storeTopics.openCursor();
    reqTopics.onsuccess = (e) => {
      const cursor = (e.target as any).result;
      if (cursor) {
        customTopicsCache[cursor.key] = cursor.value;
        cursor.continue();
      } else {
        topicListeners.forEach(l => l());
      }
    };
  }).catch(() => {
    console.warn("IndexedDB not supported or blocked. Operating in-memory.");
  });
}

// Start database hydration
initDB();

// ─── Topic key builders ───────────────────────────────────────────────────────

export function buildTopicKey(
  semId: string,
  subjectId: string,
  chapterId: string,
  topicId: string,
): string {
  return `${semId}/${subjectId}/${chapterId}/${topicId}`;
}

export function buildChapterKey(
  semId: string,
  subjectId: string,
  chapterId: string,
): string {
  return `${semId}/${subjectId}/${chapterId}`;
}

// ─── YouTube URL helpers ─────────────────────────────────────────────────────

export function extractYouTubeId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
  ];
  for (const p of patterns) {
    const m = url.match(p);
    if (m) return m[1];
  }
  return null;
}

export function getYouTubeEmbedUrl(url: string): string | null {
  const id = extractYouTubeId(url);
  return id ? `https://www.youtube.com/embed/${id}` : null;
}

export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
}

// Dynamic Object URL resolver for binary blobs
export function resolveItemUrl(item: UploadedItem): string {
  if (item.type === "youtube") return item.url;
  if (item.fileBlob) {
    const mime = item.mime || item.fileBlob.type || getMimeTypeFromName(item.name);
    const blobWithType = item.fileBlob.type ? item.fileBlob : new Blob([item.fileBlob], { type: mime });
    return URL.createObjectURL(blobWithType);
  }
  return item.url;
}

// ─── React hooks (Hydration-safe) ──────────────────────────────────────────

export function useUploadedContent(topicKey: string): UploadedItem[] {
  const [items, setItems] = useState<UploadedItem[]>([]);

  useEffect(() => {
    const load = () => {
      setItems(contentCache[topicKey] ?? []);
    };
    load();
    listeners.add(load);
    return () => {
      listeners.delete(load);
    };
  }, [topicKey]);

  return items;
}

export function useAllAdminMaterials(): { item: UploadedItem; topicKey: string }[] {
  const [allMaterials, setAllMaterials] = useState<{ item: UploadedItem; topicKey: string }[]>([]);

  useEffect(() => {
    const load = () => {
      const list: { item: UploadedItem; topicKey: string }[] = [];
      for (const [topicKey, items] of Object.entries(contentCache)) {
        for (const item of items) {
          list.push({ item, topicKey });
        }
      }
      setAllMaterials(list);
    };
    load();
    listeners.add(load);
    return () => {
      listeners.delete(load);
    };
  }, []);

  return allMaterials;
}

export function useMaterialCount(prefix?: string): number {
  const [count, setCount] = useState<number>(0);

  useEffect(() => {
    const load = () => {
      let total = 0;
      for (const [key, items] of Object.entries(contentCache)) {
        if (!prefix || key.startsWith(prefix)) {
          total += items.length;
        }
      }
      setCount(total);
    };
    load();
    listeners.add(load);
    return () => {
      listeners.delete(load);
    };
  }, [prefix]);

  return count;
}

export function useAddContent() {
  return useCallback(
    (topicKey: string, item: Omit<UploadedItem, "id" | "uploadedAt" | "url"> & { url?: string; fileBlob?: Blob; uploadedBy?: string }) => {
      const items = [...(contentCache[topicKey] ?? [])];
      const newItem: UploadedItem = {
        ...item,
        url: item.url || "",
        id: crypto.randomUUID(),
        uploadedAt: new Date().toISOString(),
        uploadedBy: item.uploadedBy || "Admin",
      };
      items.push(newItem);
      contentCache[topicKey] = items;
      
      // Update listeners
      listeners.forEach((l) => l());

      // Save to IndexedDB
      if (typeof window !== "undefined") {
        dbSet("contents", topicKey, items).catch(console.error);
      }
    },
    [],
  );
}

export function useRemoveContent() {
  return useCallback((topicKey: string, itemId: string) => {
    const items = contentCache[topicKey];
    if (!items) return;

    const filtered = items.filter((i) => i.id !== itemId);
    
    if (filtered.length === 0) {
      delete contentCache[topicKey];
      if (typeof window !== "undefined") {
        dbDelete("contents", topicKey).catch(console.error);
      }
    } else {
      contentCache[topicKey] = filtered;
      if (typeof window !== "undefined") {
        dbSet("contents", topicKey, filtered).catch(console.error);
      }
    }

    listeners.forEach((l) => l());
  }, []);
}

export function useCustomTopics(chapterKey: string): CustomTopic[] {
  const [topics, setTopics] = useState<CustomTopic[]>([]);

  useEffect(() => {
    const load = () => {
      setTopics(customTopicsCache[chapterKey] ?? []);
    };
    load();
    topicListeners.add(load);
    return () => {
      topicListeners.delete(load);
    };
  }, [chapterKey]);

  return topics;
}

export function useAddCustomTopic() {
  return useCallback(
    (chapterKey: string, topic: Omit<CustomTopic, "id">) => {
      const topics = [...(customTopicsCache[chapterKey] ?? [])];
      const newTopic = { ...topic, id: crypto.randomUUID() };
      topics.push(newTopic);
      customTopicsCache[chapterKey] = topics;

      topicListeners.forEach((l) => l());

      if (typeof window !== "undefined") {
        dbSet("customTopics", chapterKey, topics).catch(console.error);
      }
      return newTopic;
    },
    [],
  );
}

export function useRemoveCustomTopic() {
  return useCallback((chapterKey: string, topicId: string) => {
    const topics = customTopicsCache[chapterKey];
    if (!topics) return;
    
    const filtered = topics.filter((t) => t.id !== topicId);
    
    if (filtered.length === 0) {
      delete customTopicsCache[chapterKey];
      if (typeof window !== "undefined") {
        dbDelete("customTopics", chapterKey).catch(console.error);
      }
    } else {
      customTopicsCache[chapterKey] = filtered;
      if (typeof window !== "undefined") {
        dbSet("customTopics", chapterKey, filtered).catch(console.error);
      }
    }

    topicListeners.forEach((l) => l());

    // Clean up content under this custom topic
    const topicKey = `${chapterKey}/${topicId}`;
    if (contentCache[topicKey]) {
      delete contentCache[topicKey];
      if (typeof window !== "undefined") {
        dbDelete("contents", topicKey).catch(console.error);
      }
      listeners.forEach((l) => l());
    }
  }, []);
}
