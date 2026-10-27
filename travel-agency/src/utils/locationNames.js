// ============================================================
// AJ Travels — Human-Readable Location & Corridor Mapping
// ============================================================

export const LOCATION_DISPLAY_NAMES = {
  'pune': 'Pune (All Areas)',
  'mumbai': 'Mumbai (All Areas)',
  'shirdi': 'Shirdi',
  'nashik': 'Nashik',
  'goa': 'Goa',
  'mahabaleshwar': 'Mahabaleshwar',
  'lonavala': 'Lonavala & Khandala',
  'alibaug': 'Alibaug',
  'bhimashankar': 'Bhimashankar',
  'ashtavinayak-temples': 'Ashtavinayak Temples',
  'alandi': 'Alandi',
  'jejuri': 'Jejuri',
  'pandharpur': 'Pandharpur',
  'matheran': 'Matheran',
  'lavasa': 'Lavasa',
  'imagica': 'Imagica Theme Park (Khopoli)',
  'wet-n-joy': 'Wet N Joy Waterpark (Lonavala)',
  'khadakwasla': 'Khadakwasla Dam',
  'mulshi-dam': 'Mulshi Dam',
  'rajgad-fort': 'Rajgad Fort',
  'sinhagad-fort': 'Sinhagad Fort',
  'shivneri-fort': 'Shivneri Fort'
};

export const getLocationDisplayName = (id) => {
  if (!id) return '';
  const clean = id.toLowerCase().trim();
  if (LOCATION_DISPLAY_NAMES[clean]) return LOCATION_DISPLAY_NAMES[clean];
  return clean
    .split('-')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
};
