/**
 * Location Search & Geocoding Service for AJ Travels
 * 
 * Provides:
 * 1. Saved Database Location matching & grouping
 * 2. Real-time address / society / hotel / landmark autocomplete:
 *    - Google Places Autocomplete (when VITE_GOOGLE_MAPS_API_KEY is configured)
 *    - OpenStreetMap Photon + Nominatim geocoding (zero-config, free, high coverage across India)
 * 3. Intelligent Pune ↔ Mumbai corridor & outstation region detection
 */

// In-memory geocode query cache to prevent repeat network requests
const searchCache = new Map();

// Bounding & Center coordinates for Pune & Mumbai
const PUNE_CENTER = { lat: 18.5204, lon: 73.8567 };
const MUMBAI_CENTER = { lat: 19.076, lon: 72.8777 };

const PUNE_KEYWORDS = [
  'pune', 'pcmc', 'pimpri', 'chinchwad', 'hinjawadi', 'hinjewadi', 'wakad', 'baner',
  'kothrud', 'hadapsar', 'kharadi', 'viman nagar', 'shivajinagar', 'swargate',
  'magarpatta', 'bavdhan', 'aundh', 'kondhwa', 'dhanori', 'nigdi', 'ravet',
  'chakan', 'talegaon', 'moshi', 'yerwada', 'kalyani nagar', 'koregaon park',
  'katraj', 'camp', 'warje', 'dhayari', 'alandi', 'wagholi', 'dehu', 'lohegaon',
  'bhosari', 'pashan', 'sangvi', 'pimple saudagar', 'pimple gurav', 'kasarwadi',
  'dapodi', 'bopodi', 'vishrantwadi', 'tingre nagar', 'vadgaon sheri', 'mundhwa'
];

const MUMBAI_KEYWORDS = [
  'mumbai', 'bombay', 'navi mumbai', 'thane', 'vashi', 'panvel', 'andheri', 'bandra',
  'dadar', 'bkc', 'borivali', 'kurla', 'chembur', 'ghatkopar', 'mulund', 'kalyan',
  'dombivli', 'mira bhayandar', 'goregaon', 'malad', 'kandivali', 'colaba', 'worli',
  'lower parel', 'juhu', 'santacruz', 'powai', 'khar', 'sion', 'mahim', 'prabhadevi',
  'byculla', 'cst', 'csmt', 'marine lines', 'churchgate', 'nariman point', 'nerul',
  'belapur', 'kharghar', 'kamothe', 'kalamboli', 'ghansoli', 'airoli', 'kopar khairane',
  'mahape', 'rabale', 'turbhe', 'sanpada', 'seawoods', 'uran', 'bhiwandi', 'mumbra',
  'diva', 'kalwa', 'ghodbunder', 'wagle estate', 'majimada', 'naupada', 'vartak nagar'
];

/**
 * Detect whether a location or address belongs to Pune Side, Mumbai Side, or Other Outstation
 */
export function detectLocationRegion(text = '', lat = null, lon = null) {
  const lower = (text || '').toLowerCase();

  // 1. Check coordinates first if available
  if (typeof lat === 'number' && typeof lon === 'number') {
    // Pune approximate bounding box: Lat 18.30 to 18.80, Lon 73.60 to 74.15
    if (lat >= 18.30 && lat <= 18.80 && lon >= 73.60 && lon <= 74.15) {
      return { side: 'PUNE_SIDE', city: 'Pune' };
    }
    // Mumbai & MMR bounding box: Lat 18.85 to 19.45, Lon 72.70 to 73.25
    if (lat >= 18.85 && lat <= 19.45 && lon >= 72.70 && lon <= 73.25) {
      return { side: 'MUMBAI_SIDE', city: 'Mumbai' };
    }
  }

  // 2. Keyword heuristic checks
  for (const kw of PUNE_KEYWORDS) {
    if (lower.includes(kw)) {
      return { side: 'PUNE_SIDE', city: 'Pune' };
    }
  }

  for (const kw of MUMBAI_KEYWORDS) {
    if (lower.includes(kw)) {
      return { side: 'MUMBAI_SIDE', city: 'Mumbai' };
    }
  }

  return { side: 'OTHER', city: 'Other' };
}

/**
 * Google Maps Places Autocomplete Loader
 */
