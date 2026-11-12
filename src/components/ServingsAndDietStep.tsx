import React from 'react';
import {
  Users,
  ShieldCheck,
  Sparkles,
  ArrowLeft,
  ArrowRight,
  Check,
} from 'lucide-react';
import type {
  CapturedIngredientPhoto,
  DietaryRestriction,
  InventoryItem,
} from '../types/snapchef';

interface ServingsAndDietStepProps {
  photos: CapturedIngredientPhoto[];
  inventory: InventoryItem[];
  servings: number;
  onSelectServings: (count: number) => void;
  dietaryRestriction: DietaryRestriction;
  onSelectDiet: (diet: DietaryRestriction) => void;
  isSynthesizing: boolean;
  onGenerateRecipes: () => void;
  onBackToPhotos: () => void;
}

const PEOPLE_OPTIONS: Array<{ count: number; label: string; sub: string }> = [
  { count: 1, label: '1 Person', sub: 'Solo meal portion' },
  { count: 2, label: '2 People', sub: 'Couple / duo portion' },
  { count: 3, label: '3 People', sub: 'Small group / trio' },
  { count: 4, label: '4 People', sub: 'Standard family meal' },
  { count: 5, label: '5 People', sub: 'Large family table' },
  { count: 6, label: '6+ People', sub: 'Gathering / feast' },
];

const DIET_OPTIONS: Array<{
  value: DietaryRestriction;
  label: string;
  desc: string;
}> = [
  {
    value: 'No Restrictions',
    label: 'No Restrictions',
    desc: 'All ingredients & cuisines allowed',
  },
  {
    value: 'Vegetarian',
    label: 'Vegetarian',
    desc: 'Plant-based + dairy (butter, paneer, milk)',
  },
  {
    value: 'Vegan',
    label: 'Vegan',
    desc: '100% plant-based, no dairy or eggs',
  },
  {
    value: 'Gluten-Free',
    label: 'Gluten-Free',
    desc: 'No wheat, barley, or gluten grains',
  },
  {
    value: 'High-Protein',
    label: 'High-Protein',
    desc: 'Prioritize protein-rich combinations',
  },
  {
    value: 'Jain (No Onion/Garlic)',
    label: 'Jain (No Onion/Garlic)',
    desc: 'Prepared without onion or garlic',
  },
  {
    value: 'Low-Carb',
    label: 'Low-Carb',
    desc: 'Lighter carb portions & healthy fats',
  },
];

