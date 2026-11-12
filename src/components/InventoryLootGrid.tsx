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

const CATEGORY_ACCENT_COLOR: Record<string, string> = {
  Vegetable: '#B8FF01',
  Protein: '#FF2A85',
  Dairy: '#00F0FF',
  Grain: '#F59E0B',
  Legume: '#00F0FF',
  Spice: '#FF2A85',
  Fruit: '#B8FF01',
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

  const activeItem = selectedItem || filteredInventory[0] || inventory[0] || null;

  return (
    <section
      aria-label="Inventory Loot Grid and Deep Ingredient Codex"
      className="mt-8 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start"
    >
      {/* Left 7 Columns: Interactive Inventory Loot Grid */}
      <div className="lg:col-span-7 rounded-2xl border border-white/10 bg-[#141619] p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-white/10">
          <div>
            <p className="text-xs text-[#94A3B8]">
              Interactive Inventory Grid · Tap any item to inspect its Deep Nutritional Codex
            </p>
            <h2 className="text-lg sm:text-xl font-bold text-[#F2F5F8] mt-0.5">
              Virtual Pantry Loot ({filteredInventory.length} Items)
            </h2>
          </div>

          <button
            type="button"
            onClick={onNavigateToRecipes}
            className="min-h-[44px] px-4 py-2 rounded-xl bg-[#00F0FF] text-[#0D0D0D] font-semibold text-xs hover:bg-[#00F0FF]/90 transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
          >
            <span>Synthesize Dishes</span>
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
                className={`min-h-[38px] px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  categoryFilter === cat
                    ? 'bg-[#00F0FF] text-[#0D0D0D] font-semibold'
                    : 'bg-[#0D0D0D] text-[#94A3B8] hover:text-white border border-white/10'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="relative sm:w-52 shrink-0">
            <Search className="w-3.5 h-3.5 text-[#94A3B8] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Filter pantry..."
              aria-label="Filter pantry items"
              className="w-full min-h-[38px] rounded-xl border border-white/10 bg-[#0D0D0D] pl-8 pr-3 py-1.5 text-xs text-[#F2F5F8] placeholder-[#64748B] focus:outline-none focus:border-[#00F0FF]"
            />
          </div>
        </div>

        {/* RPG-Style Item Cards Grid */}
        {filteredInventory.length === 0 ? (
          <div className="mt-6 rounded-xl border border-white/10 bg-[#0D0D0D] p-8 text-center">
            <p className="text-sm font-medium text-[#F2F5F8]">
              No matching ingredients in your virtual pantry.
            </p>
            <p className="text-xs text-[#94A3B8] mt-1">
              Use The Eye scanner above or clear your search filter to inspect items.
            </p>
          </div>
        ) : (
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {filteredInventory.map((item) => {
              const isSelected = activeItem?.id === item.id;
              const accent =
                CATEGORY_ACCENT_COLOR[item.category] || '#00F0FF';

              return (
                <div
                  key={item.id}
                  className={`rounded-2xl border transition-all p-4 flex flex-col justify-between ${
                    isSelected
                      ? 'border-[#00F0FF] bg-[#0D0D0D] shadow-[0_0_20px_rgba(0,240,255,0.12)]'
                      : 'border-white/10 bg-[#0D0D0D]/80 hover:border-white/25'
                  }`}
                >
                  <div>
                    {/* Quiet 1-line unboxed metadata kicker */}
                    <div className="flex items-center justify-between gap-2 text-xs text-[#94A3B8]">
                      <div className="flex items-center gap-1.5 truncate">
                        <span
                          className="font-medium"
                          style={{ color: accent }}
                        >
                          {item.category}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span className="font-mono tabular-nums text-[#F2F5F8]">
                          {item.quantity_g}g
                        </span>
                        {item.unit_label && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span className="truncate">{item.unit_label}</span>
                          </>
                        )}
                      </div>
                      <span className="font-mono tabular-nums text-[11px] text-[#94A3B8] shrink-0">
                        {item.calories_per_100g} kcal/100g
                      </span>
                    </div>

                    {/* Primary Card Button to open Codex */}
                    <button
                      type="button"
                      onClick={() => handleInspectClick(item)}
                      className="mt-2 w-full text-left group cursor-pointer focus:outline-none"
                    >
                      <h3 className="text-base font-bold text-[#F2F5F8] group-hover:text-[#00F0FF] transition-colors flex items-center justify-between gap-2">
                        <span className="truncate">{item.name}</span>
                        <span className="text-xs font-normal text-[#00F0FF] shrink-0">
                          Inspect Codex →
                        </span>
                      </h3>
                      <p className="mt-1 text-xs text-[#94A3B8] line-clamp-2">
                        {item.source_details}
                      </p>
                    </button>
                  </div>

                  {/* Quantitative Macro Bar & Quantity Controls */}
                  <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 text-xs font-mono tabular-nums whitespace-nowrap">
                      <span className="text-[#B8FF01] whitespace-nowrap" title="Protein per 100g">
                        P {item.macros.protein_g}g
                      </span>
                      <span aria-hidden="true" className="text-white/20">
                        /
                      </span>
                      <span className="text-[#00F0FF] whitespace-nowrap" title="Carbs per 100g">
                        C {item.macros.carbs_g}g
                      </span>
                      <span aria-hidden="true" className="text-white/20">
                        /
                      </span>
                      <span className="text-[#FF2A85] whitespace-nowrap" title="Fat per 100g">
                        F {item.macros.fat_g}g
                      </span>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => onUpdateQuantity(item.id, -50)}
                        className="min-h-[38px] min-w-[38px] rounded-lg border border-white/10 bg-[#141619] text-[#94A3B8] hover:text-white flex items-center justify-center cursor-pointer"
                        aria-label={`Decrease ${item.name} quantity by 50g`}
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onUpdateQuantity(item.id, 50)}
                        className="min-h-[38px] min-w-[38px] rounded-lg border border-white/10 bg-[#141619] text-[#94A3B8] hover:text-white flex items-center justify-center cursor-pointer"
                        aria-label={`Increase ${item.name} quantity by 50g`}
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onRemoveItem(item.id)}
                        className="min-h-[38px] min-w-[38px] rounded-lg border border-white/10 bg-[#141619] text-[#94A3B8] hover:text-[#FF2A85] flex items-center justify-center cursor-pointer"
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
        className="lg:col-span-5 lg:sticky lg:top-20 rounded-2xl border border-[#00F0FF]/35 bg-[#141619] p-5 sm:p-6 shadow-2xl scroll-mt-16"
      >
        {activeItem ? (
          <div>
            <div className="flex items-center justify-between gap-2 pb-4 border-b border-white/10">
              <div className="flex items-center gap-2 text-xs text-[#00F0FF] font-medium">
                <BookOpen className="w-4 h-4" />
                <span>Deep Ingredient Codex</span>
                <span aria-hidden="true">·</span>
                <span>{activeItem.category}</span>
              </div>
              <span className="text-xs font-mono tabular-nums text-[#B8FF01]">
                Stock: {activeItem.quantity_g}g
              </span>
            </div>

            <div className="mt-4">
              <h3 className="text-2xl font-bold text-[#F2F5F8]">
                {activeItem.name}
              </h3>
              <p className="text-xs text-[#94A3B8] mt-1">
                Standard 100g Nutritional Reference · Total in Pantry:{' '}
                <span className="font-mono tabular-nums text-[#F2F5F8]">
                  {Math.round(
                    (activeItem.calories_per_100g * activeItem.quantity_g) / 100
                  )}{' '}
                  kcal
                </span>
              </p>
            </div>

            {/* 1. Source Material Details */}
            <div className="mt-5 rounded-xl border border-white/10 bg-[#0D0D0D] p-4">
              <div className="flex items-center gap-2 text-xs font-semibold text-[#00F0FF]">
                <Sprout className="w-4 h-4" />
                <span>Source Material & Botanical Origin</span>
              </div>
              <p className="mt-2 text-sm text-[#CBD5E1] leading-relaxed">
                {activeItem.source_details}
              </p>
            </div>

            {/* 2. Exact Macronutrient Breakdown per 100g */}
            <div className="mt-4 rounded-xl border border-white/10 bg-[#0D0D0D] p-4">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-xs font-semibold text-[#B8FF01]">
                  <Flame className="w-4 h-4" />
                  <span>Nutritional Profile (Per 100g Serving)</span>
                </div>
                <span className="text-base font-mono font-bold tabular-nums text-[#F2F5F8]">
                  {activeItem.calories_per_100g} kcal
                </span>
              </div>

              <div className="mt-3.5 grid grid-cols-3 gap-2.5">
                <div className="rounded-lg border border-white/10 bg-[#141619] p-3">
                  <span className="text-[11px] text-[#94A3B8] block">
                    Protein
                  </span>
                  <span className="text-lg font-mono font-bold tabular-nums text-[#B8FF01] mt-0.5 block">
                    {activeItem.macros.protein_g}g
                  </span>
                  <span className="text-[10px] font-mono tabular-nums text-[#94A3B8]">
                    Total:{' '}
                    {roundOneDecimal(
                      (activeItem.macros.protein_g * activeItem.quantity_g) / 100
                    )}
                    g
                  </span>
                </div>

                <div className="rounded-lg border border-white/10 bg-[#141619] p-3">
                  <span className="text-[11px] text-[#94A3B8] block">
                    Carbohydrates
                  </span>
                  <span className="text-lg font-mono font-bold tabular-nums text-[#00F0FF] mt-0.5 block">
                    {activeItem.macros.carbs_g}g
                  </span>
                  <span className="text-[10px] font-mono tabular-nums text-[#94A3B8]">
                    Total:{' '}
                    {roundOneDecimal(
                      (activeItem.macros.carbs_g * activeItem.quantity_g) / 100
                    )}
                    g
                  </span>
                </div>

                <div className="rounded-lg border border-white/10 bg-[#141619] p-3">
                  <span className="text-[11px] text-[#94A3B8] block">
                    Lipids (Fat)
                  </span>
                  <span className="text-lg font-mono font-bold tabular-nums text-[#FF2A85] mt-0.5 block">
                    {activeItem.macros.fat_g}g
                  </span>
                  <span className="text-[10px] font-mono tabular-nums text-[#94A3B8]">
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
            <div className="mt-4 rounded-xl border border-white/10 bg-[#0D0D0D] p-4">
              <div className="flex items-center gap-2 text-xs font-semibold text-[#FF2A85]">
                <ShieldCheck className="w-4 h-4" />
                <span>Micronutrients & Physiological Benefits</span>
              </div>
              <ul className="mt-2.5 space-y-2">
                {activeItem.health_benefits.map((benefit, index) => (
                  <li
                    key={index}
                    className="text-xs sm:text-sm text-[#CBD5E1] flex items-start gap-2"
                  >
                    <span className="font-mono text-[#00F0FF] font-semibold">
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
            <p className="text-sm text-[#94A3B8]">
              Select any ingredient in your Inventory Loot Grid to inspect its botanical origin, 100g macronutrients, and physiological benefits.
            </p>
          </div>
        )}
      </aside>
    </section>
  );
};
