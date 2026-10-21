// ============================================================
// AJ Travels — Homepage Centralized Content Store
// Single Source of Truth for all Homepage Copy, Metadata,
// Destination Cards, Fleet Showcases, FAQs, and CTAs.
// ============================================================

export const homepageContent = {
  // 1. Homepage SEO & OpenGraph Metadata
  seo: {
    pageTitle: "Car Rental in Pune with Driver | Outstation Cabs & Airport Transfers - AJ Travels",
    metaDescription: "Book car rental in Pune with driver at transparent all-inclusive rates. Swift Dzire, Ertiga SUV, Innova Crysta, and Tempo Traveller for Pune to Mumbai, airport transfers, and outstation trips.",
    canonicalUrl: "https://ajtravelspune.com/",
    h1Title: "Car Rental in Pune with Driver & Outstation Cab Service",
    h1Subtitle: "Reliable Intercity Cabs, Airport Transfers & Chauffeur-Driven Vehicles across Maharashtra",
    keywords: [
      "car rental in Pune with driver",
      "car on rent in Pune",
      "chauffeur-driven car rental Pune",
      "Pune to Mumbai cab",
      "Innova rental in Pune",
      "Ertiga rental in Pune",
      "tempo traveller on rent in Pune",
      "Pune airport taxi transfer",
      "outstation cab from Pune",
      "corporate car rental in Pune"
    ]
  },

  // 2. Hero Section
  hero: {
    eyebrow: "AJ TRAVELS • CHAUFFEUR-DRIVEN CAR RENTAL IN PUNE & OUTSTATION CABS",
    titlePrimary: "Car Rental in Pune with Driver & Outstation Cabs",
    titleSecondary: "Intercity Cabs, Airport Transfers & Chauffeur-Driven Vehicles",
    description: "Doorstep pickup across Pune and PCMC with sanitized Sedans, Maruti Ertiga, Toyota Innova Crysta, and luxury Tempo Travellers. Experienced highway chauffeurs, 24/7 travel desk, and transparent pricing with expressway tolls included.",
    bgImage: "/assets/hero-luxury-cars.jpg",
    bgImageAlt: "AJ Travels Executive Cab Fleet - Sedans, SUVs and Tempo Travellers in Pune",
    trustChips: [
      { text: "30-Min Fast Dispatch", color: "green" },
      { text: "Expressway Tolls Included", color: "sky" },
      { text: "Verified Highway Drivers", color: "amber" },
      { text: "24/7 Travel Desk Support", color: "blue" }
    ],
    dispatchNotice: {
      headline: "Prompt Doorstep Dispatch:",
      text: "Fast 30-min pickup target across Pune, Hinjawadi, PCMC, and Mumbai hubs."
    },
    ctaCalculateText: "Check Fares & Book",
    ctaWhatsAppText: "Chat on WhatsApp"
  },

  // 3. Trust Bar Strip
  trustBar: [
    { id: "fleet", icon: "Car", title: "VERIFIED FLEET", desc: "Sedans, Ertiga, Innova Crysta & Tempo" },
    { id: "clean", icon: "Sparkles", title: "SANITIZED CABIN", desc: "Clean interiors with dual air conditioning" },
    { id: "drivers", icon: "UserCheck", title: "VERIFIED DRIVERS", desc: "Polite, highway-trained chauffeurs" },
    { id: "doorstep", icon: "MapPin", title: "DOORSTEP PICKUP", desc: "Direct pickup from home, office, or airport" },
    { id: "pricing", icon: "ShieldCheck", title: "ALL-INCLUSIVE TOLLS", desc: "Clear flat pricing with tolls included" },
    { id: "support", icon: "Clock", title: "24/7 TRAVEL DESK", desc: "Instant phone & WhatsApp assistance" }
  ],

  // 4. Destinations Spotlight (Travel Agency Coverage Across Maharashtra)
  destinationsSpotlight: {
    badge: "POPULAR TRAVEL DESTINATIONS",
    title: "Trending Outstation Travel Corridors from Pune",
    subtitle: "From daily corporate express routes to scenic hill station holidays and sacred pilgrimage circuits, AJ Travels connects you seamlessly with verified doorstep service.",
    destinations: [
      {
        id: "pune-mumbai",
        name: "Mumbai & Airport Transfers",
        city: "Mumbai & BOM Airport",
        category: "Express Intercity",
        title: "PUNE ↔ MUMBAI EXPRESSWAY & AIRPORT",
        tagline: "Connecting Pune with BKC, Andheri, South Mumbai & CSMIA Airport T1/T2.",
        image: "/assets/pune-to-mumbai-premium-travel-banner.webp",
        desc: "Maharashtra's busiest travel corridor. Enjoy smooth, stress-free travel via the Mumbai-Pune Expressway with doorstep pickup in Hinjawadi, Baner, Kothrud, or Viman Nagar straight to your Mumbai destination or airport departure terminal.",
        popularRoute: "Pune City / Airport → Mumbai (BKC / Airport / South Mumbai)",
        estTime: "3 Hours 15 Mins",
        url: "/pune-to-mumbai-one-way-cab/",
        pickupKey: "pune",
        dropKey: "mumbai"
      },
      {
        id: "mahabaleshwar",
        name: "Mahabaleshwar & Panchgani",
        city: "Satara / Western Ghats",
        category: "Hill Station Tour",
        title: "MAHABALESHWAR & PANCHGANI ESCAPE",
        tagline: "Scenic ghat journeys, strawberry farms, viewpoints & family getaways.",
        image: "/assets/suv.webp",
        desc: "Breathe fresh mountain air without the fatigue of driving. Our experienced hill-road chauffeurs take you via Wai and Pasarni Ghat to Venna Lake, Arthur's Seat, Mapro Garden, and Table Land in air-conditioned comfort.",
        popularRoute: "Pune → Wai → Panchgani → Mahabaleshwar",
        estTime: "3 Hours Express",
        url: "/pune-to-mahabaleshwar-cab/",
        pickupKey: "pune",
        dropKey: "mahabaleshwar"
      },
      {
        id: "shirdi",
        name: "Shirdi & Shani Shingnapur",
        city: "Ahmednagar District",
        category: "Pilgrimage Corridor",
        title: "SHIRDI SAI BABA DARSHAN CORRIDOR",
        tagline: "Same-day or multi-day sacred pilgrimage travel with family waiting.",
        image: "/assets/sedan.webp",
        desc: "Peaceful and punctual pilgrimage trips to Sai Baba Samadhi Temple and Shani Shingnapur. Vehicles equipped with spacious luggage capacity and flexible waiting options for morning and evening Kakad Aarti.",
        popularRoute: "Pune → Sangamner → Shirdi Temple Complex",
        estTime: "4 Hours 30 Mins",
        url: "/pune-to-shirdi-cab/",
        pickupKey: "pune",
        dropKey: "shirdi"
      },
      {
        id: "lonavala",
        name: "Lonavala & Khandala",
        city: "Pune District / Ghats",
        category: "Weekend Gateway",
        title: "LONAVALA & KHANDALA HILL RETREATS",
        tagline: "Tiger Point, Bhushi Dam, Karla Caves & expressway day outings.",
        image: "/assets/pune-mumbai-travel-banner.webp",
        desc: "The ultimate short break from Pune. Perfect for monsoon waterfall tours, company day outings, and weekend family picnics with doorstep pickup and same-day round-trip packages.",
        popularRoute: "Pune → Expressway → Lonavala / Khandala",
        estTime: "1 Hour 15 Mins",
        url: "/pune-to-lonavala-cab/",
        pickupKey: "pune",
        dropKey: "lonavala"
      },
      {
        id: "nashik",
        name: "Nashik & Trimbakeshwar",
        city: "Nashik Region",
        category: "Religious & Wine Hub",
        title: "NASHIK WINE CAPITAL & TRIMBAKESHWAR",
        tagline: "Jyotirlinga pilgrimage, Panchavati heritage & Sula Vineyards tours.",
        image: "/assets/suv.webp",
        desc: "Comfortable highway cab service connecting Pune with Trimbakeshwar Temple, Muktidham, and famous vineyard tours. Enjoy dedicated one-way or round-trip journeys with complete vehicle privacy.",
        popularRoute: "Pune → Narayangaon → Sangamner → Nashik",
        estTime: "4 Hours 45 Mins",
        url: "/pune-to-nashik-cab/",
        pickupKey: "pune",
        dropKey: "nashik"
      },
      {
        id: "alibaug-goa",
        name: "Alibaug & Goa Coastal Rides",
        city: "Konkan Coast & Goa",
        category: "Beach Vacations",
        title: "ALIBAUG BEACHES & GOA EXPRESS",
        tagline: "Coastal getaways, beach resorts, fort explorations & extended tours.",
        image: "/assets/sedan.webp",
        desc: "Heading to the coast? AJ Travels offers dependable sedans, family SUVs, and group Tempo Travellers with ample boot space for luggage, beach gear, and extended road-trip itineraries.",
        popularRoute: "Pune → Khopoli / Express Highway → Alibaug / Goa",
        estTime: "Flexible Intercity Travel",
        url: "/pune-to-alibaug-cab/",
        pickupKey: "pune",
        dropKey: "alibaug"
      }
    ]
  },

  // 5. Express Transport Categories (Services Breakdown)
  categoriesSection: {
    badge: "COMPREHENSIVE FLEET & SERVICE OPTIONS",
    title: "Chauffeur-Driven Car & Tempo Traveller Rentals in Pune",
    subtitle: "From individual corporate commutes to family vacations and group pilgrimages, select the ideal vehicle tailored to your passenger count, luggage, and schedule.",
    categories: [
      {
        id: "cabs",
        title: "SEDAN CAR RENTAL",
        badge: "4-SEATER SWIFT DZIRE & ETIOS",
        bgImg: "/assets/sedan.webp",
        description: "Fuel-efficient, clean AC sedans like Swift Dzire and Toyota Etios. Ideal for couples, business professionals, and small families booking car rental in Pune with driver.",
        routes: [
          { from: "PUNE", to: "MUMBAI CITY", type: "One-Way Express", est: "All-Inclusive", note: "Expressway Tolls & Taxes Included", link: "/pune-to-mumbai-one-way-cab/" },
          { from: "PUNE", to: "MAHABALESHWAR", type: "Round-Trip Tour", est: "Custom Package", note: "Sightseeing Waiting Included", link: "/pune-to-mahabaleshwar-cab/" },
          { from: "PUNE", to: "SHIRDI", type: "Same-Day Darshan", est: "All-Inclusive", note: "Aarti Schedule Flexibility", link: "/pune-to-shirdi-cab/" }
        ]
      },
      {
        id: "suv",
        title: "6-SEATER SUV RENTAL",
        badge: "MARUTI ERTIGA & KIA CARENS",
        bgImg: "/assets/suv.webp",
        description: "Reclining ergonomic seating, dual AC vents, and generous luggage capacity. Ideal for family airport runs, hill station tours, and outstation trips across Maharashtra.",
        routes: [
          { from: "PUNE RESIDENCE", to: "MUMBAI AIRPORT (BOM)", type: "Flight Transfer", est: "Flight Tracked", note: "Doorstep Pickup & Luggage Assist", link: "/pune-to-mumbai-airport-cab/" },
          { from: "PUNE", to: "NASHIK / TRIMBAK", type: "Outstation Package", est: "All-Inclusive", note: "Comfort Highway Suspension", link: "/pune-to-nashik-cab/" },
          { from: "PUNE", to: "LONAVALA HILLS", type: "Day Picnic", est: "Round Trip", note: "Custom Stops Allowed", link: "/pune-to-lonavala-cab/" }
        ]
      },
      {
        id: "minibus",
        title: "TEMPO TRAVELLER ON RENT",
        badge: "12, 17 & 20-SEATER COACHES",
        bgImg: "/assets/pune-mumbai-travel-banner.webp",
        description: "Luxury high-roof Force Tempo Travellers with pushback seats, individual AC vents, and large luggage space. Ideal for wedding guest transfers, corporate offsites, and group pilgrimage tours.",
        routes: [
          { from: "PUNE / PCMC", to: "MUMBAI EVENTS", type: "13-Seater Tempo", est: "Special Permit", note: "Pushback Seats & Music System", link: "/tempo-traveller-on-rent-in-pune/" },
          { from: "PUNE", to: "SHIRDI / SHANI", type: "17-Seater Group", est: "All-Inclusive", note: "Dedicated Safe Chauffeur", link: "/tempo-traveller-on-rent-in-pune/" },
          { from: "PUNE", to: "GOA / KONKAN", type: "20-Seater Coach", est: "Multi-Day Tour", note: "Interstate Permits Handled", link: "/tempo-traveller-on-rent-in-pune/" }
        ]
      }
    ]
  },

  // 6. Travel Corridors & Guidance (Two Complementary Sections)
  corridors: {
    intercity: {
      id: "intercity-express",
      badge: "PREMIER INTERCITY CONNECTIVITY",
      title: "Pune to Mumbai Expressway Cab Service",
      subtitle: "Experience Maharashtra's premier intercity travel corridor with prompt doorstep pickup across Pune & PCMC, verified expressway drivers, and all expressway tolls included.",
      image: "/assets/sedan.webp",
      imageAlt: "Pune to Mumbai Expressway private cab transfer by AJ Travels",
      features: [
        { title: "Direct Doorstep Pickup", desc: "Pickup from any residence, tech park, or hotel in Pune & PCMC straight to Mumbai." },
        { title: "100% Toll-Inclusive Pricing", desc: "Quotes include Yashwantrao Chavan Expressway tolls and state taxes with zero surprises." },
        { title: "Dedicated Private Vehicle", desc: "No shared passengers, no detours, and complete cabin privacy for you and your family." },
        { title: "Airport Transfers (BOM & PNQ)", desc: "Flight-tracked pickups from Chhatrapati Shivaji Maharaj International Airport (T1 & T2)." },
        { title: "24/7 Departure Flexibility", desc: "Travel whenever you need—early morning flights, late-night emergencies, or mid-day meetings." },
        { title: "Corporate Billing & Invoicing", desc: "GST-compliant invoices and dedicated corporate travel coordination available on request." }
      ],
      ctaText: "CALCULATE EXPRESS FARE",
      ctaUrl: "/fare?tripType=ONE_WAY&pickupId=pune&dropId=mumbai&pickupName=Pune+(All+Areas)&dropName=Mumbai+(All+Areas)",
      articleUrl: "/pune-to-mumbai-one-way-cab/"
    },
    outstationHolidays: {
      id: "outstation-holidays",
      badge: "MAHARASHTRA OUTSTATION PACKAGES",
      title: "Chauffeur-Driven Outstation Car Rental in Pune",
      subtitle: "Explore Western India's celebrated hill stations, pilgrimage shrines, and coastal retreats with customized one-way and round-trip outstation cab packages.",
      image: "/assets/suv.webp",
      imageAlt: "Outstation tourist cab service in Pune by AJ Travels",
      features: [
        { title: "Custom Sightseeing Itineraries", desc: "Explore viewpoints, temples, and markets in Mahabaleshwar, Shirdi, or Nashik on your schedule." },
        { title: "Experienced Highway Chauffeurs", desc: "Courteous drivers well-versed in ghat navigation, safe mountain driving, and optimal routes." },
        { title: "Transparent Driver Allowances", desc: "Clear day-rates and overnight allowances with zero hidden fee disputes." },
        { title: "Family-Friendly Sanitized Cabs", desc: "Child-safe, clean seating with functioning seatbelts and dual air conditioning." },
        { title: "Hourly Local Rentals Available", desc: "Rent a car with driver in Pune for 4hr/40km, 8hr/80km, or 12hr/120km city duty." },
        { title: "Round-Trip Price Advantage", desc: "Cost-effective round-trip packages where waiting time is budgeted transparently." }
      ],
      ctaText: "EXPLORE DESTINATIONS",
      ctaUrl: "/services",
      articleUrl: "/car-rental-in-pune-with-driver/"
    }
  },

  // 7. One-Way vs Round-Trip Travel
  tripOptions: {
    badge: "FLEXIBLE BOOKING MODES",
    title: "One-Way Cab vs Round-Trip Car Rental",
    subtitle: "Choose between single-direction point-to-point travel with zero return charges, or reserve your vehicle and chauffeur for multi-day outstation journeys.",
    oneWay: {
      id: "one-way-cabs",
      badge: "ONE WAY TRAVEL • NO RETURN CHARGE",
      title: "One-Way Intercity Cabs",
      desc: "Pay only for the distance you travel. Never pay two-way charges when you only need a drop to Mumbai, airport terminals, or neighboring cities.",
      features: [
        "100% private cab with zero shared co-passengers",
        "Doorstep pickup at your exact residence, hotel, or office",
        "Direct drop at your final destination address or airport gate",
        "All highway toll taxes and driver allowances included",
        "Instant server-verified quote before confirmation"
      ],
      buttonText: "BOOK ONE-WAY CAB",
      tripType: "ONE_WAY"
    },
    roundTrip: {
      id: "round-trip-cabs",
      badge: "ROUND TRIP TRAVEL • MAXIMUM FREEDOM",
      title: "Round-Trip & Multi-Day Rentals",
      desc: "Keep the vehicle and experienced chauffeur at your disposal for business meetings, doctor visits, family functions, or weekend holiday tours.",
      features: [
        "Same dedicated vehicle and trusted driver for the entire trip",
        "Flexible departure times and custom en-route rest stops",
        "Local destination sightseeing and multiple stops included",
        "Convenient return to your original pickup address",
        "Available for Sedans, 6-Seater SUVs, and Tempo Travellers"
      ],
      buttonText: "BOOK ROUND TRIP",
      tripType: "ROUND_TRIP"
    }
  },

  // 8. Fleet & Vehicles Discovery
  fleet: {
    badge: "EXECUTIVE FLEET CATALOGUE",
    title: "Our Verified Chauffeured Fleet in Pune",
    subtitle: "From economical daily sedans to executive SUVs and high-capacity luxury coaches. Every vehicle is thoroughly sanitized, mechanically inspected, and GPS-monitored.",
    vehicles: [
      {
        id: "sedan",
        name: "Executive Sedan",
        category: "Swift Dzire / Toyota Etios",
        passengers: "1 - 4 Passengers",
        luggage: "2 Medium Bags",
        features: ["Clean AC Cabin", "Generous Legroom", "USB Phone Charging", "Experienced Highway Driver"],
        idealFor: "Swift Dzire rental in Pune for individual business commuters, airport transfers, and couples.",
        image: "/assets/sedan.webp",
        tag: "Most Popular",
        url: "/swift-dzire-car-on-rent-with-driver-in-pune/"
      },
      {
        id: "suv",
        name: "Family SUV",
        category: "Maruti Ertiga / Kia Carens",
        passengers: "1 - 6 Passengers",
        luggage: "3 - 4 Large Bags",
        features: ["Dual Air Conditioning", "Reclining Middle Row", "Spacious Boot", "Smooth Highway Suspension"],
        idealFor: "Ertiga & Kia Carens rental in Pune for family vacations, airport transfers, and outstation trips.",
        image: "/assets/suv.webp",
        tag: "Best for Families",
        url: "/ertiga-car-on-rent-in-pune/"
      },
      {
        id: "premium",
        name: "Innova Crysta Luxury",
        category: "Toyota Innova Crysta",
        passengers: "1 - 7 Passengers",
        luggage: "4 - 5 Large Bags",
        features: ["Plush Captain Seats", "Whisper Quiet Cabin", "Rear Climate Control", "Executive Chauffeur"],
        idealFor: "Innova rental in Pune for corporate delegations, VIP airport pickups, and long-distance luxury.",
        image: "/assets/pune-to-mumbai-premium-travel-banner.webp",
        tag: "Executive Class",
        url: "/innova-car-on-rent-in-pune/"
      },
      {
        id: "minibus",
        name: "Luxury Tempo Traveller",
        category: "13 to 20-Seater Mini Coach",
        passengers: "8 - 20 Passengers",
        luggage: "10 - 16 Large Bags",
        features: ["Pushback Reclining Seats", "Individual AC Vents", "High Ceiling & Wide Aisle", "Interstate State Permits"],
        idealFor: "Tempo Traveller on rent in Pune for weddings, pilgrimage groups, and corporate offsites.",
        image: "/assets/pune-mumbai-travel-banner.webp",
        tag: "Group Choice",
        url: "/tempo-traveller-on-rent-in-pune/"
      }
    ]
  },

  // 9. Frequently Asked Questions (Homepage FAQ Schema Source)
  faqs: [
    {
      id: 1,
      category: "services",
      categoryLabel: "Services & Scope",
      q: "What car rental and cab services does AJ Travels provide in Pune?",
      a: "AJ Travels provides chauffeur-driven car rental in Pune, intercity outstation cabs, one-way and round-trip routes (including Pune to Mumbai, Mahabaleshwar, Shirdi, and Nashik), dedicated airport transfers for Pune Airport (PNQ) and Mumbai Airport (BOM), local hourly rentals with driver (4hr, 8hr, 12hr packages), and luxury Tempo Traveller rentals for group travel."
    },
    {
      id: 2,
      category: "pricing",
      categoryLabel: "Fares & Tolls",
      q: "Are expressway tolls and taxes included in the cab fare?",
      a: "Yes. All outstation quotes provided by AJ Travels feature 100% transparent pricing where expressway toll plaza charges, state entry taxes, and driver allowances are clearly accounted for. You pay only the agreed quote with zero surprise surcharges."
    },
    {
      id: 3,
      category: "booking",
      categoryLabel: "Booking Process",
      q: "How can I book a car on rent in Pune with driver?",
      a: "You can calculate fares and book instantly online through our Fare Calculator, or reach our 24/7 travel desk on WhatsApp or call at +91 91561 83915. Share your pickup address, destination, date, and preferred vehicle to receive confirmed pricing."
    },
    {
      id: 4,
      category: "routes",
      categoryLabel: "Outstation Destinations",
      q: "Which destinations do you serve from Pune?",
      a: "We operate intercity cabs and tour packages from Pune to all major Maharashtra destinations including Mumbai (all localities, BKC, South Mumbai), Chhatrapati Shivaji Maharaj International Airport (BOM), Mahabaleshwar, Panchgani, Lonavala, Khandala, Shirdi, Shani Shingnapur, Nashik, Trimbakeshwar, Alibaug, Lavasa, and Goa."
    },
    {
      id: 5,
      category: "airport",
      categoryLabel: "Airport Transfers",
      q: "Do you offer flight-tracked airport pickups and drop-offs?",
      a: "Yes. We operate 24/7 airport taxi transfers to and from Pune Airport (PNQ) and Mumbai International Airport (BOM T1 & T2). Our operations desk tracks inbound flight statuses to ensure your chauffeur is waiting punctually at the arrival terminal even if your flight is delayed."
    },
    {
      id: 6,
      category: "fleet",
      categoryLabel: "Vehicles & Group Travel",
      q: "Can I hire a 13-seater, 17-seater, or 20-seater Tempo Traveller on rent in Pune?",
      a: "Yes. We provide 13-seater, 17-seater, and 20-seater luxury Force Tempo Travellers on rent in Pune and PCMC. Equipped with pushback reclining seats, ducted AC, and generous luggage space, they are ideal for weddings, family vacations, corporate offsites, and pilgrimage tours."
    },
    {
      id: 7,
      category: "local",
      categoryLabel: "Local Car Rental",
      q: "Do you provide car rental with driver for local Pune city travel?",
      a: "Yes. We offer local hourly rental packages in Pune including 4 Hours / 40 KM, 8 Hours / 80 KM, and 12 Hours / 120 KM. Perfect for city business meetings, medical visits, shopping tours, and local sightseeing across Pune and PCMC."
    },
    {
      id: 8,
      category: "safety",
      categoryLabel: "Safety & Drivers",
      q: "How experienced and verified are your chauffeurs?",
      a: "All AJ Travels chauffeurs are police-verified, background-checked highway specialists. They possess extensive driving experience across Maharashtra highways, mountain ghats, and monsoon conditions, and are trained to provide polite, professional customer service."
    }
  ],

  // 10. Final Call to Action
  finalCta: {
    badge: "PLAN YOUR JOURNEY WITH AJ TRAVELS",
    title: "Ready to Travel with Maharashtra's Trusted Cab Agency?",
    description: "Tell us your starting point, destination, date, and vehicle preference. Our 24/7 travel desk will assist you with confirmed flat fares, vehicle availability, and instant booking.",
    phoneDisplay: "+91 7447443536",
    phoneSecondaryDisplay: "+91 8421051299",
    phoneRaw: "+917447443536",
    phoneSecondaryRaw: "+918421051299",
    whatsappNumber: "917447443536",
    address: "Old Mumbai–Pune Highway, Nashik Fata, Kasarawadi, Pune 411064",
    ctaButtons: {
      whatsapp: "Book on WhatsApp",
      call: "Call 24/7 Desk",
      online: "Book Cab Online",
      quote: "Get Instant Quote"
    }
  }
};
