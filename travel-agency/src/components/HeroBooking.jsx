import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Car,
  Clock,
  ArrowLeftRight,
  MapPin,
  Calendar,
  Users,
  Sparkles,
  AlertCircle,
  Navigation,
  Zap,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import gsap from 'gsap';
import { businessConfig } from '../config/business.config';
import { locationApi } from '../services/api';
import { homepageContent } from '../data/homepageContent';
import { SearchableLocationInput } from './SearchableLocationInput';
import { detectLocationRegion } from '../services/locationSearchService';

const TIME_SLOTS = [
  '12:00 AM', '01:00 AM', '02:00 AM', '03:00 AM', '04:00 AM', '05:00 AM',
  '06:00 AM', '07:00 AM', '08:00 AM', '09:00 AM', '10:00 AM', '11:00 AM',
  '12:00 PM', '01:00 PM', '02:00 PM', '03:00 PM', '04:00 PM', '05:00 PM',
  '06:00 PM', '07:00 PM', '08:00 PM', '09:00 PM', '10:00 PM', '11:00 PM',
];

// In-memory module cache for locations across sessions
let cachedLocations = null;
let cachedPuneLocations = null;
let cachedMumbaiLocations = null;

export const HeroBooking = () => {
  const navigate = useNavigate();
  const swapBtnRef = useRef(null);

  // Travel Mode: 'ONE_WAY' | 'ROUND_TRIP' | 'LOCAL'
  const [tripType, setTripType] = useState('ONE_WAY');

  // Locations from backend (cached to eliminate any initial render blink)
  const [locations, setLocations] = useState(() => cachedLocations || []);
  const [puneLocations, setPuneLocations] = useState(() => cachedPuneLocations || []);
  const [mumbaiLocations, setMumbaiLocations] = useState(() => cachedMumbaiLocations || []);

  // Form states with placeholder-first defaults
  const [pickupLocationId, setPickupLocationId] = useState('');
  const [dropLocationId, setDropLocationId] = useState('');
  const [pickupCustom, setPickupCustom] = useState(null);
  const [dropCustom, setDropCustom] = useState(null);
  const [localCity, setLocalCity] = useState(''); // 'Pune' | 'Mumbai'
  const [localDuration, setLocalDuration] = useState(''); // 4, 8, 12
  const [departureDate, setDepartureDate] = useState('');
  const [departureTime, setDepartureTime] = useState('');
  const [returnDate, setReturnDate] = useState('');
  const [returnTime, setReturnTime] = useState('');
  const [passengers, setPassengers] = useState('1');

  // Inline Validation Error State
  const [validationError, setValidationError] = useState('');

  // Fetch Locations from Backend on Mount & Listen to Trip Selection events
  useEffect(() => {
    if (!cachedLocations || cachedLocations.length === 0) {
      locationApi
        .getLocations()
        .then((res) => {
          const data = res.data?.data || [];
          cachedLocations = data;

          const puneList = data.filter(
            (l) => l.side === 'PUNE_SIDE' || l.city?.toLowerCase() === 'pune'
          );
          const mumbaiList = data.filter(
            (l) =>
              l.side === 'MUMBAI_SIDE' ||
              ['mumbai', 'thane', 'navi mumbai'].includes(l.city?.toLowerCase())
          );

          cachedPuneLocations = puneList;
          cachedMumbaiLocations = mumbaiList;

          setLocations(data);
          setPuneLocations(puneList);
          setMumbaiLocations(mumbaiList);
        })
        .catch((err) => console.log('Location API notice:', err.message));
    }

    const handleSelectTripType = (e) => {
      const type = e.detail;
      if (['ONE_WAY', 'ROUND_TRIP', 'LOCAL'].includes(type)) {
        setTripType(type);
        setValidationError('');
        const el = document.getElementById('home');
        if (el) {
          el.scrollIntoView({ behavior: 'smooth' });
        }
      }
    };

    const handlePreFill = (e) => {
      const { tripType: tt, pickupId: pId, dropId: dId, fromPune, fromMumbai } = e.detail || {};
      if (tt) setTripType(tt);
      if (pId) {
        setPickupLocationId(pId);
        const match = (cachedLocations || []).find((l) => l.id === pId);
        if (match) setPickupCustom(match);
      }
      if (dId) {
        setDropLocationId(dId);
        const match = (cachedLocations || []).find((l) => l.id === dId);
        if (match) setDropCustom(match);
      }
      setValidationError('');
      const el = document.getElementById('home');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      }
    };

    window.addEventListener('selectTripType', handleSelectTripType);
    window.addEventListener('preFillBooking', handlePreFill);
    return () => {
      window.removeEventListener('selectTripType', handleSelectTripType);
      window.removeEventListener('preFillBooking', handlePreFill);
    };
  }, []);

  // Selection Handlers for Searchable Location Inputs
  const handlePickupSelect = (loc) => {
    if (!loc) {
      setPickupLocationId('');
      setPickupCustom(null);
      setDropLocationId('');
      setDropCustom(null);
      return;
    }
    setPickupCustom(loc);
    setPickupLocationId(loc.id || 'custom');
    setValidationError('');
  };

  const handleDropSelect = (loc) => {
    if (!loc) {
      setDropLocationId('');
      setDropCustom(null);
      return;
    }
    setDropCustom(loc);
    setDropLocationId(loc.id || 'custom');
    setValidationError('');
  };

  // Determine current pickup side to restrict available drop locations
  const selectedPickup = locations.find((l) => l.id === pickupLocationId);
  const effectivePickupSide = pickupCustom?.side || selectedPickup?.side;
  const isPickupPuneSide =
    effectivePickupSide === 'PUNE_SIDE' ||
    pickupCustom?.city?.toLowerCase() === 'pune' ||
    selectedPickup?.side === 'PUNE_SIDE' ||
    selectedPickup?.city?.toLowerCase() === 'pune';

  const isPickupMumbaiSide =
    effectivePickupSide === 'MUMBAI_SIDE' ||
    ['mumbai', 'thane', 'navi mumbai'].includes(pickupCustom?.city?.toLowerCase()) ||
    selectedPickup?.side === 'MUMBAI_SIDE' ||
    ['mumbai', 'thane', 'navi mumbai'].includes(selectedPickup?.city?.toLowerCase());

  // Dependent Dropdown List
  const availableDropLocations = isPickupPuneSide
    ? mumbaiLocations
    : isPickupMumbaiSide
    ? puneLocations
    : locations;

  // Handle Swap Locations with GSAP Circular Animation
  const handleSwap = () => {
    if (swapBtnRef.current) {
      gsap.to(swapBtnRef.current, {
        rotation: '+=180',
        scale: 1.15,
        duration: 0.35,
        ease: 'back.out(2)',
        onComplete: () => {
          gsap.to(swapBtnRef.current, { scale: 1, duration: 0.15 });
        },
      });
    }

    const prevPickupId = pickupLocationId;
    const prevDropId = dropLocationId;
    const prevPickupCustom = pickupCustom;
    const prevDropCustom = dropCustom;

    setPickupLocationId(prevDropId);
    setDropLocationId(prevPickupId);
    setPickupCustom(prevDropCustom);
    setDropCustom(prevPickupCustom);
    setValidationError('');
  };

  // Form Submit & Revalidation
  const handleCheckFare = (e) => {
    e.preventDefault();
    setValidationError('');

    // ==========================================
    // 1. VALIDATION: LOCAL TRAVEL
    // ==========================================
    if (tripType === 'LOCAL') {
      if (!localCity) {
        setValidationError('Please choose a city for local cab rental.');
        return;
      }
      if (!localDuration) {
        setValidationError('Please choose a rental duration package.');
        return;
      }
      if (!departureDate) {
        setValidationError('Please select your journey date.');
        return;
      }
      if (!departureTime) {
        setValidationError('Please select your pickup time.');
        return;
      }

      const queryParams = new URLSearchParams({
        tripType: 'LOCAL',
        city: localCity,
        duration: localDuration,
        date: departureDate,
        time: departureTime,
        passengers: passengers || '1',
      });

      navigate(`/fare?${queryParams.toString()}`);
      return;
    }

    // ==========================================
    // 2. VALIDATION: ONE_WAY & ROUND_TRIP
    // ==========================================
    const hasPickup = Boolean(pickupLocationId || pickupCustom);
    const hasDrop = Boolean(dropLocationId || dropCustom);

    if (!hasPickup) {
      setValidationError('Please choose or search your Pickup location.');
      return;
    }
    if (!hasDrop) {
      setValidationError('Please choose or search your Drop location.');
      return;
    }

    const pickupKey = (pickupCustom?.formattedAddress || pickupCustom?.name || pickupLocationId || '').toLowerCase().trim();
    const dropKey = (dropCustom?.formattedAddress || dropCustom?.name || dropLocationId || '').toLowerCase().trim();

    if (pickupKey && dropKey && pickupKey === dropKey) {
      setValidationError('Pickup and Drop locations must be different.');
      return;
    }
    if (!departureDate) {
      setValidationError('Please select your Departure Date.');
      return;
    }
    if (!departureTime) {
      setValidationError('Please select your Pickup Time.');
      return;
    }

    if (tripType === 'ROUND_TRIP') {
      if (!returnDate) {
        setValidationError('Please select your Return Date.');
        return;
      }
      if (returnDate < departureDate) {
        setValidationError('Return Date cannot be before Departure Date.');
        return;
      }
      if (!returnTime) {
        setValidationError('Please select your Return Time.');
        return;
      }
    }

    // Format display names and addresses
    const pickupAddr = pickupCustom?.formattedAddress || pickupCustom?.name || selectedPickup?.name || '';
    const dropAddr = dropCustom?.formattedAddress || dropCustom?.name || locations.find((l) => l.id === dropLocationId)?.name || '';
    const pickupName = pickupCustom?.name || selectedPickup?.name || pickupAddr;
    const dropName = dropCustom?.name || locations.find((l) => l.id === dropLocationId)?.name || dropAddr;

    // Detect regions
    const detectedPickup = detectLocationRegion(pickupAddr, pickupCustom?.lat, pickupCustom?.lon);
    const detectedDrop = detectLocationRegion(dropAddr, dropCustom?.lat, dropCustom?.lon);

    const effPickupSide = pickupCustom?.side || selectedPickup?.side || detectedPickup.side;
    const effDropSide = dropCustom?.side || locations.find((l) => l.id === dropLocationId)?.side || detectedDrop.side;

    const puneAll = puneLocations.find((l) => l.name.includes('All Areas')) || puneLocations[0];
    const mumbaiAll = mumbaiLocations.find((l) => l.name.includes('All Areas')) || mumbaiLocations[0];

    let resolvedPickupId = pickupLocationId !== 'custom' ? pickupLocationId : '';
    let resolvedDropId = dropLocationId !== 'custom' ? dropLocationId : '';
    let isCustomRoute = false;

    // Supported Pune -> Mumbai Corridor
    if (effPickupSide === 'PUNE_SIDE' && effDropSide === 'MUMBAI_SIDE') {
      if (!resolvedPickupId) resolvedPickupId = puneAll?.id || puneLocations[0]?.id;
      if (!resolvedDropId) resolvedDropId = mumbaiAll?.id || mumbaiLocations[0]?.id;
    }
    // Supported Mumbai -> Pune Corridor
    else if (effPickupSide === 'MUMBAI_SIDE' && effDropSide === 'PUNE_SIDE') {
      if (!resolvedPickupId) resolvedPickupId = mumbaiAll?.id || mumbaiLocations[0]?.id;
      if (!resolvedDropId) resolvedDropId = puneAll?.id || puneLocations[0]?.id;
    }
    // Otherwise custom outstation route (e.g. Pune to Mahabaleshwar / Shirdi / Goa)
    else {
      isCustomRoute = true;
    }

    const queryParamsObj = {
      tripType,
      pickupId: resolvedPickupId || 'custom',
      dropId: resolvedDropId || 'custom',
      pickupAddress: pickupAddr,
      dropAddress: dropAddr,
      pickupName,
      dropName,
      isCustomRoute: isCustomRoute ? 'true' : 'false',
      date: departureDate,
      time: departureTime,
      departureDate,
      departureTime,
      passengers: passengers || '1',
      ...(tripType === 'ROUND_TRIP' && { returnDate, returnTime }),
    };

    const queryParams = new URLSearchParams(queryParamsObj);
    navigate(`/fare?${queryParams.toString()}`);
  };

  return (
    <section id="home" className="hero-split-section">
      {/* Background Banner Image */}
      <div className="hero-bg-wrapper">
        <img
          src={homepageContent.hero.bgImage}
          alt={homepageContent.hero.bgImageAlt}
          className="hero-bg-img"
          fetchPriority="high"
          width="1920"
          height="1080"
          decoding="async"
        />
        <div className="hero-bg-overlay"></div>
      </div>

      <div className="hero-split-container container">
        {/* Left Column: Heading & Trust Highlights */}
        <div className="hero-left-col">
          <div className="hero-eyebrow">
            <Sparkles size={13} color="#38BDF8" />
            <span>{homepageContent.hero.eyebrow}</span>
          </div>

          <h1 className="hero-title">
            {homepageContent.hero.titlePrimary}
            <span className="hero-title-sub">{homepageContent.hero.titleSecondary}</span>
          </h1>

          <p className="hero-description">
            {homepageContent.hero.description}
          </p>

          <div className="hero-trust-chips">
            {homepageContent.hero.trustChips.map((chip, idx) => (
              <div key={idx} className="hero-chip">
                <span className={`chip-indicator ${chip.color}`}></span>
                <span>{chip.text}</span>
              </div>
            ))}
          </div>

          <div className="hero-dispatch-notice-pill">
            <div className="notice-icon-box">
              <Zap size={14} color="#38BDF8" />
            </div>
            <span className="notice-text">
              <strong>{homepageContent.hero.dispatchNotice.headline}</strong> {homepageContent.hero.dispatchNotice.text}
            </span>
          </div>
        </div>

        {/* Right Column: Wide Compact 3-Mode Booking Card */}
        <div className="hero-right-col">
          <div className="booking-card-wrapper">
            {/* 3 Travel Mode Tabs */}
            <div className="booking-tabs-grid">
              <button
                type="button"
                onClick={() => {
                  setTripType('ONE_WAY');
                  setValidationError('');
                }}
                className={`booking-tab-btn ${tripType === 'ONE_WAY' ? 'active' : ''}`}
              >
                <Car size={15} />
                <span>One Way</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setTripType('ROUND_TRIP');
                  setValidationError('');
                }}
                className={`booking-tab-btn ${tripType === 'ROUND_TRIP' ? 'active' : ''}`}
              >
                <ArrowLeftRight size={15} />
                <span>Round Trip</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setTripType('LOCAL');
                  setValidationError('');
                }}
                className={`booking-tab-btn ${tripType === 'LOCAL' ? 'active' : ''}`}
              >
                <Clock size={15} />
                <span>Local</span>
              </button>
            </div>

            {/* Validation Error Alert */}
            {validationError && (
              <div
                style={{
                  backgroundColor: '#FEF2F2',
                  border: '1px solid #FCA5A5',
                  color: '#B91C1C',
                  padding: '0.5rem 0.85rem',
                  borderRadius: '8px',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  margin: '0.65rem 1.15rem 0',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                }}
              >
                <AlertCircle size={15} style={{ flexShrink: 0 }} />
                <span>{validationError}</span>
              </div>
            )}

            {/* Main Form */}
            <form onSubmit={handleCheckFare} className="booking-form-body">
              {/* ================================================= */}
              {/* MODE 1: ONE WAY (Horizontal Compact 2-Row Layout) */}
              {/* ================================================= */}
              {tripType === 'ONE_WAY' && (
                <>
                  {/* Row 1: Pickup + Swap + Drop in 1 Horizontal Line */}
                  <div className="booking-locations-horizontal">
                    <div className="booking-field-group">
                      <label className="booking-label" htmlFor="hero-oneway-pickup">
                        <MapPin size={13} color="#0099FF" />
                        <span>Pickup Location *</span>
                      </label>
                      <SearchableLocationInput
                        id="hero-oneway-pickup"
                        value={pickupCustom || pickupLocationId}
                        popularLocations={locations}
                        puneLocations={puneLocations}
                        mumbaiLocations={mumbaiLocations}
                        placeholder="Choose or search pickup location..."
                        onSelect={handlePickupSelect}
                        icon={MapPin}
                        iconColor="#0099FF"
                        ariaLabel="Pickup Location"
                      />
                    </div>

                    <div className="booking-swap-container-inline">
                      <button
                        type="button"
                        ref={swapBtnRef}
                        onClick={handleSwap}
                        className="booking-swap-btn"
                        title="Swap Locations"
                        aria-label="Swap Locations"
                      >
                        <ArrowLeftRight size={14} />
                      </button>
                    </div>

                    <div className="booking-field-group">
                      <label className="booking-label" htmlFor="hero-oneway-drop">
                        <Navigation size={13} color="#10B981" />
                        <span>Drop Location *</span>
                      </label>
                      <SearchableLocationInput
                        id="hero-oneway-drop"
                        value={dropCustom || dropLocationId}
                        popularLocations={availableDropLocations}
                        puneLocations={isPickupMumbaiSide ? puneLocations : []}
                        mumbaiLocations={isPickupPuneSide ? mumbaiLocations : []}
                        sidePreference={isPickupPuneSide ? 'MUMBAI_SIDE' : isPickupMumbaiSide ? 'PUNE_SIDE' : null}
                        disabled={!pickupLocationId && !pickupCustom}
                        placeholder={!pickupLocationId && !pickupCustom ? 'Select pickup first' : 'Choose or search drop location...'}
                        onSelect={handleDropSelect}
                        icon={Navigation}
                        iconColor="#10B981"
                        ariaLabel="Drop Location"
                      />
                    </div>
                  </div>

                  {/* Row 2: Date + Time + Passengers in 3 Horizontal Columns */}
                  <div className="booking-row-3col">
                    <div className="booking-field-group">
                      <label className="booking-label">
                        <Calendar size={13} color="#0099FF" />
                        <span>Departure Date *</span>
                      </label>
                      <input
                        type="date"
                        min={new Date().toISOString().split('T')[0]}
                        value={departureDate}
                        onChange={(e) => {
                          setDepartureDate(e.target.value);
                          setValidationError('');
                        }}
                        className="booking-input-control"
                      />
                    </div>

                    <div className="booking-field-group">
                      <label className="booking-label">
                        <Clock size={13} color="#0099FF" />
                        <span>Pickup Time *</span>
                      </label>
                      <select
                        value={departureTime}
                        onChange={(e) => {
                          setDepartureTime(e.target.value);
                          setValidationError('');
                        }}
                        className="booking-select-control"
                      >
                        <option value="">Choose time</option>
                        {TIME_SLOTS.map((t) => (
                          <option key={t} value={t}>
                            {t}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="booking-field-group">
                      <label className="booking-label">
                        <Users size={13} color="#6366F1" />
                        <span>Passengers</span>
                      </label>
                      <select
                        value={passengers}
                        onChange={(e) => setPassengers(e.target.value)}
                        className="booking-select-control"
                      >
                        <option value="1">1 Person</option>
                        <option value="2">2 Persons</option>
                        <option value="3">3 Persons</option>
                        <option value="4">4 Persons</option>
                        <option value="6">6 Persons (SUV)</option>
                        <option value="12">12+ Persons</option>
                      </select>
                    </div>
                  </div>

                  <div className="booking-perks-strip">
                    <span>✓ Expressway Tolls Included</span>
                    <span className="perk-sep">•</span>
                    <span>✓ Doorstep Pickup</span>
                    <span className="perk-sep">•</span>
                    <span>✓ Zero Return Penalty</span>
                  </div>
                </>
              )}

              {/* ================================================= */}
              {/* MODE 2: ROUND TRIP (Spacious 2-Row Dates & Time)  */}
              {/* ================================================= */}
              {tripType === 'ROUND_TRIP' && (
                <>
                  <div className="booking-locations-horizontal">
                    <div className="booking-field-group">
                      <label className="booking-label" htmlFor="hero-roundtrip-pickup">
                        <MapPin size={13} color="#0099FF" />
                        <span>Pickup Location *</span>
                      </label>
                      <SearchableLocationInput
                        id="hero-roundtrip-pickup"
                        value={pickupCustom || pickupLocationId}
                        popularLocations={locations}
                        puneLocations={puneLocations}
                        mumbaiLocations={mumbaiLocations}
                        placeholder="Choose or search pickup location..."
                        onSelect={handlePickupSelect}
                        icon={MapPin}
                        iconColor="#0099FF"
                        ariaLabel="Pickup Location"
                      />
                    </div>

                    <div className="booking-swap-container-inline">
                      <button
                        type="button"
                        ref={swapBtnRef}
                        onClick={handleSwap}
                        className="booking-swap-btn"
                        title="Swap Locations"
                        aria-label="Swap Locations"
                      >
                        <ArrowLeftRight size={14} />
                      </button>
                    </div>

                    <div className="booking-field-group">
                      <label className="booking-label" htmlFor="hero-roundtrip-drop">
                        <Navigation size={13} color="#10B981" />
                        <span>Drop Location *</span>
                      </label>
                      <SearchableLocationInput
                        id="hero-roundtrip-drop"
                        value={dropCustom || dropLocationId}
                        popularLocations={availableDropLocations}
                        puneLocations={isPickupMumbaiSide ? puneLocations : []}
                        mumbaiLocations={isPickupPuneSide ? mumbaiLocations : []}
                        sidePreference={isPickupPuneSide ? 'MUMBAI_SIDE' : isPickupMumbaiSide ? 'PUNE_SIDE' : null}
                        disabled={!pickupLocationId && !pickupCustom}
                        placeholder={!pickupLocationId && !pickupCustom ? 'Select pickup first' : 'Choose or search drop location...'}
                        onSelect={handleDropSelect}
                        icon={Navigation}
                        iconColor="#10B981"
                        ariaLabel="Drop Location"
                      />
                    </div>
                  </div>

                  {/* Outbound Date + Time */}
                  <div className="booking-row-2col">
                    <div className="booking-field-group">
                      <label className="booking-label">
                        <Calendar size={13} color="#0099FF" />
                        <span>Departure Date *</span>
                      </label>
                      <input
                        type="date"
                        min={new Date().toISOString().split('T')[0]}
                        value={departureDate}
                        onChange={(e) => {
                          setDepartureDate(e.target.value);
                          setValidationError('');
                        }}
                        className="booking-input-control"
                      />
                    </div>

                    <div className="booking-field-group">
                      <label className="booking-label">
                        <Clock size={13} color="#0099FF" />
                        <span>Pickup Time *</span>
                      </label>
                      <select
                        value={departureTime}
                        onChange={(e) => {
                          setDepartureTime(e.target.value);
                          setValidationError('');
                        }}
                        className="booking-select-control"
                      >
                        <option value="">Choose time</option>
                        {TIME_SLOTS.map((t) => (
                          <option key={t} value={t}>
                            {t}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Return Date + Time + Passengers */}
                  <div className="booking-row-3col">
                    <div className="booking-field-group">
                      <label className="booking-label">
                        <Calendar size={13} color="#F59E0B" />
                        <span>Return Date *</span>
                      </label>
                      <input
                        type="date"
                        min={departureDate || new Date().toISOString().split('T')[0]}
                        value={returnDate}
                        onChange={(e) => {
                          setReturnDate(e.target.value);
                          setValidationError('');
                        }}
                        className="booking-input-control"
                      />
                    </div>

                    <div className="booking-field-group">
                      <label className="booking-label">
                        <Clock size={13} color="#F59E0B" />
                        <span>Return Time *</span>
                      </label>
                      <select
                        value={returnTime}
                        onChange={(e) => {
                          setReturnTime(e.target.value);
                          setValidationError('');
                        }}
                        className="booking-select-control"
                      >
                        <option value="">Choose time</option>
                        {TIME_SLOTS.map((t) => (
                          <option key={t} value={t}>
                            {t}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="booking-field-group">
                      <label className="booking-label">
                        <Users size={13} color="#6366F1" />
                        <span>Passengers</span>
                      </label>
                      <select
                        value={passengers}
                        onChange={(e) => setPassengers(e.target.value)}
                        className="booking-select-control"
                      >
                        <option value="1">1 Person</option>
                        <option value="2">2 Persons</option>
                        <option value="3">3 Persons</option>
                        <option value="4">4 Persons</option>
                        <option value="6">6 Persons (SUV)</option>
                        <option value="12">12+ Persons</option>
                      </select>
                    </div>
                  </div>

                  <div className="booking-perks-strip">
                    <span>✓ Round Trip Driver Allowance Included</span>
                    <span className="perk-sep">•</span>
                    <span>✓ 24/7 Cab On Call</span>
                  </div>
                </>
              )}

              {/* ================================================= */}
              {/* MODE 3: LOCAL HOURLY CITY RENTAL                  */}
              {/* ================================================= */}
              {tripType === 'LOCAL' && (
                <>
                  <div className="booking-row-2col">
                    <div className="booking-field-group">
                      <label className="booking-label">
                        <MapPin size={13} color="#0099FF" />
                        <span>Select City *</span>
                      </label>
                      <select
                        value={localCity}
                        onChange={(e) => {
                          setLocalCity(e.target.value);
                          setValidationError('');
                        }}
                        className="booking-select-control"
                      >
                        <option value="">Choose city</option>
                        <option value="Pune">Pune Local City Travel</option>
                        <option value="Mumbai">Mumbai Local City Travel</option>
                      </select>
                    </div>

                    <div className="booking-field-group">
                      <label className="booking-label">
                        <Clock size={13} color="#10B981" />
                        <span>Duration Package *</span>
                      </label>
                      <select
                        value={localDuration}
                        onChange={(e) => {
                          setLocalDuration(e.target.value);
                          setValidationError('');
                        }}
                        className="booking-select-control"
                      >
                        <option value="">Choose duration</option>
                        <option value="4">4 Hours / 40 KMs (Half Day)</option>
                        <option value="8">8 Hours / 80 KMs (Standard)</option>
                        <option value="12">12 Hours / 120 KMs (Full Day)</option>
                      </select>
                    </div>
                  </div>

                  <div className="booking-row-3col">
                    <div className="booking-field-group">
                      <label className="booking-label">
                        <Calendar size={13} color="#0099FF" />
                        <span>Pickup Date *</span>
                      </label>
                      <input
                        type="date"
                        min={new Date().toISOString().split('T')[0]}
                        value={departureDate}
                        onChange={(e) => {
                          setDepartureDate(e.target.value);
                          setValidationError('');
                        }}
                        className="booking-input-control"
                      />
                    </div>

                    <div className="booking-field-group">
                      <label className="booking-label">
                        <Clock size={13} color="#0099FF" />
                        <span>Pickup Time *</span>
                      </label>
                      <select
                        value={departureTime}
                        onChange={(e) => {
                          setDepartureTime(e.target.value);
                          setValidationError('');
                        }}
                        className="booking-select-control"
                      >
                        <option value="">Choose time</option>
                        {TIME_SLOTS.map((t) => (
                          <option key={t} value={t}>
                            {t}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="booking-field-group">
                      <label className="booking-label">
                        <Users size={13} color="#6366F1" />
                        <span>Passengers</span>
                      </label>
                      <select
                        value={passengers}
                        onChange={(e) => setPassengers(e.target.value)}
                        className="booking-select-control"
                      >
                        <option value="1">1 Person</option>
                        <option value="2">2 Persons</option>
                        <option value="3">3 Persons</option>
                        <option value="4">4 Persons</option>
                        <option value="6">6 Persons (SUV)</option>
                      </select>
                    </div>
                  </div>

                  <div className="booking-perks-strip">
                    <span>✓ Flexible Hourly Packages</span>
                    <span className="perk-sep">•</span>
                    <span>✓ Unlimited City Stops</span>
                    <span className="perk-sep">•</span>
                    <span>✓ AC Sedan / SUV</span>
                  </div>
                </>
              )}

              {/* Submit CTA Button */}
              <button
                type="submit"
                className="booking-submit-btn"
              >
                <span>CHECK FARE & AVAILABLE CABS</span>
                <ArrowRight size={17} />
              </button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
};

