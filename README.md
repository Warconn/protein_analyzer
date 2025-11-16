# Protein Value Scanner

Protein Value Scanner is a simple, mobile-first tool that helps you figure out whether a grocery item is actually a good protein buy. Snap a picture of the nutrition label, let a mock OCR pull out the basics, fill in anything it missed, and save it so you can compare it against everything else you scan.

The goal is straightforward: **stop guessing which items give you the best protein for the price.**

Right now the app is front-end only (Vite + React + TypeScript) with everything stored locally in your browser.

## What It Does

- **Scan a label**  
  Upload a photo and get a quick read of servings, macros, and protein.

- **Auto calculations**  
  Instantly see total protein, protein per meal, cost per meal, and cost per gram.

- **Value score**  
  Each item gets a simple 0 to 100 score based on how it stacks up against the rest of your saved scans.

- **History and comparisons**  
  Browse your saved items, sort them by what you care about, and compare a few at a time to see which one is the real winner.

- **Mobile-first**  
  Built to be used in the grocery aisle, not at a desk.

## Tech

- React + TypeScript  
- Vite  
- LocalStorage  
- Mock OCR with rotating sample data

## Getting Started

```bash
npm install
npm run dev
