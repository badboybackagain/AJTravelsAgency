import React, { useState, useEffect } from 'react';
import { useLocation, useSearchParams, useNavigate, Link } from 'react-router-dom';
import {
  Car,
  MapPin,
  Calendar,
  Clock,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  PhoneCall,
  User,
  Navigation,
  Loader2,
  AlertCircle,
  Users,
  Fuel,
  Luggage,
  Sparkles,
  Check,
  RotateCcw,
  Headphones,
  Lock,
  Unlock,
  CreditCard,
  QrCode,
  Building,
  CheckCircle,
  X,
  Phone,
  ShieldAlert,
} from 'lucide-react';
import { bookingApi, fareApi, locationApi, otpApi, API_BASE_URL } from '../services/api';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { usePageSeo } from '../hooks/usePageSeo';
import './fare.css';

export const BookingPage = () => {
  usePageSeo('booking', 'Book Pune to Mumbai Cab Online | AJ Tours & Travels');
  const [searchParams] = useSearchParams();
  const locationState = useLocation();
  const navigate = useNavigate();

  // URL & Navigation State Parameters
  const tripType = searchParams.get('tripType') || locationState.state?.tripType || 'ONE_WAY';
  const vehicleId = searchParams.get('vehicleId') || locationState.state?.vehicle?.vehicleId || '';
  const pickupId = searchParams.get('pickupId') || locationState.state?.searchParams?.pickupLocationId || '';
  const dropId = searchParams.get('dropId') || locationState.state?.searchParams?.dropLocationId || '';
  const city = searchParams.get('city') || locationState.state?.searchParams?.city || 'Pune';
  const duration = searchParams.get('duration') || locationState.state?.searchParams?.duration || '8';
  const date = searchParams.get('date') || searchParams.get('departureDate') || new Date().toISOString().split('T')[0];
  const time = searchParams.get('time') || searchParams.get('departureTime') || '08:00 AM';
  const departureDate = searchParams.get('departureDate') || date;
  const departureTime = searchParams.get('departureTime') || time;
  const returnDate = searchParams.get('returnDate') || '';
  const returnTime = searchParams.get('returnTime') || '';
  const passengers = searchParams.get('passengers') || '1';

  // State
  const [quoteData, setQuoteData] = useState(locationState.state?.quoteData || null);
  const [selectedVehicle, setSelectedVehicle] = useState(locationState.state?.vehicle || null);
  const [recalculatingQuote, setRecalculatingQuote] = useState(!locationState.state?.quoteData);
  const [quoteError, setQuoteError] = useState('');

  // Form Fields
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [pickupAddress, setPickupAddress] = useState('');
  const [dropAddress, setDropAddress] = useState('');
  const [notes, setNotes] = useState('');

  // WhatsApp OTP Verification Inline States
  const [isPhoneVerified, setIsPhoneVerified] = useState(false);
  const [verificationToken, setVerificationToken] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [inputOtp, setInputOtp] = useState('');
  const [otpNotice, setOtpNotice] = useState('');
  const [otpError, setOtpError] = useState('');
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  // Submission State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [bookingConfirmed, setBookingConfirmed] = useState(null);

  // Server-side quote verification on mount
  useEffect(() => {
    const revalidateQuote = async () => {
      setRecalculatingQuote(true);
      setQuoteError('');
      try {
        const payload = {
          tripType,
          pickupLocationId: pickupId || undefined,
          dropLocationId: dropId || undefined,
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
          const matched = res.data.vehicles?.find((v) => v.vehicleId === vehicleId);
          if (matched) {
            setSelectedVehicle(matched);
          } else if (res.data.vehicles?.length > 0) {
            setSelectedVehicle(res.data.vehicles[0]);
          }
        }
      } catch (err) {
        console.error('Revalidation error:', err);
        setQuoteError('Unable to verify fare with server.');
      } finally {
        setRecalculatingQuote(false);
      }
    };

    revalidateQuote();
  }, [tripType, pickupId, dropId, city, duration, date, time, vehicleId]);

  // Resend cooldown timer
  useEffect(() => {
    let timer;
    if (cooldown > 0) {
      timer = setInterval(() => {
        setCooldown((prev) => (prev > 1 ? prev - 1 : 0));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [cooldown]);

  // Handle Send WhatsApp OTP inline
  const handleSendOtp = async () => {
    setOtpError('');
    setOtpNotice('');
    setSubmitError('');
    setInputOtp('');
    const cleanPhone = customerPhone.replace(/\D/g, '');
    if (cleanPhone.length !== 10) {
      setOtpError('Please enter a valid 10-digit mobile number first.');
      return;
    }

    setIsSendingOtp(true);
    try {
      const res = await otpApi.send(cleanPhone);
      if (res.data?.success) {
        setCooldown(res.data.cooldownSeconds || 60);
        setOtpSent(true);
        setOtpNotice(res.data.message || 'OTP sent to your WhatsApp number. Please enter it below.');
      }
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Failed to dispatch WhatsApp OTP. Please ensure WhatsApp gateway is active.';
      setOtpError(errMsg);
    } finally {
      setIsSendingOtp(false);
    }
  };

  // Handle Verify WhatsApp OTP Code inline
  const handleVerifyOtp = async () => {
    setOtpError('');
    if (!inputOtp.trim()) {
      setOtpError('Please enter the OTP code received on WhatsApp.');
      return;
    }

    const cleanPhone = customerPhone.replace(/\D/g, '');
    setIsVerifyingOtp(true);

    try {
      const res = await otpApi.verify(cleanPhone, inputOtp.trim());
      if (res.data?.success) {
        setVerificationToken(res.data.verificationToken);
        setIsPhoneVerified(true);
        setOtpSent(false);
        setOtpError('');
        setSubmitError('');
        setOtpNotice(`✓ Mobile number +91 ${cleanPhone} verified via WhatsApp! Address fields unlocked.`);
      }
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Invalid or expired OTP code. Please check your WhatsApp and try again.';
      setOtpError(errMsg);
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  // Handle Direct Cab Booking Submission (No Payment Gateway)
  const handleCreateBooking = async (e) => {
    e.preventDefault();
    setSubmitError('');

    if (!customerName.trim()) {
      setSubmitError('Please enter your full name.');
      return;
    }

    const cleanPhone = customerPhone.replace(/\D/g, '');
    if (cleanPhone.length < 10) {
      setSubmitError('Please enter a valid 10-digit mobile number.');
      return;
    }

    if (!isPhoneVerified || !verificationToken) {
      setSubmitError('🔒 Mobile Verification Required: Click "Verify Number" to receive and confirm your WhatsApp OTP first.');
      return;
    }

    if (!pickupAddress.trim()) {
      setSubmitError('Please enter your exact pickup street address or landmark.');
      return;
    }

    if (tripType !== 'LOCAL' && !dropAddress.trim()) {
      setSubmitError('Please enter your destination drop address.');
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        tripType,
        pickupLocationId: pickupId || undefined,
        dropLocationId: dropId || undefined,
        vehicleId: selectedVehicle?.vehicleId || vehicleId,
        localVehicleId: tripType === 'LOCAL' ? (selectedVehicle?.vehicleId || vehicleId) : undefined,
        city: tripType === 'LOCAL' ? city : undefined,
        durationHours: tripType === 'LOCAL' ? parseInt(duration, 10) : undefined,
        pickupDate: departureDate || date,
        pickupTime: departureTime || time,
        returnDate: tripType === 'ROUND_TRIP' ? returnDate : undefined,
        returnTime: tripType === 'ROUND_TRIP' ? returnTime : undefined,
        passengers: parseInt(passengers, 10) || 1,
        customerName: customerName.trim(),
        customerPhone: cleanPhone,
        customerEmail: customerEmail.trim() || undefined,
        pickupAddress: pickupAddress.trim(),
        dropAddress: tripType === 'LOCAL' ? 'Local City Travel' : dropAddress.trim(),
        notes: notes.trim() || undefined,
        verificationToken,
        paymentStatus: 'PAY_TO_DRIVER',
        paymentMethod: 'Pay to Driver / Cash on Pickup',
      };

      const res = await bookingApi.create(payload);
      if (res.data?.success) {
        setBookingConfirmed({
          ...res.data.data,
          paymentMethodName: 'Pay to Driver (Cash / UPI)',
        });
      } else {
        setSubmitError(res.data?.message || 'Failed to complete booking.');
      }
    } catch (err) {
      console.error('Booking submission error:', err);
      setSubmitError(
        err.response?.data?.message ||
          'Booking process encountered an error. Please try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Fuel Type resolver
  let fuelType = 'CNG / Petrol';
  if (selectedVehicle?.description?.toLowerCase().includes('diesel')) {
    fuelType = 'Diesel (AC)';
  }

  const fareTotal = selectedVehicle?.fare?.total || 0;

  return (
    <div className="fare-page-wrapper">
      <Header isDark={false} />

      {/* Main Single-Window Checkout Section */}
      <main className="container booking-main-container">
        {bookingConfirmed ? (
          /* Confirmation Receipt Modal */
          <div className="booking-confirmed-card">
            <div className="confirmed-icon-circle">
              <Check size={32} strokeWidth={3} />
            </div>

            <h2 style={{ fontSize: '1.45rem', fontWeight: 800, color: '#0F172A', marginBottom: '0.25rem' }}>
              Cab Booking Confirmed!
            </h2>
            <p style={{ color: '#64748B', fontSize: '0.84rem', marginBottom: '1.1rem' }}>
              Booking Ref ID:{' '}
              <strong style={{ color: '#0284C7' }}>#{bookingConfirmed.id?.slice(-6).toUpperCase()}</strong>. Chauffeur details will be sent to your verified mobile number 1 hour prior to pickup.
            </p>

            <div className="confirmed-summary-table">
              <div className="confirmed-grid-2">
                <div>
                  <span className="confirmed-label">Passenger Name:</span>
                  <strong>{bookingConfirmed.customerName}</strong>
                </div>
                <div>
                  <span className="confirmed-label">Verified Mobile:</span>
                  <strong style={{ color: '#16A34A' }}>+91 {bookingConfirmed.customerPhone} (✓ Verified)</strong>
                </div>
                <div>
                  <span className="confirmed-label">Travel Route:</span>
                  <strong>
                    {tripType === 'LOCAL'
                      ? `${city} (${duration}h Package)`
                      : `${quoteData?.route?.pickup?.name || 'Pune'} ➔ ${quoteData?.route?.drop?.name || 'Mumbai'}`}
                  </strong>
                </div>
                <div>
                  <span className="confirmed-label">Vehicle Selected:</span>
                  <strong>{selectedVehicle?.name || 'Executive Cab'}</strong>
                </div>
                <div>
                  <span className="confirmed-label">Payment Mode:</span>
                  <span style={{ color: '#0284C7', fontWeight: 800 }}>Pay to Driver on Trip (Cash / UPI)</span>
                </div>
                <div>
                  <span className="confirmed-label">Total Payable:</span>
                  <strong style={{ color: '#16A34A', fontSize: '1.05rem' }}>₹{fareTotal?.toLocaleString()}</strong>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
              <Link to="/" className="btn-blue" style={{ padding: '0.7rem 1.4rem' }}>
                Back to Home Page
              </Link>
            </div>
          </div>
        ) : (
          <div className="booking-compact-grid">
            {/* Left Column: Form */}
            <div className="booking-card-left">
              <div className="booking-section-header">
                <h1 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>
                  Passenger & Pickup Details
                </h1>
                <span className="booking-instant-tag">✓ Verified Secure Booking</span>
              </div>

              {submitError && (
                <div className="booking-error-badge">
                  <AlertCircle size={14} style={{ flexShrink: 0 }} />
                  <span>{submitError}</span>
                </div>
              )}

              {otpNotice && (
                <div className="booking-notice-badge" style={{ backgroundColor: '#ECFDF5', border: '1px solid #A7F3D0', color: '#065F46', padding: '0.5rem 0.85rem', borderRadius: '9px', fontSize: '0.78rem', fontWeight: 700, marginBottom: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                  <CheckCircle2 size={15} color="#10B981" />
                  <span>{otpNotice}</span>
                </div>
              )}

              <form onSubmit={handleCreateBooking} className="booking-compact-form">
                {/* Row 1: Name & Mobile */}
                <div className="booking-input-row-2">
                  {/* Full Name */}
                  <div className="booking-input-group">
                    <label className="booking-form-label">Full Name *</label>
                    <div className="booking-field-wrapper">
                      <User size={14} className="booking-field-icon" />
                      <input
                        type="text"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        placeholder="Enter full name"
                        className="booking-form-control with-icon"
                        required
                      />
                    </div>
                  </div>

                  {/* Mobile Number with OTP Verification */}
                  <div className="booking-input-group">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <label className="booking-form-label">Mobile Number *</label>
                      {isPhoneVerified && (
                        <span style={{ fontSize: '0.66rem', color: '#16A34A', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                          <CheckCircle2 size={11} color="#16A34A" />
                          <span>✓ Verified</span>
                        </span>
                      )}
                    </div>

                    <div className="booking-field-wrapper" style={{ gap: '0.35rem' }}>
                      <span className="booking-phone-prefix">+91</span>
                      <input
                        type="tel"
                        value={customerPhone}
                        disabled={isPhoneVerified}
                        onChange={(e) => {
                          const val = e.target.value;
                          setCustomerPhone(val);
                          setIsPhoneVerified(false);
                          setVerificationToken('');
                          setOtpSent(false);
                          setOtpError('');
                        }}
                        placeholder="10-digit number"
                        maxLength="10"
                        className="booking-form-control with-prefix"
                        required
                      />

                      {!isPhoneVerified && customerPhone.replace(/\D/g, '').length === 10 && (
                        <button
                          type="button"
                          onClick={handleSendOtp}
                          disabled={isSendingOtp || (otpSent && cooldown > 0)}
                          className="btn-otp-trigger"
                        >
                          {isSendingOtp ? (
                            <Loader2 size={12} className="animate-spin" />
                          ) : otpSent && cooldown > 0 ? (
                            `Resend (${cooldown}s)`
                          ) : otpSent ? (
                            'Resend OTP'
                          ) : (
                            'Verify Number'
                          )}
                        </button>
                      )}
                    </div>

                    {/* Inline OTP Verification Flow */}
                    {otpSent && !isPhoneVerified && (
                      <div
                        id="inline-otp-section"
                        style={{
                          marginTop: '0.65rem',
                          padding: '0.75rem 0.85rem',
                          background: '#F0FDF4',
                          border: '1.5px solid #86EFAC',
                          borderRadius: '10px',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '0.5rem',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <CheckCircle2 size={14} color="#16A34A" style={{ flexShrink: 0 }} />
                          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#15803D' }}>
                            OTP sent to your WhatsApp number. Please enter it below.
                          </span>
                        </div>

                        {otpError && (
                          <div
                            id="inline-otp-error"
                            style={{
                              color: '#BE123C',
                              backgroundColor: '#FFE4E6',
                              border: '1px solid #FECDD3',
                              padding: '0.4rem 0.6rem',
                              borderRadius: '6px',
                              fontSize: '0.72rem',
                              fontWeight: 600,
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.3rem',
                            }}
                          >
                            <AlertCircle size={13} color="#BE123C" style={{ flexShrink: 0 }} />
                            <span>{otpError}</span>
                          </div>
                        )}

                        <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                          <input
                            type="text"
                            id="inline-otp-input"
                            value={inputOtp}
                            onChange={(e) => {
                              setInputOtp(e.target.value.replace(/\D/g, ''));
                              if (otpError) setOtpError('');
                            }}
                            placeholder="Enter OTP"
                            maxLength="8"
                            autoFocus
                            style={{
                              flex: '1',
                              minWidth: '0',
                              height: '34px',
                              padding: '0 0.6rem',
                              fontSize: '0.95rem',
                              letterSpacing: '0.12em',
                              fontWeight: 700,
                              fontFamily: 'monospace',
                              textAlign: 'center',
                              borderRadius: '6px',
                              border: '1.5px solid #22C55E',
                              outline: 'none',
                              background: '#FFFFFF',
                              color: '#0F172A',
                            }}
                          />

                          <button
                            type="button"
                            id="btn-verify-otp-inline"
                            onClick={handleVerifyOtp}
                            disabled={isVerifyingOtp || !inputOtp.trim()}
                            style={{
                              height: '34px',
                              padding: '0 0.85rem',
                              background: '#16A34A',
                              color: '#FFFFFF',
                              border: 'none',
                              borderRadius: '6px',
                              fontSize: '0.74rem',
                              fontWeight: 800,
                              cursor: isVerifyingOtp || !inputOtp.trim() ? 'not-allowed' : 'pointer',
                              opacity: isVerifyingOtp || !inputOtp.trim() ? 0.6 : 1,
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.3rem',
                              whiteSpace: 'nowrap',
                              transition: 'all 0.2s ease',
                            }}
                          >
                            {isVerifyingOtp ? (
                              <>
                                <Loader2 size={12} className="animate-spin" />
                                <span>Verifying...</span>
                              </>
                            ) : (
                              <>
                                <CheckCircle2 size={13} />
                                <span>Verify OTP</span>
                              </>
                            )}
                          </button>

                          <button
                            type="button"
                            id="btn-resend-otp-inline"
                            onClick={handleSendOtp}
                            disabled={isSendingOtp || cooldown > 0}
                            style={{
                              height: '34px',
                              padding: '0 0.65rem',
                              background: '#FFFFFF',
                              color: cooldown > 0 ? '#94A3B8' : '#0284C7',
                              border: '1px solid #CBD5E1',
                              borderRadius: '6px',
                              fontSize: '0.72rem',
                              fontWeight: 700,
                              cursor: isSendingOtp || cooldown > 0 ? 'not-allowed' : 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.25rem',
                              whiteSpace: 'nowrap',
                              transition: 'all 0.2s ease',
                            }}
                          >
                            {isSendingOtp ? (
                              <Loader2 size={11} className="animate-spin" />
                            ) : cooldown > 0 ? (
                              <span>Resend in {cooldown}s</span>
                            ) : (
                              <span>Resend OTP</span>
                            )}
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Inline error if OTP send failed before otpSent became true */}
                    {otpError && !otpSent && !isPhoneVerified && (
                      <div
                        id="inline-otp-send-error"
                        style={{
                          marginTop: '0.45rem',
                          color: '#BE123C',
                          backgroundColor: '#FFE4E6',
                          border: '1px solid #FECDD3',
                          padding: '0.4rem 0.6rem',
                          borderRadius: '6px',
                          fontSize: '0.72rem',
                          fontWeight: 600,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.3rem',
                        }}
                      >
                        <AlertCircle size={13} color="#BE123C" style={{ flexShrink: 0 }} />
                        <span>{otpError}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Row 2: Pickup Address (Unlocked upon phone verification) */}
                <div className="booking-input-group">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <label className="booking-form-label">
                      <MapPin size={12} color="#0284C7" style={{ display: 'inline', marginRight: '3px' }} />
                      Exact Pickup Address / Building / Landmark *
                    </label>
                    {!isPhoneVerified && (
                      <span style={{ fontSize: '0.66rem', color: '#D97706', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                        <Lock size={11} />
                        <span>Verify Phone First</span>
                      </span>
                    )}
                  </div>
                  <div className="booking-field-wrapper">
                    <div className="booking-dot-indicator pickup-dot" />
                    <input
                      type="text"
                      value={pickupAddress}
                      disabled={!isPhoneVerified}
                      onChange={(e) => setPickupAddress(e.target.value)}
                      placeholder={isPhoneVerified ? 'e.g. Flat 302, Rohan Viti, Wakad / Baner / Pune Airport' : '🔒 Verify mobile number above to enter pickup address'}
                      className="booking-form-control with-dot"
                      required
                    />
                  </div>
                </div>

                {/* Row 3: Drop Address (Intercity) */}
                {tripType !== 'LOCAL' ? (
                  <div className="booking-input-group">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <label className="booking-form-label">
                        <Navigation size={12} color="#10B981" style={{ display: 'inline', marginRight: '3px' }} />
                        Drop Location / Terminal / Hotel *
                      </label>
                      {!isPhoneVerified && (
                        <span style={{ fontSize: '0.66rem', color: '#D97706', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                          <Lock size={11} />
                          <span>Verify Phone First</span>
                        </span>
                      )}
                    </div>
                    <div className="booking-field-wrapper">
                      <div className="booking-dot-indicator drop-dot" />
                      <input
                        type="text"
                        value={dropAddress}
                        disabled={!isPhoneVerified}
                        onChange={(e) => setDropAddress(e.target.value)}
                        placeholder={isPhoneVerified ? 'e.g. T2 Mumbai International Airport / BKC / Bandra' : '🔒 Verify mobile number above to enter drop address'}
                        className="booking-form-control with-dot"
                        required
                      />
                    </div>
                  </div>
                ) : (
                  <div className="booking-input-group">
                    <label className="booking-form-label">Local Rental Details / Specific Stops (Optional)</label>
                    <input
                      type="text"
                      value={notes}
                      disabled={!isPhoneVerified}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder={isPhoneVerified ? 'e.g. City sightseeing, business meetings around FC Road' : '🔒 Verify mobile number above to type notes'}
                      className="booking-form-control"
                    />
                  </div>
                )}

                {/* Row 4: Email & Special Notes */}
                <div className="booking-input-row-2">
                  <div className="booking-input-group">
                    <label className="booking-form-label">Email (Optional - For GST/Invoice)</label>
                    <input
                      type="email"
                      value={customerEmail}
                      onChange={(e) => setCustomerEmail(e.target.value)}
                      placeholder="name@example.com"
                      className="booking-form-control"
                    />
                  </div>

                  {tripType !== 'LOCAL' && (
                    <div className="booking-input-group">
                      <label className="booking-form-label">Flight No. / Special Note (Optional)</label>
                      <input
                        type="text"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="e.g. Flight 6E 204 arriving 8:30 PM"
                        className="booking-form-control"
                      />
                    </div>
                  )}
                </div>

                {/* Submit Action */}
                <button
                  type="submit"
                  disabled={recalculatingQuote || isSubmitting}
                  className="booking-confirm-btn"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      <span>CONFIRMING YOUR BOOKING...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={16} />
                      <span>CONFIRM & BOOK CAB NOW (₹{fareTotal?.toLocaleString()})</span>
                      <ArrowRight size={16} />
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* Right Column: Order Summary & Pricing */}
            <div className="booking-card-right">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.65rem' }}>
                <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Trip & Vehicle Summary
                </span>
                <span className="booking-fare-verified-badge">
                  ✓ Guaranteed Price
                </span>
              </div>

              {/* Vehicle Mini Card */}
              {selectedVehicle && (
                <div className="booking-vehicle-compact-card">
                  <img
                    src={
                      selectedVehicle.image?.startsWith('http') || selectedVehicle.image?.startsWith('/uploads')
                        ? `${selectedVehicle.image.startsWith('/uploads') ? API_BASE_URL : ''}${selectedVehicle.image}`
                        : selectedVehicle.image || '/assets/sedan.webp'
                    }
                    alt={selectedVehicle.name}
                    className="booking-vehicle-thumb"
                    onError={(e) => {
                      e.target.src = '/assets/sedan.webp';
                    }}
                  />
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ fontWeight: 800, fontSize: '0.88rem', color: '#0F172A', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {selectedVehicle.name}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: '#64748B', display: 'flex', gap: '0.35rem', marginTop: '0.1rem', flexWrap: 'wrap' }}>
                      <span style={{ fontWeight: 600 }}>{selectedVehicle.seatingCapacity} Seater AC</span>
                      <span>•</span>
                      <span style={{ color: '#059669', fontWeight: 600 }}>{fuelType}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Journey Specifications */}
              <div className="booking-specs-list">
                <div className="booking-spec-row">
                  <span>Route / City:</span>
                  <strong>
                    {tripType === 'LOCAL'
                      ? `${city} (${duration}h / ${duration * 10}km package)`
                      : `${quoteData?.route?.pickup?.name || 'Pune'} ➔ ${quoteData?.route?.drop?.name || 'Mumbai'}`}
                  </strong>
                </div>

                <div className="booking-spec-row">
                  <span>Pickup Date & Time:</span>
                  <strong>{departureDate} at {departureTime}</strong>
                </div>

                {tripType === 'ROUND_TRIP' && returnDate && (
                  <div className="booking-spec-row">
                    <span>Return Date & Time:</span>
                    <strong style={{ color: '#D97706' }}>{returnDate} at {returnTime}</strong>
                  </div>
                )}
                
                <div className="booking-spec-row">
                  <span>Passengers:</span>
                  <strong>{passengers} Person(s)</strong>
                </div>
              </div>

              {/* Price Breakdown */}
              <div className="booking-price-box">
                <div className="booking-price-item">
                  <span>Base Cab Rate:</span>
                  <span>₹{selectedVehicle?.fare?.baseFare?.toLocaleString() || 0}</span>
                </div>

                {selectedVehicle?.fare?.toll > 0 && (
                  <div className="booking-price-item">
                    <span>Expressway Toll:</span>
                    <span>+₹{selectedVehicle.fare.toll.toLocaleString()}</span>
                  </div>
                )}

                {selectedVehicle?.fare?.parking > 0 && (
                  <div className="booking-price-item">
                    <span>Airport Parking:</span>
                    <span>+₹{selectedVehicle.fare.parking.toLocaleString()}</span>
                  </div>
                )}

                <div className="booking-total-row">
                  <span style={{ fontWeight: 800, fontSize: '0.88rem', color: '#0F172A' }}>Total Payable Amount:</span>
                  <span style={{ fontWeight: 900, fontSize: '1.25rem', color: '#0284C7' }}>
                    ₹{fareTotal?.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Trust Badge */}
              <div className="booking-trust-note">
                <CheckCircle2 size={14} color="#16A34A" style={{ flexShrink: 0 }} />
                <span>Zero Advance Required. Pay directly to the chauffeur on trip completion (Cash / UPI).</span>
              </div>
            </div>
          </div>
        )}
      </main>





      <Footer />
    </div>
  );
};
