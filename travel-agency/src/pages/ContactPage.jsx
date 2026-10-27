import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { EnquiryModal } from '../components/EnquiryModal';
import { MobileStickyBar } from '../components/MobileStickyBar';
import { usePageSeo } from '../hooks/usePageSeo';
import { businessConfig } from '../config/business.config';
import { 
  Phone, 
  Mail, 
  MapPin, 
  Clock, 
  MessageSquare, 
  CheckCircle2, 
  Send, 
  Sparkles,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import { enquiryApi } from '../services/api';

export function ContactPage() {
  usePageSeo(
    'contact',
    'Contact AJ Travels Pune | 24/7 Car Rental & Cab Booking Desk',
    'Contact AJ Travels Pune. Call +91 7447443536 / +91 8421051299 or WhatsApp for instant car rental with driver, outstation cabs, and airport transfer bookings.',
    'https://ajtravelspune.com/contact-us/'
  );

  const [isEnquiryOpen, setIsEnquiryOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    tripType: 'ONE_WAY',
    pickupLocation: '',
    dropLocation: '',
    travelDate: '',
    notes: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedSuccess, setSubmittedSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    if (errorMsg) setErrorMsg('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    if (!formData.name.trim() || !formData.phone.trim()) {
      setErrorMsg('Please enter your full name and contact phone number.');
      return;
    }
    setIsSubmitting(true);
    setErrorMsg('');
    try {
      await enquiryApi.createEnquiry({
        name: formData.name,
        phone: formData.phone,
        pickup: formData.pickupLocation || 'Pune',
        drop: formData.dropLocation || 'Mumbai',
        date: formData.travelDate,
        message: `Contact Page Inquiry: ${formData.tripType} | Notes: ${formData.notes || 'N/A'}`
      });
      setSubmittedSuccess(true);
      setFormData({
        name: '',
        phone: '',
        tripType: 'ONE_WAY',
        pickupLocation: '',
        dropLocation: '',
        travelDate: '',
        notes: ''
      });
    } catch (err) {
      setErrorMsg(
        err.response?.data?.message ||
        'Unable to submit your enquiry right now. Please call our 24/7 travel desk or connect with us directly on WhatsApp.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="contact-page-wrapper">
      <Header onOpenEnquiry={() => setIsEnquiryOpen(true)} isDark={false} />

      {/* Internal Hero Banner */}
      <section className="internal-hero-section">
        <div className="container">
          <div className="breadcrumbs-nav">
            <Link to="/">Home</Link>
            <span className="bc-sep">/</span>
            <span className="bc-current">Contact Us</span>
          </div>

          <div className="internal-hero-content">
            <div className="hero-badge-pill">
              <Sparkles size={14} />
              <span>24/7 OPERATIONS HELPDESK</span>
            </div>
            <h1 className="internal-hero-title">
              We're Here to Help <span className="text-gradient">Day & Night</span>
            </h1>
            <p className="internal-hero-subtitle">
              Have an urgent airport transfer, early morning flight pickup, or group travel requirement? Connect directly with our dispatch supervisors via phone, WhatsApp, or the inquiry form below.
            </p>
          </div>
        </div>
      </section>

      {/* Contact Cards Grid & Form Container */}
      <section className="contact-main-section">
        <div className="container">
          <div className="contact-2col-layout">
            {/* Left Column: Direct Contact Details */}
            <div className="contact-info-col">
              <span className="section-eyebrow">DIRECT COMMUNICATION CHANNELS</span>
              <h2 className="contact-subheading">Get in Touch Directly</h2>
              <p className="contact-desc-text">
                Our support team is on standby 24 hours a day, 365 days a year to assist with booking confirmations, driver coordination, and custom quotes.
              </p>

              <div className="contact-cards-stack">
                {/* Phone Card */}
                <div className="contact-channel-card">
                  <div className="channel-icon-box phone-box">
                    <Phone size={22} color="#1D4ED8" />
                  </div>
                  <div className="channel-text">
                    <span className="channel-lbl">Direct 24/7 Phone Desk</span>
                    <a href={`tel:${businessConfig.phone}`} className="channel-main-link">
                      {businessConfig.phoneDisplay}
                    </a>
                    {businessConfig.phoneSecondary && (
                      <a href={`tel:${businessConfig.phoneSecondary}`} className="channel-main-link" style={{ fontSize: '1rem', marginTop: '0.25rem', color: '#4B5563' }}>
                        {businessConfig.phoneSecondaryDisplay}
                      </a>
                    )}
                    <span className="channel-sub">Instant answers & emergency cab dispatch</span>
                  </div>
                </div>

                {/* WhatsApp Card */}
                <div className="contact-channel-card">
                  <div className="channel-icon-box wa-box">
                    <MessageSquare size={22} color="#10B981" />
                  </div>
                  <div className="channel-text">
                    <span className="channel-lbl">Instant WhatsApp Support</span>
                    <a 
                      href={`https://wa.me/${businessConfig.whatsapp}?text=Hello%20AJ%20Travels,%20I%20would%20like%20to%20inquire%20about%20cab%20booking.`}
                      target="_blank" 
                      rel="noreferrer" 
                      className="channel-main-link wa-text"
                    >
                      Chat on WhatsApp (+{businessConfig.whatsapp})
                    </a>
                    <span className="channel-sub">Share flight tickets & receive instant live quotes</span>
                  </div>
                </div>

                {/* Email Card */}
                <div className="contact-channel-card">
                  <div className="channel-icon-box email-box">
                    <Mail size={22} color="#0284C7" />
                  </div>
                  <div className="channel-text">
                    <span className="channel-lbl">Email Inquiries & Corporate Invoices</span>
                    <a href={`mailto:${businessConfig.email}`} className="channel-main-link">
                      {businessConfig.email}
                    </a>
                    <span className="channel-sub">Corporate vendor queries & itemized GST bills</span>
                  </div>
                </div>

                {/* Office Hub Address */}
                <div className="contact-channel-card">
                  <div className="channel-icon-box pin-box">
                    <MapPin size={22} color="#D97706" />
                  </div>
                  <div className="channel-text">
                    <span className="channel-lbl">Primary Operating Base</span>
                    <p className="channel-address-txt">{businessConfig.address}</p>
                    <span className="channel-sub">Fleet dispatch hubs across Pune, PCMC & Mumbai</span>
                  </div>
                </div>
              </div>

              {/* Operating Hours Box */}
              <div className="hours-banner">
                <Clock size={18} color="#2563EB" />
                <div>
                  <strong>Operating Schedule:</strong> 24 Hours / 7 Days a Week (Always Open)
                </div>
              </div>
            </div>

            {/* Right Column: Inquiry Submission Form */}
            <div className="contact-form-col">
              <div className="form-card-container">
                <div className="form-header">
                  <span className="form-eyebrow">ONLINE ENQUIRY FORM</span>
                  <h3 className="form-title">Send Us a Quick Booking Request</h3>
                  <p className="form-subtitle">Fill in your travel plan and our travel supervisor will reply within 15 minutes.</p>
                </div>

                {submittedSuccess ? (
                  <div className="form-success-alert">
                    <CheckCircle2 size={32} color="#10B981" />
                    <h4>Thank You! Your Request Has Been Sent.</h4>
                    <p>Our operations desk will contact you shortly with vehicle availability and final all-inclusive fare.</p>
                    <button 
                      type="button" 
                      className="btn-send-another" 
                      onClick={() => setSubmittedSuccess(false)}
                    >
                      Send Another Request
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="actual-contact-form">
                    {errorMsg && (
                      <div className="form-error-alert">
                        <AlertCircle size={16} />
                        <span>{errorMsg}</span>
                      </div>
                    )}

                    <div className="form-row-2col">
                      <div className="input-group">
                        <label htmlFor="name">Full Name *</label>
                        <input
                          id="name"
                          type="text"
                          name="name"
                          required
                          value={formData.name}
                          onChange={handleChange}
                          placeholder="e.g. Rahul Sharma"
                        />
                      </div>
                      <div className="input-group">
                        <label htmlFor="phone">Phone / WhatsApp Number *</label>
                        <input
                          id="phone"
                          type="tel"
                          name="phone"
                          required
                          value={formData.phone}
                          onChange={handleChange}
                          placeholder="e.g. 7447443536"
                        />
                      </div>
                    </div>

                    <div className="input-group">
                      <label htmlFor="tripType">Trip Type</label>
                      <select
                        id="tripType"
                        name="tripType"
                        value={formData.tripType}
                        onChange={handleChange}
                      >
                        <option value="ONE_WAY">One-Way Drop (Pune ↔ Mumbai)</option>
                        <option value="ROUND_TRIP">Round-Trip Cab</option>
                        <option value="AIRPORT">Airport Transfer (BOM / PNQ)</option>
                        <option value="OUTSTATION">Outstation Holiday Tour</option>
                        <option value="LOCAL_HOURLY">Local Hourly Car Rental</option>
                      </select>
                    </div>

                    <div className="form-row-2col">
                      <div className="input-group">
                        <label htmlFor="pickupLocation">Pickup Location</label>
                        <input
                          id="pickupLocation"
                          type="text"
                          name="pickupLocation"
                          value={formData.pickupLocation}
                          onChange={handleChange}
                          placeholder="e.g. Hinjawadi, Pune"
                        />
                      </div>
                      <div className="input-group">
                        <label htmlFor="dropLocation">Drop Location</label>
                        <input
                          id="dropLocation"
                          type="text"
                          name="dropLocation"
                          value={formData.dropLocation}
                          onChange={handleChange}
                          placeholder="e.g. Mumbai Airport (BOM)"
                        />
                      </div>
                    </div>

                    <div className="input-group">
                      <label htmlFor="travelDate">Travel Date & Approximate Time</label>
                      <input
                        id="travelDate"
                        type="text"
                        name="travelDate"
                        value={formData.travelDate}
                        onChange={handleChange}
                        placeholder="e.g. Tomorrow at 6:30 AM"
                      />
                    </div>

                    <div className="input-group">
                      <label htmlFor="notes">Special Requirements / Flight Details (Optional)</label>
                      <textarea
                        id="notes"
                        name="notes"
                        rows="3"
                        value={formData.notes}
                        onChange={handleChange}
                        placeholder="Mention extra luggage, preferred car model, flight number, or multi-point pickups..."
                      ></textarea>
                    </div>

                    <button 
                      type="submit" 
                      disabled={isSubmitting} 
                      className="btn-submit-inquiry"
                    >
                      {isSubmitting ? (
                        <span>Sending Request...</span>
                      ) : (
                        <>
                          <Send size={16} />
                          <span>Submit Travel Enquiry</span>
                        </>
                      )}
                    </button>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
      <MobileStickyBar onOpenEnquiry={() => setIsEnquiryOpen(true)} />
      <EnquiryModal isOpen={isEnquiryOpen} onClose={() => setIsEnquiryOpen(false)} />

      <style>{`
        .contact-page-wrapper {
          min-height: 100vh;
          background: #FFFFFF;
          color: #0F172A;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }

        .internal-hero-section {
          background: linear-gradient(180deg, #F8FAFC 0%, #EFF6FF 100%);
          padding: 2.25rem 0 1.5rem;
          border-bottom: 1px solid #E2E8F0;
        }

        .breadcrumbs-nav {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.85rem;
          color: #64748B;
          margin-bottom: 0.85rem;
        }

        .breadcrumbs-nav a {
          color: #2563EB;
          text-decoration: none;
          font-weight: 500;
        }

        .bc-sep { color: #94A3B8; }
        .bc-current { color: #0F172A; font-weight: 600; }

        .hero-badge-pill {
          display: inline-flex;
          align-items: center;
          gap: 0.45rem;
          background: rgba(37, 99, 235, 0.1);
          color: #2563EB;
          padding: 0.35rem 0.85rem;
          border-radius: 9999px;
          font-size: 0.75rem;
          font-weight: 700;
          letter-spacing: 0.05em;
          margin-bottom: 0.75rem;
        }

        .internal-hero-title {
          font-size: 2.2rem;
          font-weight: 800;
          line-height: 1.2;
          color: #0F172A;
          max-width: 820px;
          margin-bottom: 0.75rem;
        }

        .text-gradient {
          background: linear-gradient(135deg, #1D4ED8 0%, #0284C7 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .internal-hero-subtitle {
          font-size: 1rem;
          line-height: 1.6;
          color: #475569;
          max-width: 760px;
        }

        .contact-main-section {
          padding: 2rem 0 4rem;
          background: #F8FAFC;
        }

        .contact-2col-layout {
          display: grid;
          grid-template-columns: 1fr 1.1fr;
          gap: 2.5rem;
          align-items: flex-start;
        }

        .section-eyebrow {
          display: block;
          font-size: 0.75rem;
          font-weight: 800;
          letter-spacing: 0.08em;
          color: #2563EB;
          margin-bottom: 0.5rem;
        }

        .contact-subheading {
          font-size: 1.85rem;
          font-weight: 800;
          color: #0F172A;
          margin-bottom: 0.75rem;
        }

        .contact-desc-text {
          font-size: 0.95rem;
          line-height: 1.6;
          color: #64748B;
          margin-bottom: 1.5rem;
        }

        .contact-cards-stack {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
          margin-bottom: 2rem;
        }

        .contact-channel-card {
          background: #FFFFFF;
          border-radius: 16px;
          padding: 1.25rem;
          border: 1px solid #E2E8F0;
          display: flex;
          align-items: flex-start;
          gap: 1.1rem;
          transition: all 0.25s ease;
        }

        .contact-channel-card:hover {
          border-color: #BFDBFE;
          box-shadow: 0 6px 20px rgba(37, 99, 235, 0.06);
          transform: translateY(-2px);
        }

        .channel-icon-box {
          width: 48px;
          height: 48px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .phone-box { background: #EFF6FF; }
        .wa-box { background: #ECFDF5; }
        .email-box { background: #F0F9FF; }
        .pin-box { background: #FEF3C7; }

        .channel-text {
          display: flex;
          flex-direction: column;
        }

        .channel-lbl {
          font-size: 0.72rem;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: #64748B;
          margin-bottom: 0.2rem;
        }

        .channel-main-link {
          font-size: 1.1rem;
          font-weight: 700;
          color: #0F172A;
          text-decoration: none;
          margin-bottom: 0.2rem;
        }

        .channel-main-link:hover {
          color: #2563EB;
        }

        .wa-text {
          color: #059669;
        }

        .wa-text:hover {
          color: #047857;
        }

        .channel-sub {
          font-size: 0.8rem;
          color: #94A3B8;
        }

        .channel-address-txt {
          font-size: 0.92rem;
          font-weight: 600;
          color: #334155;
          margin: 0.2rem 0;
          line-height: 1.5;
        }

        .hours-banner {
          background: #EFF6FF;
          border: 1px solid #BFDBFE;
          border-radius: 12px;
          padding: 1rem 1.25rem;
          display: flex;
          align-items: center;
          gap: 0.75rem;
          font-size: 0.88rem;
          color: #1E3A8A;
        }

        /* Form Container */
        .form-card-container {
          background: #FFFFFF;
          border-radius: 24px;
          border: 1px solid #CBD5E1;
          padding: 2.5rem;
          box-shadow: 0 12px 32px rgba(15, 23, 42, 0.06);
        }

        .form-header {
          margin-bottom: 1.75rem;
        }

        .form-eyebrow {
          display: block;
          font-size: 0.72rem;
          font-weight: 800;
          letter-spacing: 0.08em;
          color: #2563EB;
          margin-bottom: 0.4rem;
        }

        .form-title {
          font-size: 1.5rem;
          font-weight: 800;
          color: #0F172A;
          margin-bottom: 0.4rem;
        }

        .form-subtitle {
          font-size: 0.88rem;
          color: #64748B;
        }

        .actual-contact-form {
          display: flex;
          flex-direction: column;
          gap: 1.1rem;
        }

        .form-row-2col {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1.1rem;
        }

        .input-group {
          display: flex;
          flex-direction: column;
          gap: 0.4rem;
        }

        .input-group label {
          font-size: 0.82rem;
          font-weight: 600;
          color: #334155;
        }

        .input-group input,
        .input-group select,
        .input-group textarea {
          width: 100%;
          padding: 0.75rem 0.95rem;
          font-size: 0.92rem;
          font-family: inherit;
          border-radius: 10px;
          border: 1.5px solid #CBD5E1;
          background: #F8FAFC;
          color: #0F172A;
          transition: all 0.2s ease;
        }

        .input-group input:focus,
        .input-group select:focus,
        .input-group textarea:focus {
          outline: none;
          border-color: #2563EB;
          background: #FFFFFF;
          box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.12);
        }

        .btn-submit-inquiry {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          background: linear-gradient(135deg, #1D4ED8 0%, #1E40AF 100%);
          color: #FFFFFF;
          font-size: 0.95rem;
          font-weight: 700;
          padding: 0.95rem 1.5rem;
          border-radius: 12px;
          border: none;
          cursor: pointer;
          box-shadow: 0 4px 14px rgba(29, 78, 216, 0.3);
          transition: all 0.2s ease;
          margin-top: 0.5rem;
        }

        .btn-submit-inquiry:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(29, 78, 216, 0.4);
        }

        .btn-submit-inquiry:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .form-success-alert {
          text-align: center;
          padding: 2.5rem 1rem;
        }

        .form-success-alert h4 {
          font-size: 1.25rem;
          font-weight: 800;
          color: #0F172A;
          margin: 1rem 0 0.5rem;
        }

        .form-success-alert p {
          font-size: 0.9rem;
          color: #64748B;
          margin-bottom: 1.5rem;
        }

        .btn-send-another {
          background: #EFF6FF;
          color: #1D4ED8;
          border: 1px solid #BFDBFE;
          font-weight: 600;
          padding: 0.65rem 1.25rem;
          border-radius: 8px;
          cursor: pointer;
        }

        .form-error-alert {
          background: #FEF2F2;
          border: 1px solid #FECACA;
          color: #DC2626;
          border-radius: 8px;
          padding: 0.75rem;
          font-size: 0.85rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        @media (max-width: 991px) {
          .contact-2col-layout {
            grid-template-columns: 1fr;
            gap: 2.5rem;
          }
        }

        @media (max-width: 640px) {
          .internal-hero-title {
            font-size: 1.85rem;
          }
          .form-row-2col {
            grid-template-columns: 1fr;
          }
          .form-card-container {
            padding: 1.5rem;
          }
        }
      `}</style>
    </div>
  );
}
