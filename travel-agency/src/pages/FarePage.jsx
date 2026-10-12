import React, { useState, useEffect } from 'react';
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
  MapPin,
  Sparkles,
  IndianRupee,
  RotateCcw,
} from 'lucide-react';
import { fareApi, locationApi, routeApi, API_BASE_URL } from '../services/api';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import './fare.css';

export const FarePage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const tripType = searchParams.get('tripType') || 'ONE_WAY';
  const pickupId = searchParams.get('pickupId') || '';
  const dropId = searchParams.get('dropId') || '';
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

  const [activeCategory, setActiveCategory] = useState(categoryParam || 'ALL');
  const [quoteData, setQuoteData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedBreakdownId, setExpandedBreakdownId] = useState(null);

  const fetchQuote = async () => {
    setLoading(true);
    setError('');
    try {
      let activePickupId = pickupId;
      let activeDropId = dropId;

      // Smart location resolver: match UUIDs or text search keys (e.g. 'hinjawadi', 'bkc', 'airport')
      if (tripType !== 'LOCAL') {
        const locRes = await locationApi.getLocations();
        const allLocs = locRes.data?.data || [];

        let matchedPickup = allLocs.find((l) => l.id === activePickupId);
        if (!matchedPickup && activePickupId) {
          matchedPickup = allLocs.find(
            (l) =>
              l.name.toLowerCase().includes(activePickupId.toLowerCase()) ||
              l.city?.toLowerCase().includes(activePickupId.toLowerCase())
          );
        }
        if (!matchedPickup) {
          matchedPickup = allLocs.find(
            (l) => l.side === 'PUNE_SIDE' || l.city?.toLowerCase() === 'pune'
          );
        }

        let matchedDrop = allLocs.find((l) => l.id === activeDropId);
        if (!matchedDrop && activeDropId) {
          matchedDrop = allLocs.find(
            (l) =>
              l.name.toLowerCase().includes(activeDropId.toLowerCase()) ||
              l.city?.toLowerCase().includes(activeDropId.toLowerCase())
          );
        }
        if (!matchedDrop) {
          matchedDrop = allLocs.find(
            (l) =>
              l.side === 'MUMBAI_SIDE' ||
              ['mumbai', 'thane', 'navi mumbai'].includes(l.city?.toLowerCase())
          );
        }

        if (matchedPickup) activePickupId = matchedPickup.id;
        if (matchedDrop) activeDropId = matchedDrop.id;
      }

      const payload = {
        tripType,
        pickupLocationId: activePickupId || undefined,
        dropLocationId: activeDropId || undefined,
        city: tripType === 'LOCAL' ? city : undefined,
        duration: tripType === 'LOCAL' ? parseInt(duration, 10) : undefined,
        date,
        time,
        departureDate,
        departureTime,
        returnDate,
        returnTime,
        passengers: parseInt(passengers, 10) || 1,
      };

      const res = await fareApi.getQuote(payload);
      if (res.data?.success) {
        setQuoteData(res.data);
      } else {
        setError('No cabs found for the selected route. Please try another selection.');
      }
    } catch (err) {
      console.error('Fare quote error:', err);
      setError(
        err.response?.data?.message ||
          'Failed to calculate fare. Please check your route or contact our 24x7 desk.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuote();
  }, [tripType, pickupId, dropId, city, duration, date, time, returnDate, returnTime, passengers]);

  // Sync category state when URL changes
  useEffect(() => {
    if (categoryParam) {
      setActiveCategory(categoryParam);
    }
  }, [categoryParam]);

  const handleSelectCab = (vehicle) => {
    const bookingParams = new URLSearchParams({
      tripType,
      vehicleId: vehicle.vehicleId,
      ...(pickupId && { pickupId }),
      ...(dropId && { dropId }),
      ...(tripType === 'LOCAL' && { city, duration }),
      date,
      time,
      departureDate,
      departureTime,
      ...(returnDate && { returnDate }),
      ...(returnTime && { returnTime }),
      passengers,
    });

    navigate(`/book?${bookingParams.toString()}`, {
      state: {
        vehicle,
        quoteData,
        tripType,
        searchParams: {
          tripType,
          pickupLocationId: pickupId,
          dropLocationId: dropId,
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

  // Filter vehicles by selected category tab
  const allVehicles = quoteData?.vehicles || [];
  const filteredVehicles = allVehicles.filter((v) => {
    if (!activeCategory || activeCategory === 'ALL') return true;
    const catUpper = v.category?.toUpperCase() || '';
    const nameLower = v.name?.toLowerCase() || '';

    if (activeCategory === 'SEDAN') {
      return catUpper === 'SEDAN' || catUpper === 'HATCHBACK' || nameLower.includes('sedan') || nameLower.includes('dzire') || nameLower.includes('etios');
    }
    if (activeCategory === 'SUV') {
      return catUpper === 'SUV' || nameLower.includes('suv') || nameLower.includes('ertiga') || nameLower.includes('carens');
    }
    if (activeCategory === 'INNOVA_CRYSTA') {
      return catUpper === 'INNOVA_CRYSTA' || catUpper === 'LUXURY' || nameLower.includes('innova') || nameLower.includes('crysta') || nameLower.includes('luxury');
    }
    if (activeCategory === 'TEMPO_TRAVELLER') {
      return catUpper === 'TEMPO_TRAVELLER' || catUpper === 'TWENTY_SEATER' || nameLower.includes('tempo') || nameLower.includes('mini bus');
    }
    return catUpper === activeCategory;
  });

  // Dynamic Page Title
  let pageTitle = 'One Way Cab From Pune to Mumbai';
  if (tripType === 'ROUND_TRIP') {
    const pickupName = quoteData?.route?.pickup?.name || 'Pune';
    const dropName = quoteData?.route?.drop?.name || 'Mumbai';
    pageTitle = `Round Trip Cab From ${pickupName} to ${dropName} (Return Included)`;
  } else if (tripType === 'LOCAL') {
    pageTitle = `${city} Local Cab Rentals (${duration} Hours Package)`;
  } else if (quoteData?.route?.pickup?.name && quoteData?.route?.drop?.name) {
    pageTitle = `One Way Cab From ${quoteData.route.pickup.name} to ${quoteData.route.drop.name}`;
  }

  return (
    <div className="fare-page-wrapper">
      <Header isDark={false} />

      {/* Main Content Area */}
      <main className="fare-content-section container">
        {loading ? (
          <div className="fare-loading-box">
            <Loader2 size={36} className="animate-spin" color="#0099FF" />
            <h3>Checking vehicle availability & toll rates...</h3>
            <p>Fetching real-time server verified pricing for your trip</p>
          </div>
        ) : error ? (
          <div className="fare-error-box">
            <AlertCircle size={36} color="#EF4444" style={{ margin: '0 auto 1rem' }} />
            <h3>Route or Vehicle Unavailable</h3>
            <p>{error}</p>
            <div style={{ marginTop: '1.25rem', display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
              <Link to="/" className="admin-btn-primary" style={{ textDecoration: 'none' }}>
                Change Search
              </Link>
              <a href="tel:+919876543210" className="admin-btn-secondary" style={{ textDecoration: 'none' }}>
                Call 24x7 Help Desk
              </a>
            </div>
          </div>
        ) : quoteData?.vehicles?.length === 0 ? (
          <div className="fare-error-box">
            <Car size={36} color="#CBD5E1" style={{ margin: '0 auto 1rem' }} />
            <h3>No Vehicles Available</h3>
            <p>No vehicles match the selected passenger count or trip criteria.</p>
            <Link to="/" className="admin-btn-primary" style={{ marginTop: '1rem', display: 'inline-block', textDecoration: 'none' }}>
              Modify Search
            </Link>
          </div>
        ) : (
          <div>
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
                {filteredVehicles.map((v) => {
                  const isExpanded = expandedBreakdownId === v.vehicleId;
                  const hasFare = v.fare?.configured && v.fare?.total > 0;
                  const isUnavailable = v.availability === 'UNAVAILABLE';
                  const isSelectedMatch =
                    (vehicleNameParam && v.name?.toLowerCase().includes(vehicleNameParam.toLowerCase())) ||
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
                      className={`fare-cab-card ${isSelectedMatch ? 'selected-model-card' : ''}`}
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
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
                          <h2 className="cab-title">{v.name}</h2>
                          {isSelectedMatch && (
                            <span className="cab-recommended-chip">
                              ⭐ Recommended from Fleet
                            </span>
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
                        <span>Expressway Tolls Included</span>
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
                          onClick={() => setExpandedBreakdownId(isExpanded ? null : v.vehicleId)}
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
    )}
  </main>

      <Footer />
    </div>
  );
};
