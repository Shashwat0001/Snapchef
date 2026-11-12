import type { InventoryItem, RecipeItem, SnapChefPayload } from '../types/snapchef';

export const INITIAL_INVENTORY: InventoryItem[] = [
  {
    id: 'inv-potato',
    name: 'Potato',
    category: 'Vegetable',
    quantity_g: 450,
    unit_label: '3 medium tubers',
    freshness_days: 14,
    calories_per_100g: 77,
    macros: { protein_g: 2.0, carbs_g: 17.5, fat_g: 0.1 },
    health_benefits: [
      'High in potassium (421mg/100g) for neuromuscular recovery',
      'Source of Vitamin C and Vitamin B6 for cellular metabolism',
      'Contains digestive resistant starch supporting gut microbiota',
    ],
    source_details:
      'Solanum tuberosum — Starchy tuberous root vegetable native to the Andean highlands of the Americas, widely cultivated as a global dietary staple.',
    confidence: 99,
  },
  {
    id: 'inv-paneer',
    name: 'Fresh Paneer',
    category: 'Dairy',
    quantity_g: 250,
    unit_label: '1 block',
    freshness_days: 4,
    calories_per_100g: 265,
    macros: { protein_g: 18.3, carbs_g: 3.4, fat_g: 20.8 },
    health_benefits: [
      'Complete casein protein profile for sustained amino acid release',
      'Rich in bioavailable calcium and phosphorus for bone density',
      'Contains conjugated linoleic acid (CLA) supporting metabolic health',
    ],
    source_details:
      'Non-aged, non-melting acid-set farmer cheese native to the Indian subcontinent, coagulated from heated whole milk with food acid.',
    confidence: 98,
  },
  {
    id: 'inv-eggs',
    name: 'Pasture-Raised Eggs',
    category: 'Protein',
    quantity_g: 300,
    unit_label: '6 large eggs',
    freshness_days: 12,
    calories_per_100g: 143,
    macros: { protein_g: 12.6, carbs_g: 0.7, fat_g: 9.5 },
    health_benefits: [
      'High choline concentration (294mg/100g) for acetylcholine neurotransmission',
      'Lutein and zeaxanthin antioxidants for retinal protection',
      'Gold-standard biological value (BV 100) complete protein',
    ],
    source_details:
      'Gallus gallus domesticus ova — Nutrient-dense avian reproductive cell composed of a lipid-rich vitellus (yolk) suspended in ovalbumin protein.',
    confidence: 99,
  },
  {
    id: 'inv-spinach',
    name: 'Baby Spinach',
    category: 'Vegetable',
    quantity_g: 200,
    unit_label: '1 chilled bunch',
    freshness_days: 3,
    calories_per_100g: 23,
    macros: { protein_g: 2.9, carbs_g: 3.6, fat_g: 0.4 },
    health_benefits: [
      'Dietary nitrates enhance nitric oxide production and vascular blood flow',
      'Exceptionally dense in Vitamin K1, folate, and non-heme iron',
      'Rich in alpha-lipoic acid and kaempferol flavonoids',
    ],
    source_details:
      'Spinacia oleracea — Leafy green flowering plant native to central and western Asia belonging to the Amaranthaceae family.',
    confidence: 97,
  },
  {
    id: 'inv-chickpeas',
    name: 'Cooked Chickpeas',
    category: 'Legume',
    quantity_g: 350,
    unit_label: '1 jar drained',
    freshness_days: 6,
    calories_per_100g: 164,
    macros: { protein_g: 8.9, carbs_g: 27.4, fat_g: 2.6 },
    health_benefits: [
      'Soluble raffinose fiber stabilizes postprandial blood glucose curves',
      'Rich in manganese, folate, and plant-based iron',
      'Saponin phytonutrients support healthy lipid metabolism',
    ],
    source_details:
      'Cicer arietinum (Garbanzo) — Ancient Fabaceae pulse domesticated in the Fertile Crescent over 9,000 years ago.',
    confidence: 96,
  },
  {
    id: 'inv-tomato',
    name: 'Vine Tomatoes',
    category: 'Vegetable',
    quantity_g: 300,
    unit_label: '4 ripe tomatoes',
    freshness_days: 5,
    calories_per_100g: 18,
    macros: { protein_g: 0.9, carbs_g: 3.9, fat_g: 0.2 },
    health_benefits: [
      'Concentrated lycopene carotenoid with heat-enhanced bioavailability',
      'Provides potassium, Vitamin C, and naringenin chalcone',
      'High hydration index (94.5% water content) with minimal caloric load',
    ],
    source_details:
      'Solanum lycopersicum — Botanical berry of the nightshade family indigenous to western South America and domesticated in Mesoamerica.',
    confidence: 98,
  },
  {
    id: 'inv-poha',
    name: 'Flattened Rice (Poha)',
    category: 'Grain',
    quantity_g: 400,
    unit_label: '1 pantry pouch',
    freshness_days: 90,
    calories_per_100g: 346,
    macros: { protein_g: 6.6, carbs_g: 77.3, fat_g: 1.2 },
    health_benefits: [
      'Parboiling and rolling process retains B-complex vitamins and iron',
      'Rapidly digestible complex carbohydrates for morning glycogen replenishment',
      'Naturally gluten-free and gentle on gastrointestinal mucosa',
    ],
    source_details:
      'Oryza sativa de-husked grain parboiled, rolled, and flattened into dry light flakes; staple across Western and Central India.',
    confidence: 95,
  },
  {
    id: 'inv-black-beans',
    name: 'Black Turtle Beans',
    category: 'Legume',
    quantity_g: 300,
    unit_label: '1 cooked bowl',
    freshness_days: 5,
    calories_per_100g: 132,
    macros: { protein_g: 8.9, carbs_g: 23.7, fat_g: 0.5 },
    health_benefits: [
      'Seed coat anthocyanins (delphinidin, petunidin) provide potent antioxidant activity',
      'High magnesium and molybdenum content for enzymatic cofactors',
      'Slow-digesting amylose starch prevents insulin spikes',
    ],
    source_details:
      'Phaseolus vulgaris — Dense, shiny black legume native to the Americas and foundational to South American and Caribbean cuisines.',
    confidence: 96,
  },
  {
    id: 'inv-cornmeal',
    name: 'Precooked White Cornmeal (Masarepa)',
    category: 'Grain',
    quantity_g: 350,
    unit_label: '1 canister',
    freshness_days: 120,
    calories_per_100g: 365,
    macros: { protein_g: 7.5, carbs_g: 79.0, fat_g: 1.8 },
    health_benefits: [
      'Provides sustained complex carbohydrate energy without gluten proteins',
      'Contains ferulic acid and carotenoids supporting cellular defense',
      'Low sodium and low saturated fat whole-grain endosperm flour',
    ],
    source_details:
      'Zea mays — Hydro-thermally cooked, dried, and stone-ground white maize flour engineered for instant dough hydration in Colombian and Venezuelan arepas.',
    confidence: 94,
  },
  {
    id: 'inv-cumin-spices',
    name: 'Cumin, Turmeric & Red Onion Pantry Set',
    category: 'Spice',
    quantity_g: 200,
    unit_label: 'Masala & aromatics',
    freshness_days: 30,
    calories_per_100g: 110,
    macros: { protein_g: 3.5, carbs_g: 21.0, fat_g: 1.4 },
    health_benefits: [
      'Cuminaldehyde stimulates pancreatic digestive enzyme secretion',
      'Curcuminoids and quercetin modulate inflammatory pathways',
      'Organosulfur compounds support cardiovascular endothelial health',
    ],
    source_details:
      'Cuminum cyminum seeds, Curcuma longa rhizome powder, and Allium cepa bulbs — foundational aromatic triad for tempering (tadka) and sofrito.',
    confidence: 97,
  },
];

