import type {
  CapturedIngredientPhoto,
  InventoryItem,
  RecipeItem,
  SnapChefPayload,
} from '../types/snapchef';

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
    qualities: {
      texture_and_freshness:
        'Firm, high-dry-matter tuber with smooth skin and zero sprouting',
      flavor_profile:
        'Mild, earthy sweetness that absorbs spiced butter and aromatics deeply',
      cooking_behavior:
        'Forms a shatteringly crisp golden crust when pan-seared in butter while staying fluffy inside',
    },
    confidence: 99,
  },
  {
    id: 'inv-butter',
    name: 'Cultured Creamery Butter',
    category: 'Dairy',
    quantity_g: 200,
    unit_label: '1 chilled block',
    freshness_days: 30,
    calories_per_100g: 717,
    macros: { protein_g: 0.9, carbs_g: 0.1, fat_g: 81.1 },
    health_benefits: [
      'Rich in short-chain butyrate fatty acids supporting colonocytes and gut barrier integrity',
      'Provides fat-soluble Vitamins A, D, E, and K2 (menaquinone) for nutrient absorption',
      'Enhances bioavailability of fat-soluble curcuminoids and carotenoids in spices',
    ],
    source_details:
      'Churned bovine milkfat emulsion containing 81% butterfat, milk solids, and trace diacetyl aroma compounds.',
    qualities: {
      texture_and_freshness:
        'Velvety, plastic emulsion at cool room temperature with sweet cream aroma',
      flavor_profile:
        'Rich, nutty dairy notes that bloom into toasted hazelnut when browned (beurre noisette)',
      cooking_behavior:
        'Milk solids caramelize at 150°C, blooming whole cumin and turmeric spices instantly',
    },
    confidence: 99,
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
    qualities: {
      texture_and_freshness:
        'Whole volatile-oil-rich cumin seeds, vibrant golden turmeric, and crisp red onion layers',
      flavor_profile:
        'Warm, toasted-earthy cumin paired with peppery golden turmeric and sweet-savory allium',
      cooking_behavior:
        'Fat-soluble essential oils release within 15 seconds when tempered in hot melted butter',
    },
    confidence: 98,
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
    qualities: {
      texture_and_freshness:
        'Moist, springy, tightly knit milk curd block with clean milky scent',
      flavor_profile:
        'Delicate sweet-milk tang that acts as a high-protein sponge for spiced gravies',
      cooking_behavior:
        'Non-melting protein network sears to a golden crust on a hot griddle without losing shape',
    },
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
    qualities: {
      texture_and_freshness:
        'Thick, dome-standing amber yolks with tight, viscous albumen',
      flavor_profile:
        'Rich, savory yolk creaminess that emulsifies butter and starch dishes',
      cooking_behavior:
        'Albumen sets at 62°C while yolk thickens at 65°C for silky scrambles and frittatas',
    },
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
    qualities: {
      texture_and_freshness:
        'Crisp, turgid emerald leaves with tender edible stems',
      flavor_profile:
        'Clean, vegetal mineral sweetness without mature-leaf bitterness',
      cooking_behavior:
        'Wilts in 60 seconds in warm spiced butter while retaining bright chlorophyll color',
    },
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
    qualities: {
      texture_and_freshness:
        'Plump, creamy-centered legumes with intact skins',
      flavor_profile:
        'Nutty, chestnut-like savoriness that pairs with cumin, butter, and citrus',
      cooking_behavior:
        'Blisters to a crunchy exterior when pan-roasted or mashes into velvety stews',
    },
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
    qualities: {
      texture_and_freshness:
        'Glossy crimson skin with juicy, glutamate-rich seed gel',
      flavor_profile:
        'Bright malic/citric acidity balanced by natural fructose and umami',
      cooking_behavior:
        'Breaks down into a glossy, emulsified pan sauce when simmered with butter and spices',
    },
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
    qualities: {
      texture_and_freshness:
        'Dry, translucent medium-thick rice flakes that hydrate in 2 minutes',
      flavor_profile:
        'Toasted grain subtlety that carries turmeric, cumin, and potato',
      cooking_behavior:
        'Steams into light, fluffy individual grains after a brief colander rinse',
    },
    confidence: 95,
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
    qualities: {
      texture_and_freshness:
        'Fine, pre-gelatinized white maize meal with sweet roasted corn aroma',
      flavor_profile:
        'Warm toasted maize sweetness that pairs with melted butter and cheese',
      cooking_behavior:
        'Hydrates instantly in warm water to form pliable discs that crisp on a cast-iron skillet',
    },
    confidence: 94,
  },
];

