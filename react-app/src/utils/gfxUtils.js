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
