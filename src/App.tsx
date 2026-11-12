import React, { useEffect, useState, useRef } from 'react';
import {
  Camera,
  BookOpen,
  ChefHat,
  Flame,
  Activity,
} from 'lucide-react';
import type {
  CraftedMealLog,
  InventoryItem,
  MealType,
  RecipeItem,
  SnapChefPayload,
} from './types/snapchef';
import { INITIAL_INVENTORY, INITIAL_RECIPES } from './data/seedData';
import {
  calculatePantryTotals,
  deductInventoryAfterCrafting,
  mergeScannedInventory,
} from './utils/snapchefLogic';
import { CameraScannerEye } from './components/CameraScannerEye';
import { InventoryLootGrid } from './components/InventoryLootGrid';
import { RecipeSynthesizer } from './components/RecipeSynthesizer';
import { CraftingModeHUD } from './components/CraftingModeHUD';
import { NutritionLogSection } from './components/NutritionLogSection';
import {
  OfflineIndicator,
  PWAInstallModalTrigger,
} from './components/PWAInstallButton';

const STORAGE_KEYS = {
  INVENTORY: 'snapchef_pantry_inventory_v1',
  RECIPES: 'snapchef_synthesized_recipes_v1',
  HISTORY: 'snapchef_crafted_history_v1',
};

type ActiveSection = 'scanner' | 'codex' | 'recipes' | 'crafting' | 'macros';

