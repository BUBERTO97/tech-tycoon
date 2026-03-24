import React from 'react';

/**
 * Bottom bar showing the active CEO title and sprint number during gameplay.
 */
export default function BottomBar({ gameState, currentEraObj, currentEraLoc, kingNumber, sprints, t }) {
    if (gameState !== 'PLAYING') return <div className="w-full max-w-md p-6 h-24 bg-slate-900" />;

    const EraIcon = currentEraObj.icon;
    return (
        <div className="w-full max-w-md p-6 flex flex-col items-center text-slate-400 bg-slate-900 z-10 h-24">
            <div className="text-xl font-bold font-serif text-amber-500 mb-1 flex items-center gap-2">
                <EraIcon size={20} /> {currentEraLoc.title} #{kingNumber}
            </div>
            <div className="text-sm tracking-widest uppercase flex flex-col items-center gap-1">
                <span>{currentEraLoc.name} - {t.ui.sprintPrefix} {sprints}</span>
            </div>
        </div>
    );
}
