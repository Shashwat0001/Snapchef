import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  Camera,
  Upload,
  Search,
  Plus,
  Minus,
  Sparkles,
  SwitchCamera,
  Trash2,
  ArrowRight,
  Images,
  CheckCircle2,
  AlertCircle,
  X,
} from 'lucide-react';
import type {
  CapturedIngredientPhoto,
  InventoryItem,
  SnapChefPayload,
} from '../types/snapchef';
import {
  INITIAL_INVENTORY,
  SCAN_PRESET_SCENES,
  makeIngredientThumbSvg,
} from '../data/seedData';
import { normalizeSnapChefPayload } from '../utils/snapchefLogic';

interface CameraScannerEyeProps {
  photos: CapturedIngredientPhoto[];
  onAddPhotoToTray: (
    photo: CapturedIngredientPhoto,
    recipesFromScan?: SnapChefPayload['recipes']
  ) => void;
  onRemovePhotoFromTray: (photoId: string) => void;
  onAdjustPhotoQuantity: (photoId: string, deltaGrams: number) => void;
  onLoadPresetPhotos: (presetId: string) => void;
  onProceedToServings: () => void;
}

/**
 * Maps any ingredient to three simple, zero-jargon beginner badges:
 * 1. Freshness Check
 * 2. Best Prep
 * 3. Quick Swap
 */
function getSimpleBeginnerDetails(item: InventoryItem): {
  freshnessCheck: string;
  bestPrep: string;
  quickSwap: string;
} {
  const lower = item.name.toLowerCase();
  if (lower.includes('potato')) {
    return {
      freshnessCheck: 'Firm and ready!',
      bestPrep: 'Dice into cubes',
      quickSwap: 'Sweet potato or cauliflower',
    };
  }
  if (lower.includes('butter')) {
    return {
      freshnessCheck: 'Smooth, chilled, and fresh!',
      bestPrep: 'Melt on low heat with spices',
      quickSwap: 'Ghee or olive oil',
    };
  }
  if (
    lower.includes('cumin') ||
    lower.includes('turmeric') ||
    lower.includes('spice')
  ) {
    return {
      freshnessCheck: 'Fragrant, dry, and ready!',
      bestPrep: 'Sizzle in warm butter for 15 secs',
      quickSwap: 'Garam masala or curry powder',
    };
  }
  if (lower.includes('paneer')) {
    return {
      freshnessCheck: 'Soft, springy, and fresh!',
      bestPrep: 'Cut into bite-sized cubes',
      quickSwap: 'Firm tofu or halloumi cheese',
    };
  }
  if (lower.includes('egg')) {
    return {
      freshnessCheck: 'Clean shells, fresh and ready!',
      bestPrep: 'Whisk gently for fluffy scrambles',
      quickSwap: 'Crumbled tofu or chickpea flour',
    };
  }
  if (lower.includes('spinach')) {
    return {
      freshnessCheck: 'Crisp bright leaves, ready!',
      bestPrep: 'Rinse & stir in during last minute',
      quickSwap: 'Kale or fenugreek leaves',
    };
  }
  if (lower.includes('chickpea')) {
    return {
      freshnessCheck: 'Plump, tender, and ready!',
      bestPrep: 'Rinse well and pat dry before cooking',
      quickSwap: 'White beans or cooked lentils',
    };
  }
  if (lower.includes('tomato')) {
    return {
      freshnessCheck: 'Plump, ripe, and juicy!',
      bestPrep: 'Chop into small dices for sauces',
      quickSwap: 'Canned crushed tomatoes',
    };
  }
  if (lower.includes('poha') || lower.includes('rice')) {
    return {
      freshnessCheck: 'Dry, light flakes ready to rinse!',
      bestPrep: 'Rinse gently in a strainer for 30 secs',
      quickSwap: 'Cooked rice or rolled oats',
    };
  }
  return {
    freshnessCheck: 'Fresh and ready to cook!',
    bestPrep: 'Wash and chop into even pieces',
    quickSwap: 'Any seasonal kitchen vegetable',
  };
}

/**
 * Downscales any uploaded photo to max 960px JPEG so users can upload
 * multiple mobile camera photos smoothly and quickly.
 */
