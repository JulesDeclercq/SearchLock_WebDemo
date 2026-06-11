# SearchLock Technical Reference

## Project summary

SearchLock is a browser-first proof of concept that demonstrates a privacy-aware visual shopping flow:

1. A user drops or selects an image in the browser.
2. The app analyzes the image locally.
3. A search query is generated from basic visual signals.
4. Live shopping results are fetched from SerpApi when configured.
5. If no API key is available, the UI falls back to clearly labeled demo cards.

## Technology stack

| Layer | Tooling | Purpose |
|---|---|---|
| UI | React 18 | Component rendering |
| Build tool | Vite 5 | Local dev server and production bundling |
| Language | TypeScript 5 | Typed browser application code |
| HTTP | Fetch API / Axios | External requests and optional future integration |
| Styling | Plain CSS | Fast, dependency-light UI styling |

## File-by-file reference

| File | Responsibility |
|---|---|
| `index.html` | Vite entry page that mounts the app |
| `web/main.tsx` | React entry point and root render call |
| `web/App.tsx` | Drag/drop UI, analysis state, and result rendering |
| `web/imageAnalysis.ts` | Local image loading, sampling, query generation |
| `web/search.ts` | SerpApi integration and demo fallback results |
| `web/styles.css` | Theme, layout, cards, and responsive behavior |
| `vite.config.ts` | Local server and build configuration |
| `tsconfig.web.json` | TypeScript settings for the browser app |

## Component responsibilities

### `web/App.tsx`

- Owns the browser-facing user experience.
- Handles file drop, file picker, reset, and state transitions.
- Renders the preview, analysis details, generated query, and result cards.
- Keeps the demo self-contained so it can run on any standard browser.

### `web/imageAnalysis.ts`

- Loads dropped images using browser APIs.
- Extracts simple signals: width, height, aspect ratio, dominant color, and brightness.
- Converts those signals into a query string.
- Uses a fallback image decoder path so the demo is resilient across file types.

### `web/search.ts`

- Uses `VITE_SERPAPI_KEY` to fetch real shopping results from SerpApi.
- Maps the SerpApi response into the app’s result card shape.
- Falls back to demo data only when a live query is unavailable.

### `web/main.tsx`

- Creates the React root and mounts the app.
- Imports the shared stylesheet.

### `web/styles.css`

- Provides the visual design system.
- Keeps the layout responsive and GitHub-demo friendly.
- Styles the hero section, dropzone, analysis panel, and result cards.

### Difference in one line

`.env.example` documents the variables; `.env` stores your actual private values.

## Setup on another device

1. Clone the repo.
2. Install dependencies with `npm install`.
3. Copy `.env.example` to `.env`.
4. Add `VITE_SERPAPI_KEY` to `.env` if live results are required.
5. Run `npm run dev`.
6. Open the localhost URL Vite prints in the terminal.

## Run and build

```bash
npm run dev
npm run build
npm run preview
npm run lint
npm run typecheck
```

## What a reviewer should know

- The browser demo is the active product path.
- SerpApi is used for real shopping results when a key is configured.
- The project is intentionally lightweight so it can be reviewed and demoed quickly.
- The old Android workflow has been de-emphasized in favor of a clean browser proof of concept.

## Interview-ready answers

- **What does the app do?** It turns an image into a shopping query and shows results.
- **Where does AI happen?** In the browser analysis step that derives query signals from the image.
- **Where do live results come from?** SerpApi, when `VITE_SERPAPI_KEY` is present.
- **What if the key is missing?** The UI still works with demo fallback cards.
- **Why Vite?** It provides a simple, fast browser workflow with minimal setup.

## Key constraints and design choices

- No native build chain required.
- Browser-only runtime for easier sharing and evaluation.
- Low dependency surface to keep the repo maintainable.
- Clear separation between analysis, search, styling, and bootstrapping.