let googleMapsLoadingPromise = null;
export function loadGoogleMapsScript(apiKey) {
  if (typeof window === 'undefined') return Promise.reject(new Error('Window unavailable'));
  if (window.google?.maps?.places) return Promise.resolve(window.google);
  if (!apiKey) return Promise.reject(new Error('No Google Maps API key provided'));

  if (googleMapsLoadingPromise) return googleMapsLoadingPromise;

  googleMapsLoadingPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector('script[data-google-maps]');
    if (existing) {
      existing.addEventListener('load', () => resolve(window.google));
      existing.addEventListener('error', reject);
      return;
    }

    const script = document.createElement('script');
    script.setAttribute('data-google-maps', 'true');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve(window.google);
    script.onerror = (err) => {
      googleMapsLoadingPromise = null;
      reject(err);
    };
    document.head.appendChild(script);
  });

  return googleMapsLoadingPromise;
}

/**
 * Search Google Places Autocomplete if configured
 */
async function searchGooglePlaces(query, apiKey) {
  try {
    const google = await loadGoogleMapsScript(apiKey);
    const service = new google.maps.places.AutocompleteService();
    return new Promise((resolve) => {
      service.getPlacePredictions(
        {
          input: query,
          componentRestrictions: { country: 'in' },
        },
        (predictions, status) => {
          if (status !== google.maps.places.PlacesServiceStatus.OK || !predictions) {
            resolve([]);
            return;
          }

          const results = predictions.map((p) => {
            const detected = detectLocationRegion(p.description);
            return {
              id: null,
              placeId: p.place_id,
              name: p.structured_formatting?.main_text || p.description,
              formattedAddress: p.description,
              city: detected.city,
              side: detected.side,
              isCustom: true,
              source: 'google',
              type: p.types?.[0] || 'landmark',
              lat: null,
              lon: null,
            };
          });
          resolve(results);
        }
      );
    });
  } catch (err) {
    console.warn('Google Places search fallback to OSM:', err.message);
    return [];
  }
}

/**
 * Photon OpenStreetMap Search (Optimized for Pune / Mumbai / Maharashtra)
 */
async function searchPhoton(query, biasSide = 'PUNE_SIDE') {
  const center = biasSide === 'MUMBAI_SIDE' ? MUMBAI_CENTER : PUNE_CENTER;
  const url = `https://photon.komoot.io/api/?q=${encodeURIComponent(
    query
  )}&limit=6&lat=${center.lat}&lon=${center.lon}`;

  const res = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!res.ok) throw new Error('Photon request failed');
  const data = await res.json();

  const items = (data.features || []).map((f) => {
    const props = f.properties || {};
    const coords = f.geometry?.coordinates || [];
    const lon = coords[0] || null;
    const lat = coords[1] || null;

    const name = props.name || props.street || query;
    const parts = [
      props.name,
      props.street,
      props.district || props.city,
      props.state,
      props.postcode,
    ].filter(Boolean);
    const formattedAddress = Array.from(new Set(parts)).join(', ');

    const detected = detectLocationRegion(
      `${formattedAddress} ${props.city || ''} ${props.district || ''}`,
      lat,
      lon
    );

    let type = 'landmark';
    if (props.osm_value === 'aerodrome' || props.osm_key === 'aeroway') type = 'airport';
    else if (props.osm_value === 'station' || props.osm_value === 'halt') type = 'station';
    else if (props.osm_value === 'residential' || props.osm_value === 'apartments') type = 'society';
    else if (props.osm_value === 'hotel' || props.osm_value === 'hostel') type = 'hotel';
    else if (props.osm_value === 'suburb' || props.osm_value === 'neighbourhood') type = 'locality';

    return {
      id: null,
      placeId: `osm-${props.osm_id || Math.random().toString(36).substring(2, 9)}`,
      name,
      formattedAddress: formattedAddress || name,
      city: detected.city,
      side: detected.side,
      isCustom: true,
      source: 'osm',
      type,
      lat,
      lon,
    };
  });

  return items;
}

/**
 * Nominatim OpenStreetMap Search (Secondary fallback)
 */
