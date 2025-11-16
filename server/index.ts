import express from "express";
import multer from "multer";
import Tesseract from "tesseract.js";

type OcrParsedNutrition = {
  name?: string;
  brand?: string;
  servingsTotal?: number;
  servingSizeText?: string;
  proteinPerServingGrams?: number;
  caloriesPerServing?: number;
  fatPerServingGrams?: number;
  carbsPerServingGrams?: number;
  sugarPerServingGrams?: number;
};

const PORT = Number(process.env.PORT) || 4000;
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024 }, // 8MB
});

const app = express();

app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

app.post("/api/ocr", upload.single("image"), async (req, res) => {
  if (!req.file) {
    res.status(400).json({ error: "An image file is required." });
    return;
  }

  try {
    const { data } = await Tesseract.recognize(req.file.buffer, "eng", {
      tessedit_char_whitelist:
        "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz%()/.:- ",
    });

    const text = data.text ?? "";
    const parsed = parseNutritionText(text);
    res.json({ text, parsed });
  } catch (error) {
    console.error("OCR failed", error);
    res.status(500).json({ error: "Failed to extract nutrition info." });
  }
});

app.listen(PORT, () => {
  console.log(`OCR service listening on http://localhost:${PORT}`);
});

function parseNutritionText(text: string): OcrParsedNutrition {
  const cleaned = text.replace(/\r/g, "");
  const lines = cleaned
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  const flattened = lines.join(" ");

  const servingsTotal =
    findNumber(/servings?\s+per\s+(?:container|pkg|package)\s*[:\-]?\s*(\d+(?:\.\d+)?)/i, flattened) ??
    findNumber(/servings?\s*[:\-]?\s*(\d+(?:\.\d+)?)/i, flattened);

  const servingSizeLine = lines.find((line) =>
    /serving size/i.test(line)
  );
  const servingSizeText = servingSizeLine
    ? servingSizeLine.replace(/serving size[:\s]*/i, "").trim()
    : undefined;

  const proteinPerServingGrams = findNumber(
    /protein(?:\s+per\s+serving)?[^0-9]*([\d.]+)\s*g?/i,
    flattened
  );

  const caloriesPerServing = findNumber(
    /calories[^0-9]*([\d.]+)/i,
    flattened
  );

  const fatPerServingGrams =
    findNumber(/total\s+fat[^0-9]*([\d.]+)\s*g?/i, flattened) ??
    findNumber(/fat[^0-9]*([\d.]+)\s*g?/i, flattened);

  const carbsPerServingGrams =
    findNumber(/total\s+carb[^0-9]*([\d.]+)\s*g?/i, flattened) ??
    findNumber(/carbohydrates?[^0-9]*([\d.]+)\s*g?/i, flattened);

  const sugarPerServingGrams = findNumber(
    /sugars?[^0-9]*([\d.]+)\s*g?/i,
    flattened
  );

  const probableName = findLikelyName(lines);

  return {
    name: probableName,
    servingsTotal,
    servingSizeText,
    proteinPerServingGrams,
    caloriesPerServing,
    fatPerServingGrams,
    carbsPerServingGrams,
    sugarPerServingGrams,
  };
}

function findNumber(pattern: RegExp, value: string): number | undefined {
  const match = value.match(pattern);
  if (!match) {
    return undefined;
  }
  const num = Number(match[1]);
  return Number.isFinite(num) ? num : undefined;
}

function findLikelyName(lines: string[]): string | undefined {
  const disallowed = /nutrition|facts?|serving|calories?|total\s+fat|saturated|trans|cholesterol|sodium|carb|fiber|dietary|sugar|vitamin|minerals?|percent|daily|value|ingredients|based/i;
  const sanitizedLines = lines.map((line) => line.replace(/[:*]+$/g, "").trim());

  const validLine = (line: string) =>
    line.length >= 3 &&
    /^[A-Za-z0-9][A-Za-z0-9 '&-]*$/.test(line) &&
    !disallowed.test(line);

  const reversed = [...sanitizedLines].reverse();

  const withoutDigits = reversed.find(
    (line) => validLine(line) && !/\d/.test(line)
  );
  if (withoutDigits) {
    return withoutDigits;
  }

  const fallback = reversed.find(validLine);
  return fallback ?? undefined;
}