export const INITIAL_RECIPES: RecipeItem[] = [
  {
    id: 'rec-aloo-jeera',
    title: 'Aloo Jeera (Cumin Spiced Potatoes)',
    cuisine: 'Indian',
    meal_type: 'Lunch',
    prep_cook_minutes: 20,
    total_calories: 250,
    protein_g: 4.5,
    carbs_g: 38.0,
    fat_g: 8.5,
    crafting_difficulty: 'Level 1',
    used_ingredients: ['Potato', 'Cumin, Turmeric & Red Onion Pantry Set'],
    chef_note:
      'Zero missing ingredients. Cooling boiled potatoes briefly increases resistant starch and keeps edges crisp during cumin tempering.',
    steps: [
      {
        instruction:
          'Peel and dice 300g of Potatoes into uniform 2cm cubes. Boil in salted water until fork-tender without breaking apart.',
        timer_seconds: 720,
        tip: 'Keep a clean edge on the cubes so they sear cleanly in the spice oil.',
      },
      {
        instruction:
          'Heat 1 tbsp oil in a skillet over medium-high heat. Temper whole cumin seeds until they crackle and release roasted aroma.',
        timer_seconds: 45,
        tip: 'Watch for a golden-brown tint on the cumin seeds before adding turmeric.',
      },
      {
        instruction:
          'Toss drained potatoes into the infused oil with turmeric, crushed black pepper, and salt. Sear untouched for 90 seconds per side until golden crust forms.',
        timer_seconds: 180,
        tip: 'Finish with a squeeze of lemon or fresh greens if desired.',
      },
    ],
  },
  {
    id: 'rec-kanda-batata-poha',
    title: 'Kanda Batata Poha (Flattened Rice & Potato Skillet)',
    cuisine: 'Indian',
    meal_type: 'Breakfast',
    prep_cook_minutes: 15,
    total_calories: 320,
    protein_g: 7.4,
    carbs_g: 56.0,
    fat_g: 7.2,
    crafting_difficulty: 'Level 1',
    used_ingredients: [
      'Flattened Rice (Poha)',
      'Potato',
      'Cumin, Turmeric & Red Onion Pantry Set',
    ],
    chef_note:
      'Classic Maharashtrian morning fuel using your Flattened Rice, Potato, and Cumin/Turmeric pantry aromatics.',
    steps: [
      {
        instruction:
          'Rinse 150g Flattened Rice (Poha) gently in a colander under running water for 20 seconds, then let it rest to absorb surface moisture and fluff up.',
        timer_seconds: 180,
        tip: 'Never soak poha submerged in water—rinsing and resting keeps every flake separate.',
      },
      {
        instruction:
          'Finely dice 1 small Potato and red onion. Temper cumin seeds in hot oil, then sauté onion and potato cubes until tender and lightly browned.',
        timer_seconds: 300,
      },
      {
        instruction:
          'Fold in turmeric, salt, and the hydrated poha flakes. Cover and steam on low heat so flavors meld evenly.',
        timer_seconds: 120,
      },
    ],
  },
  {
    id: 'rec-palak-paneer-bhurji',
    title: 'High-Protein Palak Paneer Bhurji (Spiced Spinach & Paneer Scramble)',
    cuisine: 'Indian',
    meal_type: 'Dinner',
    prep_cook_minutes: 18,
    total_calories: 410,
    protein_g: 26.5,
    carbs_g: 14.2,
    fat_g: 27.0,
    crafting_difficulty: 'Level 2',
    used_ingredients: [
      'Fresh Paneer',
      'Baby Spinach',
      'Vine Tomatoes',
      'Cumin, Turmeric & Red Onion Pantry Set',
    ],
    chef_note:
      'Packs 26.5g of complete casein and whey protein per serving using your Fresh Paneer and Baby Spinach.',
    steps: [
      {
        instruction:
          'Crumble 150g of Fresh Paneer by hand into coarse curds and chop Baby Spinach and Vine Tomatoes.',
        timer_seconds: 120,
      },
      {
        instruction:
          'Sauté diced red onion, cumin seeds, and chopped Vine Tomatoes in a pan until tomatoes soften into a glossy masala base.',
        timer_seconds: 300,
      },
      {
        instruction:
          'Fold in Baby Spinach until wilted, then add crumbled Paneer and simmer gently for 3 minutes so the cheese stays pillowy and moist.',
        timer_seconds: 180,
        tip: 'Avoid overcooking paneer beyond 3 minutes to preserve its tender texture.',
      },
    ],
  },
  {
    id: 'rec-spanish-tortilla',
    title: 'Tortilla Española (Rustic Spanish Potato & Onion Frittata)',
    cuisine: 'European',
    meal_type: 'Breakfast',
    prep_cook_minutes: 25,
    total_calories: 390,
    protein_g: 19.8,
    carbs_g: 26.5,
    fat_g: 22.0,
    crafting_difficulty: 'Level 3',
    used_ingredients: [
      'Pasture-Raised Eggs',
      'Potato',
      'Cumin, Turmeric & Red Onion Pantry Set',
    ],
    chef_note:
      'Authentic Iberian tavern staple requiring only Eggs, Potatoes, Onion, oil, and salt.',
    steps: [
      {
        instruction:
          'Thinly slice 200g Potatoes and half a red onion. Gently poach-fry them in olive oil over medium-low heat until silky and tender.',
        timer_seconds: 600,
      },
      {
        instruction:
          'Whisk 3 Pasture-Raised Eggs with a pinch of salt in a bowl. Fold the warm drained potatoes and onions into the eggs and let sit to infuse.',
        timer_seconds: 180,
        tip: 'Resting the warm potatoes in raw beaten egg thickens the custard before it hits the pan.',
      },
      {
        instruction:
          'Pour into a non-stick skillet over medium-low heat, cook until edges set, flip with a plate, and cook the reverse side for a creamy center.',
        timer_seconds: 240,
      },
    ],
  },
  {
    id: 'rec-mediterranean-chickpea-bowl',
    title: 'Mediterranean Warm Chickpea, Spinach & Egg Skillet',
    cuisine: 'European',
    meal_type: 'Lunch',
    prep_cook_minutes: 16,
    total_calories: 375,
    protein_g: 21.4,
    carbs_g: 34.0,
    fat_g: 15.2,
    crafting_difficulty: 'Level 2',
    used_ingredients: [
      'Cooked Chickpeas',
      'Baby Spinach',
      'Vine Tomatoes',
      'Pasture-Raised Eggs',
    ],
    chef_note:
      'High-fiber, high-choline Mediterranean skillet combining legumes, leafy greens, lycopene-rich tomatoes, and poached eggs.',
    steps: [
      {
        instruction:
          'Pan-roast 150g drained Cooked Chickpeas with cumin and diced Vine Tomatoes until chickpeas blister and tomatoes release their juices.',
        timer_seconds: 300,
      },
      {
        instruction:
          'Stir in 100g Baby Spinach until just wilted and make two wells in the skillet.',
        timer_seconds: 90,
      },
      {
        instruction:
          'Crack 2 Pasture-Raised Eggs into the wells, cover the skillet, and steam-poach until whites are set and yolks remain golden and runny.',
        timer_seconds: 210,
      },
    ],
  },
  {
    id: 'rec-arepas-domino',
    title: 'Arepas Domino con Caraotas (Griddled Corn Cakes & Spiced Black Beans)',
    cuisine: 'South American',
    meal_type: 'Dinner',
    prep_cook_minutes: 22,
    total_calories: 445,
    protein_g: 22.0,
    carbs_g: 58.0,
    fat_g: 12.5,
    crafting_difficulty: 'Level 2',
    used_ingredients: [
      'Precooked White Cornmeal (Masarepa)',
      'Black Turtle Beans',
      'Fresh Paneer',
      'Cumin, Turmeric & Red Onion Pantry Set',
    ],
    chef_note:
      'Traditional Venezuelan & Colombian griddled corn cakes stuffed with savory black beans and crumbled fresh farmer cheese.',
    steps: [
      {
        instruction:
          'Hydrate 120g Precooked White Cornmeal (Masarepa) in warm salted water, knead for 2 minutes, and rest so the corn flour absorbs water evenly.',
        timer_seconds: 300,
      },
      {
        instruction:
          'Shape into two flat discs and sear on a lightly oiled cast-iron skillet over medium heat until golden-brown crusts form on both sides.',
        timer_seconds: 480,
      },
      {
        instruction:
          'Simmer Black Turtle Beans with diced onion, tomato, and cumin until thick. Split warm arepas open and stuff with beans and crumbled Fresh Paneer.',
        timer_seconds: 240,
      },
    ],
  },
  {
    id: 'rec-andean-chickpea-ceviche',
    title: 'Andean Citrus Tomato & Chickpea Ceviche Fresco',
    cuisine: 'South American',
    meal_type: 'Lunch',
    prep_cook_minutes: 12,
    total_calories: 265,
    protein_g: 11.2,
    carbs_g: 41.0,
    fat_g: 5.4,
    crafting_difficulty: 'Level 1',
    used_ingredients: [
      'Cooked Chickpeas',
      'Vine Tomatoes',
      'Potato',
      'Cumin, Turmeric & Red Onion Pantry Set',
    ],
    chef_note:
      'Refreshing Peruvian-inspired plant-based ceviche served alongside boiled potato medallions.',
    steps: [
      {
        instruction:
          'Slice 100g Potato into thick medallions and boil in salted water until tender, then chill briefly.',
        timer_seconds: 480,
      },
      {
        instruction:
          'Finely julienne red onion and dice Vine Tomatoes. Toss with Cooked Chickpeas, salt, black pepper, and tangy citrus/tomato juice (leche de tigre style).',
        timer_seconds: 180,
      },
      {
        instruction:
          'Let marinate for 2 minutes so the onions mellow and chickpeas absorb the bright marinade, then plate over potato medallions.',
        timer_seconds: 120,
      },
    ],
  },
];

