/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  Collectible,
  FloatingText,
  Obstacle,
  Particle,
  PigeonState,
} from './gameTypes';

export class GameRenderer {
  // Static hieroglyphic symbols for obelisks
  private static readonly HIEROGLYPHS = ['𓀀', '𓃭', '𓄿', '𓅓', '𓆓', '𓆣', '𓇳', '𓋹', '𓊽', '𓌃'];

  // Sky and atmospheric drawing with dynamic Cairo day/sunset/night progression
  public static drawBackground(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    scrollX: number,
    score: number
  ) {
    const groundHeight = 80;
    const skyHeight = height - groundHeight;

    // Progression: 0-14 Golden Hour, 15-29 Cairo Twilight, 30+ Starry Nile Night
    const timeFactor = Math.min(score / 35, 1);

    // 1. Sky Gradient
    const skyGrad = ctx.createLinearGradient(0, 0, 0, skyHeight);
    if (timeFactor < 0.45) {
      // Golden Hour Cairo Afternoon
      const sub = timeFactor / 0.45;
      skyGrad.addColorStop(0, this.interpolateColor('#38BDF8', '#D97706', sub));
      skyGrad.addColorStop(0.55, this.interpolateColor('#FDE047', '#F59E0B', sub));
      skyGrad.addColorStop(1, this.interpolateColor('#FEF08A', '#F97316', sub));
    } else if (timeFactor < 0.85) {
      // Cairo Sunset & Twilight
      const sub = (timeFactor - 0.45) / 0.4;
      skyGrad.addColorStop(0, this.interpolateColor('#D97706', '#431407', sub));
      skyGrad.addColorStop(0.5, this.interpolateColor('#EA580C', '#701A75', sub));
      skyGrad.addColorStop(1, this.interpolateColor('#F59E0B', '#1E1B4B', sub));
    } else {
      // Starry Egyptian Night
      const sub = (timeFactor - 0.85) / 0.15;
      skyGrad.addColorStop(0, this.interpolateColor('#431407', '#090D16', sub));
      skyGrad.addColorStop(0.6, this.interpolateColor('#701A75', '#0F172A', sub));
      skyGrad.addColorStop(1, this.interpolateColor('#1E1B4B', '#1E293B', sub));
    }

    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, width, skyHeight);

