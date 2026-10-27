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

/**
 * Accurately finds the matching DB vehicle record for any frontend vehicle card or slug.
 * Works for all vehicle types (Sedan, SUV, Innova Crysta, Minibus/Tempo Traveller, Hatchback, etc.),
 * matching by name, id, slug, and category aliases.
 *
 * @param {Object} frontendVehicle - The vehicle item from homepageContent or vehiclesData
 * @param {Array} dbVehicles - List of vehicles returned from /api/vehicles
 * @returns {Object|null} Matching DB vehicle or null
 */
export const findMatchingDbVehicle = (frontendVehicle, dbVehicles = []) => {
  if (!frontendVehicle || !Array.isArray(dbVehicles) || dbVehicles.length === 0) return null;

  const fId = (frontendVehicle.id || '').toLowerCase().trim();
  const fName = (frontendVehicle.name || '').toLowerCase().trim();
  const fSlug = (frontendVehicle.slug || '').toLowerCase().trim();
  const fCat = (frontendVehicle.category || '').toUpperCase().trim();

  // Normalize category mapping
  const normalizeCat = (cat) => {
    if (!cat) return '';
    const c = cat.toUpperCase();
    if (c === 'INNOVA_CRYSTA' || c === 'LUXURY' || c === 'PREMIUM') return 'LUXURY';
    if (c === 'TEMPO_TRAVELLER' || c === 'MINIBUS' || c === 'MINI_BUS') return 'MINIBUS';
    return c;
  };

  const normalizedFCat = normalizeCat(fCat);

  // 1. Direct ID match if IDs are identical
  const idMatch = dbVehicles.find((db) => db.id && db.id.toLowerCase() === fId);
  if (idMatch) return idMatch;

  // 2. Exact Name Match (case-insensitive)
  const exactNameMatch = dbVehicles.find((db) => db.name && db.name.toLowerCase().trim() === fName);
  if (exactNameMatch) return exactNameMatch;

  // 3. Name Contains Match (either direction) with specific category guards
  if (fName.includes('luxury') && (fName.includes('tempo') || fCat.includes('TEMPO') || fId === 'minibus')) {
    const luxuryTempo = dbVehicles.find(
      (db) => db.name?.toLowerCase().includes('luxury') && db.name?.toLowerCase().includes('tempo')
    );
    if (luxuryTempo) return luxuryTempo;
  }

  if (fName.includes('tempo') || fSlug.includes('tempo') || fId === 'minibus' || normalizedFCat === 'MINIBUS') {
    const tempoMatch = dbVehicles.find(
      (db) => db.name?.toLowerCase().includes('tempo') || db.category === 'MINIBUS'
    );
    if (tempoMatch) return tempoMatch;
  }

  if (fName.includes('crysta') || fName.includes('innova') || fSlug.includes('innova') || fId === 'premium' || normalizedFCat === 'LUXURY') {
    const innovaMatch = dbVehicles.find(
      (db) => db.name?.toLowerCase().includes('crysta') ||
              db.name?.toLowerCase().includes('innova') ||
              db.category === 'LUXURY'
    );
    if (innovaMatch) return innovaMatch;
  }

  if (fName.includes('ertiga') || fName.includes('carens') || fSlug.includes('ertiga') || fId === 'suv' || normalizedFCat === 'SUV') {
    const suvMatch = dbVehicles.find(
      (db) => db.name?.toLowerCase().includes('ertiga') ||
              db.name?.toLowerCase().includes('carens') ||
              db.category === 'SUV'
    );
    if (suvMatch) return suvMatch;
  }

  if (fName.includes('dzire') || fName.includes('etios') || fName.includes('sedan') || fSlug.includes('dzire') || fId === 'sedan' || normalizedFCat === 'SEDAN') {
    const sedanMatch = dbVehicles.find(
      (db) => db.name?.toLowerCase().includes('sedan') ||
              db.name?.toLowerCase().includes('dzire') ||
              db.category === 'SEDAN'
    );
    if (sedanMatch) return sedanMatch;
  }

  if (fName.includes('hatchback') || fSlug.includes('hatchback') || fId === 'hatchback' || normalizedFCat === 'HATCHBACK') {
    const hatchMatch = dbVehicles.find(
      (db) => db.name?.toLowerCase().includes('hatchback') ||
              db.category === 'HATCHBACK'
    );
    if (hatchMatch) return hatchMatch;
  }

  // 4. Token-based overlap (2 or more shared keywords >= 4 characters)
  const tokens = fName.split(/[\s\(\)/,-]+/).filter((w) => w.length >= 4);
  const tokenMatch = dbVehicles.find((db) => {
    const dbNameLower = (db.name || '').toLowerCase();
    return tokens.filter((t) => dbNameLower.includes(t)).length >= 2;
  });
  if (tokenMatch) return tokenMatch;

  // 5. Category-based fallback
  const catMatch = dbVehicles.find((db) => normalizeCat(db.category) === normalizedFCat);
  if (catMatch) return catMatch;

  return null;
};

