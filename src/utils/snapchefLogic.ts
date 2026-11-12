import type {
  InventoryItem,
  RecipeItem,
  SnapChefPayload,
  MacroProfile,
} from '../types/snapchef';

/**
 * Normalizes and validates raw JSON returned by the AI model into a clean SnapChefPayload.
 */
export function normalizeSnapChefPayload(raw: unknown): SnapChefPayload {
  if (!raw || typeof raw !== 'object') {
    return { inventory: [], recipes: [] };
  }

  const obj = raw as Record<string, unknown>;
  const rawInventory = Array.isArray(obj.inventory) ? obj.inventory : [];
  const rawRecipes = Array.isArray(obj.recipes) ? obj.recipes : [];

  const inventory: InventoryItem[] = rawInventory
    .map((item, idx): InventoryItem | null => {
      if (!item || typeof item !== 'object') return null;
      const it = item as Record<string, unknown>;
      const name = typeof it.name === 'string' ? it.name.trim() : '';
      if (!name) return null;

      const rawMacros =
        it.macros && typeof it.macros === 'object'
          ? (it.macros as Record<string, unknown>)
          : {};

      const macros: MacroProfile = {
        protein_g: roundOneDecimal(Number(rawMacros.protein_g) || 0),
        carbs_g: roundOneDecimal(Number(rawMacros.carbs_g) || 0),
        fat_g: roundOneDecimal(Number(rawMacros.fat_g) || 0),
      };

      const health_benefits = Array.isArray(it.health_benefits)
        ? it.health_benefits
            .filter((b): b is string => typeof b === 'string' && b.trim().length > 0)
            .map((b) => b.trim())
        : ['Rich in essential culinary micronutrients'];

      const rawQualities =
        it.qualities && typeof it.qualities === 'object'
          ? (it.qualities as Record<string, unknown>)
          : {};

      const qualities = {
        texture_and_freshness:
          typeof rawQualities.texture_and_freshness === 'string' &&
          rawQualities.texture_and_freshness.trim()
            ? rawQualities.texture_and_freshness.trim()
            : 'Firm, fresh culinary grade with high nutrient retention',
        flavor_profile:
          typeof rawQualities.flavor_profile === 'string' &&
          rawQualities.flavor_profile.trim()
            ? rawQualities.flavor_profile.trim()
            : 'Balanced natural umami and aromatic depth',
        cooking_behavior:
          typeof rawQualities.cooking_behavior === 'string' &&
          rawQualities.cooking_behavior.trim()
            ? rawQualities.cooking_behavior.trim()
            : 'Caramelizes cleanly under pan-searing, roasting, or simmering',
      };

      return {
        id:
          typeof it.id === 'string' && it.id.trim()
            ? it.id.trim()
            : `inv-${slugify(name)}-${idx}`,
        name,
        category:
          typeof it.category === 'string' && it.category.trim()
            ? it.category.trim()
            : 'Vegetable',
        quantity_g: Math.max(25, Number(it.quantity_g) || 250),
        unit_label:
          typeof it.unit_label === 'string' ? it.unit_label : undefined,
        freshness_days:
          typeof it.freshness_days === 'number' ? it.freshness_days : 5,
        calories_per_100g: Math.max(0, Math.round(Number(it.calories_per_100g) || 0)),
        macros,
        health_benefits:
          health_benefits.length > 0
            ? health_benefits
            : ['Supports balanced daily macronutrient intake'],
        source_details:
          typeof it.source_details === 'string' && it.source_details.trim()
            ? it.source_details.trim()
            : 'Whole culinary ingredient cataloged by SnapChef spatial scanner.',
        qualities,
        confidence:
          typeof it.confidence === 'number'
            ? Math.min(100, Math.max(50, Math.round(it.confidence)))
            : 96,
      };
    })
    .filter((item): item is InventoryItem => item !== null);

  const recipes: RecipeItem[] = rawRecipes
    .map((rec, idx): RecipeItem | null => {
      if (!rec || typeof rec !== 'object') return null;
      const r = rec as Record<string, unknown>;
      const title = typeof r.title === 'string' ? r.title.trim() : '';
      if (!title) return null;

      const rawSteps = Array.isArray(r.steps) ? r.steps : [];
      const steps = rawSteps
        .map((s) => {
          if (!s || typeof s !== 'object') return null;
          const st = s as Record<string, unknown>;
          const instruction =
            typeof st.instruction === 'string' ? st.instruction.trim() : '';
          if (!instruction) return null;
          return {
            instruction,
            timer_seconds: Math.max(0, Math.round(Number(st.timer_seconds) || 0)),
            tip: typeof st.tip === 'string' ? st.tip.trim() : undefined,
          };
        })
        .filter((s): s is NonNullable<typeof s> => s !== null);

      const used_ingredients = Array.isArray(r.used_ingredients)
        ? r.used_ingredients.filter((u): u is string => typeof u === 'string')
        : inferUsedIngredients(title, steps.map((s) => s.instruction), inventory);

      return {
        id:
          typeof r.id === 'string' && r.id.trim()
            ? r.id.trim()
            : `rec-${slugify(title)}-${idx}`,
        title,
        cuisine:
          typeof r.cuisine === 'string' && r.cuisine.trim()
            ? r.cuisine.trim()
            : 'Global',
        meal_type: normalizeMealType(r.meal_type),
        prep_cook_minutes: Math.max(5, Math.round(Number(r.prep_cook_minutes) || 15)),
        total_calories: Math.max(50, Math.round(Number(r.total_calories) || 250)),
        protein_g: roundOneDecimal(Number(r.protein_g) || 8),
        carbs_g: roundOneDecimal(Number(r.carbs_g) || 28),
        fat_g: roundOneDecimal(Number(r.fat_g) || 9),
        crafting_difficulty: normalizeDifficulty(r.crafting_difficulty),
        used_ingredients,
        steps:
          steps.length > 0
            ? steps
            : [
                {
                  instruction: `Prepare and cook ${title} using your scanned ingredients.`,
                  timer_seconds: 300,
                },
              ],
        chef_note:
          typeof r.chef_note === 'string' ? r.chef_note.trim() : undefined,
      };
    })
    .filter((r): r is RecipeItem => r !== null);

  return {
    inventory,
    recipes,
    scan_summary:
      typeof obj.scan_summary === 'string' ? obj.scan_summary : undefined,
    model_used:
      typeof obj.model_used === 'string' ? obj.model_used : undefined,
  };
}

