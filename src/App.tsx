import React, { useEffect, useState } from 'react';
import {
  Camera,
  ChefHat,
  Users,
  Flame,
  Volume2,
  VolumeX,
  CheckCircle2,
  HelpCircle,
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
  SOUND: 'snapchef_relaxing_sound_v2',
};

type WizardStep = 'photos' | 'preferences' | 'recipes' | 'cooking';

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

  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SOUND);
      if (saved !== null) return saved === 'true';
    } catch {
      // Ignore
    }
    return true;
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

  // Global relaxing click sound listener for all buttons
  useEffect(() => {
    const handleGlobalClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;
      const button = target.closest('button, a');
      if (button) {
        playRelaxingClickSound('soft', soundEnabled);
      }
    };
    document.addEventListener('click', handleGlobalClick);
    return () => document.removeEventListener('click', handleGlobalClick);
  }, [soundEnabled]);

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
      localStorage.setItem(STORAGE_KEYS.SOUND, String(soundEnabled));
    } catch {
      // Ignore
    }
  }, [servings, dietaryRestriction, soundEnabled]);

  const showToast = (msg: string) => {
    setStatusToast(msg);
    window.setTimeout(() => {
      setStatusToast((prev) => (prev === msg ? null : prev));
    }, 4500);
  };

  const goToStep = (step: WizardStep) => {
    playRelaxingClickSound('step', soundEnabled);
    setActiveStep(step);
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
      `Loaded ${newTray.length} ingredient photos (${preset.label})! Click "Next: Choose How Many People & Diet" to continue.`
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
          playRelaxingClickSound('success', soundEnabled);
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
    playRelaxingClickSound('success', soundEnabled);
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
    playRelaxingClickSound('success', soundEnabled);
    showToast(
      `Finished cooking "${completedLog.title}" for ${servings} ${
        servings === 1 ? 'Person' : 'People'
      }! Enjoy your meal!`
    );
  };

  return (
    <div
      id="top"
      className="min-h-screen bg-gradient-to-br from-[#FFFDF9] via-[#FFF7ED] to-[#F0FDFA] text-slate-900 pb-24 md:pb-16"
    >
      {/* Clean, Simple Top Bar — Responsive across Mobile, iPad/Tablet, and Desktop */}
      <header className="sticky top-0 z-40 min-h-16 py-2 flex items-center justify-between gap-2 sm:gap-4 px-3 sm:px-6 lg:px-8 bg-white/95 backdrop-blur-md border-b border-orange-200/80 shadow-xs">
        {/* Brand Wordmark */}
        <button
          type="button"
          onClick={() => goToStep('photos')}
          className="snapchef-logo-shell group relative inline-flex items-center gap-2 sm:gap-2.5 px-3 sm:px-3.5 py-1.5 rounded-2xl bg-gradient-to-r from-[#FFF7ED] via-white to-[#ECFDF5] border border-orange-200/90 whitespace-nowrap shrink-0 overflow-hidden transition-transform hover:scale-[1.02] cursor-pointer"
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

          <span className="relative z-10 flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-gradient-to-br from-[#FF5A1F] via-[#F97316] to-[#F59E0B] text-white shadow-xs shrink-0">
            <ChefHat className="w-4 h-4 stroke-[2.4]" />
          </span>

          <span className="relative z-10 font-display text-lg sm:text-xl lg:text-2xl font-extrabold tracking-tight flex items-center">
            <span className="text-slate-900">Snap</span>
            <span className="snapchef-chef-gradient">Chef</span>
          </span>
        </button>

        {/* Simple 4-Step Menu Navigation — Never wraps or overlaps on iPad/Tablet or Desktop */}
        <nav
          aria-label="Simple Step Navigation"
          className="hidden md:flex items-center gap-1 lg:gap-3 xl:gap-5 text-xs lg:text-sm font-bold text-slate-600 shrink-0"
        >
          <button
            type="button"
            onClick={() => goToStep('photos')}
            className={`px-2.5 py-1.5 rounded-xl whitespace-nowrap shrink-0 transition-all cursor-pointer ${
              activeStep === 'photos'
                ? 'text-[#FF5A1F] bg-orange-50/90 border border-orange-200/80 shadow-2xs'
                : 'hover:text-[#FF5A1F] hover:bg-orange-50/40'
            }`}
          >
            <span className="xl:hidden">1. Photos ({photos.length})</span>
            <span className="hidden xl:inline">
              1. Add Photos ({photos.length})
            </span>
          </button>
          <button
            type="button"
            onClick={() => goToStep('preferences')}
            className={`px-2.5 py-1.5 rounded-xl whitespace-nowrap shrink-0 transition-all cursor-pointer ${
              activeStep === 'preferences'
                ? 'text-[#FF5A1F] bg-orange-50/90 border border-orange-200/80 shadow-2xs'
                : 'hover:text-[#FF5A1F] hover:bg-orange-50/40'
            }`}
          >
            <span className="lg:hidden">2. People ({servings})</span>
            <span className="hidden lg:inline">
              2. People &amp; Diet ({servings})
            </span>
          </button>
          <button
            type="button"
            onClick={() => goToStep('recipes')}
            className={`px-2.5 py-1.5 rounded-xl whitespace-nowrap shrink-0 transition-all cursor-pointer ${
              activeStep === 'recipes'
                ? 'text-[#FF5A1F] bg-orange-50/90 border border-orange-200/80 shadow-2xs'
                : 'hover:text-[#FF5A1F] hover:bg-orange-50/40'
            }`}
          >
            <span className="xl:hidden">3. Recipes ({recipes.length})</span>
            <span className="hidden xl:inline">
              3. Recipes &amp; Missing Items
            </span>
          </button>
          <button
            type="button"
            onClick={() => goToStep('cooking')}
            className={`px-2.5 py-1.5 rounded-xl whitespace-nowrap shrink-0 transition-all cursor-pointer ${
              activeStep === 'cooking'
                ? 'text-[#FF5A1F] bg-orange-50/90 border border-orange-200/80 shadow-2xs'
                : 'hover:text-[#FF5A1F] hover:bg-orange-50/40'
            }`}
          >
            <span className="xl:hidden">4. Cook</span>
            <span className="hidden xl:inline">4. Cooking Guide</span>
          </button>
        </nav>

        {/* Right Actions: Relaxing Click Sound Toggle + Install App */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setSoundEnabled((prev) => !prev)}
            className="min-h-[38px] sm:min-h-[40px] px-2.5 sm:px-3 py-1.5 rounded-xl border border-orange-200 bg-orange-50/70 hover:bg-orange-100 text-xs font-bold text-slate-700 flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
            aria-label={
              soundEnabled
                ? 'Mute relaxing button click sound'
                : 'Enable relaxing button click sound'
            }
          >
            {soundEnabled ? (
              <Volume2 className="w-4 h-4 text-[#FF5A1F] shrink-0" />
            ) : (
              <VolumeX className="w-4 h-4 text-slate-400 shrink-0" />
            )}
            <span className="hidden lg:inline">
              Sound: {soundEnabled ? 'On' : 'Off'}
            </span>
          </button>
          <PWAInstallModalTrigger variant="compact" />
        </div>
      </header>

      {/* Main Content Container */}
      <main className="max-w-6xl mx-auto px-3 sm:px-6 lg:px-8 pt-4 sm:pt-6">
        {/* Beginner-Friendly Purpose & "How SnapChef Helps You" Banner */}
        <section
          aria-label="What is SnapChef and How to Use It"
          className="rounded-3xl border-2 border-orange-200/80 bg-gradient-to-r from-orange-50 via-amber-50/70 to-emerald-50/70 p-4 sm:p-6 lg:p-7 shadow-xs"
        >
          <div className="max-w-3xl">
            <div className="flex items-center gap-2 text-xs font-extrabold text-[#FF5A1F] uppercase tracking-wide">
              <HelpCircle className="w-4 h-4 shrink-0" />
              <span>Welcome to SnapChef · Simple Kitchen Guide for Beginners</span>
            </div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-slate-900 mt-1.5 leading-tight">
              Turn Photos of Your Kitchen Ingredients into Easy Home-Cooked Meals
            </h1>
            <p className="text-xs sm:text-sm lg:text-base text-slate-700 mt-2 leading-relaxed">
              <strong>Purpose of this app:</strong> SnapChef helps anyone figure
              out what to cook when staring at random vegetables and spices in
              the kitchen. Just upload photos of each ingredient you have, tell
              us how many people you&apos;re cooking for and your diet, and we
              recommend delicious recipes—while clearly listing{' '}
              <strong>which extra vegetables or spices are lacking</strong> to
              complete each dish.
            </p>
          </div>

          {/* Interactive 3-Step Beginner Progress Bar */}
          <div className="mt-4 sm:mt-5 pt-4 border-t border-orange-200/60 grid grid-cols-1 md:grid-cols-3 gap-2.5 sm:gap-3">
            <button
              type="button"
              onClick={() => goToStep('photos')}
              className={`rounded-2xl border p-3 sm:p-3.5 text-left transition-all flex items-start gap-3 min-w-0 cursor-pointer ${
                activeStep === 'photos'
                  ? 'border-[#FF5A1F] bg-white shadow-sm'
                  : 'border-orange-200/70 bg-white/70 hover:bg-white'
              }`}
            >
              <span className="w-7 h-7 rounded-lg bg-[#FF5A1F] text-white font-extrabold text-xs flex items-center justify-center shrink-0">
                1
              </span>
              <div className="min-w-0">
                <p className="text-xs sm:text-sm font-extrabold text-slate-900 leading-snug">
                  Add Ingredient Photos
                </p>
                <p className="text-xs text-slate-600 mt-0.5 leading-snug">
                  Snap or upload multiple photos ({photos.length} added)
                </p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => goToStep('preferences')}
              className={`rounded-2xl border p-3 sm:p-3.5 text-left transition-all flex items-start gap-3 min-w-0 cursor-pointer ${
                activeStep === 'preferences'
                  ? 'border-[#FF5A1F] bg-white shadow-sm'
                  : 'border-orange-200/70 bg-white/70 hover:bg-white'
              }`}
            >
              <span className="w-7 h-7 rounded-lg bg-amber-500 text-white font-extrabold text-xs flex items-center justify-center shrink-0">
                2
              </span>
              <div className="min-w-0">
                <p className="text-xs sm:text-sm font-extrabold text-slate-900 leading-snug">
                  People Count &amp; Diet
                </p>
                <p className="text-xs text-slate-600 mt-0.5 leading-snug">
                  {servings} {servings === 1 ? 'Person' : 'People'} ·{' '}
                  {dietaryRestriction}
                </p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => goToStep('recipes')}
              className={`rounded-2xl border p-3 sm:p-3.5 text-left transition-all flex items-start gap-3 min-w-0 cursor-pointer ${
                activeStep === 'recipes' || activeStep === 'cooking'
                  ? 'border-[#FF5A1F] bg-white shadow-sm'
                  : 'border-orange-200/70 bg-white/70 hover:bg-white'
              }`}
            >
              <span className="w-7 h-7 rounded-lg bg-emerald-600 text-white font-extrabold text-xs flex items-center justify-center shrink-0">
                3
              </span>
              <div className="min-w-0">
                <p className="text-xs sm:text-sm font-extrabold text-slate-900 leading-snug">
                  Recipes &amp; Lacking Items
                </p>
                <p className="text-xs text-slate-600 mt-0.5 leading-snug">
                  {recipes.length} dishes + missing veg &amp; spices
                </p>
              </div>
            </button>
          </div>
        </section>

        {/* Optional Status Toast */}
        {statusToast && (
          <div
            role="status"
            className="mt-4 rounded-2xl border border-emerald-400 bg-emerald-50 px-4 py-3 text-xs sm:text-sm font-bold text-emerald-900 flex items-center justify-between gap-3"
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

        {/* Active Step View — Only 1 focused step visible at a time so beginners are never confused */}
        <div className="mt-6">
          {activeStep === 'photos' && (
            <CameraScannerEye
              photos={photos}
              onAddPhotoToTray={handleAddPhotoToTray}
              onRemovePhotoFromTray={handleRemovePhotoFromTray}
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

      {/* Simple Quiet Footer */}
      <footer className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 pt-6 border-t border-orange-200/60 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-600">
        <p>
          SnapChef — Simple Multi-Photo Ingredient Scanner & Recipe Guide
        </p>
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => goToStep('photos')}
            className="hover:text-[#FF5A1F] cursor-pointer"
          >
            1. Add Photos
          </button>
          <span aria-hidden="true">·</span>
          <button
            type="button"
            onClick={() => goToStep('preferences')}
            className="hover:text-[#FF5A1F] cursor-pointer"
          >
            2. People & Diet
          </button>
          <span aria-hidden="true">·</span>
          <button
            type="button"
            onClick={() => goToStep('recipes')}
            className="hover:text-[#FF5A1F] cursor-pointer"
          >
            3. Recipes
          </button>
        </div>
      </footer>

      <OfflineIndicator />

      {/* Mobile Bottom Navigation Bar */}
      <nav
        aria-label="Mobile Step Navigation"
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-orange-200 grid grid-cols-4 items-center h-14 pb-safe px-1 shadow-lg"
      >
        <button
          type="button"
          onClick={() => goToStep('photos')}
          className={`min-h-[44px] flex flex-col items-center justify-center cursor-pointer ${
            activeStep === 'photos'
              ? 'text-[#FF5A1F] font-bold'
              : 'text-slate-500'
          }`}
        >
          <Camera className="w-4 h-4" />
          <span className="text-[10px] mt-0.5">1. Photos</span>
        </button>

        <button
          type="button"
          onClick={() => goToStep('preferences')}
          className={`min-h-[44px] flex flex-col items-center justify-center cursor-pointer ${
            activeStep === 'preferences'
              ? 'text-amber-600 font-bold'
              : 'text-slate-500'
          }`}
        >
          <Users className="w-4 h-4" />
          <span className="text-[10px] mt-0.5">2. People</span>
        </button>

        <button
          type="button"
          onClick={() => goToStep('recipes')}
          className={`min-h-[44px] flex flex-col items-center justify-center cursor-pointer ${
            activeStep === 'recipes'
              ? 'text-emerald-600 font-bold'
              : 'text-slate-500'
          }`}
        >
          <ChefHat className="w-4 h-4" />
          <span className="text-[10px] mt-0.5">3. Recipes</span>
        </button>

        <button
          type="button"
          onClick={() => goToStep('cooking')}
          className={`min-h-[44px] flex flex-col items-center justify-center cursor-pointer ${
            activeStep === 'cooking'
              ? 'text-rose-600 font-bold'
              : 'text-slate-500'
          }`}
        >
          <Flame className="w-4 h-4" />
          <span className="text-[10px] mt-0.5">4. Cook</span>
        </button>
      </nav>
    </div>
  );
}
