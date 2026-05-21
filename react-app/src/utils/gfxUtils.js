/**
 * Safely draws an image to a Canvas context.
 * Prevents "InvalidStateError" if the image failed to load or is uninitialized.
 */
export const safeDrawImage = (ctx, img, ...args) => {
  if (!img) return false;
  
  // Check if image is loaded and valid
  // naturalWidth > 0 ensures it's not a "broken" image
  if (img.complete && img.naturalWidth > 0) {
    try {
      ctx.drawImage(img, ...args);
      return true;
    } catch (e) {
      console.warn("safeDrawImage suppressed a crash:", e);
      return false;
    }
  }
  return false;
};

// Offscreen buffer cache for sprite tinting
let lastTintCache = new Map();

/**
 * Draws an image tinted with a solid color on the canvas.
 * Highly performant offscreen composite method with caching.
 */
export const drawTintedImage = (ctx, img, sx, sy, sw, sh, dx, dy, dw, dh, color, alpha) => {
  if (!img || sw <= 0 || sh <= 0) return;
  
  if (img.complete && img.naturalWidth > 0) {
    try {
      const cacheKey = `${img.src}_${sx}_${sy}_${sw}_${sh}_${color}`;
      let cacheCanvas = lastTintCache.get(cacheKey);
      
      if (!cacheCanvas) {
        cacheCanvas = document.createElement('canvas');
        cacheCanvas.width = sw;
        cacheCanvas.height = sh;
        const cCtx = cacheCanvas.getContext('2d');
        cCtx.drawImage(img, sx, sy, sw, sh, 0, 0, sw, sh);
        
        // Source-in fills only the non-transparent pixels with the tint color
        cCtx.save();
        cCtx.globalCompositeOperation = 'source-in';
        cCtx.fillStyle = color;
        cCtx.fillRect(0, 0, sw, sh);
        cCtx.restore();
        
        lastTintCache.set(cacheKey, cacheCanvas);
        // Keep cache small to avoid memory leaks
        if (lastTintCache.size > 20) {
          const firstKey = lastTintCache.keys().next().value;
          lastTintCache.delete(firstKey);
        }
      }
      
      // Draw onto the main canvas with specified opacity/alpha
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.drawImage(cacheCanvas, 0, 0, sw, sh, dx, dy, dw, dh);
      ctx.restore();
    } catch (e) {
      console.warn("drawTintedImage failed:", e);
    }
  }
};
