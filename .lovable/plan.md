Plan: Export Project Source as ZIP

User wants a one-click "Download ZIP" button on the dashboard header that downloads the app source code to their desktop.

Implementation:

1. Add dependency
   - Install `jszip` to build the ZIP archive in a server-side handler.

2. Create server route `src/routes/api/export/project.zip.tsx`
   - Register as TanStack Start server route under `/api/export/project.zip`.
   - In the `POST` handler:
     - Walk the project root directory recursively using `fs`/`path`.
     - Exclude files/directories that are not part of the source code: `node_modules`, `.git`, `dist`, `.output`, `.lovable`, `.env`, `.env.*`, `*.log`, `tmp`, `temp`, `coverage`, `build`, `out`, `vite.config.ts.timestamp-*`, `bun.lockb`, `package-lock.json`.
     - Read each remaining file as text and add it to a `JSZip` instance with a relative path like `sfdc-notes/package.json`, `sfdc-notes/src/...`, etc.
     - Generate the ZIP buffer and return a `Response` with:
       - `Content-Type: application/zip`
       - `Content-Disposition: attachment; filename="sfdc-notes.zip"`
   - Add a small error handler that returns a plain text or JSON error response if the ZIP cannot be built.

3. Add a "Download ZIP" button to the dashboard header
   - In `src/routes/index.tsx`, add a button in the header row next to the existing title/description.
   - Use a `Button` variant (outline or secondary) with a download icon from `lucide-react`.
   - On click, call the server route endpoint with `fetch('/api/export/project.zip', { method: 'POST' })`.
   - Convert the response to a Blob, create a temporary `<a>` element, and trigger the browser download.
   - Track a local `loading` state so the button shows a spinner and disables while the archive is being generated.
   - Use `sonner` toast for success or error feedback.

4. Styling & UX
   - Keep the button aligned with the existing dashboard header layout.
   - Use a tooltip or small subtitle to clarify what the ZIP contains (source code, configs, route files, components, etc.).

5. Verification
   - Typecheck and build the project.
   - Click the button in the preview and verify a `sfdc-notes.zip` file downloads and contains the expected source files.

Note on runtime limitations:
   - This feature reads the project source from the server filesystem. It will work in the Lovable preview environment and any deployment that bundles the source files. In a stripped production build that only ships compiled assets, the endpoint may return an empty or minimal archive; the implementation should gracefully handle missing files by logging and continuing rather than crashing.