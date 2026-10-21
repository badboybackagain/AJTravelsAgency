/**
 * Centralized Fare Navigation Contract for AJ Travels.
 *
 * Ensures all homepage sections, cards, and buttons construct uniform,
 * validated, and properly encoded URLs for the Fare Calculator (/fare).
 */

/**
 * Builds a standardized, type-safe /fare query URL from provided options.
 *
 * @param {Object} options
 * @param {string} [options.tripType='ONE_WAY'] - 'ONE_WAY' | 'ROUND_TRIP' | 'LOCAL'
 * @param {string} [options.pickupId] - Internal location ID, slug, or search term
 * @param {string} [options.dropId] - Internal location ID, slug, or search term
 * @param {string} [options.pickupName] - Formatted location name for display
 * @param {string} [options.dropName] - Formatted destination name for display
 * @param {string} [options.pickupAddress] - Detailed doorstep address
 * @param {string} [options.dropAddress] - Detailed destination address
 * @param {string} [options.city] - City for LOCAL rentals (e.g. 'Pune')
 * @param {string|number} [options.duration] - Package duration for LOCAL (e.g. 4, 8, 12)
 * @param {string} [options.category] - Vehicle category ('SEDAN', 'SUV', 'TEMPO_TRAVELLER')
 * @param {string} [options.vehicleName] - Preselected vehicle model name
 * @param {string} [options.departureDate] - 'YYYY-MM-DD'
 * @param {string} [options.departureTime] - e.g. '08:00 AM'
 * @param {string} [options.returnDate] - 'YYYY-MM-DD'
 * @param {string} [options.returnTime] - e.g. '08:00 PM'
 * @param {string|number} [options.passengers='1']
 * @param {boolean} [options.isCustomRoute]
 * @returns {string} URL string, e.g. "/fare?tripType=ONE_WAY&pickupId=pune..."
 */
export function buildFareUrl(options = {}) {
  const params = new URLSearchParams();

  const tripType = options.tripType || 'ONE_WAY';
  params.set('tripType', tripType);

  if (tripType === 'LOCAL') {
    if (options.city) params.set('city', options.city);
    if (options.duration) params.set('duration', String(options.duration));
  } else {
    // Only set pickup/drop if genuine strings provided (ignore 'undefined' or empty)
    if (options.pickupId && options.pickupId !== 'undefined') {
      params.set('pickupId', options.pickupId);
    }
    if (options.dropId && options.dropId !== 'undefined') {
      params.set('dropId', options.dropId);
    }
    if (options.pickupName && options.pickupName !== 'undefined') {
      params.set('pickupName', options.pickupName);
    }
    if (options.dropName && options.dropName !== 'undefined') {
      params.set('dropName', options.dropName);
    }
    if (options.pickupAddress) {
      params.set('pickupAddress', options.pickupAddress);
    }
    if (options.dropAddress) {
      params.set('dropAddress', options.dropAddress);
    }
    if (typeof options.isCustomRoute === 'boolean') {
      params.set('isCustomRoute', String(options.isCustomRoute));
    }
  }

  // Preselected fleet filters
  if (options.category && options.category !== 'ALL') {
    params.set('category', options.category);
  }
  if (options.vehicleName) {
    params.set('vehicleName', options.vehicleName);
  }

  // Schedule dates & timings
  const depDate = options.departureDate || options.date;
  const depTime = options.departureTime || options.time;
  if (depDate) {
    params.set('departureDate', depDate);
    params.set('date', depDate);
  }
  if (depTime) {
    params.set('departureTime', depTime);
    params.set('time', depTime);
  }

  if (tripType === 'ROUND_TRIP') {
    if (options.returnDate) params.set('returnDate', options.returnDate);
    if (options.returnTime) params.set('returnTime', options.returnTime);
  }

  if (options.passengers) {
    params.set('passengers', String(options.passengers));
  }

  const queryString = params.toString();
  return queryString ? `/fare?${queryString}` : '/fare';
}

/**
 * Normalizes free-form text or legacy route slugs to known corridor keywords.
 * For example: "PUNE RESIDENCE" -> "pune", "MUMBAI CITY" -> "mumbai"
 */
export function normalizeCorridorKey(text) {
  if (!text) return '';
  const lower = text.toLowerCase().trim();
  if (lower.includes('pune') || lower.includes('hinjawadi') || lower.includes('wakad') || lower.includes('baner')) {
    return 'pune';
  }
  if (lower.includes('mumbai') || lower.includes('airport (bom)') || lower.includes('bkc') || lower.includes('dadar')) {
    return 'mumbai';
  }
  return lower;
}
