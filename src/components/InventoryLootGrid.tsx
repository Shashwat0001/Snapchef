import React, { useState } from 'react';
import {
  BookOpen,
  Flame,
  ShieldCheck,
  Sprout,
  Trash2,
  Minus,
  Plus,
  Search,
  ChevronRight,
} from 'lucide-react';
import type { InventoryItem } from '../types/snapchef';
import { roundOneDecimal } from '../utils/snapchefLogic';

interface InventoryLootGridProps {
  inventory: InventoryItem[];
  selectedItem: InventoryItem | null;
  onSelectItem: (item: InventoryItem) => void;
  onUpdateQuantity: (id: string, deltaGrams: number) => void;
  onRemoveItem: (id: string) => void;
  onNavigateToRecipes: () => void;
}

const CATEGORY_THEME: Record<
  string,
  { text: string; border: string; tint: string }
> = {
  Vegetable: {
    text: '#059669',
    border: 'border-emerald-200',
    tint: 'from-emerald-50/70 to-white',
  },
  Protein: {
    text: '#E11D48',
    border: 'border-rose-200',
    tint: 'from-rose-50/70 to-white',
  },
  Dairy: {
    text: '#0284C7',
    border: 'border-sky-200',
    tint: 'from-sky-50/70 to-white',
  },
  Grain: {
    text: '#D97706',
    border: 'border-amber-200',
    tint: 'from-amber-50/70 to-white',
  },
  Legume: {
    text: '#7C3AED',
    border: 'border-violet-200',
    tint: 'from-violet-50/70 to-white',
  },
  Spice: {
    text: '#EA580C',
    border: 'border-orange-200',
    tint: 'from-orange-50/70 to-white',
  },
  Fruit: {
    text: '#DB2777',
    border: 'border-pink-200',
    tint: 'from-pink-50/70 to-white',
  },
};

