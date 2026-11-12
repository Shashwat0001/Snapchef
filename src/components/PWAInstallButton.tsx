import React, { useState } from 'react';
import { Download, Smartphone, X, Share2, PlusSquare } from 'lucide-react';
import { usePWAInstall, useOnlineStatus } from '../hooks/usePWAInstall';

export const PWAInstallModalTrigger: React.FC<{
  variant?: 'compact' | 'banner';
}> = ({ variant = 'compact' }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showGuideModal, setShowGuideModal] = useState(false);

  if (isInstalled) {
    return null;
  }

  const handleInstallClick = async () => {
    if (isInstallable) {
      await install();
    } else {
      setShowGuideModal(true);
    }
  };

  return (
    <>
      {variant === 'compact' ? (
        <button
          type="button"
          onClick={handleInstallClick}
          className="min-h-[40px] px-4 py-2 rounded-xl bg-gradient-to-r from-[#FF5A1F] to-[#FF2E63] hover:opacity-95 text-xs font-bold text-white shadow-md shadow-rose-500/20 transition-all flex items-center gap-2 whitespace-nowrap shrink-0 cursor-pointer"
          aria-label="Install SnapChef App on Phone or Desktop"
        >
          <Download className="w-3.5 h-3.5 text-white" />
          <span>{isIOS ? 'Install on iOS' : 'Install App'}</span>
        </button>
      ) : (
        <div className="rounded-3xl border-2 border-teal-200 bg-gradient-to-r from-teal-50 via-emerald-50 to-cyan-50 p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-md">
          <div className="flex items-start gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-600 text-white flex items-center justify-center shrink-0 shadow-md">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-slate-900">
                Install SnapChef on Android, iPhone, Tablet & Desktop
              </h3>
              <p className="text-xs text-slate-600 mt-0.5">
                Launch directly from your home screen with full-screen camera lens scanner and offline pantry sync.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleInstallClick}
            className="min-h-[44px] px-4 py-2 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 text-white font-bold text-xs hover:opacity-95 transition-all flex items-center gap-2 whitespace-nowrap shrink-0 cursor-pointer shadow-sm"
          >
            <Download className="w-4 h-4" />
            <span>{isInstallable ? 'Install Now' : 'Device Install Guide'}</span>
          </button>
        </div>
      )}

      {showGuideModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="pwa-guide-title"
        >
          <div className="w-full max-w-md rounded-3xl border-2 border-orange-200 bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between gap-4 pb-4 border-b border-slate-200">
              <div className="flex items-center gap-2.5">
                <Smartphone className="w-5 h-5 text-[#FF5A1F]" />
                <h3
                  id="pwa-guide-title"
                  className="text-base font-extrabold text-slate-900"
                >
                  Install SnapChef Web App
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowGuideModal(false)}
                className="min-h-[40px] min-w-[40px] rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 flex items-center justify-center cursor-pointer"
                aria-label="Close installation guide"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-4 space-y-3.5 text-sm text-slate-700">
              <div className="rounded-2xl bg-orange-50/70 border border-orange-200 p-3.5">
                <p className="font-extrabold text-[#EA580C] text-xs">
                  iPhone & iPad (iOS Safari)
                </p>
                <ol className="mt-2 space-y-1.5 text-xs text-slate-700 list-decimal list-inside">
                  <li className="flex items-center gap-1.5">
                    <span>1. Tap the</span>
                    <Share2 className="w-3.5 h-3.5 text-slate-900 inline" />
                    <strong className="text-slate-900">Share</strong>
                    <span>button in your Safari bottom bar.</span>
                  </li>
                  <li className="flex items-center gap-1.5">
                    <span>2. Select</span>
                    <PlusSquare className="w-3.5 h-3.5 text-slate-900 inline" />
                    <strong className="text-slate-900">Add to Home Screen</strong>.
                  </li>
                </ol>
              </div>

              <div className="rounded-2xl bg-emerald-50/70 border border-emerald-200 p-3.5">
                <p className="font-extrabold text-emerald-700 text-xs">
                  Android Phone & Tablet (Chrome)
                </p>
                <p className="mt-1.5 text-xs text-slate-700">
                  Tap the browser menu (<strong>⋮</strong>) in the top-right corner and select{' '}
                  <strong className="text-slate-900">Install app</strong> or{' '}
                  <strong className="text-slate-900">Add to Home screen</strong>.
                </p>
              </div>

              <div className="rounded-2xl bg-sky-50/70 border border-sky-200 p-3.5">
                <p className="font-extrabold text-sky-800 text-xs">
                  Desktop Chrome / Edge
                </p>
                <p className="mt-1.5 text-xs text-slate-700">
                  Click the <strong>Install SnapChef</strong> icon on the right side of your address bar.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowGuideModal(false)}
              className="mt-5 w-full min-h-[44px] rounded-xl bg-gradient-to-r from-[#FF5A1F] to-[#FF2E63] text-white font-bold text-sm hover:opacity-95 transition-all cursor-pointer"
            >
              Got It
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div
      role="status"
      className="fixed bottom-20 md:bottom-5 left-4 z-50 flex items-center gap-2 rounded-xl border border-amber-400 bg-amber-50 px-3.5 py-2 text-xs font-bold text-amber-900 shadow-lg"
    >
      <span>Offline Mode — Local virtual pantry & cached recipes active</span>
    </div>
  );
};
