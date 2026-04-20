/**
 * Consolidated asset path helper.
 * Uses Vite's import.meta.env.BASE_URL to resolve paths correctly
 * across development and production environments.
 */
export const getAssetPath = (path) => {
  const base = import.meta.env.BASE_URL || '';
  // Ensure we don't end up with double slashes if path starts with /
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  return `${base}${cleanPath}`;
};
