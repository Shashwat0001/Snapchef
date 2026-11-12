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
    }, 4500);
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
        ? mergeScannedInventory(inventory, payload.inventory)
        : payload.inventory;

    setInventory(nextInv);
    if (nextInv.length > 0) {
      setSelectedCodexItem(nextInv[0]);
    }
    if (payload.recipes.length > 0) {
      setRecipes(payload.recipes);
      setActiveCraftingRecipe(payload.recipes[0]);
    }
    showToast(
      `${sourceLabel}: Cataloged ${nextInv.length} ingredients & ${
        payload.recipes.length || recipes.length
      } global dishes.`
    );
  };

  const handleAddSingleIngredient = (
    item: InventoryItem,
    newRecipes?: RecipeItem[]
  ) => {
    const merged = mergeScannedInventory(inventory, [item]);
    setInventory(merged);
    setSelectedCodexItem(item);
    if (newRecipes && newRecipes.length > 0) {
      setRecipes((prev) => [...newRecipes, ...prev]);
    }
    showToast(`Added "${item.name}" to your virtual pantry and opened its Codex.`);
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
      `Completed "${recipe.title}"! Deducted used ingredients from virtual pantry.`
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
    <div id="top" className="min-h-screen bg-[#0D0D0D] text-[#F2F5F8] pb-24 md:pb-16">
      {/* Strict 3-Zone Top Bar Contract */}
      <header className="sticky top-0 z-40 h-14 flex items-center justify-between gap-8 px-4 sm:px-8 bg-[#0D0D0D]/90 backdrop-blur-md border-b border-white/10">
        {/* Zone 1: Single text element wordmark */}
        <a
          href="#top"
          className="text-lg sm:text-xl font-bold tracking-tight text-[#F2F5F8] whitespace-nowrap shrink-0"
        >
          SnapChef
        </a>

        {/* Zone 2: 4 concise single-line text navigation links */}
        <nav
          aria-label="Primary Navigation"
          className="hidden md:flex items-center gap-6 text-sm font-medium text-[#94A3B8]"
        >
          <button
            type="button"
            onClick={() => scrollToSection('scanner')}
            className={`hover:text-[#00F0FF] transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              activeNav === 'scanner' ? 'text-[#00F0FF]' : ''
            }`}
          >
            Scanner
          </button>
          <button
            type="button"
            onClick={() => scrollToSection('codex')}
            className={`hover:text-[#00F0FF] transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              activeNav === 'codex' ? 'text-[#00F0FF]' : ''
            }`}
          >
            Ingredient Codex
          </button>
          <button
            type="button"
            onClick={() => scrollToSection('recipes')}
            className={`hover:text-[#00F0FF] transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              activeNav === 'recipes' ? 'text-[#00F0FF]' : ''
            }`}
          >
            Recipe Synthesizer
          </button>
          <button
            type="button"
            onClick={() => scrollToSection('crafting')}
            className={`hover:text-[#00F0FF] transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              activeNav === 'crafting' ? 'text-[#00F0FF]' : ''
            }`}
          >
            Crafting HUD
          </button>
          <button
            type="button"
            onClick={() => scrollToSection('macros')}
            className={`hover:text-[#00F0FF] transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              activeNav === 'macros' ? 'text-[#00F0FF]' : ''
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

      {/* Main Responsive Container (max-w-7xl on 1440px desktop, fluid on mobile/tablet) */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-5 sm:pt-8">
        {/* Compact Hero Header & Quantitative HUD Strip */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 pb-6 border-b border-white/10">
          <div className="max-w-2xl">
            <p className="text-xs font-medium text-[#00F0FF]">
              AI Kitchen Inventory & Global Recipe Synthesizer · Powered by Google Argon
            </p>
            <h1 className="text-2xl sm:text-4xl font-bold text-[#F2F5F8] tracking-tight mt-1 text-balance">
              Scan Your Fridge. Inspect Nutrition. Craft Zero-Missing-Ingredient Meals.
            </h1>
          </div>

          {/* Unboxed Quantitative Telemetry Summary */}
          <div className="flex flex-wrap items-center gap-4 text-xs font-mono tabular-nums text-[#94A3B8]">
            <span>
              Pantry:{' '}
              <strong className="text-[#F2F5F8]">{totals.totalItems} Items</strong>
            </span>
            <span aria-hidden="true">·</span>
            <span>
              Energy:{' '}
              <strong className="text-[#00F0FF]">
                {totals.totalCalories} kcal
              </strong>
            </span>
            <span aria-hidden="true">·</span>
            <span>
              Protein:{' '}
              <strong className="text-[#B8FF01]">
                {totals.totalProteinG}g
              </strong>
            </span>
            <span aria-hidden="true">·</span>
            <span>
              Recipes Ready:{' '}
              <strong className="text-[#FF2A85]">{recipes.length}</strong>
            </span>
          </div>
        </div>

        {/* Toast Feedback Banner */}
        {statusToast && (
          <div
            role="status"
            className="mt-4 rounded-xl border border-[#00F0FF]/40 bg-[#141619] px-4 py-3 text-xs sm:text-sm text-[#00F0FF] flex items-center justify-between gap-3"
          >
            <span>{statusToast}</span>
            <button
              type="button"
              onClick={() => setStatusToast(null)}
              className="text-xs text-[#94A3B8] hover:text-white cursor-pointer"
            >
              Close
            </button>
          </div>
        )}

        {/* Section 1: Browser-Native Camera Scanner ("The Eye") */}
        <div ref={scannerRef} className="scroll-mt-16 mt-6">
          <CameraScannerEye
            onScanComplete={handleScanComplete}
            onAddSingleIngredient={handleAddSingleIngredient}
            activeMealFilter={activeMealFilter}
            inventoryCount={inventory.length}
          />
        </div>

        {/* Section 2: Interactive Inventory Loot Grid & Deep Ingredient Codex */}
        <div ref={codexRef} className="scroll-mt-16">
          <InventoryLootGrid
            inventory={inventory}
            selectedItem={selectedCodexItem}
            onSelectItem={(item) => setSelectedCodexItem(item)}
            onUpdateQuantity={handleUpdateQuantity}
            onRemoveItem={handleRemoveItem}
            onNavigateToRecipes={() => scrollToSection('recipes')}
          />
        </div>

        {/* Section 3: Global Recipe Synthesizer (Powered by Argon) */}
        <div ref={recipesRef} className="scroll-mt-16">
          <RecipeSynthesizer
            recipes={recipes}
            inventory={inventory}
            activeMealFilter={activeMealFilter}
            onMealFilterChange={(meal) => setActiveMealFilter(meal)}
            onSelectRecipeForCrafting={handleSelectRecipeForCrafting}
            onSynthesizedRecipes={(newRecs) => setRecipes(newRecs)}
          />
        </div>

        {/* Section 4: RPG-Style "Crafting" Mode (Interactive Cook View) */}
        <div ref={craftingRef} className="scroll-mt-16">
          <CraftingModeHUD
            recipe={activeCraftingRecipe}
            onCompleteCrafting={handleCompleteCrafting}
            onBackToRecipes={() => scrollToSection('recipes')}
          />
        </div>

        {/* Section 5: Pantry Telemetry, Crafted Meal History & PWA Install */}
        <div ref={macrosRef} className="scroll-mt-16">
          <NutritionLogSection
            inventory={inventory}
            craftedHistory={craftedHistory}
            onResetDemoData={handleResetDemoData}
          />
        </div>
      </main>

      {/* Quiet Footer */}
      <footer className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-14 pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#94A3B8]">
        <p>
          SnapChef — AI Kitchen Inventory & Global Recipe Synthesizer · Built for Mobile & Desktop
        </p>
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => scrollToSection('scanner')}
            className="hover:text-white cursor-pointer"
          >
            Camera Scanner
          </button>
          <span aria-hidden="true">·</span>
          <button
            type="button"
            onClick={() => scrollToSection('recipes')}
            className="hover:text-white cursor-pointer"
          >
            Global Recipes
          </button>
          <span aria-hidden="true">·</span>
          <button
            type="button"
            onClick={handleResetDemoData}
            className="hover:text-white cursor-pointer"
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
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#0D0D0D]/95 backdrop-blur-md border-t border-white/10 grid grid-cols-5 items-center h-14 pb-safe px-1"
      >
        <button
          type="button"
          onClick={() => scrollToSection('scanner')}
          className={`min-h-[44px] flex flex-col items-center justify-center cursor-pointer ${
            activeNav === 'scanner' ? 'text-[#00F0FF]' : 'text-[#94A3B8]'
          }`}
        >
          <Camera className="w-4 h-4" />
          <span className="text-[10px] font-medium mt-0.5">Scan</span>
        </button>

        <button
          type="button"
          onClick={() => scrollToSection('codex')}
          className={`min-h-[44px] flex flex-col items-center justify-center cursor-pointer ${
            activeNav === 'codex' ? 'text-[#00F0FF]' : 'text-[#94A3B8]'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span className="text-[10px] font-medium mt-0.5">Codex</span>
        </button>

        <button
          type="button"
          onClick={() => scrollToSection('recipes')}
          className={`min-h-[44px] flex flex-col items-center justify-center cursor-pointer ${
            activeNav === 'recipes' ? 'text-[#00F0FF]' : 'text-[#94A3B8]'
          }`}
        >
          <ChefHat className="w-4 h-4" />
          <span className="text-[10px] font-medium mt-0.5">Recipes</span>
        </button>

        <button
          type="button"
          onClick={() => scrollToSection('crafting')}
          className={`min-h-[44px] flex flex-col items-center justify-center cursor-pointer ${
            activeNav === 'crafting' ? 'text-[#B8FF01]' : 'text-[#94A3B8]'
          }`}
        >
          <Flame className="w-4 h-4" />
          <span className="text-[10px] font-medium mt-0.5">Craft</span>
        </button>

        <button
          type="button"
          onClick={() => scrollToSection('macros')}
          className={`min-h-[44px] flex flex-col items-center justify-center cursor-pointer ${
            activeNav === 'macros' ? 'text-[#00F0FF]' : 'text-[#94A3B8]'
          }`}
        >
          <Activity className="w-4 h-4" />
          <span className="text-[10px] font-medium mt-0.5">Macros</span>
        </button>
      </nav>
    </div>
  );
}
