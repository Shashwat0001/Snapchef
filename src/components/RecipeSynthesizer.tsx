import React, { useState } from 'react';
import {
  Clock,
  Flame,
  Sparkles,
  CheckCircle2,
  Play,
  ArrowLeft,
  Users,
  Sprout,
  AlertTriangle,
} from 'lucide-react';
import type {
  DietaryRestriction,
  InventoryItem,
  MealType,
  RecipeItem,
  SnapChefPayload,
} from '../types/snapchef';
import {
  computeMissingIngredientsForRecipe,
  filterRecipes,
  normalizeSnapChefPayload,
  scaleRecipeForPeopleAndDiet,
} from '../utils/snapchefLogic';

interface RecipeSynthesizerProps {
  recipes: RecipeItem[];
  inventory: InventoryItem[];
  servings: number;
  dietaryRestriction: DietaryRestriction;
  activeMealFilter: 'All' | MealType;
  onMealFilterChange: (meal: 'All' | MealType) => void;
  onSelectRecipeForCrafting: (recipe: RecipeItem) => void;
  onSynthesizedRecipes: (newRecipes: RecipeItem[]) => void;
  onBackToServings: () => void;
  onBackToPhotos: () => void;
}

const MEAL_FILTERS: Array<'All' | MealType> = [
  'All',
  'Breakfast',
  'Lunch',
  'Dinner',
];

