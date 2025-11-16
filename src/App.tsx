import {
  useEffect,
  useMemo,
  useState,
  type ChangeEvent,
  type ChangeEventHandler,
  type CSSProperties,
} from "react";

type Category = "meat" | "dairy" | "snack" | "frozen" | "prepared" | "other";

export type ScannedItem = {
  id: string;
  name: string;
  brand?: string;
  category?: Category;
  store?: string;
  servingsTotal: number;
  servingSizeText?: string;
  proteinPerServingGrams: number;
  caloriesPerServing?: number;
  fatPerServingGrams?: number;
  carbsPerServingGrams?: number;
  sugarPerServingGrams?: number;
  typicalServingsPerMeal: number;
  packagePrice: number;
  totalProteinGrams: number;
  proteinPerMealGrams: number;
  costPerMeal: number;
  costPerGramProtein: number;
  valueScore: number;
  createdAt: string;
};

export type OcrParsedNutrition = {
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

const STORAGE_KEY = "proteinValueScannerItems";

const SAMPLE_CASES: OcrParsedNutrition[] = [
  {
    name: "Plain Greek Yogurt",
    brand: "Kirkland",
    servingsTotal: 10,
    servingSizeText: "3/4 cup (170g)",
    proteinPerServingGrams: 18,
    caloriesPerServing: 150,
    fatPerServingGrams: 3,
    carbsPerServingGrams: 9,
    sugarPerServingGrams: 6,
  },
  {
    name: "Smoked Turkey Breast",
    brand: "Applegate",
    servingsTotal: 7,
    servingSizeText: "2 oz (56g)",
    proteinPerServingGrams: 12,
    caloriesPerServing: 60,
    fatPerServingGrams: 1.5,
    carbsPerServingGrams: 1,
    sugarPerServingGrams: 1,
  },
  {
    name: "Protein Granola Clusters",
    brand: "KIND",
    servingsTotal: 8,
    servingSizeText: "1/2 cup (53g)",
    proteinPerServingGrams: 10,
    caloriesPerServing: 240,
    fatPerServingGrams: 12,
    carbsPerServingGrams: 27,
    sugarPerServingGrams: 9,
  },
];

export async function mockOcrFromImage(_: File): Promise<OcrParsedNutrition> {
  const delay = 600 + Math.random() * 800;
  await new Promise((resolve) => setTimeout(resolve, delay));
  const index = Math.floor(Math.random() * SAMPLE_CASES.length);
  return { ...SAMPLE_CASES[index] };
}

const loadItems = (): ScannedItem[] => {
  if (typeof window === "undefined") {
    return [];
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed as ScannedItem[];
  } catch {
    return [];
  }
};

const saveItems = (items: ScannedItem[]) => {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
};

type FormValues = {
  name: string;
  brand: string;
  store: string;
  category: Category | "";
  servingsTotal: string;
  servingSizeText: string;
  proteinPerServingGrams: string;
  caloriesPerServing: string;
  fatPerServingGrams: string;
  carbsPerServingGrams: string;
  sugarPerServingGrams: string;
  typicalServingsPerMeal: string;
  packagePrice: string;
};

const initialFormValues: FormValues = {
  name: "",
  brand: "",
  store: "",
  category: "",
  servingsTotal: "",
  servingSizeText: "",
  proteinPerServingGrams: "",
  caloriesPerServing: "",
  fatPerServingGrams: "",
  carbsPerServingGrams: "",
  sugarPerServingGrams: "",
  typicalServingsPerMeal: "1",
  packagePrice: "",
};

const categories: Category[] = [
  "dairy",
  "meat",
  "snack",
  "frozen",
  "prepared",
  "other",
];

const formatCurrency = (value?: number) =>
  typeof value === "number" && Number.isFinite(value)
    ? `$${value.toFixed(2)}`
    : "—";

const formatGrams = (value?: number) =>
  typeof value === "number" && Number.isFinite(value)
    ? `${value % 1 === 0 ? value.toFixed(0) : value.toFixed(1)} g`
    : "—";

const parseNumber = (value: string): number | undefined => {
  if (value.trim() === "") {
    return undefined;
  }
  const num = Number(value);
  return Number.isFinite(num) ? num : undefined;
};

const computeValueScores = (items: ScannedItem[]): ScannedItem[] => {
  if (!items.length) {
    return items;
  }
  const costs = items
    .map((item) => item.costPerGramProtein)
    .filter((value) => Number.isFinite(value));
  if (costs.length <= 1) {
    return items.map((item) => ({
      ...item,
      valueScore: Number.isFinite(item.costPerGramProtein) ? 50 : 0,
    }));
  }
  const min = Math.min(...costs);
  const max = Math.max(...costs);
  if (Math.abs(max - min) < 0.0001) {
    return items.map((item) => ({
      ...item,
      valueScore: Number.isFinite(item.costPerGramProtein) ? 50 : 0,
    }));
  }
  return items.map((item) => {
    if (!Number.isFinite(item.costPerGramProtein)) {
      return { ...item, valueScore: 0 };
    }
    const normalized = (max - item.costPerGramProtein) / (max - min);
    return {
      ...item,
      valueScore: Math.max(0, Math.min(100, Math.round(normalized * 100))),
    };
  });
};

const generateId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);