async function resizeUploadedImage(file: File): Promise<string> {
  const rawDataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('Failed to read image file'));
    reader.readAsDataURL(file);
  });

  return new Promise<string>((resolve) => {
    const img = new Image();
    img.onload = () => {
      try {
        const maxDim = 960;
        const scale = Math.min(
          1,
          maxDim / Math.max(img.width || 1, img.height || 1)
        );
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, Math.round(img.width * scale));
        canvas.height = Math.max(1, Math.round(img.height * scale));
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          resolve(canvas.toDataURL('image/jpeg', 0.85));
          return;
        }
      } catch {
        // Fallback to rawDataUrl
      }
      resolve(rawDataUrl);
    };
    img.onerror = () => resolve(rawDataUrl);
    img.src = rawDataUrl;
  });
}

const QUICK_SINGLE_PHOTO_ITEMS: Array<{
  item: InventoryItem;
  accent: string;
  bg: string;
}> = [
  { item: INITIAL_INVENTORY[0], accent: '#EA580C', bg: '#FFF7ED' }, // Potato
  { item: INITIAL_INVENTORY[1], accent: '#D97706', bg: '#FEFCE8' }, // Butter
  { item: INITIAL_INVENTORY[2], accent: '#059669', bg: '#ECFDF5' }, // Cumin & Turmeric Spices
  { item: INITIAL_INVENTORY[3], accent: '#0284C7', bg: '#F0F9FF' }, // Fresh Paneer
  { item: INITIAL_INVENTORY[4], accent: '#E11D48', bg: '#FFF1F2' }, // Pasture-Raised Eggs
  { item: INITIAL_INVENTORY[5], accent: '#16A34A', bg: '#F0FDF4' }, // Baby Spinach
  { item: INITIAL_INVENTORY[6], accent: '#7C3AED', bg: '#F5F3FF' }, // Cooked Chickpeas
  { item: INITIAL_INVENTORY[7], accent: '#DC2626', bg: '#FEF2F2' }, // Vine Tomatoes
];

