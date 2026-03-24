import React, { useState, useEffect, useRef } from 'react';
import { Shield, Users, Cpu, Coins, Sparkles, List, LogIn, LogOut } from 'lucide-react';
import { auth, loginWithGoogle, logout, saveHighScore, getLeaderboard, saveUserData, getUserData } from './firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { DECK_DATA, EASTER_EGGS, ERAS_DATA, LOCALES } from './constants/gameData';
import { generateGeminiCards } from './utils/ai';
import LanguageSelector from './components/LanguageSelector';
import { StatIcon } from './components/TopBar';
import StartScreen from './components/StartScreen';
import GameOverScreen from './components/GameOverScreen';
import LeaderboardModal from './components/LeaderboardModal';
import GameCard from './components/GameCard';
import BottomBar from './components/BottomBar';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const getEraObj = (currentSprints) =>
    ERAS_DATA.find(e => currentSprints < e.maxSprint) || ERAS_DATA[ERAS_DATA.length - 1];

// ---------------------------------------------------------------------------
// App
// ---------------------------------------------------------------------------
export default function App() {
    // ── Language ──────────────────────────────────────────────────────────────
    const [lang, setLang] = useState('en');
    const t = LOCALES[lang];

    // ── Core game state ───────────────────────────────────────────────────────
    const [gameState, setGameState] = useState('START');
    const [stats, setStats] = useState({ security: 50, morale: 50, tech: 50, budget: 50 });
    const [deck, setDeck] = useState([]);
    const [currentCardRef, setCurrentCardRef] = useState(null);
    const [sprints, setSprints] = useState(0);
    const [kingNumber, setKingNumber] = useState(1);
    const [gameOverReason, setGameOverReason] = useState('');
    const [isVictory, setIsVictory] = useState(false);

    // ── Meta / persistence ────────────────────────────────────────────────────
    const [metaCoins, setMetaCoins] = useState(0);
    const [lastRunYears, setLastRunYears] = useState(0);
    const [skipAmount, setSkipAmount] = useState(0);
    const [user, setUser] = useState(null);
    const [isLoaded, setIsLoaded] = useState(false);

    // ── UI state ──────────────────────────────────────────────────────────────
    const [comboMsg, setComboMsg] = useState(null);
    const [showLeaderboard, setShowLeaderboard] = useState(false);
    const [leaderboard, setLeaderboard] = useState([]);

    // ── Llama power-up ────────────────────────────────────────────────────────
    const [llamaSnapshot, setLlamaSnapshot] = useState(null);
    const [llamaTimer, setLlamaTimer] = useState(0);

    // ── AI deck ───────────────────────────────────────────────────────────────
    const [isGeneratingAI, setIsGeneratingAI] = useState(false);
    const [aiDeck, setAiDeck] = useState([]);

    // ── Card drag ─────────────────────────────────────────────────────────────
    const [dragX, setDragX] = useState(0);
    const [dragY, setDragY] = useState(0);
    const [isDragging, setIsDragging] = useState(false);
    const [animState, setAnimState] = useState('idle');
    const cardDomRef = useRef(null);

    // ── Derived values ────────────────────────────────────────────────────────
    const currentEraObj = getEraObj(sprints);
    const currentEraLoc = t.eras[currentEraObj.id];
    const currentCardLoc = currentCardRef?.isAI
        ? currentCardRef.loc
        : (currentCardRef ? t.cards[currentCardRef.id] : null);

    const swipeDir = (currentCardRef?.isEasterEgg && dragY < -50 && Math.abs(dragY) > Math.abs(dragX))
        ? 'up'
        : dragX > 30 ? 'right' : dragX < -30 ? 'left' : null;

    const currentEffects = swipeDir === 'left' ? currentCardRef?.left
        : swipeDir === 'right' ? currentCardRef?.right : null;

    const maxPossibleSkip = Math.min(lastRunYears, Math.floor(metaCoins / 5));

    // ── Auth / data load ──────────────────────────────────────────────────────
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            setUser(currentUser);
            if (currentUser) {
                const data = await getUserData(currentUser);
                if (data) {
                    if (data.metaCoins !== undefined) setMetaCoins(data.metaCoins);
                    if (data.stats !== undefined) setStats(data.stats);
                    if (data.sprints !== undefined) setSprints(data.sprints);
                    if (data.gameState !== undefined) setGameState(data.gameState);
                    if (data.kingNumber !== undefined) setKingNumber(data.kingNumber);
                    if (data.lastRunYears !== undefined) setLastRunYears(data.lastRunYears);
                    if (data.gameOverReason !== undefined) setGameOverReason(data.gameOverReason);
                    if (data.isVictory !== undefined) setIsVictory(data.isVictory);

                    if (data.gameState === 'PLAYING') {
                        const startSprints = data.sprints ?? 0;
                        const eraObj = getEraObj(startSprints);
                        const shuffled = [...DECK_DATA.filter(c => c.era === eraObj.id)].sort(() => 0.5 - Math.random());
                        setDeck(shuffled);
                        setCurrentCardRef(shuffled[0]);
                    }
                }
                setIsLoaded(true);
            } else {
                setIsLoaded(false);
            }
        });
        return () => unsubscribe();
    }, []);

    // ── Auto-save ─────────────────────────────────────────────────────────────
    useEffect(() => {
        if (!user || !isLoaded) return;
        const timeout = setTimeout(() => {
            saveUserData(user, { metaCoins, sprints, gameState, kingNumber, lastRunYears });
        }, 1000);
        return () => clearTimeout(timeout);
    }, [metaCoins, sprints, gameState, kingNumber, lastRunYears, user, isLoaded]);

    // ── Leaderboard fetch ─────────────────────────────────────────────────────
    useEffect(() => {
        if (showLeaderboard) getLeaderboard().then(setLeaderboard);
    }, [showLeaderboard]);

    // ── Llama countdown ───────────────────────────────────────────────────────
    useEffect(() => {
        let interval;
        if (llamaSnapshot) {
            setLlamaTimer(30);
            interval = setInterval(() => {
                setLlamaTimer(prev => {
                    if (prev <= 1) { clearInterval(interval); return 0; }
                    return prev - 1;
                });
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [llamaSnapshot]);

    // Restore stats when llama timer expires
    useEffect(() => {
        if (llamaTimer === 0 && llamaSnapshot) {
            setStats(llamaSnapshot);
            setLlamaSnapshot(null);
            setComboMsg(t.ui.llamaEnd);
            setTimeout(() => setComboMsg(null), 2000);
        }
    }, [llamaTimer, llamaSnapshot, t.ui.llamaEnd]);

    // ── Game actions ──────────────────────────────────────────────────────────
    const startGame = (startSprints = 0) => {
        setStats({ security: 50, morale: 50, tech: 50, budget: 50 });
        setSprints(startSprints);
        setGameOverReason('');
        setIsVictory(false);
        setLlamaSnapshot(null);
        setLlamaTimer(0);
        setDragX(0); setDragY(0);
        setIsDragging(false);
        setAnimState('idle');
        const eraObj = getEraObj(startSprints);
        const shuffled = [...DECK_DATA.filter(c => c.era === eraObj.id)].sort(() => 0.5 - Math.random());
        setDeck(shuffled);
        setCurrentCardRef(shuffled[0]);
        setGameState('PLAYING');
    };

    const applyEffects = (effects) => {
        let newStats = { ...stats };
        let dead = false;
        let reasonKey = '';

        for (const [key, value] of Object.entries(effects)) {
            newStats[key] += value;
            if (newStats[key] <= 0) { newStats[key] = 0; dead = true; reasonKey = `${key}_0`; }
            else if (newStats[key] >= 100) { newStats[key] = 100; dead = true; reasonKey = `${key}_100`; }
        }

        setStats(newStats);

        if (dead) {
            setLastRunYears(sprints);
            setSkipAmount(0);
            setGameOverReason(t.reasons[reasonKey]);
            setIsVictory(false);
            setLlamaSnapshot(null);
            setLlamaTimer(0);
            setGameState('GAMEOVER');
            setKingNumber(prev => prev + 1);
            if (user) {
                saveHighScore(user, sprints);
                saveUserData(user, { stats: newStats, gameOverReason: t.reasons[reasonKey], isVictory: false });
            }
            return;
        }

        const nextSprints = sprints + 1;
        if (nextSprints >= 100) {
            setStats(newStats);
            setLastRunYears(nextSprints);
            setSkipAmount(0);
            setGameOverReason(t.reasons.victory);
            setIsVictory(true);
            setGameState('GAMEOVER');
            setKingNumber(prev => prev + 1);
            if (user) {
                saveHighScore(user, nextSprints);
                saveUserData(user, { stats: newStats, gameOverReason: t.reasons.victory, isVictory: true });
            }
            return;
        }

        setSprints(nextSprints);
        setMetaCoins(prev => prev + 1);

        const isBalanced = Object.values(newStats).every(val => val >= 35 && val <= 65);
        if (isBalanced) {
            setMetaCoins(prev => prev + 3);
            setComboMsg(t.ui.perfect);
            setTimeout(() => setComboMsg(null), 2000);
        }
        nextCard(nextSprints);
    };

    const fetchAICardsIfNeeded = async (currentSprints) => {
        if (!user || !import.meta.env.VITE_GEMINI_API_KEY) return;
        if (isGeneratingAI || aiDeck.length > 1) return;
        setIsGeneratingAI(true);
        try {
            const eraObj = getEraObj(currentSprints);
            const aiCardsData = await generateGeminiCards(stats, currentSprints, t.eras[eraObj.id].name, lang, 5);
            const formattedCards = aiCardsData.map(aiData => ({
                id: 'ai_card_' + Math.floor(Math.random() * 1000000),
                isAI: true,
                isEasterEgg: !!aiData.isEasterEgg,
                era: eraObj.id,
                left: aiData.left || {},
                right: aiData.right || {},
                up: aiData.up || {},
                loc: aiData.loc,
            }));
            setAiDeck(prev => [...prev, ...formattedCards]);
        } catch (err) {
            console.error('AI card batch generation failed:', err);
        } finally {
            setIsGeneratingAI(false);
        }
    };

    const nextCard = (currentSprints = sprints) => {
        fetchAICardsIfNeeded(currentSprints);

        if (user && import.meta.env.VITE_GEMINI_API_KEY && aiDeck.length > 0 && Math.random() < 0.20) {
            setCurrentCardRef(aiDeck[0]);
            setAiDeck(prev => prev.slice(1));
            setDragX(0); setDragY(0);
            return;
        }

        if (!currentCardRef?.isEasterEgg && !currentCardRef?.isAI && Math.random() < 0.08) {
            setCurrentCardRef(EASTER_EGGS[Math.floor(Math.random() * EASTER_EGGS.length)]);
            setDragX(0); setDragY(0);
            return;
        }

        let newDeck = [...deck];
        newDeck.shift();
        const eraObj = getEraObj(currentSprints);
        if (newDeck.length === 0 || (currentCardRef && currentCardRef.era !== eraObj.id)) {
            newDeck = [...DECK_DATA.filter(c => c.era === eraObj.id)].sort(() => 0.5 - Math.random());
        }
        setDeck(newDeck);
        setCurrentCardRef(newDeck[0]);
        setDragX(0); setDragY(0);
    };

    // ── Drag handlers ─────────────────────────────────────────────────────────
    const handlePointerDown = (e) => {
        if (gameState !== 'PLAYING' || animState !== 'idle') return;
        setIsDragging(true);
        e.currentTarget.setPointerCapture(e.pointerId);
    };

    const handlePointerMove = (e) => {
        if (!isDragging) return;
        setDragX(prev => prev + e.movementX);
        setDragY(prev => prev + e.movementY);
    };

    const handlePointerUp = () => {
        if (!isDragging) return;
        setIsDragging(false);
        const THRESHOLD = 100;
        const isUpSwipe = currentCardRef?.isEasterEgg && dragY < -THRESHOLD && Math.abs(dragY) > Math.abs(dragX);

        if (isUpSwipe) {
            setAnimState('exiting');
            setDragY(-500);
            setTimeout(() => {
                setAnimState('entering');
                setDragX(0); setDragY(0);
                if (currentCardRef.isAI) {
                    if (Object.keys(currentCardRef.up || {}).length > 0) {
                        applyEffects(currentCardRef.up);
                    } else {
                        setComboMsg('✨ AI Secret Discovered!');
                        setTimeout(() => setComboMsg(null), 2000);
                        nextCard(sprints);
                    }
                } else if (currentCardRef.id === 'easter_egg_llama') {
                    setLlamaSnapshot({ ...stats });
                    setStats({ security: 50, morale: 50, tech: 50, budget: 50 });
                    setComboMsg(t.ui.llamaBonus);
                    setTimeout(() => setComboMsg(null), 2000);
                    nextCard(sprints);
                } else {
                    setMetaCoins(prev => prev + 5);
                    setComboMsg(t.ui.easterEggBonus);
                    setTimeout(() => setComboMsg(null), 2000);
                    nextCard(sprints);
                }
                requestAnimationFrame(() => requestAnimationFrame(() => setAnimState('idle')));
            }, 300);
        } else if (dragX > THRESHOLD) {
            setAnimState('exiting');
            setDragX(500);
            setTimeout(() => {
                setAnimState('entering');
                setDragX(0); setDragY(0);
                applyEffects(currentCardRef.right);
                requestAnimationFrame(() => requestAnimationFrame(() => setAnimState('idle')));
            }, 300);
        } else if (dragX < -THRESHOLD) {
            setAnimState('exiting');
            setDragX(-500);
            setTimeout(() => {
                setAnimState('entering');
                setDragX(0); setDragY(0);
                applyEffects(currentCardRef.left);
                requestAnimationFrame(() => requestAnimationFrame(() => setAnimState('idle')));
            }, 300);
        } else {
            setDragX(0); setDragY(0);
        }
    };

    // ── Render ────────────────────────────────────────────────────────────────
    return (
        <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col items-center overflow-hidden font-sans select-none">

            {/* ── Top Bar ── */}
            <div className="w-full max-w-md p-4 flex flex-col gap-4 bg-slate-900 z-50 relative">
                <div className="flex justify-between items-center w-full">
                    {/* Left: coins + leaderboard */}
                    <div className="flex gap-2 items-center">
                        <div className="flex items-center gap-1 font-bold text-amber-400 bg-slate-800 px-3 py-1.5 rounded-full border border-slate-700 shadow-sm">
                            <Sparkles size={16} /> {metaCoins}
                        </div>
                        <button
                            onClick={() => setShowLeaderboard(true)}
                            className="p-1.5 bg-slate-800 rounded-full border border-slate-700 text-slate-300 hover:text-amber-400 flex-shrink-0"
                        >
                            <List size={16} />
                        </button>
                    </div>

                    {/* Llama countdown badge */}
                    {llamaTimer > 0 && (
                        <div className="absolute top-14 right-4 z-50 bg-indigo-600 text-white px-3 py-1 rounded-full animate-pulse shadow-lg font-bold text-sm flex items-center gap-1 border-2 border-indigo-400">
                            🦙 {llamaTimer}s
                        </div>
                    )}

                    {/* Right: auth + language */}
                    <div className="flex gap-2 items-center">
                        {user ? (
                            <button
                                onClick={logout}
                                className="flex items-center gap-1 p-1 bg-slate-800 rounded-full border border-slate-700 text-slate-300 hover:text-red-400 flex-shrink-0"
                                title="Sign Out"
                            >
                                {user.photoURL
                                    ? <img src={user.photoURL} alt="Profile" className="w-5 h-5 rounded-full" />
                                    : <Users size={16} className="m-1" />
                                }
                                <LogOut size={14} className="mr-1" />
                            </button>
                        ) : (
                            <button
                                onClick={loginWithGoogle}
                                className="flex items-center gap-1 px-2 py-1 bg-slate-800 rounded-full border border-slate-700 text-slate-300 hover:text-blue-400 text-xs font-bold whitespace-nowrap"
                                title="Sign in with Google"
                            >
                                <LogIn size={14} /> Login
                            </button>
                        )}
                        <LanguageSelector lang={lang} setLang={setLang} />
                    </div>
                </div>

                {/* Stat icons row */}
                <div className="flex gap-2 w-full justify-between px-2">
                    {['security', 'morale', 'tech', 'budget'].map(key => (
                        <StatIcon
                            key={key}
                            statKey={key}
                            value={stats[key]}
                            currentEffects={currentEffects}
                            statsLoc={t.stats}
                            ui={t.ui}
                            metaCoins={metaCoins}
                            onSpendCoin={() => setMetaCoins(prev => prev - 1)}
                        />
                    ))}
                </div>
            </div>

            {/* ── Main Area ── */}
            <div className="flex-1 w-full max-w-md relative flex flex-col items-center justify-center p-4">

                {/* AI thinking indicator */}
                {isGeneratingAI && (
                    <div className="absolute top-4 right-4 z-[100] flex items-center gap-2 bg-slate-800/80 backdrop-blur-md rounded-full px-3 py-1.5 border border-amber-500/50 shadow-sm animate-in fade-in duration-300">
                        <div className="w-4 h-4 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
                        <p className="text-amber-400 font-bold text-xs animate-pulse tracking-wide">AI Thinking...</p>
                    </div>
                )}

                {/* Combo / bonus toast */}
                {comboMsg && (
                    <div className="absolute top-4 z-50 animate-bounce bg-amber-500 text-white font-bold px-4 py-2 rounded-full shadow-lg">
                        {comboMsg}
                    </div>
                )}

                {/* Leaderboard modal */}
                {showLeaderboard && (
                    <LeaderboardModal leaderboard={leaderboard} onClose={() => setShowLeaderboard(false)} />
                )}

                {/* Start screen */}
                {gameState === 'START' && (
                    <StartScreen t={t} onStart={startGame} />
                )}

                {/* Game-over screen */}
                {gameState === 'GAMEOVER' && (
                    <GameOverScreen
                        t={t}
                        isVictory={isVictory}
                        currentEraLoc={currentEraLoc}
                        kingNumber={kingNumber}
                        lastRunYears={lastRunYears}
                        gameOverReason={gameOverReason}
                        maxPossibleSkip={maxPossibleSkip}
                        skipAmount={skipAmount}
                        setSkipAmount={setSkipAmount}
                        metaCoins={metaCoins}
                        onRestart={startGame}
                        onSkipStart={(amount) => {
                            setMetaCoins(prev => prev - amount * 5);
                            startGame(amount);
                        }}
                    />
                )}

                {/* Playing card */}
                {gameState === 'PLAYING' && currentCardRef && currentCardLoc && (
                    <GameCard
                        cardDomRef={cardDomRef}
                        onPointerDown={handlePointerDown}
                        onPointerMove={handlePointerMove}
                        onPointerUp={handlePointerUp}
                        animState={animState}
                        isDragging={isDragging}
                        dragX={dragX}
                        dragY={dragY}
                        currentCardRef={currentCardRef}
                        currentCardLoc={currentCardLoc}
                        swipeDir={swipeDir}
                    />
                )}
            </div>

            {/* ── Bottom Bar ── */}
            <BottomBar
                gameState={gameState}
                currentEraObj={currentEraObj}
                currentEraLoc={currentEraLoc}
                kingNumber={kingNumber}
                sprints={sprints}
                t={t}
            />
        </div>
    );
}
