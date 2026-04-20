import { getAssetPath } from '../api/assets';

/**
 * ImageCache Singleton
 * Manages pre-loaded images to prevent redundant network requests
 * and flickering in Canvas rendering.
 */
class ImageCache {
  constructor() {
    this.cache = new Map();
  }

  /**
   * Loads an image or retrieves it from cache.
   * @param {string} relativePath - The relative path to the asset.
   * @returns {Promise<HTMLImageElement>}
   */
  async get(relativePath) {
    const url = encodeURI(getAssetPath(relativePath));
    
    if (this.cache.has(url)) {
      const img = this.cache.get(url);
      if (img.complete) return img;
      return new Promise((resolve, reject) => {
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error(`Failed to load image from cache: ${url}`));
      });
    }

    return new Promise((resolve, reject) => {
      const img = new Image();
      img.src = url;
      this.cache.set(url, img);
      
      img.onload = () => resolve(img);
      img.onerror = () => {
        this.cache.delete(url);
        reject(new Error(`Failed to load image: ${url}`));
      };
    });
  }

  /**
   * Pre-loads an array of assets.
   * @param {string[]} paths 
   */
  async preload(paths) {
    return Promise.all(paths.map(path => this.get(path)));
  }
}

export const imageCache = new ImageCache();