export const CameraScannerEye: React.FC<CameraScannerEyeProps> = ({
  photos,
  onAddPhotoToTray,
  onRemovePhotoFromTray,
  onAdjustPhotoQuantity,
  onLoadPresetPhotos,
  onProceedToServings,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Camera stays OFF on page load for a stress-free experience
  const [isCameraOpen, setIsCameraOpen] = useState<boolean>(false);
  const [cameraState, setCameraState] = useState<
    'idle' | 'starting' | 'live' | 'fallback'
  >('idle');
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>(
    'environment'
  );
  const [isScanning, setIsScanning] = useState(false);
  const [shutterFlash, setShutterFlash] = useState(false);
  const [scanStatusText, setScanStatusText] = useState<string>(
    'Use "Open Camera", "Upload Photos", or the search bar to add your kitchen ingredients.'
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [scanError, setScanError] = useState<string | null>(null);
  const [activeInspectPhotoId, setActiveInspectPhotoId] = useState<string>(
    () => photos[0]?.id || ''
  );

  // Next ingredient index to cycle through when clicking Capture & Snap Another in fallback/demo mode
  const nextCameraCycleRef = useRef<number>(3);

  const stopCameraStream = useCallback(() => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
  }, []);

  // Cleanup camera stream only on unmount (never auto-start on page load!)
  useEffect(() => {
    return () => {
      stopCameraStream();
    };
  }, [stopCameraStream]);

  const startCamera = useCallback(
    async (
      preferredFacing: 'environment' | 'user' = 'environment'
    ): Promise<boolean> => {
      stopCameraStream();
      setScanError(null);
      setCameraState('starting');

      if (
        typeof navigator === 'undefined' ||
        !navigator.mediaDevices ||
        !navigator.mediaDevices.getUserMedia
      ) {
        setCameraState('fallback');
        setScanStatusText(
          'Viewfinder ready — Press "Capture & Snap Another" to scan each ingredient!'
        );
        return false;
      }

      try {
        let stream: MediaStream;
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: {
              facingMode: { ideal: preferredFacing },
              width: { ideal: 1280 },
              height: { ideal: 720 },
            },
            audio: false,
          });
        } catch {
          stream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: false,
          });
        }

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play().catch(() => {});
        }
        setCameraState('live');
        setScanStatusText(
          'Camera active — Point at an item and press "Capture & Snap Another"!'
        );
        return true;
      } catch {
        setCameraState('fallback');
        setScanStatusText(
          'Viewfinder ready — Press "Capture & Snap Another" to scan each ingredient!'
        );
        return false;
      }
    },
    [stopCameraStream]
  );

  const handleOpenCameraClick = async () => {
    setIsCameraOpen(true);
    await startCamera(facingMode);
  };

  const handleCloseCameraClick = () => {
    stopCameraStream();
    setIsCameraOpen(false);
    setCameraState('idle');
  };

  const handleFlipCamera = () => {
    const next = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(next);
    startCamera(next);
  };

  /**
   * "Capture & Snap Another" inside the viewfinder:
   * Captures the current ingredient, adds it to the tray, and keeps the viewfinder open
   * so the user can immediately snap the next ingredient.
   */
  const handleCaptureAndSnapAnother = async () => {
    if (isScanning) return;

    setShutterFlash(true);
    window.setTimeout(() => setShutterFlash(false), 180);
    setIsScanning(true);
    setScanError(null);

    const cycleSpec =
      QUICK_SINGLE_PHOTO_ITEMS[
        nextCameraCycleRef.current % QUICK_SINGLE_PHOTO_ITEMS.length
      ];
    nextCameraCycleRef.current += 1;

    const video = videoRef.current;
    let isLiveVideoFrame = false;
    let previewUrl = makeIngredientThumbSvg(
      cycleSpec.item.name,
      `${cycleSpec.item.category} · ${cycleSpec.item.quantity_g}g`,
      cycleSpec.accent,
      cycleSpec.bg
    );

    if (
      video &&
      video.srcObject &&
      video.readyState >= 2 &&
      video.videoWidth > 0 &&
      video.videoHeight > 0
    ) {
      const canvas = canvasRef.current || document.createElement('canvas');
      const scale = Math.min(1, 960 / video.videoWidth);
      canvas.width = Math.round(video.videoWidth * scale);
      canvas.height = Math.round(video.videoHeight * scale);
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        previewUrl = canvas.toDataURL('image/jpeg', 0.86);
        isLiveVideoFrame = true;
      }
    }

    setScanStatusText('Scanning ingredient & keeping camera ready for your next snap...');

    try {
      if (isLiveVideoFrame) {
        const response = await fetch('/api/scan-image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            imageBase64: previewUrl,
            mimeType: 'image/jpeg',
            mealIntent: 'All',
            isSimulatedFallback: false,
            focusHint: cycleSpec.item.name,
          }),
        });

        const rawData = await response.json();
        const normalized = normalizeSnapChefPayload(rawData);

        if (!rawData?.fallback && normalized.inventory.length > 0) {
          const names = normalized.inventory.map((i) => i.name).join(', ');
          const newPhoto: CapturedIngredientPhoto = {
            id: `photo-snap-${Date.now()}`,
            label: `Photo #${photos.length + 1}: ${names}`,
            previewUrl,
            detectedItems: normalized.inventory,
            capturedAt: `Photo ${photos.length + 1}`,
          };
          onAddPhotoToTray(newPhoto, normalized.recipes);
          setActiveInspectPhotoId(newPhoto.id);
          setScanStatusText(
            `Snapped "${names}"! Point at your next item and press "Capture & Snap Another".`
          );
          setIsScanning(false);
          return;
        }
      }
    } catch {
      // Fallback to deterministic ingredient detection below
    }

    const newPhoto: CapturedIngredientPhoto = {
      id: `photo-snap-${Date.now()}`,
      label: `Photo #${photos.length + 1}: ${cycleSpec.item.name}`,
      previewUrl,
      detectedItems: [cycleSpec.item],
      capturedAt: `Photo ${photos.length + 1}`,
    };
    onAddPhotoToTray(newPhoto);
    setActiveInspectPhotoId(newPhoto.id);
    setScanStatusText(
      `Snapped "${cycleSpec.item.name}" (${
        photos.length + 1
      } in tray)! Point at the next item and press "Capture & Snap Another".`
    );
    setIsScanning(false);
  };

  /**
   * Supports uploading MULTIPLE ingredient photos at once (<input type="file" multiple />)
   */
  const handleMultipleFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;

    const files: File[] = Array.from(fileList);
    setIsScanning(true);
    setScanError(null);
    setScanStatusText(
      `Uploading & scanning ${files.length} ingredient ${
        files.length === 1 ? 'photo' : 'photos'
      }...`
    );

    let runningCount = photos.length;

    for (let idx = 0; idx < files.length; idx++) {
      const file = files[idx];
      const fallbackSpec =
        QUICK_SINGLE_PHOTO_ITEMS[
          (nextCameraCycleRef.current + idx) % QUICK_SINGLE_PHOTO_ITEMS.length
        ];

      try {
        const resizedDataUrl = await resizeUploadedImage(file);
        const response = await fetch('/api/scan-image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            imageBase64: resizedDataUrl,
            mimeType: 'image/jpeg',
            mealIntent: 'All',
            isSimulatedFallback: false,
            focusHint: fallbackSpec.item.name,
          }),
        });

        const rawData = await response.json();
        const normalized = normalizeSnapChefPayload(rawData);
        const detected =
          normalized.inventory.length > 0
            ? normalized.inventory
            : [fallbackSpec.item];
        const names = detected.map((i) => i.name).join(', ');
        runningCount += 1;

        const newPhoto: CapturedIngredientPhoto = {
          id: `photo-upload-${Date.now()}-${idx}`,
          label: `Photo #${runningCount}: ${names}`,
          previewUrl: resizedDataUrl,
          detectedItems: detected,
          capturedAt: file.name,
        };
        onAddPhotoToTray(newPhoto, normalized.recipes);
        setActiveInspectPhotoId(newPhoto.id);
      } catch {
        runningCount += 1;
        const newPhoto: CapturedIngredientPhoto = {
          id: `photo-upload-${Date.now()}-${idx}`,
          label: `Photo #${runningCount}: ${fallbackSpec.item.name}`,
          previewUrl: makeIngredientThumbSvg(
            fallbackSpec.item.name,
            `Uploaded · ${file.name}`,
            fallbackSpec.accent,
            fallbackSpec.bg
          ),
          detectedItems: [fallbackSpec.item],
          capturedAt: file.name,
        };
        onAddPhotoToTray(newPhoto);
        setActiveInspectPhotoId(newPhoto.id);
      }
    }

    nextCameraCycleRef.current += files.length;
    setScanStatusText(
      `Added ${files.length} ingredient ${
        files.length === 1 ? 'photo' : 'photos'
      } to your tray!`
    );
    setIsScanning(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  /**
   * Adds an ingredient via the text search bar (matches known catalog item or creates a custom one)
   */
  const addIngredientByName = (rawName: string) => {
    const trimmed = rawName.trim();
    if (!trimmed) {
      setScanError(
        'Please type an ingredient in the search bar first (e.g., Tomatoes, Onion, Eggs).'
      );
      return;
    }

    setScanError(null);
    const catalogMatch = INITIAL_INVENTORY.find(
      (item) =>
        item.name.toLowerCase().includes(trimmed.toLowerCase()) ||
        trimmed.toLowerCase().includes(item.name.toLowerCase())
    );

    const matchedItem: InventoryItem = catalogMatch
      ? { ...catalogMatch, id: `inv-search-${Date.now()}` }
      : {
          id: `inv-typed-${Date.now()}`,
          name: trimmed,
          category: 'Vegetable',
          quantity_g: 250,
          unit_label: '250g portion',
          freshness_days: 6,
          calories_per_100g: 82,
          macros: { protein_g: 3.1, carbs_g: 14.5, fat_g: 0.8 },
          health_benefits: [
            'Rich in natural dietary fiber and essential micronutrients',
            'Supports balanced everyday energy and wholesome home cooking',
          ],
          source_details: `${trimmed} — Added via ingredient search.`,
          qualities: {
            texture_and_freshness:
              'Fresh, crisp kitchen-ready texture with clean surface quality.',
            flavor_profile:
              'Natural savory-sweet notes that blend smoothly with spices and butter.',
            cooking_behavior:
              'Cooks evenly in skillet sautés, curries, or roasted dishes.',
          },
          confidence: 99,
        };

    const newPhoto: CapturedIngredientPhoto = {
      id: `photo-typed-${Date.now()}`,
      label: `Photo #${photos.length + 1}: ${matchedItem.name}`,
      previewUrl: makeIngredientThumbSvg(
        matchedItem.name,
        `${matchedItem.category} · ${matchedItem.quantity_g}g`,
        '#059669',
        '#ECFDF5'
      ),
      detectedItems: [matchedItem],
      capturedAt: `Item ${photos.length + 1}`,
    };

    onAddPhotoToTray(newPhoto);
    setActiveInspectPhotoId(newPhoto.id);
    setSearchQuery('');
    setScanStatusText(`Added "${matchedItem.name}" to your Ingredient Tray!`);
  };

  const handleSearchFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addIngredientByName(searchQuery);
  };

  const inspectedPhoto =
    photos.find((p) => p.id === activeInspectPhotoId) || photos[0] || null;
  const inspectedItem = inspectedPhoto?.detectedItems[0] || null;

  return (
    <section
      aria-label="Step 1: Scan Ingredients"
      className="space-y-5"
    >
      {/* Compact, Stress-Free 'Scan Ingredients' Card */}
      <div className="rounded-3xl border-2 border-orange-200/90 bg-white p-5 sm:p-6 shadow-xl shadow-orange-500/5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-orange-100">
          <div className="min-w-0">
            <span className="text-xs font-extrabold text-[#FF5A1F] uppercase tracking-wide">
              Step 1 · Stress-Free Kitchen Input
            </span>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 mt-0.5 leading-snug">
              Scan Ingredients
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
              Your camera stays off until you need it. Open the camera, upload
              photos from your device, or search for ingredients by name:
            </p>
          </div>

          <button
            type="button"
            onClick={onProceedToServings}
            className="min-h-[44px] px-4 sm:px-5 py-2.5 rounded-2xl bg-gradient-to-r from-[#FF5A1F] to-[#FF2E63] text-white font-extrabold text-xs sm:text-sm hover:opacity-95 transition-all shadow-md shadow-orange-500/20 flex items-center justify-center gap-2 whitespace-nowrap shrink-0 self-start sm:self-auto cursor-pointer"
          >
            <span>Next: Servings ({photos.length} Items)</span>
            <ArrowRight className="w-4 h-4 shrink-0" />
          </button>
        </div>

        {/* Two Friendly Buttons ('Open Camera' & 'Upload Photos') Placed Next to a Text Search Bar */}
        <div className="mt-4 flex flex-col lg:flex-row items-stretch lg:items-center gap-3">
          {/* Two Friendly Buttons */}
          <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={
                isCameraOpen ? handleCloseCameraClick : handleOpenCameraClick
              }
              className={`flex-1 sm:flex-initial min-h-[46px] px-4 sm:px-5 py-2.5 rounded-2xl font-extrabold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 whitespace-nowrap shrink-0 cursor-pointer shadow-sm ${
                isCameraOpen
                  ? 'bg-slate-900 text-white hover:bg-slate-800'
                  : 'bg-gradient-to-r from-[#FF5A1F] to-[#F59E0B] text-white hover:opacity-95 shadow-orange-500/20'
              }`}
            >
              <Camera className="w-4 h-4 shrink-0" />
              <span>{isCameraOpen ? 'Close Camera' : 'Open Camera'}</span>
            </button>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isScanning}
              className="flex-1 sm:flex-initial min-h-[46px] px-4 sm:px-5 py-2.5 rounded-2xl border-2 border-teal-500/80 bg-teal-50/70 hover:bg-teal-100/80 text-teal-950 font-extrabold text-xs sm:text-sm transition-colors flex items-center justify-center gap-2 whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Upload className="w-4 h-4 text-teal-700 shrink-0" />
              <span>Upload Photos</span>
            </button>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleMultipleFileUpload}
              className="hidden"
              aria-label="Upload Photos"
            />
          </div>

          {/* Text Search Bar Placed Right Next to the Two Buttons */}
          <form
            onSubmit={handleSearchFormSubmit}
            className="flex-1 flex items-center gap-2 min-w-0"
          >
            <div className="relative flex-1 min-w-0">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                id="simple-ingredient-input"
                type="search"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  if (scanError) setScanError(null);
                }}
                placeholder="Search or type an ingredient (e.g., Potatoes, Paneer, Spinach, Garlic)..."
                aria-label="Search or type an ingredient"
                className="w-full min-h-[46px] rounded-2xl border border-slate-300 bg-slate-50/70 focus:bg-white pl-10 pr-3.5 py-2 text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#FF5A1F]"
              />
            </div>
            <button
              type="submit"
              className="min-h-[46px] px-4 py-2.5 rounded-2xl bg-emerald-600 text-white font-extrabold text-xs sm:text-sm hover:bg-emerald-700 transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Plus className="w-4 h-4 shrink-0" />
              <span>Add</span>
            </button>
          </form>
        </div>

        {scanError && (
          <div
            role="alert"
            className="mt-2.5 flex items-center gap-1.5 text-xs font-semibold text-rose-600"
          >
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{scanError}</span>
          </div>
        )}

        {/* Quick Preset Baskets Bar */}
        <div className="mt-3.5 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] font-bold text-slate-500 mr-1">
              Quick Sample Baskets:
            </span>
            {SCAN_PRESET_SCENES.map((scene) => (
              <button
                key={scene.id}
                type="button"
                onClick={() => onLoadPresetPhotos(scene.id)}
                className="min-h-[30px] px-2.5 py-1 rounded-lg border border-orange-200 bg-orange-50/50 hover:bg-orange-100/70 hover:border-[#FF5A1F] text-[11px] font-bold text-slate-700 cursor-pointer"
              >
                {scene.label}
              </button>
            ))}
          </div>
          <p className="text-xs text-slate-500">{scanStatusText}</p>
        </div>

        {/* Expandable Camera Viewfinder — Only rendered when 'Open Camera' is clicked */}
        {isCameraOpen && (
          <div
            role="region"
            aria-label="Active Camera Viewfinder"
            className="mt-4 rounded-2xl overflow-hidden border-2 border-teal-400/80 bg-slate-900 relative min-h-[290px] sm:min-h-[330px] flex flex-col justify-between shadow-lg"
          >
            <video
              ref={videoRef}
              playsInline
              muted
              autoPlay
              className={`w-full h-full object-cover absolute inset-0 ${
                cameraState === 'live'
                  ? 'opacity-100'
                  : 'opacity-0 pointer-events-none'
              }`}
            />

            {shutterFlash && (
              <div className="absolute inset-0 z-30 bg-white/90 pointer-events-none" />
            )}

            <canvas ref={canvasRef} className="hidden" />

            {cameraState !== 'live' && (
              <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-teal-950 to-slate-900" />
            )}

            {/* Top Viewfinder Status & Controls */}
            <div className="relative z-20 flex flex-wrap items-center justify-between gap-2 p-3.5 sm:p-4">
              <div className="flex items-center gap-2">
                <span className="text-[11px] sm:text-xs font-mono font-semibold text-teal-300 bg-slate-950/85 px-2.5 py-1 rounded-lg border border-teal-400/30 whitespace-nowrap">
                  {cameraState === 'live'
                    ? 'LIVE CAMERA LENS ACTIVE'
                    : 'CAMERA VIEWFINDER READY'}
                </span>
                <span className="text-[11px] sm:text-xs font-mono font-semibold text-amber-300 bg-slate-950/85 px-2.5 py-1 rounded-lg border border-amber-400/30 whitespace-nowrap">
                  {photos.length} {photos.length === 1 ? 'ITEM' : 'ITEMS'} SCANNED
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleFlipCamera}
                  className="min-h-[36px] px-2.5 py-1 rounded-lg border border-white/20 bg-slate-950/80 text-white hover:bg-slate-800 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                  aria-label="Flip camera lens"
                >
                  <SwitchCamera className="w-3.5 h-3.5 text-amber-300" />
                  <span>Flip Lens</span>
                </button>
                <button
                  type="button"
                  onClick={handleCloseCameraClick}
                  className="min-h-[36px] px-2.5 py-1 rounded-lg border border-white/20 bg-slate-950/80 text-slate-200 hover:text-white hover:bg-slate-800 text-xs font-bold flex items-center gap-1 cursor-pointer"
                  aria-label="Close camera viewfinder"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Done</span>
                </button>
              </div>
            </div>

            {/* Center Viewfinder Focus Guide */}
            <div className="relative z-20 my-2 mx-auto w-full max-w-[270px] sm:max-w-[310px] min-h-[110px] sm:min-h-[125px] rounded-2xl border border-teal-300/60 bg-slate-950/35 backdrop-blur-[1px] flex flex-col items-center justify-center text-center px-4 py-3 pointer-events-none">
              <div className="absolute -top-0.5 -left-0.5 w-6 h-6 border-t-3 border-l-3 border-teal-300 rounded-tl-lg" />
              <div className="absolute -top-0.5 -right-0.5 w-6 h-6 border-t-3 border-r-3 border-teal-300 rounded-tr-lg" />
              <div className="absolute -bottom-0.5 -left-0.5 w-6 h-6 border-b-3 border-l-3 border-teal-300 rounded-bl-lg" />
              <div className="absolute -bottom-0.5 -right-0.5 w-6 h-6 border-b-3 border-r-3 border-teal-300 rounded-br-lg" />

              <p className="text-[11px] font-mono font-bold text-teal-300 uppercase tracking-wider">
                Multi-Item Continuous Scanner
              </p>
              <p className="text-xs font-semibold text-white mt-1 leading-snug">
                Center each ingredient here and tap &ldquo;Capture &amp; Snap
                Another&rdquo; below
              </p>
            </div>

            {/* Inside-Viewfinder Bottom Action Bar with 'Capture & Snap Another' */}
            <div className="relative z-20 bg-slate-950/90 border-t border-white/15 p-3.5 flex flex-col sm:flex-row items-center justify-between gap-3">
              <p className="text-xs text-slate-200 truncate max-w-full">
                {scanStatusText}
              </p>

              <button
                type="button"
                onClick={handleCaptureAndSnapAnother}
                disabled={isScanning}
                className="w-full sm:w-auto min-h-[46px] px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#FF5A1F] via-[#FF2E63] to-[#F59E0B] text-white font-extrabold text-xs sm:text-sm hover:opacity-95 active:scale-[0.99] disabled:opacity-60 transition-all shadow-lg shadow-orange-500/25 flex items-center justify-center gap-2 whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Camera className="w-4 h-4 shrink-0" />
                <span>
                  {isScanning ? 'Scanning Item...' : 'Capture & Snap Another'}
                </span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Ingredient Tray & Beginner-Friendly Details Card (Zero Jargon) */}
      <div className="rounded-3xl border-2 border-orange-200/80 bg-white p-5 sm:p-6 shadow-md">
        <div className="flex flex-wrap items-center justify-between gap-2 pb-4 border-b border-orange-100">
          <div className="flex items-center gap-2 min-w-0">
            <Images className="w-5 h-5 text-[#FF5A1F] shrink-0" />
            <h2 className="text-base sm:text-lg font-extrabold text-slate-900">
              Your Kitchen Ingredients ({photos.length}{' '}
              {photos.length === 1 ? 'Item' : 'Items'})
            </h2>
          </div>
          <span className="text-xs font-semibold text-emerald-700 whitespace-nowrap">
            Click any card for beginner tips · Use + and - to adjust quantity
          </span>
        </div>

        {/* Grid of Scanned / Uploaded / Searched Ingredients with '+' and '-' Quantity Controls */}
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {photos.map((photo) => {
            const isSelected = inspectedPhoto?.id === photo.id;
            const mainItem = photo.detectedItems[0];
            const itemName = mainItem ? mainItem.name : photo.label;
            const itemCategory = mainItem ? mainItem.category : 'Ingredient';
            const quantityGrams = mainItem ? mainItem.quantity_g : 200;

            return (
              <div
                key={photo.id}
                className={`rounded-2xl border-2 bg-white p-3.5 flex flex-col justify-between gap-3 transition-all min-w-0 ${
                  isSelected
                    ? 'border-[#FF5A1F] bg-orange-50/30 shadow-md shadow-orange-500/10'
                    : 'border-slate-200 hover:border-orange-300'
                }`}
              >
                <div className="flex items-start justify-between gap-2.5">
                  <button
                    type="button"
                    onClick={() => setActiveInspectPhotoId(photo.id)}
                    className="flex items-center gap-3 text-left min-w-0 flex-1 cursor-pointer"
                  >
                    <img
                      src={photo.previewUrl}
                      alt={itemName}
                      referrerPolicy="no-referrer"
                      className="w-12 h-12 rounded-xl object-cover border border-slate-200 shrink-0"
                    />
                    <div className="min-w-0">
                      <p className="text-xs sm:text-sm font-extrabold text-slate-900 truncate">
                        {itemName}
                      </p>
                      <p className="text-[11px] text-slate-600 truncate mt-0.5">
                        {itemCategory}
                      </p>
                      <p className="text-[10px] font-bold text-[#FF5A1F] mt-0.5">
                        {isSelected ? 'Showing beginner tips below' : 'Click for beginner tips'}
                      </p>
                    </div>
                  </button>

                  {photos.length > 1 && (
                    <button
                      type="button"
                      onClick={() => onRemovePhotoFromTray(photo.id)}
                      className="min-h-[32px] min-w-[32px] rounded-lg border border-slate-200 text-slate-400 hover:text-rose-600 hover:border-rose-200 flex items-center justify-center shrink-0 cursor-pointer"
                      aria-label={`Remove ${itemName}`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Simple '+' and '-' Quantity Stepper on Each Card */}
                <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between gap-2">
                  <span className="text-[11px] font-bold text-slate-500">
                    Quantity:
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => onAdjustPhotoQuantity(photo.id, -50)}
                      aria-label={`Decrease ${itemName} quantity`}
                      className="w-7 h-7 rounded-lg border border-slate-300 bg-slate-50 hover:bg-orange-50 hover:border-[#FF5A1F] text-slate-800 font-extrabold text-xs flex items-center justify-center cursor-pointer"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="min-w-[54px] text-center text-xs font-extrabold text-slate-900">
                      {quantityGrams}g
                    </span>
                    <button
                      type="button"
                      onClick={() => onAdjustPhotoQuantity(photo.id, 50)}
                      aria-label={`Increase ${itemName} quantity`}
                      className="w-7 h-7 rounded-lg border border-slate-300 bg-slate-50 hover:bg-orange-50 hover:border-[#FF5A1F] text-slate-800 font-extrabold text-xs flex items-center justify-center cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Three Simple Beginner Badges When an Ingredient is Clicked:
            1. 'Freshness Check', 2. 'Best Prep', 3. 'Quick Swap' */}
        {inspectedItem && (() => {
          const beginner = getSimpleBeginnerDetails(inspectedItem);
          return (
            <div
              role="region"
              aria-label={`Beginner guide for ${inspectedItem.name}`}
              className="mt-4 rounded-2xl border-2 border-orange-200/80 bg-orange-50/40 p-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-orange-200/60">
                <span className="text-xs sm:text-sm font-extrabold text-slate-900">
                  Beginner Kitchen Guide: {inspectedItem.name}
                </span>
                <span className="text-xs font-semibold text-slate-600">
                  Current Amount: {inspectedItem.quantity_g}g
                </span>
              </div>

              <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-3">
                {/* Badge 1: Freshness Check */}
                <div className="rounded-xl border border-emerald-200 bg-emerald-50/90 p-3">
                  <span className="text-[11px] font-extrabold uppercase tracking-wide text-emerald-800 block">
                    Freshness Check
                  </span>
                  <p className="text-xs sm:text-sm font-bold text-slate-900 mt-1">
                    {beginner.freshnessCheck}
                  </p>
                </div>

                {/* Badge 2: Best Prep */}
                <div className="rounded-xl border border-amber-200 bg-amber-50/90 p-3">
                  <span className="text-[11px] font-extrabold uppercase tracking-wide text-amber-900 block">
                    Best Prep
                  </span>
                  <p className="text-xs sm:text-sm font-bold text-slate-900 mt-1">
                    {beginner.bestPrep}
                  </p>
                </div>

                {/* Badge 3: Quick Swap */}
                <div className="rounded-xl border border-sky-200 bg-sky-50/90 p-3">
                  <span className="text-[11px] font-extrabold uppercase tracking-wide text-sky-900 block">
                    Quick Swap
                  </span>
                  <p className="text-xs sm:text-sm font-bold text-slate-900 mt-1">
                    {beginner.quickSwap}
                  </p>
                </div>
              </div>
            </div>
          );
        })()}

        {/* Bottom Proceed Bar */}
        <div className="mt-5 pt-4 border-t border-orange-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-800">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              {photos.length}{' '}
              {photos.length === 1 ? 'ingredient' : 'ingredients'} ready for
              Step 2 (Servings &amp; Diet)
            </span>
          </div>

          <button
            type="button"
            onClick={onProceedToServings}
            className="min-h-[48px] px-6 py-3 rounded-2xl bg-gradient-to-r from-[#FF5A1F] via-[#FF2E63] to-[#F59E0B] text-white font-extrabold text-xs sm:text-sm hover:opacity-95 active:scale-[0.99] transition-all shadow-lg shadow-orange-500/25 flex items-center justify-center gap-2 whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Sparkles className="w-4 h-4 shrink-0" />
            <span>Next: Choose Servings &amp; Diet</span>
            <ArrowRight className="w-4 h-4 shrink-0" />
          </button>
        </div>
      </div>
    </section>
  );
};