export const InventoryLootGrid: React.FC<InventoryLootGridProps> = ({
  inventory,
  selectedItem,
  onSelectItem,
  onUpdateQuantity,
  onRemoveItem,
  onNavigateToRecipes,
}) => {
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const codexPanelRef = React.useRef<HTMLElement | null>(null);

  const handleInspectClick = (item: InventoryItem) => {
    onSelectItem(item);
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      window.setTimeout(() => {
        codexPanelRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        });
      }, 60);
    }
  };

  const categories = [
    'All',
    ...Array.from(new Set(inventory.map((i) => i.category))),
  ];

  const filteredInventory = inventory.filter((item) => {
    if (categoryFilter !== 'All' && item.category !== categoryFilter) {
      return false;
    }
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      return (
        item.name.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q) ||
        item.source_details.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const activeItem =
    selectedItem || filteredInventory[0] || inventory[0] || null;

  return (
    <section
      aria-label="Inventory Loot Grid and Deep Ingredient Codex"
      className="mt-8 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start"
    >
      {/* Left 7 Columns: Interactive Inventory Loot Grid */}
      <div className="lg:col-span-7 rounded-3xl border-2 border-emerald-200/80 bg-white p-4 sm:p-6 shadow-xl shadow-emerald-500/5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-emerald-100">
          <div>
            <p className="text-xs font-semibold text-emerald-700">
              Interactive Kitchen Basket · Tap any ingredient to inspect its Nutritional Codex
            </p>
            <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 mt-0.5">
              Fresh Pantry Inventory ({filteredInventory.length} Items)
            </h2>
          </div>

          <button
            type="button"
            onClick={onNavigateToRecipes}
            className="min-h-[44px] px-4 py-2 rounded-xl bg-gradient-to-r from-[#FF5A1F] to-[#FF2E63] text-white font-bold text-xs hover:opacity-95 transition-all shadow-md shadow-rose-500/20 flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
          >
            <span>Explore Recipes</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Category Filter Buttons & Search */}
        <div className="mt-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div
            role="group"
            aria-label="Filter inventory by category"
            className="flex items-center gap-1.5 overflow-x-auto pb-1"
          >
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategoryFilter(cat)}
                className={`min-h-[38px] px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                  categoryFilter === cat
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="relative sm:w-52 shrink-0">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Filter pantry..."
              aria-label="Filter pantry items"
              className="w-full min-h-[38px] rounded-xl border border-slate-200 bg-slate-50 pl-8 pr-3 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>

        {/* Colorful Ingredient Cards Grid */}
        {filteredInventory.length === 0 ? (
          <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-8 text-center">
            <p className="text-sm font-bold text-slate-900">
              No matching ingredients in your kitchen basket.
            </p>
            <p className="text-xs text-slate-600 mt-1">
              Use The Eye scanner above or clear your search filter to inspect items.
            </p>
          </div>
        ) : (
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {filteredInventory.map((item) => {
              const isSelected = activeItem?.id === item.id;
              const theme = CATEGORY_THEME[item.category] || {
                text: '#0284C7',
                border: 'border-sky-200',
                tint: 'from-sky-50/70 to-white',
              };

              return (
                <div
                  key={item.id}
                  className={`rounded-2xl border-2 bg-gradient-to-br ${theme.tint} transition-all p-4 flex flex-col justify-between ${
                    isSelected
                      ? 'border-[#FF5A1F] shadow-lg shadow-orange-500/15'
                      : `${theme.border} hover:border-slate-300`
                  }`}
                >
                  <div>
                    {/* Quiet 1-line unboxed metadata kicker */}
                    <div className="flex items-center justify-between gap-2 text-xs text-slate-600">
                      <div className="flex items-center gap-1.5 truncate">
                        <span
                          className="font-bold"
                          style={{ color: theme.text }}
                        >
                          {item.category}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span className="font-mono font-semibold tabular-nums text-slate-900">
                          {item.quantity_g}g
                        </span>
                        {item.unit_label && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span className="truncate">{item.unit_label}</span>
                          </>
                        )}
                      </div>
                      <span className="font-mono font-semibold tabular-nums text-[11px] text-amber-700 shrink-0">
                        {item.calories_per_100g} kcal/100g
                      </span>
                    </div>

                    {/* Primary Card Button to open Codex */}
                    <button
                      type="button"
                      onClick={() => handleInspectClick(item)}
                      className="mt-2 w-full text-left group cursor-pointer focus:outline-none"
                    >
                      <h3 className="text-base font-extrabold text-slate-900 group-hover:text-[#FF5A1F] transition-colors flex items-center justify-between gap-2">
                        <span className="truncate">{item.name}</span>
                        <span className="text-xs font-bold text-[#FF5A1F] shrink-0">
                          Inspect Codex →
                        </span>
                      </h3>
                      <p className="mt-1 text-xs text-slate-600 line-clamp-2">
                        {item.source_details}
                      </p>
                    </button>
                  </div>

                  {/* Quantitative Macro Bar & Quantity Controls */}
                  <div className="mt-4 pt-3 border-t border-slate-200/80 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 text-xs font-mono font-semibold tabular-nums whitespace-nowrap">
                      <span
                        className="text-emerald-700 whitespace-nowrap"
                        title="Protein per 100g"
                      >
                        P {item.macros.protein_g}g
                      </span>
                      <span aria-hidden="true" className="text-slate-300">
                        /
                      </span>
                      <span
                        className="text-sky-700 whitespace-nowrap"
                        title="Carbs per 100g"
                      >
                        C {item.macros.carbs_g}g
                      </span>
                      <span aria-hidden="true" className="text-slate-300">
                        /
                      </span>
                      <span
                        className="text-rose-700 whitespace-nowrap"
                        title="Fat per 100g"
                      >
                        F {item.macros.fat_g}g
                      </span>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => onUpdateQuantity(item.id, -50)}
                        className="min-h-[38px] min-w-[38px] rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 flex items-center justify-center cursor-pointer"
                        aria-label={`Decrease ${item.name} quantity by 50g`}
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onUpdateQuantity(item.id, 50)}
                        className="min-h-[38px] min-w-[38px] rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 flex items-center justify-center cursor-pointer"
                        aria-label={`Increase ${item.name} quantity by 50g`}
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onRemoveItem(item.id)}
                        className="min-h-[38px] min-w-[38px] rounded-lg border border-slate-200 bg-white text-slate-500 hover:text-rose-600 hover:border-rose-200 flex items-center justify-center cursor-pointer"
                        aria-label={`Delete ${item.name} from pantry`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Right 5 Columns: Deep Ingredient Codex & Nutritional Profiler Panel */}
      <aside
        ref={codexPanelRef}
        aria-label="Deep Ingredient Codex Details"
        className="lg:col-span-5 lg:sticky lg:top-20 rounded-3xl border-2 border-violet-200 bg-gradient-to-br from-white via-violet-50/30 to-amber-50/40 p-5 sm:p-6 shadow-xl shadow-violet-500/5 scroll-mt-16"
      >
        {activeItem ? (
          <div>
            <div className="flex items-center justify-between gap-2 pb-4 border-b border-violet-200/70">
              <div className="flex items-center gap-2 text-xs text-violet-700 font-bold">
                <BookOpen className="w-4 h-4" />
                <span>Deep Ingredient Codex</span>
                <span aria-hidden="true">·</span>
                <span>{activeItem.category}</span>
              </div>
              <span className="text-xs font-mono font-bold tabular-nums text-emerald-700">
                Stock: {activeItem.quantity_g}g
              </span>
            </div>

            <div className="mt-4">
              <h3 className="text-2xl font-extrabold text-slate-900">
                {activeItem.name}
              </h3>
              <p className="text-xs text-slate-600 mt-1">
                Standard 100g Nutritional Reference · Total in Pantry:{' '}
                <span className="font-mono font-bold tabular-nums text-slate-900">
                  {Math.round(
                    (activeItem.calories_per_100g * activeItem.quantity_g) / 100
                  )}{' '}
                  kcal
                </span>
              </p>
            </div>

            {/* 1. Source Material Details */}
            <div className="mt-5 rounded-2xl border border-emerald-200 bg-white p-4 shadow-sm">
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-700">
                <Sprout className="w-4 h-4" />
                <span>Source Material & Botanical Origin</span>
              </div>
              <p className="mt-2 text-sm text-slate-700 leading-relaxed">
                {activeItem.source_details}
              </p>
            </div>

            {/* 1b. Specific Ingredient Qualities (Texture, Flavor, Cooking Behavior) */}
            {activeItem.qualities && (
              <div className="mt-4 rounded-2xl border border-teal-200 bg-white p-4 shadow-sm space-y-2.5">
                <div className="text-xs font-bold text-teal-800">
                  Specific Ingredient Qualities (Optical Profile)
                </div>
                <div className="text-xs text-slate-700">
                  <strong className="text-emerald-800">Texture & Freshness:</strong>{' '}
                  {activeItem.qualities.texture_and_freshness}
                </div>
                <div className="text-xs text-slate-700">
                  <strong className="text-amber-800">Flavor Profile:</strong>{' '}
                  {activeItem.qualities.flavor_profile}
                </div>
                <div className="text-xs text-slate-700">
                  <strong className="text-rose-800">Cooking Behavior:</strong>{' '}
                  {activeItem.qualities.cooking_behavior}
                </div>
              </div>
            )}

            {/* 2. Exact Macronutrient Breakdown per 100g */}
            <div className="mt-4 rounded-2xl border border-amber-200 bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-xs font-bold text-amber-700">
                  <Flame className="w-4 h-4 text-[#FF5A1F]" />
                  <span>Nutritional Profile (Per 100g Serving)</span>
                </div>
                <span className="text-base font-mono font-extrabold tabular-nums text-slate-900">
                  {activeItem.calories_per_100g} kcal
                </span>
              </div>

              <div className="mt-3.5 grid grid-cols-3 gap-2.5">
                <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-3">
                  <span className="text-[11px] font-semibold text-emerald-800 block">
                    Protein
                  </span>
                  <span className="text-lg font-mono font-extrabold tabular-nums text-emerald-700 mt-0.5 block">
                    {activeItem.macros.protein_g}g
                  </span>
                  <span className="text-[10px] font-mono tabular-nums text-slate-600">
                    Total:{' '}
                    {roundOneDecimal(
                      (activeItem.macros.protein_g * activeItem.quantity_g) / 100
                    )}
                    g
                  </span>
                </div>

                <div className="rounded-xl border border-sky-200 bg-sky-50/60 p-3">
                  <span className="text-[11px] font-semibold text-sky-800 block">
                    Carbohydrates
                  </span>
                  <span className="text-lg font-mono font-extrabold tabular-nums text-sky-700 mt-0.5 block">
                    {activeItem.macros.carbs_g}g
                  </span>
                  <span className="text-[10px] font-mono tabular-nums text-slate-600">
                    Total:{' '}
                    {roundOneDecimal(
                      (activeItem.macros.carbs_g * activeItem.quantity_g) / 100
                    )}
                    g
                  </span>
                </div>

                <div className="rounded-xl border border-rose-200 bg-rose-50/60 p-3">
                  <span className="text-[11px] font-semibold text-rose-800 block">
                    Lipids (Fat)
                  </span>
                  <span className="text-lg font-mono font-extrabold tabular-nums text-rose-700 mt-0.5 block">
                    {activeItem.macros.fat_g}g
                  </span>
                  <span className="text-[10px] font-mono tabular-nums text-slate-600">
                    Total:{' '}
                    {roundOneDecimal(
                      (activeItem.macros.fat_g * activeItem.quantity_g) / 100
                    )}
                    g
                  </span>
                </div>
              </div>
            </div>

            {/* 3. Health Benefits & Physiological Micronutrients */}
            <div className="mt-4 rounded-2xl border border-rose-200 bg-white p-4 shadow-sm">
              <div className="flex items-center gap-2 text-xs font-bold text-rose-700">
                <ShieldCheck className="w-4 h-4" />
                <span>Micronutrients & Physiological Benefits</span>
              </div>
              <ul className="mt-2.5 space-y-2">
                {activeItem.health_benefits.map((benefit, index) => (
                  <li
                    key={index}
                    className="text-xs sm:text-sm text-slate-700 flex items-start gap-2"
                  >
                    <span className="font-mono text-[#FF5A1F] font-bold">
                      0{index + 1}.
                    </span>
                    <span>{benefit}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ) : (
          <div className="py-12 text-center">
            <p className="text-sm text-slate-600">
              Select any ingredient in your Kitchen Basket to inspect its botanical origin, 100g macronutrients, and physiological benefits.
            </p>
          </div>
        )}
      </aside>
    </section>
  );
};
