import React from 'react';
import { Clock } from 'lucide-react';

/**
 * The swipeable game card with drag, overlays, and content.
 */
export default function GameCard({
    cardDomRef,
    onPointerDown,
    onPointerMove,
    onPointerUp,
    animState,
    isDragging,
    dragX,
    dragY,
    currentCardRef,
    currentCardLoc,
    swipeDir,
}) {
    return (
        <div className="relative w-full h-[400px] flex items-center justify-center perspective-[1000px]">
            {/* Stack shadow cards */}
            <div className="absolute w-64 h-80 bg-slate-800 border border-slate-700 rounded-2xl shadow-xl transform translate-y-2 scale-95 opacity-50" />
            <div className="absolute w-64 h-80 bg-slate-800 border border-slate-700 rounded-2xl shadow-xl transform translate-y-4 scale-90 opacity-25" />

            {/* Main draggable card */}
            <div
                ref={cardDomRef}
                onPointerDown={onPointerDown}
                onPointerMove={onPointerMove}
                onPointerUp={onPointerUp}
                onPointerLeave={onPointerUp}
                className={`absolute w-64 h-80 bg-slate-100 rounded-2xl shadow-2xl flex flex-col overflow-hidden border-4 border-slate-300 z-10 touch-none ${animState === 'idle' ? 'cursor-grab active:cursor-grabbing' : 'pointer-events-none'}`}
                style={{
                    transform: animState === 'entering'
                        ? 'translateY(8px) scale(0.95)'
                        : `translate(${dragX}px, ${dragY}px) rotate(${dragX * 0.05}deg) ${animState === 'exiting' ? 'scale(0.95)' : ''}`,
                    transition: isDragging || animState === 'entering'
                        ? 'none'
                        : animState === 'exiting'
                            ? 'transform 0.3s ease-out, opacity 0.3s ease-out'
                            : 'transform 0.4s cubic-bezier(0.2, 0.8, 0.2, 1)',
                    opacity: animState === 'exiting' ? 0 : 1,
                }}
            >
                {/* Card image / emoji area */}
                <div className="h-40 bg-slate-200 flex items-center justify-center text-6xl relative border-b border-slate-300 pointer-events-none">
                    {currentCardLoc.char.split(' ')[0]}

                    {currentCardRef.isEasterEgg && (
                        <div className="absolute top-3 bg-amber-100 p-1.5 rounded-full border-2 border-amber-400 shadow-sm animate-bounce text-amber-600">
                            <Clock size={20} strokeWidth={3} />
                        </div>
                    )}

                    {/* Left swipe overlay */}
                    <div
                        className="absolute inset-0 bg-red-500/80 flex items-center justify-center p-4 text-center text-white font-bold transition-opacity duration-200 z-10"
                        style={{ opacity: swipeDir === 'left' ? Math.min(Math.abs(dragX) / 100, 1) : 0 }}
                    >
                        <span className="transform -rotate-12 text-lg">{currentCardLoc.left}</span>
                    </div>

                    {/* Right swipe overlay */}
                    <div
                        className="absolute inset-0 bg-emerald-500/80 flex items-center justify-center p-4 text-center text-white font-bold transition-opacity duration-200 z-10"
                        style={{ opacity: swipeDir === 'right' ? Math.min(Math.abs(dragX) / 100, 1) : 0 }}
                    >
                        <span className="transform rotate-12 text-lg">{currentCardLoc.right}</span>
                    </div>

                    {/* Up swipe overlay (Easter eggs only) */}
                    {currentCardRef.isEasterEgg && (
                        <div
                            className="absolute inset-0 bg-amber-500/90 flex flex-col items-center justify-center p-4 text-center text-white font-bold transition-opacity duration-200 z-20"
                            style={{ opacity: swipeDir === 'up' ? Math.min(Math.abs(dragY) / 100, 1) : 0 }}
                        >
                            <span className="text-2xl mb-2">⬆️</span>
                            <span className="text-lg">{currentCardLoc.up}</span>
                        </div>
                    )}
                </div>

                {/* Card text body */}
                <div className="flex-1 p-4 flex flex-col items-center justify-start bg-white text-slate-800 text-center pointer-events-none overflow-y-auto">
                    <h3 className="text-sm font-bold text-slate-400 mb-2 uppercase tracking-wider">
                        {currentCardLoc.char.substring(currentCardLoc.char.indexOf(' ') + 1)}
                    </h3>
                    <p className="font-serif text-[15px] leading-tight">{currentCardLoc.text}</p>
                </div>
            </div>
        </div>
    );
}
