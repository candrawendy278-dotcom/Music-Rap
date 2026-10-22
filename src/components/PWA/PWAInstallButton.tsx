import React, { useState } from 'react';
import { usePWAInstall } from '../../hooks/usePWAInstall';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  // If already running as an installed standalone PWA, hide the button
  if (isInstalled) {
    return null;
  }

  // Chromium / Android / Desktop install prompt
  if (isInstallable) {
    return (
      <button
        onClick={install}
        className="flex items-center gap-1.5 rounded-full bg-emerald-600/90 hover:bg-emerald-600 px-3 py-1.5 text-xs font-black text-white shadow-sm active:scale-95 transition cursor-pointer"
        title="Install Music Rap as an App"
      >
        <i className="ph ph-download-simple text-sm"></i>
        <span>Install App</span>
      </button>
    );
  }

  // iOS Safari flow
  if (isIOS) {
    return (
      <>
        <button
          onClick={() => setShowIOSGuide(true)}
          className="flex items-center gap-1.5 rounded-full bg-zinc-800 hover:bg-zinc-700 px-3 py-1.5 text-xs font-bold text-zinc-200 border border-zinc-700 active:scale-95 transition cursor-pointer"
          title="Install on iOS"
        >
          <i className="ph ph-apple-logo text-sm"></i>
          <span>Install App</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm animate-in fade-in">
            <div className="w-full max-w-sm rounded-2xl bg-zinc-900 border border-zinc-800 p-6 shadow-2xl text-white">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                    <i className="ph ph-device-mobile text-lg"></i>
                  </div>
                  <h3 className="text-base font-black text-white">Install on iPhone / iPad</h3>
                </div>
                <button
                  onClick={() => setShowIOSGuide(false)}
                  className="text-zinc-400 hover:text-white"
                >
                  <i className="ph ph-x text-lg"></i>
                </button>
              </div>

              <p className="text-xs text-zinc-300 leading-relaxed mb-4">
                To play Music Rap offline anytime without an internet connection:
              </p>

              <div className="space-y-2 text-xs bg-zinc-950 p-3.5 rounded-xl border border-zinc-800/80 mb-4">
                <div className="flex items-start space-x-2">
                  <span className="font-mono text-emerald-400 font-black">1.</span>
                  <span>Tap the <strong>Share</strong> button in Safari's toolbar.</span>
                </div>
                <div className="flex items-start space-x-2">
                  <span className="font-mono text-emerald-400 font-black">2.</span>
                  <span>Scroll down and tap <strong>Add to Home Screen</strong>.</span>
                </div>
                <div className="flex items-start space-x-2">
                  <span className="font-mono text-emerald-400 font-black">3.</span>
                  <span>Launch from your home screen and play offline anytime!</span>
                </div>
              </div>

              <button
                onClick={() => setShowIOSGuide(false)}
                className="w-full rounded-xl bg-emerald-600 hover:bg-emerald-500 py-2.5 text-xs font-black text-white transition active:scale-95 cursor-pointer"
              >
                Got It
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};
