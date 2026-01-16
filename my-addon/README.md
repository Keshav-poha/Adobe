# My Add-on

Adobe Express add-on — UI in `src/ui/`, document sandbox in `sandbox/`.

## Summary

This repository contains an Adobe Express add-on built with the Adobe CC Web Add-on tooling. It includes a React-based UI, a document sandbox for document APIs, and build scripts powered by `@adobe/ccweb-add-on-scripts` and `webpack`.

## Requirements

- Node.js 18+ (recommended)
- npm (or yarn/pnpm)

## Quick scripts

- Install deps: `npm install`
- Dev (local): `npm run start` (uses `ccweb-add-on-scripts start`)
- Build: `npm run build`
- Clean: `npm run clean`
- Package: `npm run package`

These scripts come from `package.json` and use `@adobe/ccweb-add-on-scripts`.

## Project layout

- `src/` — UI, components, contexts, i18n, models
- `src/ui/` — iframe runtime (React app)
- `sandbox/` — document sandbox code (runs in the Express document runtime)
- `manifest.json` — add-on manifest and entry points
- `webpack.config.js`, `tsconfig.json` — build configuration

## Environment

- The project expects a Groq API key available at build/dev time as the Vite-style env var `VITE_GROQ_API_KEY` (in `.env` or your shell). The `GroqClient` throws if this is missing.

## Manifest & entry points

- The add-on manifest is at `src/manifest.json`. The panel iframe entry is `src/index.html` and the document sandbox entry is `src/sandbox/code.ts` (exposed APIs are defined in `src/models/DocumentSandboxApi.ts`).

## API docs

- See `docs/API.md` for a summary of the runtime APIs exposed between iframe UI and document sandbox, and a short reference to `src/services/GroqClient.ts`.

## Documentation

- Usage and runtime notes: `docs/USAGE.md`
- Developer setup and build: `docs/DEVELOPMENT.md`

## References

- Adobe Express Add-ons documentation: https://developer.adobe.com/express/add-ons/

## Contributing

Open an issue or PR with proposed changes. For development, see `docs/DEVELOPMENT.md`.