'use client';

import { useState, useEffect } from 'react';
import { Cookie, X, Shield, ExternalLink } from 'lucide-react';
import Link from 'next/link';

export default function CookieConsent({ lang = 'en' }) {
  const [visible, setVisible] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const consent = localStorage.getItem('ql_cookie_consent');
    if (!consent) {
      setTimeout(() => setVisible(true), 1500);
    }
  }, []);

  const accept = () => {
    localStorage.setItem('ql_cookie_consent', JSON.stringify({ accepted: true, date: new Date().toISOString() }));
    setVisible(false);
  };

  const decline = () => {
    localStorage.setItem('ql_cookie_consent', JSON.stringify({ accepted: false, date: new Date().toISOString() }));
    setVisible(false);
  };

  if (!mounted || !visible) return null;

  const text = {
    en: {
      title: '🍪 Cookie & Privacy Notice',
      desc: 'We use cookies for analytics and advertising (Google AdSense). By continuing, you agree to our',
      privacy: 'Privacy Policy',
      terms: 'Terms of Use',
      accept: 'Accept All',
      decline: 'Decline',
      gdpr: 'GDPR Compliant',
    },
    fr: {
      title: '🍪 Avis sur les cookies et la confidentialité',
      desc: 'Nous utilisons des cookies pour l\'analyse et la publicité (Google AdSense). En continuant, vous acceptez notre',
      privacy: 'Politique de confidentialité',
      terms: 'Conditions d\'utilisation',
      accept: 'Tout accepter',
      decline: 'Refuser',
      gdpr: 'Conforme au RGPD',
    },
  };

  const t = text[lang] || text.en;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 animate-in slide-in-from-bottom duration-300">
      <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-5">
          {/* Icon */}
          <div className="flex-shrink-0 bg-orange-100 p-3 rounded-xl">
            <Cookie className="w-6 h-6 text-orange-500" />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-bold text-gray-800 text-sm">{t.title}</h3>
              <span className="flex items-center gap-1 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                <Shield className="w-3 h-3" /> {t.gdpr}
              </span>
            </div>
            <p className="text-xs text-gray-500 leading-relaxed">
              {t.desc}{' '}
              <Link href="/privacy" className="text-orange-500 hover:underline">{t.privacy}</Link>
              {' & '}
              <Link href="/terms" className="text-orange-500 hover:underline">{t.terms}</Link>.
              {lang === 'en' ? ' You can withdraw consent at any time.' : ' Vous pouvez retirer votre consentement à tout moment.'}
            </p>
          </div>

          {/* Buttons */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={decline}
              className="px-4 py-2 text-xs font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              {t.decline}
            </button>
            <button
              onClick={accept}
              className="px-4 py-2 text-xs font-bold text-white bg-orange-500 hover:bg-orange-600 rounded-lg transition-colors shadow-sm"
            >
              {t.accept}
            </button>
            <button onClick={decline} className="text-gray-400 hover:text-gray-600 transition-colors ml-1">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
