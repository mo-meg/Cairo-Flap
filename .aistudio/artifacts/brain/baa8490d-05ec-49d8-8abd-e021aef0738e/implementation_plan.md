# Cairo Flap: The Rooftop Pigeon Odyssey

An authentic Cairo-themed Flappy Bird arcade game where players guide an iconic Egyptian rooftop pigeon (*Hamam*) adorned with a classic red Tarboosh fez across the historic Cairo skyline, navigating between lotus-latticed Cairo Towers, sandstone minarets, and Pharaonic obelisks while swooping for bowls of spicy Koshary and golden piastres.

## User Review & Critical Decisions

> [!IMPORTANT]
> The core creative direction has been confirmed via initial questions. Please review the architectural breakdown, game balance, and visual atmosphere below before we proceed to coding.

- **Protagonist (Confirmed)**: Cairo Rooftop Pigeon (*Zagloul*) wearing a jaunty red felt Tarboosh (fez) with a black silk tassel that sways dynamically with flight physics.
- **Skyline & Obstacles (Confirmed)**: Architectural pillars alternating between the lattice-tower of Cairo Tower (*Burg Al-Qāhirah*), historic Islamic minarets (*Manārat*), and Pharaonic granite obelisks inscribed with hieroglyphs.
- **Collectibles & Mechanics (Confirmed)**:
  - **Golden Coins (Piastres)**: Hovering between obstacle gaps (+100 bonus score & melodic oud-like chime).
  - **Spicy Koshary Bowls**: Rare Egyptian culinary power-up providing a temporary *Da'ah & Shatta* chili-boost (temporary score frenzy multiplier and fiery wing trail).
- **Audio & Ambiance**: 100% synthesized procedural Web Audio API sounds (percussive darbuka flaps, oud-like coin pickups, joyful coos, brass game-over sting) with zero external audio file dependencies.

---

## 1. Overview & Core Concept

- **What It Does**: A high-fidelity, responsive 2D arcade physics game built on HTML5 Canvas and React. Players flap by tapping, clicking, or pressing Space/Arrow keys. The scene scrolls seamlessly through a multi-layer parallax Egyptian atmosphere: Giza pyramid silhouettes on the distant horizon, felucca sailboats along the shimmering Nile, rooftop pigeon towers (*Gheyat El-Hamam*), and atmospheric dust motes.
- **Target Audience & Mood**: Casual arcade lovers and travelers longing for Cairo's vibrant rooftop culture. The tone is festive, warm, and affectionate toward modern and historic Cairo.
- **Key Value**: Crisp 60 FPS physics with sub-pixel collision precision, instant restart loops, customizable difficulty modes (Calm Breeze vs. Cairo Traffic Rush), sound toggles, and local high score tracking.

---

## 2. User Experience & Visual Design

### Key User Flows

```
┌──────────────────┐       Tap / Space       ┌──────────────────┐
│    TITLE VIEW    ├────────────────────────►│   ACTIVE PLAY    │
│  - Fez Pigeon Idle│                         │  - 60 FPS Loop   │
│  - Instructions  │◄────────────────────────┤  - Collectibles  │
│  - Mode & Audio  │      Back to Title      │  - Parallax Sky  │
└──────────────────┘                         └────────┬─────────┘
                                                      │ Collision
                                                      ▼
                                             ┌──────────────────┐
                                             │    GAME OVER     │
                                             │  - Score & Medals│
                                             │  - Best Record   │
                                             │  - "Play Again"  │
                                             └──────────────────┘
```

1. **Title View**: Features an animated floating Tarboosh Pigeon, highest score record, Nile breeze toggle, difficulty selector (*Nile Drift* normal vs *Khan el-Khalili* brisk), and a prominent start prompt.
2. **Active Play**:
   - Tap/Click/Space triggers an upward flap with wing rotation and feather puff particles.
   - Dynamic Cairo sky progresses subtly from Golden Hour Amber through Nile Dusk to Starry Egyptian Night as the player's score climbs.
   - Obstacle pairs feature distinctive architectural caps (Cairo Tower crown with lotus top, Islamic minaret balconies, and golden obelisk pyramidions).
   - On collecting Koshary, the bird gains a spicy flame aura, pulsing score multipliers, and energetic speed trail.
3. **Game Over Modal**: Displays achieved score, previous record, custom Cairo rank title (e.g., *Novice Sparrow*, *Rooftop Scout*, *Nile Navigator*, *Sultan of the Sky*), and an immediate one-click `"Play Again"` restart with no page reloads.

