# Protein Value Scanner

Protein Value Scanner is a mobile-first React + TypeScript app for comparing protein-rich grocery items by cost effectiveness. Snap a nutrition label, send it through a self-hosted Tesseract OCR service, fill in any missing info, and store the scan locally so you can see how your favorite items stack up.

Right now the app is front-end only (Vite + React + TypeScript) with everything stored locally in your browser.

- **Guided Scan Flow** – Upload a nutrition label photo, trigger the OCR step, and review/edit parsed fields (including units per package for multi-packs) before saving.
- **Derived Metrics** – Calculates total protein, protein per meal, cost per meal, and cost per gram of protein as you type.
- **Value Score** – Normalizes cost-per-gram across saved scans to create a simple 0–100 comparison score.
- **History & Analysis** – Dedicated tab ranks the best deals, lets you edit captured scans, sort in different ways, and run side-by-side comparisons.
- **Self-Hosted OCR** – Server-side Express + `tesseract.js` endpoint keeps data local (with an optional mock mode for offline dev).

- **Scan a label**  
  Upload a photo and get a quick read of servings, macros, and protein.

- [React](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/) + [Vite](https://vite.dev/)
- Styling via inline styles for now (mobile-first layout)
- Browser persistence via `localStorage`
- OCR micro-service: [Express](https://expressjs.com/) + [multer](https://github.com/expressjs/multer) + [tesseract.js](https://github.com/naptha/tesseract.js)

## Getting Started

```bash
npm install

# Start the Vite dev server
npm run dev

# Start the OCR service in another terminal
npm run server

# (optional) Type-check and build
npm run build
```

The Vite dev server (default `http://localhost:5173`) proxies `/api/*` calls to the OCR service running on port `4000`. Keep both processes running during development. If you prefer to keep using fake OCR data, set `VITE_USE_MOCK_OCR=true` in a `.env` file and restart Vite.

## OCR Service

- Endpoint: `POST /api/ocr`
- Payload: multipart form data with a single `image` field
- Response: `{ text: string, parsed: OcrParsedNutrition }`

`server/index.ts` pipes the uploaded file into Tesseract, then runs lightweight regex heuristics to populate an `OcrParsedNutrition` object (servings, protein, calories, etc.). The client still shows all fields for manual edits because OCR quality varies by lighting and label layout.

## Data Model

```ts
type ScannedItem = {
  id: string;
  name: string;
  servingsTotal: number;
  unitsPerPackage: number;
  proteinPerServingGrams: number;
  typicalServingsPerMeal: number;
  packagePrice: number;
  totalProteinGrams: number;
  proteinPerMealGrams: number;
  costPerMeal: number;
  costPerGramProtein: number;
  valueScore: number;
  createdAt: string;
  // + optional metadata (brand, store, macros, etc.)
};
```

The app persists an array of `ScannedItem` objects in `localStorage` under the key `proteinValueScannerItems`. Each time items are saved, the value score is recalculated based on the min/max cost-per-gram across the collection: lower cost → higher score. With a single item, the UI assigns a neutral score of 50 to keep comparisons meaningful as the list grows.

`unitsPerPackage` captures how many individual containers (cups, pouches, etc.) you’re buying. Total servings in the package are computed as `servingsTotal * unitsPerPackage`, which drives total protein, cost per meal, and cost per gram for multipacks.

## Where We Want to Take This

1. **LLM Cleanup** – Feed raw OCR text into a self-hosted LLM to improve field extraction and catch confusing layouts.
2. **Cloud Sync & Sharing** – Offer sign-in and secure cloud storage so scans sync across devices; generate shareable comparisons or grocery lists.
3. **Richer Analytics** – Track historical price changes across stores, highlight “best buy” alerts, and let users slice data by grocery category or dietary goal.
4. **Meal Planning Hooks** – Suggest recipes or meal prep ideas based on the protein sources you log most often.
5. **Accessibility & PWA** – Ship as a Progressive Web App with offline caching, Home Screen install banners, and better keyboard/screen-reader coverage.

## Contributing / Feedback

This repo is pre-product; issues and feature ideas are welcome. Open a GitHub issue describing the enhancement you’d like to see or the bug you found. If you’d rather chat, drop a note with screenshots so we can keep iterating on the scanning + comparison experience.

---

Protein Value Scanner is the quickest way to benchmark protein per dollar as you browse the grocery aisle. Give it a spin, save a few favorite items, and let us know what would make it indispensable for your meal prep workflow.*** End Patch

Confirming correct user. 