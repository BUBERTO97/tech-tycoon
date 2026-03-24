import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown } from 'lucide-react';
import { LANGUAGE_OPTIONS } from '../constants/gameData';

export default function LanguageSelector({ lang, setLang }) {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);
    const selected = LANGUAGE_OPTIONS.find(o => o.code === lang);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setIsOpen(false);
            }
        };
        if (isOpen) {
            document.addEventListener('pointerdown', handleClickOutside);
        }
        return () => document.removeEventListener('pointerdown', handleClickOutside);
    }, [isOpen]);

    return (
        <div ref={dropdownRef} className="relative">
            <button
                onClick={() => setIsOpen(prev => !prev)}
                className="flex items-center gap-1.5 bg-slate-800 pl-2.5 pr-2 py-1.5 rounded-full border border-slate-700 hover:border-slate-500 transition-all duration-200 cursor-pointer group"
                aria-haspopup="listbox"
                aria-expanded={isOpen}
            >
                <span className="text-base leading-none">{selected?.flag}</span>
                <span className="text-xs font-bold text-slate-200 uppercase hidden sm:inline">{selected?.code}</span>
                <ChevronDown
                    size={14}
                    className={`text-slate-400 group-hover:text-slate-200 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                />
            </button>

            {isOpen && (
                <div
                    className="absolute right-0 top-full mt-2 rounded-xl shadow-2xl"
                    style={{
                        background: 'rgba(30, 41, 59, 0.92)',
                        backdropFilter: 'blur(16px)',
                        WebkitBackdropFilter: 'blur(16px)',
                        border: '1px solid rgba(148, 163, 184, 0.15)',
                        animation: 'langDropIn 0.2s ease-out',
                        minWidth: '160px',
                        maxHeight: '220px',
                        overflowY: 'auto',
                        zIndex: 100,
                    }}
                    role="listbox"
                >
                    {LANGUAGE_OPTIONS.map((opt) => (
                        <button
                            key={opt.code}
                            role="option"
                            aria-selected={opt.code === lang}
                            onClick={() => { setLang(opt.code); setIsOpen(false); }}
                            className="w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors duration-150 cursor-pointer"
                            style={{
                                background: opt.code === lang ? 'rgba(251, 191, 36, 0.12)' : 'transparent',
                                color: opt.code === lang ? '#fbbf24' : '#cbd5e1',
                            }}
                            onMouseEnter={(e) => {
                                if (opt.code !== lang) e.currentTarget.style.background = 'rgba(148, 163, 184, 0.1)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.background = opt.code === lang ? 'rgba(251, 191, 36, 0.12)' : 'transparent';
                            }}
                        >
                            <span className="text-lg leading-none">{opt.flag}</span>
                            <span className="text-sm font-semibold">{opt.label}</span>
                            {opt.code === lang && (
                                <span className="ml-auto text-amber-400 text-xs">✓</span>
                            )}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