export function normalizeMealType(val: unknown): 'Breakfast' | 'Lunch' | 'Dinner' {
  if (typeof val !== 'string') return 'Lunch';
  const lower = val.trim().toLowerCase();
  if (lower.includes('breakfast') || lower.includes('morning')) return 'Breakfast';
  if (lower.includes('dinner') || lower.includes('supper') || lower.includes('evening'))
    return 'Dinner';
  return 'Lunch';
}

export function normalizeDifficulty(val: unknown): string {
  if (typeof val !== 'string') return 'Level 1';
  const match = val.match(/[1-5]/);
  if (match) return `Level ${match[0]}`;
  return 'Level 1';
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export function roundOneDecimal(num: number): number {
  return Math.round(num * 10) / 10;
}

export function inferUsedIngredients(
  title: string,
  instructions: string[],
  inventory: InventoryItem[]
): string[] {
  const combined = `${title} ${instructions.join(' ')}`.toLowerCase();
  const matched = inventory
    .filter((item) => {
      const base = item.name.toLowerCase();
      const firstWord = base.split(/\s+/)[0];
      return (
        combined.includes(base) ||
        (firstWord.length >= 4 && combined.includes(firstWord))
      );
    })
    .map((item) => item.name);

  if (matched.length > 0) return matched;
  return inventory.slice(0, 3).map((item) => item.name);
}

/**
 * Filters recipes by Meal-Time Intent ("All" | "Breakfast" | "Lunch" | "Dinner"),
 * Cuisine ("All" | specific cuisine), and optional search query.
 */
export function filterRecipes(
  recipes: RecipeItem[],
  options: {
    mealType?: string;
    cuisine?: string;
    searchQuery?: string;
    onlyAvailableInventory?: boolean;
    inventory?: InventoryItem[];
  }
): RecipeItem[] {
  const {
    mealType = 'All',
    cuisine = 'All',
    searchQuery = '',
    onlyAvailableInventory = false,
    inventory = [],
  } = options;

  const query = searchQuery.trim().toLowerCase();
  const invNames = new Set(inventory.map((i) => i.name.toLowerCase()));

  return recipes.filter((recipe) => {
    if (mealType !== 'All' && recipe.meal_type.toLowerCase() !== mealType.toLowerCase()) {
      return false;
    }

    if (cuisine !== 'All' && recipe.cuisine.toLowerCase() !== cuisine.toLowerCase()) {
      return false;
    }

    if (onlyAvailableInventory && invNames.size > 0 && recipe.used_ingredients.length > 0) {
      const hasAtLeastOneCore = recipe.used_ingredients.some((reqName) => {
        const lowerReq = reqName.toLowerCase();
        for (const inv of invNames) {
          if (inv.includes(lowerReq) || lowerReq.includes(inv)) return true;
        }
        return false;
      });
      if (!hasAtLeastOneCore) return false;
    }

    if (query) {
      const haystack = [
        recipe.title,
        recipe.cuisine,
        recipe.meal_type,
        ...recipe.used_ingredients,
        ...recipe.steps.map((s) => s.instruction),
      ]
        .join(' ')
        .toLowerCase();
      if (!haystack.includes(query)) return false;
    }

    return true;
  });
}

/**
 * Deducts consumed ingredients from the user's virtual pantry after completing a dish
 * in RPG-Style "Crafting" Mode.
 * Each used ingredient has its quantity reduced by `gramsPerIngredient` (default 100g).
 * Items that drop to 0g are removed from the active inventory.
 */
export function deductInventoryAfterCrafting(
  inventory: InventoryItem[],
  usedIngredientNames: string[],
  gramsPerIngredient = 100
): {
  updatedInventory: InventoryItem[];
  consumedNames: string[];
} {
  const consumedNames: string[] = [];
  const lowerTargets = usedIngredientNames.map((n) => n.toLowerCase().trim());

  const updatedInventory = inventory
    .map((item) => {
      const itemLower = item.name.toLowerCase();
      const isUsed = lowerTargets.some(
        (target) =>
          target.length > 0 &&
          (itemLower.includes(target) || target.includes(itemLower))
      );

      if (!isUsed) return item;

      consumedNames.push(item.name);
      const nextQuantity = item.quantity_g - gramsPerIngredient;
      if (nextQuantity <= 0) {
        return null;
      }
      return {
        ...item,
        quantity_g: nextQuantity,
      };
    })
    .filter((item): item is InventoryItem => item !== null);

  return { updatedInventory, consumedNames };
}

/**
 * Merges newly scanned ingredients into the existing inventory without duplicating items.
 */
export function mergeScannedInventory(
  existing: InventoryItem[],
  incoming: InventoryItem[]
): InventoryItem[] {
  const map = new Map<string, InventoryItem>();
  for (const item of existing) {
    map.set(item.name.toLowerCase().trim(), { ...item });
  }
  for (const item of incoming) {
    const key = item.name.toLowerCase().trim();
    const prev = map.get(key);
    if (prev) {
      map.set(key, {
        ...prev,
        ...item,
        id: prev.id,
        quantity_g: prev.quantity_g + (item.quantity_g || 200),
      });
    } else {
      map.set(key, { ...item });
    }
  }
  return Array.from(map.values());
}

/**
 * Formats countdown timer seconds into crisp MM:SS monospace notation.
 */
export function formatTimerMMSS(totalSeconds: number): string {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const mins = Math.floor(safe / 60);
  const secs = safe % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

/**
 * Computes aggregate pantry nutrition statistics across all stored inventory items.
 */
export function calculatePantryTotals(inventory: InventoryItem[]): {
  totalItems: number;
  totalWeightG: number;
  totalCalories: number;
  totalProteinG: number;
  totalCarbsG: number;
  totalFatG: number;
} {
  let totalWeightG = 0;
  let totalCalories = 0;
  let totalProteinG = 0;
  let totalCarbsG = 0;
  let totalFatG = 0;

  for (const item of inventory) {
    const factor = (item.quantity_g || 100) / 100;
    totalWeightG += item.quantity_g || 100;
    totalCalories += item.calories_per_100g * factor;
    totalProteinG += item.macros.protein_g * factor;
    totalCarbsG += item.macros.carbs_g * factor;
    totalFatG += item.macros.fat_g * factor;
  }

  return {
    totalItems: inventory.length,
    totalWeightG: Math.round(totalWeightG),
    totalCalories: Math.round(totalCalories),
    totalProteinG: roundOneDecimal(totalProteinG),
    totalCarbsG: roundOneDecimal(totalCarbsG),
    totalFatG: roundOneDecimal(totalFatG),
  };
}
