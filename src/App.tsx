import React, { useEffect, useState, useCallback } from 'react';
import {
  ChefHat,
  Volume2,
  VolumeX,
  CheckCircle2,
  Check,
} from 'lucide-react';
import type {
  CapturedIngredientPhoto,
  CraftedMealLog,
  DietaryRestriction,
  InventoryItem,
  MealType,
  RecipeItem,
  SnapChefPayload,
} from './types/snapchef';
import {
  INITIAL_INVENTORY,
  INITIAL_PHOTO_TRAY,
  INITIAL_RECIPES,
  POTATO_SPICES_BUTTER_RECIPES,
  SCAN_PRESET_SCENES,
  makeIngredientThumbSvg,
} from './data/seedData';
import {
  deductInventoryAfterCrafting,
  mergeScannedInventory,
  normalizeSnapChefPayload,
  scaleRecipeForPeopleAndDiet,
} from './utils/snapchefLogic';
import { playRelaxingClickSound } from './utils/soundEffects';
import { CameraScannerEye } from './components/CameraScannerEye';
import { ServingsAndDietStep } from './components/ServingsAndDietStep';
import { RecipeSynthesizer } from './components/RecipeSynthesizer';
import { CraftingModeHUD } from './components/CraftingModeHUD';
import {
  OfflineIndicator,
  PWAInstallModalTrigger,
} from './components/PWAInstallButton';

const STORAGE_KEYS = {
  PHOTOS: 'snapchef_photo_tray_v2',
  RECIPES: 'snapchef_synthesized_recipes_v2',
  SERVINGS: 'snapchef_servings_v2',
  DIET: 'snapchef_diet_v2',
  READ_ALOUD: 'snapchef_read_aloud_v2',
};

type WizardStep = 'photos' | 'preferences' | 'recipes' | 'cooking';

const STEP_ITEMS: Array<{ id: WizardStep; num: number; label: string }> = [
  { id: 'photos', num: 1, label: '1. Ingredients' },
  { id: 'preferences', num: 2, label: '2. Servings' },
  { id: 'recipes', num: 3, label: '3. Recipes' },
  { id: 'cooking', num: 4, label: '4. Cook' },
];

