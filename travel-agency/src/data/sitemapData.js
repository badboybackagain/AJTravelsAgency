import masterUrlInventory from './masterUrlInventory.json';
import { livePagesContent } from './livePagesContent';
import { blogPosts } from './blogData';
import { servicesData } from './servicesData';
import { vehiclesData } from './vehiclesData';

// Map blog posts for quick lookup
const blogMap = new Map(blogPosts.map(b => [b.slug, b]));

// Helper to provide clean, customer-friendly names
const CLEAN_TITLES = {
  '/': 'Home — AJ Travels',
  '/booking': 'Book Cab Online (Reservation Desk)',
  '/fare': 'Fare Calculator & Expressway Tolls',
  '/sitemap': 'HTML Sitemap (All Pages)',
  '/about-us/': 'About AJ Travels (Safety & Standards)',
  '/about': 'About AJ Travels',
  '/contact-us/': 'Contact Support & 24/7 Dispatch Desk',
  '/contact': 'Contact Support',
  '/services/': 'All Services & Travel Offerings Overview',
  '/vehicles/': 'Fleet & Vehicle Selection Overview',
  '/blog/': 'Travel Guides & Route Advice Blog Directory',
  '/pune-to-mumbai-one-way-cab/': 'Pune to Mumbai One-Way Cab Service',
  '/pune-to-mumbai-taxi-guide/': 'Pune to Mumbai Taxi & Travel Guide',
  '/pune-to-mumbai-pickup-and-drop-cab-service/': 'Pune to Mumbai Pickup & Drop Cab Service',
  '/pune-to-mumbai-the-best-cab-service-for-your-journey/': 'Pune to Mumbai Premium Cab Service',
  '/pune-to-mahabaleshwar-cab/': 'Pune to Mahabaleshwar Outstation Cab',
  '/pune-to-mahabaleshwar-pickup-and-drop-cab-service/': 'Pune to Mahabaleshwar Pickup & Drop Service',
  '/pune-to-shirdi-pickup-and-drop-cab-service/': 'Pune to Shirdi Sai Baba Darshan Cab',
  '/pune-to-lonavala-pickup-and-drop-cab-service/': 'Pune to Lonavala & Khandala Cab Service',
  '/pune-to-nashik-pickup-and-drop-cab-service/': 'Pune to Nashik Wine Capital Cab Service',
  '/pune-to-goa-pickup-and-drop-cab-service/': 'Pune to Goa Highway Cab Service',
  '/pune-to-alibaug-pickup-and-drop-cab-service/': 'Pune to Alibaug Coastal Beach Cab',
  '/pune-to-bhimashankar-pickup-and-drop-cab-service/': 'Pune to Bhimashankar Jyotirlinga Cab',
  '/pune-to-ashtavinayak-temples-pickup-and-drop-cab-service/': 'Pune to Ashtavinayak 8 Temples Tour',
  '/pune-to-alandi-pickup-and-drop-cab-service/': 'Pune to Alandi Sant Dnyaneshwar Samadhi Cab',
  '/pune-to-jejuri-pickup-and-drop-cab-service/': 'Pune to Khandoba Mandir Jejuri Cab',
  '/pune-to-pandharpur-pickup-and-drop-cab-service/': 'Pune to Pandharpur Vitthal Mandir Cab',
  '/pune-to-matheran-pickup-and-drop-cab-service/': 'Pune to Matheran Hill Station Cab',
  '/pune-to-lavasa-pickup-and-drop-cab-service/': 'Pune to Lavasa City Cab Service',
  '/pune-to-imagica-pickup-and-drop-cab-service/': 'Pune to Imagica Theme Park Cab',
  '/pune-to-wet-n-joy-pickup-and-drop-cab-service/': 'Pune to Wet\'nJoy Waterpark Cab',
  '/pune-to-khadakwasla-pickup-and-drop-cab-service/': 'Pune to Khadakwasla Dam Cab',
  '/pune-to-mulshi-dam-pickup-and-drop-cab-service/': 'Pune to Mulshi Dam Scenic Cab',
  '/pune-to-rajgad-fort-pickup-and-drop-cab-service/': 'Pune to Rajgad Fort Trekking Cab',
  '/pune-to-sinhagad-fort-pickup-and-drop-cab-service/': 'Pune to Sinhagad Fort Day Trip Cab',
  '/pune-to-shivneri-fort-pickup-and-drop-cab-service/': 'Pune to Shivneri Fort Historical Cab',
  '/7-seater-cabs-on-rent-from-pune-to-mumbai/': '7-Seater Ertiga Cab: Pune to Mumbai',
  '/7-seater-cabs-on-rent-from-mumbai-to-pune/': '7-Seater Ertiga Cab: Mumbai to Pune',
  '/9-seater-cabs-on-rent-from-pune-to-mumbai/': '9-Seater Cab: Pune to Mumbai',
  '/9-seater-cabs-on-rent-from-mumbai-to-pune/': '9-Seater Cab: Mumbai to Pune',
  '/swift-dzire-car-on-rent-with-driver-in-pune/': 'Swift Dzire with Driver in Pune',
  '/swift-dzire-car-on-rent-with-driver-in-pcmc/': 'Swift Dzire with Driver in PCMC',
  '/ertiga-car-on-rent-in-pune/': 'Maruti Ertiga 6-Seater SUV in Pune',
  '/ertiga-car-on-rent-in-pcmc/': 'Maruti Ertiga 6-Seater SUV in PCMC',
  '/innova-car-on-rent-in-pune/': 'Toyota Innova Luxury Cab in Pune',
  '/innova-car-on-rent-with-driver-in-pcmc/': 'Toyota Innova with Driver in PCMC',
  '/kia-carens-car-on-rent-with-driver-in-pune/': 'Kia Carens with Driver in Pune',
  '/kia-carens-car-on-rent-with-driver-in-pcmc/': 'Kia Carens with Driver in PCMC',
  '/tempo-traveller-on-rent-in-pune/': 'Force Tempo Traveller (13-20 Seater) in Pune',
  '/corporate-car-rental-services-in-pune/': 'Corporate Car Rental in Pune',
  '/corporate-car-leasing-agency-in-pune/': 'Corporate Car Leasing Agency in Pune',
  '/corporate-car-leasing-agency-in-pcmc/': 'Corporate Car Leasing Agency in PCMC',
  '/corporate-car-leasing-company-in-pcmc/': 'Corporate Car Leasing Company in PCMC',
  '/car-rental-in-pune-with-driver/': 'Car Rental in Pune with Driver',
  '/guide-to-traveling-from-pune-to-konkan-trip-by-tempo-traveller/': 'Guide to Traveling from Pune to Konkan by Tempo Traveller',
  '/why-a-tempo-traveller-on-rent-in-pune-is-a-smart-choice-for-group-family-travel/': 'Why Tempo Traveller is a Smart Choice for Group Travel',
  '/tempo-traveller-for-a-family-trip-outside-pune/': 'Tempo Traveller Guide for Family Trips Outside Pune',
  '/reasons-to-book-a-tempo-traveller-on-rent-for-your-outstation-trips/': 'Reasons to Book a Tempo Traveller for Outstation Trips',
  '/how-to-choose-the-best-car-rental-agency-in-pune/': 'How to Choose the Best Car Rental Agency in Pune',
  '/car-rental-tips-for-your-summer-holiday-trip/': 'Car Rental Tips for Your Summer Holiday Road Trip',
  '/why-you-should-hire-aj-travels-for-your-pune-to-mumbai-travels/': 'Why You Should Hire AJ Travels for Pune to Mumbai Journey',
  '/pune-to-mumbai-the-best-cab-service-for-your-journey/': 'Pune to Mumbai: The Best Cab Service for Your Journey'
};

