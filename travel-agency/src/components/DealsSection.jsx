import React, { useState, useEffect } from 'react';
import { Tag, Sparkles, ShieldCheck, ArrowRight, MessageSquare, Car, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { grandDealsApi, API_BASE_URL } from '../services/api';
import { getWhatsAppLink } from '../utils/whatsapp';

export const DealsSection = () => {
  const [activeTab, setActiveTab] = useState('LiveFares');
  const [liveDeals, setLiveDeals] = useState([]);
  const [loadingDeals, setLoadingDeals] = useState(false);

  useEffect(() => {
    setLoadingDeals(true);
    grandDealsApi
      .getDeals()
      .then((res) => {
        if (res.data?.data) {
          setLiveDeals(res.data.data);
        }
      })
      .catch((err) => console.log('Notice loading live deals:', err.message))
      .finally(() => setLoadingDeals(false));
  }, []);

  const tabs = [
    { name: 'LiveFares', label: '🔥 Verified Cab Deals' },
    { name: 'Cabs', label: 'Cabs & Taxis' },
    { name: 'OneWay', label: 'One-Way Deals' },
    { name: 'RoundTrip', label: 'Round-Trip Savings' },
    { name: 'Airport', label: 'Airport Express' },
    { name: 'Corporate', label: 'Corporate' },
  ];

  const couponDeals = {
    Cabs: [
      {
        label: 'FLAT 10% OFF*',
        sub: 'on Sedan & SUV Pickups to Pune / Mumbai',
        code: 'PUNEMUMBAI10',
        note: 'Valid on Online Booking',
      },
      {
        label: 'INSTANT FARE LOCK',
        sub: 'for Outstation SUV & Luxury Chauffeured Rides',
        code: 'EXPRESS500',
        note: 'No surge pricing guaranteed',
      },
      {
        label: 'FREE CANCELLATION',
        sub: 'at ₹0 up to 2 hours prior to scheduled departure',
        code: 'FREECANCEL',
        note: 'Flexible Trip Modification',
      },
    ],
    OneWay: [
      {
        label: 'ONE-WAY SPECIAL',
        sub: 'Pay only for single direction Pune ↔ Mumbai journey',
        code: 'ONEWAYDEAL',
        note: 'No Return Toll Charges',
      },
      {
        label: 'EARLY BIRD DISCOUNT',
        sub: 'Book morning 6 AM - 9 AM slots in advance',
        code: 'EARLYBIRD',
        note: 'Doorstep Pickup Included',
      },
      {
        label: 'AIRPORT CONNECT',
        sub: 'Pune Airport (PNQ) to Mumbai (BOM) One-Way',
        code: 'AIRPORTEXPRESS',
        note: 'Flight Tracked',
      },
    ],
    RoundTrip: [
      {
        label: 'ROUND-TRIP SAVINGS',
        sub: 'Special discount on same-day return Pune ↔ Mumbai trip',
        code: 'RETURNTRIP',
        note: 'Same Driver & Vehicle',
      },
      {
        label: 'WEEKEND SPECIAL',
        sub: 'Weekend intercity trips with extended waiting',
        code: 'WEEKENDPASS',
        note: '24-Hour Return Window',
      },
      {
        label: 'CORPORATE RETURN',
        sub: 'Same day BKC / Hinjawadi business meeting return',
        code: 'CORPRETURN',
        note: 'GST Invoice Included',
      },
    ],
    Airport: [
      {
        label: 'FLIGHT DELAY PROTECT',
        sub: 'Zero waiting fee for delayed flights at BOM / PNQ',
        code: 'FLIGHTSAFE',
        note: 'Driver Wait Included',
      },
      {
        label: 'AIRPORT DROP SPECIAL',
        sub: 'on International Terminal Mumbai T2 Drop-offs',
        code: 'BOMAIRPORT',
        note: 'Luggage Assist',
      },
      {
        label: 'MIDNIGHT TRANSFER',
        sub: 'Late night 11 PM - 4 AM airport pickups',
        code: 'NIGHTEXPRESS',
        note: 'Safe Night Drive',
      },
    ],
    Corporate: [
      {
        label: 'EXECUTIVE CLASS',
        sub: 'on Crysta & Executive sedan business hires',
        code: 'EXECUTIVE12',
        note: 'B2B Priority',
      },
      {
        label: 'GST BILL SAVINGS',
        sub: 'Full 5% GST tax invoice for corporate claiming',
        code: 'GSTINVOICE',
        note: 'Instant Email Receipt',
      },
      {
        label: 'BULK MEETING CAB',
        sub: 'Multiple meeting transfers across BKC & Hinjawadi',
        code: 'MULTISTOP',
        note: 'Chauffeur Standby',
      },
    ],
  };

  return (
    <section className="section-padding bg-cream">
      <div className="container">
        {/* Campaign Section Title */}
        <div className="campaign-title-block">
          <h2>Grand Deals for Your Journey</h2>
          <p className="text-xs text-slate-500 mt-1 max-w-lg mx-auto">
            Book live verified cabs with transparent rates or unlock exclusive trip promo codes.
          </p>
          <div className="title-divider">
            <div className="divider-line"></div>
            <div className="divider-diamond"></div>
            <div className="divider-line"></div>
          </div>
        </div>

        {/* Pill Navigation Tabs */}
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <div className="pill-tab-bar">
            {tabs.map((t) => (
              <button
                key={t.name}
                className={`pill-tab-item ${activeTab === t.name ? 'active' : ''}`}
                onClick={() => setActiveTab(t.name)}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* TAB 1: Real Live Database Fares */}
        {activeTab === 'LiveFares' && (
          <div>
            {loadingDeals ? (
              <div className="py-12 flex justify-center items-center gap-3 text-slate-400">
                <Loader2 className="w-6 h-6 animate-spin text-sky-500" />
                <span className="text-xs">Loading live fleet deals...</span>
              </div>
            ) : liveDeals.length === 0 ? (
              <div className="text-center py-10 bg-white rounded-2xl border border-slate-200/80 p-8 max-w-md mx-auto">
                <Car className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <h4 className="text-sm font-bold text-slate-700">Customized Quotes Available</h4>
                <p className="text-xs text-slate-400 mt-1 mb-4">
                  Check all live vehicle pricing directly through our fare calculator.
                </p>
                <Link to="/fare" className="btn-blue inline-flex items-center gap-2">
                  <span>Open Fare Calculator</span>
                  <ArrowRight size={16} />
                </Link>
              </div>
            ) : (
              <div className="deals-cards-grid">
                {liveDeals.map((deal) => {
                  const dealImg = deal.vehicle?.image?.startsWith('/uploads')
                    ? `${API_BASE_URL}${deal.vehicle.image}`
                    : (deal.vehicle?.image || '/assets/sedan.webp');

                  return (
                    <div key={deal.id} className="offer-card group hover:shadow-lg transition">
                      <span className="offer-label">VERIFIED FARE</span>
                      
                      <div className="h-28 my-2 rounded-xl bg-slate-50 flex items-center justify-center p-2 overflow-hidden">
                        <img
                          src={dealImg}
                          alt={deal.vehicle?.name}
                          className="h-full object-contain mix-blend-multiply group-hover:scale-105 transition duration-300"
                          onError={(e) => { e.target.src = '/assets/sedan.webp'; }}
                        />
                      </div>

                      <h3 className="offer-title">{deal.vehicle?.name}</h3>
                      <p className="offer-subtitle font-semibold text-slate-700">
                        {deal.routeName || `${deal.pickup?.name} ➔ ${deal.drop?.name}`}
                      </p>

                      <div className="my-3 py-2 px-3 rounded-xl bg-sky-50 border border-sky-100 flex items-center justify-between">
                        <span className="text-[11px] font-bold text-slate-500">Starting at</span>
                        <span className="text-lg font-black text-sky-800">₹{deal.baseFare?.toLocaleString()}</span>
                      </div>

                      <Link
                        to={`/fare?pickupId=${deal.pickup?.id || ''}&dropId=${deal.drop?.id || ''}`}
                        className="btn-blue flex items-center justify-center gap-2"
                      >
                        <span>BOOK THIS CAB</span>
                        <ArrowRight size={16} />
                      </Link>

                      <span style={{ fontSize: '0.68rem', color: '#9CA3AF', marginTop: '0.4rem', display: 'block' }}>
                        *Includes doorstep pickup • {deal.vehicle?.seatingCapacity || 4} Passengers
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 2+: Coupon Promos */}
        {activeTab !== 'LiveFares' && (
          <div className="deals-cards-grid">
            {(couponDeals[activeTab] || couponDeals.Cabs).map((deal, idx) => (
              <div key={idx} className="offer-card">
                <span className="offer-label">SPECIAL OFFER</span>
                <h3 className="offer-title">{deal.label}</h3>
                <p className="offer-subtitle">{deal.sub}</p>

                <div className="coupon-code-box">
                  <span className="code-prefix">Code:</span>
                  <span className="code-value">{deal.code}</span>
                </div>

                <Link
                  to="/fare"
                  className="btn-blue flex items-center justify-center gap-2"
                >
                  <MessageSquare size={16} />
                  <span>CHECK FARE & APPLY</span>
                </Link>

                <span style={{ fontSize: '0.68rem', color: '#9CA3AF', marginTop: '0.4rem', display: 'block' }}>
                  *{deal.note}
                </span>
              </div>
            ))}
          </div>
        )}

      </div>

      <style>{`
        .deals-cards-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1.5rem;
        }

        @media (max-width: 992px) {
          .deals-cards-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (max-width: 768px) {
          .deals-cards-grid {
            display: flex;
            overflow-x: auto;
            scroll-snap-type: x mandatory;
            gap: 1rem;
            padding: 0.5rem 0.25rem 1rem;
            -webkit-overflow-scrolling: touch;
            scrollbar-width: none;
          }
          .deals-cards-grid::-webkit-scrollbar {
            display: none;
          }
          .offer-card {
            flex: 0 0 82%;
            max-width: 290px;
            scroll-snap-align: start;
            padding: 1.1rem;
            border-radius: 16px;
          }
        }
      `}</style>
    </section>
  );
};
