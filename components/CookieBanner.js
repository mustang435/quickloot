'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { X, Cookie, Shield, Check } from 'lucide-react';

export default function CookieBanner() {
  const [visible, setVisible] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const consent = localStorage.getItem('ql_cookie_consent');
    if (!consent) {
      // Small delay for better UX
      setTimeout(() => setVisible(true), 1000);
    }
  }, []);

  const acceptAll = () => {
    localStorage.setItem('ql_cookie_consent', JSON.stringify({
      essential: true,
      analytics: true,
      marketing: true,
      timestamp: new Date().toISOString(),
    }));
    setVisible(false);
  };

  const acceptEssential = () => {
    localStorage.setItem('ql_cookie_consent', JSON.stringify({
      essential: true,
      analytics: false,
      marketing: false,
      timestamp: new Date().toISOString(),
    }));
    setVisible(false);
  };

  if (!mounted || !visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 md:p-6 animate-in slide-in-from-bottom duration-500">
      <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-500 to-amber-500 px-5 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2 text-white">
            <Cookie className="w-5 h-5" />
            <span className="font-bold text-sm">Cookie Preferences</span>
          </div>
          <button
            onClick={acceptEssential}
            className="text-white/80 hover:text-white transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5">
          <div className="flex items-start gap-3 mb-4">
            <div className="bg-orange-50 p-2 rounded-lg flex-shrink-0">
              <Shield className="w-5 h-5 text-orange-500" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-800 mb-1">We value your privacy</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                We use cookies to enhance your browsing experience, analyze site traffic, and personalize content. 
                By clicking "Accept All", you consent to our use of cookies. 
                Read our{' '}
                <Link href="/privacy" className="text-orange-500 hover:underline font-medium">Privacy Policy</Link>
                {' '}and{' '}
                <Link href="/terms" className="text-orange-500 hover:underline font-medium">Terms of Service</Link>
                {' '}for more information.
              </p>
            </div>
          </div>

          {/* Cookie Types */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-5">
            {[
              { name: 'Essential', desc: 'Required for site to work', required: true },
              { name: 'Analytics', desc: 'Help us improve', required: false },
              { name: 'Marketing', desc: 'Personalized ads', required: false },
            ].map(cookie => (
              <div key={cookie.name} className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium text-gray-800 text-sm">{cookie.name}</span>
                  {cookie.required ? (
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Required</span>
                  ) : (
                    <span className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full">Optional</span>
                  )}
                </div>
                <p className="text-xs text-gray-500">{cookie.desc}</p>
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={acceptAll}
              className="flex-1 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-semibold py-3 px-6 rounded-xl transition-all shadow-sm flex items-center justify-center gap-2"
            >
              <Check className="w-4 h-4" />
              Accept All Cookies
            </button>
            <button
              onClick={acceptEssential}
              className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 px-6 rounded-xl transition-colors"
            >
              Essential Only
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
