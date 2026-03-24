import React from 'react';
import { Briefcase } from 'lucide-react';

/**
 * The initial "Start" splash screen.
 */
export default function StartScreen({ t, onStart }) {
    return (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-slate-900 p-6 text-center animate-in fade-in zoom-in duration-500">
            <Briefcase size={64} className="text-amber-400 mb-6 drop-shadow-lg" />
            <h1 className="text-4xl font-bold mb-4 tracking-wider">{t.ui.title}</h1>
            <p className="text-slate-400 mb-8 max-w-xs">{t.ui.subtitle}</p>
            <button
                onClick={() => onStart(0)}
                className="px-8 py-3 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-full shadow-lg transition-transform hover:scale-105 active:scale-95"
            >
                {t.ui.start}
            </button>
        </div>
    );
}
