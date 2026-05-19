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
let tintCanvas = null;
let tintCtx = null;

/**
 * Draws an image tinted with a solid color on the canvas.
 * Highly performant offscreen composite method.
 */
export const drawTintedImage = (ctx, img, sx, sy, sw, sh, dx, dy, dw, dh, color, alpha) => {
  if (!img || sw <= 0 || sh <= 0) return;
  
  if (img.complete && img.naturalWidth > 0) {
    try {
      if (!tintCanvas) {
        tintCanvas = document.createElement('canvas');
        tintCtx = tintCanvas.getContext('2d');
      }
      
      // Resize offscreen canvas if needed
      if (tintCanvas.width < sw) tintCanvas.width = sw;
      if (tintCanvas.height < sh) tintCanvas.height = sh;
      
      tintCtx.clearRect(0, 0, sw, sh);
      tintCtx.drawImage(img, sx, sy, sw, sh, 0, 0, sw, sh);
      
      // Source-in fills only the non-transparent pixels with the tint color
      tintCtx.save();
      tintCtx.globalCompositeOperation = 'source-in';
      tintCtx.fillStyle = color;
      tintCtx.fillRect(0, 0, sw, sh);
      tintCtx.restore();
      
      // Draw onto the main canvas with specified opacity/alpha
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.drawImage(tintCanvas, 0, 0, sw, sh, dx, dy, dw, dh);
      ctx.restore();
    } catch (e) {
      console.warn("drawTintedImage failed:", e);
    }
  }
};