    // 2. Stars & Moon (appear during dusk and night)
    if (timeFactor > 0.4) {
      const nightAlpha = Math.min((timeFactor - 0.4) / 0.45, 1);
      ctx.save();
      ctx.globalAlpha = nightAlpha;

      // Draw starry sky
      ctx.fillStyle = '#FFFFFF';
      for (let i = 0; i < 45; i++) {
        const starX = (i * 97 + (scrollX * 0.02)) % width;
        const starY = (i * 37) % (skyHeight * 0.65);
        const starSize = (i % 3 === 0) ? 2 : 1.2;
        const twinkle = Math.sin(Date.now() * 0.003 + i) * 0.4 + 0.6;
        ctx.globalAlpha = nightAlpha * twinkle;
        ctx.beginPath();
        ctx.arc(starX, starY, starSize, 0, Math.PI * 2);
        ctx.fill();
      }

      // Draw Egyptian Crescent Moon (Hilal)
      const moonX = width * 0.82;
      const moonY = skyHeight * 0.22;
      ctx.globalAlpha = nightAlpha * 0.95;

      ctx.fillStyle = '#FEF08A';
      ctx.beginPath();
      ctx.arc(moonX, moonY, 18, 0, Math.PI * 2);
      ctx.fill();

      // Mask to create crescent
      ctx.fillStyle = skyGrad;
      ctx.beginPath();
      ctx.arc(moonX + 7, moonY - 4, 16, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    } else {
      // Golden Cairo Sun
      ctx.save();
      const sunX = width * 0.8;
      const sunY = skyHeight * 0.25;
      const sunGlow = ctx.createRadialGradient(sunX, sunY, 10, sunX, sunY, 65);
      sunGlow.addColorStop(0, 'rgba(254, 240, 138, 0.9)');
      sunGlow.addColorStop(0.4, 'rgba(245, 158, 11, 0.4)');
      sunGlow.addColorStop(1, 'rgba(245, 158, 11, 0)');
      ctx.fillStyle = sunGlow;
      ctx.beginPath();
      ctx.arc(sunX, sunY, 65, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#FEF08A';
      ctx.beginPath();
      ctx.arc(sunX, sunY, 18, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // 3. Far Parallax Layer: Silhouettes of the Great Pyramids of Giza
    ctx.save();
    const pyrScroll = (scrollX * 0.08) % (width * 1.5);
    const pyrBaseY = skyHeight - 45;
    const pyrColor = timeFactor < 0.6 ? 'rgba(180, 83, 9, 0.35)' : 'rgba(30, 41, 59, 0.6)';
    ctx.fillStyle = pyrColor;

    for (let offset = -width; offset < width * 2; offset += width * 1.5) {
      const baseX = offset - pyrScroll;

      // Great Pyramid of Khufu
      ctx.beginPath();
      ctx.moveTo(baseX + 120, pyrBaseY);
      ctx.lineTo(baseX + 220, pyrBaseY - 105);
      ctx.lineTo(baseX + 320, pyrBaseY);
      ctx.closePath();
      ctx.fill();

      // Pyramid of Khafre
      ctx.beginPath();
      ctx.moveTo(baseX + 280, pyrBaseY);
      ctx.lineTo(baseX + 375, pyrBaseY - 95);
      ctx.lineTo(baseX + 470, pyrBaseY);
      ctx.closePath();
      ctx.fill();

      // Pyramid of Menkaure
      ctx.beginPath();
      ctx.moveTo(baseX + 440, pyrBaseY);
      ctx.lineTo(baseX + 500, pyrBaseY - 60);
      ctx.lineTo(baseX + 560, pyrBaseY);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();

    // 4. Mid Parallax Layer: Cairo Old Skyline (Domes, Minarets & Pigeon Gheyas)
    ctx.save();
    const cityScroll = (scrollX * 0.2) % 400;
    const cityBaseY = skyHeight - 20;
    const cityColor = timeFactor < 0.6 ? '#92400E' : '#1E293B';
    ctx.fillStyle = cityColor;

    for (let cx = -cityScroll - 200; cx < width + 400; cx += 380) {
      // Mosque Dome
      ctx.beginPath();
      ctx.arc(cx + 90, cityBaseY, 32, Math.PI, 0);
      ctx.fill();

      // Distant slender minaret
      ctx.fillRect(cx + 130, cityBaseY - 90, 10, 90);
      ctx.beginPath();
      ctx.moveTo(cx + 130, cityBaseY - 90);
      ctx.lineTo(cx + 135, cityBaseY - 110);
      ctx.lineTo(cx + 140, cityBaseY - 90);
      ctx.fill();

      // Cairo Wooden Pigeon Dovecote Tower (Gheya)
      ctx.fillStyle = timeFactor < 0.6 ? '#78350F' : '#0F172A';
      ctx.fillRect(cx + 220, cityBaseY - 75, 45, 75);
      // Lattice struts
      ctx.strokeStyle = timeFactor < 0.6 ? '#B45309' : '#334155';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(cx + 220, cityBaseY - 75);
      ctx.lineTo(cx + 265, cityBaseY);
      ctx.moveTo(cx + 265, cityBaseY - 75);
      ctx.lineTo(cx + 220, cityBaseY);
      ctx.stroke();

      ctx.fillStyle = cityColor; // Reset fill
    }
    ctx.restore();

    // 5. River Nile Shimmer Strip with Felucca Sailboat
    ctx.save();
    const nileY = skyHeight - 28;
    const nileGrad = ctx.createLinearGradient(0, nileY, 0, skyHeight);
    nileGrad.addColorStop(0, timeFactor < 0.6 ? '#0284C7' : '#0F172A');
    nileGrad.addColorStop(1, timeFactor < 0.6 ? '#0369A1' : '#020617');
    ctx.fillStyle = nileGrad;
    ctx.fillRect(0, nileY, width, 28);

    // Water ripple reflections
    ctx.fillStyle = timeFactor < 0.6 ? 'rgba(254, 240, 138, 0.4)' : 'rgba(148, 163, 184, 0.2)';
    for (let r = 0; r < 6; r++) {
      const ripX = ((scrollX * 0.4) + r * 110) % width;
      ctx.fillRect(ripX, nileY + 8 + (r % 3) * 6, 35, 2);
    }

    // Felucca Boat gently gliding on the Nile
    const feluccaX = (width * 0.35 - (scrollX * 0.05)) % (width + 120);
    const fx = feluccaX < -60 ? width + 60 : feluccaX;
    const fy = nileY + 12;
    const boatBob = Math.sin(Date.now() * 0.002) * 2;

    // Wooden hull
    ctx.fillStyle = '#451A03';
    ctx.beginPath();
    ctx.moveTo(fx - 18, fy + boatBob);
    ctx.lineTo(fx + 22, fy + boatBob);
    ctx.lineTo(fx + 16, fy + 7 + boatBob);
    ctx.lineTo(fx - 12, fy + 7 + boatBob);
    ctx.closePath();
    ctx.fill();

    // Slender wooden mast
    ctx.strokeStyle = '#78350F';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(fx - 2, fy + boatBob);
    ctx.lineTo(fx - 4, fy - 22 + boatBob);
    ctx.stroke();

    // Iconic triangular white sail
    ctx.fillStyle = '#F8FAFC';
    ctx.beginPath();
    ctx.moveTo(fx - 4, fy - 24 + boatBob);
    ctx.lineTo(fx + 16, fy - 4 + boatBob);
    ctx.lineTo(fx - 2, fy - 3 + boatBob);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // 6. Forefront Rooftop Parapet (The Ground)
    this.drawRooftopGround(ctx, width, height, groundHeight, scrollX);
  }

  // Draw the forefront Cairo rooftop with terracotta ledge and water jugs (Qulla)
  private static drawRooftopGround(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    groundHeight: number,
    scrollX: number
  ) {
    const groundY = height - groundHeight;

    // Rooftop sandstone wall
    const wallGrad = ctx.createLinearGradient(0, groundY, 0, height);
    wallGrad.addColorStop(0, '#D97706'); // Warm sand stone
    wallGrad.addColorStop(0.2, '#B45309');
    wallGrad.addColorStop(1, '#78350F');
    ctx.fillStyle = wallGrad;
    ctx.fillRect(0, groundY, width, groundHeight);

    // Decorative Islamic parapet crenellations / tile pattern
    const tileW = 32;
    const tileOffset = (scrollX * 0.9) % tileW;

    ctx.fillStyle = '#92400E';
    for (let x = -tileOffset; x < width + tileW; x += tileW) {
      // Crenellation notch
      ctx.fillRect(x, groundY, tileW * 0.55, 10);
      // Mortar hairline lines
      ctx.fillStyle = '#78350F';
      ctx.fillRect(x, groundY + 12, tileW, 2);
      ctx.fillRect(x, groundY + 32, tileW, 2);
      ctx.fillRect(x, groundY + 54, tileW, 2);
      ctx.fillStyle = '#92400E';
    }

    // Top gold coping line
    ctx.fillStyle = '#FBBF24';
    ctx.fillRect(0, groundY, width, 3);

    // Traditional Egyptian clay water jars (Qulla) on rooftop ledge
    const jugSpacing = 280;
    const jugScroll = (scrollX * 0.9) % jugSpacing;
    for (let jx = width - jugScroll; jx > -60; jx -= jugSpacing) {
      this.drawClayJar(ctx, jx, groundY - 2);
    }
  }

  // Draw traditional clay water pot (Qulla)
  private static drawClayJar(ctx: CanvasRenderingContext2D, x: number, y: number) {
    ctx.save();
    ctx.fillStyle = '#C2410C'; // Terracotta clay
    // Body bulb
    ctx.beginPath();
    ctx.arc(x, y - 10, 8, 0, Math.PI * 2);
    ctx.fill();
    // Neck
    ctx.fillRect(x - 3, y - 22, 6, 12);
    // Flared rim
    ctx.fillRect(x - 5, y - 24, 10, 3);
    // Base
    ctx.fillRect(x - 4, y - 2, 8, 2);
    // Highlight
    ctx.fillStyle = 'rgba(254, 215, 170, 0.4)';
    ctx.beginPath();
    ctx.arc(x - 2, y - 11, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // Draw Cairo architectural obstacles: Cairo Tower, Historic Minaret, Ancient Obelisk
  public static drawObstacle(
    ctx: CanvasRenderingContext2D,
    obs: Obstacle,
    canvasH: number
  ) {
    const groundH = 80;
    const playH = canvasH - groundH;

    switch (obs.type) {
      case 'cairo_tower':
        this.drawCairoTowerPillars(ctx, obs, playH);
        break;
      case 'minaret':
        this.drawMinaretPillars(ctx, obs, playH);
        break;
      case 'obelisk':
        this.drawObeliskPillars(ctx, obs, playH);
        break;
    }
  }

  // A. Cairo Tower Style Obstacle (Burg Al-Qahirah)
  private static drawCairoTowerPillars(
    ctx: CanvasRenderingContext2D,
    obs: Obstacle,
    _playH: number
  ) {
    const { x, width, topHeight, bottomHeight, gap } = obs;
    const bottomY = topHeight + gap;

    // Color gradient for the lattice tower
    const towerGrad = ctx.createLinearGradient(x, 0, x + width, 0);
    towerGrad.addColorStop(0, '#D97706');
    towerGrad.addColorStop(0.5, '#F59E0B');
    towerGrad.addColorStop(1, '#B45309');

    // 1. Top Obstacle (inverted tower descending)
    ctx.fillStyle = towerGrad;
    ctx.fillRect(x, 0, width, topHeight);

    // Lattice openwork criss-cross lines
    this.drawLatticeWork(ctx, x, 0, width, topHeight);

    // Cairo Tower lotus blossom cap at the bottom of the top pillar
    ctx.fillStyle = '#78350F';
    ctx.fillRect(x - 6, topHeight - 16, width + 12, 16);
    // Lotus petals cap
    ctx.fillStyle = '#F59E0B';
    ctx.beginPath();
    ctx.moveTo(x - 6, topHeight - 16);
    ctx.lineTo(x + width * 0.5, topHeight + 2);
    ctx.lineTo(x + width + 6, topHeight - 16);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#451A03';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // 2. Bottom Obstacle (tower ascending from ground)
    ctx.fillStyle = towerGrad;
    ctx.fillRect(x, bottomY, width, bottomHeight);

    this.drawLatticeWork(ctx, x, bottomY, width, bottomHeight);

    // Observation deck ring at the top of bottom pillar
    ctx.fillStyle = '#78350F';
    ctx.fillRect(x - 8, bottomY, width + 16, 18);
    // Circular viewing windows
    ctx.fillStyle = '#FEF08A';
    for (let wx = x - 4; wx < x + width + 4; wx += 10) {
      ctx.fillRect(wx, bottomY + 4, 5, 10);
    }
    // Border rim
    ctx.fillStyle = '#FBBF24';
    ctx.fillRect(x - 10, bottomY + 18, width + 20, 4);
  }

  // Draw criss-cross diamond lattice pattern representing Cairo Tower's facade
  private static drawLatticeWork(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number
  ) {
    ctx.save();
    ctx.beginPath();
    ctx.rect(x, y, width, height);
    ctx.clip();

    ctx.strokeStyle = 'rgba(120, 53, 15, 0.45)';
    ctx.lineWidth = 2;

    const step = 20;
    // Diagonal 1
    for (let ly = y - width; ly < y + height + width; ly += step) {
      ctx.beginPath();
      ctx.moveTo(x, ly);
      ctx.lineTo(x + width, ly + width);
      ctx.stroke();
    }
    // Diagonal 2
    for (let ly = y - width; ly < y + height + width; ly += step) {
      ctx.beginPath();
      ctx.moveTo(x + width, ly);
      ctx.lineTo(x, ly + width);
      ctx.stroke();
    }

    ctx.restore();
  }

  // B. Historic Islamic Minaret Style Obstacle
  private static drawMinaretPillars(
    ctx: CanvasRenderingContext2D,
    obs: Obstacle,
    _playH: number
  ) {
    const { x, width, topHeight, bottomHeight, gap } = obs;
    const bottomY = topHeight + gap;

    const minaretGrad = ctx.createLinearGradient(x, 0, x + width, 0);
    minaretGrad.addColorStop(0, '#E5E7EB'); // Light sandstone
    minaretGrad.addColorStop(0.3, '#F3F4F6');
    minaretGrad.addColorStop(0.8, '#D1D5DB');
    minaretGrad.addColorStop(1, '#9CA3AF');

    // 1. Top Obstacle (hanging minaret lantern)
    ctx.fillStyle = minaretGrad;
    ctx.fillRect(x + 4, 0, width - 8, topHeight - 20);

    // Arched niches
    ctx.fillStyle = '#4B5563';
    for (let ny = 30; ny < topHeight - 35; ny += 45) {
      ctx.beginPath();
      ctx.arc(x + width * 0.5, ny, 7, Math.PI, 0);
      ctx.lineTo(x + width * 0.5 + 7, ny + 16);
      ctx.lineTo(x + width * 0.5 - 7, ny + 16);
      ctx.closePath();
      ctx.fill();
    }

    // Minaret Balcony with Muqarnas corbelling
    ctx.fillStyle = '#6B7280';
    ctx.fillRect(x - 6, topHeight - 22, width + 12, 10);
    // Carved mashrabiya railing
    ctx.fillStyle = '#D97706';
    ctx.fillRect(x - 6, topHeight - 22, width + 12, 3);

    // Inverted finial dome & golden crescent
    ctx.fillStyle = '#F59E0B';
    ctx.beginPath();
    ctx.moveTo(x - 4, topHeight - 12);
    ctx.lineTo(x + width * 0.5, topHeight + 4);
    ctx.lineTo(x + width + 4, topHeight - 12);
    ctx.closePath();
    ctx.fill();

    // 2. Bottom Obstacle (ascending minaret)
    ctx.fillStyle = minaretGrad;
    ctx.fillRect(x + 4, bottomY + 20, width - 8, bottomHeight - 20);

    // Balcony ring at gap edge
    ctx.fillStyle = '#4B5563';
    ctx.fillRect(x - 8, bottomY + 6, width + 16, 14);
    // Golden railing
    ctx.fillStyle = '#F59E0B';
    ctx.fillRect(x - 8, bottomY, width + 16, 6);

    // Vertical colonnettes
    ctx.fillStyle = '#374151';
    for (let cx = x - 4; cx < x + width + 4; cx += 8) {
      ctx.fillRect(cx, bottomY + 2, 2, 8);
    }

    // Lower arched carved windows
    ctx.fillStyle = '#374151';
    for (let my = bottomY + 40; my < bottomY + bottomHeight - 20; my += 50) {
      ctx.beginPath();
      ctx.arc(x + width * 0.5, my, 8, Math.PI, 0);
      ctx.lineTo(x + width * 0.5 + 8, my + 20);
      ctx.lineTo(x + width * 0.5 - 8, my + 20);
      ctx.closePath();
      ctx.fill();
    }
  }

  // C. Ancient Pharaonic Granite Obelisk Style Obstacle
  private static drawObeliskPillars(
    ctx: CanvasRenderingContext2D,
    obs: Obstacle,
    _playH: number
  ) {
    const { x, width, topHeight, bottomHeight, gap, hieroglyphSeed } = obs;
    const bottomY = topHeight + gap;

    // Red granite stone gradient
    const stoneGrad = ctx.createLinearGradient(x, 0, x + width, 0);
    stoneGrad.addColorStop(0, '#991B1B');
    stoneGrad.addColorStop(0.4, '#DC2626');
    stoneGrad.addColorStop(0.8, '#B91C1C');
    stoneGrad.addColorStop(1, '#7F1D1D');

    // 1. Top Obelisk (hanging pillar with golden pyramidion pointing down)
    ctx.fillStyle = stoneGrad;
    ctx.beginPath();
    ctx.moveTo(x + 5, 0);
    ctx.lineTo(x + width - 5, 0);
    ctx.lineTo(x + width - 3, topHeight - 20);
    ctx.lineTo(x + 3, topHeight - 20);
    ctx.closePath();
    ctx.fill();

    // Hieroglyphs on top pillar
    this.drawHieroglyphs(ctx, x, 0, width, topHeight - 25, hieroglyphSeed);

    // Gilded Golden Benben (Pyramidion Cap) pointing down
    const topGoldGrad = ctx.createLinearGradient(x, topHeight - 20, x + width, topHeight);
    topGoldGrad.addColorStop(0, '#FEF08A');
    topGoldGrad.addColorStop(0.5, '#F59E0B');
    topGoldGrad.addColorStop(1, '#D97706');
    ctx.fillStyle = topGoldGrad;
    ctx.beginPath();
    ctx.moveTo(x + 3, topHeight - 20);
    ctx.lineTo(x + width * 0.5, topHeight + 2);
    ctx.lineTo(x + width - 3, topHeight - 20);
    ctx.closePath();
    ctx.fill();

    // 2. Bottom Obelisk (ground pillar with golden pyramidion cap on top)
    ctx.fillStyle = stoneGrad;
    ctx.beginPath();
    ctx.moveTo(x + 3, bottomY + 22);
    ctx.lineTo(x + width - 3, bottomY + 22);
    ctx.lineTo(x + width + 2, bottomY + bottomHeight);
    ctx.lineTo(x - 2, bottomY + bottomHeight);
    ctx.closePath();
    ctx.fill();

    // Hieroglyphs on bottom pillar
    this.drawHieroglyphs(ctx, x, bottomY + 30, width, bottomHeight - 30, hieroglyphSeed + 5);

    // Gilded Golden Benben Cap pointing up
    const botGoldGrad = ctx.createLinearGradient(x, bottomY, x + width, bottomY + 22);
    botGoldGrad.addColorStop(0, '#FEF08A');
    botGoldGrad.addColorStop(0.5, '#F59E0B');
    botGoldGrad.addColorStop(1, '#D97706');
    ctx.fillStyle = botGoldGrad;
    ctx.beginPath();
    ctx.moveTo(x + width * 0.5, bottomY - 2);
    ctx.lineTo(x + width - 3, bottomY + 22);
    ctx.lineTo(x + 3, bottomY + 22);
    ctx.closePath();
    ctx.fill();
  }

  // Draw ancient hieroglyphs etched down an obelisk
  private static drawHieroglyphs(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    seed: number
  ) {
    ctx.save();
    ctx.fillStyle = 'rgba(254, 240, 138, 0.45)';
    ctx.font = '14px serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const count = Math.floor(height / 28);
    for (let i = 0; i < count; i++) {
      const charIdx = (seed + i * 3) % this.HIEROGLYPHS.length;
      const char = this.HIEROGLYPHS[charIdx];
      const cy = y + 16 + i * 28;
      ctx.fillText(char, x + width * 0.5, cy);
    }
    ctx.restore();
  }

  // Draw Zagloul: Cairo Rooftop Pigeon with jauntily placed Tarboosh (Fez)
  public static drawPigeon(ctx: CanvasRenderingContext2D, pigeon: PigeonState) {
    const { x, y, rotation, flapPhase, tasselAngle, kosharyBoostTimer } = pigeon;

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rotation);

    // Invulnerability flashing effect
    if (pigeon.invulnerabilityTimer > 0 && Math.floor(Date.now() / 90) % 2 === 0) {
      ctx.globalAlpha = 0.4;
    }

    // 1. Koshary Spicy Boost Aura (fiery halo and chili sparks)
    if (kosharyBoostTimer > 0) {
      const pulse = Math.sin(Date.now() * 0.015) * 4;
      const flameGrad = ctx.createRadialGradient(0, 0, 15, 0, 0, 36 + pulse);
      flameGrad.addColorStop(0, 'rgba(239, 68, 68, 0.7)');
      flameGrad.addColorStop(0.6, 'rgba(245, 158, 11, 0.4)');
      flameGrad.addColorStop(1, 'rgba(245, 158, 11, 0)');
      ctx.fillStyle = flameGrad;
      ctx.beginPath();
      ctx.arc(0, 0, 36 + pulse, 0, Math.PI * 2);
      ctx.fill();
    } else if (pigeon.featherShields > 0) {
      // Protective Blue/Cyan Feather Shield Aura
      const pulse = Math.sin(Date.now() * 0.008) * 3;
      ctx.save();
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.75)';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 4]);
      ctx.beginPath();
      ctx.arc(2, -2, 28 + pulse, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    // 2. Tail Feathers (slate grey with black tipped bands)
    ctx.fillStyle = '#475569';
    ctx.beginPath();
    ctx.moveTo(-16, 2);
    ctx.lineTo(-32, -4);
    ctx.lineTo(-34, 4);
    ctx.lineTo(-28, 12);
    ctx.closePath();
    ctx.fill();

    // Black tail bar
    ctx.fillStyle = '#0F172A';
    ctx.beginPath();
    ctx.moveTo(-28, -2);
    ctx.lineTo(-34, -4);
    ctx.lineTo(-32, 10);
    ctx.lineTo(-26, 8);
    ctx.closePath();
    ctx.fill();

    // 3. Tucked coral pink feet
    ctx.strokeStyle = '#F43F5E';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(-4, 15);
    ctx.lineTo(-10, 20);
    ctx.moveTo(2, 15);
    ctx.lineTo(-4, 21);
    ctx.stroke();

    // 4. Plump Pigeon Body (soft gradient: ash grey to pearl white belly)
    const bodyGrad = ctx.createRadialGradient(2, 0, 4, 0, 2, 22);
    bodyGrad.addColorStop(0, '#CBD5E1'); // Pearl slate
    bodyGrad.addColorStop(0.6, '#94A3B8');
    bodyGrad.addColorStop(1, '#64748B'); // Ash grey

    ctx.fillStyle = bodyGrad;
    ctx.beginPath();
    ctx.ellipse(0, 4, 20, 16, 0.1, 0, Math.PI * 2);
    ctx.fill();

    // 5. Iridescent Green & Purple Neck Feathers (distinctive Cairo pigeon collar)
    const neckGrad = ctx.createLinearGradient(6, -8, 16, 2);
    neckGrad.addColorStop(0, '#10B981'); // Emerald
    neckGrad.addColorStop(0.5, '#8B5CF6'); // Purple iridescence
    neckGrad.addColorStop(1, '#06B6D4'); // Cyan sheen
    ctx.fillStyle = neckGrad;
    ctx.beginPath();
    ctx.ellipse(10, -2, 9, 8, -0.2, 0, Math.PI * 2);
    ctx.fill();

    // 6. Pigeon Head
    ctx.fillStyle = '#94A3B8';
    ctx.beginPath();
    ctx.arc(14, -8, 11, 0, Math.PI * 2);
    ctx.fill();

    // 7. Beak with white fleshy cere
    // Amber beak
    ctx.fillStyle = '#F59E0B';
    ctx.beginPath();
    ctx.moveTo(22, -9);
    ctx.lineTo(31, -6);
    ctx.lineTo(21, -3);
    ctx.closePath();
    ctx.fill();
    // White cere on top of beak
    ctx.fillStyle = '#F8FAFC';
    ctx.beginPath();
    ctx.arc(22, -8, 2.5, 0, Math.PI * 2);
    ctx.fill();

    // 8. Curious Eye
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(16, -10, 4.5, 0, Math.PI * 2);
    ctx.fill();
    // Dark pupil
    ctx.fillStyle = '#0F172A';
    ctx.beginPath();
    ctx.arc(17.5, -10, 2.2, 0, Math.PI * 2);
    ctx.fill();
    // Eye specular glint
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(18.5, -11, 1, 0, Math.PI * 2);
    ctx.fill();

    // 9. Articulated Flapping Wing
    // Wing wing flap calculation based on flapPhase
    const wingAngle = Math.sin(flapPhase) * 0.75 - 0.2;
    ctx.save();
    ctx.translate(-4, 0);
    ctx.rotate(wingAngle);

    // Main wing body
    ctx.fillStyle = '#64748B';
    ctx.beginPath();
    ctx.ellipse(0, -2, 16, 11, 0.3, 0, Math.PI * 2);
    ctx.fill();

    // Two crisp black wing bars (classic rock pigeon plumage)
    ctx.fillStyle = '#1E293B';
    ctx.fillRect(-6, -4, 12, 3);
    ctx.fillRect(-8, 1, 14, 3);

    // Wing primary feathers tips
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1.5;
    for (let f = -12; f <= 8; f += 5) {
      ctx.beginPath();
      ctx.moveTo(f, 4);
      ctx.lineTo(f - 6, 15);
      ctx.stroke();
    }
    ctx.restore();

    // 10. THE CAIRO TARBOOSH (FEZ)!
    // Positioned proudly on pigeon head
    ctx.save();
    ctx.translate(12, -18);

    // Jaunty Fez tilt
    ctx.rotate(-0.1);

    // Dark red felt cylinder body (truncated cone)
    const fezGrad = ctx.createLinearGradient(-7, -14, 7, 0);
    fezGrad.addColorStop(0, '#DC2626'); // Egyptian crimson red
    fezGrad.addColorStop(0.6, '#B91C1C');
    fezGrad.addColorStop(1, '#991B1B');

    ctx.fillStyle = fezGrad;
    ctx.beginPath();
    ctx.moveTo(-7, 0); // Bottom left
    ctx.lineTo(7, 0); // Bottom right
    ctx.lineTo(5, -13); // Top right
    ctx.lineTo(-5, -13); // Top left
    ctx.closePath();
    ctx.fill();

    // Black headband rim
    ctx.fillStyle = '#0F172A';
    ctx.fillRect(-7.5, -1.5, 15, 2.5);

    // Top gold/black button
    ctx.fillStyle = '#171717';
    ctx.beginPath();
    ctx.arc(0, -13, 2, 0, Math.PI * 2);
    ctx.fill();

    // Swaying Silk Tassel (Trailing physics reacting to movement)
    ctx.strokeStyle = '#0F172A';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, -13);
    // Dynamic tassel curve based on tasselAngle
    const tasselTipX = -10 + Math.sin(tasselAngle) * 6;
    const tasselTipY = 4 + Math.cos(tasselAngle) * 4;
    ctx.quadraticCurveTo(-4, -6, tasselTipX, tasselTipY);
    ctx.stroke();

    // Tassel silk bundle fringe
    ctx.fillStyle = '#0F172A';
    ctx.beginPath();
    ctx.arc(tasselTipX, tasselTipY, 2.8, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();

    ctx.restore();
  }

  // Draw Collectibles: Egyptian Piastre Coin or Spicy Koshary Bowl
  public static drawCollectible(ctx: CanvasRenderingContext2D, c: Collectible) {
    if (c.collected) return;

    const { x, y, type, rotation, bobPhase } = c;
    const bobY = y + Math.sin(bobPhase) * 5;

    ctx.save();
    ctx.translate(x, bobY);

    if (type === 'coin') {
      // Golden Piastre Coin with 3D rotation effect
      const scaleX = Math.cos(rotation);
      ctx.scale(Math.abs(scaleX) < 0.1 ? 0.1 : scaleX, 1);

      // Outer gold rim
      const coinGrad = ctx.createLinearGradient(-13, -13, 13, 13);
      coinGrad.addColorStop(0, '#FEF08A');
      coinGrad.addColorStop(0.5, '#F59E0B');
      coinGrad.addColorStop(1, '#B45309');
      ctx.fillStyle = coinGrad;
      ctx.beginPath();
      ctx.arc(0, 0, 13, 0, Math.PI * 2);
      ctx.fill();

      // Inner ring
      ctx.strokeStyle = '#78350F';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.arc(0, 0, 9.5, 0, Math.PI * 2);
      ctx.stroke();

      // Egyptian Ankh / Star symbol on coin face
      ctx.fillStyle = '#78350F';
      ctx.font = 'bold 10px serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('☥', 0, 0);

      // Gleam highlight
      ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
      ctx.beginPath();
      ctx.arc(-4, -4, 3, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // Spicy Koshary Bowl Power-up
      // 1. Ceramic bowl
      ctx.fillStyle = '#C2410C';
      ctx.beginPath();
      ctx.ellipse(0, 3, 14, 9, 0, 0, Math.PI);
      ctx.fill();

      // Bowl rim
      ctx.fillStyle = '#EA580C';
      ctx.beginPath();
      ctx.ellipse(0, 3, 14, 4, 0, 0, Math.PI * 2);
      ctx.fill();

      // Koshary contents: Rice, lentils, macaroni
      ctx.fillStyle = '#FEF08A';
      ctx.beginPath();
      ctx.ellipse(0, 1, 12, 3.5, 0, 0, Math.PI * 2);
      ctx.fill();

      // Brown lentils & fried onions
      ctx.fillStyle = '#78350F';
      ctx.fillRect(-5, -1, 3, 2);
      ctx.fillRect(2, 0, 4, 2);
      ctx.fillRect(-2, 2, 3, 1.5);

      // Red chili shatta sauce splash!
      ctx.fillStyle = '#EF4444';
      ctx.beginPath();
      ctx.arc(0, 1, 3.5, 0, Math.PI * 2);
      ctx.fill();

      // Rising fragrant steam wisps
      const steamShift = Math.sin(Date.now() * 0.005) * 2;
      ctx.strokeStyle = 'rgba(254, 240, 138, 0.6)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(-4, -4);
      ctx.quadraticCurveTo(-6 + steamShift, -11, -3 + steamShift, -16);
      ctx.moveTo(3, -4);
      ctx.quadraticCurveTo(5 - steamShift, -11, 2 - steamShift, -16);
      ctx.stroke();

      // Pulsing glow around bowl
      const glow = Math.sin(Date.now() * 0.01) * 3;
      ctx.strokeStyle = 'rgba(239, 68, 68, 0.7)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, 16 + glow, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.restore();
  }

  // Draw particle system (feathers, sparkles, chili smoke, dust)
  public static drawParticles(ctx: CanvasRenderingContext2D, particles: Particle[]) {
    ctx.save();
    for (const p of particles) {
      ctx.globalAlpha = p.alpha;
      ctx.fillStyle = p.color;

      if (p.shape === 'feather') {
        // Floating little pigeon feather
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.life * 5);
        ctx.beginPath();
        ctx.ellipse(0, 0, p.size * 2, p.size, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      } else if (p.shape === 'sparkle') {
        // 4-point star sparkle
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.beginPath();
        for (let i = 0; i < 4; i++) {
          ctx.rotate(Math.PI / 2);
          ctx.lineTo(p.size * 2, 0);
          ctx.lineTo(p.size * 0.5, p.size * 0.5);
        }
        ctx.fill();
        ctx.restore();
      } else {
        // Circle dust or smoke
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.restore();
  }

  // Draw floating text popups (+1, +100, KOSHARY RUSH!)
  public static drawFloatingTexts(ctx: CanvasRenderingContext2D, texts: FloatingText[]) {
    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = 'bold 18px "Plus Jakarta Sans", system-ui, sans-serif';

    for (const t of texts) {
      const alpha = Math.max(0, t.life / t.maxLife);
      ctx.globalAlpha = alpha;
      ctx.fillStyle = t.color;
      // Subtle dark outline for high contrast
      ctx.strokeStyle = 'rgba(15, 23, 42, 0.8)';
      ctx.lineWidth = 3;
      ctx.strokeText(t.text, t.x, t.y);
      ctx.fillText(t.text, t.x, t.y);
    }
    ctx.restore();
  }

  // Helper color interpolator for sky transitions
  private static interpolateColor(color1: string, color2: string, factor: number): string {
    const c1 = this.hexToRgb(color1);
    const c2 = this.hexToRgb(color2);
    if (!c1 || !c2) return color1;

    const r = Math.round(c1.r + factor * (c2.r - c1.r));
    const g = Math.round(c1.g + factor * (c2.g - c1.g));
    const b = Math.round(c1.b + factor * (c2.b - c1.b));

    return `rgb(${r}, ${g}, ${b})`;
  }

  private static hexToRgb(hex: string): { r: number; g: number; b: number } | null {
    const cleanHex = hex.replace('#', '');
    if (cleanHex.length !== 6) return null;
    const bigint = parseInt(cleanHex, 16);
    return {
      r: (bigint >> 16) & 255,
      g: (bigint >> 8) & 255,
      b: bigint & 255,
    };
  }
}
