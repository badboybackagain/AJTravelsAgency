import { API_BASE_URL } from '../services/api';

/**
 * Resolves a media URL safely for both local dev and production environments.
 * Handles /uploads relative paths, external URLs (Cloudinary/S3/http/https),
 * and local static assets with a fallback.
 *
 * @param {string} url - Image path or URL
 * @param {string} fallback - Fallback asset path
 * @returns {string} Fully qualified image URL
 */
export const resolveMediaUrl = (url, fallback = '/assets/sedan.webp') => {
  if (!url || typeof url !== 'string') return fallback;
  const trimmed = url.trim();
  if (!trimmed) return fallback;
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.startsWith('data:')) {
    return trimmed;
  }
  if (trimmed.startsWith('/uploads')) {
    return `${API_BASE_URL || ''}${trimmed}`;
  }
  return trimmed;
};
