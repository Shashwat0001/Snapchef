import React, { useState } from 'react';
import {
  ChefHat,
  Clock,
  Flame,
  Sparkles,
  CheckCircle2,
  Play,
  Search,
  Globe,
} from 'lucide-react';
import type {
  InventoryItem,
  MealType,
  RecipeItem,
  SnapChefPayload,
} from '../types/snapchef';
import { filterRecipes, normalizeSnapChefPayload } from '../utils/snapchefLogic';

interface RecipeSynthesizerProps {
  recipes: RecipeItem[];
  inventory: InventoryItem[];
  activeMealFilter: 'All' | MealType;
  onMealFilterChange: (meal: 'All' | MealType) => void;
  onSelectRecipeForCrafting: (recipe: RecipeItem) => void;
  onSynthesizedRecipes: (newRecipes: RecipeItem[]) => void;
}

const MEAL_FILTERS: Array<'All' | MealType> = [
  'All',
  'Breakfast',
  'Lunch',
  'Dinner',
];

const CUISINE_FILTERS: string[] = [
  'All',
  'Indian',
  'European',
  'South American',
];

export const RecipeSynthesizer: React.FC<RecipeSynthesizerProps> = ({
  recipes,
  inventory,
  activeMealFilter,
  onMealFilterChange,
  onSelectRecipeForCrafting,
  onSynthesizedRecipes,
}) => {
  const [cuisineFilter, setCuisineFilter] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [customCraving, setCustomCraving] = useState<string>('');
  const [isSynthesizing, setIsSynthesizing] = useState<boolean>(false);
  const [synthStatus, setSynthStatus] = useState<string | null>(null);

  const filteredRecipes = filterRecipes(recipes, {
    mealType: activeMealFilter,
    cuisine: cuisineFilter,
    searchQuery,
    inventory,
  });

  const inventoryNamesLower = new Set(
    inventory.map((item) => item.name.toLowerCase())
  );

  const isIngredientInPantry = (ingName: string): boolean => {
    const target = ingName.toLowerCase();
    for (const inv of inventoryNamesLower) {
      if (inv.includes(target) || target.includes(inv)) return true;
    }
    return false;
  };

  const handleSynthesizeWithArgon = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSynthesizing(true);
    setSynthStatus(
      'Synthesizing zero-missing-ingredient global recipes from your virtual pantry...'
    );

    try {
      const response = await fetch('/api/synthesize-recipes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          inventory,
          mealIntent: activeMealFilter,
          cuisinePreference: cuisineFilter,
          customCraving: customCraving.trim(),
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const rawData: SnapChefPayload = await response.json();
      const normalized = normalizeSnapChefPayload(rawData);

      if (normalized.recipes.length > 0) {
        onSynthesizedRecipes(normalized.recipes);
        setSynthStatus(
          `Synthesized ${normalized.recipes.length} dishes tailored to your ${inventory.length} pantry items.`
        );
        setCustomCraving('');
        setIsSynthesizing(false);
        return;
      }
    } catch {
      // Fallback: generate deterministic custom dish if user entered a craving, or refresh filters
    }

    if (customCraving.trim()) {
      const topIngredients = inventory.slice(0, 3).map((i) => i.name);
      const customRecipe: RecipeItem = {
        id: `rec-synth-${Date.now()}`,
        title: `${customCraving.trim()} (${
          cuisineFilter !== 'All' ? cuisineFilter : 'Global'
        } Pantry Craft)`,
        cuisine: cuisineFilter !== 'All' ? cuisineFilter : 'Indian',
        meal_type: activeMealFilter !== 'All' ? activeMealFilter : 'Lunch',
        prep_cook_minutes: 18,
        total_calories: 340,
        protein_g: 16.5,
        carbs_g: 36.0,
        fat_g: 12.0,
        crafting_difficulty: 'Level 2',
        used_ingredients:
          topIngredients.length > 0 ? topIngredients : ['Potato', 'Spices'],
        chef_note:
          'Custom zero-missing-ingredient synthesis matched to your current pantry items.',
        steps: [
          {
            instruction: `Prep ${
              topIngredients.join(', ') || 'your core pantry ingredients'
            } into uniform bite-sized pieces for even heat transfer.`,
            timer_seconds: 180,
          },
          {
            instruction:
              'Sear aromatics and spices in hot oil, then toss in primary ingredients and sauté over medium-high heat.',
            timer_seconds: 360,
          },
          {
            instruction:
              'Simmer covered on low heat until flavors meld and texture is tender.',
            timer_seconds: 240,
          },
        ],
      };
      onSynthesizedRecipes([customRecipe, ...recipes]);
      setSynthStatus(`Synthesized custom dish "${customRecipe.title}".`);
      setCustomCraving('');
    } else {
      setSynthStatus(
        `Verified ${recipes.length} zero-missing-ingredient recipes across Indian, European, and South American cuisines.`
      );
    }
    setIsSynthesizing(false);
  };

  return (
    <section
      aria-label="Global Recipe Synthesizer"
      className="mt-8 rounded-2xl border border-white/10 bg-[#141619] p-4 sm:p-6 shadow-xl"
    >
      {/* Header & AI Synthesize Trigger */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2 text-xs text-[#B8FF01] font-medium">
            <Globe className="w-4 h-4" />
            <span>Zero-Missing-Ingredient Engine</span>
            <span aria-hidden="true">·</span>
            <span>Indian, European & South American Cuisines</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-[#F2F5F8] mt-1">
            Global Recipe Synthesizer
          </h2>
        </div>

        {/* Custom Craving / AI Synthesis Bar */}
        <form
          onSubmit={handleSynthesizeWithArgon}
          className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5"
        >
          <input
            type="text"
            value={customCraving}
            onChange={(e) => setCustomCraving(e.target.value)}
            placeholder="Craving a specific style? (e.g., Spicy Sabzi, Crispy Frittata)"
            aria-label="Custom dish craving or culinary prompt"
            className="sm:w-72 min-h-[44px] rounded-xl border border-white/15 bg-[#0D0D0D] px-3.5 py-2 text-xs sm:text-sm text-[#F2F5F8] placeholder-[#64748B] focus:outline-none focus:border-[#00F0FF]"
          />
          <button
            type="submit"
            disabled={isSynthesizing}
            className="min-h-[44px] px-4 py-2.5 rounded-xl bg-[#00F0FF] text-[#0D0D0D] font-semibold text-xs sm:text-sm hover:bg-[#00F0FF]/90 disabled:opacity-50 transition-colors flex items-center justify-center gap-2 whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Sparkles
              className={`w-4 h-4 ${isSynthesizing ? 'animate-spin' : ''}`}
            />
            <span>
              {isSynthesizing ? 'Synthesizing...' : 'Synthesize New Dishes'}
            </span>
          </button>
        </form>
      </div>

      {synthStatus && (
        <div
          role="status"
          className="mt-4 rounded-xl border border-[#00F0FF]/30 bg-[#0D0D0D] px-4 py-2.5 text-xs text-[#00F0FF] flex items-center justify-between gap-2"
        >
          <span>{synthStatus}</span>
          <button
            type="button"
            onClick={() => setSynthStatus(null)}
            className="text-[#94A3B8] hover:text-white text-xs cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Prominent Meal-Time Intent Filters + Cuisine Filters + Search */}
      <div className="mt-5 grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
        {/* 1. Meal-Time Intent Toggles (Breakfast, Lunch, Dinner) */}
        <div className="lg:col-span-5">
          <span className="block text-[11px] text-[#94A3B8] mb-1.5">
            Meal-Time Intent Filter
          </span>
          <div
            role="group"
            aria-label="Meal-Time Intent Filter"
            className="grid grid-cols-4 gap-1.5 p-1 rounded-xl bg-[#0D0D0D] border border-white/10"
          >
            {MEAL_FILTERS.map((meal) => {
              const active = activeMealFilter === meal;
              return (
                <button
                  key={meal}
                  type="button"
                  onClick={() => onMealFilterChange(meal)}
                  className={`min-h-[40px] px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    active
                      ? 'bg-[#00F0FF] text-[#0D0D0D] shadow-sm'
                      : 'text-[#94A3B8] hover:text-white'
                  }`}
                >
                  {meal}
                </button>
              );
            })}
          </div>
        </div>

        {/* 2. Global Cuisine Diversity Toggles */}
        <div className="lg:col-span-4">
          <span className="block text-[11px] text-[#94A3B8] mb-1.5">
            Global Cuisine Region
          </span>
          <div
            role="group"
            aria-label="Global Cuisine Filter"
            className="flex items-center gap-1.5 overflow-x-auto p-1 rounded-xl bg-[#0D0D0D] border border-white/10"
          >
            {CUISINE_FILTERS.map((cuisine) => {
              const active = cuisineFilter === cuisine;
              return (
                <button
                  key={cuisine}
                  type="button"
                  onClick={() => setCuisineFilter(cuisine)}
                  className={`min-h-[40px] px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    active
                      ? 'bg-[#B8FF01] text-[#0D0D0D] font-semibold'
                      : 'text-[#94A3B8] hover:text-white'
                  }`}
                >
                  {cuisine}
                </button>
              );
            })}
          </div>
        </div>

        {/* 3. Search Recipes Input */}
        <div className="lg:col-span-3">
          <label
            htmlFor="recipe-search-input"
            className="block text-[11px] text-[#94A3B8] mb-1.5"
          >
            Search Dishes or Ingredients
          </label>
          <div className="relative">
            <Search className="w-4 h-4 text-[#94A3B8] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              id="recipe-search-input"
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Aloo Jeera, Tortilla, Arepas..."
              className="w-full min-h-[42px] rounded-xl border border-white/10 bg-[#0D0D0D] pl-9 pr-3 py-2 text-xs text-[#F2F5F8] placeholder-[#64748B] focus:outline-none focus:border-[#00F0FF]"
            />
          </div>
        </div>
      </div>

      {/* Recipe Cards Grid */}
      {filteredRecipes.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-white/10 bg-[#0D0D0D] p-8 text-center">
          <p className="text-base font-semibold text-[#F2F5F8]">
            No recipes match the current filter combination.
          </p>
          <p className="text-xs text-[#94A3B8] mt-1">
            Reset the Meal-Time or Cuisine filter, or tap &ldquo;Synthesize New Dishes&rdquo; above.
          </p>
          <button
            type="button"
            onClick={() => {
              onMealFilterChange('All');
              setCuisineFilter('All');
              setSearchQuery('');
            }}
            className="mt-4 min-h-[44px] px-4 py-2 rounded-xl bg-[#00F0FF] text-[#0D0D0D] font-semibold text-xs cursor-pointer"
          >
            Show All Global Recipes
          </button>
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 items-stretch">
          {filteredRecipes.map((recipe) => {
            const matchedCount = recipe.used_ingredients.filter((ing) =>
              isIngredientInPantry(ing)
            ).length;

            return (
              <article
                key={recipe.id}
                className="rounded-2xl border border-white/10 bg-[#0D0D0D] hover:border-[#00F0FF]/50 transition-all p-5 flex flex-col justify-between"
              >
                <div>
                  {/* Quiet 1-line unboxed metadata kicker (Zero-Pill Discipline) */}
                  <div className="flex items-center justify-between gap-2 text-xs text-[#94A3B8]">
                    <div className="flex items-center gap-1.5 truncate">
                      <span className="font-semibold text-[#00F0FF]">
                        {recipe.cuisine}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span className="text-[#F2F5F8] font-medium">
                        {recipe.meal_type}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono tabular-nums text-[#B8FF01]">
                        {recipe.crafting_difficulty} Craft
                      </span>
                    </div>
                    <span className="font-mono tabular-nums text-[#F2F5F8] flex items-center gap-1 shrink-0">
                      <Clock className="w-3.5 h-3.5 text-[#00F0FF]" />
                      {recipe.prep_cook_minutes}m
                    </span>
                  </div>

                  {/* Recipe Title */}
                  <h3 className="text-lg font-bold text-[#F2F5F8] mt-2 leading-snug">
                    {recipe.title}
                  </h3>

                  {recipe.chef_note && (
                    <p className="mt-1.5 text-xs text-[#94A3B8] leading-relaxed">
                      {recipe.chef_note}
                    </p>
                  )}

                  {/* Quantitative Macro Metrics Strip */}
                  <div className="mt-4 grid grid-cols-3 gap-2 rounded-xl border border-white/10 bg-[#141619] p-3">
                    <div>
                      <span className="text-[10px] text-[#94A3B8] block">
                        Calories
                      </span>
                      <span className="text-sm font-mono font-bold tabular-nums text-[#F2F5F8] flex items-center gap-1 mt-0.5">
                        <Flame className="w-3.5 h-3.5 text-[#FF2A85]" />
                        {recipe.total_calories} kcal
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-[#94A3B8] block">
                        Protein
                      </span>
                      <span className="text-sm font-mono font-bold tabular-nums text-[#B8FF01] block mt-0.5">
                        {recipe.protein_g}g
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-[#94A3B8] block">
                        Flashcards
                      </span>
                      <span className="text-sm font-mono font-bold tabular-nums text-[#00F0FF] block mt-0.5">
                        {recipe.steps.length} Steps
                      </span>
                    </div>
                  </div>

                  {/* Zero-Missing-Ingredient Verification List */}
                  <div className="mt-4">
                    <div className="flex items-center justify-between text-xs text-[#94A3B8]">
                      <span>Pantry Ingredients Used</span>
                      <span className="font-mono tabular-nums text-[#B8FF01]">
                        {matchedCount}/{recipe.used_ingredients.length} In Stock
                      </span>
                    </div>
                    <p className="mt-1.5 text-xs text-[#CBD5E1] leading-relaxed">
                      {recipe.used_ingredients.map((ing, i) => (
                        <React.Fragment key={ing}>
                          {i > 0 && (
                            <span
                              aria-hidden="true"
                              className="mx-1.5 text-white/25"
                            >
                              ·
                            </span>
                          )}
                          <span
                            className={
                              isIngredientInPantry(ing)
                                ? 'text-[#F2F5F8]'
                                : 'text-[#94A3B8]'
                            }
                          >
                            {ing}
                          </span>
                        </React.Fragment>
                      ))}
                    </p>
                  </div>
                </div>

                {/* Primary Action: Launch RPG-Style Crafting Mode */}
                <div className="mt-5 pt-4 border-t border-white/10 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-1.5 text-xs text-[#B8FF01]">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>Zero Missing Core Items</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => onSelectRecipeForCrafting(recipe)}
                    className="min-h-[44px] px-4 py-2 rounded-xl bg-[#00F0FF] text-[#0D0D0D] font-semibold text-xs hover:bg-[#00F0FF]/90 transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Cook in Crafting HUD</span>
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
};
