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
        <div className="rounded-2xl border border-white/10 bg-[#141619] p-4 sm:p-5">
          <span className="text-xs text-[#94A3B8] flex items-center gap-1.5">
            <Scale className="w-3.5 h-3.5 text-[#00F0FF]" />
            <span>Pantry Stock Mass</span>
          </span>
          <span className="text-2xl font-mono font-bold tabular-nums text-[#F2F5F8] mt-1.5 block">
            {pantryTotals.totalWeightG}g
          </span>
          <span className="text-xs text-[#94A3B8] mt-0.5 block">
            Across {pantryTotals.totalItems} cataloged items
          </span>
        </div>

        <div className="rounded-2xl border border-white/10 bg-[#141619] p-4 sm:p-5">
          <span className="text-xs text-[#94A3B8] flex items-center gap-1.5">
            <Flame className="w-3.5 h-3.5 text-[#FF2A85]" />
            <span>Available Pantry Energy</span>
          </span>
          <span className="text-2xl font-mono font-bold tabular-nums text-[#F2F5F8] mt-1.5 block">
            {pantryTotals.totalCalories} kcal
          </span>
          <span className="text-xs font-mono tabular-nums text-[#B8FF01] mt-0.5 block">
            {pantryTotals.totalProteinG}g Total Protein
          </span>
        </div>

        <div className="rounded-2xl border border-white/10 bg-[#141619] p-4 sm:p-5">
          <span className="text-xs text-[#94A3B8] flex items-center gap-1.5">
            <Award className="w-3.5 h-3.5 text-[#B8FF01]" />
            <span>Meals Crafted Today</span>
          </span>
          <span className="text-2xl font-mono font-bold tabular-nums text-[#B8FF01] mt-1.5 block">
            {craftedHistory.length}{' '}
            {craftedHistory.length === 1 ? 'Dish' : 'Dishes'}
          </span>
          <span className="text-xs font-mono tabular-nums text-[#94A3B8] mt-0.5 block">
            {sessionCalories} kcal · {Math.round(sessionProtein * 10) / 10}g Protein
          </span>
        </div>

        <div className="rounded-2xl border border-white/10 bg-[#141619] p-4 sm:p-5 flex flex-col justify-between">
          <div>
            <span className="text-xs text-[#94A3B8] block">
              Pantry State Persistence
            </span>
            <span className="text-sm font-semibold text-[#F2F5F8] mt-1 block">
              Synced to LocalStorage
            </span>
          </div>
          <button
            type="button"
            onClick={onResetDemoData}
            className="mt-3 min-h-[40px] px-3 py-1.5 rounded-xl border border-white/15 bg-[#0D0D0D] hover:border-[#00F0FF] text-xs font-medium text-[#F2F5F8] flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5 text-[#00F0FF]" />
            <span>Restore Default Kitchen Stock</span>
          </button>
        </div>
      </div>

      {/* Crafted Meals Session History */}
      <div className="rounded-2xl border border-white/10 bg-[#141619] p-4 sm:p-6">
        <div className="flex items-center justify-between gap-2 pb-4 border-b border-white/10">
          <div>
            <h3 className="text-lg font-bold text-[#F2F5F8]">
              Crafted Meal History & Consumed Macros
            </h3>
            <p className="text-xs text-[#94A3B8] mt-0.5">
              Every completed dish automatically updates your virtual pantry inventory.
            </p>
          </div>
        </div>

        {craftedHistory.length === 0 ? (
          <div className="mt-4 rounded-xl border border-white/10 bg-[#0D0D0D] p-6 text-center">
            <Utensils className="w-6 h-6 text-[#00F0FF] mx-auto mb-2" />
            <p className="text-sm font-medium text-[#F2F5F8]">
              No meals crafted in this session yet.
            </p>
            <p className="text-xs text-[#94A3B8] mt-1">
              Select any dish in the Recipe Synthesizer and complete it in Crafting Mode to track your macros.
            </p>
          </div>
        ) : (
          <div className="mt-4 space-y-3">
            {craftedHistory.map((log) => (
              <div
                key={log.id}
                className="rounded-xl border border-white/10 bg-[#0D0D0D] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div>
                  <div className="flex items-center gap-2 text-xs text-[#94A3B8]">
                    <span className="text-[#00F0FF] font-semibold">
                      {log.cuisine}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span>{log.meal_type}</span>
                    <span aria-hidden="true">·</span>
                    <span className="font-mono tabular-nums">
                      {log.completedAt}
                    </span>
                  </div>
                  <h4 className="text-base font-bold text-[#F2F5F8] mt-1">
                    {log.title}
                  </h4>
                  <p className="text-xs text-[#94A3B8] mt-0.5">
                    Deducted from pantry: {log.consumedIngredients.join(', ')}
                  </p>
                </div>

                <div className="flex items-center gap-4 font-mono text-xs tabular-nums shrink-0">
                  <span className="text-[#F2F5F8] font-bold">
                    {log.calories} kcal
                  </span>
                  <span className="text-[#B8FF01] font-semibold">
                    P {log.protein_g}g
                  </span>
                  <span className="text-[#00F0FF]">C {log.carbs_g}g</span>
                  <span className="text-[#FF2A85]">F {log.fat_g}g</span>
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