export function getSitemapSections() {
  const seen = new Set();

  function getItem(path, slug, fallbackTitle, subCategory = '') {
    const norm = path.replace(/\/$/, '') || '/';
    if (seen.has(norm)) return null;
    seen.add(norm);

    const cleanSlug = slug || path.replace(/^\/|\/$/g, '');
    let title = CLEAN_TITLES[path] || CLEAN_TITLES[norm] || fallbackTitle;

    if (!title) {
      if (blogMap.has(cleanSlug)) {
        title = blogMap.get(cleanSlug).title;
      } else if (livePagesContent[cleanSlug] && !((subCategory?.includes('Guide') || subCategory?.includes('Blog')) && livePagesContent[cleanSlug].h1?.includes('on Rent in'))) {
        title = livePagesContent[cleanSlug].h1 || livePagesContent[cleanSlug].metaTitle;
      } else {
        // Humanize slug
        title = cleanSlug
          .split('-')
          .map(w => w.charAt(0).toUpperCase() + w.slice(1))
          .join(' ');
      }
    }

    return {
      path,
      slug: cleanSlug,
      title,
      subCategory
    };
  }

  // 1. Main Pages
  const mainPages = [
    getItem('/', '', 'Home — AJ Travels'),
    getItem('/booking', 'booking', 'Book Cab Online (Reservation Desk)'),
    getItem('/fare', 'fare', 'Fare Calculator & Expressway Tolls'),
    getItem('/sitemap', 'sitemap', 'HTML Sitemap (All Pages)')
  ].filter(Boolean);

  // 2. Company Information
  const companyPages = [
    getItem('/about-us/', 'about-us', 'About AJ Travels (Safety & Standards)')
  ].filter(Boolean);

  // 3. Contact & Enquiries
  const contactPages = [
    getItem('/contact-us/', 'contact-us', 'Contact Support & 24/7 Operations Desk')
  ].filter(Boolean);

  // 4. Services & Travel Offerings
  const coreServices = [
    getItem('/services/', '', 'Our Services Overview', 'Core Services'),
    ...servicesData.map(s =>
      getItem('/services/' + s.slug, s.slug, s.title, 'Core Services')
    )
  ].filter(Boolean);

  const outstationCorridors = masterUrlInventory
    .filter(i => i.category === 'Corridor Service')
    .map(i => getItem(i.path, i.slug, null, 'Intercity & Pilgrimage Routes'))
    .filter(Boolean);

  const corporateServices = masterUrlInventory
    .filter(i => i.category === 'Corporate Solutions')
    .map(i => getItem(i.path, i.slug, null, 'Corporate Solutions'))
    .filter(Boolean);

  // 5. Vehicles & Fleet
  const fleetClasses = [
    getItem('/vehicles/', '', 'Our Fleet Overview', 'Fleet Categories'),
    ...vehiclesData.map(v =>
      getItem('/vehicles/' + v.slug, v.slug, v.name, 'Fleet Categories')
    )
  ].filter(Boolean);

  const fleetModels = masterUrlInventory
    .filter(i => i.category === 'Fleet Vehicle')
    .map(i => getItem(i.path, i.slug, null, 'Vehicle Rentals by Model'))
    .filter(Boolean);

  // 6. Locality Rentals (Pune & PCMC)
  const localityRentals = masterUrlInventory
    .filter(i => i.category === 'Locality Rental')
    .map(i => {
      let sub = 'Car on Rent by Locality';
      if (i.slug.includes('tempo-traveller')) sub = 'Tempo Traveller by Locality';
      else if (i.slug.includes('bus-on-rent')) sub = 'Bus on Rent by Locality';
      return getItem(i.path, i.slug, null, sub);
    })
    .filter(Boolean);

  // 7. Travel Guides & Blog
  const travelGuides = [
    getItem('/blog/', 'blog', 'Travel Guides & Blog Directory', 'Guides Directory'),
    ...blogPosts.map(b =>
      getItem('/' + b.slug + '/', b.slug, b.title, 'Featured Travel Guides')
    ),
    ...masterUrlInventory
      .filter(i => i.category === 'Blog Article')
      .map(i => getItem(i.path, i.slug, null, 'Destination & Holiday Guides'))
  ].filter(Boolean);

  return [
    {
      id: 'main-pages',
      title: 'Main Pages',
      description: 'Core web portal, online reservations, fare calculation, and sitemap.',
      items: mainPages
    },
    {
      id: 'company',
      title: 'Company Information',
      description: 'AJ Travels company background, safety policies, and chauffeur standards.',
      items: companyPages
    },
    {
      id: 'contact',
      title: 'Contact & Enquiries',
      description: '24/7 customer support desk, WhatsApp coordination, and hub address.',
      items: contactPages
    },
    {
      id: 'services',
      title: 'Services & Travel Offerings',
      description: 'Dedicated intercity corridors, airport transfers, pilgrimage tours, and corporate car leasing.',
      subSections: [
        { name: 'Core Services', items: coreServices },
        { name: 'Intercity & Pilgrimage Routes', items: outstationCorridors },
        { name: 'Corporate Solutions', items: corporateServices }
      ]
    },
    {
      id: 'vehicles',
      title: 'Vehicles & Fleet',
      description: 'Sedans, family SUVs, luxury Innova Crysta, and group Tempo Travellers with chauffeurs.',
      subSections: [
        { name: 'Fleet Categories', items: fleetClasses },
        { name: 'Vehicle Rentals by Model', items: fleetModels }
      ]
    },
    {
      id: 'locality-rentals',
      title: 'Locality Rentals (Pune & PCMC)',
      description: 'Chauffeur-driven car, bus, and Tempo Traveller hire with doorstep pickup across Pune & PCMC.',
      subSections: [
        { name: 'Car on Rent by Locality', items: localityRentals.filter(i => i.subCategory === 'Car on Rent by Locality') },
        { name: 'Tempo Traveller by Locality', items: localityRentals.filter(i => i.subCategory === 'Tempo Traveller by Locality') },
        { name: 'Bus on Rent by Locality', items: localityRentals.filter(i => i.subCategory === 'Bus on Rent by Locality') }
      ]
    },
    {
      id: 'travel-guides',
      title: 'Travel Guides & Blog',
      description: 'Published road trip advice, holiday itineraries, ghat route guidance, and travel planning.',
      items: travelGuides
    }
  ];
}

export function getAllVerifiedSitemapLinks() {
  const sections = getSitemapSections();
  const all = [];

  sections.forEach(sec => {
    if (sec.items) {
      sec.items.forEach(item => all.push({ ...item, sectionTitle: sec.title }));
    }
    if (sec.subSections) {
      sec.subSections.forEach(sub => {
        sub.items.forEach(item => all.push({ ...item, sectionTitle: sec.title, subCategory: sub.name }));
      });
    }
  });

  return all;
}
