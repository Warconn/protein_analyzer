# Protein Value Scanner

Protein Value Scanner is a mobile-first React + TypeScript app for comparing protein-rich grocery items by cost effectiveness. Snap a nutrition label, run a mock OCR pass, fill in any missing info, and store the scan locally so you can see how your favorite items stack up.

This repo is currently front-end only (Vite + React). All persistence relies on the browser’s `localStorage`, and OCR is simulated via rotating, realistic fixtures. The goal is to offer a fast way to estimate “protein per dollar” without typing every detail manually.

## Key Features

- **Guided Scan Flow** – Upload a nutrition label photo, trigger the mock OCR step, and review/edit parsed fields before saving.
- **Derived Metrics** – Automatically calculates total protein, protein per meal, cost per meal, and cost per gram of protein.
- **Value Score** – Normalizes cost-per-gram across your saved scans to create a simple 0–100 comparison score.
- **History & Comparison** – Sort scans by value, cost, or protein punch, and compare two or more items with highlighted best values.
- **Offline-Friendly** – All data lives in localStorage; no backend setup needed for v1.

## Tech Stack

- [React](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- [Vite](https://vite.dev/) for dev/build tooling
- Local state with React hooks; persistence via `localStorage`
- Mock OCR generator (`mockOcrFromImage`) returns rotating realistic payloads so you can test the flow without any third-party service.

## Getting Started

```bash
# Install dependencies
npm install

# Start the dev server
npm run dev

# (optional) Type-check and build
npm run build
```

Open the dev server URL in your browser (Vite logs it, typically `http://localhost:5173`). The UI is designed for mobile widths first, so try shrinking the viewport or testing on your phone.

## Data Model

```ts
type ScannedItem = {
  id: string;
  name: string;
  servingsTotal: number;
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

## Where We Want to Take This

1. **Real OCR + AI Assist** – Integrate an actual OCR pipeline (Vision API, Tesseract, etc.) plus optional LLM cleanup to extract macros, ingredients, and marketing claims.
2. **Cloud Sync & Sharing** – Offer sign-in and secure cloud storage so scans sync across devices; generate shareable comparisons or grocery lists.
3. **Richer Analytics** – Track historical price changes across stores, highlight “best buy” alerts, and let users slice data by grocery category or dietary goal.
4. **Meal Planning Hooks** – Suggest recipes or meal prep ideas based on the protein sources you log most often.
5. **Accessibility & PWA** – Ship as a Progressive Web App with offline caching, Home Screen install banners, and better keyboard/screen-reader coverage.

## Contributing / Feedback

This repo is pre-product; issues and feature ideas are welcome. Open a GitHub issue describing the enhancement you’d like to see or the bug you found. If you’d rather chat, drop a note with screenshots so we can keep iterating on the scanning + comparison experience.

---

Protein Value Scanner is the quickest way to benchmark protein per dollar as you browse the grocery aisle. Give it a spin, save a few favorite items, and let us know what would make it indispensable for your meal prep workflow.*** End Patch
