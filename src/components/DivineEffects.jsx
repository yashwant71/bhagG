import React, { useEffect, useRef, useState } from 'react';

/**
 * DivineEffects Component
 * 
 * Handles canvas-based background stars, shooting stars (meteors),
 * and dynamic lens flares that follow Sanskrit text glyphs.
 * 
 * @param {Object} props
 * @param {boolean} props.active - Whether effects are enabled
 * @param {boolean} props.showFlares - Show lens flares on text
 * @param {boolean} props.showStars - Show background starfield
 * @param {boolean} props.showMeteors - Show shooting stars
 * @param {number} props.flareIntensity - Intensity of flares (0-1)
 * @param {number} props.starDensity - Number of stars (0-1)
 * @param {boolean} props.animationsComplete - Whether text animation is done
 */
const DivineEffects = ({
  active = true,
  showFlares = true,
  showStars = true,
  showMeteors = true,
  showFlowingStars = true,
  flareIntensity = 0.8,
  starDensity = 0.5,
  flareScale = 1.5,
  flareDensity = 0.45,
  flareOffsetX = 0,
  flareOffsetY = 0,
  animationsComplete = false
}) => {
  const bgCanvasRef = useRef(null);
  const flrCanvasRef = useRef(null);
  const offCanvasRef = useRef(null);
  const requestRef = useRef(null);
  const starsRef = useRef([]);
  const meteorsRef = useRef([]);
  const flaresRef = useRef([]);
  const frameCountRef = useRef(0);
  const lastResizeRef = useRef(0);

  // Constants - Matching reference HTML exactly
  const GOLD_BRIGHT = '#ffe580';
  const FONT_GOLD = '#ffe066';
  
  // Background gradient from reference
  const BG_STOP_0 = '#3d1e00';
  const BG_STOP_45 = '#1e0d00';
  const BG_STOP_100 = '#080300';

  // Initialize stars
  const initStars = (width, height) => {
    const count = Math.floor(380 * starDensity);
    const stars = [];
    for (let i = 0; i < count; i++) {
      stars.push({
        x: Math.random() * width,
        y: Math.random() * height,
        r: 0.2 + Math.random() * 1.4,
        phase: Math.random() * Math.PI * 2,
        speed: 0.3 + Math.random() * 1.7,
        warm: Math.random() > 0.5
      });
    }
    starsRef.current = stars;
  };

  // Build flares based on Sanskrit words in DOM
  const buildFlares = (width, height) => {
    if (!showFlares || !animationsComplete) {
      flaresRef.current = [];
      return;
    }

    const elements = document.querySelectorAll('.sanskrit-word');
    if (elements.length === 0) return;

    const newFlares = [];
    const offC = offCanvasRef.current;
    if (!offC) return;
    const offX = offC.getContext('2d', { willReadFrequently: true });

    elements.forEach((el, idx) => {
      const rect = el.getBoundingClientRect();
      const text = el.innerText;
      const styles = window.getComputedStyle(el);
      const fontSize = parseFloat(styles.fontSize);
      const fontName = styles.fontFamily;
      const fontWeight = styles.fontWeight || '700';
      
      // Only process words on screen
      if (rect.bottom < 0 || rect.top > height || rect.right < 0 || rect.left > width) return;

      // 1. Setup offscreen canvas for this specific word
      // We render with top-left alignment to find exactly where glyphs are relative to the top-left corner
      offX.font = `${fontWeight} ${fontSize}px ${fontName}`;
      const metrics = offX.measureText(text);
      const wordW = Math.ceil(metrics.width);
      const wordH = Math.ceil(fontSize * 1.5); // Safe height to capture ascenders/descenders
      
      const pad = 20; // Internal padding for scanning
      offC.width = Math.ceil(wordW + pad * 2);
      offC.height = Math.ceil(wordH + pad * 2);
      
      offX.clearRect(0, 0, offC.width, offC.height);
      offX.font = `${fontWeight} ${fontSize}px ${fontName}`;
      offX.textAlign = 'left';
      offX.textBaseline = 'top';
      offX.fillStyle = '#ffffff';
      offX.fillText(text, pad, pad);

      const { data, width: scanW, height: scanH } = offX.getImageData(0, 0, offC.width, offC.height);
      const THRESH = 200; // Peak selection threshold
      const candidates = [];

      // 2. Scan for specific peaks (top-most ink pixels)
      const stepSize = Math.max(1, Math.floor(wordW / 14));
      for (let x = pad; x < pad + wordW; x += stepSize) {
        for (let y = 0; y < scanH; y++) {
          const alphaIdx = (y * scanW + x) * 4 + 3;
          if (data[alphaIdx] > THRESH) {
            candidates.push({ x: x - pad, y: y - pad });
            break;
          }
        }
      }

      // 3. Selection: filter by distance from each other
      const minDist = fontSize * 0.45;
      const selected = [];
      for (const c of candidates) {
        if (!selected.some(p => Math.hypot(p.x - c.x, p.y - c.y) < minDist)) {
          selected.push(c);
        }
        if (selected.length >= 2) break;
      }

      // 4. Map to Screen:
      // Offset from span.left: text is centered, so (spanWidth - wordWidth) / 2
      const horizontalOffset = (rect.width - wordW) / 2 + flareOffsetX;
      
      // Vertical mapping: Aligning Canvas 'top' with DOM text 'top'
      const lineHeight = parseFloat(styles.lineHeight);
      const paddingTop = parseFloat(styles.paddingTop);
      const verticalPadding = (lineHeight - fontSize) / 2; // Distance from top of rect to top of glyph
      const verticalOffset = paddingTop + verticalPadding + flareOffsetY;

      // RANDOMIZED & STRATEGIC PLACEMENT: Start, Center, End + 40% Organic
      const isStart = idx === 0;
      const isEnd = idx === elements.length - 1;
      const isCenter = idx === Math.floor(elements.length / 2);
      const isOrganic = (Math.random() < (flareDensity || 0.40));
      
      const deservesFlare = isStart || isEnd || isCenter || isOrganic;
      
      if (deservesFlare && selected.length > 0) {
        // Pick one high-value peak for this word
        const pt = selected[Math.floor(Math.random() * selected.length)];
        
        newFlares.push({
          x: rect.left + horizontalOffset + pt.x,
          y: rect.top + verticalOffset + pt.y,
          size: fontSize * (0.13 + Math.random() * 0.1) * (flareIntensity || 1.0) * (flareScale || 1.5),
          baseOpacity: 0.6 + Math.random() * 0.4,
          phase: Math.random() * Math.PI * 2,
          rotSpeed: (Math.random() - 0.5) * 0.15,
          rot: Math.random() * Math.PI / 4,
          wordId: idx,
          startFrame: frameCountRef.current // For smooth fade-in
        });
      }
    });

    flaresRef.current = newFlares;
  };

  // Drawing helpers
  const drawStar = (ctx, s, t) => {
    const alpha = 0.08 + 0.9 * (0.5 + 0.5 * Math.sin(s.phase + t * s.speed));
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
    ctx.fillStyle = s.warm ? '#ffe599' : '#ffffff';
    ctx.globalAlpha = alpha;
    ctx.fill();
  };

  const drawMeteor = (ctx, m, width, height) => {
    m.life++;
    if (m.life > m.max) return false;

    const pr = m.life / m.max;
    const rad = m.ang * Math.PI / 180;
    const hx = m.x + m.len * pr * Math.cos(rad);
    const hy = m.y + m.len * pr * Math.sin(rad);
    const tx = m.x + m.len * Math.max(0, pr - 0.25) * Math.cos(rad);
    const ty = m.y + m.len * Math.max(0, pr - 0.25) * Math.sin(rad);

    const g = ctx.createLinearGradient(tx, ty, hx, hy);
    g.addColorStop(0, 'rgba(255, 200, 60, 0)');
    g.addColorStop(1, `rgba(255, 235, 140, ${(1 - pr) * 0.8})`);

    ctx.beginPath();
    ctx.moveTo(tx, ty);
    ctx.lineTo(hx, hy);
    ctx.strokeStyle = g;
    ctx.lineWidth = 1.2;
    ctx.globalAlpha = 1;
    ctx.stroke();
    return true;
  };

  const drawLensFlare = (ctx, cx, cy, size, opacity, rot) => {
    ctx.save();
    ctx.globalAlpha = opacity;
    ctx.translate(cx, cy);
    ctx.rotate(rot);

    /* ── layer 1: soft outer glow halo — gold, diffuse ── */
    const halo = ctx.createRadialGradient(0, 0, 0, 0, 0, size * 2.5);
    halo.addColorStop(0, 'rgba(255, 230, 150, 0.4)'); // #ffe066
    halo.addColorStop(0.4, 'rgba(255, 200, 60, 0.15)');
    halo.addColorStop(1, 'rgba(255, 140, 0, 0)');
    ctx.fillStyle = halo;
    ctx.beginPath();
    ctx.arc(0, 0, size * 2.5, 0, Math.PI * 2);
    ctx.fill();

    /* ── layer 2: tight inner shimmer ── */
    const inner = ctx.createRadialGradient(0, 0, 0, 0, 0, size * 0.8);
    inner.addColorStop(0, 'rgba(255, 255, 240, 0.5)'); 
    inner.addColorStop(1, 'rgba(255, 224, 102, 0)');
    ctx.fillStyle = inner;
    ctx.beginPath();
    ctx.arc(0, 0, size * 0.8, 0, Math.PI * 2);
    ctx.fill();

    /* ── layer 3: 4-arm star ── */

    /* ── layer 3: 4-arm star ── */
    const arms = [
      { ang: 0, len: size, w: size * 0.065 },
      { ang: Math.PI / 2, len: size, w: size * 0.065 },
      { ang: Math.PI / 4, len: size * 0.52, w: size * 0.038 },
      { ang: -Math.PI / 4, len: size * 0.52, w: size * 0.038 },
    ];
    arms.forEach(arm => {
      ctx.save();
      ctx.rotate(arm.ang);
      const lg = ctx.createLinearGradient(0, -arm.len, 0, arm.len);
      lg.addColorStop(0, 'rgba(255, 248, 200, 0)');
      lg.addColorStop(0.32, 'rgba(255, 238, 150, 0.82)');
      lg.addColorStop(0.50, 'rgba(255, 253, 224, 1)'); // #fffde0
      lg.addColorStop(0.68, 'rgba(255, 238, 150, 0.82)');
      lg.addColorStop(1, 'rgba(255, 248, 200, 0)');
      ctx.fillStyle = lg;
      ctx.beginPath();
      ctx.ellipse(0, 0, arm.w, arm.len, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });

    /* ── layer 4: bright centre core ── */
    const core = ctx.createRadialGradient(0, 0, 0, 0, 0, size * 0.18);
    core.addColorStop(0, 'rgba(255, 255, 240, 1)');
    core.addColorStop(0.45, 'rgba(255, 245, 180, 0.9)');
    core.addColorStop(0.8, 'rgba(255, 224, 102, 0.4)');
    core.addColorStop(1, 'rgba(255, 200, 60, 0)');
    ctx.fillStyle = core;
    ctx.beginPath();
    ctx.arc(0, 0, size * 0.18, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  };

  // Main animation loop
  const animate = () => {
    if (!active) return;
    
    frameCountRef.current++;
    const fr = frameCountRef.current;
    const bgC = bgCanvasRef.current;
    const flrC = flrCanvasRef.current;
    
    if (!bgC || !flrC) return;
    
    const bgX = bgC.getContext('2d');
    const flrX = flrC.getContext('2d');
    const W = bgC.width;
    const H = bgC.height;

    // 1. Draw 背景 (Stars + Meteors)
    bgX.clearRect(0, 0, W, H);
    
    // Gradient is now handled by static CSS in VersePage.css for 100% stability.
    
    if (showStars) {
      const t = fr * 0.012;
      starsRef.current.forEach(s => drawStar(bgX, s, t));
    }

    if (showMeteors) {
      // Occasional new meteor
      if (fr % 180 === 0 && Math.random() > 0.5) {
        meteorsRef.current.push({
          x: Math.random() * W * 0.9,
          y: Math.random() * H * 0.4,
          len: 60 + Math.random() * 100,
          life: 0,
          max: 30 + Math.random() * 40,
          ang: 15 + Math.random() * 30
        });
      }
      
      // Update and Filter meteors
      meteorsRef.current = meteorsRef.current.filter(m => drawMeteor(bgX, m, W, H));
    }

    // 2. Draw Flares
    flrX.clearRect(0, 0, W, H);
    if (showFlares && flaresRef.current.length > 0) {
      const t = fr * 0.018;
      flaresRef.current.forEach(f => {
        // Smooth entrance over 35 frames (prevents popping)
        const entrance = Math.min(1, (fr - (f.startFrame || 0)) / 35);
        const pulse = 0.5 + 0.5 * Math.sin(t + f.phase);
        const opacity = f.baseOpacity * (0.52 + 0.48 * pulse) * (flareIntensity || 1.0) * entrance;
        const scale = (0.78 + 0.22 * pulse) * entrance;
        const rot = f.rot + t * f.rotSpeed;
        drawLensFlare(flrX, f.x, f.y, f.size * scale, opacity, rot);
      });
    }

    requestRef.current = requestAnimationFrame(animate);
  };

  // Resize handler
  useEffect(() => {
    const handleResize = () => {
      const W = window.innerWidth;
      const H = window.innerHeight;
      
      if (bgCanvasRef.current) {
        bgCanvasRef.current.width = W;
        bgCanvasRef.current.height = H;
        initStars(W, H);
      }
      
      if (flrCanvasRef.current) {
        flrCanvasRef.current.width = W;
        flrCanvasRef.current.height = H;
      }
      
      lastResizeRef.current = Date.now();
      // Rebuild flares after a short delay
      setTimeout(() => buildFlares(W, H), 300);
    };

    window.addEventListener('resize', handleResize);
    handleResize();

    requestRef.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [active, showFlares, showStars, showMeteors, flareIntensity, flareScale, flareDensity, starDensity, flareOffsetX, flareOffsetY]);

  // Rebuild flares when animations complete or settings change
  useEffect(() => {
    if (animationsComplete) {
      const timer = setTimeout(() => {
        buildFlares(window.innerWidth, window.innerHeight);
      }, 500); // Wait for fall animation to settle
      return () => clearTimeout(timer);
    } else {
      flaresRef.current = [];
    }
  }, [animationsComplete, showFlares, active, flareIntensity, flareScale, flareDensity]);

  // Track scrolling to update flares
  useEffect(() => {
    let scrollTimer;
    const handleScroll = () => {
      if (scrollTimer) clearTimeout(scrollTimer);
      // While scrolling, just hide or roughly move flares
      // For now, let's just rebuild them when scroll stops
      scrollTimer = setTimeout(() => {
        buildFlares(window.innerWidth, window.innerHeight);
      }, 150);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [animationsComplete]);

  if (!active) return null;

  return (
    <>
      {/* Background Star Layer: Behind everything */}
      <div className="divine-star-layer" style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 0, overflow: 'hidden' }}>
        <canvas ref={bgCanvasRef} style={{ position: 'absolute', top: 0, left: 0 }} />
      </div>
      
      {/* Flare Layer: On top of everything (z-index 2000) */}
      <div className="divine-flare-layer" style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 2000, overflow: 'hidden' }}>
        <canvas ref={flrCanvasRef} style={{ position: 'absolute', top: 0, left: 0 }} />
      </div>
      
      <canvas ref={offCanvasRef} style={{ display: 'none' }} />
    </>
  );
};

export default DivineEffects;
