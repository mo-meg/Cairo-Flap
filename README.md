# Cairo Flap: Rooftop Pigeon Odyssey 🕊️🇪🇬

A vibrant, Cairo-themed Flappy Bird arcade game built with **React 19**, **TypeScript**, **HTML5 Canvas**, and **Tailwind CSS**.

Take flight as **Zagloul**, a dapper Cairo rooftop pigeon (*Hamam*) sporting a jaunty red felt **Tarboosh (fez)** with a dynamic silk tassel, soaring past iconic Egyptian monuments along the shimmering River Nile!

---

## 🌟 Features

- **Iconic Cairo Architectural Obstacles**:
  - **Cairo Tower (*Burg Al-Qāhirah*)**: The 187-meter landmark with openwork wickerwork lotus lattice and viewing deck.
  - **Historic Islamic Minarets**: Sandstone Mamluk/Fatimid octagonal shafts with carved arched niches, muqarnas balconies, and golden crescent finials (*hilal*).
  - **Ancient Pharaonic Obelisks**: Red granite pillars etched with authentic hieroglyphs and topped with gleaming gilded *benben* pyramidions.
- **Atmospheric Parallax Egyptian Sky**:
  - Shifting time-of-day progression transitioning from Golden Hour Amber through Nile Twilight to a Starry Egyptian Night as your score climbs.
  - Distant silhouettes of the Great Pyramids of Giza (Khufu, Khafre, Menkaure).
  - Silhouetted Citadel domes and Cairo rooftop wooden pigeon dovecote towers (*Gheyat El-Hamam*).
  - Flowing River Nile with soft wave ripples and a silhouetted white-sailed Felucca boat.
- **Collectibles & Power-Ups**:
  - **🪙 Golden Piastres (Egyptian Coins)**: Hovering in obstacle gaps for +100 bonus points and melodic oud double-plucks.
  - **🍲 Spicy Koshary Bowls**: Rare Egyptian culinary power-up granting a 6-second *Da'ah & Shatta* fiery speed frenzy (2X points, fiery trail, and shield recharge).
- **Relaxed, Accessible Physics**:
  - Extra-wide **230px gaps** (over 35% of screen height) for comfortable navigation.
  - Gentle float physics with floaty gravity (`0.22 px/frame²`) and gentle lift-offs.
  - **2 Protective Feather Shields** in Easy Nile Breeze mode that automatically absorb collisions with stone or ground.
  - Safe ceiling bounce (no instant crash from touching the top).
- **100% Procedural Web Audio API Synthesizer**:
  - Darbuka percussion flaps, oud melodic chimes, gentle pigeon coos, and an authentic descending oriental game-over cadence.
  - Zero external MP3/WAV dependencies; instant zero-latency playback.
- **Responsive Controls**:
  - Full desktop mouse click, touch tap, and keyboard (`Space`, `↑`, `W`) support.

---

## 🎮 How to Play

| Action | Control |
| :--- | :--- |
| **Flap / Jump** | `Spacebar`, `Up Arrow (↑)`, `W`, or **Click / Tap anywhere** |
| **Restart** | `Spacebar` or click **"Play Again"** |
| **Audio** | Click the speaker icon in the top right to mute / unmute |

---

## 🚀 Quick Start (Running Locally)

### Prerequisites

- [Node.js](https://nodejs.org/) (version 18 or higher recommended)
- `npm` (bundled with Node.js)

### 1. Install Dependencies

```bash
npm install
```

### 2. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your web browser.

### 3. Build for Production

```bash
npm run build
```

To preview the production build locally:

```bash
npm run preview
```

### 4. Type Checking & Linting

```bash
npm run lint
```

---

## 📂 Project Structure

```
├── src/
│   ├── App.tsx             # TopBar, state machine, HUD, overlays, and Cairo lore modals
│   ├── GameCanvas.tsx      # 60 FPS requestAnimationFrame loop, physics, collisions & inputs
│   ├── gameRenderer.ts     # High-precision Canvas 2D vector art (Pigeon, Cairo Tower, Obelisks, Nile)
│   ├── gameTypes.ts        # TypeScript interfaces for entities, obstacles, and game state
│   ├── audioEngine.ts      # Web Audio API synthesizer for Egyptian sound effects
│   ├── index.css           # Global Tailwind CSS and touch optimization styles
│   └── main.tsx            # React application entry point
├── index.html              # HTML5 entry with Plus Jakarta Sans typography & SEO tags
├── package.json            # Scripts and dependencies
└── tsconfig.json           # TypeScript configuration
```

---

## 🐙 Pushing to GitHub

To push this repository to your GitHub account:

### 1. Initialize Git and Make Initial Commit

```bash
git init
git add .
git commit -m "Initial commit: Cairo Flap - Rooftop Pigeon Odyssey"
```

### 2. Create a New Repository on GitHub
Go to [GitHub New Repository](https://github.com/new) and create a repository (e.g., `cairo-flap`).

### 3. Link Remote and Push

```bash
# Rename default branch to main
git branch -M main

# Add your GitHub repository as the origin remote (replace with your repo URL)
git remote add origin https://github.com/<YOUR_USERNAME>/cairo-flap.git

# Push the code
git push -u origin main
```

---

## 🇪🇬 Cairo Cultural Lore

- **The Rooftop Dovecotes (*Gheyat El-Hamam*)**: Across Cairo's rooftops, intricately built multi-story wooden towers house homing pigeons raised by devoted pigeon fanciers (*Ghawy Hamam*), who release them in swirling aerial ballets before sunset.
- **The Tarboosh (Fez)**: The iconic red felt cap with a dangling black silk tassel was the debonair national headwear for Egyptian intellectuals, artists, and gentlemen throughout the 19th and early 20th centuries.
- **Koshary**: Egypt's beloved national street food dish made of pasta, rice, lentils, chickpeas, and crispy fried onions, doused in garlic-vinegar *Da'ah* and fiery chili *Shatta* sauce!

---

## 📜 License

Apache-2.0
