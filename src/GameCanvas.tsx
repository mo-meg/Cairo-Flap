/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { audioEngine } from './audioEngine';
import { GameRenderer } from './gameRenderer';
import {
  Collectible,
  Difficulty,
  FloatingText,
  GameState,
  Obstacle,
  ObstacleType,
  Particle,
  PigeonState,
  PlayerStats,
} from './gameTypes';

interface GameCanvasProps {
  gameState: GameState;
  difficulty: Difficulty;
  stats: PlayerStats;
  onScoreUpdate: (score: number, coins: number, koshary: number, shields: number) => void;
  onGameOver: (finalScore: number, finalCoins: number) => void;
  onStartGame: () => void;
}

const LOGICAL_WIDTH = 440;
const LOGICAL_HEIGHT = 700;
const GROUND_HEIGHT = 80;

export const GameCanvas: React.FC<GameCanvasProps> = ({
  gameState,
  difficulty,
  stats,
  onScoreUpdate,
  onGameOver,
  onStartGame,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Core mutable game loop state kept in refs for 60 FPS performance without React re-renders
  const pigeonRef = useRef<PigeonState>({
    x: 100,
    y: 300,
    vy: 0,
    radius: 9, // forgiving hitbox radius
    rotation: 0,
    flapPhase: 0,
    tasselAngle: 0,
    kosharyBoostTimer: 0,
    flapping: false,
    featherShields: 2, // 2 protective shields in easy mode
    invulnerabilityTimer: 0,
  });

  const obstaclesRef = useRef<Obstacle[]>([]);
  const collectiblesRef = useRef<Collectible[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const floatingTextsRef = useRef<FloatingText[]>([]);

  const scrollXRef = useRef<number>(0);
  const obstacleTimerRef = useRef<number>(0);
  const nextObstacleIdRef = useRef<number>(1);
  const nextCollectibleIdRef = useRef<number>(1);
  const nextTextIdRef = useRef<number>(1);

  const scoreRef = useRef<number>(0);
  const coinsRef = useRef<number>(0);
  const kosharyCountRef = useRef<number>(0);

  const gameStateRef = useRef<GameState>(gameState);
  const difficultyRef = useRef<Difficulty>(difficulty);

  // Sync refs with props and automatically initialize when entering PLAYING
  useEffect(() => {
    const prevState = gameStateRef.current;
    gameStateRef.current = gameState;
    if (gameState === 'PLAYING' && prevState !== 'PLAYING') {
      resetGame();
      pigeonRef.current.vy = difficultyRef.current === 'rush' ? -6.2 : -5.4;
      audioEngine.playFlap();
    }
  }, [gameState]);

  useEffect(() => {
    difficultyRef.current = difficulty;
  }, [difficulty]);

  // Reset all game physics variables
  const resetGame = useCallback(() => {
    const isRush = difficultyRef.current === 'rush';
    pigeonRef.current = {
      x: 110,
      y: 280,
      vy: -5.4,
      radius: 12,
      rotation: 0,
      flapPhase: 0,
      tasselAngle: 0,
      kosharyBoostTimer: 0,
      flapping: false,
      featherShields: isRush ? 1 : 2,
      invulnerabilityTimer: 1.0, // 1s grace period on start
    };
    obstaclesRef.current = [];
    collectiblesRef.current = [];
    particlesRef.current = [];
    floatingTextsRef.current = [];
    scrollXRef.current = 0;
    // Pre-advance timer so first landmark appears after ~1.5s
    const spawnDistance = isRush ? 290 : 360;
    obstacleTimerRef.current = spawnDistance - 130;
    scoreRef.current = 0;
    coinsRef.current = 0;
    kosharyCountRef.current = 0;
  }, []);

  const lastFlapTimeRef = useRef<number>(0);

  // Trigger flap action
  const handleFlap = useCallback(() => {
    const now = performance.now();
    if (now - lastFlapTimeRef.current < 60) return;
    lastFlapTimeRef.current = now;

    audioEngine.ensureAudio();

    if (gameStateRef.current === 'MENU' || gameStateRef.current === 'GAME_OVER') {
      resetGame();
      onStartGame();
      audioEngine.playFlap();
      pigeonRef.current.vy = difficultyRef.current === 'rush' ? -6.2 : -5.4;
      pigeonRef.current.flapPhase = 0;
      return;
    }

    if (gameStateRef.current === 'PLAYING') {
      // Gentle, controllable upward float
      const flapStrength = difficultyRef.current === 'rush' ? -6.5 : -5.5;
      pigeonRef.current.vy = flapStrength;
      pigeonRef.current.flapPhase = 0;
      audioEngine.playFlap();

      // Emit feather puff particles
      const p = pigeonRef.current;
      for (let i = 0; i < 4; i++) {
        particlesRef.current.push({
          x: p.x - 12 + Math.random() * 6,
          y: p.y + Math.random() * 10 - 5,
          vx: -2 - Math.random() * 2,
          vy: Math.random() * 3 - 1.5,
          color: i % 2 === 0 ? '#94A3B8' : '#CBD5E1',
          size: 3 + Math.random() * 2,
          life: 25,
          maxLife: 25,
          alpha: 0.9,
          shape: 'feather',
        });
      }
    }
  }, [onStartGame, resetGame]);

  // Spawn obstacles
  const spawnObstacle = useCallback(() => {
    const isRush = difficultyRef.current === 'rush';
    // Generous, wide gap! 230px in easy mode gives plenty of open flight path!
    const gap = isRush ? 185 : 230;
    const playHeight = LOGICAL_HEIGHT - GROUND_HEIGHT;
    const minTop = 55;
    const maxTop = playHeight - gap - 55;
    const topHeight = Math.floor(minTop + Math.random() * (maxTop - minTop));
    const bottomHeight = playHeight - (topHeight + gap);

    const types: ObstacleType[] = ['cairo_tower', 'minaret', 'obelisk'];
    const type = types[Math.floor(Math.random() * types.length)];
    const obsId = nextObstacleIdRef.current++;

    const newObs: Obstacle = {
      id: obsId,
      x: LOGICAL_WIDTH + 20,
      width: 58,
      topHeight,
      bottomHeight,
      gap,
      type,
      passed: false,
      hieroglyphSeed: Math.floor(Math.random() * 100),
    };

    obstaclesRef.current.push(newObs);

    // Collectible Spawning logic
    const gapCenterY = topHeight + gap / 2;
    const spawnRoll = Math.random();

    if (spawnRoll < 0.28) {
      // 28% chance of spicy Koshary bowl
      collectiblesRef.current.push({
        id: nextCollectibleIdRef.current++,
        x: LOGICAL_WIDTH + 20 + 29,
        y: gapCenterY,
        type: 'koshary',
        collected: false,
        bobPhase: Math.random() * Math.PI * 2,
        rotation: 0,
      });
    } else if (spawnRoll < 0.9) {
      // 62% chance of golden Piastre coin
      collectiblesRef.current.push({
        id: nextCollectibleIdRef.current++,
        x: LOGICAL_WIDTH + 20 + 29,
        y: gapCenterY,
        type: 'coin',
        collected: false,
        bobPhase: Math.random() * Math.PI * 2,
        rotation: Math.random() * Math.PI,
      });
    }
  }, []);

  // Main 60 FPS Canvas Game Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let lastTime = performance.now();

    const loop = (currentTime: number) => {
      const dt = Math.min((currentTime - lastTime) / 1000, 0.05); // cap at 50ms to prevent huge jumps
      lastTime = currentTime;

      const state = gameStateRef.current;
      const isRush = difficultyRef.current === 'rush';

      // 1. UPDATE GAME PHYSICS (when PLAYING)
      if (state === 'PLAYING') {
        const p = pigeonRef.current;
        // Frame delta scaling factor (1.0 at 60fps)
        const dtFactor = Math.min(dt * 60, 2.0);

        // Gentle, floaty gravity (per-frame scale) and relaxed cruise speed
        const gravity = isRush ? 0.28 : 0.22;
        const baseSpeed = isRush ? 120 : 90;
        const speedMultiplier = p.kosharyBoostTimer > 0 ? 1.25 : 1;
        const forwardSpeed = baseSpeed * speedMultiplier;
        const maxFallSpeed = isRush ? 5.8 : 4.5;

        // Decrement invulnerability timer
        if (p.invulnerabilityTimer > 0) {
          p.invulnerabilityTimer -= dt;
          if (p.invulnerabilityTimer <= 0) {
            p.invulnerabilityTimer = 0;
          }
        }

        // Decrement Koshary boost timer
        if (p.kosharyBoostTimer > 0) {
          p.kosharyBoostTimer -= dt;
          if (p.kosharyBoostTimer <= 0) {
            p.kosharyBoostTimer = 0;
          }

          // Emit spicy chili flame embers
          particlesRef.current.push({
            x: p.x - 14,
            y: p.y + (Math.random() * 12 - 6),
            vx: -3 - Math.random() * 2,
            vy: Math.random() * 2 - 1,
            color: Math.random() > 0.4 ? '#EF4444' : '#F59E0B',
            size: 2.5 + Math.random() * 2,
            life: 20,
            maxLife: 20,
            alpha: 0.9,
            shape: 'circle',
          });
        }

        // Apply gentle gravity & velocity
        p.vy += gravity * dtFactor;
        // Clamp terminal fall velocity so pigeon glides down gently
        if (p.vy > maxFallSpeed) p.vy = maxFallSpeed;
        p.y += p.vy * dtFactor;

        // Smooth rotation based on vertical speed
        const targetRotation = Math.min(Math.max(p.vy * 0.05, -0.35), 0.85);
        p.rotation += (targetRotation - p.rotation) * 0.16;

        // Flap animation phase
        p.flapPhase += dt * 12;

        // Tarboosh silk tassel physics (reacts to downward acceleration & wind)
        const targetTasselAngle = -p.vy * 0.1 + Math.sin(currentTime * 0.01) * 0.2;
        p.tasselAngle += (targetTasselAngle - p.tasselAngle) * 0.2;

        // Scroll world
        scrollXRef.current += forwardSpeed * dt;

        // Spawn obstacles with generous breathing room
        obstacleTimerRef.current += forwardSpeed * dt;
        const spawnDistance = isRush ? 290 : 360;
        if (obstacleTimerRef.current >= spawnDistance) {
          obstacleTimerRef.current = 0;
          spawnObstacle();
        }

        // Update obstacles
        const playHeight = LOGICAL_HEIGHT - GROUND_HEIGHT;
        for (let i = obstaclesRef.current.length - 1; i >= 0; i--) {
          const obs = obstaclesRef.current[i];
          obs.x -= forwardSpeed * dt;

          // Score check
          if (!obs.passed && obs.x + obs.width < p.x) {
            obs.passed = true;
            const pointsToAdd = p.kosharyBoostTimer > 0 ? 2 : 1;
            scoreRef.current += pointsToAdd;
            audioEngine.playScore();

            floatingTextsRef.current.push({
              id: nextTextIdRef.current++,
              x: obs.x + obs.width * 0.5,
              y: obs.topHeight + obs.gap * 0.5,
              text: pointsToAdd > 1 ? `+${pointsToAdd} (2X!)` : `+${pointsToAdd}`,
              color: pointsToAdd > 1 ? '#EF4444' : '#FEF08A',
              life: 30,
              maxLife: 30,
            });

            onScoreUpdate(scoreRef.current, coinsRef.current, kosharyCountRef.current, p.featherShields);
          }

          // Cull offscreen obstacles
          if (obs.x + obs.width < -30) {
            obstaclesRef.current.splice(i, 1);
          }
        }

        // Update collectibles
        for (let i = collectiblesRef.current.length - 1; i >= 0; i--) {
          const c = collectiblesRef.current[i];
          c.x -= forwardSpeed * dt;
          c.rotation += dt * 4;
          c.bobPhase += dt * 3;

          // Collision check with pigeon
          if (!c.collected) {
            const bobY = c.y + Math.sin(c.bobPhase) * 5;
            const dx = p.x - c.x;
            const dy = (p.y + 2) - bobY;
            const dist = Math.hypot(dx, dy);

            if (dist < p.radius + 18) {
              c.collected = true;

              if (c.type === 'coin') {
                const coinPts = p.kosharyBoostTimer > 0 ? 200 : 100;
                coinsRef.current += 1;
                scoreRef.current += (p.kosharyBoostTimer > 0 ? 2 : 1);
                audioEngine.playCoin();

                floatingTextsRef.current.push({
                  id: nextTextIdRef.current++,
                  x: c.x,
                  y: c.y - 10,
                  text: `+${coinPts} 🪙`,
                  color: '#FEF08A',
                  life: 35,
                  maxLife: 35,
                });

                // Sparkle burst particles
                for (let k = 0; k < 10; k++) {
                  particlesRef.current.push({
                    x: c.x,
                    y: c.y,
                    vx: (Math.random() - 0.5) * 5,
                    vy: (Math.random() - 0.5) * 5,
                    color: '#FBBF24',
                    size: 3,
                    life: 25,
                    maxLife: 25,
                    alpha: 1,
                    shape: 'sparkle',
                  });
                }
              } else if (c.type === 'koshary') {
                kosharyCountRef.current += 1;
                scoreRef.current += 3;
                p.kosharyBoostTimer = 6.0; // 6-second boost
                // Recharges 1 protective feather shield!
                if (p.featherShields < 3) {
                  p.featherShields += 1;
                }
                audioEngine.playKoshary();

                floatingTextsRef.current.push({
                  id: nextTextIdRef.current++,
                  x: c.x,
                  y: c.y - 20,
                  text: 'KOSHARY RUSH + SHIELD! 🔥🪶',
                  color: '#EF4444',
                  life: 48,
                  maxLife: 48,
                });

                // Fiery burst
                for (let k = 0; k < 18; k++) {
                  particlesRef.current.push({
                    x: c.x,
                    y: c.y,
                    vx: (Math.random() - 0.5) * 7,
                    vy: (Math.random() - 0.5) * 7,
                    color: k % 2 === 0 ? '#EF4444' : '#F59E0B',
                    size: 4,
                    life: 30,
                    maxLife: 30,
                    alpha: 1,
                    shape: 'circle',
                  });
                }
              }

              onScoreUpdate(scoreRef.current, coinsRef.current, kosharyCountRef.current, p.featherShields);
            }
          }

          // Cull offscreen collectibles
          if (c.x < -30) {
            collectiblesRef.current.splice(i, 1);
          }
        }

        // FORGIVING COLLISION DETECTION & SAFETY SHIELDS
        let collided = false;

        // Ground collision
        if (p.y + 10 >= playHeight) {
          collided = true;
          p.y = playHeight - 12;
        }

        // Gentle ceiling bounce (no death at ceiling)
        if (p.y - 10 <= 0) {
          p.y = 12;
          p.vy = 0.5;
        }

        // Obstacles collision (generous center box: 14x14px)
        const pLeft = p.x - 7;
        const pRight = p.x + 7;
        const pTop = p.y - 7;
        const pBottom = p.y + 7;

        for (const obs of obstaclesRef.current) {
          const obsLeft = obs.x;
          const obsRight = obs.x + obs.width;
          const topObsBottom = obs.topHeight;
          const botObsTop = obs.topHeight + obs.gap;

          // Check if horizontally within pillar
          if (pRight > obsLeft && pLeft < obsRight) {
            // Check top pillar or bottom pillar
            if (pTop < topObsBottom || pBottom > botObsTop) {
              collided = true;
              break;
            }
          }
        }

        // HANDLE SAFETY SHIELD RESCUE VS GAME OVER
        if (collided) {
          if (p.invulnerabilityTimer > 0) {
            // Currently invincible from previous rescue - safe!
          } else if (p.kosharyBoostTimer > 0) {
            // Spicy Koshary boost acts as a fiery super shield!
            p.invulnerabilityTimer = 1.4;
            p.vy = -3.8;
            audioEngine.playScore();
            floatingTextsRef.current.push({
              id: nextTextIdRef.current++,
              x: p.x,
              y: p.y - 25,
              text: 'SPICY SHIELD SAVED YOU! 🔥',
              color: '#EF4444',
              life: 40,
              maxLife: 40,
            });
          } else if (p.featherShields > 0) {
            // Feather shield rescues the player!
            p.featherShields -= 1;
            p.invulnerabilityTimer = 2.0;
            p.vy = -4.5; // safe upward lift
            audioEngine.playCoin();
            floatingTextsRef.current.push({
              id: nextTextIdRef.current++,
              x: p.x,
              y: p.y - 25,
              text: 'FEATHER SHIELD SAVED! 🪶',
              color: '#38BDF8',
              life: 45,
              maxLife: 45,
            });

            // Rescue feather explosion
            for (let k = 0; k < 12; k++) {
              particlesRef.current.push({
                x: p.x,
                y: p.y,
                vx: (Math.random() - 0.5) * 5,
                vy: (Math.random() - 0.5) * 5,
                color: '#38BDF8',
                size: 3.5,
                life: 30,
                maxLife: 30,
                alpha: 1,
                shape: 'feather',
              });
            }

            onScoreUpdate(scoreRef.current, coinsRef.current, kosharyCountRef.current, p.featherShields);
          } else {
            // No shields remaining: Game Over
            audioEngine.playHit();
            audioEngine.playGameOver();

            // Explosion of feathers and sand dust
            for (let k = 0; k < 20; k++) {
              particlesRef.current.push({
                x: p.x,
                y: p.y,
                vx: (Math.random() - 0.5) * 6,
                vy: (Math.random() - 0.5) * 6,
                color: k % 3 === 0 ? '#DC2626' : (k % 2 === 0 ? '#94A3B8' : '#D97706'),
                size: 3 + Math.random() * 3,
                life: 35,
                maxLife: 35,
                alpha: 1,
                shape: 'feather',
              });
            }

            gameStateRef.current = 'GAME_OVER';
            onGameOver(scoreRef.current, coinsRef.current);
          }
        }
      } else if (state === 'MENU') {
        // Idle gentle floating bobbing for Zagloul on title screen
        const p = pigeonRef.current;
        p.y = 280 + Math.sin(currentTime * 0.004) * 12;
        p.rotation = Math.sin(currentTime * 0.003) * 0.08;
        p.flapPhase += dt * 6;
        p.tasselAngle = Math.sin(currentTime * 0.004) * 0.35;
        scrollXRef.current += 30 * dt; // slow scenic sky scroll
      }

      // UPDATE PARTICLES
      for (let i = particlesRef.current.length - 1; i >= 0; i--) {
        const pt = particlesRef.current[i];
        pt.x += pt.vx;
        pt.y += pt.vy;
        pt.life--;
        pt.alpha = Math.max(0, pt.life / pt.maxLife);
        if (pt.life <= 0) {
          particlesRef.current.splice(i, 1);
        }
      }

      // UPDATE FLOATING TEXTS
      for (let i = floatingTextsRef.current.length - 1; i >= 0; i--) {
        const ft = floatingTextsRef.current[i];
        ft.y -= 1.2;
        ft.life--;
        if (ft.life <= 0) {
          floatingTextsRef.current.splice(i, 1);
        }
      }

      // 2. RENDER SCENE TO CANVAS
      ctx.clearRect(0, 0, LOGICAL_WIDTH, LOGICAL_HEIGHT);

      // Background, pyramids, skyline, Nile, and rooftop ground
      GameRenderer.drawBackground(
        ctx,
        LOGICAL_WIDTH,
        LOGICAL_HEIGHT,
        scrollXRef.current,
        scoreRef.current
      );

      // Obstacles
      for (const obs of obstaclesRef.current) {
        GameRenderer.drawObstacle(ctx, obs, LOGICAL_HEIGHT);
      }

      // Collectibles
      for (const col of collectiblesRef.current) {
        GameRenderer.drawCollectible(ctx, col);
      }

      // Particles
      GameRenderer.drawParticles(ctx, particlesRef.current);

      // Zagloul the Fez-wearing Pigeon
      GameRenderer.drawPigeon(ctx, pigeonRef.current);

      // Floating texts
      GameRenderer.drawFloatingTexts(ctx, floatingTextsRef.current);

      animationFrameId = requestAnimationFrame(loop);
    };

    animationFrameId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [onScoreUpdate, onGameOver, spawnObstacle]);

  // Handle global keyboard inputs (Space, ArrowUp, W)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
        e.preventDefault();
        handleFlap();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleFlap]);

  // Handle clicks and taps anywhere on the screen (desktop and mobile)
  useEffect(() => {
    const handleWindowPointer = (e: PointerEvent) => {
      // Left mouse click or touch only
      if (e.button !== 0 && e.pointerType === 'mouse') return;

      // Ignore clicks on UI buttons, nav links, or interactive modal dialogs
      const target = e.target as HTMLElement | null;
      if (
        target?.closest('button') ||
        target?.closest('nav') ||
        target?.closest('a') ||
        target?.closest('[role="dialog"]')
      ) {
        return;
      }

      handleFlap();
    };

    window.addEventListener('pointerdown', handleWindowPointer);
    return () => window.removeEventListener('pointerdown', handleWindowPointer);
  }, [handleFlap]);

  return (
    <div
      className="relative flex items-center justify-center w-full h-full cursor-pointer select-none overflow-hidden"
      onPointerDown={(e) => {
        if (e.button !== 0 && e.pointerType === 'mouse') return;
        e.preventDefault();
        handleFlap();
      }}
    >
      <canvas
        ref={canvasRef}
        width={LOGICAL_WIDTH}
        height={LOGICAL_HEIGHT}
        className="w-full h-full max-w-[480px] max-h-[820px] object-contain rounded-xl shadow-2xl bg-slate-900 border border-amber-900/40"
      />
    </div>
  );
};