export default function App() {
  const [photos, setPhotos] = useState<CapturedIngredientPhoto[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.PHOTOS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // Ignore storage error
    }
    return INITIAL_PHOTO_TRAY;
  });

  const [servings, setServings] = useState<number>(() => {
    try {
      const saved = Number(localStorage.getItem(STORAGE_KEYS.SERVINGS));
      if (saved >= 1 && saved <= 12) return saved;
    } catch {
      // Ignore
    }
    return 3;
  });

  const [dietaryRestriction, setDietaryRestriction] =
    useState<DietaryRestriction>(() => {
      try {
        const saved = localStorage.getItem(
          STORAGE_KEYS.DIET
        ) as DietaryRestriction | null;
        if (saved) return saved;
      } catch {
        // Ignore
      }
      return 'No Restrictions';
    });

  const [recipes, setRecipes] = useState<RecipeItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.RECIPES);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // Ignore
    }
    return POTATO_SPICES_BUTTER_RECIPES;
  });

  const [readAloudEnabled, setReadAloudEnabled] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.READ_ALOUD);
      if (saved !== null) return saved === 'true';
    } catch {
      // Ignore
    }
    return false;
  });

  const [activeStep, setActiveStep] = useState<WizardStep>('photos');
  const [activeMealFilter, setActiveMealFilter] = useState<'All' | MealType>(
    'All'
  );
  const [activeCraftingRecipe, setActiveCraftingRecipe] = useState<RecipeItem>(
    () => POTATO_SPICES_BUTTER_RECIPES[0] || INITIAL_RECIPES[0]
  );
  const [isSynthesizingStep2, setIsSynthesizingStep2] =
    useState<boolean>(false);
  const [statusToast, setStatusToast] = useState<string | null>(null);

  // Derive combined inventory from all uploaded/captured photos in the tray
  const inventory: InventoryItem[] = React.useMemo(() => {
    let acc: InventoryItem[] = [];
    for (const p of photos) {
      acc = mergeScannedInventory(acc, p.detectedItems);
    }
    return acc.length > 0 ? acc : INITIAL_INVENTORY.slice(0, 3);
  }, [photos]);

  const speakHandsFree = useCallback((text: string) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      window.speechSynthesis.speak(utterance);
    } catch {
      // Ignore speech synthesis errors in restricted environments
    }
  }, []);

  const buildStepAnnouncement = useCallback(
    (step: WizardStep): string => {
      if (step === 'photos') {
        return `Step 1: Ingredients. You have ${photos.length} ingredient photos in your tray. Snap or upload photos of your ingredients, then press Next.`;
      }
      if (step === 'preferences') {
        return `Step 2: Servings. Choose how many people you are cooking for, currently ${servings} people, and pick any dietary restrictions.`;
      }
      if (step === 'recipes') {
        return `Step 3: Recipes. Showing ${recipes.length} recommended recipes for ${servings} people, including any lacking vegetables or spices.`;
      }
      const firstInstruction =
        activeCraftingRecipe.steps[0]?.instruction ||
        'Follow the step-by-step instructions.';
      return `Step 4: Cook ${activeCraftingRecipe.title}. Step 1: ${firstInstruction}`;
    },
    [photos.length, servings, recipes.length, activeCraftingRecipe]
  );

  // Global relaxing click sound listener for all buttons
  useEffect(() => {
    const handleGlobalClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;
      const button = target.closest('button, a');
      if (button) {
        playRelaxingClickSound('soft', true);
      }
    };
    document.addEventListener('click', handleGlobalClick);
    return () => document.removeEventListener('click', handleGlobalClick);
  }, []);

  // Persist user state
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.PHOTOS, JSON.stringify(photos));
    } catch {
      // Ignore quota errors
    }
  }, [photos]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.RECIPES, JSON.stringify(recipes));
    } catch {
      // Ignore
    }
  }, [recipes]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.SERVINGS, String(servings));
      localStorage.setItem(STORAGE_KEYS.DIET, dietaryRestriction);
      localStorage.setItem(STORAGE_KEYS.READ_ALOUD, String(readAloudEnabled));
    } catch {
      // Ignore
    }
  }, [servings, dietaryRestriction, readAloudEnabled]);

  const showToast = (msg: string) => {
    setStatusToast(msg);
    window.setTimeout(() => {
      setStatusToast((prev) => (prev === msg ? null : prev));
    }, 4500);
  };

  const goToStep = (step: WizardStep) => {
    playRelaxingClickSound('step', true);
    setActiveStep(step);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (readAloudEnabled) {
      speakHandsFree(buildStepAnnouncement(step));
    }
  };

  const handleToggleReadAloud = () => {
    setReadAloudEnabled((prev) => {
      const next = !prev;
      if (next) {
        speakHandsFree(
          `Read Aloud enabled for hands-free kitchen use. ${buildStepAnnouncement(
            activeStep
          )}`
        );
      } else if (
        typeof window !== 'undefined' &&
        'speechSynthesis' in window
      ) {
        try {
          window.speechSynthesis.cancel();
        } catch {
          // Ignore
        }
      }
      return next;
    });
  };

  const handleAddPhotoToTray = (
    newPhoto: CapturedIngredientPhoto,
    recipesFromScan?: SnapChefPayload['recipes']
  ) => {
    setPhotos((prev) => [...prev, newPhoto]);
    if (recipesFromScan && recipesFromScan.length > 0) {
      setRecipes((prev) => [...recipesFromScan, ...prev]);
    }
  };

  const handleRemovePhotoFromTray = (photoId: string) => {
    setPhotos((prev) => {
      const filtered = prev.filter((p) => p.id !== photoId);
      return filtered.length > 0 ? filtered : prev;
    });
  };

  const handleAdjustPhotoQuantity = (photoId: string, deltaGrams: number) => {
    setPhotos((prev) =>
      prev.map((photo) => {
        if (photo.id !== photoId) return photo;
        const updatedItems = photo.detectedItems.map((item, idx) => {
          if (idx !== 0) return item;
          const nextQty = Math.max(50, (item.quantity_g || 200) + deltaGrams);
          return {
            ...item,
            quantity_g: nextQty,
          };
        });
        return {
          ...photo,
          detectedItems: updatedItems,
        };
      })
    );
  };

  const handleLoadPresetPhotos = (presetId: string) => {
    const preset = SCAN_PRESET_SCENES.find((s) => s.id === presetId);
    if (!preset) return;
    const accentColors = ['#EA580C', '#D97706', '#059669', '#0284C7', '#E11D48'];
    const bgColors = ['#FFF7ED', '#FEFCE8', '#ECFDF5', '#F0F9FF', '#FFF1F2'];

    const newTray: CapturedIngredientPhoto[] = preset.payload.inventory.map(
      (item, idx) => ({
        id: `preset-${preset.id}-${idx}`,
        label: `Photo #${idx + 1}: ${item.name}`,
        previewUrl: makeIngredientThumbSvg(
          item.name,
          `${item.category} · ${item.quantity_g}g`,
          accentColors[idx % accentColors.length],
          bgColors[idx % bgColors.length]
        ),
        detectedItems: [item],
        capturedAt: `Photo ${idx + 1}`,
      })
    );

    setPhotos(newTray);
    setRecipes(preset.payload.recipes);
    showToast(
      `Loaded ${newTray.length} ingredient photos (${preset.label})! Click "2. Servings" or Next to continue.`
    );
  };

  const handleGenerateRecipesFromStep2 = async () => {
    setIsSynthesizingStep2(true);

    try {
      const response = await fetch('/api/synthesize-recipes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          inventory,
          mealIntent: activeMealFilter,
          servings,
          dietaryRestriction,
        }),
      });

      if (response.ok) {
        const raw = await response.json();
        const normalized = normalizeSnapChefPayload(raw);
        if (normalized.recipes.length > 0) {
          const scaled = normalized.recipes.map((r) =>
            scaleRecipeForPeopleAndDiet(r, servings, dietaryRestriction)
          );
          setRecipes(scaled);
          setActiveCraftingRecipe(scaled[0]);
          setIsSynthesizingStep2(false);
          playRelaxingClickSound('success', true);
          goToStep('recipes');
          return;
        }
      }
    } catch {
      // Fallback to instant local scaling below
    }

    const scaledFallback = recipes.map((r) =>
      scaleRecipeForPeopleAndDiet(r, servings, dietaryRestriction)
    );
    setRecipes(scaledFallback);
    if (scaledFallback[0]) {
      setActiveCraftingRecipe(scaledFallback[0]);
    }
    setIsSynthesizingStep2(false);
    playRelaxingClickSound('success', true);
    goToStep('recipes');
  };

  const handleSelectRecipeForCrafting = (recipe: RecipeItem) => {
    setActiveCraftingRecipe(recipe);
    goToStep('cooking');
  };

  const handleCompleteCrafting = (recipe: RecipeItem) => {
    const { consumedNames } = deductInventoryAfterCrafting(
      inventory,
      recipe.used_ingredients,
      100
    );
    const completedLog: CraftedMealLog = {
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
    playRelaxingClickSound('success', true);
    showToast(
      `Finished cooking "${completedLog.title}" for ${servings} ${
        servings === 1 ? 'Person' : 'People'
      }! Enjoy your meal!`
    );
  };

  const activeStepOrder =
    STEP_ITEMS.find((s) => s.id === activeStep)?.num || 1;

  return (
    <div
      id="top"
      className="min-h-screen bg-gradient-to-br from-[#FFFDF9] via-[#FFF7ED] to-[#F0FDFA] text-slate-900 pb-16"
    >
      {/* Single, Sticky Top Bar: Logo + 4-Step Progress Indicator + Read Aloud Toggle + Install App */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-orange-200/80 shadow-xs">
        <div className="max-w-6xl mx-auto px-3 md:px-4 lg:px-8 py-2 flex flex-wrap md:flex-nowrap items-center justify-between gap-2">
          {/* 1. Brand Logo */}
          <button
            type="button"
            onClick={() => goToStep('photos')}
            className="snapchef-logo-shell group relative inline-flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-2xl bg-gradient-to-r from-[#FFF7ED] via-white to-[#ECFDF5] border border-orange-200/90 whitespace-nowrap shrink-0 overflow-hidden transition-transform hover:scale-[1.02] cursor-pointer"
          >
            <svg
              aria-hidden="true"
              className="absolute inset-0 w-full h-full pointer-events-none"
              viewBox="0 0 190 46"
              preserveAspectRatio="none"
            >
              <defs>
                <linearGradient
                  id="snapchef-warm-neon-grad"
                  x1="0%"
                  y1="0%"
                  x2="100%"
                  y2="100%"
                >
                  <stop offset="0%" stopColor="#FF5A1F" />
                  <stop offset="40%" stopColor="#F59E0B" />
                  <stop offset="75%" stopColor="#10B981" />
                  <stop offset="100%" stopColor="#FF5A1F" />
                </linearGradient>
              </defs>
              <rect
                x="1.5"
                y="1.5"
                width="187"
                height="43"
                rx="14"
                fill="none"
                stroke="url(#snapchef-warm-neon-grad)"
                strokeWidth="2.5"
                className="snapchef-neon-rect"
              />
            </svg>

            <span className="relative z-10 flex items-center justify-center w-6 h-6 sm:w-7 sm:h-7 rounded-xl bg-gradient-to-br from-[#FF5A1F] via-[#F97316] to-[#F59E0B] text-white shadow-xs shrink-0">
              <ChefHat className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[2.4]" />
            </span>

            <span className="relative z-10 font-display text-base sm:text-lg lg:text-xl font-extrabold tracking-tight flex items-center">
              <span className="text-slate-900">Snap</span>
              <span className="snapchef-chef-gradient">Chef</span>
            </span>
          </button>

          {/* 2. 4-Step Progress Indicator (1. Ingredients, 2. Servings, 3. Recipes, 4. Cook) */}
          <nav
            aria-label="4-Step Progress Indicator"
            className="order-3 md:order-2 w-full md:w-auto grid grid-cols-4 md:flex items-center gap-1 lg:gap-1.5 bg-orange-50/70 border border-orange-200/80 p-1 rounded-2xl shrink-0"
          >
            {STEP_ITEMS.map((step) => {
              const isCurrent = activeStep === step.id;
              const isCompleted = step.num < activeStepOrder;

              return (
                <button
                  key={step.id}
                  type="button"
                  onClick={() => goToStep(step.id)}
                  aria-current={isCurrent ? 'step' : undefined}
                  className={`min-h-[34px] sm:min-h-[36px] px-1.5 sm:px-2.5 lg:px-3.5 py-1 sm:py-1.5 rounded-xl text-[11px] sm:text-xs lg:text-sm font-extrabold whitespace-nowrap shrink-0 flex items-center justify-center gap-1 transition-all cursor-pointer ${
                    isCurrent
                      ? 'bg-gradient-to-r from-[#FF5A1F] to-[#FF2E63] text-white shadow-sm'
                      : isCompleted
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200/80 hover:bg-emerald-100/70'
                      : 'text-slate-700 hover:text-[#FF5A1F] hover:bg-white/80'
                  }`}
                >
                  {isCompleted && (
                    <Check className="w-3 h-3 text-emerald-600 shrink-0 hidden lg:inline" />
                  )}
                  <span>{step.label}</span>
                </button>
              );
            })}
          </nav>

          {/* 3. 'Read Aloud' Speaker Toggle + 4. 'Install App' Button */}
          <div className="order-2 md:order-3 flex items-center gap-1.5 sm:gap-2 shrink-0">
            <button
              type="button"
              onClick={handleToggleReadAloud}
              aria-pressed={readAloudEnabled}
              aria-label="Read Aloud speaker toggle for hands-free use"
              className={`min-h-[34px] sm:min-h-[38px] px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl border text-[11px] sm:text-xs font-bold flex items-center gap-1.5 whitespace-nowrap shrink-0 transition-all cursor-pointer ${
                readAloudEnabled
                  ? 'border-emerald-500 bg-emerald-50 text-emerald-900 shadow-2xs'
                  : 'border-orange-200 bg-orange-50/70 hover:bg-orange-100 text-slate-700'
              }`}
            >
              {readAloudEnabled ? (
                <Volume2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-600 shrink-0" />
              ) : (
                <VolumeX className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#FF5A1F] shrink-0" />
              )}
              <span>Read Aloud</span>
            </button>
            <PWAInstallModalTrigger variant="compact" />
          </div>
        </div>
      </header>

      {/* Main Content Container — Starts directly with the active step to save space */}
      <main className="max-w-6xl mx-auto px-3 sm:px-6 lg:px-8 pt-5 sm:pt-6">
        {/* Optional Status Toast */}
        {statusToast && (
          <div
            role="status"
            className="mb-4 rounded-2xl border border-emerald-400 bg-emerald-50 px-4 py-3 text-xs sm:text-sm font-bold text-emerald-900 flex items-center justify-between gap-3"
          >
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{statusToast}</span>
            </div>
            <button
              type="button"
              onClick={() => setStatusToast(null)}
              className="text-xs text-emerald-700 hover:text-emerald-950 cursor-pointer"
            >
              Close
            </button>
          </div>
        )}

        {/* Active Step View */}
        <div>
          {activeStep === 'photos' && (
            <CameraScannerEye
              photos={photos}
              onAddPhotoToTray={handleAddPhotoToTray}
              onRemovePhotoFromTray={handleRemovePhotoFromTray}
              onAdjustPhotoQuantity={handleAdjustPhotoQuantity}
              onLoadPresetPhotos={handleLoadPresetPhotos}
              onProceedToServings={() => goToStep('preferences')}
            />
          )}

          {activeStep === 'preferences' && (
            <ServingsAndDietStep
              photos={photos}
              inventory={inventory}
              servings={servings}
              onSelectServings={(count) => setServings(count)}
              dietaryRestriction={dietaryRestriction}
              onSelectDiet={(diet) => setDietaryRestriction(diet)}
              isSynthesizing={isSynthesizingStep2}
              onGenerateRecipes={handleGenerateRecipesFromStep2}
              onBackToPhotos={() => goToStep('photos')}
            />
          )}

          {activeStep === 'recipes' && (
            <RecipeSynthesizer
              recipes={recipes}
              inventory={inventory}
              servings={servings}
              dietaryRestriction={dietaryRestriction}
              activeMealFilter={activeMealFilter}
              onMealFilterChange={(meal) => setActiveMealFilter(meal)}
              onSelectRecipeForCrafting={handleSelectRecipeForCrafting}
              onSynthesizedRecipes={(newRecs) => setRecipes(newRecs)}
              onBackToServings={() => goToStep('preferences')}
              onBackToPhotos={() => goToStep('photos')}
            />
          )}

          {activeStep === 'cooking' && (
            <CraftingModeHUD
              recipe={activeCraftingRecipe}
              onCompleteCrafting={handleCompleteCrafting}
              onBackToRecipes={() => goToStep('recipes')}
            />
          )}
        </div>
      </main>

      <OfflineIndicator />
    </div>
  );
}
