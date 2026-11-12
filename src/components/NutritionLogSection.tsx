import React from 'react';
import { Award, Flame, RotateCcw, Utensils, Scale } from 'lucide-react';
import type { CraftedMealLog, InventoryItem } from '../types/snapchef';
import { calculatePantryTotals } from '../utils/snapchefLogic';
import { PWAInstallModalTrigger } from './PWAInstallButton';

interface NutritionLogSectionProps {
  inventory: InventoryItem[];
  craftedHistory: CraftedMealLog[];
  onResetDemoData: () => void;
}

export const NutritionLogSection: React.FC<NutritionLogSectionProps> = ({
  inventory,
  craftedHistory,
  onResetDemoData,
}) => {
  const pantryTotals = calculatePantryTotals(inventory);

  const sessionCalories = craftedHistory.reduce(
    (sum, m) => sum + m.calories,
    0
  );
  const sessionProtein = craftedHistory.reduce(
    (sum, m) => sum + m.protein_g,
    0
  );

  return (
    <section
      aria-label="Macro Telemetry and Session Crafting Log"
      className="mt-8 space-y-6"
    >
      {/* Top 4-Column Quantitative Summary Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border-2 border-teal-200 bg-gradient-to-br from-teal-50/70 to-white p-4 sm:p-5 shadow-sm">
          <span className="text-xs font-bold text-teal-800 flex items-center gap-1.5">
            <Scale className="w-3.5 h-3.5 text-teal-600" />
            <span>Pantry Stock Mass</span>
          </span>
          <span className="text-2xl font-mono font-extrabold tabular-nums text-slate-900 mt-1.5 block">
            {pantryTotals.totalWeightG}g
          </span>
          <span className="text-xs text-slate-600 mt-0.5 block">
            Across {pantryTotals.totalItems} cataloged items
          </span>
        </div>

        <div className="rounded-2xl border-2 border-amber-200 bg-gradient-to-br from-amber-50/70 to-white p-4 sm:p-5 shadow-sm">
          <span className="text-xs font-bold text-amber-800 flex items-center gap-1.5">
            <Flame className="w-3.5 h-3.5 text-[#FF5A1F]" />
            <span>Available Pantry Energy</span>
          </span>
          <span className="text-2xl font-mono font-extrabold tabular-nums text-slate-900 mt-1.5 block">
            {pantryTotals.totalCalories} kcal
          </span>
          <span className="text-xs font-mono font-bold tabular-nums text-emerald-700 mt-0.5 block">
            {pantryTotals.totalProteinG}g Total Protein
          </span>
        </div>

        <div className="rounded-2xl border-2 border-emerald-200 bg-gradient-to-br from-emerald-50/70 to-white p-4 sm:p-5 shadow-sm">
          <span className="text-xs font-bold text-emerald-800 flex items-center gap-1.5">
            <Award className="w-3.5 h-3.5 text-emerald-600" />
            <span>Meals Crafted Today</span>
          </span>
          <span className="text-2xl font-mono font-extrabold tabular-nums text-emerald-700 mt-1.5 block">
            {craftedHistory.length}{' '}
            {craftedHistory.length === 1 ? 'Dish' : 'Dishes'}
          </span>
          <span className="text-xs font-mono tabular-nums text-slate-600 mt-0.5 block">
            {sessionCalories} kcal · {Math.round(sessionProtein * 10) / 10}g Protein
          </span>
        </div>

        <div className="rounded-2xl border-2 border-violet-200 bg-gradient-to-br from-violet-50/70 to-white p-4 sm:p-5 flex flex-col justify-between shadow-sm">
          <div>
            <span className="text-xs font-bold text-violet-800 block">
              Pantry State Persistence
            </span>
            <span className="text-sm font-extrabold text-slate-900 mt-1 block">
              Synced to LocalStorage
            </span>
          </div>
          <button
            type="button"
            onClick={onResetDemoData}
            className="mt-3 min-h-[40px] px-3 py-1.5 rounded-xl border border-violet-300 bg-white hover:bg-violet-50 text-xs font-bold text-violet-800 flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5 text-violet-600" />
            <span>Restore Default Kitchen Stock</span>
          </button>
        </div>
      </div>

      {/* Crafted Meals Session History */}
      <div className="rounded-3xl border-2 border-orange-200/80 bg-white p-4 sm:p-6 shadow-md">
        <div className="flex items-center justify-between gap-2 pb-4 border-b border-orange-100">
          <div>
            <h3 className="text-lg font-extrabold text-slate-900">
              Crafted Meal History & Consumed Macros
            </h3>
            <p className="text-xs text-slate-600 mt-0.5">
              Every completed dish automatically updates your virtual pantry inventory.
            </p>
          </div>
        </div>

        {craftedHistory.length === 0 ? (
          <div className="mt-4 rounded-2xl border border-orange-200/60 bg-orange-50/40 p-6 text-center">
            <Utensils className="w-6 h-6 text-[#FF5A1F] mx-auto mb-2" />
            <p className="text-sm font-bold text-slate-900">
              No meals crafted in this session yet.
            </p>
            <p className="text-xs text-slate-600 mt-1">
              Select any dish in the Recipe Synthesizer and complete it in Crafting Mode to track your macros.
            </p>
          </div>
        ) : (
          <div className="mt-4 space-y-3">
            {craftedHistory.map((log) => (
              <div
                key={log.id}
                className="rounded-2xl border border-emerald-200 bg-emerald-50/40 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div>
                  <div className="flex items-center gap-2 text-xs text-slate-600">
                    <span className="text-[#FF5A1F] font-extrabold">
                      {log.cuisine}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span className="font-semibold text-slate-800">
                      {log.meal_type}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span className="font-mono tabular-nums">
                      {log.completedAt}
                    </span>
                  </div>
                  <h4 className="text-base font-extrabold text-slate-900 mt-1">
                    {log.title}
                  </h4>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Deducted from pantry: {log.consumedIngredients.join(', ')}
                  </p>
                </div>

                <div className="flex items-center gap-4 font-mono text-xs font-bold tabular-nums shrink-0">
                  <span className="text-slate-900">
                    {log.calories} kcal
                  </span>
                  <span className="text-emerald-700">
                    P {log.protein_g}g
                  </span>
                  <span className="text-sky-700">C {log.carbs_g}g</span>
                  <span className="text-rose-700">F {log.fat_g}g</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Mobile & Desktop PWA Install Banner */}
      <PWAInstallModalTrigger variant="banner" />
    </section>
  );
};
