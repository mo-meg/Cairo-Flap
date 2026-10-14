/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Volume2, VolumeX, Trophy, Info, BookOpen, RotateCcw, Flame, Sparkles, Award } from 'lucide-react';
import { GameCanvas } from './GameCanvas';
import { audioEngine } from './audioEngine';
import { Difficulty, GameState, PlayerStats } from './gameTypes';

const STORAGE_KEY = 'cairo_flap_stats_v1';

export default function App() {
  const [gameState, setGameState] = useState<GameState>('MENU');
  const [difficulty, setDifficulty] = useState<Difficulty>('breeze');
  const [muted, setMuted] = useState<boolean>(false);
  const [activeModal, setActiveModal] = useState<'none' | 'howToPlay' | 'landmarks' | 'lore'>('none');
  const [shareToast, setShareToast] = useState<string | null>(null);

  // Live game stats
  const [currentScore, setCurrentScore] = useState<number>(0);
  const [currentCoins, setCurrentCoins] = useState<number>(0);
  const [currentKoshary, setCurrentKoshary] = useState<number>(0);
  const [currentShields, setCurrentShields] = useState<number>(2);

  // Persistent player profile
  const [stats, setStats] = useState<PlayerStats>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch {
      // Fallback
    }
    return {
      score: 0,
      coins: 0,
      kosharyEaten: 0,
      bestScore: 0,
      totalCoins: 0,
      gamesPlayed: 0,
    };
  });

  // Save persistent stats
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stats));
    } catch {
      // Ignore storage errors
    }
  }, [stats]);

  // Audio mute sync
  const handleToggleSound = useCallback((e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const newMuted = audioEngine.toggleMute();
    setMuted(newMuted);
  }, []);

  const handleStartGame = useCallback(() => {
    setCurrentScore(0);
    setCurrentCoins(0);
    setCurrentKoshary(0);
    setCurrentShields(difficulty === 'rush' ? 1 : 2);
    setGameState('PLAYING');
  }, [difficulty]);

  const handleScoreUpdate = useCallback((score: number, coins: number, koshary: number, shields: number = 2) => {
    setCurrentScore(score);
    setCurrentCoins(coins);
    setCurrentKoshary(koshary);
    setCurrentShields(shields);
  }, []);

  const handleGameOver = useCallback((finalScore: number, finalCoins: number) => {
    setGameState('GAME_OVER');
    setStats((prev) => ({
      score: finalScore,
      coins: finalCoins,
      kosharyEaten: prev.kosharyEaten + currentKoshary,
      bestScore: Math.max(prev.bestScore, finalScore),
      totalCoins: prev.totalCoins + finalCoins,
      gamesPlayed: prev.gamesPlayed + 1,
    }));
  }, [currentKoshary]);

  const handleRestart = useCallback((e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    handleStartGame();
  }, [handleStartGame]);

  // Determine Cairo honorary rank title based on score
  const getCairoRank = (score: number) => {
    if (score >= 50) return { title: 'Sultan of the Cairo Skies', medal: '👑 Legendary Gold', desc: 'You have conquered the Nile winds, outflown the minarets, and claimed the golden skies of Cairo!' };
    if (score >= 30) return { title: 'Guardian of the Saladin Citadel', medal: '🕌 Master Felucca', desc: 'Sailing above the medieval domes and high above the lotus crown of Cairo Tower.' };
    if (score >= 15) return { title: 'Khan el-Khalili Glider', medal: '🏺 Bazaar Artisan', desc: 'Expertly weaving through spicy alleys and ancient obelisks.' };
    if (score >= 5) return { title: 'Nile Rooftop Courier', medal: '🪙 Bronze Piastre', desc: 'A recognized regular across the rooftop pigeon dovecotes (Gheyat El-Hamam).' };
    return { title: 'Cairo Rooftop Hatchling', medal: '🪶 Novice Feather', desc: 'Just starting to flutter wings over the terracotta parapets.' };
  };

  const currentRank = getCairoRank(stats.score);

  // Copy score brag to clipboard
  const handleShareScore = (e: React.MouseEvent) => {
    e.stopPropagation();
    const text = `I scored ${stats.score} as Zagloul the Tarboosh Pigeon in Cairo Flap! Can you beat my high score over the Nile? 🇪🇬🕊️`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setShareToast('Score copied to clipboard!');
      setTimeout(() => setShareToast(null), 2500);
    }
  };

  return (
    <div className="flex flex-col w-screen h-screen overflow-hidden bg-slate-950 text-slate-100 font-sans">
      {/* 1. TOP BAR CONTRACT: 3 Zones: Brand - Nav Links - Primary Action */}
      <header className="flex items-center justify-between gap-8 px-6 py-3 border-b border-amber-950/60 bg-slate-950/90 backdrop-blur-md z-40 shrink-0">
        {/* Zone 1: Single text element wordmark */}
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-amber-400 via-orange-400 to-red-500 bg-clip-text text-transparent whitespace-nowrap">
            Cairo Flap
          </span>
          <span className="text-xs text-amber-500/80 font-medium whitespace-nowrap hidden sm:inline">
            · Tarboosh Pigeon Odyssey
          </span>
        </div>

        {/* Zone 2: Clean single-line text navigation links */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-300">
          <button
            onClick={() => setActiveModal('howToPlay')}
            className="hover:text-amber-400 transition-colors whitespace-nowrap text-left"
          >
            How to Play
          </button>
          <button
            onClick={() => setActiveModal('landmarks')}
            className="hover:text-amber-400 transition-colors whitespace-nowrap text-left"
          >
            Cairo Landmarks
          </button>
          <button
            onClick={() => setActiveModal('lore')}
            className="hover:text-amber-400 transition-colors whitespace-nowrap text-left"
          >
            Pigeon & Koshary Lore
          </button>
        </nav>

        {/* Zone 3: Essential Controls (Sound & Best Record) */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-950/40 border border-amber-800/40 rounded-lg text-xs font-medium text-amber-300 whitespace-nowrap">
            <Trophy className="w-3.5 h-3.5 text-amber-400" />
            <span>Best: {stats.bestScore}</span>
          </div>

          <button
            onClick={handleToggleSound}
            aria-label={muted ? 'Unmute game audio' : 'Mute game audio'}
            className="p-2 text-slate-300 hover:text-amber-400 hover:bg-slate-900 rounded-lg border border-slate-800 transition-colors whitespace-nowrap"
          >
            {muted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-amber-400" />}
          </button>
        </div>
      </header>

      {/* 2. MAIN GAME CONTAINER */}
      <main className="relative flex-1 flex items-center justify-center p-2 sm:p-4 overflow-hidden bg-gradient-to-b from-slate-950 via-[#120e1d] to-slate-950">
        {/* Game Canvas */}
        <GameCanvas
          gameState={gameState}
          difficulty={difficulty}
          stats={stats}
          onScoreUpdate={handleScoreUpdate}
          onGameOver={handleGameOver}
          onStartGame={handleStartGame}
        />

        {/* HUD OVERLAY: Active during PLAYING state */}
        {gameState === 'PLAYING' && (
          <div className="absolute top-6 left-0 right-0 flex flex-col items-center pointer-events-none z-30 px-4">
            {/* Main Score Display */}
            <div className="flex items-center gap-4">
              <div className="text-5xl font-black font-mono tracking-tight text-white drop-shadow-[0_4px_12px_rgba(0,0,0,0.8)]">
                {currentScore}
              </div>
            </div>

            {/* Collectibles and Shield count strip */}
            <div className="flex items-center gap-3 mt-2 px-3.5 py-1.5 bg-slate-950/80 border border-amber-800/60 rounded-full backdrop-blur-md text-xs font-semibold text-amber-300 shadow-lg">
              <span className="flex items-center gap-1">
                <span>🪙</span> {currentCoins}
              </span>
              <span className="text-slate-600">·</span>
              <span className="flex items-center gap-1">
                <span>🍲</span> {currentKoshary}
              </span>
              <span className="text-slate-600">·</span>
              <span className={`flex items-center gap-1 ${currentShields > 0 ? 'text-sky-300 font-bold' : 'text-slate-500'}`}>
                <span>🪶</span> {currentShields} {currentShields === 1 ? 'Shield' : 'Shields'}
              </span>
            </div>
          </div>
        )}

        {/* TITLE MENU OVERLAY: Active during MENU state */}
        {gameState === 'MENU' && (
          <div className="absolute inset-0 flex items-center justify-center p-4 z-30 pointer-events-none">
            <div className="max-w-xs sm:max-w-sm w-full bg-slate-900/90 border border-amber-700/50 p-6 rounded-2xl shadow-2xl backdrop-blur-md pointer-events-auto text-center flex flex-col items-center">
              {/* Logo / Badge */}
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-red-600 to-amber-600 flex items-center justify-center shadow-lg shadow-red-950/60 mb-3 border border-red-400/30">
                <span className="text-3xl filter drop-shadow">🕊️</span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-black text-amber-400 tracking-tight">
                Cairo Flap
              </h1>
              <p className="text-xs text-slate-300 mt-1 mb-4">
                Relaxed sightseeing flight over Cairo! Wide gaps & protective shields included.
              </p>

              {/* Difficulty selector tabs */}
              <div className="flex flex-col gap-1.5 w-full mb-4">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setDifficulty('breeze');
                  }}
                  className={`py-2 px-3 text-xs font-semibold rounded-lg transition-all flex items-center justify-between border ${
                    difficulty === 'breeze'
                      ? 'bg-amber-600/90 text-white border-amber-400 shadow-md ring-1 ring-amber-400'
                      : 'bg-slate-950/60 text-slate-400 border-slate-800 hover:text-slate-200'
                  }`}
                >
                  <span className="flex items-center gap-1.5">
                    <span>✨</span>
                    <span>Easy Nile Breeze</span>
                  </span>
                  <span className="text-[10px] opacity-90 bg-amber-900/50 px-2 py-0.5 rounded">
                    Wide Gaps · 2 Shields
                  </span>
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setDifficulty('rush');
                  }}
                  className={`py-2 px-3 text-xs font-semibold rounded-lg transition-all flex items-center justify-between border ${
                    difficulty === 'rush'
                      ? 'bg-red-700/90 text-white border-red-400 shadow-md ring-1 ring-red-400'
                      : 'bg-slate-950/60 text-slate-400 border-slate-800 hover:text-slate-200'
                  }`}
                >
                  <span className="flex items-center gap-1.5">
                    <span>⚡</span>
                    <span>Cairo Traffic</span>
                  </span>
                  <span className="text-[10px] opacity-90 bg-red-950/50 px-2 py-0.5 rounded">
                    Brisk · 1 Shield
                  </span>
                </button>
              </div>

              {/* Start Action */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleStartGame();
                }}
                className="w-full py-3 px-6 bg-gradient-to-r from-amber-500 to-red-600 hover:from-amber-400 hover:to-red-500 text-slate-950 font-bold rounded-xl shadow-lg shadow-amber-900/40 transition-transform active:scale-95 text-sm uppercase tracking-wide cursor-pointer"
              >
                Tap or Press Space to Fly
              </button>

              {/* Quick instructions metadata */}
              <div className="flex items-center justify-center gap-3 mt-4 text-[11px] text-slate-400">
                <span>Tap = Flap</span>
                <span aria-hidden="true">·</span>
                <span>🍲 Koshary = 2X Boost</span>
                <span aria-hidden="true">·</span>
                <span>🪙 Coin = +100</span>
              </div>
            </div>
          </div>
        )}

        {/* GAME OVER MODAL OVERLAY: Active during GAME_OVER state */}
        {gameState === 'GAME_OVER' && (
          <div className="absolute inset-0 flex items-center justify-center p-4 z-30 pointer-events-none">
            <div className="max-w-xs sm:max-w-sm w-full bg-slate-900/95 border border-amber-600/50 p-6 rounded-2xl shadow-2xl backdrop-blur-lg pointer-events-auto text-center flex flex-col items-center">
              <span className="text-xs uppercase tracking-widest font-bold text-red-400 mb-1">
                Flight Concluded
              </span>
              <h2 className="text-2xl font-black text-amber-300">Game Over</h2>

              {/* Cairo Honorary Title Card */}
              <div className="w-full my-3 p-3 bg-slate-950/80 border border-amber-900/40 rounded-xl flex flex-col items-center">
                <span className="text-xs font-semibold text-amber-400">{currentRank.medal}</span>
                <span className="text-sm font-bold text-slate-100 mt-0.5">{currentRank.title}</span>
                <p className="text-[11px] text-slate-400 mt-1 leading-snug">{currentRank.desc}</p>
              </div>

              {/* Score summary grid */}
              <div className="grid grid-cols-2 gap-2 w-full mb-4">
                <div className="p-2.5 bg-slate-950/60 border border-slate-800 rounded-lg">
                  <span className="text-[10px] uppercase tracking-wider text-slate-400 block">Score</span>
                  <span className="text-2xl font-extrabold text-amber-400 font-mono tabular-nums">
                    {stats.score}
                  </span>
                </div>
                <div className="p-2.5 bg-slate-950/60 border border-slate-800 rounded-lg">
                  <span className="text-[10px] uppercase tracking-wider text-slate-400 block">Best Record</span>
                  <span className="text-2xl font-extrabold text-slate-100 font-mono tabular-nums">
                    {stats.bestScore}
                  </span>
                </div>
              </div>

              {/* Collectibles gathered */}
              <div className="flex items-center justify-around w-full py-2 mb-4 border-t border-b border-slate-800/80 text-xs text-slate-300">
                <span>🪙 {stats.coins} Piastres</span>
                <span className="text-slate-600">·</span>
                <span>🍲 {currentKoshary} Koshary</span>
                <span className="text-slate-600">·</span>
                <span>🎮 #{stats.gamesPlayed} Flights</span>
              </div>

              {/* Actions */}
              <div className="flex flex-col gap-2 w-full">
                <button
                  onClick={handleRestart}
                  className="w-full py-2.5 px-4 bg-gradient-to-r from-amber-500 to-red-600 hover:from-amber-400 hover:to-red-500 text-slate-950 font-bold rounded-xl shadow-md transition-transform active:scale-95 text-xs uppercase tracking-wide cursor-pointer flex items-center justify-center gap-2"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Play Again (Spacebar)</span>
                </button>

                <button
                  onClick={handleShareScore}
                  className="w-full py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                >
                  Share Cairo Score
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Share Toast */}
        {shareToast && (
          <div className="absolute bottom-6 px-4 py-2 bg-emerald-600 text-white text-xs font-semibold rounded-lg shadow-lg z-50">
            {shareToast}
          </div>
        )}
      </main>

      {/* 3. MODALS: HOW TO PLAY, LANDMARKS, AND CAIRO LORE */}
      {activeModal !== 'none' && (
        <div
          className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 z-50"
          onClick={() => setActiveModal('none')}
        >
          <div
            className="max-w-lg w-full bg-slate-900 border border-amber-800/50 rounded-2xl p-6 shadow-2xl max-h-[85vh] overflow-y-auto text-slate-200"
            onClick={(e) => e.stopPropagation()}
          >
            {activeModal === 'howToPlay' && (
              <div>
                <h3 className="text-xl font-bold text-amber-400 mb-2">How to Play Cairo Flap</h3>
                <p className="text-xs text-slate-300 mb-4">
                  Welcome to Cairo! Take control of Zagloul the pigeon and soar through Egypt's historic landmarks.
                </p>

                <div className="space-y-3 text-xs">
                  <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800">
                    <span className="font-semibold text-amber-300 block mb-1">🎮 Flight Controls</span>
                    <p className="text-slate-400 leading-relaxed">
                      Tap the screen, click your mouse, or press <kbd className="px-1.5 py-0.5 bg-slate-800 rounded text-amber-300 font-mono">Space</kbd> / <kbd className="px-1.5 py-0.5 bg-slate-800 rounded text-amber-300 font-mono">↑</kbd> to flap Zagloul's wings upward. Time your taps to glide smoothly through pillar gaps.
                    </p>
                  </div>

                  <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800">
                    <span className="font-semibold text-amber-300 block mb-1">🪶 Protective Feather Shields</span>
                    <p className="text-slate-400 leading-relaxed">
                      Enjoy a relaxed flight! In Easy Nile Breeze mode, you start with <strong>2 Feather Shields</strong> that absorb accidental collisions with stone or ground. Eating Koshary restores shields and grants a fiery invincibility aura!
                    </p>
                  </div>

                  <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800">
                    <span className="font-semibold text-amber-300 block mb-1">🍲 Spicy Koshary Power-Up</span>
                    <p className="text-slate-400 leading-relaxed">
                      Collect the rare steaming bowls of Egyptian Koshary! It triggers a 6-second <em>Da'ah & Shatta</em> fiery speed rush that grants double points (2X score), recharges a shield, and makes you invincible!
                    </p>
                  </div>

                  <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800">
                    <span className="font-semibold text-amber-300 block mb-1">🪙 Golden Piastres (Egyptian Coins)</span>
                    <p className="text-slate-400 leading-relaxed">
                      Collect hovering gold coins between pillars for bonus score points and authentic oud musical chimes.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {activeModal === 'landmarks' && (
              <div>
                <h3 className="text-xl font-bold text-amber-400 mb-2">Cairo Landmarks You Encounter</h3>
                <p className="text-xs text-slate-300 mb-4">
                  The obstacles in Cairo Flap represent three millennia of monumental architecture along the Nile.
                </p>

                <div className="space-y-3 text-xs">
                  <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800">
                    <span className="font-semibold text-amber-300 block mb-0.5">1. Cairo Tower (Burg Al-Qāhirah)</span>
                    <p className="text-slate-400 leading-relaxed">
                      Standing 187 meters tall on Gezira Island, this iconic 1961 landmark features a distinctive wickerwork open-lattice design inspired by the sacred Pharaonic lotus plant, topped by a circular observation deck.
                    </p>
                  </div>

                  <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800">
                    <span className="font-semibold text-amber-300 block mb-0.5">2. Historic Islamic Minarets (Manārat)</span>
                    <p className="text-slate-400 leading-relaxed">
                      Known as "The City of a Thousand Minarets," Cairo's medieval skyline boasts ornate Mamluk stone towers with carved muqarnas balconies and crescent finials dating back to Sultan Hassan and Al-Azhar.
                    </p>
                  </div>

                  <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800">
                    <span className="font-semibold text-amber-300 block mb-0.5">3. Ancient Pharaonic Obelisks</span>
                    <p className="text-slate-400 leading-relaxed">
                      Monolithic four-sided rose granite pillars carved in Aswan and erected in ancient Heliopolis, inscribed with sacred hieroglyphs and capped with gold pyramidions (Benben stones) honoring the sun god Ra.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {activeModal === 'lore' && (
              <div>
                <h3 className="text-xl font-bold text-amber-400 mb-2">Rooftops, Pigeons & Koshary</h3>
                <p className="text-xs text-slate-300 mb-4">
                  The real Cairo culture behind the game!
                </p>

                <div className="space-y-3 text-xs">
                  <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800">
                    <span className="font-semibold text-amber-300 block mb-0.5">🕊️ The Rooftop Dovecotes (Gheyat El-Hamam)</span>
                    <p className="text-slate-400 leading-relaxed">
                      Look across any Cairo skyline and you'll see wooden towers perched on residential roofs. These are <em>Gheya</em>, where passionate Egyptian pigeon fanciers (<em>Ghawy Hamam</em>) raise homing pigeons, training them to circle in swirling flocks before sunset.
                    </p>
                  </div>

                  <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800">
                    <span className="font-semibold text-amber-300 block mb-0.5">🎩 The Tarboosh (Fez)</span>
                    <p className="text-slate-400 leading-relaxed">
                      The red felt cap with a dangling black silk tassel was popularized in Egypt during Muhammad Ali Pasha's era and was the dapper national headwear of Cairo intellectuals, musicians, and gentlemen throughout the 19th and early 20th centuries.
                    </p>
                  </div>

                  <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800">
                    <span className="font-semibold text-amber-300 block mb-0.5">🍲 Koshary: Egypt's National Fuel</span>
                    <p className="text-slate-400 leading-relaxed">
                      The quintessential Cairo street food dish combining rice, macaroni, lentils, and chickpeas, showered with crunchy fried onions and seasoned with spicy garlic-vinegar <em>Da'ah</em> and fiery chili <em>Shatta</em>!
                    </p>
                  </div>
                </div>
              </div>
            )}

            <button
              onClick={() => setActiveModal('none')}
              className="mt-5 w-full py-2 bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold rounded-xl text-xs uppercase tracking-wider transition-colors cursor-pointer"
            >
              Close Guide
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
