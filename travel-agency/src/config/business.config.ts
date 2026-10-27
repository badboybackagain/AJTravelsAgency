export interface VehicleOption {
  id: string;
  name: string;
  category: string;
  passengers: string;
  luggage: string;
  features: string[];
  idealFor: string;
  image: string;
  tag?: string;
}

export interface BusinessConfig {
  businessName: string;
  tagline: string;
  phone: string;
  phoneDisplay: string;
  phoneSecondary?: string;
  phoneSecondaryDisplay?: string;
  whatsapp: string;
  email: string;
  emailSupport?: string;
  address: string;
  businessHours: string;
  googleBusinessProfileUrl: string;
  googleReviewUrl: string;
  dispatchDisclaimer: string;
  serviceAreas: {
    pune: string[];
    mumbai: string[];
  };
  vehicles: VehicleOption[];
}

export const businessConfig: BusinessConfig = {
  businessName: "AJ Travels",
  tagline: "Premier Vehicle Rentals & Intercity Chauffeured Travel",
  phone: "+917447443536",
  phoneDisplay: "+91 7447443536",
  phoneSecondary: "+918421051299",
  phoneSecondaryDisplay: "+91 8421051299",
  whatsapp: "917447443536",
  email: "ajtravelpune@gmail.com",
  emailSupport: "support@ajtravelspune.com",
  address: "Old Mumbai–Pune Highway, Nashik Fata, Kasarawadi, Pune 411064",
  businessHours: "24 Hours / 7 Days a Week",
  googleBusinessProfileUrl: "https://maps.google.com",
  googleReviewUrl: "https://maps.google.com",
  dispatchDisclaimer: "Fast vehicle availability with a 30-minute dispatch/arrival target in supported areas, subject to location, traffic and vehicle availability.",
  serviceAreas: {
    pune: [
      "Pune",
      "Hinjawadi",
      "Wakad",
      "Baner",
      "Aundh",
      "Kothrud",
      "Viman Nagar",
      "Kharadi",
      "Hadapsar",
      "Shivajinagar",
      "Koregaon Park",
      "Pimpri-Chinchwad",
      "Pune Airport (PNQ)"
    ],
    mumbai: [
      "Mumbai",
      "Andheri",
      "Bandra",
      "BKC (Bandra Kurla Complex)",
      "Powai",
      "Borivali",
      "Dadar",
      "Thane",
      "Navi Mumbai",
      "Vashi",
      "Panvel",
      "Mumbai Airport (BOM T1 & T2)"
    ]
  },
  vehicles: [
    {
      id: "sedan",
      name: "Executive Sedan",
      category: "Sedan (Dzire / Etios or equivalent)",
      passengers: "1 - 4 Passengers",
      luggage: "2 Medium Bags",
      features: ["AC", "Clean Leatherette Seats", "Ample Legroom", "USB Charger", "Experienced Driver"],
      idealFor: "Individual business travelers, couples, and small families seeking economical private travel.",
      image: "/assets/sedan.webp",
      tag: "Most Popular"
    },
    {
      id: "suv",
      name: "Spacious SUV",
      category: "SUV (Innova / Ertiga / Carens or equivalent)",
      passengers: "1 - 6 Passengers",
      luggage: "4 Large Bags",
      features: ["Dual AC", "Reclining Seats", "Extra Boot Space", "Highway Comfort Suspension", "Top Driver"],
      idealFor: "Families, long airport transfers, and groups carrying heavy luggage.",
      image: "/assets/suv.webp",
      tag: "Best for Families"
    },
    {
      id: "premium",
      name: "Premium / Luxury Class",
      category: "Executive Luxury (Crysta / Camry / Mercedes)",
      passengers: "1 - 4 Passengers",
      luggage: "3 Large Bags",
      features: ["Premium Interior", "Ambient Lighting", "Complimentary Water", "Quiet Cabin", "Chauffeur Trained"],
      idealFor: "VIP executive travel, corporate delegates, special occasions, and high-comfort rides.",
      image: "/assets/luxury.jpg",
      tag: "Executive Class"
    },
    {
      id: "minibus",
      name: "Luxury Mini Bus",
      category: "Tempo Traveller / Mini Bus (12 - 20 Seater)",
      passengers: "7 - 20 Passengers",
      luggage: "8 - 14 Bags",
      features: ["Pushback Reclining Seats", "Individual AC Vents", "High Roof & Spacious Aisle", "Dedicated Luggage Space", "Intercity Special Permit"],
      idealFor: "Outing groups, corporate teams, pre-wedding trips, and 7 to 20 passenger group travel.",
      image: "/assets/minibus.jpg",
      tag: "Group Choice"
    }
  ]
};
