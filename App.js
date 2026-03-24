import './global.css';
import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, PanResponder, SafeAreaView, Animated, Dimensions, ActivityIndicator, Modal, ScrollView, Image } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import Slider from '@react-native-community/slider';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, getUserData, saveUserData, saveHighScore, getLeaderboard, logout, loginWithGoogle } from './src/native/firebase';
import { DECK_DATA, EASTER_EGGS, ERAS_DATA, LOCALES, LANGUAGE_OPTIONS } from './src/native/constants';
import { Shield, Users, Cpu, Coins, Sparkles, List, LogOut, LogIn, ChevronDown, Trophy, X, Skull, RotateCcw, Briefcase } from 'lucide-react-native';

const SCREEN_WIDTH = Dimensions.get('window').width;
const SWIPE_THRESHOLD = 120;

const StatIcon = ({ icon: Icon, value, color }) => (
    <View className="items-center relative">
        <Icon size={24} color={color} />
        <View className="absolute bottom-[-10] w-full items-center">
            <Text className="text-white text-[10px] font-bold bg-slate-800 rounded px-1 overflow-hidden" style={{ color }}>{value}</Text>
        </View>
    </View>
);

const LanguageSelector = ({ lang, setLang }) => {
    const [isOpen, setIsOpen] = useState(false);
    const selected = LANGUAGE_OPTIONS.find(o => o.code === lang);

    return (
        <View>
            <TouchableOpacity 
                onPress={() => setIsOpen(true)}
                className="flex-row items-center gap-1.5 bg-slate-800 px-3 py-1.5 rounded-full border border-slate-700"
            >
                <Text className="text-base">{selected?.flag}</Text>
                <Text className="text-xs font-bold text-slate-200 uppercase">{selected?.code}</Text>
                <ChevronDown size={14} color="#94a3b8" />
            </TouchableOpacity>

            <Modal visible={isOpen} transparent animationType="fade">
                <TouchableOpacity 
                    className="flex-1 bg-slate-900/80 justify-center items-center p-6" 
                    activeOpacity={1} 
                    onPress={() => setIsOpen(false)}
                >
                    <View className="bg-slate-800 w-full max-w-sm rounded-2xl p-4 border border-slate-700">
                        {LANGUAGE_OPTIONS.map((opt) => (
                            <TouchableOpacity
                                key={opt.code}
                                onPress={() => { setLang(opt.code); setIsOpen(false); }}
                                className={`flex-row items-center gap-4 p-4 rounded-xl mb-2 ${opt.code === lang ? 'bg-amber-500/20' : 'bg-slate-700/50'}`}
                            >
                                <Text className="text-2xl">{opt.flag}</Text>
                                <Text className={`text-base font-bold ${opt.code === lang ? 'text-amber-400' : 'text-slate-200'}`}>
                                    {opt.label}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </TouchableOpacity>
            </Modal>
        </View>
    );
};

export default function App() {
    const [lang, setLang] = useState('en');
    const t = LOCALES[lang];

    const [gameState, setGameState] = useState('START');
    const [stats, setStats] = useState({ security: 50, morale: 50, tech: 50, budget: 50 });
    const [sprints, setSprints] = useState(0);
    const [kingNumber, setKingNumber] = useState(1);
    const [lastRunYears, setLastRunYears] = useState(0);
    const [metaCoins, setMetaCoins] = useState(0);
    const [skipAmount, setSkipAmount] = useState(0);
    
    const [deck, setDeck] = useState([]);
    const [currentCard, setCurrentCard] = useState(null);
    const [gameOverReason, setGameOverReason] = useState("");
    const [isVictory, setIsVictory] = useState(false);
    
    const [user, setUser] = useState(null);
    const [isLoaded, setIsLoaded] = useState(false);
    const [comboMsg, setComboMsg] = useState(null);

    const [showLeaderboard, setShowLeaderboard] = useState(false);
    const [leaderboard, setLeaderboard] = useState([]);

    const pan = useRef(new Animated.ValueXY()).current;
    
    // Easter Egg Data
    const [llamaSnapshot, setLlamaSnapshot] = useState(null);
    const [llamaTimer, setLlamaTimer] = useState(0);

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
                        const startSprints = data.sprints || 0;
                        let eraObj = getEraObj(startSprints);
                        const eraDeck = DECK_DATA.filter(c => c.era === eraObj.id);
                        const shuffled = [...eraDeck].sort(() => 0.5 - Math.random());
                        setDeck(shuffled);
                        setCurrentCard(shuffled[0]);
                    }
                }
            }
            setIsLoaded(true);
        });
        return unsubscribe;
    }, []);

    useEffect(() => {
        if (!user || !isLoaded) return;
        const timeout = setTimeout(() => {
            saveUserData(user, { metaCoins, sprints, gameState, kingNumber, lastRunYears });
        }, 1000);
        return () => clearTimeout(timeout);
    }, [metaCoins, sprints, gameState, kingNumber, lastRunYears, user, isLoaded]);

    useEffect(() => {
        if (showLeaderboard) {
            getLeaderboard().then(setLeaderboard);
        }
    }, [showLeaderboard]);
    
    // Llama Timer Countdown
    useEffect(() => {
        let interval;
        if (llamaSnapshot) {
            setLlamaTimer(30);
            interval = setInterval(() => {
                setLlamaTimer(prev => {
                    if (prev <= 1) {
                        clearInterval(interval);
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [llamaSnapshot]);

    useEffect(() => {
        if (llamaTimer === 0 && llamaSnapshot) {
            setStats(llamaSnapshot);
            setLlamaSnapshot(null);
            setComboMsg(t.ui.llamaEnd);
            setTimeout(() => setComboMsg(null), 2000);
        }
    }, [llamaTimer, llamaSnapshot, t.ui.llamaEnd]);

    const getEraObj = (currentSprints) => ERAS_DATA.find(e => currentSprints < e.maxSprint) || ERAS_DATA[ERAS_DATA.length - 1];
    const currentEraObj = getEraObj(sprints);
    const currentEraLoc = t.eras[currentEraObj.id];
    const currentCardLoc = currentCard ? t.cards[currentCard.id] : null;

    const startGame = (startSprints = 0) => {
        setStats({ security: 50, morale: 50, tech: 50, budget: 50 });
        setSprints(startSprints);
        setGameOverReason("");
        setIsVictory(false);
        setLlamaSnapshot(null);
        setLlamaTimer(0);
        
        let eraObj = getEraObj(startSprints);
        const eraDeck = DECK_DATA.filter(c => c.era === eraObj.id);
        const shuffled = [...eraDeck].sort(() => 0.5 - Math.random());
        setDeck(shuffled);
        setCurrentCard(shuffled[0]);
        setGameState('PLAYING');
    };

    const nextCard = (currentSprints = sprints) => {
        if (!currentCard?.isEasterEgg && Math.random() < 0.08) {
            const randomEgg = EASTER_EGGS[Math.floor(Math.random() * EASTER_EGGS.length)];
            setCurrentCard(randomEgg);
            pan.setValue({ x: 0, y: 0 });
            return;
        }

        let newDeck = [...deck];
        newDeck.shift();

        const eraObj = getEraObj(currentSprints);
        if (newDeck.length === 0 || (currentCard && currentCard.era !== eraObj.id)) {
            const eraPool = DECK_DATA.filter(c => c.era === eraObj.id);
            newDeck = [...eraPool].sort(() => 0.5 - Math.random());
        }

        setDeck(newDeck);
        setCurrentCard(newDeck[0]);
        pan.setValue({ x: 0, y: 0 });
    };

    const applyEffects = (effects) => {
        let newStats = { ...stats };
        let dead = false;
        let reasonKey = "";

        for (const [key, value] of Object.entries(effects)) {
            newStats[key] += value;
            if (newStats[key] <= 0) {
                newStats[key] = 0; dead = true; reasonKey = `${key}_0`;
            } else if (newStats[key] >= 100) {
                newStats[key] = 100; dead = true; reasonKey = `${key}_100`;
            }
        }

        setStats(newStats);

        if (dead) {
            setLastRunYears(sprints);
            setSkipAmount(0);
            setGameOverReason(t.reasons[reasonKey]);
            setIsVictory(false);
            setGameState('GAMEOVER');
            setKingNumber(prev => prev + 1);
            if (user) {
                saveHighScore(user, sprints);
                saveUserData(user, { stats: newStats, gameOverReason: t.reasons[reasonKey], isVictory: false });
            }
        } else {
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
        }
    };

    const handleSwipe = (direction) => {
        if (!currentCard) return;
        
        let effects = {};
        if (direction === 'left' && currentCard.left) effects = currentCard.left;
        else if (direction === 'right' && currentCard.right) effects = currentCard.right;
        else if (direction === 'up' && currentCard.up) {
            effects = currentCard.up;
            if (currentCard.id === 'easter_egg_llama') {
                setLlamaSnapshot({...stats});
                setStats({ security: 50, morale: 50, tech: 50, budget: 50 });
                setComboMsg(t.ui.llamaBonus);
                setTimeout(() => setComboMsg(null), 2000);
                pan.setValue({ x: 0, y: 0 });
                nextCard();
                return;
            } else if (currentCard.isEasterEgg) {
                setMetaCoins(prev => prev + 5);
                setComboMsg(t.ui.easterEggBonus);
                setTimeout(() => setComboMsg(null), 2000);
            }
        }
        else return;

        applyEffects(effects);
    };

    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onMoveShouldSetPanResponder: () => true,
            onPanResponderMove: Animated.event(
                [null, { dx: pan.x, dy: pan.y }],
                { useNativeDriver: false }
            ),
            onPanResponderRelease: (e, gestureState) => {
                const isEasterEggUp = currentCard?.isEasterEgg && gestureState.dy < -SWIPE_THRESHOLD && Math.abs(gestureState.dy) > Math.abs(gestureState.dx);

                if (isEasterEggUp) {
                    Animated.timing(pan, { toValue: { x: 0, y: -SCREEN_WIDTH }, duration: 250, useNativeDriver: false }).start(() => handleSwipe('up'));
                } else if (gestureState.dx > SWIPE_THRESHOLD) {
                    // Swiped Right
                    Animated.timing(pan, { toValue: { x: SCREEN_WIDTH, y: 0 }, duration: 250, useNativeDriver: false }).start(() => handleSwipe('right'));
                } else if (gestureState.dx < -SWIPE_THRESHOLD) {
                    // Swiped Left
                    Animated.timing(pan, { toValue: { x: -SCREEN_WIDTH, y: 0 }, duration: 250, useNativeDriver: false }).start(() => handleSwipe('left'));
                } else {
                    // Snap back
                    Animated.spring(pan, { toValue: { x: 0, y: 0 }, friction: 4, useNativeDriver: false }).start();
                }
            }
        })
    ).current;

    const maxPossibleSkip = Math.min(lastRunYears, Math.floor(metaCoins / 5));

    if (!isLoaded) {
        return (
            <View className="flex-1 bg-slate-900 justify-center items-center">
                <StatusBar hidden={true} />
                <ActivityIndicator size="large" color="#0ea5e9" />
            </View>
        );
    }

    return (
        <View className="flex-1 w-full" style={{ backgroundColor: '#0f172a', flex: 1, alignItems: 'center' }}>
            <StatusBar hidden={true} />
            <SafeAreaView style={{ flex: 1, width: '100%', maxWidth: 448, alignSelf: 'center' }}>
                <View className="flex-1 w-full bg-slate-900 relative">
                {/* Top Bar: Stats, Coins & Language */}
            <View className="px-4 py-4 bg-slate-900 relative z-10">
                <View className="flex-row justify-between items-center w-full mb-4">
                    <View className="flex-row items-center gap-2">
                        <View className="flex-row items-center gap-1 bg-slate-800 px-3 py-1.5 rounded-full border border-slate-700">
                            <Sparkles size={16} color="#fbbf24" />
                            <Text className="text-amber-400 font-bold ml-1">{metaCoins}</Text>
                        </View>
                        <TouchableOpacity onPress={() => setShowLeaderboard(true)} className="p-2 bg-slate-800 rounded-full border border-slate-700">
                            <List size={16} color="#cbd5e1" />
                        </TouchableOpacity>
                    </View>

                    {llamaTimer > 0 && (
                        <View className="absolute top-12 right-0 bg-indigo-600 px-3 py-1 rounded-full items-center justify-center border-2 border-indigo-400">
                            <Text className="text-white font-bold text-sm">🦙 {llamaTimer}s</Text>
                        </View>
                    )}

                    <View className="flex-row items-center gap-2">
                        {user ? (
                            <TouchableOpacity onPress={logout} className="flex-row items-center gap-1 bg-slate-800 px-2 py-1.5 rounded-full border border-slate-700">
                                {user.photoURL ? (
                                    <Image source={{ uri: user.photoURL }} className="w-5 h-5 rounded-full" />
                                ) : (
                                    <Users size={16} color="#cbd5e1" />
                                )}
                                <LogOut size={14} color="#f87171" className="ml-1" />
                            </TouchableOpacity>
                        ) : (
                            <TouchableOpacity onPress={loginWithGoogle} className="flex-row items-center gap-1 bg-slate-800 px-3 py-1.5 rounded-full border border-slate-700">
                                <LogIn size={14} color="#60a5fa" />
                                <Text className="text-slate-300 text-xs font-bold ml-1">Login</Text>
                            </TouchableOpacity>
                        )}
                        <LanguageSelector lang={lang} setLang={setLang} />
                    </View>
                </View>

                {/* Stat Icons */}
                <View className="flex-row justify-between px-2 mt-2">
                    <StatIcon icon={Shield} color="#ef4444" value={stats.security} />
                    <StatIcon icon={Users} color="#3b82f6" value={stats.morale} />
                    <StatIcon icon={Cpu} color="#a855f7" value={stats.tech} />
                    <StatIcon icon={Coins} color="#eab308" value={stats.budget} />
                </View>
            </View>

            {/* Main Game Area */}
            <View className="flex-1 justify-center items-center px-4 overflow-hidden relative">
                
                {comboMsg && (
                    <View className="absolute top-4 z-50 bg-amber-500 px-4 py-2 rounded-full shadow-lg">
                        <Text className="text-white font-bold">{comboMsg}</Text>
                    </View>
                )}

                {gameState === 'START' && (
                    <View className="items-center z-20">
                        <Briefcase size={80} color="#fbbf24" style={{ marginBottom: 24 }} />
                        <Text className="text-4xl text-amber-400 font-extrabold mb-4">{t.ui.title}</Text>
                        <Text className="text-slate-400 text-center mb-8 px-8 text-base leading-6">{t.ui.subtitle}</Text>
                        <TouchableOpacity onPress={() => startGame(0)} className="bg-amber-600 py-3.5 px-10 rounded-full border-b-4 border-amber-800 active:border-amber-600 active:translate-y-1">
                            <Text className="text-white text-xl font-bold uppercase">{t.ui.start}</Text>
                        </TouchableOpacity>
                    </View>
                )}

                {gameState === 'GAMEOVER' && (
                    <View className="items-center w-full z-20">
                        {isVictory ? (
                            <Trophy size={80} color="#facc15" style={{ marginBottom: 16 }} />
                        ) : (
                            <Skull size={64} color="#ef4444" style={{ marginBottom: 16 }} />
                        )}

                        <Text className={`text-2xl font-bold mb-2 text-center px-2 ${isVictory ? 'text-yellow-400' : 'text-slate-200'}`}>
                            {isVictory ? "SINGULARITY ACHIEVED" : `${currentEraLoc.title} #${kingNumber} ${t.ui.dead}`}
                        </Text>
                        
                        <Text className="text-amber-500 text-lg mb-6 shadow">
                            {t.ui.ruledFor} {lastRunYears} {t.ui.sprints}
                        </Text>

                        <View className="bg-slate-800 p-5 rounded-2xl border border-slate-700 shadow-xl mb-6 w-full items-center">
                            <Text className={`text-center font-serif leading-5 ${isVictory ? 'text-yellow-100' : 'text-slate-300'}`}>
                                "{gameOverReason}"
                            </Text>
                        </View>

                        <TouchableOpacity onPress={() => startGame(0)} className="flex-row items-center bg-slate-700 py-3.5 px-10 rounded-full border-b-4 border-slate-800 mb-6 active:border-slate-700 active:translate-y-1">
                            <RotateCcw size={20} color="#fff" style={{ marginRight: 8 }} />
                            <Text className="text-white text-lg font-bold uppercase">{t.ui.restart}</Text>
                        </TouchableOpacity>

                        {maxPossibleSkip > 0 && (
                            <View className="w-full bg-slate-800 p-5 rounded-2xl border border-slate-700">
                                <Text className="text-slate-400 font-bold mb-2">{t.ui.skipTime}</Text>
                                <View className="flex-row justify-between mb-2">
                                    <Text className="text-amber-400 text-xs">0 {t.ui.sprints}</Text>
                                    <Text className="text-amber-400 text-xs">{maxPossibleSkip} {t.ui.sprints}</Text>
                                </View>
                                <Slider
                                    style={{ width: '100%', height: 40 }}
                                    minimumValue={0}
                                    maximumValue={maxPossibleSkip}
                                    step={1}
                                    value={skipAmount}
                                    onValueChange={setSkipAmount}
                                    minimumTrackTintColor="#f59e0b"
                                    maximumTrackTintColor="#334155"
                                    thumbTintColor="#fbbf24"
                                />
                                <TouchableOpacity 
                                    disabled={skipAmount === 0}
                                    onPress={() => { setMetaCoins(prev => prev - (skipAmount * 5)); startGame(skipAmount); }}
                                    className={`py-3 mt-4 rounded-full items-center ${skipAmount > 0 ? 'bg-amber-600 border-b-4 border-amber-800' : 'bg-slate-700'}`}
                                >
                                    <Text className={`font-bold ${skipAmount > 0 ? 'text-white' : 'text-slate-500'}`}>
                                        {t.ui.skipBtn} {skipAmount} {t.ui.sprints} ({t.ui.skipCost}: {skipAmount * 5} 🪙)
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        )}
                    </View>
                )}

                {gameState === 'PLAYING' && currentCard && currentCardLoc && (
                    <Animated.View 
                        {...panResponder.panHandlers}
                        style={{
                            transform: [
                                { translateX: pan.x }, 
                                { translateY: pan.y },
                                {
                                    rotate: pan.x.interpolate({
                                        inputRange: [-SCREEN_WIDTH / 2, 0, SCREEN_WIDTH / 2],
                                        outputRange: ['-10deg', '0deg', '10deg'],
                                        extrapolate: 'clamp'
                                    })
                                }
                            ],
                            aspectRatio: 0.72,
                            width: '85%',
                            maxWidth: 320,
                            shadowColor: '#000',
                            shadowOffset: { width: 0, height: 10 },
                            shadowOpacity: 0.3,
                            shadowRadius: 20,
                            elevation: 15,
                            touchAction: 'none',
                            cursor: 'grab'
                        }}
                        className="bg-white rounded-3xl border-4 border-slate-300 relative overflow-hidden"
                    >
                        <View className="flex-1 bg-[#e2e8f0] justify-center items-center border-b-[3px] border-slate-300 relative" pointerEvents="none">
                            <Text style={{ fontSize: 90 }}>{currentCardLoc.char.split(' ')[0]}</Text>
                            
                            <Animated.View style={{ 
                                opacity: pan.x.interpolate({ inputRange: [-SWIPE_THRESHOLD, 0], outputRange: [1, 0], extrapolate: 'clamp' })
                             }} className="absolute inset-0 bg-red-500/90 justify-center items-center p-6 z-10">
                                <Text className="text-white font-extrabold text-3xl -rotate-12 text-center drop-shadow-md tracking-wider">
                                    {currentCardLoc.left}
                                </Text>
                            </Animated.View>

                            <Animated.View style={{ 
                                opacity: pan.x.interpolate({ inputRange: [0, SWIPE_THRESHOLD], outputRange: [0, 1], extrapolate: 'clamp' })
                             }} className="absolute inset-0 bg-emerald-500/90 justify-center items-center p-6 z-10">
                                <Text className="text-white font-extrabold text-3xl rotate-12 text-center drop-shadow-md tracking-wider">
                                    {currentCardLoc.right}
                                </Text>
                            </Animated.View>

                            {currentCard.isEasterEgg && (
                                <Animated.View style={{ 
                                    opacity: pan.y.interpolate({ inputRange: [-SWIPE_THRESHOLD, 0], outputRange: [1, 0], extrapolate: 'clamp' })
                                 }} className="absolute inset-0 bg-amber-500/95 justify-center items-center p-8 z-20">
                                    <Text className="text-white font-extrabold text-6xl mb-4 shadow-sm text-center">⬆️</Text>
                                    <Text className="text-white font-bold text-2xl text-center tracking-wide">{currentCardLoc.up}</Text>
                                </Animated.View>
                            )}
                        </View>
                        
                        <View className="h-[50%] p-6 flex-col items-center justify-center bg-white" pointerEvents="none">
                            <Text className="text-slate-400 font-extrabold mb-4 text-xs tracking-widest uppercase text-center w-full">
                                {currentCardLoc.char.substring(currentCardLoc.char.indexOf(' ') + 1)}
                            </Text>
                            <Text className="text-slate-800 text-xl text-center font-serif leading-8 align-middle">
                                {currentCardLoc.text}
                            </Text>
                        </View>
                    </Animated.View>
                )}
            </View>

            {/* Bottom Bar: CEO Info */}
            <View className="w-full flex-col items-center justify-center bg-slate-900 pb-8 pt-4 border-t border-slate-800">
                {gameState === 'PLAYING' && currentEraLoc && (
                    <>
                        <View className="flex-row items-center gap-2 mb-2">
                            {React.createElement(currentEraObj.icon || Briefcase, { size: 20, color: '#f59e0b' })}
                            <Text className="text-xl font-bold font-serif text-amber-500">
                                {currentEraLoc.title} #{kingNumber}
                            </Text>
                        </View>
                        <Text className="text-slate-400 text-sm tracking-widest uppercase">
                            {currentEraLoc.name} - {t.ui.sprintPrefix} {sprints}
                        </Text>
                    </>
                )}
            </View>

            {/* Leaderboard Modal */}
            <Modal visible={showLeaderboard} transparent animationType="slide">
                <View className="flex-1 bg-slate-900/90 pt-16 px-4 pb-8 align-center justify-center">
                    <View className="flex-1 bg-slate-800 rounded-3xl border border-slate-700 shadow-2xl relative overflow-hidden flex-col w-full max-w-sm self-center">
                        <TouchableOpacity 
                            onPress={() => setShowLeaderboard(false)} 
                            className="absolute top-4 right-4 z-10 p-2 bg-slate-700 rounded-full"
                        >
                            <X size={20} color="#cbd5e1" />
                        </TouchableOpacity>

                        <View className="p-6 border-b border-slate-700 items-center justify-center flex-row gap-3">
                            <Trophy size={28} color="#fbbf24" />
                            <Text className="text-2xl font-bold text-amber-400">Leaderboard</Text>
                        </View>

                        <ScrollView className="flex-1 px-4 py-2">
                            {leaderboard.length === 0 ? (
                                <Text className="text-slate-400 text-center mt-10">Loading or no entries yet...</Text>
                            ) : (
                                leaderboard.map((entry, index) => (
                                    <View key={entry.uid} className="flex-row items-center justify-between p-4 bg-slate-700/50 rounded-2xl mb-3 border border-slate-600/50">
                                        <View className="flex-row items-center flex-1">
                                            <Text className="font-bold text-amber-400 text-base w-6">{index + 1}.</Text>
                                            {entry.photoURL ? (
                                                <Image source={{ uri: entry.photoURL }} className="w-10 h-10 rounded-full border border-slate-500 mr-3" />
                                            ) : (
                                                <View className="w-10 h-10 rounded-full bg-slate-600 items-center justify-center mr-3 border border-slate-500">
                                                    <Users size={18} color="#cbd5e1" />
                                                </View>
                                            )}
                                            <Text className="font-semibold text-slate-200 flex-1 truncate">{entry.displayName}</Text>
                                        </View>
                                        <View className="bg-slate-800 px-3 py-1.5 rounded-full">
                                            <Text className="font-bold text-amber-400 text-xs">
                                                {entry.highScore} Sprints
                                            </Text>
                                        </View>
                                    </View>
                                ))
                            )}
                        </ScrollView>
                    </View>
                </View>
            </Modal>
            </View>
            </SafeAreaView>
        </View>
    );
}
