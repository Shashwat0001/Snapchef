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
        ],
      },
    },
    recipes: {
      type: Type.ARRAY,
      description:
        'Zero-missing-ingredient recipes synthesized across Indian, European, South American, and global cuisines.',
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

const SYSTEM_INSTRUCTION = `You are SnapChef, an advanced AI Kitchen Inventory & Global Recipe Synthesizer powered by Google Argon culinary & spatial reasoning.
Your mission:
1. Identify all visible or specified perishables, vegetables, proteins, dairy, legumes, grains, and spices.
2. For each ingredient, provide an exact nutritional breakdown per 100g (calories_per_100g, protein_g, carbs_g, fat_g), 3 specific physiological/micronutrient health_benefits, and a rich botanical/culinary source_details profile.
3. Cross-reference ONLY the available ingredients (plus basic water/salt/cooking oil) using strict Zero-Missing-Ingredient Logic to synthesize practical, authentic everyday dishes across diverse global cuisines:
   - Indian Cuisine (e.g., Poha, Aloo Jeera, Sabzis, Dals, Parathas, Paneer Bhurji, quick home-style curries)
   - European Cuisine (e.g., Rustic pastas, Mediterranean bowls, frittatas, Spanish tortillas)
   - South American Cuisine (e.g., Arepas, quick bean stews, fresh ceviche-style preparations)
4. Categorize each recipe clearly into Breakfast, Lunch, or Dinner, assign a gamified crafting_difficulty ("Level 1" to "Level 5"), and break instructions into focused flashcards with accurate timer_seconds for any boiling, sautéing, simmering, or resting step.
Always respond with valid JSON matching the requested schema.`;

async function callGeminiWithFallback(
  contents: unknown,
  schema = SNAPCHEF_RESPONSE_SCHEMA
): Promise<{ text: string; modelUsed: string }> {
  const ai = getGenAIClient();
  const modelsToTry = ['gemini-4-argon', 'gemini-3.8-flash'];
  let lastError: unknown = null;

  for (const modelName of modelsToTry) {
    try {
      const response = await ai.models.generateContent({
        model: modelName,
        contents: contents as Parameters<typeof ai.models.generateContent>[0]['contents'],
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
          responseMimeType: 'application/json',
          responseSchema: schema,
          thinkingConfig: {
            thinkingLevel: ThinkingLevel.HIGH,
          },
        },
      });

      if (response.text) {
        return { text: response.text, modelUsed: modelName };
      }
    } catch (err) {
      lastError = err;
      // Continue to fallback model if first model fails due to key tier or availability
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

  app.post('/api/scan-image', async (req: Request, res: Response) => {
    try {
      const { imageBase64, mimeType = 'image/jpeg', mealIntent = 'All' } = req.body || {};
      if (!imageBase64 || typeof imageBase64 !== 'string') {
        res.status(400).json({ error: 'Missing imageBase64 payload for camera scan.' });
        return;
      }

      const cleanBase64 = imageBase64.replace(/^data:[^;]+;base64,/, '');

      const promptText = `Perform a high-definition physical ingredient mapping of this kitchen/fridge/pantry capture.
Catalog every visible vegetable, protein, dairy item, legume, grain, or spice into the 'inventory' array with accurate per-100g macros, health benefits, and botanical/culinary source details.
If the image shows a non-kitchen scene or unclear items, still extract any recognizable food items or provide a representative starter kitchen scan (including Potato, Fresh Paneer, Eggs, Spinach, Chickpeas, Tomatoes, and Cumin spices) so the user can test the full workflow.
Then synthesize 6 zero-missing-ingredient recipes across Indian, European, and South American cuisines (covering Breakfast, Lunch, and Dinner${
        mealIntent !== 'All' ? `, prioritizing ${mealIntent}` : ''
      }) using only those ingredients.`;

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

      const parsed = JSON.parse(text);
      res.json({ ...parsed, model_used: modelUsed });
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Unexpected error during image scan.';
      res.status(500).json({ error: message });
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
      const parsed = JSON.parse(text);
      res.json({ ...parsed, model_used: modelUsed });
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : 'Unexpected error synthesizing recipes.';
      res.status(500).json({ error: message });
    }
  });

  app.post('/api/inspect-ingredient', async (req: Request, res: Response) => {
    try {
      const { ingredientName, quantityGrams = 250 } = req.body || {};
      if (!ingredientName || typeof ingredientName !== 'string') {
        res.status(400).json({ error: 'Ingredient name is required.' });
        return;
      }

      const promptText = `Analyze the culinary ingredient "${ingredientName.trim()}" (${quantityGrams}g available).
Return a SnapChef JSON payload containing:
1. 'inventory': a 1-item array with the complete Deep Ingredient Codex & Nutritional Profiler breakdown for "${ingredientName.trim()}" (accurate calories_per_100g, macros: { protein_g, carbs_g, fat_g }, 3 specific health_benefits, and rich botanical/culinary source_details).
2. 'recipes': 3 authentic recipes (1 Indian, 1 European, 1 South American) featuring "${ingredientName.trim()}" as the hero ingredient.`;

      const { text, modelUsed } = await callGeminiWithFallback(promptText);
      const parsed = JSON.parse(text);
      res.json({ ...parsed, model_used: modelUsed });
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : 'Unexpected error profiling ingredient.';
      res.status(500).json({ error: message });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
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