export const POTATO_SPICES_BUTTER_RECIPES: RecipeItem[] = [
  {
    id: 'rec-masala-butter-potato-hash',
    title: 'Masala Butter Potato Hash (Crispy Aloo Makhan Nashta)',
    cuisine: 'Indian',
    meal_type: 'Breakfast',
    prep_cook_minutes: 15,
    total_calories: 310,
    protein_g: 4.8,
    carbs_g: 36.0,
    fat_g: 16.5,
    crafting_difficulty: 'Level 1',
    used_ingredients: [
      'Potato',
      'Cultured Creamery Butter',
      'Cumin, Turmeric & Red Onion Pantry Set',
    ],
    missing_vegetables: [
      'Fresh Coriander Leaves (Cilantro)',
      '1 Green Chili or Sweet Bell Pepper',
    ],
    missing_spices: [
      '1/2 tsp Garam Masala',
      '1/2 tsp Dry Mango Powder (Amchur) or Lemon Juice',
    ],
    chef_note:
      'Morning breakfast skillet using your Potatoes, Spices, and Butter: par-steamed potato dice seared in foaming cumin-turmeric butter.',
    steps: [
      {
        instruction:
          'Dice Potatoes into small 1cm breakfast hash cubes. Rinse in cold water to remove excess surface starch and pat thoroughly dry.',
        timer_seconds: 120,
        tip: 'Dry potato cubes crisp twice as fast when they hit the melted butter.',
      },
      {
        instruction:
          'Melt Cultured Creamery Butter in a wide skillet over medium heat. Add whole cumin seeds and finely diced red onion until golden and fragrant.',
        timer_seconds: 90,
      },
      {
        instruction:
          'Toss in the potato cubes, turmeric, chili flakes, and salt. Cover for 5 minutes to steam-soften, then uncover and crisp in the spiced butter for 4 minutes.',
        timer_seconds: 540,
        tip: 'Let the potatoes sit undisturbed for the final 2 minutes to develop a deep golden crust.',
      },
    ],
  },
  {
    id: 'rec-spiced-butter-rosti',
    title: 'Swiss-European Brown-Butter & Spiced Potato Rösti',
    cuisine: 'European',
    meal_type: 'Breakfast',
    prep_cook_minutes: 18,
    total_calories: 340,
    protein_g: 5.1,
    carbs_g: 38.5,
    fat_g: 18.0,
    crafting_difficulty: 'Level 2',
    used_ingredients: [
      'Potato',
      'Cultured Creamery Butter',
      'Cumin, Turmeric & Red Onion Pantry Set',
    ],
    missing_vegetables: [
      'Fresh Chives or Spring Onion Greens',
      '1 Clove Fresh Garlic',
    ],
    missing_spices: [
      'Freshly Cracked Black Pepper',
      'Pinch of Grated Nutmeg or Rosemary',
    ],
    chef_note:
      'Shredded potatoes bound by their own natural starch and pan-fried in nutty brown butter with warm aromatic spices.',
    steps: [
      {
        instruction:
          'Coarsely grate peeled Potatoes and squeeze out excess liquid in a clean kitchen towel. Toss with salt, black pepper, and a pinch of roasted cumin.',
        timer_seconds: 180,
      },
      {
        instruction:
          'Melt Cultured Creamery Butter in a skillet until it foams and smells nutty. Press the shredded potatoes into a flat, even pancake.',
        timer_seconds: 300,
      },
      {
        instruction:
          'Cook 5 minutes per side over medium heat, sliding a little extra butter around the rim until both sides are shatteringly crisp and golden brown.',
        timer_seconds: 300,
      },
    ],
  },
  {
    id: 'rec-aloo-jeera',
    title: 'Punjabi Jeera Butter Aloo (Cumin & Butter Seared Potatoes)',
    cuisine: 'Indian',
    meal_type: 'Lunch',
    prep_cook_minutes: 20,
    total_calories: 295,
    protein_g: 4.5,
    carbs_g: 38.0,
    fat_g: 14.5,
    crafting_difficulty: 'Level 1',
    used_ingredients: [
      'Potato',
      'Cultured Creamery Butter',
      'Cumin, Turmeric & Red Onion Pantry Set',
    ],
    missing_vegetables: [
      'Fresh Ginger (1 inch julienned)',
      'Fresh Coriander Leaves (Cilantro)',
    ],
    missing_spices: [
      '1 tsp Roasted Coriander Powder (Dhania)',
      'Dried Fenugreek Leaves (Kasuri Methi)',
    ],
    chef_note:
      'Cooling boiled potatoes briefly increases resistant starch and keeps edges crisp during cumin-butter tempering.',
    steps: [
      {
        instruction:
          'Peel and dice Potatoes into uniform 2cm cubes. Boil in salted water until fork-tender without breaking apart.',
        timer_seconds: 600,
        tip: 'Keep a clean edge on the cubes so they sear cleanly in the spiced butter.',
      },
      {
        instruction:
          'Melt Cultured Creamery Butter in a skillet over medium-high heat. Temper whole cumin seeds until they crackle and release roasted aroma.',
        timer_seconds: 45,
        tip: 'Watch for a golden-brown tint on the cumin seeds before adding turmeric.',
      },
      {
        instruction:
          'Toss drained potatoes into the foaming spiced butter with turmeric, crushed black pepper, and salt. Sear untouched for 90 seconds per side until golden crust forms.',
        timer_seconds: 180,
      },
    ],
  },
  {
    id: 'rec-patatas-bravas-butter',
    title: 'Iberian Patatas Bravas in Smoked Paprika & Garlic Butter',
    cuisine: 'European',
    meal_type: 'Lunch',
    prep_cook_minutes: 22,
    total_calories: 330,
    protein_g: 4.9,
    carbs_g: 39.0,
    fat_g: 17.2,
    crafting_difficulty: 'Level 2',
    used_ingredients: [
      'Potato',
      'Cultured Creamery Butter',
      'Cumin, Turmeric & Red Onion Pantry Set',
    ],
    missing_vegetables: [
      '2 Ripe Vine Tomatoes (for Bravas sauce)',
      '2 Cloves Fresh Garlic & Flat-Leaf Parsley',
    ],
    missing_spices: [
      '1 tsp Smoked Spanish Paprika (Pimentón)',
      'Pinch of Cayenne Pepper & Oregano',
    ],
    chef_note:
      'Crispy tavern-style potato wedges glazed in an emulsified warm spice and butter pan sauce.',
    steps: [
      {
        instruction:
          'Cut Potatoes into rustic 3cm wedges and parboil in salted water for 7 minutes until edges are slightly softened.',
        timer_seconds: 420,
      },
      {
        instruction:
          'Sear potato wedges in hot butter and oil until blistered and golden on all sides.',
        timer_seconds: 360,
      },
      {
        instruction:
          'Lower heat, add cold Cultured Creamery Butter and warm spices (cumin, paprika/chili, turmeric), and toss vigorously to glaze every wedge.',
        timer_seconds: 90,
      },
    ],
  },
  {
    id: 'rec-bombay-roast-potatoes',
    title: 'Bombay Spiced Fondant Potatoes in Golden Butter',
    cuisine: 'Indian',
    meal_type: 'Dinner',
    prep_cook_minutes: 25,
    total_calories: 360,
    protein_g: 5.2,
    carbs_g: 41.0,
    fat_g: 19.5,
    crafting_difficulty: 'Level 2',
    used_ingredients: [
      'Potato',
      'Cultured Creamery Butter',
      'Cumin, Turmeric & Red Onion Pantry Set',
    ],
    missing_vegetables: [
      'Fresh Curry Leaves or Cilantro Stems',
      '2 Cloves Crushed Garlic',
    ],
    missing_spices: [
      '1/2 tsp Black Mustard Seeds (Rai)',
      '1/2 tsp Kashmiri Red Chili Powder',
    ],
    chef_note:
      'Basting halved potatoes in foaming spiced butter creates a steakhouse-style crust with a melt-in-the-mouth center for dinner.',
    steps: [
      {
        instruction:
          'Halve Potatoes lengthwise and score the flat cut faces in a shallow diamond crosshatch pattern so spiced butter penetrates deep inside.',
        timer_seconds: 120,
      },
      {
        instruction:
          'Place cut-side down in a skillet with Cultured Creamery Butter over medium heat and sear for 8 minutes until deeply caramelized.',
        timer_seconds: 480,
      },
      {
        instruction:
          'Flip potatoes, add cumin, turmeric, and sliced red onion to the foaming butter, cover with a splash of water, and braise-baste until tender.',
        timer_seconds: 420,
      },
    ],
  },
  {
    id: 'rec-andean-papas-doradas',
    title: 'Andean Papas Doradas with Golden Turmeric-Cumin Butter',
    cuisine: 'South American',
    meal_type: 'Dinner',
    prep_cook_minutes: 20,
    total_calories: 325,
    protein_g: 4.8,
    carbs_g: 37.5,
    fat_g: 17.0,
    crafting_difficulty: 'Level 1',
    used_ingredients: [
      'Potato',
      'Cultured Creamery Butter',
      'Cumin, Turmeric & Red Onion Pantry Set',
    ],
    missing_vegetables: [
      '1 Fresh Lime & Scallions (Green Onions)',
      '1 Yellow Bell Pepper or Mild Chili',
    ],
    missing_spices: [
      'Ground Coriander & Smoked Paprika',
      'Coarse Sea Salt & Cracked Black Pepper',
    ],
    chef_note:
      'Inspired by Peruvian and Colombian highland skillet potatoes smashed and crisped in aromatic golden butter.',
    steps: [
      {
        instruction:
          'Boil whole or halved Potatoes in salted water until tender, then drain and gently smash each piece with the flat of a fork to create craggy edges.',
        timer_seconds: 600,
      },
      {
        instruction:
          'Sauté diced red onion, cumin, and turmeric in Cultured Creamery Butter over medium-high heat until glossy and aromatic.',
        timer_seconds: 120,
      },
      {
        instruction:
          'Add the smashed potatoes to the skillet and pan-roast in the spiced butter until the craggy edges turn crunchy and golden.',
        timer_seconds: 240,
      },
    ],
  },
];

