import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import {
  Car,
  Fuel,
  Users,
  Luggage,
  ShieldCheck,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Loader2,
  ArrowRight,
  ArrowLeftRight,
  Clock,
  Calendar,
  MapPin,
  Sparkles,
  Navigation,
  IndianRupee,
  RotateCcw,
  MessageSquare,
  PhoneCall,
  X,
} from 'lucide-react';
import { fareApi, locationApi, API_BASE_URL } from '../services/api';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { EnquiryModal } from '../components/EnquiryModal';
import { SearchableLocationInput } from '../components/SearchableLocationInput';
import { detectLocationRegion } from '../services/locationSearchService';
import { getWhatsAppLink } from '../utils/whatsapp';
import { usePageSeo } from '../hooks/usePageSeo';
import { useScrollReveal } from '../hooks/useScrollReveal';
import './fare.css';

// In-memory cache for locations across user session
let locationsCache = null;
const getCachedLocations = async () => {
  if (locationsCache && locationsCache.length > 0) return locationsCache;
  try {
    const res = await locationApi.getLocations();
    locationsCache = res.data?.data || [];
  } catch (err) {
    locationsCache = [];
  }
  return locationsCache;
};

const TIME_OPTIONS = [
  '05:00 AM', '05:30 AM', '06:00 AM', '06:30 AM', '07:00 AM', '07:30 AM',
  '08:00 AM', '08:30 AM', '09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM',
  '11:00 AM', '11:30 AM', '12:00 PM', '12:30 PM', '01:00 PM', '01:30 PM',
  '02:00 PM', '02:30 PM', '03:00 PM', '03:30 PM', '04:00 PM', '04:30 PM',
  '05:00 PM', '05:30 PM', '06:00 PM', '06:30 PM', '07:00 PM', '07:30 PM',
  '08:00 PM', '08:30 PM', '09:00 PM', '09:30 PM', '10:00 PM', '10:30 PM',
  '11:00 PM', '11:30 PM'
];

