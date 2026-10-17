// ============================================================
// AJ Travels — Vehicles & Fleet Data
// ============================================================

export const vehiclesData = [
  {
    slug: 'sedan',
    id: 'sedan',
    name: 'Executive Sedan',
    category: 'SEDAN',
    models: 'Maruti Suzuki Dzire / Toyota Etios / Honda Amaze',
    tag: 'MOST POPULAR FOR COMMUTERS',
    metaTitle: 'Sedan Car on Rent in Pune with Driver | Swift Dzire - AJ Travels',
    metaDesc: 'Rent comfortable AC Sedan cabs in Pune. Swift Dzire, Toyota Etios for Pune to Mumbai one-way, airport transfers, and outstation trips at best rates.',
    image: '/assets/sedan.webp',
    passengers: '4 Passengers',
    luggage: '2-3 Medium Bags',
    fareStarting: '₹2,490',
    overview: 'Our Executive Sedan fleet offers the optimal balance of fuel-efficient economy, quiet cabin comfort, and agility on highway expressways. Ideal for solo business travelers, couples, and small nuclear families.',
    features: [
      'Dual Air-Conditioning with rapid cooling',
      'Plush fabric or leatherette seating with ample legroom',
      'Generous 378L+ boot space for standard trolley suitcases',
      'Mobile charging port & USB audio connectivity',
      'All-inclusive toll package available on Pune-Mumbai runs'
    ],
    idealFor: 'Pune to Mumbai airport transfers, daily business meetings, and small family visits.',
    specs: {
      engine: '1.2L DualJet / Petrol-CNG / Diesel',
      seatingCapacity: '4 + 1 Driver',
      bootCapacity: '378 Litres (Fits 2 Trolleys + 2 Handbags)',
      ac: 'Yes, High-Performance Climate Control'
    }
  },
  {
    slug: 'ertiga-suv',
    id: 'suv',
    name: 'Spacious Family SUV (Maruti Ertiga)',
    category: 'SUV',
    models: 'Maruti Suzuki Ertiga / Kia Carens',
    tag: 'BEST VALUE FOR FAMILIES',
    metaTitle: 'Ertiga Car on Rent in Pune with Driver | 6 Seater SUV - AJ Travels',
    metaDesc: 'Hire Maruti Ertiga 6-seater SUV on rent in Pune. Best family cab for Pune to Mumbai, Mahabaleshwar, Shirdi, and airport transfers with ample luggage room.',
    image: '/assets/suv.webp',
    passengers: '6 Passengers',
    luggage: '4 Large Bags',
    fareStarting: '₹3,490',
    overview: 'The Maruti Suzuki Ertiga and Kia Carens are Maharashtra’s favorite family SUVs. Designed with three comfortable seating rows, roof-mounted rear AC blowers, and flexible seating, this category delivers supreme highway ride quality without the bulk of larger commercial vehicles.',
    features: [
      'Roof-mounted rear AC vents keeping 2nd and 3rd row passengers cool',
      'Flexible folding 3rd-row seats expanding luggage room when needed',
      'Smooth suspension optimized for highway cruising and ghat roads',
      'Ample legroom in both front and middle row captain/bench seats',
      'Punctual door-to-door service with verified drivers'
    ],
    idealFor: 'Family airport drops with international luggage, weekend getaways to Mahabaleshwar and Lonavala, and group road trips.',
    specs: {
      engine: '1.5L Smart Hybrid K15C Engine',
      seatingCapacity: '6 + 1 Driver',
      bootCapacity: '209L - 550L expandable boot',
      ac: 'Dual AC with 2nd row overhead blowers'
    }
  },
  {
    slug: 'innova-crysta',
    id: 'premium',
    name: 'Executive Luxury (Toyota Innova Crysta)',
    category: 'INNOVA_CRYSTA',
    models: 'Toyota Innova Crysta 2.4 / 2.8',
    tag: 'SUPREME COMFORT & LUXURY',
    metaTitle: 'Innova Crysta on Rent in Pune with Driver | Luxury Cab - AJ Travels',
    metaDesc: 'Book Toyota Innova Crysta luxury cab in Pune with experienced chauffeur. Reclining captain seats, supreme safety, and pristine interiors for executive travel.',
    image: '/assets/suv.webp',
    passengers: '6-7 Passengers',
    luggage: '4-5 Large Bags',
    fareStarting: '₹4,490',
    overview: 'The Toyota Innova Crysta is internationally recognized as the benchmark in executive long-distance highway luxury. Featuring ergonomic reclining captain seats, exceptional sound insulation, and bulletproof reliability, it turns every road journey into first-class comfort.',
    features: [
      'Ultra-comfortable ergonomic captain chairs with armrests',
      'Whisper-quiet cabin with superior acoustic damping',
      'Automatic multi-zone climate control with personal air vents',
      'Exceptional highway ride stability on the Bhor Ghat curves',
      'Experienced executive chauffeurs accustomed to VIP travel'
    ],
    idealFor: 'VIP delegations, corporate executives, wedding guest transfers, and luxury long-distance tourism.',
    specs: {
      engine: '2.4L Turbo Diesel GD Engine',
      seatingCapacity: '6-7 + 1 Driver',
      bootCapacity: '300L - 750L expandable boot',
      ac: 'Triple-zone automatic climate control'
    }
  },
  {
    slug: 'tempo-traveller',
    id: 'minibus',
    name: 'Luxury Group Coach (Force Tempo Traveller)',
    category: 'TEMPO_TRAVELLER',
    models: 'Force Tempo Traveller 3350 / 4020 Super Luxury',
    tag: 'BEST FOR WEDDINGS & GROUPS',
    metaTitle: 'Tempo Traveller on Rent in Pune | 13, 17, 20 Seater AC - AJ Travels',
    metaDesc: 'Rent luxury AC Tempo Traveller in Pune for outstation tours, weddings, and corporate events. 13, 17, 20 seater options with pushback seats and music system.',
    image: '/assets/pune-mumbai-travel-banner.webp',
    passengers: '12 - 20 Passengers',
    luggage: '10+ Big Bags',
    fareStarting: '₹6,490',
    overview: 'Keep your entire group laughing, chatting, and celebrating together. Our 13-seater, 17-seater, and 20-seater Force Tempo Travellers are outfitted with individual luxury pushback seats, wide panoramic windows, personal charging sockets, and expansive rear luggage compartments.',
    features: [
      '2x1 or 1x1 luxury high-back reclining captain seats',
      'High-capacity roof-mounted ducted air conditioning',
      'State-of-the-art music system, mic, and LED ambient lighting',
      'Huge separate luggage deck accommodating all bags easily',
      'Commercial licensed interstate chauffeurs with deep route expertise'
    ],
    idealFor: 'Wedding guest shuttles, Shirdi-Nashik-Trimbakeshwar pilgrimages, Goa holiday road trips, and corporate team offsites.',
    specs: {
      engine: '2.6L FM CR DI Turbocharged Engine',
      seatingCapacity: '13 to 20 + 1 Driver',
      bootCapacity: 'Dedicated High-Volume Rear Storage',
      ac: 'Roof-mounted ducted commercial AC'
    }
  }
];

export const getVehicleBySlug = (slug) => {
  return vehiclesData.find(v => v.slug === slug || v.id === slug);
};