const panelStyle: CSSProperties = {
  backgroundColor: "#fff",
  borderRadius: "16px",
  padding: "18px",
  boxShadow: "0 4px 12px rgba(15, 23, 42, 0.08)",
};

const highlightStyle: CSSProperties = {
  backgroundColor: "#e6f4f1",
  fontWeight: 600,
};

const tableHeaderStyle: CSSProperties = {
  textAlign: "left",
  padding: "10px",
  borderBottom: "1px solid #e2e8f0",
  color: "#475569",
};

const tableCellStyle: CSSProperties = {
  padding: "10px",
  borderBottom: "1px solid #e2e8f0",
};

function App() {
  const [items, setItems] = useState<ScannedItem[]>(() =>
    computeValueScores(loadItems())
  );
  const [formValues, setFormValues] = useState<FormValues>(initialFormValues);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const [formVisible, setFormVisible] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [ocrError, setOcrError] = useState<string | null>(null);
  const [sortMode, setSortMode] = useState<
    "valueScore" | "costPerGram" | "proteinPerMeal"
  >("valueScore");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  useEffect(() => {
    saveItems(items);
  }, [items]);

  useEffect(() => {
    if (!selectedFile) {
      setPreview(null);
      return;
    }
    const url = URL.createObjectURL(selectedFile);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [selectedFile]);

  const derivedStats = useMemo(() => {
    const servingsTotal = parseNumber(formValues.servingsTotal);
    const proteinPerServing = parseNumber(formValues.proteinPerServingGrams);
    const typicalServings = parseNumber(formValues.typicalServingsPerMeal);
    const packagePrice = parseNumber(formValues.packagePrice);
    const totalProtein =
      servingsTotal !== undefined && proteinPerServing !== undefined
        ? servingsTotal * proteinPerServing
        : undefined;
    const proteinPerMeal =
      typicalServings !== undefined && proteinPerServing !== undefined
        ? typicalServings * proteinPerServing
        : undefined;
    const numberOfMeals =
      servingsTotal !== undefined &&
      typicalServings !== undefined &&
      typicalServings > 0
        ? servingsTotal / typicalServings
        : undefined;
    const costPerMeal =
      packagePrice !== undefined &&
      numberOfMeals !== undefined &&
      numberOfMeals > 0
        ? packagePrice / numberOfMeals
        : undefined;
    const costPerGram =
      packagePrice !== undefined &&
      totalProtein !== undefined &&
      totalProtein > 0
        ? packagePrice / totalProtein
        : undefined;
    return {
      totalProtein,
      proteinPerMeal,
      numberOfMeals,
      costPerMeal,
      costPerGram,
    };
  }, [
    formValues.servingsTotal,
    formValues.proteinPerServingGrams,
    formValues.typicalServingsPerMeal,
    formValues.packagePrice,
  ]);

  const sortedItems = useMemo(() => {
    const cloned = [...items];
    switch (sortMode) {
      case "proteinPerMeal":
        cloned.sort((a, b) => b.proteinPerMealGrams - a.proteinPerMealGrams);
        break;
      case "costPerGram":
        cloned.sort((a, b) => a.costPerGramProtein - b.costPerGramProtein);
        break;
      default:
        cloned.sort((a, b) => b.valueScore - a.valueScore);
    }
    return cloned;
  }, [items, sortMode]);

  const selectedItems = useMemo(
    () => items.filter((item) => selectedIds.includes(item.id)),
    [items, selectedIds]
  );

  const bestComparisonValues = useMemo(() => {
    if (selectedItems.length < 2) {
      return null;
    }
    return {
      protein: Math.max(...selectedItems.map((item) => item.proteinPerMealGrams)),
      costMeal: Math.min(...selectedItems.map((item) => item.costPerMeal)),
      costGram: Math.min(...selectedItems.map((item) => item.costPerGramProtein)),
      score: Math.max(...selectedItems.map((item) => item.valueScore)),
    };
  }, [selectedItems]);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    setSelectedFile(file);
    setOcrError(null);
  };

  const handleExtract = async () => {
    if (!selectedFile) {
      return;
    }
    setIsExtracting(true);
    setOcrError(null);
    try {
      const parsed = await mockOcrFromImage(selectedFile);
      setFormValues((current) => ({
        ...current,
        name: parsed.name ?? current.name,
        brand: parsed.brand ?? current.brand,
        servingsTotal:
          parsed.servingsTotal !== undefined
            ? String(parsed.servingsTotal)
            : current.servingsTotal,
        servingSizeText:
          parsed.servingSizeText ?? current.servingSizeText ?? "",
        proteinPerServingGrams:
          parsed.proteinPerServingGrams !== undefined
            ? String(parsed.proteinPerServingGrams)
            : current.proteinPerServingGrams,
        caloriesPerServing:
          parsed.caloriesPerServing !== undefined
            ? String(parsed.caloriesPerServing)
            : current.caloriesPerServing,
        fatPerServingGrams:
          parsed.fatPerServingGrams !== undefined
            ? String(parsed.fatPerServingGrams)
            : current.fatPerServingGrams,
        carbsPerServingGrams:
          parsed.carbsPerServingGrams !== undefined
            ? String(parsed.carbsPerServingGrams)
            : current.carbsPerServingGrams,
        sugarPerServingGrams:
          parsed.sugarPerServingGrams !== undefined
            ? String(parsed.sugarPerServingGrams)
            : current.sugarPerServingGrams,
      }));
      setFormVisible(true);
    } catch (error) {
      console.error(error);
      setOcrError("Unable to read that image. Please try again.");
    } finally {
      setIsExtracting(false);
    }
  };

  const handleInputChange = (
    event: ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = event.target;
    setFormValues((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => {
      if (!prev[name]) {
        return prev;
      }
      const clone = { ...prev };
      delete clone[name];
      return clone;
    });
  };

  const validateForm = () => {
    const validation: Record<string, string> = {};
    const requiredFields: Array<{ key: keyof FormValues; label: string }> = [
      { key: "servingsTotal", label: "Servings per container" },
      { key: "proteinPerServingGrams", label: "Protein per serving" },
      { key: "typicalServingsPerMeal", label: "Servings per meal" },
      { key: "packagePrice", label: "Package price" },
    ];
    requiredFields.forEach(({ key, label }) => {
      const parsed = parseNumber(formValues[key]);
      if (parsed === undefined) {
        validation[key] = `${label} is required`;
      } else if (parsed <= 0) {
        validation[key] = `${label} must be greater than 0`;
      }
    });
    return validation;
  };

  const handleSave = () => {
    const validation = validateForm();
    setErrors(validation);
    if (Object.keys(validation).length > 0) {
      setFormVisible(true);
      return;
    }
    const servingsTotal = Number(formValues.servingsTotal);
    const proteinPerServing = Number(formValues.proteinPerServingGrams);
    const typicalServings = Number(formValues.typicalServingsPerMeal);
    const packagePrice = Number(formValues.packagePrice);
    const totalProtein = servingsTotal * proteinPerServing;
    const proteinPerMeal = typicalServings * proteinPerServing;
    const mealsInPackage =
      typicalServings > 0 ? servingsTotal / typicalServings : servingsTotal;
    const costPerMeal =
      mealsInPackage > 0 ? packagePrice / mealsInPackage : packagePrice;
    const costPerGram =
      totalProtein > 0 ? packagePrice / totalProtein : packagePrice;
    const newItem: ScannedItem = {
      id: generateId(),
      name: formValues.name || "Untitled item",
      brand: formValues.brand || undefined,
      category: formValues.category || undefined,
      store: formValues.store || undefined,
      servingsTotal,
      servingSizeText: formValues.servingSizeText || undefined,
      proteinPerServingGrams: proteinPerServing,
      caloriesPerServing: parseNumber(formValues.caloriesPerServing),
      fatPerServingGrams: parseNumber(formValues.fatPerServingGrams),
      carbsPerServingGrams: parseNumber(formValues.carbsPerServingGrams),
      sugarPerServingGrams: parseNumber(formValues.sugarPerServingGrams),
      typicalServingsPerMeal: typicalServings,
      packagePrice,
      totalProteinGrams: totalProtein,
      proteinPerMealGrams: proteinPerMeal,
      costPerMeal,
      costPerGramProtein: costPerGram,
      valueScore: 0,
      createdAt: new Date().toISOString(),
    };
    const updated = computeValueScores([...items, newItem]);
    setItems(updated);
    setFormValues(initialFormValues);
    setFormVisible(false);
    setSelectedFile(null);
    setPreview(null);
    setSelectedIds([]);
  };

  const handleReset = () => {
    setFormValues(initialFormValues);
    setErrors({});
    setFormVisible(false);
    setSelectedFile(null);
    setPreview(null);
    setSelectedIds([]);
  };

  const toggleSelected = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((itemId) => itemId !== id) : [...prev, id]
    );
  };

  const renderError = (key: keyof FormValues) =>
    errors[key] ? (
      <span style={{ color: "#d93025", fontSize: "0.85rem" }}>{errors[key]}</span>
    ) : null;

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#f5f4f0",
        padding: "20px",
        display: "flex",
        justifyContent: "center",
        fontFamily:
          "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',sans-serif",
        color: "#0f172a",
      }}
    >
      <main style={{ width: "100%", maxWidth: "780px", display: "flex", flexDirection: "column", gap: "20px" }}>
        <header style={{ textAlign: "center" }}>
          <h1 style={{ margin: 0, fontSize: "2rem" }}>Protein Value Scanner</h1>
          <p style={{ margin: "8px 0 0", color: "#475569" }}>
            Upload labels, capture nutrition, and compare protein value by cost.
          </p>
        </header>

        <section style={panelStyle}>
          <h2 style={{ marginTop: 0, fontSize: "1.15rem" }}>1. New scan</h2>
          <label
            htmlFor="photoInput"
            style={{
              border: "2px dashed #94a3b8",
              borderRadius: "12px",
              padding: "20px",
              display: "block",
              textAlign: "center",
              cursor: "pointer",
              backgroundColor: "#f8fafc",
            }}
          >
            <strong>Upload nutrition label photo</strong>
            <p style={{ margin: "8px 0 0", color: "#64748b" }}>
              Tap to pick an image from your device.
            </p>
            <input
              id="photoInput"
              type="file"
              accept="image/*"
              style={{ display: "none" }}
              onChange={handleFileChange}
            />
          </label>
          {preview && (
            <div style={{ marginTop: "12px", textAlign: "center" }}>
              <img
                src={preview}
                alt="Nutrition label preview"
                style={{ maxWidth: "65%", borderRadius: "10px" }}
              />
            </div>
          )}
          <button
            onClick={handleExtract}
            disabled={!selectedFile || isExtracting}
            style={{
              marginTop: "16px",
              width: "100%",
              padding: "14px",
              borderRadius: "10px",
              border: "none",
              backgroundColor: selectedFile ? "#0f766e" : "#94a3b8",
              color: "#fff",
              fontSize: "1rem",
              fontWeight: 600,
            }}
          >
            {isExtracting ? "Extracting..." : "Extract nutrition info"}
          </button>
          {ocrError && (
            <p style={{ color: "#d93025", marginTop: "8px" }}>{ocrError}</p>
          )}
        </section>

        {formVisible && (
          <section style={panelStyle}>
            <h2 style={{ marginTop: 0, fontSize: "1.15rem" }}>
              2. Review and complete
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <TextInput
                label="Item name"
                name="name"
                value={formValues.name}
                onChange={handleInputChange}
                placeholder="Greek yogurt"
              />
              <TextInput
                label="Brand"
                name="brand"
                value={formValues.brand}
                onChange={handleInputChange}
                placeholder="Kirkland"
              />
              <TextInput
                label="Store"
                name="store"
                value={formValues.store}
                onChange={handleInputChange}
                placeholder="Costco"
              />
              <SelectInput
                label="Category"
                name="category"
                value={formValues.category}
                onChange={handleInputChange}
                options={categories}
                placeholder="Select category"
              />
              <NumberInput
                label="Servings per container"
                name="servingsTotal"
                value={formValues.servingsTotal}
                onChange={handleInputChange}
                min="0"
              />
              {renderError("servingsTotal")}
              <TextInput
                label="Serving size"
                name="servingSizeText"
                value={formValues.servingSizeText}
                onChange={handleInputChange}
                placeholder="3/4 cup (170g)"
              />
              <NumberInput
                label="Protein per serving (g)"
                name="proteinPerServingGrams"
                value={formValues.proteinPerServingGrams}
                onChange={handleInputChange}
                min="0"
              />
              {renderError("proteinPerServingGrams")}
              <NumberInput
                label="Calories per serving"
                name="caloriesPerServing"
                value={formValues.caloriesPerServing}
                onChange={handleInputChange}
                min="0"
              />
              <NumberInput
                label="Fat per serving (g)"
                name="fatPerServingGrams"
                value={formValues.fatPerServingGrams}
                onChange={handleInputChange}
                min="0"
              />
              <NumberInput
                label="Carbs per serving (g)"
                name="carbsPerServingGrams"
                value={formValues.carbsPerServingGrams}
                onChange={handleInputChange}
                min="0"
              />
              <NumberInput
                label="Sugar per serving (g)"
                name="sugarPerServingGrams"
                value={formValues.sugarPerServingGrams}
                onChange={handleInputChange}
                min="0"
              />
              <NumberInput
                label="Typical servings you eat"
                name="typicalServingsPerMeal"
                value={formValues.typicalServingsPerMeal}
                onChange={handleInputChange}
                min="0"
              />
              {renderError("typicalServingsPerMeal")}
              <NumberInput
                label="Package price ($)"
                name="packagePrice"
                value={formValues.packagePrice}
                onChange={handleInputChange}
                min="0"
                step="0.01"
              />
              {renderError("packagePrice")}
            </div>

            <div
              style={{
                marginTop: "20px",
                padding: "16px",
                borderRadius: "12px",
                backgroundColor: "#ecfeff",
                lineHeight: 1.6,
                color: "#065f46",
              }}
            >
              <strong>Live stats</strong>
              <p>Protein per meal: {formatGrams(derivedStats.proteinPerMeal)}</p>
              <p>Cost per meal: {formatCurrency(derivedStats.costPerMeal)}</p>
              <p>
                Cost per gram of protein: {formatCurrency(derivedStats.costPerGram)}
              </p>
            </div>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "10px",
                marginTop: "20px",
              }}
            >
              <button
                onClick={handleSave}
                style={{
                  padding: "14px",
                  borderRadius: "10px",
                  border: "none",
                  backgroundColor: "#2563eb",
                  color: "#fff",
                  fontSize: "1rem",
                  fontWeight: 600,
                }}
              >
                Save scan
              </button>
              <button
                onClick={handleReset}
                style={{
                  padding: "14px",
                  borderRadius: "10px",
                  border: "1px solid #cbd5f5",
                  backgroundColor: "#fff",
                  color: "#475569",
                  fontSize: "1rem",
                }}
              >
                Reset
              </button>
            </div>
          </section>
        )}

        <section style={panelStyle}>
          <h2 style={{ marginTop: 0, fontSize: "1.15rem" }}>
            3. History & comparison
          </h2>
          {items.length === 0 ? (
            <p style={{ color: "#64748b" }}>No scans saved yet.</p>
          ) : (
            <>
              <label
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "6px",
                  fontSize: "0.95rem",
                  color: "#475569",
                  marginBottom: "12px",
                }}
              >
                Sort by
                <select
                  value={sortMode}
                  onChange={(event) =>
                    setSortMode(event.target.value as typeof sortMode)
                  }
                  style={{
                    padding: "10px",
                    borderRadius: "8px",
                    border: "1px solid #cbd5f5",
                    fontSize: "1rem",
                  }}
                >
                  <option value="valueScore">Best value score</option>
                  <option value="costPerGram">Lowest cost per gram</option>
                  <option value="proteinPerMeal">Highest protein per meal</option>
                </select>
              </label>
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {sortedItems.map((item) => (
                  <label
                    key={item.id}
                    style={{
                      border: "1px solid #e2e8f0",
                      borderRadius: "12px",
                      padding: "12px",
                      display: "flex",
                      flexDirection: "column",
                      gap: "8px",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        gap: "16px",
                      }}
                    >
                      <div>
                        <strong>
                          {item.name}
                          {item.brand ? ` • ${item.brand}` : ""}
                        </strong>
                        <div style={{ fontSize: "0.85rem", color: "#64748b" }}>
                          {new Date(item.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(item.id)}
                        onChange={() => toggleSelected(item.id)}
                        style={{ width: "20px", height: "20px" }}
                      />
                    </div>
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                        gap: "8px",
                        fontSize: "0.95rem",
                      }}
                    >
                      <span>
                        Protein / meal:{" "}
                        <strong>{formatGrams(item.proteinPerMealGrams)}</strong>
                      </span>
                      <span>
                        Cost / meal: <strong>{formatCurrency(item.costPerMeal)}</strong>
                      </span>
                      <span>
                        Cost / gram:{" "}
                        <strong>{formatCurrency(item.costPerGramProtein)}</strong>
                      </span>
                      <span>
                        Value score: <strong>{item.valueScore}</strong>
                      </span>
                    </div>
                  </label>
                ))}
              </div>
            </>
          )}
        </section>

        {selectedItems.length >= 2 && bestComparisonValues && (
          <section style={panelStyle}>
            <h3 style={{ marginTop: 0, fontSize: "1.1rem" }}>
              Comparison ({selectedItems.length} items)
            </h3>
            <div style={{ overflowX: "auto" }}>
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  fontSize: "0.95rem",
                }}
              >
                <thead>
                  <tr style={{ backgroundColor: "#f1f5f9" }}>
                    <th style={tableHeaderStyle}>Name</th>
                    <th style={tableHeaderStyle}>Protein / meal</th>
                    <th style={tableHeaderStyle}>Cost / meal</th>
                    <th style={tableHeaderStyle}>Cost / gram</th>
                    <th style={tableHeaderStyle}>Value score</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedItems.map((item) => (
                    <tr key={item.id}>
                      <td style={tableCellStyle}>
                        <div style={{ fontWeight: 600 }}>{item.name}</div>
                        <div style={{ color: "#64748b", fontSize: "0.85rem" }}>
                          {item.brand || "—"}
                        </div>
                      </td>
                      <td
                        style={{
                          ...tableCellStyle,
                          ...(Math.abs(
                            item.proteinPerMealGrams - bestComparisonValues.protein
                          ) <= 0.01
                            ? highlightStyle
                            : {}),
                        }}
                      >
                        {formatGrams(item.proteinPerMealGrams)}
                      </td>
                      <td
                        style={{
                          ...tableCellStyle,
                          ...(Math.abs(
                            item.costPerMeal - bestComparisonValues.costMeal
                          ) <= 0.01
                            ? highlightStyle
                            : {}),
                        }}
                      >
                        {formatCurrency(item.costPerMeal)}
                      </td>
                      <td
                        style={{
                          ...tableCellStyle,
                          ...(Math.abs(
                            item.costPerGramProtein - bestComparisonValues.costGram
                          ) <= 0.01
                            ? highlightStyle
                            : {}),
                        }}
                      >
                        {formatCurrency(item.costPerGramProtein)}
                      </td>
                      <td
                        style={{
                          ...tableCellStyle,
                          ...(item.valueScore === bestComparisonValues.score
                            ? highlightStyle
                            : {}),
                        }}
                      >
                        {item.valueScore}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

type TextInputProps = {
  label: string;
  name: keyof FormValues;
  value: string;
  onChange: ChangeEventHandler<HTMLInputElement>;
  placeholder?: string;
};

function TextInput({ label, name, value, onChange, placeholder }: TextInputProps) {
  return (
    <label style={inputLabelStyle}>
      {label}
      <input
        type="text"
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        style={inputStyle}
      />
    </label>
  );
}

type NumberInputProps = TextInputProps & { min?: string; step?: string };

function NumberInput({
  label,
  name,
  value,
  onChange,
  placeholder,
  min,
  step,
}: NumberInputProps) {
  return (
    <label style={inputLabelStyle}>
      {label}
      <input
        type="number"
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        min={min}
        step={step}
        style={inputStyle}
      />
    </label>
  );
}

type SelectInputProps = {
  label: string;
  name: keyof FormValues;
  value: string;
  onChange: ChangeEventHandler<HTMLSelectElement>;
  options: Category[];
  placeholder?: string;
};

function SelectInput({
  label,
  name,
  value,
  onChange,
  options,
  placeholder,
}: SelectInputProps) {
  return (
    <label style={inputLabelStyle}>
      {label}
      <select name={name} value={value} onChange={onChange} style={inputStyle}>
        <option value="">{placeholder ?? "Select"}</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option.charAt(0).toUpperCase() + option.slice(1)}
          </option>
        ))}
      </select>
    </label>
  );
}

const inputLabelStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "6px",
  fontSize: "0.95rem",
  color: "#475569",
};

const inputStyle: CSSProperties = {
  padding: "12px",
  borderRadius: "10px",
  border: "1px solid #cbd5f5",
  fontSize: "1rem",
};

export default App;
