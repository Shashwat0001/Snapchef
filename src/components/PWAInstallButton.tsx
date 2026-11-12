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
          className="min-h-[40px] px-3.5 py-2 rounded-xl border border-white/15 bg-[#141619] hover:border-[#00F0FF]/50 hover:text-[#00F0FF] text-xs font-medium text-[#F2F5F8] transition-colors flex items-center gap-2 whitespace-nowrap shrink-0 cursor-pointer"
          aria-label="Install SnapChef App on Phone or Desktop"
        >
          <Download className="w-3.5 h-3.5 text-[#00F0FF]" />
          <span>{isIOS ? 'Install on iOS' : 'Install App'}</span>
        </button>
      ) : (
        <div className="rounded-2xl border border-white/10 bg-[#141619] p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#00F0FF]/10 border border-[#00F0FF]/30 flex items-center justify-center shrink-0">
              <Smartphone className="w-5 h-5 text-[#00F0FF]" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-[#F2F5F8]">
                Install SnapChef on Android, iPhone, Tablet & Desktop
              </h3>
              <p className="text-xs text-[#94A3B8] mt-0.5">
                Launch directly from your home screen with full-screen camera viewfinder and offline pantry persistence.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleInstallClick}
            className="min-h-[44px] px-4 py-2 rounded-xl bg-[#00F0FF] text-[#0D0D0D] font-semibold text-xs hover:bg-[#00F0FF]/90 transition-colors flex items-center gap-2 whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>{isInstallable ? 'Install Now' : 'Device Install Guide'}</span>
          </button>
        </div>
      )}

      {showGuideModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="pwa-guide-title"
        >
          <div className="w-full max-w-md rounded-2xl border border-white/15 bg-[#141619] p-6 shadow-2xl">
            <div className="flex items-center justify-between gap-4 pb-4 border-b border-white/10">
              <div className="flex items-center gap-2.5">
                <Smartphone className="w-5 h-5 text-[#00F0FF]" />
                <h3
                  id="pwa-guide-title"
                  className="text-base font-semibold text-[#F2F5F8]"
                >
                  Install SnapChef Web App
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowGuideModal(false)}
                className="min-h-[40px] min-w-[40px] rounded-lg text-[#94A3B8] hover:text-white hover:bg-white/5 flex items-center justify-center cursor-pointer"
                aria-label="Close installation guide"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-4 space-y-4 text-sm text-[#CBD5E1]">
              <div className="rounded-xl bg-[#0D0D0D] border border-white/10 p-3.5">
                <p className="font-semibold text-[#00F0FF] text-xs">
                  iPhone & iPad (iOS Safari)
                </p>
                <ol className="mt-2 space-y-1.5 text-xs text-[#94A3B8] list-decimal list-inside">
                  <li className="flex items-center gap-1.5">
                    <span>1. Tap the</span>
                    <Share2 className="w-3.5 h-3.5 text-[#F2F5F8] inline" />
                    <strong className="text-[#F2F5F8]">Share</strong>
                    <span>button in your Safari bottom bar.</span>
                  </li>
                  <li className="flex items-center gap-1.5">
                    <span>2. Select</span>
                    <PlusSquare className="w-3.5 h-3.5 text-[#F2F5F8] inline" />
                    <strong className="text-[#F2F5F8]">Add to Home Screen</strong>.
                  </li>
                </ol>
              </div>

              <div className="rounded-xl bg-[#0D0D0D] border border-white/10 p-3.5">
                <p className="font-semibold text-[#B8FF01] text-xs">
                  Android Phone & Tablet (Chrome)
                </p>
                <p className="mt-1.5 text-xs text-[#94A3B8]">
                  Tap the browser menu (<strong>⋮</strong>) in the top-right corner and select{' '}
                  <strong className="text-[#F2F5F8]">Install app</strong> or{' '}
                  <strong className="text-[#F2F5F8]">Add to Home screen</strong>.
                </p>
              </div>

              <div className="rounded-xl bg-[#0D0D0D] border border-white/10 p-3.5">
                <p className="font-semibold text-[#F2F5F8] text-xs">
                  Desktop Chrome / Edge
                </p>
                <p className="mt-1.5 text-xs text-[#94A3B8]">
                  Click the <strong>Install SnapChef</strong> icon on the right side of your address bar.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowGuideModal(false)}
              className="mt-5 w-full min-h-[44px] rounded-xl bg-[#00F0FF] text-[#0D0D0D] font-semibold text-sm hover:bg-[#00F0FF]/90 transition-colors cursor-pointer"
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
      className="fixed bottom-20 md:bottom-5 left-4 z-50 flex items-center gap-2 rounded-xl border border-amber-400/40 bg-[#141619]/95 backdrop-blur-md px-3.5 py-2 text-xs font-medium text-amber-300 shadow-lg"
    >
      <span>Offline Mode — Local virtual pantry & cached recipes active</span>
    </div>
  );
};