export const INITIAL_RECIPES: RecipeItem[] = [
  ...POTATO_SPICES_BUTTER_RECIPES.slice(0, 3),
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
          'Finely dice 1 small Potato and red onion. Temper cumin seeds in hot butter or oil, then sauté onion and potato cubes until tender and lightly browned.',
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
      'Cultured Creamery Butter',
      'Cumin, Turmeric & Red Onion Pantry Set',
    ],
    chef_note:
      'Packs 26.5g of complete casein and whey protein per serving using your Fresh Paneer, Butter, and Baby Spinach.',
    steps: [
      {
        instruction:
          'Crumble 150g of Fresh Paneer by hand into coarse curds and chop Baby Spinach and Vine Tomatoes.',
        timer_seconds: 120,
      },
      {
        instruction:
          'Sauté diced red onion, cumin seeds, and chopped Vine Tomatoes in melted butter until tomatoes soften into a glossy masala base.',
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
      'Authentic Iberian tavern staple requiring only Eggs, Potatoes, Onion, butter/oil, and salt.',
    steps: [
      {
        instruction:
          'Thinly slice 200g Potatoes and half a red onion. Gently poach-fry them in butter and olive oil over medium-low heat until silky and tender.',
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
          'Finely julienne red onion and dice Vine Tomatoes. Toss with Cooked Chickpeas, salt, black pepper, and tangy citrus/tomato juice.',
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
    id: 'scene-potato-spices-butter',
    label: 'Potatoes, Spices & Butter Combo',
    subtitle: 'Instant Breakfast, Lunch & Dinner recipes from Potatoes, Spices & Butter',
    badge: '6 Meal Options',
    payload: {
      inventory: [
        INITIAL_INVENTORY[0], // Potato
        INITIAL_INVENTORY[1], // Cultured Creamery Butter
        INITIAL_INVENTORY[2], // Cumin, Turmeric & Red Onion Spices
      ],
      recipes: POTATO_SPICES_BUTTER_RECIPES,
      scan_summary:
        'Scanned Potatoes, Aromatic Spices (Cumin, Turmeric, Onion), and Cultured Creamery Butter — unlocked 6 Breakfast, Lunch, and Dinner dishes!',
      model_used: 'gemini-3.1-flash-lite',
    },
  },
  {
    id: 'scene-full-fridge',
    label: 'Full Kitchen Stock (10 Items)',
    subtitle: 'Potatoes, Butter, Spices, Paneer, Eggs, Spinach, Chickpeas & Poha',
    badge: '8 Global Dishes',
    payload: {
      inventory: INITIAL_INVENTORY,
      recipes: INITIAL_RECIPES,
      scan_summary:
        'Spatial scan identified 10 kitchen staples and synthesized Breakfast, Lunch, and Dinner options across Indian, European, and South American cuisines.',
      model_used: 'gemini-3.1-flash-lite',
    },
  },
  {
    id: 'scene-high-protein',
    label: 'High-Protein Shelf (Paneer, Eggs & Chickpeas)',
    subtitle: 'Complete vegetarian & egg protein synthesis with leafy greens',
    badge: '20g+ Protein/Meal',
    payload: {
      inventory: [
        INITIAL_INVENTORY[3], // Paneer
        INITIAL_INVENTORY[4], // Eggs
        INITIAL_INVENTORY[5], // Spinach
        INITIAL_INVENTORY[6], // Chickpeas
        INITIAL_INVENTORY[7], // Tomatoes
        INITIAL_INVENTORY[1], // Butter
        INITIAL_INVENTORY[2], // Spices
      ],
      recipes: [
        INITIAL_RECIPES[4],
        INITIAL_RECIPES[5],
        INITIAL_RECIPES[6],
        POTATO_SPICES_BUTTER_RECIPES[0],
      ],
      scan_summary:
        'High-protein shelf scan cataloged Fresh Paneer, Pasture-Raised Eggs, Chickpeas, Baby Spinach, and Butter.',
      model_used: 'gemini-3.1-flash-lite',
    },
  },
];

export function makeIngredientThumbSvg(
  title: string,
  subtitle: string,
  accentHex = '#FF5A1F',
  bgHex = '#FFF7ED'
): string {
  const safeTitle = title.replace(/&/g, '&amp;').slice(0, 26);
  const safeSub = subtitle.replace(/&/g, '&amp;').slice(0, 34);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="320" height="200" viewBox="0 0 320 200">
    <rect width="320" height="200" rx="18" fill="${bgHex}" />
    <rect x="8" y="8" width="304" height="184" rx="14" fill="none" stroke="${accentHex}" stroke-width="2.5" stroke-dasharray="6 4" opacity="0.55" />
    <circle cx="52" cy="64" r="24" fill="${accentHex}" opacity="0.16" />
    <circle cx="52" cy="64" r="10" fill="${accentHex}" />
    <text x="90" y="60" font-family="sans-serif" font-size="17" font-weight="800" fill="#0F172A">${safeTitle}</text>
    <text x="90" y="82" font-family="sans-serif" font-size="12" font-weight="600" fill="#475569">${safeSub}</text>
    <rect x="24" y="122" width="272" height="46" rx="10" fill="#FFFFFF" stroke="#E2E8F0" />
    <text x="38" y="150" font-family="monospace" font-size="12" font-weight="700" fill="${accentHex}">SNAPCHEF INGREDIENT PHOTO</text>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export const INITIAL_PHOTO_TRAY: CapturedIngredientPhoto[] = [
  {
    id: 'photo-1-potato',
    label: 'Photo #1: Potatoes (450g)',
    previewUrl: makeIngredientThumbSvg(
      'Fresh Potatoes',
      'Vegetable · 450g · 77 kcal/100g',
      '#EA580C',
      '#FFF7ED'
    ),
    detectedItems: [INITIAL_INVENTORY[0]],
    capturedAt: 'Photo 1',
  },
  {
    id: 'photo-2-butter',
    label: 'Photo #2: Cultured Creamery Butter',
    previewUrl: makeIngredientThumbSvg(
      'Creamery Butter',
      'Dairy · 200g · 717 kcal/100g',
      '#D97706',
      '#FEFCE8'
    ),
    detectedItems: [INITIAL_INVENTORY[1]],
    capturedAt: 'Photo 2',
  },
  {
    id: 'photo-3-spices',
    label: 'Photo #3: Cumin, Turmeric & Onion Spices',
    previewUrl: makeIngredientThumbSvg(
      'Cumin & Turmeric Spices',
      'Spices · 200g · 110 kcal/100g',
      '#059669',
      '#ECFDF5'
    ),
    detectedItems: [INITIAL_INVENTORY[2]],
    capturedAt: 'Photo 3',
  },
];