### Visual Identity & Theme Tokens

- **Palette**:
  - Sky Horizon: `#F59E0B` (Cairo Golden Sunset) transitioning to `#0F172A` (Nile Midnight).
  - River Nile: `#0369A1` (Deep River Blue) with golden water shimmer lines (`#FDE047`).
  - Sandy Sandstone & Monuments: `#D97706` (Desert Ochre), `#78350F` (Ancient Stone), `#451A03` (Shadowed Basalt).
  - Tarboosh Red: `#DC2626` (Egyptian Crimson) with `#171717` (Silk Tassel).
  - Koshary & Gold: `#F59E0B` (Piastre Gold), `#EF4444` (Spicy Tomato Da'ah).
- **Typography**:
  - Display / Title: *Plus Jakarta Sans* (bold, modern geometric headings) paired with clean geometric Arabic-inspired decorative motifs.
  - Numbers & HUD: `font-mono tabular-nums tracking-wider` for clean arcade readouts.
- **Anti-Slop Restraint**: Zero generic purple gradients, zero pill capsules on static data, clean typography with `·` bullet separators, no fake telemetry tickers, and clean natural title-case labels.

---

## 3. Key Product Decisions & Trade-Offs

- **Canvas 2D Rendering vs DOM Nodes**:
  - *Decision*: Pure HTML5 Canvas rendering for the entire playfield, combined with React for UI overlays.
  - *Why*: Guarantees smooth 60 FPS on mobile phones, tablets, and high-refresh desktop monitors without DOM reflow or jitter during obstacle scrolling.
- **Procedural Canvas Sprites vs Static Raster Assets**:
  - *Decision*: High-precision vector drawing routines for the Tarboosh Pigeon, Cairo Tower, and Minarets directly via Canvas 2D path rendering, backed by procedural particle engines.
  - *Why*: Eliminates broken image host failures, guarantees crisp anti-aliased scaling on Retina displays, and allows fluid physics-based wing flaps and tassel swish animations.
- **Web Audio API Procedural Sound vs Audio Files**:
  - *Decision*: Custom Web Audio oscillator synthesizer generating authentic micro-tunes (Darabouka tap, Oud pluck, Egyptian whistle, coo chirp).
  - *Why*: Instantaneous zero-latency playback with zero risk of 404 network errors, completely controllable via a one-click mute button.
- **Local Storage Persistence**:
  - *Decision*: High scores and player preferences saved in `localStorage` with fallback to memory state.
  - *Why*: Provides instant persistence between sessions without requiring complex server round-trips.

---

## 4. Technical Architecture & Data Strategy

### System Component Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                         App.tsx                              │
│  ┌─────────────────────────┐    ┌─────────────────────────┐  │
│  │     TopBar & Controls   │    │     GameCanvas.tsx      │  │
│  │  - Audio Mute / Unmute  │    │  - 60 FPS requestAnim   │  │
│  │  - High Score Display   │    │  - Parallax Background  │  │
│  │  - Difficulty Mode      │    │  - Physics & Collision  │  │
│  └─────────────────────────┘    │  - Pigeon & Obstacles   │  │
│                                 │  - Koshary & Coins      │  │
│  ┌─────────────────────────┐    │  - Particle Effects     │  │
│  │     UI Overlay State    │    └────────────┬────────────┘  │
│  │  - Start Menu / Keys    │                 │               │
│  │  - Active HUD Score     │                 ▼               │
│  │  - Game Over & Rank     │    ┌─────────────────────────┐  │
│  └─────────────────────────┘    │      audioEngine.ts     │  │
│                                 │  - Web Audio Synthesizer│  │
│                                 │  - Percussion & Oud FX  │  │
│                                 └─────────────────────────┘  │
└──────────────────────────────────────────────────────────────┘
```

### Core State Machine & Entities

- `gameState`: `'MENU' | 'PLAYING' | 'GAME_OVER'`
- `pigeon`: `{ y, velocity, rotation, flapPhase, tasselAngle, kosharyBoostTimer }`
- `obstacles`: Array of `{ x, topHeight, bottomHeight, gap, passed, kind: 'cairo_tower' | 'minaret' | 'obelisk' }`
- `collectibles`: Array of `{ x, y, type: 'coin' | 'koshary', collected: boolean, bobPhase }`
- `particles`: Array of `{ x, y, vx, vy, alpha, size, color, life }`
- `audioEngine`: Clean browser audio synthesis context with master volume control.
