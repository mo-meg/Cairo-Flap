/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type GameState = 'MENU' | 'PLAYING' | 'GAME_OVER';

export type Difficulty = 'breeze' | 'rush';

export type ObstacleType = 'cairo_tower' | 'minaret' | 'obelisk';

export interface PigeonState {
  x: number;
  y: number;
  vy: number;
  radius: number;
  rotation: number;
  flapPhase: number;
  tasselAngle: number;
  kosharyBoostTimer: number; // in seconds
  flapping: boolean;
  featherShields: number;
  invulnerabilityTimer: number;
}

export interface Obstacle {
  id: number;
  x: number;
  width: number;
  topHeight: number;
  bottomHeight: number;
  gap: number;
  type: ObstacleType;
  passed: boolean;
  hieroglyphSeed: number;
}

export interface Collectible {
  id: number;
  x: number;
  y: number;
  type: 'coin' | 'koshary';
  collected: boolean;
  bobPhase: number;
  rotation: number;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  life: number;
  maxLife: number;
  shape?: 'circle' | 'feather' | 'sparkle' | 'smoke';
  alpha: number;
}

export interface FloatingText {
  id: number;
  x: number;
  y: number;
  text: string;
  color: string;
  life: number;
  maxLife: number;
}

export interface FeluccaBoat {
  x: number;
  speed: number;
  sailHeight: number;
  bobPhase: number;
}

export interface GameSettings {
  difficulty: Difficulty;
  soundEnabled: boolean;
  vibrationEnabled: boolean;
}

export interface PlayerStats {
  score: number;
  coins: number;
  kosharyEaten: number;
  bestScore: number;
  totalCoins: number;
  gamesPlayed: number;
}
