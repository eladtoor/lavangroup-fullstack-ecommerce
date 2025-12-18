'use client';

import { useState, useEffect, useRef } from 'react';
import { Globe } from 'lucide-react';

interface Language {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
}

const languages: Language[] = [
  { code: 'iw', name: 'Hebrew', nativeName: 'עברית', flag: '🇮🇱' },
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇬🇧' },
  { code: 'ru', name: 'Russian', nativeName: 'Русский', flag: '🇷🇺' },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية', flag: '🇸🇦' },
];

export default function TranslateButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [currentLang, setCurrentLang] = useState<Language>(languages[0]);
  const [isReady, setIsReady] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    // Load saved language from localStorage and update UI
    const savedLang = localStorage.getItem('selectedLanguage') || 'iw';
    const lang = languages.find(l => l.code === savedLang);
    if (lang) {
      setCurrentLang(lang);
    }
  }, []);

  const setCookie = (name: string, value: string, days: number) => {
    const expires = new Date();
    expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
    document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/`;
  };

  const translatePage = (langCode: string) => {
    const lang = languages.find(l => l.code === langCode) || languages[0];
    setCurrentLang(lang);
    setIsOpen(false);

    // Save to localStorage
    localStorage.setItem('selectedLanguage', langCode);

    // Set Google Translate cookie (format: /source/target)
    if (langCode === 'iw') {
      // Reset to Hebrew (original)
      document.cookie = 'googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
      window.location.reload();
    } else {
      // Translate from Hebrew (iw) to target language
      const googleTransValue = `/iw/${langCode}`;
      setCookie('googtrans', googleTransValue, 365);
      
      // Force reload to apply translation
      window.location.reload();
    }
  };

  const isHebrew = currentLang.code === 'iw';

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-white transition-colors border border-gray-700 hover:border-red-500 ${
          isHebrew ? 'p-2.5' : 'px-3 py-2'
        }`}
        aria-label="בחר שפה"
      >
        {isHebrew ? (
          <Globe className="w-6 h-6" />
        ) : (
          <>
            <Globe className="w-5 h-5" />
            <span className="text-base font-medium hidden sm:inline">{currentLang.flag} {currentLang.nativeName}</span>
            <span className="text-base font-medium sm:hidden">{currentLang.flag}</span>
          </>
        )}
        <i className={`fas fa-chevron-down text-xs transition-transform ${isOpen ? 'rotate-180' : ''}`}></i>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-2 bg-gray-900 border border-gray-700 rounded-lg shadow-2xl overflow-hidden z-50 min-w-[180px]">
          {languages.map((lang) => (
            <button
              key={lang.code}
              onClick={() => translatePage(lang.code)}
              className={`w-full flex items-center gap-3 px-4 py-3 text-right transition-colors ${
                currentLang.code === lang.code
                  ? 'bg-red-600 text-white'
                  : 'text-gray-300 hover:bg-gray-800 hover:text-white'
              }`}
            >
              <span className="text-2xl">{lang.flag}</span>
              <span className="font-medium">{lang.nativeName}</span>
            </button>
          ))}
        </div>
      )}

    </div>
  );
}
