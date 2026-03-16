import React, { useState, useEffect } from 'react';

const PwaPrompt: React.FC = () => {
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone) {
      setIsStandalone(true);
      return;
    }

    // Detect iOS
    const ua = window.navigator.userAgent;
    const isIOSDevice = /iPad|iPhone|iPod/.test(ua) && !(window as any).MSStream;
    setIsIOS(isIOSDevice);

    if (isIOSDevice) {
      // Show iOS instruction after a short delay
      setTimeout(() => setShowPrompt(true), 2000);
    }

    // Listen to Android/Chrome installation prompt banner
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault(); // Prevent standard mini-infobar
      setDeferredPrompt(e);
      setShowPrompt(true); // Show our custom UI
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setShowPrompt(false);
    }
    setDeferredPrompt(null);
  };

  if (isStandalone || !showPrompt) return null;

  return (
    <div className="fixed bottom-6 left-0 right-0 z-50 px-4 animate-in slide-in-from-bottom duration-700">
      <div className="mx-auto max-w-sm bg-[#111111]/90 dark:bg-[#EFEFEF]/90 backdrop-blur-md rounded-2xl p-4 shadow-2xl border border-white/10 dark:border-black/10 flex items-center justify-between">
        <div className="flex flex-col">
          <span className="text-[#F5F5F0] dark:text-[#080808] font-bold text-sm tracking-widest">天地玄机 · 原生体验</span>
          {isIOS ? (
            <span className="text-white/60 dark:text-black/60 text-xs mt-1">
              点击下方 <span className="inline-block px-1 border border-white/30 dark:border-black/30 rounded mx-1">分享</span> 选择「添加到主屏幕」
            </span>
          ) : (
            <span className="text-white/60 dark:text-black/60 text-xs mt-1">添加至桌面，随时静心起卦</span>
          )}
        </div>
        
        {!isIOS && (
          <button 
            onClick={handleInstallClick}
            className="ml-4 px-4 py-2 bg-[#8B1D1D] dark:bg-[#A32626] text-[#F5F5F0] text-xs font-bold tracking-widest rounded-lg active:scale-95 transition-transform"
          >
            安 装
          </button>
        )}
        
        <button 
          onClick={() => setShowPrompt(false)}
          className="ml-3 p-1 text-white/40 dark:text-black/40 hover:text-white dark:hover:text-black"
        >
          ✕
        </button>
      </div>
    </div>
  );
};

export default PwaPrompt;