export const FarePage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();


  // Extract query parameters
  const tripType = searchParams.get('tripType') || 'ONE_WAY';
  const pickupId = searchParams.get('pickupId') || searchParams.get('from') || '';
  const dropId = searchParams.get('dropId') || searchParams.get('to') || '';
  const isCustomRouteParam = searchParams.get('isCustomRoute') === 'true';
  const pickupAddressParam = searchParams.get('pickupAddress') || '';
  const dropAddressParam = searchParams.get('dropAddress') || '';
  const pickupNameParam = searchParams.get('pickupName') || searchParams.get('fromName') || '';
  const dropNameParam = searchParams.get('dropName') || searchParams.get('destination') || searchParams.get('toName') || '';

  const city = searchParams.get('city') || 'Pune';
  const duration = searchParams.get('duration') || '8';
  const date = searchParams.get('date') || searchParams.get('departureDate') || new Date().toISOString().split('T')[0];
  const time = searchParams.get('time') || searchParams.get('departureTime') || '08:00 AM';
  const departureDate = searchParams.get('departureDate') || date;
  const departureTime = searchParams.get('departureTime') || time;
  const returnDate = searchParams.get('returnDate') || '';
  const returnTime = searchParams.get('returnTime') || '';
  const passengers = searchParams.get('passengers') || '1';

  const categoryParam = searchParams.get('category') || searchParams.get('vehicleCategory') || 'ALL';
  const vehicleNameParam = searchParams.get('vehicleName') || '';

  // Determine if a complete, legitimate journey route has been entered
  const isValidLocation = (val) => Boolean(val && val !== 'custom' && val !== 'undefined' && val.trim() !== '');

  const isLocalTrip = tripType === 'LOCAL';
  const hasPickup = Boolean(
    isValidLocation(pickupId) ||
    isValidLocation(pickupAddressParam) ||
    isValidLocation(pickupNameParam)
  );
  const hasDrop = Boolean(
    isValidLocation(dropId) ||
    isValidLocation(dropAddressParam) ||
    isValidLocation(dropNameParam)
  );
  const hasValidJourney = isLocalTrip ? Boolean(city) : (hasPickup && hasDrop);

  // Component states
  const [activeCategory, setActiveCategory] = useState(categoryParam || 'ALL');
  const [quoteData, setQuoteData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isCustomRoute, setIsCustomRoute] = useState(false);
  const [isEnquiryModalOpen, setIsEnquiryModalOpen] = useState(false);
  const [expandedBreakdownId, setExpandedBreakdownId] = useState(null);
  const [showCalculatorForm, setShowCalculatorForm] = useState(!hasValidJourney);

  // Request cancellation and race condition mitigation
  const abortControllerRef = useRef(null);
  const latestRequestIdRef = useRef(0);

  // Cached locations for autocomplete
  const [allLocations, setAllLocations] = useState([]);
  const [puneLocations, setPuneLocations] = useState([]);
  const [mumbaiLocations, setMumbaiLocations] = useState([]);

  // Form states for the interactive Fare Calculator Form
  const [formTripType, setFormTripType] = useState(tripType);
  const [formPickupCustom, setFormPickupCustom] = useState(() => {
    if (pickupAddressParam || pickupNameParam) {
      return {
        name: pickupNameParam || pickupAddressParam,
        formattedAddress: pickupAddressParam || pickupNameParam,
        id: pickupId && pickupId !== 'custom' ? pickupId : null,
      };
    }
    return null;
  });
  const [formDropCustom, setFormDropCustom] = useState(() => {
    if (dropAddressParam || dropNameParam) {
      return {
        name: dropNameParam || dropAddressParam,
        formattedAddress: dropAddressParam || dropNameParam,
        id: dropId && dropId !== 'custom' ? dropId : null,
      };
    }
    return null;
  });
  const [formPickupId, setFormPickupId] = useState(pickupId);
  const [formDropId, setFormDropId] = useState(dropId);
  const [formDepartureDate, setFormDepartureDate] = useState(departureDate);
  const [formDepartureTime, setFormDepartureTime] = useState(departureTime);
  const [formReturnDate, setFormReturnDate] = useState(returnDate || departureDate);
  const [formReturnTime, setFormReturnTime] = useState(returnTime || '05:00 PM');
  const [formPassengers, setFormPassengers] = useState(passengers);
  const [formCity, setFormCity] = useState(city);
  const [formDuration, setFormDuration] = useState(duration);
  const [formCategory, setFormCategory] = useState(categoryParam || 'ALL');
  const [formVehicleName, setFormVehicleName] = useState(vehicleNameParam || '');
  const [formError, setFormError] = useState('');
  const [isSubmittingForm, setIsSubmittingForm] = useState(false);

  // Load backend locations on mount
  useEffect(() => {
    getCachedLocations().then((locs) => {
      setAllLocations(locs);
      setPuneLocations(
        locs.filter((l) => l.side === 'PUNE_SIDE' || l.city?.toLowerCase() === 'pune')
      );
      setMumbaiLocations(
        locs.filter(
          (l) =>
            l.side === 'MUMBAI_SIDE' ||
            ['mumbai', 'thane', 'navi mumbai'].includes(l.city?.toLowerCase())
        )
      );
    });
  }, []);

  // Synchronize form states when search parameters change
  useEffect(() => {
    setFormTripType(tripType);
    setFormDepartureDate(departureDate);
    setFormDepartureTime(departureTime);
    setFormReturnDate(returnDate || departureDate);
    setFormReturnTime(returnTime || '05:00 PM');
    setFormPassengers(passengers);
    setFormCity(city);
    setFormDuration(duration);
    setFormCategory(categoryParam || 'ALL');
    setFormVehicleName(vehicleNameParam || '');
    if (categoryParam) {
      setActiveCategory(categoryParam);
    }

    if (pickupAddressParam || pickupNameParam) {
      setFormPickupCustom({
        name: pickupNameParam || pickupAddressParam,
        formattedAddress: pickupAddressParam || pickupNameParam,
        id: pickupId && pickupId !== 'custom' ? pickupId : null,
      });
      setFormPickupId(pickupId);
    } else if (pickupId) {
      setFormPickupId(pickupId);
    } else {
      setFormPickupCustom(null);
      setFormPickupId('');
    }

    if (dropAddressParam || dropNameParam) {
      setFormDropCustom({
        name: dropNameParam || dropAddressParam,
        formattedAddress: dropAddressParam || dropNameParam,
        id: dropId && dropId !== 'custom' ? dropId : null,
      });
      setFormDropId(dropId);
    } else if (dropId) {
      setFormDropId(dropId);
    } else {
      setFormDropCustom(null);
      setFormDropId('');
    }

    // If journey is not provided, open calculator form automatically
    if (!hasValidJourney) {
      setShowCalculatorForm(true);
    } else {
      setShowCalculatorForm(false);
    }
  }, [
    tripType,
    pickupId,
    dropId,
    pickupAddressParam,
    dropAddressParam,
    pickupNameParam,
    dropNameParam,
    city,
    duration,
    departureDate,
    departureTime,
    returnDate,
    returnTime,
    passengers,
    categoryParam,
    vehicleNameParam,
    hasValidJourney,
  ]);

  // Fetch verified fare quote from backend
  const fetchQuote = async () => {
    // If no valid journey is entered, do not fabricate fares or treat as broken custom route
    if (!hasValidJourney) {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      setQuoteData(null);
      setIsCustomRoute(false);
      setLoading(false);
      setError('');
      return;
    }

    // Cancel any previous in-flight request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;
    const currentRequestId = ++latestRequestIdRef.current;

    setLoading(true);
    setError('');

    // If explicit custom outstation route (e.g. Swargate to Kolhapur)
    if (isCustomRouteParam || pickupId === 'custom' || dropId === 'custom') {
      setIsCustomRoute(true);
      setLoading(false);
      return;
    }

    try {
      let activePickupId = pickupId;
      let activeDropId = dropId;

      if (!isLocalTrip) {
        const allLocs = await getCachedLocations();

        const matchLocation = (searchKey, nameParam) => {
          if (!searchKey && !nameParam) return null;
          const key = (searchKey || '').toLowerCase().trim();
          const name = (nameParam || '').toLowerCase().trim();

          // 1. Exact database ID match
          let matched = allLocs.find((l) => l.id.toLowerCase() === key);
          if (matched) return matched;

          // 2. Exact full name match
          matched = allLocs.find((l) => l.name.toLowerCase() === name || l.name.toLowerCase() === key);
          if (matched) return matched;

          // 3. Known hub aliases — prioritize city-wide "All Areas" hub when "pune" or "mumbai" is requested
          if (key === 'pune' || name === 'pune' || key === 'pune (all areas)') {
            matched = allLocs.find((l) => l.name.toLowerCase().includes('all areas') && l.city?.toLowerCase() === 'pune')
                   || allLocs.find((l) => l.name.toLowerCase() === 'pune (all areas)')
                   || allLocs.find((l) => l.name.toLowerCase().includes('pune'));
            if (matched) return matched;
          }

          if (key === 'mumbai' || name === 'mumbai' || key === 'mumbai (all areas)') {
            matched = allLocs.find((l) => l.name.toLowerCase().includes('all areas') && l.city?.toLowerCase() === 'mumbai')
                   || allLocs.find((l) => l.name.toLowerCase() === 'mumbai (all areas)')
                   || allLocs.find((l) => l.name.toLowerCase().includes('mumbai'));
            if (matched) return matched;
          }

          // Airport aliases
          if (key.includes('airport') || name.includes('airport')) {
            if (key.includes('bom') || name.includes('bom') || key.includes('mumbai') || name.includes('mumbai')) {
              matched = allLocs.find((l) => l.name.toLowerCase().includes('bom') || l.name.toLowerCase().includes('mumbai airport'));
              if (matched) return matched;
            }
            if (key.includes('pnq') || name.includes('pnq') || key.includes('pune') || name.includes('pune')) {
              matched = allLocs.find((l) => l.name.toLowerCase().includes('pnq') || l.name.toLowerCase().includes('pune airport'));
              if (matched) return matched;
            }
          }

          // 4. Substring on location name (e.g. "hinjawadi", "bkc", "wakad", "andheri")
          const target = name || key;
          matched = allLocs.find((l) => {
            const lname = l.name.toLowerCase();
            return lname.includes(target) || target.includes(lname);
          });
          if (matched) return matched;

          // 5. City-level fallback with "All Areas"
          matched = allLocs.find((l) => {
            const lcity = (l.city || '').toLowerCase();
            return (lcity.includes(target) || target.includes(lcity)) && l.name.toLowerCase().includes('all areas');
          });
          if (matched) return matched;

          return null;
        };

        const matchedPickup = matchLocation(activePickupId, pickupNameParam);
        const matchedDrop = matchLocation(activeDropId, dropNameParam);

        if (matchedPickup) activePickupId = matchedPickup.id;
        if (matchedDrop) activeDropId = matchedDrop.id;

        // If either pickup or drop is not in database, route is custom
        if (!activePickupId || !activeDropId) {
          if (latestRequestIdRef.current === currentRequestId) {
            setIsCustomRoute(true);
            setLoading(false);
          }
          return;
        }
      }

      const payload = {
        tripType,
        pickupLocationId: activePickupId || undefined,
        dropLocationId: activeDropId || undefined,
        city: isLocalTrip ? city : undefined,
        duration: isLocalTrip ? parseInt(duration, 10) : undefined,
        date,
        time,
        departureDate,
        departureTime,
        returnDate,
        returnTime,
        passengers: parseInt(passengers, 10) || 1,
      };

      const res = await fareApi.getQuote(payload, { signal: controller.signal });
      if (latestRequestIdRef.current !== currentRequestId) {
        return; // Newer request already initiated, ignore obsolete response
      }

      if (res.data?.success) {
        setQuoteData(res.data);
        setIsCustomRoute(false);
      } else {
        setIsCustomRoute(true);
      }
    } catch (err) {
      if (err.name === 'CanceledError' || err.name === 'AbortError' || err.code === 'ERR_CANCELED') {
        return; // Request was aborted due to new selection, do not alter state
      }
      if (latestRequestIdRef.current === currentRequestId) {
        console.warn('Fare quote notice:', err.message);
        if (err.code === 'ECONNABORTED' || err.message?.includes('timeout')) {
          setError('Verification timed out. Our server took too long to confirm live tolls and vehicle availability. Please retry.');
        } else if (err.response?.status >= 500) {
          setError('Unable to verify fares with the server at this time. Please check your connection or retry.');
        } else {
          // Unsupported route without fixed corridor pricing, offer quotation gracefully
          setIsCustomRoute(true);
        }
      }
    } finally {
      if (latestRequestIdRef.current === currentRequestId) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    fetchQuote();
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [tripType, pickupId, dropId, city, duration, date, time, returnDate, returnTime, passengers]);

  // Trigger smooth scroll-reveal animations
  useScrollReveal([quoteData, activeCategory, loading, isCustomRoute, showCalculatorForm]);

  // Navigate to booking page with full trip parameters preserved
  const handleSelectCab = (vehicle) => {
    const bookingParams = new URLSearchParams({
      tripType,
      vehicleId: vehicle.vehicleId,
      ...(pickupId && { pickupId }),
      ...(dropId && { dropId }),
      ...(pickupAddressParam && { pickupAddress: pickupAddressParam }),
      ...(dropAddressParam && { dropAddress: dropAddressParam }),
      ...(pickupNameParam && { pickupName: pickupNameParam }),
      ...(dropNameParam && { dropName: dropNameParam }),
      ...(isLocalTrip && { city, duration }),
      date,
      time,
      departureDate,
      departureTime,
      ...(returnDate && { returnDate }),
      ...(returnTime && { returnTime }),
      passengers,
    });

    navigate(`/booking?${bookingParams.toString()}`, {
      state: {
        vehicle,
        quoteData,
        tripType,
        pickupAddress: pickupAddressParam,
        dropAddress: dropAddressParam,
        pickupName: pickupNameParam,
        dropName: dropNameParam,
        searchParams: {
          tripType,
          pickupLocationId: pickupId,
          dropLocationId: dropId,
          pickupAddress: pickupAddressParam,
          dropAddress: dropAddressParam,
          pickupName: pickupNameParam,
          dropName: dropNameParam,
          city,
          duration,
          date,
          time,
          departureDate,
          departureTime,
          returnDate,
          returnTime,
          passengers,
        },
      },
    });
  };

  // Modify locations helper that populates current inputs and smoothly navigates to the form
  const handleModifyLocations = () => {
    if (!formPickupCustom && pickupDisplayName) {
      setFormPickupCustom({
        name: pickupDisplayName,
        formattedAddress: pickupAddressParam || pickupDisplayName,
        id: isValidLocation(pickupId) ? pickupId : null,
      });
    }
    if (!formDropCustom && dropDisplayName) {
      setFormDropCustom({
        name: dropDisplayName,
        formattedAddress: dropAddressParam || dropDisplayName,
        id: isValidLocation(dropId) ? dropId : null,
      });
    }
    setShowCalculatorForm(true);
    const formElement = document.getElementById('fare-form-card');
    if (formElement) {
      formElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      window.scrollTo({ top: 300, behavior: 'smooth' });
    }
  };

  // Selection Handlers for Searchable Location Inputs
  const handlePickupSelect = (loc) => {
    if (!loc) {
      setFormPickupId('');
      setFormPickupCustom(null);
      return;
    }
    setFormPickupCustom(loc);
    setFormPickupId(loc.id || 'custom');
    setFormError('');
  };

  const handleDropSelect = (loc) => {
    if (!loc) {
      setFormDropId('');
      setFormDropCustom(null);
      return;
    }
    setFormDropCustom(loc);
    setFormDropId(loc.id || 'custom');
    setFormError('');
  };

  // Swap pickup & drop locations
  const handleFormSwap = () => {
    const tempCustom = formPickupCustom;
    const tempId = formPickupId;
    setFormPickupCustom(formDropCustom);
    setFormPickupId(formDropId);
    setFormDropCustom(tempCustom);
    setFormDropId(tempId);
    setFormError('');
  };

  // Form submission handler
  const handleFormSubmit = (e) => {
    e?.preventDefault();
    setFormError('');

    if (formTripType === 'LOCAL') {
      if (!formCity) {
        setFormError('Please select a city for local cab rental.');
        return;
      }
      if (!formDuration) {
        setFormError('Please select a rental duration package.');
        return;
      }
      if (!formDepartureDate) {
        setFormError('Please select your journey date.');
        return;
      }
      if (!formDepartureTime) {
        setFormError('Please select your pickup time.');
        return;
      }

      setIsSubmittingForm(true);
      const queryParams = new URLSearchParams({
        tripType: 'LOCAL',
        city: formCity,
        duration: formDuration,
        date: formDepartureDate,
        time: formDepartureTime,
        departureDate: formDepartureDate,
        departureTime: formDepartureTime,
        passengers: formPassengers || '1',
        ...(formCategory && formCategory !== 'ALL' && { category: formCategory }),
        ...(formVehicleName && { vehicleName: formVehicleName }),
      });

      navigate(`/fare?${queryParams.toString()}`);
      setShowCalculatorForm(false);
      setIsSubmittingForm(false);
      return;
    }

    // Outstation Travel (ONE_WAY or ROUND_TRIP)
    const hasP = Boolean(formPickupId || formPickupCustom);
    const hasD = Boolean(formDropId || formDropCustom);

    if (!hasP) {
      setFormError('Please select or search your Pickup location.');
      return;
    }
    if (!hasD) {
      setFormError('Please select or search your Destination location.');
      return;
    }

    const pAddr = formPickupCustom?.formattedAddress || formPickupCustom?.name || '';
    const dAddr = formDropCustom?.formattedAddress || formDropCustom?.name || '';
    const pName = formPickupCustom?.name || pAddr;
    const dName = formDropCustom?.name || dAddr;

    const pKey = (pAddr || formPickupId || '').toLowerCase().trim();
    const dKey = (dAddr || formDropId || '').toLowerCase().trim();

    if (pKey && dKey && pKey === dKey) {
      setFormError('Pickup and Destination locations must be different.');
      return;
    }

    if (!formDepartureDate) {
      setFormError('Please select your Departure Date.');
      return;
    }
    if (!formDepartureTime) {
      setFormError('Please select your Pickup Time.');
      return;
    }

    if (formTripType === 'ROUND_TRIP') {
      if (!formReturnDate) {
        setFormError('Please select your Return Date.');
        return;
      }
      if (formReturnDate < formDepartureDate) {
        setFormError('Return Date cannot be before Departure Date.');
        return;
      }
      if (!formReturnTime) {
        setFormError('Please select your Return Time.');
        return;
      }
    }

    setIsSubmittingForm(true);

    // Region detection and corridor resolution
    const detectedP = detectLocationRegion(pAddr, formPickupCustom?.lat, formPickupCustom?.lon);
    const detectedD = detectLocationRegion(dAddr, formDropCustom?.lat, formDropCustom?.lon);

    const effPSide = formPickupCustom?.side || detectedP.side;
    const effDSide = formDropCustom?.side || detectedD.side;

    const puneAll = puneLocations.find((l) => l.name.includes('All Areas')) || puneLocations[0];
    const mumbaiAll = mumbaiLocations.find((l) => l.name.includes('All Areas')) || mumbaiLocations[0];

    let resPId = formPickupId && formPickupId !== 'custom' ? formPickupId : '';
    let resDId = formDropId && formDropId !== 'custom' ? formDropId : '';
    let isCustom = false;

    // Supported Pune ↔ Mumbai corridor
    if (effPSide === 'PUNE_SIDE' && effDSide === 'MUMBAI_SIDE') {
      if (!resPId) resPId = puneAll?.id || puneLocations[0]?.id;
      if (!resDId) resDId = mumbaiAll?.id || mumbaiLocations[0]?.id;
    } else if (effPSide === 'MUMBAI_SIDE' && effDSide === 'PUNE_SIDE') {
      if (!resPId) resPId = mumbaiAll?.id || mumbaiLocations[0]?.id;
      if (!resDId) resDId = puneAll?.id || puneLocations[0]?.id;
    } else {
      isCustom = true;
    }

    const queryParamsObj = {
      tripType: formTripType,
      pickupId: resPId || 'custom',
      dropId: resDId || 'custom',
      pickupAddress: pAddr,
      dropAddress: dAddr,
      pickupName: pName,
      dropName: dName,
      isCustomRoute: isCustom ? 'true' : 'false',
      date: formDepartureDate,
      time: formDepartureTime,
      departureDate: formDepartureDate,
      departureTime: formDepartureTime,
      passengers: formPassengers || '1',
      ...(formTripType === 'ROUND_TRIP' && {
        returnDate: formReturnDate,
        returnTime: formReturnTime,
      }),
      ...(formCategory && formCategory !== 'ALL' && { category: formCategory }),
      ...(formVehicleName && { vehicleName: formVehicleName }),
    };

    const nextParams = new URLSearchParams(queryParamsObj);
    navigate(`/fare?${nextParams.toString()}`);
    setShowCalculatorForm(false);
    setIsSubmittingForm(false);
  };

  // Filter vehicles by category tab
  const allVehicles = quoteData?.vehicles || [];
  const filteredVehicles = allVehicles.filter((v) => {
    if (!activeCategory || activeCategory === 'ALL') return true;
    const catUpper = v.category?.toUpperCase() || '';
    const nameLower = v.name?.toLowerCase() || '';

    if (activeCategory === 'SEDAN') {
      return (
        catUpper === 'SEDAN' ||
        catUpper === 'HATCHBACK' ||
        nameLower.includes('sedan') ||
        nameLower.includes('dzire') ||
        nameLower.includes('etios')
      );
    }
    if (activeCategory === 'SUV') {
      return (
        catUpper === 'SUV' ||
        nameLower.includes('suv') ||
        nameLower.includes('ertiga') ||
        nameLower.includes('carens')
      );
    }
    if (activeCategory === 'INNOVA_CRYSTA') {
      return (
        catUpper === 'INNOVA_CRYSTA' ||
        catUpper === 'LUXURY' ||
        nameLower.includes('innova') ||
        nameLower.includes('crysta') ||
        nameLower.includes('luxury')
      );
    }
    if (activeCategory === 'TEMPO_TRAVELLER') {
      return (
        catUpper === 'TEMPO_TRAVELLER' ||
        catUpper === 'TWENTY_SEATER' ||
        nameLower.includes('tempo') ||
        nameLower.includes('mini bus')
      );
    }
    return catUpper === activeCategory;
  });

  // Resolve user-friendly display names for pickup & drop
  const pickupDisplayName =
    pickupNameParam ||
    pickupAddressParam ||
    quoteData?.route?.pickup?.name ||
    (pickupId && pickupId !== 'undefined' && pickupId !== 'custom'
      ? pickupId.replace(/[-_]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
      : '');

  const dropDisplayName =
    dropNameParam ||
    dropAddressParam ||
    quoteData?.route?.drop?.name ||
    (dropId && dropId !== 'undefined' && dropId !== 'custom'
      ? dropId.replace(/[-_]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
      : '');

  // Detect specific city corridor locations
  const pickupInfo = (
    (quoteData?.route?.pickup?.city || '') +
    ' ' +
    (quoteData?.route?.pickup?.side || '') +
    ' ' +
    pickupDisplayName
  ).toLowerCase();

  const dropInfo = (
    (quoteData?.route?.drop?.city || '') +
    ' ' +
    (quoteData?.route?.drop?.side || '') +
    ' ' +
    dropDisplayName
  ).toLowerCase();

  const isPunePickup =
    pickupInfo.includes('pune') ||
    pickupInfo.includes('hinjawadi') ||
    pickupInfo.includes('wakad') ||
    pickupInfo.includes('baner');

  const isMumbaiPickup =
    pickupInfo.includes('mumbai') ||
    pickupInfo.includes('thane') ||
    pickupInfo.includes('navi mumbai') ||
    pickupInfo.includes('andheri') ||
    pickupInfo.includes('bandra') ||
    pickupInfo.includes('dadar') ||
    pickupInfo.includes('borivali');

  const isPuneDrop =
    dropInfo.includes('pune') ||
    dropInfo.includes('hinjawadi') ||
    dropInfo.includes('wakad') ||
    dropInfo.includes('baner');

  const isMumbaiDrop =
    dropInfo.includes('mumbai') ||
    dropInfo.includes('thane') ||
    dropInfo.includes('navi mumbai') ||
    dropInfo.includes('andheri') ||
    dropInfo.includes('bandra') ||
    dropInfo.includes('dadar') ||
    dropInfo.includes('borivali');

  const isPuneToMumbai = hasValidJourney && !isCustomRoute && isPunePickup && isMumbaiDrop;
  const isMumbaiToPune = hasValidJourney && !isCustomRoute && isMumbaiPickup && isPuneDrop;
  const isIntercityExpressway = isPuneToMumbai || isMumbaiToPune;

  const categoryLabels = {
    SEDAN: 'Sedans (4-Seater)',
    SUV: 'Spacious SUVs (6-Seater)',
    INNOVA_CRYSTA: 'Executive Crysta / Luxury',
    TEMPO_TRAVELLER: 'Mini Bus & Tempo Traveller',
  };

  // Header Title, Subtitle, Badge, and SEO resolution
  let heroBadgeText = 'AJ TRAVEL AGENCY • FARE CALCULATOR';
  let heroTitleElement = null;
  let heroSubtitleText = '';
  let seoPageTitle = 'Cab Fleet & Fare Calculator | AJ Tours & Travels';

  if (!hasValidJourney) {
    if (vehicleNameParam) {
      heroBadgeText = 'AJ TRAVEL AGENCY • VEHICLE FARE CALCULATOR';
      heroTitleElement = (
        <>
          {vehicleNameParam} <span className="text-gradient">Fare Calculator</span>
        </>
      );
      heroSubtitleText = `Enter your pickup location and destination below to calculate door-to-door fares and check live availability for ${vehicleNameParam}.`;
      seoPageTitle = `${vehicleNameParam} Fare Calculator | AJ Tours & Travels`;
    } else if (categoryParam && categoryParam !== 'ALL') {
      const catLabel = categoryLabels[categoryParam] || categoryParam;
      heroBadgeText = 'AJ TRAVEL AGENCY • FLEET CATEGORY FARES';
      heroTitleElement = (
        <>
          {catLabel} <span className="text-gradient">Fare Calculator</span>
        </>
      );
      heroSubtitleText = `Select your pickup and drop locations to view verified door-to-door fares for our ${catLabel} fleet.`;
      seoPageTitle = `${catLabel} Fare Calculator | AJ Tours & Travels`;
    } else {
      heroBadgeText = 'AJ TRAVEL AGENCY • CAB FARE CALCULATOR';
      heroTitleElement = (
        <>
          Cab Fleet & <span className="text-gradient">Fare Calculator</span>
        </>
      );
      heroSubtitleText =
        'Calculate transparent door-to-door cab fares, view toll inclusions, and check live vehicle availability for one-way, round-trip, and local journeys.';
      seoPageTitle = 'Cab Fleet & Fare Calculator | AJ Tours & Travels';
    }
  } else if (isCustomRoute) {
    heroBadgeText = 'AJ TRAVEL AGENCY • CUSTOM OUTSTATION ROUTE';
    heroTitleElement = (
      <>
        {pickupDisplayName || 'Outstation'} to {dropDisplayName || 'Destination'}{' '}
        <span className="text-gradient">Cab Quote & Enquiry</span>
      </>
    );
    heroSubtitleText = `Chauffeur-driven outstation cab service tailored for your itinerary from ${pickupDisplayName || 'pickup'} to ${dropDisplayName || 'destination'}. Instant, all-inclusive quote available on request.`;
    seoPageTitle = `${pickupDisplayName || 'Custom'} to ${dropDisplayName || 'Outstation'} Cab Quote | AJ Tours & Travels`;
  } else if (isLocalTrip) {
    heroBadgeText = 'AJ TRAVEL AGENCY • LOCAL CITY PACKAGES';
    heroTitleElement = (
      <>
        {city} Local Cab <span className="text-gradient">Fare Calculator</span>
      </>
    );
    heroSubtitleText = `All-inclusive hourly local rental packages in ${city} with verified chauffeurs, unlimited local stops, and transparent billing.`;
    seoPageTitle = `${city} Local Cab Fare Calculator (${duration} Hours) | AJ Tours & Travels`;
  } else if (tripType === 'ROUND_TRIP') {
    heroBadgeText = 'AJ TRAVEL AGENCY • ROUND TRIP FARE CALCULATOR';
    heroTitleElement = (
      <>
        Round Trip Cab Fare:{' '}
        <span className="text-gradient">
          {pickupDisplayName || 'Pune'} to {dropDisplayName || 'Mumbai'}
        </span>
      </>
    );
    heroSubtitleText = `All-inclusive transparent rates for round-trip travel between ${pickupDisplayName || 'Pune'} and ${dropDisplayName || 'Mumbai'}. Chauffeur allowances and return journey included.`;
    seoPageTitle = `Round Trip Cab Fare From ${pickupDisplayName || 'Pune'} to ${dropDisplayName || 'Mumbai'} | AJ Tours & Travels`;
  } else if (isPuneToMumbai) {
    heroBadgeText = 'AJ TRAVEL AGENCY • EXPRESSWAY CORRIDOR FARES';
    heroTitleElement = (
      <>
        Pune to Mumbai Cab <span className="text-gradient">Fare Calculator</span>
      </>
    );
    heroSubtitleText =
      'All-inclusive transparent rates with expressway tolls, fuel, and chauffeur allowances included. Choose your preferred car category and reserve instantly with zero advance deposit.';
    seoPageTitle = 'Pune to Mumbai Cab Fare Calculator | AJ Tours & Travels';
  } else if (isMumbaiToPune) {
    heroBadgeText = 'AJ TRAVEL AGENCY • EXPRESSWAY CORRIDOR FARES';
    heroTitleElement = (
      <>
        Mumbai to Pune Cab <span className="text-gradient">Fare Calculator</span>
      </>
    );
    heroSubtitleText =
      'All-inclusive transparent rates with expressway tolls, fuel, and chauffeur allowances included. Choose your preferred car category and reserve instantly with zero advance deposit.';
    seoPageTitle = 'Mumbai to Pune Cab Fare Calculator | AJ Tours & Travels';
  } else {
    heroBadgeText = 'AJ TRAVEL AGENCY • INTERCITY ROUTE FARES';
    heroTitleElement = (
      <>
        {pickupDisplayName || 'Pickup'} to {dropDisplayName || 'Destination'} Cab{' '}
        <span className="text-gradient">Fare Calculator</span>
      </>
    );
    heroSubtitleText = `Transparent door-to-door cab fares from ${pickupDisplayName || 'pickup'} to ${dropDisplayName || 'destination'}. Sanitized cabs, experienced highway chauffeurs, and zero advance deposit.`;
    seoPageTitle = `${pickupDisplayName || 'Outstation'} to ${dropDisplayName || 'Cab'} Fare Calculator | AJ Tours & Travels`;
  }

  // Reactive Page SEO hook
  usePageSeo('fare', seoPageTitle);

  return (
    <div className="fare-page-wrapper">
      <Header isDark={false} />

      {/* Internal Hero Banner */}
      <section className="internal-hero-section">
        <div className="container">
          <div className="breadcrumbs-nav">
            <Link to="/">Home</Link>
            <span className="bc-sep">/</span>
            <span className="bc-current">Fare Calculator</span>
          </div>

          <div className="internal-hero-content">
            <div className="hero-badge-pill">
              <Sparkles size={14} />
              <span>{heroBadgeText}</span>
            </div>

            <h1 className="internal-hero-title">{heroTitleElement}</h1>

            <p className="internal-hero-subtitle">{heroSubtitleText}</p>

            {/* Context-Aware Route Chips */}
            <div className="svc-stats-chips-row">
              {!hasValidJourney ? (
                <>
                  <div className="chip-box">
                    <MapPin size={15} color="#2563EB" />
                    <div>
                      <span className="chip-lbl">COVERAGE</span>
                      <strong>Pune, Mumbai & All Maharashtra</strong>
                    </div>
                  </div>
                  <div className="chip-box">
                    <Car size={15} color="#2563EB" />
                    <div>
                      <span className="chip-lbl">FLEET QUALITY</span>
                      <strong>Clean Sanitized AC Cabs</strong>
                    </div>
                  </div>
                  <div className="chip-box">
                    <Clock size={15} color="#2563EB" />
                    <div>
                      <span className="chip-lbl">AVAILABILITY</span>
                      <strong>24/7 Verified Chauffeurs</strong>
                    </div>
                  </div>
                  <div className="chip-box">
                    <ShieldCheck size={15} color="#15803D" />
                    <div>
                      <span className="chip-lbl">BOOKING GUARANTEE</span>
                      <strong>Zero Advance • Pay on Pickup</strong>
                    </div>
                  </div>
                </>
              ) : isCustomRoute ? (
                <>
                  <div className="chip-box">
                    <MapPin size={15} color="#2563EB" />
                    <div>
                      <span className="chip-lbl">DOORSTEP PICKUP</span>
                      <strong>{pickupDisplayName || 'Custom Location'}</strong>
                    </div>
                  </div>
                  <div className="chip-box">
                    <Navigation size={15} color="#10B981" />
                    <div>
                      <span className="chip-lbl">DESTINATION DROP</span>
                      <strong>{dropDisplayName || 'Custom Destination'}</strong>
                    </div>
                  </div>
                  <div className="chip-box">
                    <Calendar size={15} color="#6366F1" />
                    <div>
                      <span className="chip-lbl">SCHEDULE</span>
                      <strong>
                        {departureDate} ({tripType === 'ROUND_TRIP' ? 'Round Trip' : 'One Way'})
                      </strong>
                    </div>
                  </div>
                  <div className="chip-box">
                    <Sparkles size={15} color="#D97706" />
                    <div>
                      <span className="chip-lbl">QUOTATION</span>
                      <strong>Custom Route • Quote on Request</strong>
                    </div>
                  </div>
                </>
              ) : isLocalTrip ? (
                <>
                  <div className="chip-box">
                    <MapPin size={15} color="#2563EB" />
                    <div>
                      <span className="chip-lbl">LOCAL PACKAGE</span>
                      <strong>
                        {city} Local ({duration}h Package)
                      </strong>
                    </div>
                  </div>
                  <div className="chip-box">
                    <Navigation size={15} color="#2563EB" />
                    <div>
                      <span className="chip-lbl">PACKAGE TYPE</span>
                      <strong>City Duty & Sightseeing</strong>
                    </div>
                  </div>
                  <div className="chip-box">
                    <Clock size={15} color="#2563EB" />
                    <div>
                      <span className="chip-lbl">CHAUFFEUR</span>
                      <strong>Verified Uniformed Driver</strong>
                    </div>
                  </div>
                  <div className="chip-box">
                    <ShieldCheck size={15} color="#15803D" />
                    <div>
                      <span className="chip-lbl">BILLING</span>
                      <strong>Fuel Included • Hourly Billing</strong>
                    </div>
                  </div>
                </>
              ) : tripType === 'ROUND_TRIP' ? (
                <>
                  <div className="chip-box">
                    <MapPin size={15} color="#2563EB" />
                    <div>
                      <span className="chip-lbl">ROUND TRIP ROUTE</span>
                      <strong>
                        {pickupDisplayName || 'Pune'} ⇄ {dropDisplayName || 'Mumbai'}
                      </strong>
                    </div>
                  </div>
                  <div className="chip-box">
                    <Navigation size={15} color="#2563EB" />
                    <div>
                      <span className="chip-lbl">
                        {quoteData?.route?.distance ? 'TOTAL DISTANCE' : 'HIGHWAY ROUTE'}
                      </span>
                      <strong>
                        {quoteData?.route?.distance
                          ? `${quoteData.route.distance * 2} km round-trip`
                          : isIntercityExpressway
                          ? 'Mumbai-Pune Expressway'
                          : 'Direct Intercity Highway'}
                      </strong>
                    </div>
                  </div>
                  <div className="chip-box">
                    <Clock size={15} color="#2563EB" />
                    <div>
                      <span className="chip-lbl">ESTIMATED TIME</span>
                      <strong>Round Trip Journey</strong>
                    </div>
                  </div>
                  <div className="chip-box">
                    <ShieldCheck size={15} color="#15803D" />
                    <div>
                      <span className="chip-lbl">TOLL INCLUSION</span>
                      <strong>
                        {isIntercityExpressway
                          ? 'Return Expressway Tolls Included'
                          : 'All State Tolls Included'}
                      </strong>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="chip-box">
                    <MapPin size={15} color="#2563EB" />
                    <div>
                      <span className="chip-lbl">CORRIDOR ROUTE</span>
                      <strong>
                        {pickupDisplayName || 'Pune'} ➔ {dropDisplayName || 'Mumbai'}
                      </strong>
                    </div>
                  </div>
                  <div className="chip-box">
                    <Navigation size={15} color="#2563EB" />
                    <div>
                      <span className="chip-lbl">
                        {quoteData?.route?.distance ? 'TOTAL DISTANCE' : 'CORRIDOR HIGHWAY'}
                      </span>
                      <strong>
                        {quoteData?.route?.distance
                          ? `${quoteData.route.distance} km approx.`
                          : isIntercityExpressway
                          ? 'Mumbai-Pune Expressway'
                          : 'Direct Highway Route'}
                      </strong>
                    </div>
                  </div>
                  <div className="chip-box">
                    <Clock size={15} color="#2563EB" />
                    <div>
                      <span className="chip-lbl">
                        {quoteData?.route?.durationHours ? 'DRIVING TIME' : 'ESTIMATED TIME'}
                      </span>
                      <strong>
                        {quoteData?.route?.durationHours
                          ? `${quoteData.route.durationHours} hrs estimated`
                          : isIntercityExpressway
                          ? '3.0 – 3.5 hrs drive'
                          : 'Direct Highway Drive'}
                      </strong>
                    </div>
                  </div>
                  <div className="chip-box">
                    <ShieldCheck size={15} color="#15803D" />
                    <div>
                      <span className="chip-lbl">TOLL INCLUSION</span>
                      <strong>
                        {isIntercityExpressway
                          ? 'Expressway Tolls Included'
                          : 'Tolls & Driver Allowance Included'}
                      </strong>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <main className="fare-content-section container">
        {/* Interactive Fare Calculator Form: Rendered on clean initial state or when customer toggles "Modify Locations" */}
        {(!hasValidJourney || showCalculatorForm) && (
          <div className="fare-calculator-form-card reveal" id="fare-form-card">
            <div className="fare-form-header">
              <div className="fare-form-badge">
                <Sparkles size={13} color="#2563EB" />
                <span>INTERACTIVE FARE CALCULATOR</span>
              </div>
              <h2>
                {hasValidJourney ? 'Modify Your Journey Route' : 'Plan Your Journey & Calculate Fare'}
              </h2>
              <p>
                Enter your pickup and drop locations to check live vehicle availability, transparent
                all-inclusive pricing, and expressway toll inclusions.
              </p>
            </div>

            {/* Selected Vehicle Preserved Banner */}
            {(formVehicleName || (formCategory && formCategory !== 'ALL')) && (
              <div className="fare-selected-vehicle-banner">
                <Car size={16} color="#1D4ED8" />
                <span>
                  Selected Vehicle:{' '}
                  <strong>{formVehicleName || categoryLabels[formCategory] || formCategory}</strong>{' '}
                  (Preserved from Fleet)
                </span>
              </div>
            )}

            {/* Validation Error Banner */}
            {formError && (
              <div className="fare-form-error-banner">
                <AlertCircle size={16} color="#DC2626" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleFormSubmit} className="fare-builder-form">
              {/* Trip Type Tabs */}
              <div className="fare-form-trip-tabs">
                <button
                  type="button"
                  onClick={() => {
                    setFormTripType('ONE_WAY');
                    setFormError('');
                  }}
                  className={`fare-trip-tab ${formTripType === 'ONE_WAY' ? 'active' : ''}`}
                >
                  One Way Outstation
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setFormTripType('ROUND_TRIP');
                    setFormError('');
                  }}
                  className={`fare-trip-tab ${formTripType === 'ROUND_TRIP' ? 'active' : ''}`}
                >
                  Round Trip
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setFormTripType('LOCAL');
                    setFormError('');
                  }}
                  className={`fare-trip-tab ${formTripType === 'LOCAL' ? 'active' : ''}`}
                >
                  Local City Rental
                </button>
              </div>

              {formTripType === 'LOCAL' ? (
                /* Local Rental Inputs */
                <div className="fare-form-grid-2">
                  <div className="fare-form-field">
                    <label className="fare-form-label">
                      <MapPin size={13} color="#0099FF" />
                      <span>City *</span>
                    </label>
                    <select
                      value={formCity}
                      onChange={(e) => setFormCity(e.target.value)}
                      className="fare-form-input"
                    >
                      <option value="Pune">Pune City & PCMC</option>
                      <option value="Mumbai">Mumbai & Navi Mumbai</option>
                    </select>
                  </div>

                  <div className="fare-form-field">
                    <label className="fare-form-label">
                      <Clock size={13} color="#0099FF" />
                      <span>Duration Package *</span>
                    </label>
                    <select
                      value={formDuration}
                      onChange={(e) => setFormDuration(e.target.value)}
                      className="fare-form-input"
                    >
                      <option value="4">4 Hours / 40 km Package</option>
                      <option value="8">8 Hours / 80 km Package (Full Day)</option>
                      <option value="12">12 Hours / 120 km Package</option>
                    </select>
                  </div>
                </div>
              ) : (
                /* Outstation Pickup & Drop Inputs */
                <div className="fare-form-locations-wrapper">
                  <div className="fare-form-field">
                    <label className="fare-form-label" htmlFor="calc-pickup">
                      <MapPin size={13} color="#0099FF" />
                      <span>Pickup Location *</span>
                    </label>
                    <SearchableLocationInput
                      id="calc-pickup"
                      value={formPickupCustom || formPickupId}
                      popularLocations={allLocations}
                      puneLocations={puneLocations}
                      mumbaiLocations={mumbaiLocations}
                      placeholder="Choose or search pickup address..."
                      onSelect={handlePickupSelect}
                      icon={MapPin}
                      iconColor="#0099FF"
                      ariaLabel="Pickup Location"
                    />
                  </div>

                  <div className="fare-form-swap-col">
                    <button
                      type="button"
                      onClick={handleFormSwap}
                      className="fare-form-swap-btn"
                      title="Swap Pickup and Drop Locations"
                      aria-label="Swap Locations"
                    >
                      <ArrowLeftRight size={15} />
                    </button>
                  </div>

                  <div className="fare-form-field">
                    <label className="fare-form-label" htmlFor="calc-drop">
                      <Navigation size={13} color="#10B981" />
                      <span>Drop Destination *</span>
                    </label>
                    <SearchableLocationInput
                      id="calc-drop"
                      value={formDropCustom || formDropId}
                      popularLocations={allLocations}
                      puneLocations={puneLocations}
                      mumbaiLocations={mumbaiLocations}
                      placeholder="Choose or search drop address..."
                      onSelect={handleDropSelect}
                      icon={Navigation}
                      iconColor="#10B981"
                      ariaLabel="Drop Destination"
                    />
                  </div>
                </div>
              )}

              {/* Schedule and Vehicle Options */}
              <div className="fare-form-grid-3">
                <div className="fare-form-field">
                  <label className="fare-form-label">
                    <Calendar size={13} color="#0099FF" />
                    <span>Departure Date *</span>
                  </label>
                  <input
                    type="date"
                    min={new Date().toISOString().split('T')[0]}
                    value={formDepartureDate}
                    onChange={(e) => {
                      setFormDepartureDate(e.target.value);
                      setFormError('');
                    }}
                    className="fare-form-input"
                  />
                </div>

                <div className="fare-form-field">
                  <label className="fare-form-label">
                    <Clock size={13} color="#0099FF" />
                    <span>Pickup Time *</span>
                  </label>
                  <select
                    value={formDepartureTime}
                    onChange={(e) => {
                      setFormDepartureTime(e.target.value);
                      setFormError('');
                    }}
                    className="fare-form-input"
                  >
                    {TIME_OPTIONS.map((slot) => (
                      <option key={slot} value={slot}>
                        {slot}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="fare-form-field">
                  <label className="fare-form-label">
                    <Car size={13} color="#0099FF" />
                    <span>Vehicle Preference</span>
                  </label>
                  <select
                    value={formCategory}
                    onChange={(e) => {
                      setFormCategory(e.target.value);
                      setFormVehicleName('');
                    }}
                    className="fare-form-input"
                  >
                    <option value="ALL">All Available Vehicles</option>
                    <option value="SEDAN">Executive Sedan (Dzire / Etios)</option>
                    <option value="SUV">Spacious SUV (Ertiga / Carens)</option>
                    <option value="INNOVA_CRYSTA">Luxury Crysta</option>
                    <option value="TEMPO_TRAVELLER">Mini Bus & Tempo Traveller</option>
                  </select>
                </div>
              </div>

              {/* Round Trip Return Date & Time */}
              {formTripType === 'ROUND_TRIP' && (
                <div className="fare-form-grid-2" style={{ marginTop: '0.75rem' }}>
                  <div className="fare-form-field">
                    <label className="fare-form-label">
                      <Calendar size={13} color="#6366F1" />
                      <span>Return Date *</span>
                    </label>
                    <input
                      type="date"
                      min={formDepartureDate || new Date().toISOString().split('T')[0]}
                      value={formReturnDate}
                      onChange={(e) => {
                        setFormReturnDate(e.target.value);
                        setFormError('');
                      }}
                      className="fare-form-input"
                    />
                  </div>

                  <div className="fare-form-field">
                    <label className="fare-form-label">
                      <Clock size={13} color="#6366F1" />
                      <span>Return Time *</span>
                    </label>
                    <select
                      value={formReturnTime}
                      onChange={(e) => {
                        setFormReturnTime(e.target.value);
                        setFormError('');
                      }}
                      className="fare-form-input"
                    >
                      {TIME_OPTIONS.map((slot) => (
                        <option key={slot} value={slot}>
                          {slot}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {/* Form Actions */}
              <div className="fare-form-actions-row">
                <button
                  type="submit"
                  disabled={isSubmittingForm}
                  className="fare-form-calculate-btn"
                >
                  {isSubmittingForm ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      <span>Calculating Verified Fare...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles size={16} />
                      <span>Calculate Verified Fare</span>
                    </>
                  )}
                </button>

                {hasValidJourney && (
                  <button
                    type="button"
                    onClick={() => setShowCalculatorForm(false)}
                    className="fare-form-cancel-btn"
                  >
                    <span>Cancel & View Results</span>
                  </button>
                )}
              </div>
            </form>
          </div>
        )}

        {/* Results Area */}
        {loading ? (
          <div className="fare-loading-box">
            <Loader2 size={36} className="animate-spin" color="#1D4ED8" />
            <h3>Checking vehicle availability & toll rates...</h3>
            <p>Fetching real-time server verified pricing for your trip</p>
          </div>
        ) : error ? (
          <div
            className="fare-error-box"
            style={{
              textAlign: 'center',
              padding: '3rem 1.5rem',
              background: '#FEF2F2',
              border: '1px solid #FECACA',
              borderRadius: '1rem',
              margin: '2rem 0'
            }}
          >
            <AlertCircle size={40} color="#DC2626" style={{ margin: '0 auto 1rem' }} />
            <h3 style={{ color: '#991B1B', fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem' }}>
              Fare Verification Unavailable
            </h3>
            <p style={{ color: '#B91C1C', marginBottom: '1.5rem', maxWidth: '480px', margin: '0 auto 1.5rem', fontSize: '0.95rem' }}>
              {error}
            </p>
            <button
              onClick={() => fetchQuote()}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                background: '#DC2626',
                color: '#FFFFFF',
                border: 'none',
                padding: '0.75rem 1.5rem',
                borderRadius: '0.5rem',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              <RotateCcw size={16} />
              <span>Retry Verification</span>
            </button>
          </div>
        ) : isCustomRoute && hasValidJourney ? (
          /* Custom Outstation Route Result Card */
          <div className="custom-route-card">
            <div className="custom-route-header">
              <span className="custom-route-badge">
                <Sparkles size={13} color="#D97706" />
                <span>Custom Outstation Route</span>
              </span>
              <h2>
                {pickupDisplayName || 'Custom Pickup'} ➔ {dropDisplayName || 'Custom Destination'}
              </h2>
              <p className="custom-route-desc">
                Chauffeur-driven private cab service tailored for your exact itinerary. Because custom
                highway corridors vary by distance and state permits, our 24/7 travel desk provides
                instant, guaranteed all-inclusive fares with zero hidden costs.
              </p>
            </div>

            <div className="custom-route-itinerary-strip">
              <div className="itinerary-item">
                <MapPin size={16} color="#0099FF" />
                <div>
                  <span className="itinerary-lbl">Doorstep Pickup</span>
                  <strong>{pickupAddressParam || pickupDisplayName || 'Selected Address'}</strong>
                </div>
              </div>
              <div className="itinerary-item">
                <Navigation size={16} color="#10B981" />
                <div>
                  <span className="itinerary-lbl">Destination Drop</span>
                  <strong>{dropAddressParam || dropDisplayName || 'Selected Destination'}</strong>
                </div>
              </div>
              <div className="itinerary-item">
                <Calendar size={16} color="#6366F1" />
                <div>
                  <span className="itinerary-lbl">Journey Schedule</span>
                  <strong>
                    {departureDate} at {departureTime} (
                    {tripType === 'ROUND_TRIP' ? 'Round Trip' : 'One Way'})
                  </strong>
                </div>
              </div>
            </div>

            <div className="custom-route-perks-grid">
              <div className="custom-perk">
                <CheckCircle2 size={16} color="#10B981" />
                <span>Expressway & Highway Certified Drivers</span>
              </div>
              <div className="custom-perk">
                <CheckCircle2 size={16} color="#10B981" />
                <span>Clean, Sanitized AC Sedans & SUVs</span>
              </div>
              <div className="custom-perk">
                <CheckCircle2 size={16} color="#10B981" />
                <span>Luggage Carrier & Fastag Enabled</span>
              </div>
              <div className="custom-perk">
                <CheckCircle2 size={16} color="#10B981" />
                <span>Zero Advance Payment / Pay on Pickup</span>
              </div>
            </div>

            <div className="custom-route-cta-group">
              <button
                type="button"
                onClick={() => setIsEnquiryModalOpen(true)}
                className="custom-route-quote-btn"
              >
                <Sparkles size={16} />
                <span>Request Custom Route Quote</span>
              </button>

              <a
                href={getWhatsAppLink({
                  pickup: pickupAddressParam || pickupDisplayName,
                  destination: dropAddressParam || dropDisplayName,
                  date: departureDate,
                  time: departureTime,
                  tripType: tripType === 'ROUND_TRIP' ? 'Round Trip' : 'One Way',
                  passengers,
                })}
                target="_blank"
                rel="noopener noreferrer"
                className="custom-route-wa-btn"
              >
                <MessageSquare size={16} />
                <span>Instant Quote on WhatsApp</span>
              </a>

              <button
                type="button"
                onClick={handleModifyLocations}
                className="custom-route-back-btn"
              >
                <RotateCcw size={15} />
                <span>Modify Locations</span>
              </button>
            </div>
          </div>
        ) : hasValidJourney && quoteData?.vehicles?.length === 0 ? (
          <div className="fare-error-box">
            <Car size={36} color="#CBD5E1" style={{ margin: '0 auto 1rem' }} />
            <h3>No Vehicles Available</h3>
            <p>No vehicles match the selected passenger count or trip criteria.</p>
            <button
              type="button"
              onClick={handleModifyLocations}
              className="admin-btn-primary"
              style={{ marginTop: '1rem' }}
            >
              Modify Search
            </button>
          </div>
        ) : hasValidJourney && quoteData ? (
          /* Supported Route Verified Cabs View */
          <div>
            {/* Journey Summary Bar with Modify Route Action */}
            <div className="fare-journey-summary-bar">
              <div className="summary-route-info">
                <MapPin size={16} color="#2563EB" />
                <span>
                  Route:{' '}
                  <strong>
                    {pickupDisplayName} ➔ {dropDisplayName}
                  </strong>{' '}
                  ({tripType === 'ROUND_TRIP' ? 'Round Trip' : 'One Way'} • {departureDate} at{' '}
                  {departureTime})
                </span>
              </div>
              <button
                type="button"
                onClick={handleModifyLocations}
                className="fare-modify-route-btn"
              >
                <RotateCcw size={14} />
                <span>Modify Route / Dates</span>
              </button>
            </div>

            {/* Category Filter Tabs Bar */}
            <div className="fare-filter-tabs">
              <button
                type="button"
                onClick={() => setActiveCategory('ALL')}
                className={`fare-tab-pill ${activeCategory === 'ALL' ? 'active' : ''}`}
              >
                All Fleets ({allVehicles.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveCategory('SEDAN')}
                className={`fare-tab-pill ${activeCategory === 'SEDAN' ? 'active' : ''}`}
              >
                Sedans (4-Seater)
              </button>
              <button
                type="button"
                onClick={() => setActiveCategory('SUV')}
                className={`fare-tab-pill ${activeCategory === 'SUV' ? 'active' : ''}`}
              >
                Spacious SUVs (6-Seater)
              </button>
              <button
                type="button"
                onClick={() => setActiveCategory('INNOVA_CRYSTA')}
                className={`fare-tab-pill ${activeCategory === 'INNOVA_CRYSTA' ? 'active' : ''}`}
              >
                Executive Crysta / Luxury
              </button>
              <button
                type="button"
                onClick={() => setActiveCategory('TEMPO_TRAVELLER')}
                className={`fare-tab-pill ${activeCategory === 'TEMPO_TRAVELLER' ? 'active' : ''}`}
              >
                Mini Bus & Tempo
              </button>
            </div>

            {filteredVehicles.length === 0 ? (
              <div className="fare-error-box" style={{ marginTop: '1.5rem' }}>
                <Car size={32} color="#CBD5E1" style={{ margin: '0 auto 0.75rem' }} />
                <h3>No Cabs Found in this Category</h3>
                <p>Try viewing all vehicles to explore other available options.</p>
                <button
                  type="button"
                  onClick={() => setActiveCategory('ALL')}
                  className="admin-btn-primary"
                  style={{ marginTop: '1rem' }}
                >
                  View All Available Cabs
                </button>
              </div>
            ) : (
              <div className="fare-cabs-grid">
                {filteredVehicles.map((v, idx) => {
                  const isExpanded = expandedBreakdownId === v.vehicleId;
                  const hasFare = v.fare?.configured && v.fare?.total > 0;
                  const isUnavailable = v.availability === 'UNAVAILABLE';
                  const isSelectedMatch =
                    (vehicleNameParam &&
                      v.name?.toLowerCase().includes(vehicleNameParam.toLowerCase())) ||
                    (categoryParam && categoryParam !== 'ALL' && v.category === categoryParam);

                  // Resolve Fuel Type from description
                  let fuelType = 'CNG / Petrol';
                  if (v.description?.toLowerCase().includes('diesel')) {
                    fuelType = 'Diesel (AC)';
                  } else if (v.description?.toLowerCase().includes('cng')) {
                    fuelType = 'CNG / Petrol';
                  }

                  return (
                    <div
                      key={v.vehicleId}
                      className={`fare-cab-card reveal stagger-${(idx % 4) + 1} ${
                        isSelectedMatch ? 'selected-model-card' : ''
                      }`}
                    >
                      {/* Left Column: Image & Vehicle Specs */}
                      <div className="cab-image-col">
                        <img
                          src={
                            v.image?.startsWith('http') || v.image?.startsWith('/uploads')
                              ? `${v.image.startsWith('/uploads') ? API_BASE_URL : ''}${v.image}`
                              : v.image || '/assets/sedan.webp'
                          }
                          alt={v.name}
                          className="cab-photo"
                          onError={(e) => {
                            e.target.src = '/assets/sedan.webp';
                          }}
                        />
                        <div className="cab-category-pill">{v.category}</div>
                        {isSelectedMatch && (
                          <div className="cab-match-tag">
                            <Sparkles size={11} color="#D97706" />
                            <span>CHOSEN MODEL</span>
                          </div>
                        )}
                      </div>

                      {/* Middle Column: Specs & Inclusions */}
                      <div className="cab-info-col">
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.6rem',
                            flexWrap: 'wrap',
                          }}
                        >
                          <h2 className="cab-title">{v.name}</h2>
                          {isSelectedMatch && (
                            <span className="cab-recommended-chip">⭐ Recommended from Fleet</span>
                          )}
                        </div>

                        <div className="cab-badges-row">
                          <span className="cab-spec-badge">
                            <Users size={13} color="#0099FF" />
                            <span>{v.seatingCapacity} Seater</span>
                          </span>
                          <span className="cab-spec-badge fuel-badge">
                            <Fuel size={13} color="#10B981" />
                            <span>{fuelType}</span>
                          </span>
                          <span className="cab-spec-badge">
                            <Luggage size={13} color="#6366F1" />
                            <span>{v.seatingCapacity >= 6 ? '3 Large Bags' : '2 Bags'}</span>
                          </span>
                        </div>

                        <p className="cab-description-text">
                          {v.description ||
                            'Sanitized AC vehicle, clean seats, well-maintained expressway certified commercial cab.'}
                        </p>

                        <div className="cab-inclusions-grid">
                          <div className="inclusion-item">
                            <CheckCircle2 size={14} color="#10B981" />
                            <span>
                              {isLocalTrip
                                ? 'Fuel & Driver Included'
                                : isIntercityExpressway
                                ? 'Expressway Tolls Included'
                                : 'Tolls & Taxes Included'}
                            </span>
                          </div>
                          <div className="inclusion-item">
                            <CheckCircle2 size={14} color="#10B981" />
                            <span>Doorstep Pickup & Drop</span>
                          </div>
                          <div className="inclusion-item">
                            <CheckCircle2 size={14} color="#10B981" />
                            <span>Zero Cancellation Fee</span>
                          </div>
                          <div className="inclusion-item">
                            <CheckCircle2 size={14} color="#10B981" />
                            <span>Commercial Driver & GPS</span>
                          </div>
                        </div>

                        {/* Breakdown Toggle */}
                        {hasFare && (
                          <div className="cab-breakdown-wrapper">
                            <button
                              type="button"
                              onClick={() =>
                                setExpandedBreakdownId(isExpanded ? null : v.vehicleId)
                              }
                              className="breakdown-toggle-btn"
                            >
                              <span>{isExpanded ? 'Hide Fare Breakdown' : 'View Fare Breakdown'}</span>
                              {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                            </button>

                            {isExpanded && (
                              <div className="fare-breakdown-box">
                                <div className="breakdown-row">
                                  <span>Base Vehicle Fare:</span>
                                  <span>₹{v.fare.baseFare?.toLocaleString()}</span>
                                </div>
                                {v.fare.toll > 0 && (
                                  <div className="breakdown-row">
                                    <span>Expressway Tolls:</span>
                                    <span>+₹{v.fare.toll?.toLocaleString()}</span>
                                  </div>
                                )}
                                {v.fare.parking > 0 && (
                                  <div className="breakdown-row">
                                    <span>Airport / City Parking:</span>
                                    <span>+₹{v.fare.parking?.toLocaleString()}</span>
                                  </div>
                                )}
                                {v.fare.extraHourCharge > 0 && (
                                  <div className="breakdown-row">
                                    <span>Extra Hour Rate:</span>
                                    <span>₹{v.fare.extraHourCharge}/hr</span>
                                  </div>
                                )}
                                <div className="breakdown-row total-row">
                                  <span>Estimated Final Total:</span>
                                  <span>₹{v.fare.total?.toLocaleString()}</span>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Right Column: Pricing & Selection Button */}
                      <div className="cab-price-col">
                        <div className="price-tag-wrapper">
                          {hasFare ? (
                            <>
                              <div className="price-label">All-Inclusive Fare</div>
                              <div className="price-amount">₹{v.fare.total?.toLocaleString()}</div>
                              <div className="price-sub">Tolls & Taxes Included</div>
                            </>
                          ) : (
                            <>
                              <div className="price-label">Custom Quote</div>
                              <div className="price-amount" style={{ fontSize: '1.25rem' }}>
                                On Request
                              </div>
                              <div className="price-sub">Contact 24x7 Dispatch</div>
                            </>
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={() => handleSelectCab(v)}
                          disabled={isUnavailable}
                          className={`cab-select-btn ${isUnavailable ? 'disabled' : ''}`}
                        >
                          <span>{isUnavailable ? 'SOLD OUT' : 'SELECT CAB'}</span>
                          {!isUnavailable && <ArrowRight size={16} />}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : null}
      </main>

      <EnquiryModal
        isOpen={isEnquiryModalOpen}
        onClose={() => setIsEnquiryModalOpen(false)}
        initialData={{
          pickup: pickupAddressParam || pickupDisplayName,
          destination: dropAddressParam || dropDisplayName,
          date: departureDate,
          vehicle: vehicleNameParam || 'Executive Sedan',
          message: `Custom route enquiry: ${pickupDisplayName} to ${dropDisplayName} on ${departureDate} (${
            tripType === 'ROUND_TRIP' ? 'Round Trip' : 'One Way'
          }).`,
        }}
      />

      <Footer />
    </div>
  );
};
