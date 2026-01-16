# Contributing

Thanks for contributing. Quick guide to get the project running and how to add changes.

1. Install dependencies

```bash
npm install
```

2. Start the local development server (requires Node.js 18+)

```bash
npm run start
```

3. Environment variables

- Create a `.env` in the project root (or export in your shell) with:

```
VITE_GROQ_API_KEY=your_groq_api_key_here
```

4. Add new sandbox APIs

- Add the TypeScript signature to `src/models/DocumentSandboxApi.ts`.
- Implement the API in `src/sandbox/code.ts` and register with `runtime.exposeApi()`.
- Call the API from the UI via `runtime.apiProxy('documentSandbox')`.

5. Linting / Formatting

- This repo uses TypeScript; keep types consistent and add new types under `src/models` or `src/types`.

6. Packaging

- Use `npm run package` to create a distributable add-on (uses `@adobe/ccweb-add-on-scripts`).

7. Questions

- For Adobe Express add-on docs and MCP server integration, see: https://developer.adobe.com/express/add-ons/