export const ServingsAndDietStep: React.FC<ServingsAndDietStepProps> = ({
  photos,
  inventory,
  servings,
  onSelectServings,
  dietaryRestriction,
  onSelectDiet,
  isSynthesizing,
  onGenerateRecipes,
  onBackToPhotos,
}) => {
  const ingredientNames = inventory.map((i) => i.name);

  return (
    <section
      aria-label="Step 2: Choose Servings and Dietary Restrictions"
      className="rounded-3xl border-2 border-orange-200/90 bg-white p-5 sm:p-8 shadow-xl shadow-orange-500/5"
    >
      {/* Top Summary of Compiled Ingredient Photos */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-5 border-b border-orange-100">
        <div>
          <p className="text-xs font-extrabold text-[#FF5A1F] uppercase tracking-wide">
            Step 2 of 3 · Customize Your Meal
          </p>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 mt-1">
            Who Are We Cooking For Today?
          </h2>
          <p className="text-sm text-slate-600 mt-1">
            We compiled{' '}
            <strong className="text-slate-900">
              {photos.length} ingredient{' '}
              {photos.length === 1 ? 'photo' : 'photos'}
            </strong>{' '}
            ({ingredientNames.slice(0, 5).join(', ')}). Answer two quick
            questions below so we can recommend the best recipes:
          </p>
        </div>

        <button
          type="button"
          onClick={onBackToPhotos}
          className="min-h-[42px] px-4 py-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs font-bold text-slate-700 flex items-center gap-1.5 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Photos ({photos.length})</span>
        </button>
      </div>

      {/* Question 1: How many people are we cooking for? */}
      <div className="mt-6">
        <div className="flex items-center gap-2 text-sm font-extrabold text-slate-900">
          <Users className="w-5 h-5 text-[#FF5A1F]" />
          <span>
            Question 1: How many people are you making the food for?
          </span>
        </div>
        <p className="text-xs text-slate-600 mt-1">
          Select the number of people (for example: 2, 3, or 4 people) to scale
          ingredient quantities:
        </p>

        <div
          role="group"
          aria-label="How many people are you cooking for"
          className="mt-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3"
        >
          {PEOPLE_OPTIONS.map((opt) => {
            const isSelected = servings === opt.count;
            return (
              <button
                key={opt.count}
                type="button"
                onClick={() => onSelectServings(opt.count)}
                className={`min-h-[76px] rounded-2xl border-2 p-3.5 text-left transition-all flex flex-col justify-between cursor-pointer ${
                  isSelected
                    ? 'border-[#FF5A1F] bg-orange-50/90 shadow-md shadow-orange-500/10'
                    : 'border-slate-200 bg-white hover:border-orange-300'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-base font-extrabold text-slate-900">
                    {opt.label}
                  </span>
                  {isSelected && (
                    <Check className="w-4 h-4 text-[#FF5A1F] shrink-0" />
                  )}
                </div>
                <span className="text-xs text-slate-600 mt-1">{opt.sub}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Question 2: Any dietary restrictions? */}
      <div className="mt-8 pt-6 border-t border-orange-100">
        <div className="flex items-center gap-2 text-sm font-extrabold text-slate-900">
          <ShieldCheck className="w-5 h-5 text-emerald-600" />
          <span>
            Question 2: Do you have any dietary restrictions or preferences?
          </span>
        </div>
        <p className="text-xs text-slate-600 mt-1">
          Cooking for <strong>{servings} {servings === 1 ? 'Person' : 'People'}</strong> — choose a dietary preference below:
        </p>

        <div
          role="group"
          aria-label="Dietary restrictions"
          className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3"
        >
          {DIET_OPTIONS.map((diet) => {
            const isSelected = dietaryRestriction === diet.value;
            return (
              <button
                key={diet.value}
                type="button"
                onClick={() => onSelectDiet(diet.value)}
                className={`min-h-[72px] rounded-2xl border-2 p-3.5 text-left transition-all flex flex-col justify-between cursor-pointer ${
                  isSelected
                    ? 'border-emerald-600 bg-emerald-50/80 shadow-md shadow-emerald-500/10'
                    : 'border-slate-200 bg-white hover:border-emerald-300'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-extrabold text-slate-900">
                    {diet.label}
                  </span>
                  {isSelected && (
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  )}
                </div>
                <span className="text-xs text-slate-600 mt-1">{diet.desc}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Final Action Bar: Show Recipes */}
      <div className="mt-8 pt-6 border-t border-orange-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="text-xs sm:text-sm text-slate-700">
          Ready to find recipes for{' '}
          <strong className="text-[#FF5A1F]">
            {servings} {servings === 1 ? 'Person' : 'People'}
          </strong>{' '}
          ·{' '}
          <strong className="text-emerald-700">{dietaryRestriction}</strong>{' '}
          (including any lacking vegetables or spices).
        </div>

        <button
          type="button"
          onClick={onGenerateRecipes}
          disabled={isSynthesizing}
          className="min-h-[52px] px-7 py-3 rounded-2xl bg-gradient-to-r from-[#FF5A1F] via-[#FF2E63] to-[#F59E0B] text-white font-extrabold text-sm sm:text-base hover:opacity-95 active:scale-[0.99] disabled:opacity-60 transition-all shadow-lg shadow-orange-500/25 flex items-center justify-center gap-2.5 cursor-pointer shrink-0"
        >
          <Sparkles className="w-5 h-5" />
          <span>
            {isSynthesizing
              ? 'Preparing Your Recipes...'
              : `Show Recipes for ${servings} ${
                  servings === 1 ? 'Person' : 'People'
                }`}
          </span>
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    </section>
  );
};
