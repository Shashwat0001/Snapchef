import 'dotenv/config';
import express from 'express';
import type { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type, ThinkingLevel } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function getGenAIClient(): GoogleGenAI {
  return new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

const SNAPCHEF_RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    scan_summary: {
      type: Type.STRING,
      description:
        'Brief summary of the spatial ingredient scan and culinary synthesis.',
    },
    inventory: {
      type: Type.ARRAY,
      description:
        'Catalog of detected or analyzed kitchen ingredients with nutritional and botanical codex profiles.',
      items: {
        type: Type.OBJECT,
        properties: {
          name: {
            type: Type.STRING,
            description: 'Clear culinary name of the ingredient (e.g., Potato, Fresh Paneer).',
          },
          category: {
            type: Type.STRING,
            description:
              'Category: Vegetable, Protein, Grain, Dairy, Spice, Legume, Fruit, or Condiment.',
          },
          quantity_g: {
            type: Type.INTEGER,
            description: 'Estimated available weight in grams (e.g., 250).',
          },
          unit_label: {
            type: Type.STRING,
            description: 'Human-readable unit count (e.g., 3 medium tubers, 1 block).',
          },
          freshness_days: {
            type: Type.INTEGER,
            description: 'Estimated days of peak freshness remaining.',
          },
          calories_per_100g: {
            type: Type.INTEGER,
            description: 'Exact kcal per standard 100g serving.',
          },
          macros: {
            type: Type.OBJECT,
            properties: {
              protein_g: {
                type: Type.NUMBER,
                description: 'Grams of protein per 100g serving.',
              },
              carbs_g: {
                type: Type.NUMBER,
                description: 'Grams of carbohydrates per 100g serving.',
              },
              fat_g: {
                type: Type.NUMBER,
                description: 'Grams of fat per 100g serving.',
              },
            },
            required: ['protein_g', 'carbs_g', 'fat_g'],
          },
          health_benefits: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description:
              'Specific micronutrients and physiological health benefits (e.g., High in potassium for muscle recovery, Source of Vitamin C and B6, Contains digestive resistant starch).',
          },
          source_details: {
            type: Type.STRING,
            description:
              'Botanical or culinary origin, scientific classification, and composition details.',
          },
          qualities: {
            type: Type.OBJECT,
            description:
              'Specific physical, aromatic, and culinary qualities observed when holding the camera over the ingredient.',
            properties: {
              texture_and_freshness: {
                type: Type.STRING,
                description:
                  'Physical texture, moisture, skin/surface integrity, and ripeness/freshness indicators.',
              },
              flavor_profile: {
                type: Type.STRING,
                description:
                  'Tasting notes, aroma compounds, sweetness/umami/spice balance.',
              },
              cooking_behavior: {
                type: Type.STRING,
                description:
                  'How this ingredient behaves under heat (e.g., Maillard browning, starch gelatinization, fat-soluble spice blooming, emulsification).',
              },
            },
            required: [
              'texture_and_freshness',
              'flavor_profile',
              'cooking_behavior',
            ],
          },
          confidence: {
            type: Type.INTEGER,
            description: 'Spatial recognition confidence percentage (85-100).',
          },
        },
        required: [
          'name',
          'category',
          'calories_per_100g',
          'macros',
          'health_benefits',
          'source_details',
          'qualities',
        ],
      },
    },
    recipes: {
      type: Type.ARRAY,
      description:
        'Zero-missing-ingredient recipes synthesized across Breakfast, Lunch, and Dinner using the scanned ingredients.',
      items: {
        type: Type.OBJECT,
        properties: {
          title: {
            type: Type.STRING,
            description: 'Authentic dish title (e.g., Aloo Jeera (Cumin Spiced Potatoes)).',
          },
          cuisine: {
            type: Type.STRING,
            description: 'Cuisine origin: Indian, European, South American, or Global.',
          },
          meal_type: {
            type: Type.STRING,
            description: 'Meal intent: Breakfast, Lunch, or Dinner.',
          },
          prep_cook_minutes: {
            type: Type.INTEGER,
            description: 'Total preparation and cooking time in minutes.',
          },
          total_calories: {
            type: Type.INTEGER,
            description: 'Estimated total calories per serving.',
          },
          protein_g: {
            type: Type.NUMBER,
            description: 'Grams of protein per serving.',
          },
          carbs_g: {
            type: Type.NUMBER,
            description: 'Grams of carbohydrates per serving.',
          },
          fat_g: {
            type: Type.NUMBER,
            description: 'Grams of fat per serving.',
          },
          crafting_difficulty: {
            type: Type.STRING,
            description: 'Gamified difficulty rating: Level 1, Level 2, Level 3, Level 4, or Level 5.',
          },
          used_ingredients: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: 'Names of inventory ingredients used in this dish.',
          },
          chef_note: {
            type: Type.STRING,
            description: 'Brief culinary science note on flavor pairing or nutrition.',
          },
          steps: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                instruction: {
                  type: Type.STRING,
                  description: 'Focused, clear step-by-step flashcard instruction.',
                },
                timer_seconds: {
                  type: Type.INTEGER,
                  description:
                    'Duration in seconds for active cooking/boiling/sautéing/simmering steps (e.g., 720 for 12 minutes, 180 for 3 minutes, or 0 if no timer needed).',
                },
                tip: {
                  type: Type.STRING,
                  description: 'Optional tactical pro-tip for this step.',
                },
              },
              required: ['instruction', 'timer_seconds'],
            },
          },
        },
        required: [
          'title',
          'cuisine',
          'meal_type',
          'prep_cook_minutes',
          'total_calories',
          'protein_g',
          'crafting_difficulty',
          'steps',
        ],
      },
    },
  },
  required: ['inventory', 'recipes'],
};

