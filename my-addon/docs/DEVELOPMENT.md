# Development

Steps and tips for contributing and running the project locally.

## Setup

1. Install dependencies:

```
npm install
```

2. Start development server:

```
npm run start
```

This launches a local dev server and serves the add-on bundle used by the Adobe Express development mode.

## Build

```
npm run build
```

Outputs production artifacts according to `webpack.config.js`.

## TypeScript

- Root `tsconfig.json` and additional `tsconfig.json` files exist under `src/ui/` and `sandbox/` to reflect different runtimes. Keep types shared in `src/models/` or `src/types/`.

## Environment & secrets

- `src/services/GroqClient.ts` expects `VITE_GROQ_API_KEY` to be defined at build/dev time. Add a `.env` file or export the var in your shell prior to running `npm run start` or `npm run build`.

## Webpack & externals

- `webpack.config.js` builds both the iframe (`index`) and the sandbox (`code`) bundles. The following modules are marked external because they are provided by Adobe Express at runtime: `add-on-sdk-document-sandbox`, `express-document-sdk`.

## MCP server (optional)

## MCP server (optional)

- For AI-assisted documentation lookup or code suggestions use the Adobe Express MCP server. See: https://developer.adobe.com/express/add-ons/docs/guides/getting_started/local_development/mcp_server

## Notes

- Document sandbox code runs in a restricted environment (no `fetch`, limited Web APIs). Perform network requests from the iframe runtime and forward results to the sandbox via RPC if needed.