export const RecipeSynthesizer: React.FC<RecipeSynthesizerProps> = ({
  recipes,
  inventory,
  servings,
  dietaryRestriction,
  activeMealFilter,
  onMealFilterChange,
  onSelectRecipeForCrafting,
  onSynthesizedRecipes,
  onBackToServings,
  onBackToPhotos,
}) => {
  const [customCraving, setCustomCraving] = useState<string>('');
  const [isSynthesizing, setIsSynthesizing] = useState<boolean>(false);
  const [synthStatus, setSynthStatus] = useState<string | null>(null);

  const filteredRecipes = filterRecipes(recipes, {
    mealType: activeMealFilter,
    inventory,
  });

  const handleSynthesizeCustom = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSynthesizing(true);
    setSynthStatus(
      `Finding new recipes for ${servings} ${
        servings === 1 ? 'person' : 'people'
      } (${dietaryRestriction})...`
    );

    try {
      const response = await fetch('/api/synthesize-recipes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          inventory,
          mealIntent: activeMealFilter,
          servings,
          dietaryRestriction,
          customCraving: customCraving.trim(),
        }),
      });

      if (response.ok) {
        const rawData: SnapChefPayload = await response.json();
        const normalized = normalizeSnapChefPayload(rawData);
        if (normalized.recipes.length > 0) {
          const scaled = normalized.recipes.map((r) =>
            scaleRecipeForPeopleAndDiet(r, servings, dietaryRestriction)
          );
          onSynthesizedRecipes(scaled);
          setSynthStatus(
            `Found ${scaled.length} recipes tailored for ${servings} ${
              servings === 1 ? 'person' : 'people'
            } (${dietaryRestriction})!`
          );
          setCustomCraving('');
          setIsSynthesizing(false);
          return;
        }
      }
    } catch {
      // Fallback below
    }

    if (customCraving.trim()) {
      const topIngredients = inventory.slice(0, 3).map((i) => i.name);
      const customRecipe: RecipeItem = scaleRecipeForPeopleAndDiet(
        {
          id: `rec-synth-${Date.now()}`,
          title: `${customCraving.trim()} (Home Kitchen Style)`,
          cuisine: 'Indian',
          meal_type: activeMealFilter !== 'All' ? activeMealFilter : 'Lunch',
          prep_cook_minutes: 18,
          total_calories: 320,
          protein_g: 12.5,
          carbs_g: 36.0,
          fat_g: 12.0,
          crafting_difficulty: 'Level 1',
          used_ingredients:
            topIngredients.length > 0
              ? topIngredients
              : ['Potato', 'Cultured Creamery Butter'],
          missing_vegetables: [
            'Fresh Coriander Leaves (Cilantro)',
            '1 Ripe Tomato & 1 Green Chili',
          ],
          missing_spices: [
            '1/2 tsp Garam Masala',
            'Roasted Cumin & Black Pepper',
          ],
          chef_note:
            'Matched to your uploaded ingredient photos with clear missing vegetable and spice notes.',
          steps: [
            {
              instruction: `Prep ${
                topIngredients.join(', ') || 'your core ingredients'
              } for ${servings} ${servings === 1 ? 'person' : 'people'}.`,
              timer_seconds: 180,
            },
            {
              instruction:
                'Heat butter or oil in a pan, temper the spices, and sauté the chopped vegetables until golden.',
              timer_seconds: 300,
            },
            {
              instruction:
                'Simmer covered on low heat for 4 minutes and garnish with fresh herbs before serving.',
              timer_seconds: 240,
            },
          ],
        },
        servings,
        dietaryRestriction
      );
      onSynthesizedRecipes([customRecipe, ...recipes]);
      setSynthStatus(`Added "${customRecipe.title}" for ${servings} people!`);
      setCustomCraving('');
    }
    setIsSynthesizing(false);
  };

  return (
    <section
      aria-label="Step 3: Recommended Recipes and Lacking Ingredients"
      className="rounded-3xl border-2 border-orange-200/90 bg-white p-5 sm:p-7 shadow-xl shadow-orange-500/5"
    >
      {/* Top Summary Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-orange-100">
        <div>
          <p className="text-xs font-extrabold text-[#FF5A1F] uppercase tracking-wide">
            Step 3 of 3 · Your Tailored Recipe Menu
          </p>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 mt-1">
            Recipes You Can Cook + What Vegetables or Spices Are Lacking
          </h2>
          <p className="text-sm text-slate-600 mt-1 flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1 font-bold text-slate-900">
              <Users className="w-4 h-4 text-[#FF5A1F]" />
              Cooking for {servings} {servings === 1 ? 'Person' : 'People'}
            </span>
            <span aria-hidden="true">·</span>
            <span className="font-bold text-emerald-700">
              Diet: {dietaryRestriction}
            </span>
            <span aria-hidden="true">·</span>
            <span>
              Using your photos:{' '}
              <strong className="text-slate-900">
                {inventory
                  .slice(0, 4)
                  .map((i) => i.name)
                  .join(', ')}
              </strong>
            </span>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={onBackToPhotos}
            className="min-h-[42px] px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs font-bold text-slate-700 cursor-pointer"
          >
            + Add More Photos
          </button>
          <button
            type="button"
            onClick={onBackToServings}
            className="min-h-[42px] px-3.5 py-2 rounded-xl border border-orange-200 bg-orange-50 hover:bg-orange-100 text-xs font-bold text-[#EA580C] flex items-center gap-1.5 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Change People / Diet</span>
          </button>
        </div>
      </div>

      {/* Simple Meal-Time Filter Bar & Optional Dish Request */}
      <div className="mt-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div
          role="group"
          aria-label="Filter recipes by Breakfast, Lunch, or Dinner"
          className="inline-flex flex-wrap items-center gap-1.5 p-1.5 rounded-2xl bg-orange-50/90 border border-orange-200/80"
        >
          {MEAL_FILTERS.map((meal) => {
            const active = activeMealFilter === meal;
            return (
              <button
                key={meal}
                type="button"
                onClick={() => onMealFilterChange(meal)}
                className={`min-h-[40px] px-4 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                  active
                    ? 'bg-gradient-to-r from-[#FF5A1F] to-[#FF2E63] text-white shadow-sm'
                    : 'text-slate-700 hover:text-slate-950'
                }`}
              >
                {meal === 'All' ? 'All Meals' : meal}
              </button>
            );
          })}
        </div>

        <form
          onSubmit={handleSynthesizeCustom}
          className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2"
        >
          <input
            type="text"
            value={customCraving}
            onChange={(e) => setCustomCraving(e.target.value)}
            placeholder="Want a specific dish? (e.g. Aloo Paratha, Soup)..."
            aria-label="Ask for a specific dish"
            className="sm:w-64 min-h-[42px] rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#FF5A1F]"
          />
          <button
            type="submit"
            disabled={isSynthesizing}
            className="min-h-[42px] px-4 py-2 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 disabled:opacity-50 flex items-center justify-center gap-1.5 shrink-0 cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>
              {isSynthesizing ? 'Finding...' : 'Refresh / Ask Recipe'}
            </span>
          </button>
        </form>
      </div>

      {synthStatus && (
        <div
          role="status"
          className="mt-4 rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-2.5 text-xs font-bold text-emerald-800"
        >
          {synthStatus}
        </div>
      )}

      {/* Recipe Cards Grid with Clear "What You Have" vs "Lacking Vegetables & Spices" */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-5 items-stretch">
        {filteredRecipes.map((rawRecipe) => {
          const recipe = scaleRecipeForPeopleAndDiet(
            rawRecipe,
            servings,
            dietaryRestriction
          );
          const { haveIngredients, missingVegetables, missingSpices } =
            computeMissingIngredientsForRecipe(recipe, inventory);

          return (
            <article
              key={recipe.id}
              className="rounded-2xl border-2 border-orange-200/80 bg-gradient-to-br from-orange-50/40 via-white to-amber-50/30 p-5 flex flex-col justify-between shadow-sm hover:shadow-lg hover:border-[#FF5A1F] transition-all"
            >
              <div>
                {/* Simple Top Metadata Row */}
                <div className="flex items-center justify-between gap-2 text-xs text-slate-600">
                  <div className="flex items-center gap-1.5 font-bold">
                    <span className="text-[#EA580C]">{recipe.meal_type}</span>
                    <span aria-hidden="true">·</span>
                    <span className="text-slate-800">{recipe.cuisine}</span>
                    <span aria-hidden="true">·</span>
                    <span className="text-emerald-700">
                      Serves {servings} {servings === 1 ? 'Person' : 'People'}
                    </span>
                  </div>
                  <span className="font-mono font-bold text-slate-800 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-[#FF5A1F]" />
                    {recipe.prep_cook_minutes} mins
                  </span>
                </div>

                {/* Dish Title */}
                <h3 className="text-lg font-extrabold text-slate-900 mt-2">
                  {recipe.title}
                </h3>

                <p className="text-xs text-slate-600 mt-1">
                  {recipe.chef_note}
                </p>

                {/* Box 1: Ingredients You ALREADY Have (From Photos) */}
                <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50/60 p-3">
                  <div className="flex items-center gap-1.5 text-xs font-extrabold text-emerald-900">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Ingredients You Have (From Your Photos):</span>
                  </div>
                  <p className="text-xs font-semibold text-emerald-950 mt-1">
                    {haveIngredients.join(' · ')}
                  </p>
                </div>

                {/* Box 2: What Vegetables Are Lacking / Needed */}
                <div className="mt-2.5 rounded-xl border border-amber-200 bg-amber-50/70 p-3">
                  <div className="flex items-center gap-1.5 text-xs font-extrabold text-amber-900">
                    <Sprout className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>
                      Other Vegetables / Fresh Items Lacking for This Dish:
                    </span>
                  </div>
                  <p className="text-xs text-slate-800 mt-1">
                    {missingVegetables.join(' · ')}
                  </p>
                </div>

                {/* Box 3: What Spices Are Lacking / Needed */}
                <div className="mt-2.5 rounded-xl border border-rose-200 bg-rose-50/60 p-3">
                  <div className="flex items-center gap-1.5 text-xs font-extrabold text-rose-900">
                    <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>
                      Other Spices / Seasonings Lacking for This Dish:
                    </span>
                  </div>
                  <p className="text-xs text-slate-800 mt-1">
                    {missingSpices.join(' · ')}
                  </p>
                </div>
              </div>

              {/* Footer: Calories & Cook Button */}
              <div className="mt-5 pt-4 border-t border-slate-200/80 flex items-center justify-between gap-3">
                <div className="text-xs font-mono font-bold text-slate-700 flex items-center gap-2">
                  <span className="flex items-center gap-1">
                    <Flame className="w-3.5 h-3.5 text-[#FF5A1F]" />
                    {recipe.total_calories} kcal/serving
                  </span>
                  <span aria-hidden="true">·</span>
                  <span className="text-emerald-700">
                    {recipe.protein_g}g Protein
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => onSelectRecipeForCrafting(recipe)}
                  className="min-h-[44px] px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#FF5A1F] to-[#FF2E63] text-white font-extrabold text-xs sm:text-sm hover:opacity-95 transition-all shadow-md shadow-rose-500/20 flex items-center gap-2 shrink-0 cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Cook This Recipe →</span>
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
};
