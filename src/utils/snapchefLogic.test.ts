import test from 'node:test';
import assert from 'node:assert/strict';
import {
  normalizeSnapChefPayload,
  filterRecipes,
  deductInventoryAfterCrafting,
  mergeScannedInventory,
  formatTimerMMSS,
  calculatePantryTotals,
  computeMissingIngredientsForRecipe,
  scaleRecipeForPeopleAndDiet,
} from './snapchefLogic';

test('normalizeSnapChefPayload parses the exact PRD schema accurately', () => {
  const prdSample = {
    inventory: [
      {
        name: 'Potato',
        category: 'Vegetable',
        calories_per_100g: 77,
        macros: { protein_g: 2.0, carbs_g: 17.5, fat_g: 0.1 },
        health_benefits: [
          'High in potassium',
          'Source of Vitamin C and B6',
          'Contains digestive resistant starch',
        ],
        source_details:
          'Starchy tuberous root vegetable native to the Americas, widely cultivated as a global dietary staple.',
      },
    ],
    recipes: [
      {
        title: 'Aloo Jeera (Cumin Spiced Potatoes)',
        cuisine: 'Indian',
        meal_type: 'Lunch',
        prep_cook_minutes: 20,
        total_calories: 250,
        protein_g: 4.5,
        crafting_difficulty: 'Level 1',
        missing_vegetables: ['Fresh Coriander Leaves', 'Green Chili'],
        missing_spices: ['Garam Masala', 'Dry Mango Powder (Amchur)'],
        steps: [
          {
            instruction: 'Boil diced potatoes until tender.',
            timer_seconds: 720,
          },
          {
            instruction:
              'Temper cumin seeds in hot oil and toss with potatoes and spices.',
            timer_seconds: 180,
          },
        ],
      },
    ],
  };

  const normalized = normalizeSnapChefPayload(prdSample);
  assert.equal(normalized.inventory.length, 1);
  assert.equal(normalized.inventory[0].name, 'Potato');
  assert.equal(normalized.inventory[0].calories_per_100g, 77);
  assert.equal(normalized.inventory[0].macros.protein_g, 2.0);
  assert.equal(normalized.recipes.length, 1);
  assert.equal(normalized.recipes[0].title, 'Aloo Jeera (Cumin Spiced Potatoes)');
  assert.equal(normalized.recipes[0].steps[0].timer_seconds, 720);
  assert.deepEqual(normalized.recipes[0].used_ingredients, ['Potato']);
  assert.deepEqual(normalized.recipes[0].missing_vegetables, [
    'Fresh Coriander Leaves',
    'Green Chili',
  ]);
  assert.deepEqual(normalized.recipes[0].missing_spices, [
    'Garam Masala',
    'Dry Mango Powder (Amchur)',
  ]);
});

test('computeMissingIngredientsForRecipe identifies haveIngredients, missingVegetables, and missingSpices', () => {
  const payload = normalizeSnapChefPayload({
    inventory: [
      { name: 'Potato', category: 'Vegetable', calories_per_100g: 77 },
      { name: 'Cultured Creamery Butter', category: 'Dairy', calories_per_100g: 717 },
    ],
    recipes: [
      {
        title: 'Punjabi Jeera Butter Aloo',
        cuisine: 'Indian',
        meal_type: 'Lunch',
        prep_cook_minutes: 20,
        total_calories: 295,
        protein_g: 4.5,
        crafting_difficulty: 'Level 1',
        used_ingredients: ['Potato', 'Cultured Creamery Butter', 'Fresh Tomatoes'],
        missing_vegetables: ['Fresh Coriander Leaves (Cilantro)'],
        missing_spices: ['Whole Cumin Seeds (Jeera)', 'Garam Masala'],
        steps: [{ instruction: 'Sear potatoes in butter', timer_seconds: 180 }],
      },
    ],
  });

  const breakdown = computeMissingIngredientsForRecipe(
    payload.recipes[0],
    payload.inventory
  );

  assert.deepEqual(breakdown.haveIngredients, [
    'Potato',
    'Cultured Creamery Butter',
  ]);
  assert.equal(breakdown.missingVegetables.includes('Fresh Tomatoes'), true);
  assert.equal(
    breakdown.missingVegetables.includes('Fresh Coriander Leaves (Cilantro)'),
    true
  );
  assert.equal(
    breakdown.missingSpices.includes('Whole Cumin Seeds (Jeera)'),
    true
  );
});

