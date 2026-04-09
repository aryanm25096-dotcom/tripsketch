/* ==========================================================================
   TripSketch Landing — Scroll-Driven Frame Animation Engine
   ========================================================================== */

(function () {
  'use strict';

  // ---------- Configuration ----------
  const FRAME_COUNT = 41;
  const FRAME_DIR = 'frames/';
  const FRAME_PREFIX = 'ezgif-frame-';
  const FRAME_EXT = '.png';

  // ---------- DOM Elements ----------
  const canvas = document.getElementById('frameCanvas');
  const ctx = canvas.getContext('2d', { alpha: false });
  const preloader = document.getElementById('preloader');
  const preloaderProgress = document.getElementById('preloaderProgress');
  const preloaderPercent = document.getElementById('preloaderPercent');
  const textSections = document.querySelectorAll('.text-section');

  // ---------- State ----------
  const images = new Array(FRAME_COUNT);
  let loadedCount = 0;
  let currentFrameIndex = 0;
  let targetFrameIndex = 0;
  let isReady = false;
  let rafId = null;

  // ---------- Helpers ----------
  function padIndex(i) {
    return String(i).padStart(3, '0');
  }

  function getFrameSrc(index) {
    return `${FRAME_DIR}${FRAME_PREFIX}${padIndex(index)}${FRAME_EXT}`;
  }

  // ---------- Canvas Sizing ----------
  function resizeCanvas() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = window.innerWidth * dpr;
    canvas.height = window.innerHeight * dpr;
    canvas.style.width = window.innerWidth + 'px';
    canvas.style.height = window.innerHeight + 'px';
    ctx.scale(dpr, dpr);

    // Redraw current frame after resize
    if (isReady && images[currentFrameIndex]) {
      drawFrame(currentFrameIndex);
    }
  }

  // ---------- Frame Drawing ----------
  function drawFrame(index) {
    const img = images[index];
    if (!img) return;

    const canvasW = window.innerWidth;
    const canvasH = window.innerHeight;
    const imgW = img.naturalWidth;
    const imgH = img.naturalHeight;

    // Cover the canvas (like background-size: cover)
    const scale = Math.max(canvasW / imgW, canvasH / imgH);
    const drawW = imgW * scale;
    const drawH = imgH * scale;
    const x = (canvasW - drawW) / 2;
    const y = (canvasH - drawH) / 2;

    ctx.drawImage(img, x, y, drawW, drawH);
  }

  // ---------- Image Preloading ----------
  function preloadImages() {
    // Load all frames concurrently with a concurrency limit
    const BATCH_SIZE = 6;
    let currentBatch = 0;

    function loadBatch(startIdx) {
      const endIdx = Math.min(startIdx + BATCH_SIZE, FRAME_COUNT);
      const promises = [];

      Array.from({ length: endIdx - startIdx }).forEach((_, i) => {
        promises.push(loadImage(startIdx + i + 1)); // frames are 1-indexed
      });

      Promise.all(promises).then(() => {
        if (endIdx < FRAME_COUNT) {
          loadBatch(endIdx);
        }
      });
    }

    loadBatch(0);
  }

  function loadImage(frameNum) {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        images[frameNum - 1] = img; // store 0-indexed
        loadedCount++;
        updatePreloader();
        if (loadedCount === FRAME_COUNT) {
          onAllLoaded();
        }
        resolve();
      };
      img.onerror = () => {
        console.warn(`Failed to load frame ${frameNum}`);
        loadedCount++;
        updatePreloader();
        if (loadedCount === FRAME_COUNT) {
          onAllLoaded();
        }
        resolve();
      };
      img.src = getFrameSrc(frameNum);
    });
  }

  function updatePreloader() {
    const pct = Math.round((loadedCount / FRAME_COUNT) * 100);
    preloaderProgress.style.width = pct + '%';
    preloaderPercent.textContent = pct + '%';
  }

  function onAllLoaded() {
    isReady = true;
    // Draw first frame
    drawFrame(0);

    // Fade out preloader
    setTimeout(() => {
      preloader.classList.add('hidden');
    }, 400);

    // Start animation loop
    startRenderLoop();

    // Initial text update
    updateTextSections();
  }

  // ---------- Scroll → Frame Mapping ----------
  function getScrollProgress() {
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
    return Math.max(0, Math.min(1, scrollTop / scrollHeight));
  }

  function getTargetFrame(progress) {
    return Math.min(Math.floor(progress * FRAME_COUNT), FRAME_COUNT - 1);
  }

  // ---------- Text Section Visibility ----------
  function updateTextSections() {
    const progress = getScrollProgress();

    textSections.forEach((section) => {
      const start = parseFloat(section.dataset.start);
      const end = parseFloat(section.dataset.end);

      // Calculate fade factor
      const fadeIn = 0.04;  // 4% scroll range to fade in
      const fadeOut = 0.04; // 4% scroll range to fade out

      let opacity = 0;
      let translateY = 30;

      if (progress >= start && progress <= end) {
        // Fade in
        if (progress < start + fadeIn) {
          const t = (progress - start) / fadeIn;
          opacity = t;
          translateY = 30 * (1 - t);
        }
        // Full visibility
        else if (progress <= end - fadeOut) {
          opacity = 1;
          translateY = 0;
        }
        // Fade out
        else {
          const t = (end - progress) / fadeOut;
          opacity = t;
          translateY = -20 * (1 - t);
        }
      }

      section.style.opacity = opacity;
      section.style.transform = `translateY(${translateY}px)`;

      if (opacity > 0.01) {
        section.classList.add('visible');
      } else {
        section.classList.remove('visible');
      }
    });
  }

  // ---------- Render Loop (smooth interpolation) ----------
  function startRenderLoop() {
    function tick() {
      if (!isReady) {
        rafId = requestAnimationFrame(tick);
        return;
      }

      targetFrameIndex = getTargetFrame(getScrollProgress());

    // Smooth interpolation toward target (lerp)
    const diff = targetFrameIndex - currentFrameIndex;
    if (Math.abs(diff) > 0.01) {
      currentFrameIndex += diff * 0.08; // Smoother, slower ease (was 0.2)
    } else {
      currentFrameIndex = targetFrameIndex;
    }

    // Cross-fade between frames for buttery smoothness
    const baseIndex = Math.floor(currentFrameIndex);
    const nextIndex = Math.min(baseIndex + 1, FRAME_COUNT - 1);
    const fraction = currentFrameIndex - baseIndex;

    // First, clear canvas (optional if opaque, but safe)
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw base frame (opaque)
    ctx.globalAlpha = 1;
    drawFrame(baseIndex);

    // Draw next frame over it (based on fraction)
    if (nextIndex !== baseIndex && fraction > 0.01) {
      ctx.globalAlpha = fraction;
      drawFrame(nextIndex);
    }

    // Reset alpha
    ctx.globalAlpha = 1;

      rafId = requestAnimationFrame(tick);
    }

    rafId = requestAnimationFrame(tick);
  }

  // ---------- Utilities ----------
  function throttle(func, limit) {
    let inThrottle;
    return function() {
      const args = arguments;
      const context = this;
      if (!inThrottle) {
        func.apply(context, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  }

  // ---------- Event Listeners ----------
  window.addEventListener('resize', () => {
    resizeCanvas();
  });

  // Passive scroll listener for text updates (throttled for performance)
  const throttledUpdateTextSections = throttle(() => {
    updateTextSections();
  }, 16); // ~60fps handling rate

  window.addEventListener('scroll', throttledUpdateTextSections, { passive: true });

  // Prevent right-click on canvas
  canvas.addEventListener('contextmenu', (e) => e.preventDefault());

  // Spa transition handler
  document.getElementById('ctaButton').addEventListener('click', (e) => {
    e.preventDefault();
    
    // Fade out landing overlay, canvas, scrollContainer
    document.getElementById('uiOverlay').style.transition = 'opacity 1s ease';
    document.getElementById('uiOverlay').style.opacity = '0';
    document.getElementById('frameCanvas').style.transition = 'opacity 1s ease';
    document.getElementById('frameCanvas').style.opacity = '0';
    
    setTimeout(() => {
       document.getElementById('uiOverlay').style.display = 'none';
       document.getElementById('frameCanvas').style.display = 'none';
       document.getElementById('scrollContainer').style.display = 'none';
       
       // Stop RAF
       cancelAnimationFrame(rafId);
       
       // Mark app as active — lets explore.css apply cream body background
       document.documentElement.classList.add('app-active');
       
       // Fade in app container
       const app = document.getElementById('appContainer');
       app.style.display = 'block';
       // force reflow
       void app.offsetWidth;
       app.style.opacity = '1';
       
       // Reset scroll position to top
       window.scrollTo(0, 0);
    }, 1000);
  });

  // ---------- Init ----------
  function init() {
    resizeCanvas();
    preloadImages();
  }

  // Start on DOMContentLoaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
