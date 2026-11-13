import React, { useEffect, useState, useCallback } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Volume2,
  VolumeX,
  Clock,
  Flame,
  Layers,
  ListOrdered,
  Sparkles,
} from 'lucide-react';
import type { RecipeItem } from '../types/snapchef';
import { formatTimerMMSS } from '../utils/snapchefLogic';

interface CraftingModeHUDProps {
  recipe: RecipeItem;
  onCompleteCrafting: (recipe: RecipeItem) => void;
  onBackToRecipes: () => void;
}

function playTimerAlertChime() {
  try {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const frequencies = [587.33, 880, 1174.66];
    frequencies.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.12);
      gain.gain.setValueAtTime(0.15, ctx.currentTime + idx * 0.12);
      gain.gain.exponentialRampToValueAtTime(
        0.001,
        ctx.currentTime + idx * 0.12 + 0.45
      );
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime + idx * 0.12);
      osc.stop(ctx.currentTime + idx * 0.12 + 0.45);
    });
  } catch {
    // Ignore audio context restrictions if muted
  }
}

export const CraftingModeHUD: React.FC<CraftingModeHUDProps> = ({
  recipe,
  onCompleteCrafting,
  onBackToRecipes,
}) => {
  const [activeStepIndex, setActiveStepIndex] = useState<number>(0);
  const [completedSteps, setCompletedSteps] = useState<Record<number, boolean>>(
    {}
  );
  const [viewMode, setViewMode] = useState<'flashcard' | 'timeline'>(
    'flashcard'
  );
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [dishCompletedBanner, setDishCompletedBanner] =
    useState<boolean>(false);

  const [timersRemaining, setTimersRemaining] = useState<Record<number, number>>(
    () => {
      const initial: Record<number, number> = {};
      recipe.steps.forEach((step, idx) => {
        initial[idx] = step.timer_seconds || 0;
      });
      return initial;
    }
  );
  const [timersRunning, setTimersRunning] = useState<Record<number, boolean>>(
    {}
  );

  useEffect(() => {
    setActiveStepIndex(0);
    setCompletedSteps({});
    setDishCompletedBanner(false);
    const nextTimers: Record<number, number> = {};
    recipe.steps.forEach((step, idx) => {
      nextTimers[idx] = step.timer_seconds || 0;
    });
    setTimersRemaining(nextTimers);
    setTimersRunning({});
  }, [recipe]);

  useEffect(() => {
    const anyRunning = Object.values(timersRunning).some(Boolean);
    if (!anyRunning) return;

    const interval = window.setInterval(() => {
      setTimersRemaining((prev) => {
        const next = { ...prev };
        let finishedAny = false;

        for (const key of Object.keys(timersRunning)) {
          const idx = Number(key);
          if (timersRunning[idx]) {
            if (next[idx] > 1) {
              next[idx] = next[idx] - 1;
            } else if (next[idx] === 1) {
              next[idx] = 0;
              finishedAny = true;
              setTimersRunning((r) => ({ ...r, [idx]: false }));
              setCompletedSteps((c) => ({ ...c, [idx]: true }));
            }
          }
        }

        if (finishedAny && soundEnabled) {
          playTimerAlertChime();
        }
        return next;
      });
    }, 1000);

    return () => window.clearInterval(interval);
  }, [timersRunning, soundEnabled]);

  const toggleStepTimer = useCallback((stepIdx: number) => {
    setTimersRunning((prev) => ({
      ...prev,
      [stepIdx]: !prev[stepIdx],
    }));
  }, []);

  const resetStepTimer = useCallback(
    (stepIdx: number) => {
      setTimersRunning((prev) => ({ ...prev, [stepIdx]: false }));
      setTimersRemaining((prev) => ({
        ...prev,
        [stepIdx]: recipe.steps[stepIdx]?.timer_seconds || 0,
      }));
    },
    [recipe.steps]
  );

  const adjustStepTimer = useCallback((stepIdx: number, deltaSecs: number) => {
    setTimersRemaining((prev) => ({
      ...prev,
      [stepIdx]: Math.max(0, (prev[stepIdx] || 0) + deltaSecs),
    }));
  }, []);

  const toggleStepCompleted = (stepIdx: number) => {
    setCompletedSteps((prev) => ({
      ...prev,
      [stepIdx]: !prev[stepIdx],
    }));
  };

  const handleFinishDish = () => {
    setDishCompletedBanner(true);
    if (soundEnabled) {
      playTimerAlertChime();
    }
    onCompleteCrafting(recipe);
  };

  const totalSteps = recipe.steps.length;
  const completedCount = Object.values(completedSteps).filter(Boolean).length;
  const progressPercent = Math.round(
    (Math.max(completedCount, activeStepIndex + 1) / Math.max(1, totalSteps)) *
      100
  );

  const currentStep = recipe.steps[activeStepIndex] || recipe.steps[0];
  const currentTimerVal = timersRemaining[activeStepIndex] ?? 0;
  const isCurrentTimerRunning = !!timersRunning[activeStepIndex];

  return (
    <section
      aria-label="Interactive Crafting Mode Cook View"
      className="mt-8 rounded-3xl border-2 border-rose-200 bg-gradient-to-br from-white via-orange-50/40 to-rose-50/40 p-4 sm:p-6 shadow-xl shadow-rose-500/5"
    >
      {/* Top Bar: Back Button + Recipe Meta + View Mode Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-rose-200/70">
        <button
          type="button"
          onClick={onBackToRecipes}
          className="min-h-[44px] px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-800 hover:border-[#FF5A1F] transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm"
        >
          <ChevronLeft className="w-4 h-4 text-[#FF5A1F]" />
          <span>Back to Recipes</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setSoundEnabled((s) => !s)}
            className="min-h-[44px] px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:text-slate-950 flex items-center gap-1.5 cursor-pointer shadow-sm"
            aria-label={
              soundEnabled ? 'Mute timer audio alert' : 'Unmute timer audio alert'
            }
          >
            {soundEnabled ? (
              <Volume2 className="w-4 h-4 text-emerald-600" />
            ) : (
              <VolumeX className="w-4 h-4 text-slate-400" />
            )}
            <span className="hidden sm:inline">
              {soundEnabled ? 'Timer Chime On' : 'Muted'}
            </span>
          </button>

          <div
            role="group"
            aria-label="Cooking instruction layout mode"
            className="flex items-center gap-1 p-1 rounded-xl bg-white border border-slate-200 shadow-sm"
          >
            <button
              type="button"
              onClick={() => setViewMode('flashcard')}
              className={`min-h-[38px] px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                viewMode === 'flashcard'
                  ? 'bg-gradient-to-r from-[#FF5A1F] to-[#FF2E63] text-white'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Flashcards</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('timeline')}
              className={`min-h-[38px] px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                viewMode === 'timeline'
                  ? 'bg-gradient-to-r from-[#FF5A1F] to-[#FF2E63] text-white'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ListOrdered className="w-3.5 h-3.5" />
              <span>Timeline</span>
            </button>
          </div>
        </div>
      </div>

      {/* Dish Title & Quantitative Summary Bar */}
      <div className="mt-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-600">
            <span className="text-[#FF5A1F] font-extrabold">
              {recipe.cuisine}
            </span>
            <span aria-hidden="true">·</span>
            <span className="font-semibold text-slate-800">{recipe.meal_type}</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono font-bold tabular-nums text-violet-700">
              {recipe.crafting_difficulty} Craft
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
            {recipe.title}
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-4 rounded-2xl border border-orange-200 bg-white px-4 py-3 text-xs font-mono font-bold tabular-nums shadow-sm">
          <div className="flex items-center gap-1.5 text-slate-800">
            <Clock className="w-4 h-4 text-[#FF5A1F]" />
            <span>{recipe.prep_cook_minutes} min</span>
          </div>
          <span aria-hidden="true" className="text-slate-300">
            ·
          </span>
          <div className="flex items-center gap-1.5 text-slate-800">
            <Flame className="w-4 h-4 text-rose-600" />
            <span>{recipe.total_calories} kcal</span>
          </div>
          <span aria-hidden="true" className="text-slate-300">
            ·
          </span>
          <span className="text-emerald-700">
            Protein: {recipe.protein_g}g
          </span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mt-5">
        <div className="flex items-center justify-between text-xs font-mono font-semibold tabular-nums text-slate-600 mb-1.5">
          <span>
            Step {activeStepIndex + 1} of {totalSteps}
          </span>
          <span className="text-[#FF5A1F]">{progressPercent}% Cooking Progress</span>
        </div>
        <div className="w-full h-2.5 rounded-full bg-orange-100 overflow-hidden border border-orange-200">
          <div
            className="h-full bg-gradient-to-r from-[#FF5A1F] via-[#F59E0B] to-emerald-500 transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Mode 1: Focused Step-by-Step Flashcard HUD */}
      {viewMode === 'flashcard' ? (
        <div className="mt-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          {/* Active Flashcard */}
          <div className="lg:col-span-8 rounded-2xl border-2 border-orange-200 bg-white p-5 sm:p-7 flex flex-col justify-between shadow-sm">
            <div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-mono font-extrabold text-[#FF5A1F]">
                  0{activeStepIndex + 1}. ACTIVE COOKING STEP
                </span>
                <button
                  type="button"
                  onClick={() => toggleStepCompleted(activeStepIndex)}
                  className={`min-h-[38px] px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 border transition-colors cursor-pointer ${
                    completedSteps[activeStepIndex]
                      ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                      : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>
                    {completedSteps[activeStepIndex]
                      ? 'Step Completed'
                      : 'Mark Step Done'}
                  </span>
                </button>
              </div>

              <p className="mt-4 text-lg sm:text-xl font-semibold text-slate-900 leading-relaxed">
                {currentStep.instruction}
              </p>

              {currentStep.tip && (
                <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50/70 p-3.5 text-xs sm:text-sm text-slate-800">
                  <strong className="text-[#EA580C]">Chef Pro-Tip: </strong>
                  {currentStep.tip}
                </div>
              )}
            </div>

            {/* Step Navigation Buttons */}
            <div className="mt-6 pt-4 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
              <button
                type="button"
                disabled={activeStepIndex === 0}
                onClick={() =>
                  setActiveStepIndex((prev) => Math.max(0, prev - 1))
                }
                className="min-h-[42px] px-4 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold text-slate-800 hover:bg-slate-100 disabled:opacity-40 transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4 shrink-0" />
                <span>Previous Step</span>
              </button>

              <div className="flex flex-wrap items-center gap-1.5">
                {recipe.steps.map((_, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setActiveStepIndex(idx)}
                    aria-label={`Jump to step ${idx + 1}`}
                    className={`w-8 h-8 rounded-lg font-mono text-xs font-bold transition-all cursor-pointer ${
                      idx === activeStepIndex
                        ? 'bg-[#FF5A1F] text-white shadow-sm'
                        : completedSteps[idx]
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        : 'bg-slate-100 text-slate-700 border border-slate-200'
                    }`}
                  >
                    {idx + 1}
                  </button>
                ))}
              </div>

              {activeStepIndex < totalSteps - 1 ? (
                <button
                  type="button"
                  onClick={() => {
                    setCompletedSteps((prev) => ({
                      ...prev,
                      [activeStepIndex]: true,
                    }));
                    setActiveStepIndex((prev) =>
                      Math.min(totalSteps - 1, prev + 1)
                    );
                  }}
                  className="min-h-[42px] px-4 py-2 rounded-xl bg-gradient-to-r from-[#FF5A1F] to-[#FF2E63] text-white font-bold text-xs hover:opacity-95 transition-all flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <span>Next Step</span>
                  <ChevronRight className="w-4 h-4 shrink-0" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleFinishDish}
                  className="min-h-[42px] px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold text-xs sm:text-sm hover:opacity-95 transition-all flex items-center gap-2 whitespace-nowrap shrink-0 cursor-pointer shadow-md shadow-emerald-500/20"
                >
                  <Sparkles className="w-4 h-4 shrink-0" />
                  <span>Complete Dish &amp; Update Pantry</span>
                </button>
              )}
            </div>
          </div>

          {/* Integrated Countdown Timer Module */}
          <div className="lg:col-span-4 rounded-2xl border-2 border-teal-200 bg-white p-5 flex flex-col justify-between shadow-sm">
            <div>
              <span className="text-xs font-mono font-bold text-teal-700 block">
                INTEGRATED STEP TIMER
              </span>
              <div className="mt-3 rounded-2xl border-2 border-teal-200 bg-gradient-to-br from-teal-50/70 to-emerald-50/50 p-5 text-center">
                <span
                  data-testid="active-step-timer-display"
                  className={`text-4xl sm:text-5xl font-mono font-extrabold tabular-nums tracking-tight ${
                    isCurrentTimerRunning
                      ? 'text-[#FF5A1F]'
                      : currentTimerVal === 0 && currentStep.timer_seconds > 0
                      ? 'text-emerald-600'
                      : 'text-slate-900'
                  }`}
                >
                  {formatTimerMMSS(currentTimerVal)}
                </span>
                <p className="text-xs text-slate-600 mt-2 font-mono tabular-nums">
                  {currentStep.timer_seconds > 0
                    ? `Target Duration: ${formatTimerMMSS(
                        currentStep.timer_seconds
                      )} (${currentStep.timer_seconds}s)`
                    : 'No fixed timer required — Use custom timer if needed'}
                </p>
              </div>

              {/* One-Tap Timer Controls */}
              <div className="mt-4 grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => toggleStepTimer(activeStepIndex)}
                  className={`min-h-[44px] px-4 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm ${
                    isCurrentTimerRunning
                      ? 'bg-rose-600 text-white'
                      : 'bg-gradient-to-r from-[#FF5A1F] to-[#FF2E63] text-white'
                  }`}
                >
                  {isCurrentTimerRunning ? (
                    <>
                      <Pause className="w-4 h-4" />
                      <span>Pause Timer</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 fill-current" />
                      <span>Start Timer</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => resetStepTimer(activeStepIndex)}
                  className="min-h-[44px] px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 hover:bg-slate-100 font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Reset</span>
                </button>
              </div>

              <div className="mt-2.5 grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => adjustStepTimer(activeStepIndex, 30)}
                  className="min-h-[40px] rounded-xl border border-slate-200 bg-slate-50 text-xs font-mono font-bold text-slate-700 hover:bg-slate-100 cursor-pointer"
                >
                  +30s
                </button>
                <button
                  type="button"
                  onClick={() => adjustStepTimer(activeStepIndex, 60)}
                  className="min-h-[40px] rounded-xl border border-slate-200 bg-slate-50 text-xs font-mono font-bold text-slate-700 hover:bg-slate-100 cursor-pointer"
                >
                  +1m
                </button>
              </div>
            </div>

            {/* Always-Accessible Complete Dish CTA */}
            <div className="mt-6 pt-4 border-t border-slate-200">
              <p className="text-xs text-slate-600 mb-2.5">
                Completing this meal deducts{' '}
                <strong className="text-slate-900">
                  {recipe.used_ingredients.join(', ')}
                </strong>{' '}
                from your virtual pantry.
              </p>
              <button
                type="button"
                onClick={handleFinishDish}
                className="w-full min-h-[48px] rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold text-sm hover:opacity-95 transition-all shadow-md shadow-emerald-500/20 flex items-center justify-center gap-2 cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Complete Dish & Update Pantry</span>
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* Mode 2: Vertical Timeline View */
        <div className="mt-6 space-y-3">
          {recipe.steps.map((step, idx) => {
            const rem = timersRemaining[idx] ?? step.timer_seconds;
            const running = !!timersRunning[idx];
            const isDone = !!completedSteps[idx];

            return (
              <div
                key={idx}
                className={`rounded-2xl border-2 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                  isDone
                    ? 'border-emerald-300 bg-emerald-50/40'
                    : 'border-slate-200 bg-white'
                }`}
              >
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 text-xs font-mono">
                    <span className="text-[#FF5A1F] font-extrabold">
                      0{idx + 1}.
                    </span>
                    <button
                      type="button"
                      onClick={() => toggleStepCompleted(idx)}
                      className="text-xs font-bold text-slate-600 hover:text-emerald-700 cursor-pointer"
                    >
                      {isDone ? '✓ Completed' : 'Mark Complete'}
                    </button>
                  </div>
                  <p className="text-sm sm:text-base font-medium text-slate-900">
                    {step.instruction}
                  </p>
                </div>

                {step.timer_seconds > 0 && (
                  <div className="flex items-center gap-2.5 shrink-0">
                    <span className="font-mono text-lg font-extrabold tabular-nums text-[#FF5A1F]">
                      {formatTimerMMSS(rem)}
                    </span>
                    <button
                      type="button"
                      onClick={() => toggleStepTimer(idx)}
                      className="min-h-[40px] px-3.5 py-2 rounded-xl bg-gradient-to-r from-[#FF5A1F] to-[#FF2E63] text-white font-bold text-xs cursor-pointer"
                    >
                      {running ? 'Pause' : 'Start Timer'}
                    </button>
                    <button
                      type="button"
                      onClick={() => resetStepTimer(idx)}
                      className="min-h-[40px] px-2.5 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-700 hover:bg-slate-100 cursor-pointer"
                    >
                      Reset
                    </button>
                  </div>
                )}
              </div>
            );
          })}

          <div className="pt-4 flex justify-end">
            <button
              type="button"
              onClick={handleFinishDish}
              className="min-h-[48px] px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold text-sm hover:opacity-95 transition-all flex items-center gap-2 cursor-pointer shadow-md"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Complete Dish & Update Pantry</span>
            </button>
          </div>
        </div>
      )}

      {dishCompletedBanner && (
        <div
          role="status"
          className="mt-5 rounded-2xl border-2 border-emerald-400 bg-emerald-50 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
        >
          <div className="flex items-center gap-2.5 text-sm text-emerald-900 font-bold">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>
              Dish Crafted! Your virtual pantry quantities and daily macro log have been updated.
            </span>
          </div>
          <button
            type="button"
            onClick={onBackToRecipes}
            className="min-h-[40px] px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold cursor-pointer"
          >
            Explore Next Meal
          </button>
        </div>
      )}
    </section>
  );
};
