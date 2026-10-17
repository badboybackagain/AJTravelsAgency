import React, { useState } from 'react';
import { Car, Clock, ArrowLeftRight, MapPin, Navigation, Search, MessageSquare, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { getWhatsAppLink } from '../utils/whatsapp';

export const BookingCard = ({ onOpenEnquiry }) => {
  const [activeTab, setActiveTab] = useState('OneWay');
  const [pickup, setPickup] = useState('Pune');
  const [drop, setDrop] = useState('Mumbai');

  const tabs = [
    { id: 'OneWay', name: 'One Way Taxi', icon: Car },
    { id: 'Local', name: 'Local / Airport', icon: Clock },
    { id: 'RoundTrip', name: 'Round Trip', icon: ArrowLeftRight }
  ];

  const handleCheckFare = () => {
    const waLink = getWhatsAppLink({
      from: pickup,
      to: drop,
      pickup,
      destination: drop,
      tripType: activeTab === 'OneWay' ? 'One Way Taxi' : activeTab === 'RoundTrip' ? 'Round Trip' : 'Airport / Local'
    });
    window.open(waLink, '_blank');
  };

  return (
    <section className="booking-box-section">
      <div className="container container-narrow">
        {/* Title above box */}
        <div className="booking-box-header">
          <h2 className="booking-box-title">Book Pune ↔ Mumbai Cab Online</h2>
          <p className="booking-box-subtitle">
            Premium Pune–Mumbai Private Travel With Fast Doorstep Pickup
          </p>
        </div>

        {/* Clean White Booking Card Box (Matching User Image 2) */}
        <div className="clean-booking-card">
          {/* Top Tabs inside card */}
          <div className="booking-tabs-row">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  className={`tab-card-btn ${isActive ? 'active' : ''}`}
                  onClick={() => setActiveTab(tab.id)}
                >
                  <Icon size={20} className="tab-btn-icon" />
                  <span>{tab.name}</span>
                </button>
              );
            })}
          </div>

          {/* Pickup & Drop Input Row */}
          <div className="inputs-row">
            {/* Pickup Field */}
            <div className="input-field-col">
              <label className="input-field-label">PICKUP</label>
              <div className="input-with-icon">
                <MapPin size={18} className="field-icon" color="#9CA3AF" />
                <select
                  value={pickup}
                  onChange={(e) => setPickup(e.target.value)}
                  className="clean-select"
                >
                  <option value="Pune">Pune (All Locations)</option>
                  <option value="Hinjawadi, Pune">Hinjawadi Phase 1-3</option>
                  <option value="Wakad, Pune">Wakad / Baner</option>
                  <option value="Viman Nagar, Pune">Viman Nagar / Kharadi</option>
                  <option value="Kothrud, Pune">Kothrud / Shivajinagar</option>
                  <option value="Pune Airport (PNQ)">Pune Airport (PNQ)</option>
                  <option value="Mumbai">Mumbai (All Locations)</option>
                  <option value="Mumbai Airport (BOM)">Mumbai Airport (BOM)</option>
                  <option value="BKC, Mumbai">BKC (Bandra Kurla Complex)</option>
                </select>
              </div>
            </div>

            {/* Drop Field */}
            <div className="input-field-col">
              <label className="input-field-label">DROP</label>
              <div className="input-with-icon">
                <Navigation size={18} className="field-icon" color="#9CA3AF" />
                <select
                  value={drop}
                  onChange={(e) => setDrop(e.target.value)}
                  className="clean-select"
                >
                  <option value="Mumbai">Mumbai (All Locations)</option>
                  <option value="BKC, Mumbai">BKC (Bandra Kurla Complex)</option>
                  <option value="Mumbai Airport (BOM)">Mumbai Airport (BOM)</option>
                  <option value="Andheri, Mumbai">Andheri / Bandra</option>
                  <option value="Thane / Navi Mumbai">Thane / Navi Mumbai</option>
                  <option value="Pune">Pune (All Locations)</option>
                  <option value="Hinjawadi, Pune">Hinjawadi Tech Park</option>
                  <option value="Pune Airport (PNQ)">Pune Airport (PNQ)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Full-width Big Action Button */}
          <button
            type="button"
            onClick={handleCheckFare}
            className="btn-check-fare"
          >
            <Search size={20} />
            <span>Check Fare & Book on WhatsApp</span>
          </button>

          {/* Verified Service Features */}
          <div className="card-trust-footer">
            <span className="trust-proof-item">
              <ShieldCheck size={14} color="#16A34A" /> <strong>Fixed Transparent Fares</strong>
            </span>
            <span className="trust-divider">|</span>
            <span className="trust-proof-item">
              <CheckCircle2 size={14} color="#0099FF" /> <strong>Verified Drivers & AC Fleet</strong>
            </span>
            <span className="trust-divider">|</span>
            <span className="trust-proof-item">
              🚗 <strong>30-Min Dispatch Target</strong>
            </span>
          </div>
        </div>
      </div>

      <style>{`
        .booking-box-section {
          padding: 3.5rem 0 4.5rem 0;
          background: linear-gradient(180deg, #FAF6F0 0%, #EBF4FF 50%, #FAF6F0 100%);
        }

        .booking-box-header {
          text-align: center;
          margin-bottom: 2rem;
        }

        .booking-box-title {
          font-size: 2.5rem;
          font-weight: 800;
          color: #07111F;
          letter-spacing: -0.02em;
          margin-bottom: 0.4rem;
        }

        .booking-box-subtitle {
          font-size: 1.1rem;
          color: #4B5563;
          font-weight: 500;
        }

        .clean-booking-card {
          background: #FFFFFF;
          border-radius: 24px;
          padding: 2.25rem;
          box-shadow: 0 20px 40px rgba(0, 102, 255, 0.08), 0 4px 12px rgba(0, 0, 0, 0.04);
          border: 1px solid rgba(0, 102, 255, 0.12);
        }

        .booking-tabs-row {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1rem;
          margin-bottom: 2rem;
        }

        .tab-card-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.6rem;
          padding: 1.1rem 1rem;
          border-radius: 16px;
          background: #FFFFFF;
          border: 1.5px solid #E5E7EB;
          font-family: var(--font-heading);
          font-size: 1rem;
          font-weight: 700;
          color: #374151;
          transition: all 0.25s ease;
        }

        .tab-card-btn.active {
          background: #0099FF;
          border-color: #0099FF;
          color: #FFFFFF;
          box-shadow: 0 8px 20px rgba(0, 153, 255, 0.35);
        }

        .tab-card-btn:hover:not(.active) {
          border-color: #0099FF;
          color: #0099FF;
        }

        .inputs-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1.25rem;
          margin-bottom: 1.75rem;
        }

        .input-field-col {
          display: flex;
          flex-direction: column;
          gap: 0.4rem;
        }

        .input-field-label {
          font-family: var(--font-heading);
          font-size: 0.75rem;
          font-weight: 800;
          letter-spacing: 0.08em;
          color: #6B7280;
        }

        .input-with-icon {
          position: relative;
          display: flex;
          align-items: center;
        }

        .field-icon {
          position: absolute;
          left: 1rem;
          pointer-events: none;
        }

        .clean-select {
          width: 100%;
          height: 54px;
          padding: 0 1rem 0 2.8rem;
          border-radius: 14px;
          border: 1.5px solid #E5E7EB;
          background-color: #F9FAFB;
          font-family: var(--font-body);
          font-size: 0.98rem;
          font-weight: 600;
          color: #111827;
          outline: none;
          transition: all 0.2s ease;
          appearance: none;
          cursor: pointer;
        }

        .clean-select:focus {
          border-color: #0099FF;
          background-color: #FFFFFF;
          box-shadow: 0 0 0 4px rgba(0, 153, 255, 0.15);
        }

        .btn-check-fare {
          width: 100%;
          height: 56px;
          border-radius: 14px;
          background: #0099FF;
          color: #FFFFFF;
          font-family: var(--font-heading);
          font-size: 1.1rem;
          font-weight: 800;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.6rem;
          border: none;
          transition: all 0.25s ease;
          box-shadow: 0 8px 24px rgba(0, 153, 255, 0.35);
          margin-bottom: 1.5rem;
        }

        .btn-check-fare:hover {
          background: #0088EE;
          transform: translateY(-2px);
          box-shadow: 0 12px 28px rgba(0, 153, 255, 0.45);
        }

        .card-trust-footer {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 1.25rem;
          font-size: 0.88rem;
          color: #4B5563;
          flex-wrap: wrap;
        }

        .trust-proof-item {
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
        }

        .trust-divider {
          color: #D1D5DB;
        }

        @media (max-width: 768px) {
          .booking-box-title {
            font-size: 1.5rem;
          }
          .clean-booking-card {
            padding: 0.85rem 1rem 1rem;
            border-radius: 16px;
          }
          .booking-tabs-row {
            grid-template-columns: repeat(3, 1fr);
            gap: 0.35rem;
          }
          .tab-card-btn {
            padding: 0.5rem 0.25rem;
            font-size: 0.75rem;
            border-radius: 8px;
          }
          .inputs-row {
            grid-template-columns: 1fr;
            gap: 0.65rem;
          }
          .input-field-control {
            height: 40px;
            font-size: 0.82rem;
          }
          .btn-check-fare {
            height: 44px;
            font-size: 0.85rem;
            margin-bottom: 0.85rem;
          }
        }
      `}</style>
    </section>
  );
};
