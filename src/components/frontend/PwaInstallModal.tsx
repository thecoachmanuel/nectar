"use client";

import React, { useState, useEffect } from "react";
import { X, Download, Share, PlusSquare, Smartphone, CheckCircle, Apple } from "lucide-react";

interface PwaInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
  deferredPrompt: any;
}

export default function PwaInstallModal({ isOpen, onClose, deferredPrompt }: PwaInstallModalProps) {
  const [isIos, setIsIos] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const ua = window.navigator.userAgent;
      const ios = /iphone|ipad|ipod/i.test(ua);
      setIsIos(ios);

      const standalone = window.matchMedia("(display-mode: standalone)").matches || (window.navigator as any).standalone;
      setIsStandalone(!!standalone);
    }
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      try {
        deferredPrompt.prompt();
        const choice = await deferredPrompt.userChoice;
        if (choice.outcome === "accepted") {
          setInstalled(true);
        }
      } catch (e) {
        console.error("PWA install error", e);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-sm bg-white rounded-3xl shadow-2xl p-6 overflow-hidden border border-slate-100">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Top Header Badge */}
        <div className="flex flex-col items-center text-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-primary to-rose-500 flex items-center justify-center text-white shadow-lg shadow-primary/25 mb-4">
            <Smartphone className="w-8 h-8" />
          </div>

          <h3 className="text-xl font-bold text-slate-800">Download Nectar App</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-[240px]">
            Install Nectar on your phone for instant grocery delivery, fast checkout & live order tracking.
          </p>
        </div>

        {isStandalone || installed ? (
          <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-2xl flex items-center gap-3 text-green-700">
            <CheckCircle className="w-5 h-5 shrink-0" />
            <p className="text-xs font-semibold">Nectar App is already installed on your device!</p>
          </div>
        ) : isIos ? (
          /* iOS Step-by-Step Installation Instructions */
          <div className="mt-6 space-y-3 bg-rose-50/60 p-4 rounded-2xl border border-rose-100">
            <div className="flex items-center gap-2 text-primary font-bold text-xs">
              <Apple className="w-4 h-4" />
              <span>iOS / Safari Installation Steps</span>
            </div>

            <ol className="space-y-2 text-xs text-slate-700">
              <li className="flex items-start gap-2">
                <span className="font-bold text-primary shrink-0">1.</span>
                <span>Tap the <strong className="text-slate-900 inline-flex items-center gap-1 bg-white px-1.5 py-0.5 rounded border border-slate-200 shadow-2xs"><Share className="w-3 h-3 text-blue-500" /> Share</strong> button in Safari toolbar.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold text-primary shrink-0">2.</span>
                <span>Scroll down and select <strong className="text-slate-900 inline-flex items-center gap-1 bg-white px-1.5 py-0.5 rounded border border-slate-200 shadow-2xs"><PlusSquare className="w-3 h-3 text-slate-700" /> Add to Home Screen</strong>.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold text-primary shrink-0">3.</span>
                <span>Tap <strong className="text-primary font-bold">Add</strong> at the top right to install!</span>
              </li>
            </ol>
          </div>
        ) : (
          /* Android / Desktop One-Click Install Button or Guide */
          <div className="mt-6 space-y-3">
            {deferredPrompt ? (
              <button
                onClick={handleInstallClick}
                className="w-full h-12 rounded-2xl bg-primary text-white font-bold text-sm hover:bg-[#e60060] transition-colors shadow-lg shadow-primary/25 flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4" />
                Install Nectar App Now
              </button>
            ) : (
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs text-slate-600 space-y-2">
                <p className="font-bold text-slate-800 flex items-center gap-1.5">
                  <Download className="w-4 h-4 text-primary" /> Android / Chrome Instructions
                </p>
                <p>1. Tap the <strong>3 dots (⋮)</strong> menu icon at top right of Chrome.</p>
                <p>2. Tap <strong>&quot;Install app&quot;</strong> or <strong>&quot;Add to Home screen&quot;</strong>.</p>
              </div>
            )}
          </div>
        )}

        <button
          onClick={onClose}
          className="mt-4 w-full py-2.5 text-center text-xs font-semibold text-slate-400 hover:text-slate-600 transition-colors"
        >
          Maybe Later
        </button>

      </div>
    </div>
  );
}
