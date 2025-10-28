"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";

export function PWAInstallPrompt() {
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
    const [showPrompt, setShowPrompt] = useState(false);
    const [isIOS, setIsIOS] = useState(false);
    const [isStandalone, setIsStandalone] = useState(false);

    useEffect(() => {
        // Check if iOS
        const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
        setIsIOS(iOS);

        // Check if already installed
        const standalone = window.matchMedia("(display-mode: standalone)").matches;
        setIsStandalone(standalone);

        // Check if already dismissed
        const dismissed = localStorage.getItem("pwa-install-dismissed");
        if (dismissed && Date.now() - parseInt(dismissed) < 7 * 24 * 60 * 60 * 1000) {
            return; // Don't show if dismissed within last 7 days
        }

        // Listen for beforeinstallprompt event (Android/Chrome)
        const handler = (e: any) => {
            e.preventDefault();
            setDeferredPrompt(e);
            // Show prompt after 3 seconds
            setTimeout(() => setShowPrompt(true), 3000);
        };

        window.addEventListener("beforeinstallprompt", handler);

        // Show iOS prompt if iOS and not standalone
        if (iOS && !standalone && !dismissed) {
            setTimeout(() => setShowPrompt(true), 5000);
        }

        return () => window.removeEventListener("beforeinstallprompt", handler);
    }, []);

    const handleInstall = async () => {
        if (deferredPrompt) {
            deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            if (outcome === "accepted") {
                setDeferredPrompt(null);
                setShowPrompt(false);
            }
        }
    };

    const handleDismiss = () => {
        setShowPrompt(false);
        localStorage.setItem("pwa-install-dismissed", Date.now().toString());
    };

    if (!showPrompt || isStandalone) return null;

    return (
        <div className="fixed bottom-20 md:bottom-6 left-4 right-4 md:left-auto md:right-6 md:w-96 z-50 animate-slide-up">
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg shadow-2xl p-4 text-white">
                <button
                    onClick={handleDismiss}
                    className="absolute top-2 right-2 p-1 hover:bg-white/20 rounded-full transition-colors"
                >
                    <X className="h-4 w-4" />
                </button>

                <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-12 h-12 bg-white rounded-lg flex items-center justify-center">
                        <img src="/icons/icon-72x72.png" alt="App Icon" className="w-10 h-10" />
                    </div>

                    <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-base mb-1">Install Taadiway CRM</h3>
                        <p className="text-sm text-blue-100 mb-3">
                            {isIOS
                                ? "Tap Share → Add to Home Screen for the best experience"
                                : "Get faster access and work offline"}
                        </p>

                        {!isIOS && deferredPrompt && (
                            <button
                                onClick={handleInstall}
                                className="bg-white text-blue-600 px-4 py-2 rounded-lg font-medium text-sm hover:bg-blue-50 transition-colors active:scale-95"
                            >
                                Install App
                            </button>
                        )}

                        {isIOS && (
                            <div className="flex items-center gap-2 text-xs text-blue-100">
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M16.5 3c-1.74 0-3.41.81-4.5 2.09C10.91 3.81 9.24 3 7.5 3 4.42 3 2 5.42 2 8.5c0 3.78 3.4 6.86 8.55 11.54L12 21.35l1.45-1.32C18.6 15.36 22 12.28 22 8.5 22 5.42 19.58 3 16.5 3zm-4.4 15.55l-.1.1-.1-.1C7.14 14.24 4 11.39 4 8.5 4 6.5 5.5 5 7.5 5c1.54 0 3.04.99 3.57 2.36h1.87C13.46 5.99 14.96 5 16.5 5c2 0 3.5 1.5 3.5 3.5 0 2.89-3.14 5.74-7.9 10.05z" />
                                </svg>
                                <span>Share button at bottom of screen</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
