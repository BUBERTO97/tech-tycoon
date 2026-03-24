import React from 'react';
import { Trophy, Skull, RotateCcw } from 'lucide-react';

/**
 * Game-over / victory screen shown after a run ends.
 */
export default function GameOverScreen({
    t,
    isVictory,
    currentEraLoc,
    kingNumber,
    lastRunYears,
    gameOverReason,
    maxPossibleSkip,
    skipAmount,
    setSkipAmount,
    onRestart,
    onSkipStart,
    metaCoins,
}) {
    return (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-slate-900 p-8 text-center animate-in slide-in-from-bottom-8 duration-500">
            {isVictory ? (
                <Trophy size={80} className="text-yellow-400 mb-4 drop-shadow-[0_0_15px_rgba(250,204,21,0.5)] animate-bounce" />
            ) : (
                <Skull size={64} className="text-red-500 mb-4 drop-shadow-lg" />
            )}

            <h2 className={`text-2xl font-bold mb-2 ${isVictory ? 'text-yellow-400' : ''}`}>
                {isVictory ? 'SINGULARITY ACHIEVED' : `${currentEraLoc.title} #${kingNumber} ${t.ui.dead}`}
            </h2>
            <p className={`text-lg mb-4 ${isVictory ? 'text-slate-200' : 'text-amber-500'}`}>
                {t.ui.ruledFor} {lastRunYears} {t.ui.sprints}
            </p>

            <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 shadow-xl mb-6 w-full max-w-sm">
                <p className={`text-sm italic ${isVictory ? 'text-yellow-100' : 'text-slate-300'}`}>"{gameOverReason}"</p>
            </div>

            <button
                onClick={() => onRestart(0)}
                className="flex items-center justify-center gap-2 w-full max-w-xs py-3 bg-slate-700 hover:bg-slate-600 text-white font-bold rounded-full shadow-lg transition-transform hover:scale-105 active:scale-95 mb-4"
            >
                <RotateCcw size={20} /> {t.ui.restart}
            </button>

            {maxPossibleSkip > 0 && (
                <div className="w-full max-w-xs bg-slate-800 p-4 rounded-xl border border-slate-700 flex flex-col gap-3">
                    <p className="text-sm text-slate-400 font-bold">{t.ui.skipTime}</p>
                    <div className="flex justify-between text-xs text-amber-400">
                        <span>0 {t.ui.sprints}</span>
                        <span>{maxPossibleSkip} {t.ui.sprints}</span>
                    </div>
                    <input
                        type="range" min="0" max={maxPossibleSkip}
                        value={skipAmount} onChange={(e) => setSkipAmount(Number(e.target.value))}
                        className="w-full accent-amber-500"
                    />
                    <button
                        disabled={skipAmount === 0}
                        onClick={() => onSkipStart(skipAmount)}
                        className={`py-2 rounded-full font-bold transition-all text-sm ${skipAmount > 0 ? 'bg-amber-600 hover:bg-amber-500 text-white' : 'bg-slate-700 text-slate-500 cursor-not-allowed'}`}
                    >
                        {t.ui.skipBtn} {skipAmount} {t.ui.sprints} ({t.ui.skipCost}: {skipAmount * 5} 🪙)
                    </button>
                </div>
            )}
        </div>
    );
}
