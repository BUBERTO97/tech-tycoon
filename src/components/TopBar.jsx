import React, { useState } from 'react';
import { Shield, Users, Cpu, Coins, X, Eye } from 'lucide-react';

const ICON_MAP = { security: Shield, morale: Users, tech: Cpu, budget: Coins };

// ── Stat Info Modal ────────────────────────────────────────────────────────────
function StatInfoModal({ statKey, statLoc, value, metaCoins, onReveal, onClose, ui, revealed }) {
    const Icon = ICON_MAP[statKey];
    const canAfford = metaCoins >= 1;

    return (
        <div
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
            onClick={onClose}
        >
            <div
                className="relative w-full max-w-sm rounded-2xl border border-slate-700 shadow-2xl overflow-hidden"
                style={{ background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)' }}
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-5 pt-5 pb-3">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center border border-slate-600">
                            <Icon size={20} className="text-amber-400" />
                        </div>
                        <h2 className="text-lg font-bold text-slate-100">{statLoc.title}</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1.5 rounded-full bg-slate-700 hover:bg-slate-600 text-slate-400 hover:text-slate-100 transition-colors"
                    >
                        <X size={16} />
                    </button>
                </div>

                {/* Divider */}
                <div className="mx-5 h-px bg-slate-700 mb-4" />

                {/* Description */}
                <p className="px-5 text-sm text-slate-300 leading-relaxed mb-5">
                    {statLoc.description}
                </p>

                {/* Reveal section */}
                {revealed !== null ? (
                    <div className="mx-5 mb-5 rounded-xl bg-slate-700/60 border border-slate-600 p-4 flex flex-col items-center gap-1">
                        <span className="text-xs text-slate-400 uppercase tracking-wider">{ui.currentValue}</span>
                        {/* Bar */}
                        <div className="w-full h-3 bg-slate-600 rounded-full mt-2 overflow-hidden">
                            <div
                                className="h-full rounded-full transition-all duration-700"
                                style={{
                                    width: `${revealed}%`,
                                    background: revealed > 65 ? '#22c55e' : revealed > 35 ? '#f59e0b' : '#ef4444'
                                }}
                            />
                        </div>
                        <span className="text-2xl font-bold text-slate-100 mt-1">{revealed}<span className="text-base text-slate-400"> / 100</span></span>
                    </div>
                ) : (
                    <div className="mx-5 mb-5">
                        <button
                            onClick={canAfford ? onReveal : undefined}
                            disabled={!canAfford}
                            className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm transition-all duration-200
                                ${canAfford
                                    ? 'bg-amber-500 hover:bg-amber-400 text-slate-900 shadow-lg hover:shadow-amber-500/30 active:scale-95'
                                    : 'bg-slate-700 text-slate-500 cursor-not-allowed'
                                }`}
                        >
                            <Eye size={16} />
                            <span>{canAfford ? ui.revealStat : ui.notEnoughCoins}</span>
                            {canAfford && <span className="opacity-70 text-xs">({ui.revealCost})</span>}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

// ── StatIcon ───────────────────────────────────────────────────────────────────
export function StatIcon({ statKey, value, currentEffects, statsLoc, ui, metaCoins, onSpendCoin }) {
    const Icon = ICON_MAP[statKey];
    const willChange = currentEffects && currentEffects[statKey] !== undefined && currentEffects[statKey] !== 0;
    const isLargeChange = willChange && Math.abs(currentEffects[statKey]) > 15;
    const [showModal, setShowModal] = useState(false);
    const [revealed, setRevealed] = useState(null);

    const handleOpen = () => {
        setRevealed(null);
        setShowModal(true);
    };

    const handleClose = () => {
        setShowModal(false);
        setRevealed(null);
    };

    const handleReveal = () => {
        if (metaCoins >= 1 && onSpendCoin) {
            onSpendCoin();
            setRevealed(value);
        }
    };

    return (
        <>
            <button
                className="flex flex-col items-center justify-center flex-1 cursor-pointer focus:outline-none group"
                onClick={handleOpen}
                aria-label={`Stat: ${statKey}`}
            >
                <div className="h-4 w-full flex justify-center mb-1">
                    {willChange && (
                        <div className={`rounded-full bg-white transition-all duration-200 ${isLargeChange ? 'w-3 h-3' : 'w-2 h-2'}`} />
                    )}
                </div>
                <div className="relative w-12 h-12 flex items-center justify-center border-2 border-slate-700 rounded-full bg-slate-800 shadow-inner group-hover:border-amber-500/60 group-active:scale-95 transition-all duration-150">
                    <div
                        className="absolute bottom-0 left-0 w-full bg-slate-600 rounded-full transition-all duration-500 ease-out"
                        style={{ height: `${value}%`, opacity: 0.5 }}
                    />
                    <Icon size={24} className="text-slate-200 relative z-10" />
                </div>
            </button>

            {showModal && statsLoc && (
                <StatInfoModal
                    statKey={statKey}
                    statLoc={statsLoc[statKey]}
                    value={value}
                    metaCoins={metaCoins}
                    onReveal={handleReveal}
                    onClose={handleClose}
                    ui={ui}
                    revealed={revealed}
                />
            )}
        </>
    );
}
