# SearchLock Technical Reference

## Project summary

SearchLock is a browser-first proof of concept for visual shopping search. A user drops an image into the page, the browser derives useful keywords from the image, and the app searches for products using those keywords.

## What the AI layer does

The AI layer is intentionally small and practical:

- **Image classification** identifies a likely item class such as bag, shoe, dress, or jacket.
- **OCR** reads visible text to recover brand names such as Gucci or Prada when they appear in the image.
- **Color analysis** estimates the dominant color from the image pixels.
- The resulting keywords are combined into a shopping-friendly query.

This is not a large-model chatbot flow. It is a compact keyword-extraction layer that improves search relevance.

## Technology stack

| Layer | Tooling | Purpose |
|---|---|---|
| UI | React 18 | Rendering the demo interface |
| Build | Vite 5 | Local dev server and production bundling |
| Language | TypeScript 5 | Typed implementation |
| AI keyword extraction | `@xenova/transformers` + `tesseract.js` | Item classification and OCR |
| Search | SerpApi | Live shopping results |

## Data flow

1. The user drops or selects an image.
2. `web/App.tsx` sends the file to the analysis pipeline.
3. `web/imageAnalysis.ts` loads the image and samples the pixels.
4. `web/keywordExtraction.ts` runs the pretrained classifier and OCR.
5. The app merges item, color, and brand signals into a query.
6. `web/search.ts` fetches results from SerpApi when `VITE_SERPAPI_KEY` is present.
7. The UI renders the preview, keyword chips, query, and results.

## File-by-file reference

| File | Responsibility |
|---|---|
| `index.html` | Vite host page |
| `web/main.tsx` | React entry point |
| `web/App.tsx` | Upload flow and UI state |
| `web/imageAnalysis.ts` | Image sampling, keyword assembly, query generation |
| `web/keywordExtraction.ts` | Pretrained classifier + OCR keyword extraction |
| `web/search.ts` | Live shopping search with fallback results |
| `web/styles.css` | Layout and styling |
| `vite.config.ts` | Dev server and build config |
| `tsconfig.web.json` | Browser TypeScript configuration |

## Environment files

### `.env.example`

Tracked template file containing placeholders only. It documents the required variables without exposing secrets.

### `.env`

Local private file containing the real SerpApi key.

### Difference

- `.env.example` tells another developer what to create.
- `.env` stores the actual machine-specific value.

## Setup on another device

```bash
git clone <your-repo-url>
cd SearchLock
npm install
copy .env.example .env
```

Then add your live-search key:

```env
VITE_SERPAPI_KEY=your_real_serpapi_key_here
```

Run locally:

```bash
npm run dev
```

## Build and deploy

```bash
npm run build
npm run preview
```

The build output is a static site in `dist/`, so it can be deployed to any static host such as Vercel, Netlify, GitHub Pages, or Cloudflare Pages.

## Interview-ready summary

- **What is the AI part?** A lightweight pretrained keyword extraction layer that identifies item, color, and brand clues.
- **What does OCR add?** Brand text detection when labels are visible in the image.
- **What does classification add?** Likely item words like bag or shoe.
- **What does the app search with?** The combined keyword string.
- **What happens without an API key?** The UI still works and uses fallback cards.

## Why this design

- Small enough to understand quickly.
- Practical enough to improve search relevance.
- Browser-only, so it is easy to run on another device.
- Clear separation between analysis, search, and presentation.
