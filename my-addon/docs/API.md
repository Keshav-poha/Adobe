# API Reference

This file summarizes the internal runtime APIs and important service interfaces found in the project.

## Document Sandbox API

- Location: `src/models/DocumentSandboxApi.ts`
- Purpose: the methods the document sandbox exposes to the iframe runtime via `runtime.exposeApi()` / `runtime.apiProxy()`.

Public surface:

- `createRectangle(): void` — Creates a simple rectangle in the current insertion parent (used for demos).
- `addImageToDocument(imageBlob: Blob): Promise<void>` — Loads a bitmap and appends an image container node into the document.

Usage (iframe runtime): obtain a proxy and call methods:

```ts
const { runtime } = addOnUISdk.instance;
const sandboxProxy = await runtime.apiProxy('documentSandbox');
await sandboxProxy.addImageToDocument(blob);
```

## GroqClient (AI & Vision services)

- Location: `src/services/GroqClient.ts`
- Purpose: wraps Groq SDK calls for brand extraction, vision analysis, trend generation, and Firefly prompt creation.

Key notes:

- Requires environment variable `VITE_GROQ_API_KEY` at build/runtime (injected via `webpack.DefinePlugin` in `webpack.config.js`).
- Main exported types: `BrandData`, `VisionAnalysis` — use these across `src/context` and components for type safety.

## UI Runtime (iframe)

- Entry: `src/ui/index.tsx` — initializes `addOnUISdk`, acquires the `documentSandbox` proxy and mounts the React app.
- The app uses `LanguageProvider` and `BrandProvider` to share translation and brand identity state.

## Document Sandbox (code.ts)

- Entry: `src/sandbox/code.ts` — exposes the sandbox API using `addOnSandboxSdk.instance.runtime.exposeApi()` and calls into `express-document-sdk` (`editor`) to create nodes.
- Important: document sandbox has limited Web APIs (no `fetch()`); do network work in the iframe runtime and forward data to the sandbox.

## Build / Webpack notes

- `webpack.config.js` builds both `index` and `code` entries. The `code` bundle runs in the document sandbox; `index` is the iframe app.
- `express-document-sdk` and `add-on-sdk-document-sandbox` are externalized in the webpack config — they are provided by the Adobe runtime.

## Where to update APIs

- If you add new sandbox APIs, declare them in `src/models/DocumentSandboxApi.ts`, implement them in `src/sandbox/code.ts`, and call them from the UI after calling `runtime.apiProxy()`.
