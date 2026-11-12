export type IngredientCategory =
  | 'Vegetable'
  | 'Protein'
  | 'Grain'
  | 'Dairy'
  | 'Spice'
  | 'Fruit'
  | 'Condiment'
  | 'Legume';

export type MealType = 'Breakfast' | 'Lunch' | 'Dinner';

export type CuisineRegion =
  | 'Indian'
  | 'European'
  | 'South American'
  | 'East Asian'
  | 'Mediterranean'
  | 'Global';

export type CraftingDifficulty =
  | 'Level 1'
  | 'Level 2'
  | 'Level 3'
  | 'Level 4'
  | 'Level 5';

export type DietaryRestriction =
  | 'No Restrictions'
  | 'Vegetarian'
  | 'Vegan'
  | 'Gluten-Free'
  | 'High-Protein'
  | 'Jain (No Onion/Garlic)'
  | 'Low-Carb';

export interface MacroProfile {
  protein_g: number;
  carbs_g: number;
  fat_g: number;
}

export interface IngredientQualities {
  texture_and_freshness: string;
  flavor_profile: string;
  cooking_behavior: string;
}

export interface InventoryItem {
  id: string;
  name: string;
  category: IngredientCategory | string;
  quantity_g: number;
  unit_label?: string;
  freshness_days?: number;
  calories_per_100g: number;
  macros: MacroProfile;
  health_benefits: string[];
  source_details: string;
  qualities?: IngredientQualities;
  confidence?: number;
}

export interface CapturedIngredientPhoto {
  id: string;
  label: string;
  previewUrl: string;
  detectedItems: InventoryItem[];
  capturedAt: string;
}

export interface RecipeStep {
  instruction: string;
  timer_seconds: number;
  tip?: string;
}

export interface RecipeItem {
  id: string;
  title: string;
  cuisine: CuisineRegion | string;
  meal_type: MealType | string;
  prep_cook_minutes: number;
  total_calories: number;
  protein_g: number;
  carbs_g?: number;
  fat_g?: number;
  crafting_difficulty: CraftingDifficulty | string;
  used_ingredients: string[];
  missing_vegetables?: string[];
  missing_spices?: string[];
  servings?: number;
  dietary_tags?: string[];
  steps: RecipeStep[];
  chef_note?: string;
}

export interface SnapChefPayload {
  inventory: InventoryItem[];
  recipes: RecipeItem[];
  scan_summary?: string;
  model_used?: string;
}

export interface CraftedMealLog {
  id: string;
  recipeId: string;
  title: string;
  cuisine: string;
  meal_type: string;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  completedAt: string;
  consumedIngredients: string[];
}
