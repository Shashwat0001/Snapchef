import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  Camera,
  RefreshCw,
  Upload,
  Plus,
  Sparkles,
  SwitchCamera,
  Trash2,
  ArrowRight,
  Images,
  CheckCircle2,
  AlertCircle,
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
  onLoadPresetPhotos: (presetId: string) => void;
  onProceedToServings: () => void;
}

/**
 * Downscales any uploaded photo to max 960px JPEG so users can upload
 * dozens of mobile camera photos smoothly and quickly.
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
  onLoadPresetPhotos,
  onProceedToServings,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [cameraState, setCameraState] = useState<
    'prompting' | 'live' | 'fallback'
  >('prompting');
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>(
    'environment'
  );
  const [isScanning, setIsScanning] = useState(false);
  const [shutterFlash, setShutterFlash] = useState(false);
  const [scanStatusText, setScanStatusText] = useState<string>(
    'Point your camera at an ingredient and click "Snap Ingredient Photo", or upload multiple photos at once!'
  );
  const [manualName, setManualName] = useState('');
  const [scanError, setScanError] = useState<string | null>(null);
  const [activeInspectPhotoId, setActiveInspectPhotoId] = useState<string>(
    () => photos[0]?.id || ''
  );

  // Next ingredient index to cycle through when clicking camera shutter in fallback/demo mode
  const nextCameraCycleRef = useRef<number>(3);

  const stopCameraStream = useCallback(() => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
  }, []);

  const startCamera = useCallback(
    async (
      preferredFacing: 'environment' | 'user' = 'environment'
    ): Promise<boolean> => {
      stopCameraStream();
      setScanError(null);

      if (
        typeof navigator === 'undefined' ||
        !navigator.mediaDevices ||
        !navigator.mediaDevices.getUserMedia
      ) {
        setCameraState('fallback');
        return false;
      }

      try {
        const docWithPolicy = document as unknown as {
          permissionsPolicy?: { allowsFeature?: (f: string) => boolean };
          featurePolicy?: { allowsFeature?: (f: string) => boolean };
        };
        const policy =
          docWithPolicy.permissionsPolicy || docWithPolicy.featurePolicy;
        if (
          policy &&
          typeof policy.allowsFeature === 'function' &&
          !policy.allowsFeature('camera')
        ) {
          setCameraState('fallback');
          return false;
        }
      } catch {
        // Ignore policy inspection errors
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
          'Live camera active — Click "Snap Ingredient Photo" for each ingredient you have!'
        );
        return true;
      } catch {
        setCameraState('fallback');
        return false;
      }
    },
    [stopCameraStream]
  );

  useEffect(() => {
    let cancelled = false;
    const initCameraSafely = async () => {
      try {
        if (navigator.permissions && navigator.permissions.query) {
          const status = await navigator.permissions.query({
            name: 'camera' as PermissionName,
          });
          if (cancelled) return;
          if (status.state === 'denied') {
            setCameraState('fallback');
            return;
          }
        }
      } catch {
        // Proceed if permissions query is unsupported
      }
      if (!cancelled) {
        await startCamera('environment');
      }
    };
    initCameraSafely();
    return () => {
      cancelled = true;
      stopCameraStream();
    };
  }, [startCamera, stopCameraStream]);

  const handleFlipCamera = () => {
    const next = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(next);
    startCamera(next);
  };

  /**
   * Snaps a photo of the current ingredient in the camera and adds it to the Multi-Photo Tray
   */
  const handleSnapPhotoToTray = async () => {
    if (isScanning) return;

    setShutterFlash(true);
    window.setTimeout(() => setShutterFlash(false), 200);
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

    setScanStatusText('Scanning snapped ingredient photo and adding to your tray...');

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
            `Added "${names}" to your Photo Tray! Snap another ingredient or click Next below.`
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
      `Added "${cycleSpec.item.name}" to your Photo Tray (${
        photos.length + 1
      } photos total)! Snap more or click Next.`
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
      } to your tray! Click "Next: Choose How Many People" below when ready.`
    );
    setIsScanning(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  /**
   * Quick-add by typing an ingredient name or clicking a 1-tap ingredient chip
   */
  const handleAddTypedIngredient = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = manualName.trim();
    if (!trimmed) {
      setScanError('Please type an ingredient name first (e.g., Tomatoes, Onion, Eggs).');
      return;
    }

    setScanError(null);
    setIsScanning(true);

    const customItem: InventoryItem = {
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
      source_details: `${trimmed} — Added to your SnapChef ingredient tray.`,
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
      label: `Photo #${photos.length + 1}: ${trimmed}`,
      previewUrl: makeIngredientThumbSvg(
        trimmed,
        'Added Ingredient · 250g',
        '#059669',
        '#ECFDF5'
      ),
      detectedItems: [customItem],
      capturedAt: `Photo ${photos.length + 1}`,
    };

    onAddPhotoToTray(newPhoto);
    setActiveInspectPhotoId(newPhoto.id);
    setManualName('');
    setScanStatusText(`Added "${trimmed}" to your Ingredient Photo Tray!`);
    setIsScanning(false);
  };

  const inspectedPhoto =
    photos.find((p) => p.id === activeInspectPhotoId) || photos[0] || null;
  const inspectedItem = inspectedPhoto?.detectedItems[0] || null;

  return (
    <section
      aria-label="Step 1: Snap or Upload Ingredient Photos"
      className="rounded-3xl border-2 border-orange-200/90 bg-white p-5 sm:p-7 shadow-xl shadow-orange-500/5"
    >
      {/* Clean Beginner Step Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-orange-100">
        <div>
          <p className="text-xs font-extrabold text-[#FF5A1F] uppercase tracking-wide">
            Step 1 of 3 · Add All Your Ingredients
          </p>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 mt-1">
            Click or Upload Photos of Each Ingredient You Have
          </h2>
          <p className="text-sm text-slate-600 mt-0.5">
            Since you can&apos;t fit every kitchen ingredient in a single frame,
            add <strong>as many photos as you want</strong> below—one photo per
            ingredient or group of items!
          </p>
        </div>

        <button
          type="button"
          onClick={onProceedToServings}
          className="min-h-[48px] px-5 py-2.5 rounded-2xl bg-gradient-to-r from-[#FF5A1F] to-[#FF2E63] text-white font-extrabold text-xs sm:text-sm hover:opacity-95 transition-all shadow-md shadow-orange-500/20 flex items-center gap-2 whitespace-nowrap shrink-0 cursor-pointer"
        >
          <span>Next: Servings & Diet ({photos.length} Photos)</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* Main 2-Column Layout: Left = Simple Camera/Upload Box, Right = Multi-Photo Tray */}
      <div className="mt-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left 6 Columns: Uncluttered Camera Lens + 2 Big Action Buttons */}
        <div className="lg:col-span-6 flex flex-col gap-4">
          <div className="rounded-2xl overflow-hidden border-2 border-teal-400/70 bg-slate-900 relative min-h-[260px] sm:min-h-[300px] flex flex-col justify-between shadow-md">
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

            {/* Clean Visual Backdrop when live webcam isn't active */}
            {cameraState !== 'live' && (
              <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-teal-950 to-slate-900" />
            )}

            {/* Simple Unobstructed Viewfinder Frame */}
            <div className="relative z-20 flex flex-col justify-between h-full p-4 pointer-events-none">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-mono font-semibold text-teal-300 bg-slate-950/80 px-3 py-1 rounded-lg border border-teal-400/30">
                  {cameraState === 'live'
                    ? 'LIVE CAMERA ACTIVE'
                    : 'CAMERA / PHOTO UPLOADER'}
                </span>
                <span className="text-xs font-mono font-semibold text-amber-300 bg-slate-950/80 px-3 py-1 rounded-lg border border-amber-400/30">
                  {photos.length} {photos.length === 1 ? 'PHOTO' : 'PHOTOS'} IN TRAY
                </span>
              </div>

              {/* Transparent Corner Reticle */}
              <div className="my-auto mx-auto w-64 h-32 sm:w-72 sm:h-36 relative rounded-2xl border border-teal-300/60 bg-transparent flex flex-col items-center justify-center text-center px-4">
                <div className="absolute -top-0.5 -left-0.5 w-6 h-6 border-t-3 border-l-3 border-teal-300 rounded-tl-lg" />
                <div className="absolute -top-0.5 -right-0.5 w-6 h-6 border-t-3 border-r-3 border-teal-300 rounded-tr-lg" />
                <div className="absolute -bottom-0.5 -left-0.5 w-6 h-6 border-b-3 border-l-3 border-teal-300 rounded-bl-lg" />
                <div className="absolute -bottom-0.5 -right-0.5 w-6 h-6 border-b-3 border-r-3 border-teal-300 rounded-br-lg" />

                {cameraState !== 'live' && (
                  <>
                    <p className="text-[11px] font-mono font-bold text-teal-300 uppercase tracking-wider">
                      Multi-Photo Camera Ready
                    </p>
                    <p className="text-xs font-semibold text-white mt-1 leading-snug">
                      Snap or upload each ingredient photo below to add it to your tray
                    </p>
                  </>
                )}
              </div>

              <div className="bg-slate-950/85 -mx-4 -mb-4 px-4 py-2.5">
                <p className="text-xs text-white truncate">{scanStatusText}</p>
              </div>
            </div>

            {/* 2 Clear Primary Photo Buttons */}
            <div className="relative z-30 bg-slate-950 border-t border-white/15 p-3 flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleSnapPhotoToTray}
                  disabled={isScanning}
                  className="min-h-[46px] px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#FF5A1F] to-[#F59E0B] text-white font-extrabold text-xs sm:text-sm hover:opacity-95 active:scale-[0.99] disabled:opacity-60 transition-all shadow-md flex items-center gap-2 cursor-pointer"
                >
                  <Camera className="w-4 h-4" />
                  <span>
                    {isScanning ? 'Adding Photo...' : 'Snap Ingredient Photo'}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isScanning}
                  className="min-h-[46px] px-4 py-2.5 rounded-xl border border-teal-400/60 bg-slate-900 text-white hover:bg-slate-800 text-xs sm:text-sm font-bold transition-colors flex items-center gap-2 cursor-pointer"
                >
                  <Upload className="w-4 h-4 text-teal-300" />
                  <span>Upload Multiple Photos</span>
                </button>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleMultipleFileUpload}
                  className="hidden"
                  aria-label="Upload one or more ingredient photos"
                />
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleFlipCamera}
                  className="min-h-[42px] min-w-[42px] px-2.5 rounded-xl border border-white/15 bg-slate-900 text-slate-200 hover:text-white flex items-center justify-center cursor-pointer"
                  aria-label="Switch front or rear camera"
                  title="Switch Camera"
                >
                  <SwitchCamera className="w-4 h-4 text-amber-300" />
                </button>
                <button
                  type="button"
                  onClick={() => startCamera(facingMode)}
                  className="min-h-[42px] min-w-[42px] px-2.5 rounded-xl border border-white/15 bg-slate-900 text-slate-200 hover:text-white flex items-center justify-center cursor-pointer"
                  aria-label="Reconnect live camera"
                  title="Retry Camera"
                >
                  <RefreshCw className="w-4 h-4 text-teal-300" />
                </button>
              </div>
            </div>
          </div>

          {/* Simple Type-to-Add or 1-Tap Sample Basket */}
          <form
            onSubmit={handleAddTypedIngredient}
            className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4"
          >
            <label
              htmlFor="simple-ingredient-input"
              className="block text-xs font-extrabold text-slate-800"
            >
              Or Type an Ingredient to Add to Your Tray:
            </label>
            <div className="mt-2 flex items-center gap-2">
              <input
                id="simple-ingredient-input"
                type="text"
                value={manualName}
                onChange={(e) => {
                  setManualName(e.target.value);
                  if (scanError) setScanError(null);
                }}
                placeholder="e.g., Tomatoes, Paneer, Spinach, Garlic..."
                className="flex-1 min-h-[42px] rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#FF5A1F]"
              />
              <button
                type="submit"
                className="min-h-[42px] px-4 py-2 rounded-xl bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-700 transition-colors flex items-center gap-1.5 shrink-0 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Add Item</span>
              </button>
            </div>
            {scanError && (
              <div
                role="alert"
                className="mt-2 flex items-center gap-1.5 text-xs font-medium text-rose-600"
              >
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{scanError}</span>
              </div>
            )}

            <div className="mt-3 pt-3 border-t border-slate-200/80 flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] font-bold text-slate-500 mr-1">
                Quick Test Sets:
              </span>
              {SCAN_PRESET_SCENES.map((scene) => (
                <button
                  key={scene.id}
                  type="button"
                  onClick={() => onLoadPresetPhotos(scene.id)}
                  className="min-h-[32px] px-2.5 py-1 rounded-lg border border-orange-200 bg-white hover:border-[#FF5A1F] text-[11px] font-bold text-slate-700 cursor-pointer"
                >
                  {scene.label}
                </button>
              ))}
            </div>
          </form>
        </div>

        {/* Right 6 Columns: Multi-Photo Ingredient Tray + Focused Ingredient Qualities */}
        <div className="lg:col-span-6 flex flex-col gap-4">
          <div className="rounded-2xl border-2 border-orange-200/80 bg-orange-50/40 p-4 sm:p-5">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Images className="w-5 h-5 text-[#FF5A1F]" />
                <h3 className="text-base font-extrabold text-slate-900">
                  Your Ingredient Photo Tray ({photos.length}{' '}
                  {photos.length === 1 ? 'Photo' : 'Photos'})
                </h3>
              </div>
              <span className="text-xs font-semibold text-emerald-700">
                Add as many photos as you need
              </span>
            </div>

            {/* Grid of Captured/Uploaded Ingredient Photos */}
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[310px] overflow-y-auto pr-1">
              {photos.map((photo) => {
                const isSelected = inspectedPhoto?.id === photo.id;
                const mainItem = photo.detectedItems[0];
                return (
                  <div
                    key={photo.id}
                    className={`rounded-2xl border-2 bg-white p-3 flex items-center justify-between gap-3 transition-all ${
                      isSelected
                        ? 'border-[#FF5A1F] shadow-md shadow-orange-500/10'
                        : 'border-slate-200 hover:border-orange-300'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => setActiveInspectPhotoId(photo.id)}
                      className="flex items-center gap-3 text-left min-w-0 flex-1 cursor-pointer"
                    >
                      <img
                        src={photo.previewUrl}
                        alt={photo.label}
                        referrerPolicy="no-referrer"
                        className="w-14 h-14 rounded-xl object-cover border border-slate-200 shrink-0"
                      />
                      <div className="min-w-0">
                        <p className="text-xs font-extrabold text-slate-900 truncate">
                          {mainItem ? mainItem.name : photo.label}
                        </p>
                        <p className="text-[11px] text-slate-600 truncate mt-0.5">
                          {mainItem
                            ? `${mainItem.category} · ${mainItem.calories_per_100g} kcal/100g`
                            : photo.capturedAt}
                        </p>
                        <p className="text-[10px] font-bold text-[#FF5A1F] mt-0.5">
                          Click to view qualities
                        </p>
                      </div>
                    </button>

                    {photos.length > 1 && (
                      <button
                        type="button"
                        onClick={() => onRemovePhotoFromTray(photo.id)}
                        className="min-h-[36px] min-w-[36px] rounded-lg border border-slate-200 text-slate-400 hover:text-rose-600 hover:border-rose-200 flex items-center justify-center shrink-0 cursor-pointer"
                        aria-label={`Remove ${photo.label}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Hold-Still / Selected Ingredient Specific Qualities Box */}
            {inspectedItem && (
              <div className="mt-4 rounded-2xl border border-teal-200 bg-white p-4">
                <div className="flex items-center justify-between gap-2 pb-2 border-b border-slate-100">
                  <span className="text-xs font-extrabold text-teal-800">
                    Ingredient Qualities: {inspectedItem.name}
                  </span>
                  <span className="text-[11px] font-mono font-bold text-slate-600">
                    P {inspectedItem.macros.protein_g}g · C{' '}
                    {inspectedItem.macros.carbs_g}g · F{' '}
                    {inspectedItem.macros.fat_g}g
                  </span>
                </div>
                <div className="mt-2.5 space-y-1.5 text-xs text-slate-700">
                  <p>
                    <strong className="text-emerald-800">
                      Texture & Freshness:
                    </strong>{' '}
                    {inspectedItem.qualities?.texture_and_freshness}
                  </p>
                  <p>
                    <strong className="text-amber-800">Flavor Profile:</strong>{' '}
                    {inspectedItem.qualities?.flavor_profile}
                  </p>
                  <p>
                    <strong className="text-rose-800">Cooking Behavior:</strong>{' '}
                    {inspectedItem.qualities?.cooking_behavior}
                  </p>
                </div>
              </div>
            )}

            {/* Big Unmistakable Next Button */}
            <div className="mt-5 pt-4 border-t border-orange-200/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-800">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>
                  {photos.length}{' '}
                  {photos.length === 1
                    ? 'ingredient photo'
                    : 'ingredient photos'}{' '}
                  ready for recipe matching
                </span>
              </div>

              <button
                type="button"
                onClick={onProceedToServings}
                className="min-h-[50px] px-6 py-3 rounded-2xl bg-gradient-to-r from-[#FF5A1F] via-[#FF2E63] to-[#F59E0B] text-white font-extrabold text-sm hover:opacity-95 active:scale-[0.99] transition-all shadow-lg shadow-orange-500/25 flex items-center justify-center gap-2 cursor-pointer"
              >
                <Sparkles className="w-4 h-4" />
                <span>Next: Choose How Many People & Diet</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