export default function App() {
  const [inventory, setInventory] = useState<InventoryItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.INVENTORY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // Ignore storage error
    }
    return INITIAL_INVENTORY;
  });

  const [recipes, setRecipes] = useState<RecipeItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.RECIPES);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // Ignore storage error
    }
    return INITIAL_RECIPES;
  });

  const [craftedHistory, setCraftedHistory] = useState<CraftedMealLog[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.HISTORY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {
      // Ignore storage error
    }
    return [];
  });

  const [selectedCodexItem, setSelectedCodexItem] =
    useState<InventoryItem | null>(() => INITIAL_INVENTORY[0] || null);
  const [activeMealFilter, setActiveMealFilter] = useState<'All' | MealType>(
    'All'
  );
  const [activeCraftingRecipe, setActiveCraftingRecipe] =
    useState<RecipeItem>(INITIAL_RECIPES[0]);
  const [activeNav, setActiveNav] = useState<ActiveSection>('scanner');
  const [statusToast, setStatusToast] = useState<string | null>(null);

  const scannerRef = useRef<HTMLDivElement | null>(null);
  const codexRef = useRef<HTMLDivElement | null>(null);
  const recipesRef = useRef<HTMLDivElement | null>(null);
  const craftingRef = useRef<HTMLDivElement | null>(null);
  const macrosRef = useRef<HTMLDivElement | null>(null);

  // Sync state to LocalStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.INVENTORY, JSON.stringify(inventory));
    } catch {
      // Ignore quota errors
    }
  }, [inventory]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.RECIPES, JSON.stringify(recipes));
    } catch {
      // Ignore quota errors
    }
  }, [recipes]);

  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEYS.HISTORY,
        JSON.stringify(craftedHistory)
      );
    } catch {
      // Ignore quota errors
    }
  }, [craftedHistory]);

  const showToast = (msg: string) => {
    setStatusToast(msg);
    window.setTimeout(() => {
      setStatusToast((prev) => (prev === msg ? null : prev));
    }, 5000);
  };

  const scrollToSection = (section: ActiveSection) => {
    setActiveNav(section);
    const map: Record<ActiveSection, React.RefObject<HTMLDivElement | null>> = {
      scanner: scannerRef,
      codex: codexRef,
      recipes: recipesRef,
      crafting: craftingRef,
      macros: macrosRef,
    };
    const target = map[section]?.current;
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleScanComplete = (
    payload: SnapChefPayload,
    mode: 'replace' | 'merge',
    sourceLabel: string
  ) => {
    const nextInv =
      mode === 'merge'
        ? mergeScannedInventory(itemOrEmpty(payload.inventory), inventory)
        : payload.inventory;

    setInventory(nextInv);
    if (payload.inventory.length > 0) {
      setSelectedCodexItem(payload.inventory[0]);
    } else if (nextInv.length > 0) {
      setSelectedCodexItem(nextInv[0]);
    }

    if (payload.recipes.length > 0) {
      setRecipes(payload.recipes);
      setActiveCraftingRecipe(payload.recipes[0]);
    }
    showToast(
      `${sourceLabel}: Cataloged ${nextInv.length} ingredients & ${
        payload.recipes.length || recipes.length
      } delicious global dishes!`
    );
  };

  function itemOrEmpty(items: InventoryItem[]): InventoryItem[] {
    return Array.isArray(items) ? items : [];
  }

  const handleAddSingleIngredient = (
    item: InventoryItem,
    newRecipes?: RecipeItem[]
  ) => {
    const merged = mergeScannedInventory([item], inventory);
    setInventory(merged);
    setSelectedCodexItem(item);
    if (newRecipes && newRecipes.length > 0) {
      setRecipes((prev) => [...newRecipes, ...prev]);
    }
    showToast(
      `Added "${item.name}" to your kitchen basket and opened its Nutritional Codex!`
    );
  };

  const handleUpdateQuantity = (id: string, deltaGrams: number) => {
    setInventory((prev) =>
      prev
        .map((item) => {
          if (item.id !== id) return item;
          const nextQ = item.quantity_g + deltaGrams;
          return nextQ > 0 ? { ...item, quantity_g: nextQ } : null;
        })
        .filter((item): item is InventoryItem => item !== null)
    );
  };

  const handleRemoveItem = (id: string) => {
    setInventory((prev) => {
      const next = prev.filter((item) => item.id !== id);
      if (selectedCodexItem?.id === id) {
        setSelectedCodexItem(next[0] || null);
      }
      return next;
    });
  };

  const handleSelectRecipeForCrafting = (recipe: RecipeItem) => {
    setActiveCraftingRecipe(recipe);
    scrollToSection('crafting');
  };

  const handleCompleteCrafting = (recipe: RecipeItem) => {
    const { updatedInventory, consumedNames } = deductInventoryAfterCrafting(
      inventory,
      recipe.used_ingredients,
      100
    );
    setInventory(updatedInventory);

    const newLog: CraftedMealLog = {
      id: `meal-${Date.now()}`,
      recipeId: recipe.id,
      title: recipe.title,
      cuisine: recipe.cuisine,
      meal_type: recipe.meal_type,
      calories: recipe.total_calories,
      protein_g: recipe.protein_g,
      carbs_g: recipe.carbs_g || 30,
      fat_g: recipe.fat_g || 10,
      completedAt: new Date().toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      }),
      consumedIngredients:
        consumedNames.length > 0 ? consumedNames : recipe.used_ingredients,
    };

    setCraftedHistory((prev) => [newLog, ...prev]);
    showToast(
      `Completed "${recipe.title}"! Deducted used ingredients from your kitchen basket.`
    );
  };

  const handleResetDemoData = () => {
    setInventory(INITIAL_INVENTORY);
    setRecipes(INITIAL_RECIPES);
    setCraftedHistory([]);
    setSelectedCodexItem(INITIAL_INVENTORY[0]);
    setActiveCraftingRecipe(INITIAL_RECIPES[0]);
    localStorage.removeItem(STORAGE_KEYS.INVENTORY);
    localStorage.removeItem(STORAGE_KEYS.RECIPES);
    localStorage.removeItem(STORAGE_KEYS.HISTORY);
    showToast('Restored default kitchen inventory and global recipes.');
  };

  const totals = calculatePantryTotals(inventory);

  return (
    <div
      id="top"
      className="min-h-screen bg-gradient-to-br from-[#FFFDF9] via-[#FFF7ED] to-[#F0FDFA] text-slate-900 pb-24 md:pb-16"
    >
      {/* Strict 3-Zone Top Bar Contract */}
      <header className="sticky top-0 z-40 h-16 flex items-center justify-between gap-8 px-4 sm:px-8 bg-white/90 backdrop-blur-md border-b border-orange-200/80 shadow-sm">
        {/* Zone 1: Warm Culinary Neon-Outlined SnapChef Brand Wordmark */}
        <a
          href="#top"
          className="snapchef-logo-shell group relative inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-2xl bg-gradient-to-r from-[#FFF7ED] via-white to-[#ECFDF5] border border-orange-200/90 whitespace-nowrap shrink-0 overflow-hidden transition-transform hover:scale-[1.02]"
        >
          <svg
            aria-hidden="true"
            className="absolute inset-0 w-full h-full pointer-events-none"
            viewBox="0 0 190 46"
            preserveAspectRatio="none"
          >
            <defs>
              <linearGradient
                id="snapchef-warm-neon-grad"
                x1="0%"
                y1="0%"
                x2="100%"
                y2="100%"
              >
                <stop offset="0%" stopColor="#FF5A1F" />
                <stop offset="40%" stopColor="#F59E0B" />
                <stop offset="75%" stopColor="#10B981" />
                <stop offset="100%" stopColor="#FF5A1F" />
              </linearGradient>
            </defs>
            <rect
              x="1.5"
              y="1.5"
              width="187"
              height="43"
              rx="14"
              fill="none"
              stroke="url(#snapchef-warm-neon-grad)"
              strokeWidth="2.5"
              className="snapchef-neon-rect"
            />
          </svg>

          <span className="relative z-10 flex items-center justify-center w-8 h-8 rounded-xl bg-gradient-to-br from-[#FF5A1F] via-[#F97316] to-[#F59E0B] text-white shadow-sm shadow-orange-500/30 ring-2 ring-orange-200/70">
            <ChefHat className="w-4 h-4 stroke-[2.4]" />
            <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 ring-2 ring-white" />
          </span>

          <span className="relative z-10 font-display text-xl sm:text-2xl font-extrabold tracking-tight flex items-center">
            <span className="text-slate-900">Snap</span>
            <span className="snapchef-chef-gradient">Chef</span>
          </span>
        </a>

        {/* Zone 2: 5 concise single-line text navigation links */}
        <nav
          aria-label="Primary Navigation"
          className="hidden md:flex items-center gap-6 text-sm font-bold text-slate-600"
        >
          <button
            type="button"
            onClick={() => scrollToSection('scanner')}
            className={`hover:text-[#FF5A1F] transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              activeNav === 'scanner' ? 'text-[#FF5A1F]' : ''
            }`}
          >
            Scanner
          </button>
          <button
            type="button"
            onClick={() => scrollToSection('codex')}
            className={`hover:text-[#FF5A1F] transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              activeNav === 'codex' ? 'text-[#FF5A1F]' : ''
            }`}
          >
            Ingredient Codex
          </button>
          <button
            type="button"
            onClick={() => scrollToSection('recipes')}
            className={`hover:text-[#FF5A1F] transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              activeNav === 'recipes' ? 'text-[#FF5A1F]' : ''
            }`}
          >
            Recipe Synthesizer
          </button>
          <button
            type="button"
            onClick={() => scrollToSection('crafting')}
            className={`hover:text-[#FF5A1F] transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              activeNav === 'crafting' ? 'text-[#FF5A1F]' : ''
            }`}
          >
            Cooking Studio
          </button>
          <button
            type="button"
            onClick={() => scrollToSection('macros')}
            className={`hover:text-[#FF5A1F] transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              activeNav === 'macros' ? 'text-[#FF5A1F]' : ''
            }`}
          >
            Macro Log
          </button>
        </nav>

        {/* Zone 3: 1 primary action */}
        <div className="flex items-center gap-3 shrink-0">
          <PWAInstallModalTrigger variant="compact" />
        </div>
      </header>

      {/* Main Responsive Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8">
        {/* Vibrant Hero Header & Quantitative Strip */}
        <div className="rounded-3xl border-2 border-orange-200/80 bg-gradient-to-r from-orange-50 via-amber-50/70 to-teal-50/80 p-5 sm:p-7 flex flex-col lg:flex-row lg:items-end justify-between gap-4 shadow-sm">
          <div className="max-w-2xl">
            <p className="text-xs font-extrabold text-[#FF5A1F]">
              Joyful AI Kitchen Companion · Point Your Camera & Cook Happy
            </p>
            <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mt-1 text-balance">
              Snap Any Ingredient. Discover Its Nutrition. Cook Joyful Global Meals.
            </h1>
          </div>

          {/* Unboxed Quantitative Telemetry Summary */}
          <div className="flex flex-wrap items-center gap-3.5 text-xs font-mono font-bold tabular-nums text-slate-700">
            <span>
              Kitchen:{' '}
              <strong className="text-slate-950">{totals.totalItems} Items</strong>
            </span>
            <span aria-hidden="true" className="text-orange-300">
              ·
            </span>
            <span>
              Energy:{' '}
              <strong className="text-[#EA580C]">
                {totals.totalCalories} kcal
              </strong>
            </span>
            <span aria-hidden="true" className="text-orange-300">
              ·
            </span>
            <span>
              Protein:{' '}
              <strong className="text-emerald-700">
                {totals.totalProteinG}g
              </strong>
            </span>
            <span aria-hidden="true" className="text-orange-300">
              ·
            </span>
            <span>
              Recipes Ready:{' '}
              <strong className="text-rose-600">{recipes.length}</strong>
            </span>
          </div>
        </div>

        {/* Toast Feedback Banner */}
        {statusToast && (
          <div
            role="status"
            className="mt-4 rounded-2xl border-2 border-emerald-400 bg-emerald-50 px-4 py-3 text-xs sm:text-sm font-bold text-emerald-900 flex flex-wrap items-center justify-between gap-3 shadow-md"
          >
            <span>{statusToast}</span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => scrollToSection('codex')}
                className="px-3 py-1 rounded-lg bg-emerald-600 text-white text-xs font-bold cursor-pointer"
              >
                View Scanned Item
              </button>
              <button
                type="button"
                onClick={() => setStatusToast(null)}
                className="text-xs text-emerald-700 hover:text-emerald-950 cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        )}

        {/* Section 1: Browser-Native Camera Scanner ("The Eye") */}
        <div ref={scannerRef} className="scroll-mt-20 mt-6">
          <CameraScannerEye
            onScanComplete={handleScanComplete}
            onAddSingleIngredient={handleAddSingleIngredient}
            activeMealFilter={activeMealFilter}
            inventoryCount={inventory.length}
          />
        </div>

        {/* Section 2: Interactive Inventory Loot Grid & Deep Ingredient Codex */}
        <div ref={codexRef} className="scroll-mt-20">
          <InventoryLootGrid
            inventory={inventory}
            selectedItem={selectedCodexItem}
            onSelectItem={(item) => setSelectedCodexItem(item)}
            onUpdateQuantity={handleUpdateQuantity}
            onRemoveItem={handleRemoveItem}
            onNavigateToRecipes={() => scrollToSection('recipes')}
          />
        </div>

        {/* Section 3: Global Recipe Synthesizer */}
        <div ref={recipesRef} className="scroll-mt-20">
          <RecipeSynthesizer
            recipes={recipes}
            inventory={inventory}
            activeMealFilter={activeMealFilter}
            onMealFilterChange={(meal) => setActiveMealFilter(meal)}
            onSelectRecipeForCrafting={handleSelectRecipeForCrafting}
            onSynthesizedRecipes={(newRecs) => setRecipes(newRecs)}
          />
        </div>

        {/* Section 4: Interactive Cooking Studio (Crafting Mode HUD) */}
        <div ref={craftingRef} className="scroll-mt-20">
          <CraftingModeHUD
            recipe={activeCraftingRecipe}
            onCompleteCrafting={handleCompleteCrafting}
            onBackToRecipes={() => scrollToSection('recipes')}
          />
        </div>

        {/* Section 5: Pantry Telemetry, Crafted Meal History & PWA Install */}
        <div ref={macrosRef} className="scroll-mt-20">
          <NutritionLogSection
            inventory={inventory}
            craftedHistory={craftedHistory}
            onResetDemoData={handleResetDemoData}
          />
        </div>
      </main>

      {/* Quiet Footer */}
      <footer className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-14 pt-6 border-t border-orange-200/70 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-medium text-slate-600">
        <p>
          SnapChef — Joyful AI Kitchen Inventory & Global Recipe Synthesizer · Built for Mobile & Desktop
        </p>
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => scrollToSection('scanner')}
            className="hover:text-[#FF5A1F] cursor-pointer"
          >
            Camera Scanner
          </button>
          <span aria-hidden="true">·</span>
          <button
            type="button"
            onClick={() => scrollToSection('recipes')}
            className="hover:text-[#FF5A1F] cursor-pointer"
          >
            Global Recipes
          </button>
          <span aria-hidden="true">·</span>
          <button
            type="button"
            onClick={handleResetDemoData}
            className="hover:text-[#FF5A1F] cursor-pointer"
          >
            Reset Pantry
          </button>
        </div>
      </footer>

      {/* Offline Mode Indicator */}
      <OfflineIndicator />

      {/* Mobile Bottom Navigation Bar (Android / iPhone Thumb Zone, <= 15% total sticky cap) */}
      <nav
        aria-label="Mobile Bottom Navigation"
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-orange-200 grid grid-cols-5 items-center h-14 pb-safe px-1 shadow-lg"
      >
        <button
          type="button"
          onClick={() => scrollToSection('scanner')}
          className={`min-h-[44px] flex flex-col items-center justify-center cursor-pointer ${
            activeNav === 'scanner' ? 'text-[#FF5A1F] font-bold' : 'text-slate-500'
          }`}
        >
          <Camera className="w-4 h-4" />
          <span className="text-[10px] mt-0.5">Scan</span>
        </button>

        <button
          type="button"
          onClick={() => scrollToSection('codex')}
          className={`min-h-[44px] flex flex-col items-center justify-center cursor-pointer ${
            activeNav === 'codex' ? 'text-emerald-600 font-bold' : 'text-slate-500'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span className="text-[10px] mt-0.5">Codex</span>
        </button>

        <button
          type="button"
          onClick={() => scrollToSection('recipes')}
          className={`min-h-[44px] flex flex-col items-center justify-center cursor-pointer ${
            activeNav === 'recipes' ? 'text-[#FF5A1F] font-bold' : 'text-slate-500'
          }`}
        >
          <ChefHat className="w-4 h-4" />
          <span className="text-[10px] mt-0.5">Recipes</span>
        </button>

        <button
          type="button"
          onClick={() => scrollToSection('crafting')}
          className={`min-h-[44px] flex flex-col items-center justify-center cursor-pointer ${
            activeNav === 'crafting' ? 'text-rose-600 font-bold' : 'text-slate-500'
          }`}
        >
          <Flame className="w-4 h-4" />
          <span className="text-[10px] mt-0.5">Cook</span>
        </button>

        <button
          type="button"
          onClick={() => scrollToSection('macros')}
          className={`min-h-[44px] flex flex-col items-center justify-center cursor-pointer ${
            activeNav === 'macros' ? 'text-teal-600 font-bold' : 'text-slate-500'
          }`}
        >
          <Activity className="w-4 h-4" />
          <span className="text-[10px] mt-0.5">Macros</span>
        </button>
      </nav>
    </div>
  );
}
