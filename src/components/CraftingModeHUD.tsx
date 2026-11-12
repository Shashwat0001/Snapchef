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

/**
 * Plays a crisp cyberpunk HUD completion chime using the browser's native Web Audio API.
 */
function playTimerAlertChime() {
  try {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const frequencies = [587.33, 880, 1174.66]; // D5, A5, D6 chord arpeggio
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

  // Per-step countdown timers state: remaining seconds & running boolean
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

  // Reset state if recipe changes
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

  // Global 1-second tick for any active countdown timers
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
      className="mt-6 rounded-2xl border border-[#00F0FF]/40 bg-[#141619] p-4 sm:p-6 shadow-2xl"
    >
      {/* Top Bar: Back Button + Recipe Meta + View Mode Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-white/10">
        <button
          type="button"
          onClick={onBackToRecipes}
          className="min-h-[44px] px-3.5 py-2 rounded-xl border border-white/15 bg-[#0D0D0D] text-xs font-medium text-[#F2F5F8] hover:border-[#00F0FF] transition-colors flex items-center gap-1.5 cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4 text-[#00F0FF]" />
          <span>Back to Recipes</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setSoundEnabled((s) => !s)}
            className="min-h-[44px] px-3 py-2 rounded-xl border border-white/10 bg-[#0D0D0D] text-xs text-[#94A3B8] hover:text-white flex items-center gap-1.5 cursor-pointer"
            aria-label={
              soundEnabled ? 'Mute timer audio alert' : 'Unmute timer audio alert'
            }
          >
            {soundEnabled ? (
              <Volume2 className="w-4 h-4 text-[#B8FF01]" />
            ) : (
              <VolumeX className="w-4 h-4 text-[#94A3B8]" />
            )}
            <span className="hidden sm:inline">
              {soundEnabled ? 'Audio Alert On' : 'Muted'}
            </span>
          </button>

          <div
            role="group"
            aria-label="Cooking instruction layout mode"
            className="flex items-center gap-1 p-1 rounded-xl bg-[#0D0D0D] border border-white/10"
          >
            <button
              type="button"
              onClick={() => setViewMode('flashcard')}
              className={`min-h-[38px] px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer ${
                viewMode === 'flashcard'
                  ? 'bg-[#00F0FF] text-[#0D0D0D] font-semibold'
                  : 'text-[#94A3B8] hover:text-white'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Flashcards</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('timeline')}
              className={`min-h-[38px] px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer ${
                viewMode === 'timeline'
                  ? 'bg-[#00F0FF] text-[#0D0D0D] font-semibold'
                  : 'text-[#94A3B8] hover:text-white'
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
          <div className="flex items-center gap-2 text-xs text-[#94A3B8]">
            <span className="text-[#00F0FF] font-semibold">
              {recipe.cuisine}
            </span>
            <span aria-hidden="true">·</span>
            <span>{recipe.meal_type}</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono tabular-nums text-[#B8FF01]">
              {recipe.crafting_difficulty} Craft
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-[#F2F5F8] mt-1">
            {recipe.title}
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-4 rounded-xl border border-white/10 bg-[#0D0D0D] px-4 py-3 text-xs font-mono tabular-nums">
          <div className="flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-[#00F0FF]" />
            <span>{recipe.prep_cook_minutes} min</span>
          </div>
          <span aria-hidden="true" className="text-white/20">
            ·
          </span>
          <div className="flex items-center gap-1.5">
            <Flame className="w-4 h-4 text-[#FF2A85]" />
            <span>{recipe.total_calories} kcal</span>
          </div>
          <span aria-hidden="true" className="text-white/20">
            ·
          </span>
          <span className="text-[#B8FF01] font-semibold">
            Protein: {recipe.protein_g}g
          </span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mt-5">
        <div className="flex items-center justify-between text-xs font-mono tabular-nums text-[#94A3B8] mb-1.5">
          <span>
            Step {activeStepIndex + 1} of {totalSteps}
          </span>
          <span>{progressPercent}% Crafting Progress</span>
        </div>
        <div className="w-full h-2 rounded-full bg-[#0D0D0D] overflow-hidden border border-white/10">
          <div
            className="h-full bg-gradient-to-r from-[#00F0FF] to-[#B8FF01] transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Mode 1: Focused Step-by-Step Flashcard HUD */}
      {viewMode === 'flashcard' ? (
        <div className="mt-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          {/* Active Flashcard */}
          <div className="lg:col-span-8 rounded-2xl border border-[#00F0FF]/35 bg-[#0D0D0D] p-5 sm:p-7 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-mono font-semibold text-[#00F0FF]">
                  0{activeStepIndex + 1}. ACTIVE CRAFTING STEP
                </span>
                <button
                  type="button"
                  onClick={() => toggleStepCompleted(activeStepIndex)}
                  className={`min-h-[38px] px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 border transition-colors cursor-pointer ${
                    completedSteps[activeStepIndex]
                      ? 'border-[#B8FF01] bg-[#B8FF01]/15 text-[#B8FF01]'
                      : 'border-white/15 bg-[#141619] text-[#94A3B8] hover:text-white'
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

              <p className="mt-4 text-lg sm:text-xl font-medium text-[#F2F5F8] leading-relaxed">
                {currentStep.instruction}
              </p>

              {currentStep.tip && (
                <div className="mt-4 rounded-xl border border-white/10 bg-[#141619] p-3.5 text-xs sm:text-sm text-[#CBD5E1]">
                  <strong className="text-[#B8FF01]">Culinary Note: </strong>
                  {currentStep.tip}
                </div>
              )}
            </div>

            {/* Step Navigation Buttons */}
            <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between gap-3">
              <button
                type="button"
                disabled={activeStepIndex === 0}
                onClick={() =>
                  setActiveStepIndex((prev) => Math.max(0, prev - 1))
                }
                className="min-h-[44px] px-4 py-2 rounded-xl border border-white/15 bg-[#141619] text-xs font-medium text-[#F2F5F8] hover:border-white/35 disabled:opacity-40 transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Previous Step</span>
              </button>

              <div className="flex items-center gap-1.5">
                {recipe.steps.map((_, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setActiveStepIndex(idx)}
                    aria-label={`Jump to step ${idx + 1}`}
                    className={`w-8 h-8 rounded-lg font-mono text-xs font-semibold transition-colors cursor-pointer ${
                      idx === activeStepIndex
                        ? 'bg-[#00F0FF] text-[#0D0D0D]'
                        : completedSteps[idx]
                        ? 'bg-[#B8FF01]/20 text-[#B8FF01] border border-[#B8FF01]/40'
                        : 'bg-[#141619] text-[#94A3B8] border border-white/10'
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
                  className="min-h-[44px] px-4 py-2 rounded-xl bg-[#00F0FF] text-[#0D0D0D] font-semibold text-xs hover:bg-[#00F0FF]/90 transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <span>Next Step</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleFinishDish}
                  className="min-h-[44px] px-5 py-2 rounded-xl bg-[#B8FF01] text-[#0D0D0D] font-bold text-xs sm:text-sm hover:bg-[#B8FF01]/90 transition-colors flex items-center gap-2 cursor-pointer"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Complete Dish & Update Pantry</span>
                </button>
              )}
            </div>
          </div>

          {/* Integrated Countdown Timer Module */}
          <div className="lg:col-span-4 rounded-2xl border border-white/10 bg-[#0D0D0D] p-5 flex flex-col justify-between">
            <div>
              <span className="text-xs font-mono text-[#94A3B8] block">
                INTEGRATED STEP TIMER
              </span>
              <div className="mt-3 rounded-2xl border border-[#00F0FF]/30 bg-[#141619] p-5 text-center">
                <span
                  data-testid="active-step-timer-display"
                  className={`text-4xl sm:text-5xl font-mono font-bold tabular-nums tracking-tight ${
                    isCurrentTimerRunning
                      ? 'text-[#00F0FF]'
                      : currentTimerVal === 0 && currentStep.timer_seconds > 0
                      ? 'text-[#B8FF01]'
                      : 'text-[#F2F5F8]'
                  }`}
                >
                  {formatTimerMMSS(currentTimerVal)}
                </span>
                <p className="text-xs text-[#94A3B8] mt-2 font-mono tabular-nums">
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
                  className={`min-h-[44px] px-4 py-2.5 rounded-xl font-semibold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer ${
                    isCurrentTimerRunning
                      ? 'bg-[#FF2A85] text-white'
                      : 'bg-[#00F0FF] text-[#0D0D0D]'
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
                  className="min-h-[44px] px-4 py-2.5 rounded-xl border border-white/15 bg-[#141619] text-[#F2F5F8] hover:border-white/35 font-medium text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Reset</span>
                </button>
              </div>

              <div className="mt-2.5 grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => adjustStepTimer(activeStepIndex, 30)}
                  className="min-h-[40px] rounded-xl border border-white/10 bg-[#141619] text-xs font-mono text-[#94A3B8] hover:text-white cursor-pointer"
                >
                  +30s
                </button>
                <button
                  type="button"
                  onClick={() => adjustStepTimer(activeStepIndex, 60)}
                  className="min-h-[40px] rounded-xl border border-white/10 bg-[#141619] text-xs font-mono text-[#94A3B8] hover:text-white cursor-pointer"
                >
                  +1m
                </button>
              </div>
            </div>

            {/* Always-Accessible Complete Dish CTA */}
            <div className="mt-6 pt-4 border-t border-white/10">
              <p className="text-xs text-[#94A3B8] mb-2.5">
                Completing this meal deducts{' '}
                <strong className="text-[#F2F5F8]">
                  {recipe.used_ingredients.join(', ')}
                </strong>{' '}
                from your virtual pantry.
              </p>
              <button
                type="button"
                onClick={handleFinishDish}
                className="w-full min-h-[48px] rounded-xl bg-[#B8FF01] text-[#0D0D0D] font-bold text-sm hover:bg-[#B8FF01]/90 transition-colors flex items-center justify-center gap-2 cursor-pointer"
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
                className={`rounded-2xl border p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                  isDone
                    ? 'border-[#B8FF01]/40 bg-[#0D0D0D]/70'
                    : 'border-white/10 bg-[#0D0D0D]'
                }`}
              >
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 text-xs font-mono">
                    <span className="text-[#00F0FF] font-bold">
                      0{idx + 1}.
                    </span>
                    <button
                      type="button"
                      onClick={() => toggleStepCompleted(idx)}
                      className="text-xs text-[#94A3B8] hover:text-[#B8FF01] cursor-pointer"
                    >
                      {isDone ? '✓ Completed' : 'Mark Complete'}
                    </button>
                  </div>
                  <p className="text-sm sm:text-base text-[#F2F5F8]">
                    {step.instruction}
                  </p>
                </div>

                {step.timer_seconds > 0 && (
                  <div className="flex items-center gap-2.5 shrink-0">
                    <span className="font-mono text-lg font-bold tabular-nums text-[#00F0FF]">
                      {formatTimerMMSS(rem)}
                    </span>
                    <button
                      type="button"
                      onClick={() => toggleStepTimer(idx)}
                      className="min-h-[40px] px-3.5 py-2 rounded-xl bg-[#00F0FF] text-[#0D0D0D] font-semibold text-xs cursor-pointer"
                    >
                      {running ? 'Pause' : 'Start Timer'}
                    </button>
                    <button
                      type="button"
                      onClick={() => resetStepTimer(idx)}
                      className="min-h-[40px] px-2.5 py-2 rounded-xl border border-white/10 bg-[#141619] text-xs text-[#94A3B8] hover:text-white cursor-pointer"
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
              className="min-h-[48px] px-6 py-3 rounded-xl bg-[#B8FF01] text-[#0D0D0D] font-bold text-sm hover:bg-[#B8FF01]/90 transition-colors flex items-center gap-2 cursor-pointer"
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
          className="mt-5 rounded-xl border border-[#B8FF01] bg-[#B8FF01]/10 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
        >
          <div className="flex items-center gap-2.5 text-sm text-[#B8FF01] font-semibold">
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <span>
              Dish Crafted! Your virtual pantry quantities and daily macro log have been updated.
            </span>
          </div>
          <button
            type="button"
            onClick={onBackToRecipes}
            className="min-h-[40px] px-4 py-2 rounded-lg bg-[#B8FF01] text-[#0D0D0D] text-xs font-bold cursor-pointer"
          >
            Explore Next Meal
          </button>
        </div>
      )}
    </section>
  );
};