export interface ScanPresetScene {
  id: string;
  label: string;
  subtitle: string;
  badge: string;
  payload: SnapChefPayload;
}

export const SCAN_PRESET_SCENES: ScanPresetScene[] = [
  {
    id: 'scene-full-fridge',
    label: 'Full Kitchen Stock (10 Items)',
    subtitle: 'Vegetables, Paneer, Eggs, Chickpeas, Poha & Masarepa',
    badge: '7 Global Dishes Ready',
    payload: {
      inventory: INITIAL_INVENTORY,
      recipes: INITIAL_RECIPES,
      scan_summary:
        'Real2Sim spatial scan identified 10 overlapping perishables and pantry staples across Indian, European, and South American culinary profiles.',
      model_used: 'gemini-4-argon',
    },
  },
  {
    id: 'scene-prd-potato',
    label: 'PRD Codex Benchmark (Potato & Spices)',
    subtitle: 'Exact PRD Schema verification: Potato + Aloo Jeera & Tortilla',
    badge: 'PRD Spec Match',
    payload: {
      inventory: [
        INITIAL_INVENTORY[0],
        INITIAL_INVENTORY[2],
        INITIAL_INVENTORY[6],
        INITIAL_INVENTORY[9],
      ],
      recipes: [
        INITIAL_RECIPES[0],
        INITIAL_RECIPES[1],
        INITIAL_RECIPES[3],
      ],
      scan_summary:
        'Targeted vegetable basket scan detected Solanum tuberosum (Potato), Pasture-Raised Eggs, Poha, and Cumin tempering spices.',
      model_used: 'gemini-4-argon',
    },
  },
  {
    id: 'scene-high-protein',
    label: 'Athlete Macro Shelf (Paneer, Eggs & Beans)',
    subtitle: 'High-protein vegetarian & legume synthesis',
    badge: '20g+ Protein/Meal',
    payload: {
      inventory: [
        INITIAL_INVENTORY[1],
        INITIAL_INVENTORY[2],
        INITIAL_INVENTORY[3],
        INITIAL_INVENTORY[4],
        INITIAL_INVENTORY[5],
        INITIAL_INVENTORY[7],
        INITIAL_INVENTORY[8],
        INITIAL_INVENTORY[9],
      ],
      recipes: [
        INITIAL_RECIPES[2],
        INITIAL_RECIPES[4],
        INITIAL_RECIPES[5],
      ],
      scan_summary:
        'High-protein shelf scan cataloged Fresh Paneer, Pasture-Raised Eggs, Chickpeas, Black Beans, and Baby Spinach.',
      model_used: 'gemini-4-argon',
    },
  },
];