const SYSTEM_INSTRUCTION = `You are SnapChef, an AI Kitchen Inventory & Global Recipe Synthesizer.
Your mission:
1. Examine the camera capture, uploaded photo, or ingredient list and identify EVERY food item, produce, dairy/butter, spice, protein, grain, or culinary ingredient present (for example: Potatoes, Spices, and Butter together).
2. For each detected item, provide:
   - Accurate nutritional breakdown per 100g (calories_per_100g, protein_g, carbs_g, fat_g)
   - Specific 'qualities': texture_and_freshness, flavor_profile, and cooking_behavior
   - 3 specific physiological/micronutrient health_benefits and a botanical/culinary source_details profile.
3. Synthesize 6 practical, mouth-watering dishes specifically using the scanned ingredients together across Breakfast (2 recipes), Lunch (2 recipes), and Dinner (2 recipes) across Indian, European, South American, and Global cuisines.
4. Assign a crafting_difficulty ("Level 1" to "Level 5") and break instructions into focused flashcards with accurate timer_seconds for cooking steps.
Always respond with valid JSON matching the requested schema.`;

function parseGeminiJson(rawText: string): Record<string, unknown> {
  const cleaned = rawText
    .trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();
  return JSON.parse(cleaned);
}

async function callGeminiWithFallback(
  contents: unknown,
  schema = SNAPCHEF_RESPONSE_SCHEMA
): Promise<{ text: string; modelUsed: string }> {
  const ai = getGenAIClient();
  const modelsToTry: Array<{
    name: string;
    thinkingLevel?: ThinkingLevel;
  }> = [
    { name: 'gemini-3.1-flash-lite' },
    { name: 'gemini-2.5-flash' },
    { name: 'gemini-3.8-flash', thinkingLevel: ThinkingLevel.LOW },
    { name: 'gemini-4-argon', thinkingLevel: ThinkingLevel.LOW },
  ];
  let lastError: unknown = null;

  for (const modelSpec of modelsToTry) {
    try {
      const response = await ai.models.generateContent({
        model: modelSpec.name,
        contents: contents as Parameters<typeof ai.models.generateContent>[0]['contents'],
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
          responseMimeType: 'application/json',
          responseSchema: schema,
          ...(modelSpec.thinkingLevel
            ? { thinkingConfig: { thinkingLevel: modelSpec.thinkingLevel } }
            : {}),
        },
      });

      if (response.text) {
        return { text: response.text, modelUsed: modelSpec.name };
      }
    } catch (err) {
      lastError = err;
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error('Failed to generate content from Gemini API.');
}

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json({ limit: '15mb' }));

  // Prevent 404 console error on /favicon.ico
  app.get('/favicon.ico', (_req: Request, res: Response) => {
    res.redirect(302, '/icon.svg');
  });

  // Serve Web App Manifest cleanly in both dev and prod
  app.get('/manifest.webmanifest', (_req: Request, res: Response) => {
    res.type('application/manifest+json').json({
      id: '/',
      name: 'SnapChef — AI Kitchen Inventory & Recipe Synthesizer',
      short_name: 'SnapChef',
      description:
        'Joyful AI smart kitchen inventory scanner, ingredient codex, and global recipe synthesizer.',
      start_url: '/',
      scope: '/',
      display: 'standalone',
      background_color: '#FFFDF9',
      theme_color: '#FF5A1F',
      icons: [
        {
          src: '/pwa-192x192.png',
          sizes: '192x192',
          type: 'image/png',
          purpose: 'any',
        },
        {
          src: '/pwa-512x512.png',
          sizes: '512x512',
          type: 'image/png',
          purpose: 'any',
        },
        {
          src: '/pwa-maskable-512x512.png',
          sizes: '512x512',
          type: 'image/png',
          purpose: 'maskable',
        },
      ],
    });
  });

  // Gracefully self-unregister any previously cached dev-sw.js or workbox scripts
  // so existing browser sessions never log Workbox errors or 404s
  app.get(['/dev-sw.js', '/registerSW.js'], (_req: Request, res: Response) => {
    res
      .type('application/javascript')
      .send(
        `if (typeof self !== 'undefined' && self.registration) { self.registration.unregister(); }`
      );
  });

  app.post('/api/scan-image', async (req: Request, res: Response) => {
    try {
      const {
        imageBase64,
        mimeType = 'image/jpeg',
        mealIntent = 'All',
        isSimulatedFallback = false,
        focusHint = '',
      } = req.body || {};
      if (!imageBase64 || typeof imageBase64 !== 'string') {
        res.status(200).json({
          fallback: true,
          error_notice: 'Missing imageBase64 payload for camera scan.',
          inventory: [],
          recipes: [],
        });
        return;
      }

      const cleanBase64 = imageBase64.replace(/^data:[^;]+;base64,/, '');
      const fallbackTarget =
        typeof focusHint === 'string' && focusHint.trim()
          ? focusHint.trim()
          : 'Potatoes, Aromatic Spices (Cumin, Turmeric, Chili), and Cultured Creamery Butter';

      const promptText = isSimulatedFallback
        ? `Analyze this kitchen capture focusing on: ${fallbackTarget}. Extract the ingredients into the 'inventory' array with complete 100g macros, specific qualities (texture_and_freshness, flavor_profile, cooking_behavior), health benefits, and source details, plus 6 recipes (2 Breakfast, 2 Lunch, 2 Dinner) across Indian, European, and South American cuisines.`
        : `Look closely at the food ingredients in this photo or camera frame.
1. Identify EVERY food item, vegetable (like Potatoes), dairy/fat (like Butter, Paneer, Cheese), spice (like Cumin, Turmeric, Paprika, Herbs), protein, fruit, or pantry item visible together in the frame.
2. If the camera image is dim, blurry, close-up, or partially obscured, use your best culinary vision and the active kitchen lens hint ("${fallbackTarget}") so the user ALWAYS gets a complete, helpful analysis of their ingredients (NEVER return an empty inventory array).
3. For each detected ingredient, populate 'inventory' with:
   - Accurate calories_per_100g and macros (protein_g, carbs_g, fat_g)
   - Specific 'qualities' (texture_and_freshness, flavor_profile, cooking_behavior)
   - 3 specific health_benefits and source_details.
4. Synthesize 6 delicious, practical recipes using these exact scanned ingredients together — 2 for Breakfast, 2 for Lunch, and 2 for Dinner${
            mealIntent !== 'All' ? ` (highlighting ${mealIntent})` : ''
          } — across Indian, European, and South American cuisines!`;

      const { text, modelUsed } = await callGeminiWithFallback({
        parts: [
          {
            inlineData: {
              mimeType,
              data: cleanBase64,
            },
          },
          { text: promptText },
        ],
      });

      const parsed = parseGeminiJson(text);
      res.json({ ...parsed, model_used: modelUsed });
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Unexpected error during image scan.';
      res.status(200).json({
        fallback: true,
        error_notice: message,
        inventory: [],
        recipes: [],
      });
    }
  });

  app.post('/api/synthesize-recipes', async (req: Request, res: Response) => {
    try {
      const {
        inventory = [],
        mealIntent = 'All',
        cuisinePreference = 'All',
        customCraving = '',
      } = req.body || {};

      const itemSummary = Array.isArray(inventory)
        ? inventory
            .map((i: Record<string, unknown>) => `${i.name} (${i.quantity_g || 200}g)`)
            .join(', ')
        : 'Potato, Fresh Paneer, Eggs, Baby Spinach, Chickpeas, Vine Tomatoes, Poha, Masarepa, Black Beans, Cumin & Turmeric';

      const promptText = `Current Virtual Pantry Inventory: ${itemSummary}.
Meal-Time Intent Filter: ${mealIntent}.
Cuisine Focus: ${cuisinePreference}.
${customCraving ? `User Custom Request / Craving: ${customCraving}.` : ''}

Using strict Zero-Missing-Ingredient Logic (only the listed inventory items plus water, salt, and standard cooking oil), synthesize 6 practical, high-flavor recipes across Indian, European, and South American cuisines.
Ensure each recipe includes accurate prep_cook_minutes, total_calories, protein_g, crafting_difficulty (Level 1 to Level 5), used_ingredients, and step-by-step flashcards with timer_seconds for cooking steps.
Also return the current inventory array intact.`;

      const { text, modelUsed } = await callGeminiWithFallback(promptText);
      const parsed = parseGeminiJson(text);
      res.json({ ...parsed, model_used: modelUsed });
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : 'Unexpected error synthesizing recipes.';
      res.status(200).json({
        fallback: true,
        error_notice: message,
        inventory: [],
        recipes: [],
      });
    }
  });

  app.post('/api/inspect-ingredient', async (req: Request, res: Response) => {
    try {
      const { ingredientName, quantityGrams = 250 } = req.body || {};
      if (!ingredientName || typeof ingredientName !== 'string') {
        res.status(200).json({
          fallback: true,
          error_notice: 'Ingredient name is required.',
          inventory: [],
          recipes: [],
        });
        return;
      }

      const promptText = `Analyze the culinary ingredient "${ingredientName.trim()}" (${quantityGrams}g available).
Return a SnapChef JSON payload containing:
1. 'inventory': a 1-item array with the complete Deep Ingredient Codex & Nutritional Profiler breakdown for "${ingredientName.trim()}" (accurate calories_per_100g, macros: { protein_g, carbs_g, fat_g }, 3 specific health_benefits, and rich botanical/culinary source_details).
2. 'recipes': 3 authentic recipes (1 Indian, 1 European, 1 South American) featuring "${ingredientName.trim()}" as the hero ingredient.`;

      const { text, modelUsed } = await callGeminiWithFallback(promptText);
      const parsed = parseGeminiJson(text);
      res.json({ ...parsed, model_used: modelUsed });
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : 'Unexpected error profiling ingredient.';
      res.status(200).json({
        fallback: true,
        error_notice: message,
        inventory: [],
        recipes: [],
      });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: false,
        watch: null,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`SnapChef server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();

