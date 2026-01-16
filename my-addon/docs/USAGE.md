# Usage

This document explains running and testing the add-on locally and the runtime behavior.

## Running locally

1. Install dependencies:

```
npm install
```

2. Start the development server (local add-on serving):

```
npm run start
```

3. In Adobe Express, enable Add-on Development mode (Settings → Add-on Development) and load the local add-on following the Adobe docs.

## Entry points / Manifest

- The add-on iframe entry (UI) is `index.html` under `src/ui/` (see `manifest.json` `entryPoints` → `main`).
- If present, the document sandbox entry is declared via `documentSandbox` (e.g., `sandbox/code.js`). This file runs in the Express document sandbox and is where you should use `express-document-sdk`.

Note: manifest is at `src/manifest.json`. Change entry points there when adding panels or dialogs.

## Runtime tips

- The UI (iframe) can call sandbox APIs by creating a proxy via `addOnUISdk.instance.runtime.apiProxy('documentSandbox')` and then invoking methods declared in `src/models/DocumentSandboxApi.ts`.
- The document sandbox runs in an isolated environment with limited Web APIs — do network requests from the iframe runtime and send data to the sandbox when needed.

## Environment

- The app uses a Groq-backed AI service; set `VITE_GROQ_API_KEY` in `.env` or your shell before starting the dev server.

## Runtime model

- UI code runs in the iframe runtime (Add-on UI SDK — `addOnUISdk`).
- Document manipulation runs in the document sandbox (Express Document SDK — `express-document-sdk`) and communicates via the Document Sandbox SDK (`add-on-sdk-document-sandbox`).

## Packaging

To create a package ready for distribution or upload, run:

```
npm run package
```

This uses `ccweb-add-on-scripts package` to produce the packaged add-on.