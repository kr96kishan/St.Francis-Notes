import { createFileRoute } from "@tanstack/react-router";
import JSZip from "jszip";
import fs from "fs";
import path from "path";

const ZIP_ROOT_NAME = "sfdc-notes";

const EXCLUDED_DIRS = new Set([
  "node_modules",
  ".git",
  "dist",
  ".output",
  ".lovable",
  ".wrangler",
  "tmp",
  "temp",
  "coverage",
  "build",
  "out",
  ".DS_Store",
]);

const EXCLUDED_FILES: (RegExp | string)[] = [
  /^\.env/,
  /^\.env\./,
  /^.*\.log$/,
  /^bun\.lockb$/,
  /^package-lock\.json$/,
  /^yarn\.lock$/,
  /^vite\.config\.ts\.timestamp-/,
  /^\.gitignore$/,
  /^\.prettierignore$/,
  /^\.eslintcache$/,
  ".git",
];

function shouldExclude(name: string, isDir: boolean): boolean {
  if (isDir) return EXCLUDED_DIRS.has(name);
  return EXCLUDED_FILES.some((pattern) =>
    typeof pattern === "string" ? name === pattern : pattern.test(name),
  );
}

async function walkDir(dir: string, root: string, zip: JSZip): Promise<void> {
  const entries = await fs.promises.readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (shouldExclude(entry.name, entry.isDirectory())) continue;

    if (entry.isDirectory()) {
      await walkDir(fullPath, root, zip);
    } else if (entry.isFile()) {
      try {
        const content = await fs.promises.readFile(fullPath, "utf-8");
        const relativePath = path.join(ZIP_ROOT_NAME, path.relative(root, fullPath));
        zip.file(relativePath, content);
      } catch (err) {
        console.error(`[export-zip] Failed to read ${fullPath}:`, err);
      }
    }
  }
}

export const Route = createFileRoute("/api/export/project.zip")({
  server: {
    handlers: {
      POST: async () => {
        const root = process.cwd();
        const zip = new JSZip();

        try {
          await walkDir(root, root, zip);
          const zipBuffer = await zip.generateAsync({ type: "uint8array" });
          const blob = new Blob([zipBuffer as unknown as BlobPart], { type: "application/zip" });
          return new Response(blob, {
            status: 200,
            headers: {
              "Content-Type": "application/zip",
              "Content-Disposition": `attachment; filename="${ZIP_ROOT_NAME}.zip"`,
            },
          });
        } catch (error) {
          console.error("[export-zip] ZIP export failed:", error);
          return new Response("Failed to export project ZIP", { status: 500 });
        }
      },
    },
  },
});
