import React from 'react';
import { Trophy, Users, X } from 'lucide-react';

/**
 * Modal overlay listing the top players by high score.
 */
export default function LeaderboardModal({ leaderboard, onClose }) {
    return (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-slate-900/90 backdrop-blur p-6 text-center animate-in fade-in duration-300">
            <div className="bg-slate-800 w-full max-w-sm rounded-2xl shadow-2xl p-6 border border-slate-700 relative flex flex-col max-h-[80vh]">
                <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-white">
                    <X size={24} />
                </button>
                <h2 className="text-2xl font-bold mb-6 text-amber-400 flex items-center justify-center gap-2 flex-shrink-0">
                    <Trophy size={24} /> Leaderboard
                </h2>

                <div className="flex flex-col gap-3 overflow-y-auto pr-2 flex-1 scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-transparent">
                    {leaderboard.length === 0 ? (
                        <p className="text-slate-400 py-4">Loading or no entries yet...</p>
                    ) : (
                        leaderboard.map((entry, index) => (
                            <div key={entry.uid} className="flex items-center justify-between p-3 bg-slate-700/50 rounded-xl border border-slate-600/50">
                                <div className="flex items-center gap-3">
                                    <span className="font-bold text-amber-400/80 w-4 text-left">{index + 1}.</span>
                                    {entry.photoURL ? (
                                        <img src={entry.photoURL} alt={entry.displayName} className="w-8 h-8 rounded-full border border-slate-500 flex-shrink-0" />
                                    ) : (
                                        <div className="w-8 h-8 rounded-full bg-slate-600 flex items-center justify-center flex-shrink-0">
                                            <Users size={14} />
                                        </div>
                                    )}
                                    <span className="font-semibold text-slate-200 text-sm truncate max-w-[120px]">{entry.displayName}</span>
                                </div>
                                <div className="font-bold text-amber-400 flex items-center gap-1 text-xs bg-slate-800 px-2 py-1 rounded-full whitespace-nowrap">
                                    {entry.highScore} Sprints
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