test('scaleRecipeForPeopleAndDiet attaches servings and dietary tags', () => {
  const payload = normalizeSnapChefPayload({
    inventory: [{ name: 'Potato', category: 'Vegetable', calories_per_100g: 77 }],
    recipes: [
      {
        title: 'Masala Potato Skillet',
        cuisine: 'Indian',
        meal_type: 'Breakfast',
        prep_cook_minutes: 15,
        total_calories: 300,
        protein_g: 5,
        crafting_difficulty: 'Level 1',
        steps: [{ instruction: 'Cook potatoes', timer_seconds: 120 }],
      },
    ],
  });

  const scaled = scaleRecipeForPeopleAndDiet(
    payload.recipes[0],
    4,
    'Vegetarian'
  );
  assert.equal(scaled.servings, 4);
  assert.deepEqual(scaled.dietary_tags, ['Vegetarian']);
  assert.equal(scaled.chef_note?.includes('Scaled for 4 People (Vegetarian)'), true);
});

test('filterRecipes filters by meal_type, cuisine, and search query', () => {
  const payload = normalizeSnapChefPayload({
    inventory: [{ name: 'Potato', category: 'Vegetable', calories_per_100g: 77 }],
    recipes: [
      {
        title: 'Kanda Batata Poha',
        cuisine: 'Indian',
        meal_type: 'Breakfast',
        prep_cook_minutes: 15,
        total_calories: 290,
        protein_g: 6.2,
        crafting_difficulty: 'Level 1',
        steps: [{ instruction: 'Rinse poha', timer_seconds: 60 }],
      },
      {
        title: 'Spanish Tortilla de Patatas',
        cuisine: 'European',
        meal_type: 'Dinner',
        prep_cook_minutes: 25,
        total_calories: 380,
        protein_g: 14.0,
        crafting_difficulty: 'Level 2',
        steps: [{ instruction: 'Cook eggs and potato', timer_seconds: 300 }],
      },
    ],
  });

  const breakfastOnly = filterRecipes(payload.recipes, { mealType: 'Breakfast' });
  assert.equal(breakfastOnly.length, 1);
  assert.equal(breakfastOnly[0].title, 'Kanda Batata Poha');

  const europeanOnly = filterRecipes(payload.recipes, { cuisine: 'European' });
  assert.equal(europeanOnly.length, 1);
  assert.equal(europeanOnly[0].title, 'Spanish Tortilla de Patatas');

  const searchMatch = filterRecipes(payload.recipes, { searchQuery: 'tortilla' });
  assert.equal(searchMatch.length, 1);
});

test('deductInventoryAfterCrafting updates virtual pantry quantities and removes depleted items', () => {
  const initial = normalizeSnapChefPayload({
    inventory: [
      { name: 'Potato', category: 'Vegetable', quantity_g: 300, calories_per_100g: 77 },
      { name: 'Cumin Seeds', category: 'Spice', quantity_g: 80, calories_per_100g: 375 },
      { name: 'Spinach', category: 'Vegetable', quantity_g: 200, calories_per_100g: 23 },
    ],
    recipes: [],
  }).inventory;

  const { updatedInventory, consumedNames } = deductInventoryAfterCrafting(
    initial,
    ['Potato', 'Cumin Seeds'],
    100
  );

  assert.deepEqual(consumedNames, ['Potato', 'Cumin Seeds']);
  assert.equal(updatedInventory.length, 2);
  const potato = updatedInventory.find((i) => i.name === 'Potato');
  assert.equal(potato?.quantity_g, 200);
});

test('mergeScannedInventory combines duplicate ingredients by increasing quantity_g', () => {
  const existing = normalizeSnapChefPayload({
    inventory: [{ name: 'Potato', category: 'Vegetable', quantity_g: 250, calories_per_100g: 77 }],
    recipes: [],
  }).inventory;

  const incoming = normalizeSnapChefPayload({
    inventory: [
      { name: 'Potato', category: 'Vegetable', quantity_g: 200, calories_per_100g: 77 },
      { name: 'Tomato', category: 'Vegetable', quantity_g: 150, calories_per_100g: 18 },
    ],
    recipes: [],
  }).inventory;

  const merged = mergeScannedInventory(existing, incoming);
  assert.equal(merged.length, 2);
  assert.equal(merged.find((i) => i.name === 'Potato')?.quantity_g, 450);
});

test('formatTimerMMSS and calculatePantryTotals return accurate tabular numbers', () => {
  assert.equal(formatTimerMMSS(720), '12:00');
  assert.equal(formatTimerMMSS(185), '03:05');
  assert.equal(formatTimerMMSS(0), '00:00');

  const inv = normalizeSnapChefPayload({
    inventory: [
      {
        name: 'Potato',
        category: 'Vegetable',
        quantity_g: 200,
        calories_per_100g: 77,
        macros: { protein_g: 2.0, carbs_g: 17.5, fat_g: 0.1 },
      },
    ],
    recipes: [],
  }).inventory;

  const totals = calculatePantryTotals(inv);
  assert.equal(totals.totalItems, 1);
  assert.equal(totals.totalWeightG, 200);
  assert.equal(totals.totalCalories, 154);
  assert.equal(totals.totalProteinG, 4.0);
});