async function searchNominatim(query) {
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
    query
  )}&format=json&addressdetails=1&limit=5&countrycodes=in`;

  const res = await fetch(url, {
    headers: {
      Accept: 'application/json',
      'User-Agent': 'AJTravelsPuneWeb/1.0',
    },
  });
  if (!res.ok) throw new Error('Nominatim request failed');
  const data = await res.json();

  return (data || []).map((item) => {
    const lat = parseFloat(item.lat);
    const lon = parseFloat(item.lon);
    const detected = detectLocationRegion(item.display_name, lat, lon);

    return {
      id: null,
      placeId: `nom-${item.place_id}`,
      name: item.name || item.display_name.split(',')[0],
      formattedAddress: item.display_name,
      city: detected.city,
      side: detected.side,
      isCustom: true,
      source: 'osm',
      type: item.type || 'address',
      lat,
      lon,
    };
  });
}

/**
 * Main Location Search function:
 * Searches both saved database locations and online autocomplete services
 */
export async function searchLocations({
  query = '',
  savedLocations = [],
  sidePreference = null,
  signal = null,
}) {
  const trimmed = query.trim();

  // 1. Filter matching saved locations from database
  let matchedSaved = [];
  if (savedLocations && savedLocations.length > 0) {
    if (!trimmed) {
      // Return all saved locations if no search term
      matchedSaved = savedLocations.map((loc) => ({
        id: loc.id,
        name: loc.name,
        formattedAddress: `${loc.name}, ${loc.city || (loc.side === 'PUNE_SIDE' ? 'Pune' : 'Mumbai')}`,
        city: loc.city || (loc.side === 'PUNE_SIDE' ? 'Pune' : 'Mumbai'),
        side: loc.side,
        isCustom: false,
        source: 'database',
        type: 'saved',
        lat: null,
        lon: null,
      }));
    } else {
      const qLower = trimmed.toLowerCase();
      matchedSaved = savedLocations
        .filter((loc) => {
          const nameMatch = loc.name.toLowerCase().includes(qLower);
          const cityMatch = (loc.city || '').toLowerCase().includes(qLower);
          const sideMatch = (loc.side || '').toLowerCase().includes(qLower);
          return nameMatch || cityMatch || sideMatch;
        })
        .map((loc) => ({
          id: loc.id,
          name: loc.name,
          formattedAddress: `${loc.name}, ${loc.city || (loc.side === 'PUNE_SIDE' ? 'Pune' : 'Mumbai')}`,
          city: loc.city || (loc.side === 'PUNE_SIDE' ? 'Pune' : 'Mumbai'),
          side: loc.side,
          isCustom: false,
          source: 'database',
          type: 'saved',
          lat: null,
          lon: null,
        }));
    }
  }

  // If query is very short or empty, just return saved database entries
  if (!trimmed || trimmed.length < 2) {
    return {
      saved: matchedSaved,
      custom: [],
      hasCustomResults: false,
    };
  }

  // 2. Check in-memory cache for custom autocomplete
  const cacheKey = `${trimmed.toLowerCase()}_${sidePreference || 'all'}`;
  if (searchCache.has(cacheKey)) {
    return {
      saved: matchedSaved,
      custom: searchCache.get(cacheKey),
      hasCustomResults: true,
    };
  }

  // 3. Perform live address geocoding
  let customResults = [];
  const googleApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

  if (googleApiKey) {
    customResults = await searchGooglePlaces(trimmed, googleApiKey);
  }

  if (!customResults || customResults.length === 0) {
    try {
      customResults = await searchPhoton(trimmed, sidePreference);
    } catch (err) {
      console.warn('Photon geocode warning, trying Nominatim:', err.message);
      try {
        customResults = await searchNominatim(trimmed);
      } catch (nomErr) {
        console.warn('Nominatim geocode warning:', nomErr.message);
        customResults = [];
      }
    }
  }

  // De-duplicate custom results against saved results so the user doesn't see duplicates
  const savedNamesSet = new Set(matchedSaved.map((s) => s.name.toLowerCase()));
  const filteredCustom = customResults.filter(
    (c) => !savedNamesSet.has(c.name.toLowerCase())
  );

  // Store in cache (capped at 50 entries)
  if (searchCache.size > 50) {
    const firstKey = searchCache.keys().next().value;
    searchCache.delete(firstKey);
  }
  searchCache.set(cacheKey, filteredCustom);

  return {
    saved: matchedSaved,
    custom: filteredCustom,
    hasCustomResults: filteredCustom.length > 0,
  };
}
