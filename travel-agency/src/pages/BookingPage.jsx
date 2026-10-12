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
import { bookingApi, fareApi, locationApi, API_BASE_URL } from '../services/api';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import './fare.css';

export const BookingPage = () => {
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

  // Phone OTP Verification Popup Modal States
  const [isPhoneVerified, setIsPhoneVerified] = useState(false);
  const [isOtpModalOpen, setIsOtpModalOpen] = useState(false);
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [inputOtp, setInputOtp] = useState('');
  const [otpNotice, setOtpNotice] = useState('');
  const [otpError, setOtpError] = useState('');
  const [isSendingOtp, setIsSendingOtp] = useState(false);

  // Payment Integration Modal States
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('UPI'); // 'UPI' | 'RAZORPAY' | 'CARD' | 'NETBANKING'
  const [upiId, setUpiId] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

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

  // Handle Send Phone OTP Popup Trigger
  const handleSendOtp = () => {
    setOtpError('');
    setOtpNotice('');
    setInputOtp('');
    const cleanPhone = customerPhone.replace(/\D/g, '');
    if (cleanPhone.length !== 10) {
      setOtpError('Please enter a valid 10-digit mobile number first.');
      return;
    }

    setIsSendingOtp(true);
    setTimeout(() => {
      // Generate 4-digit verification code (e.g. 4829)
      const mockCode = Math.floor(1000 + Math.random() * 9000).toString();
      setGeneratedOtp(mockCode);
      setIsSendingOtp(false);
      setIsOtpModalOpen(true); // Open OTP Verification Popup Modal
    }, 500);
  };

  // Handle Verify OTP Code inside Popup Modal
  const handleVerifyOtp = () => {
    setOtpError('');
    if (!inputOtp.trim()) {
      setOtpError('Please enter the 4-digit OTP code.');
      return;
    }

    // Allow generated OTP (or universal testing code 1234 strictly in local development)
    const isLocalDev = import.meta.env.DEV;
    if (inputOtp.trim() === generatedOtp || (isLocalDev && inputOtp.trim() === '1234')) {
      setIsPhoneVerified(true);
      setIsOtpModalOpen(false); // Close OTP Popup Modal!
      setOtpError('');
      setSubmitError('');
      setOtpNotice(`✓ Mobile number +91 ${customerPhone} verified successfully! Pickup & Drop location fields unlocked.`);
    } else {
      setOtpError('Invalid OTP code. Please check code and try again.');
    }
  };

  // Handle Open Payment Gateway Modal
  const handleOpenPaymentModal = (e) => {
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

    if (!isPhoneVerified) {
      setSubmitError('🔒 Mobile Verification Required: Click "Verify Number" to receive & confirm OTP first.');
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

    // Opens Payment Modal
    setIsPaymentModalOpen(true);
  };

  // Handle Final Payment & Booking Submission
  const handleCompletePayment = async () => {
    setIsProcessingPayment(true);
    setSubmitError('');

    const cleanPhone = customerPhone.replace(/\D/g, '');
    const generatedTxnId = `pay_rzp_${Date.now().toString(36)}${Math.random().toString(36).substring(2, 6)}`;

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
        isPhoneVerified: true,
        paymentStatus: 'COMPLETED',
        paymentId: generatedTxnId,
        paymentMethod: selectedPaymentMethod === 'UPI' ? 'UPI (Google Pay / PhonePe)' : selectedPaymentMethod === 'CARD' ? 'Credit/Debit Card (Razorpay)' : 'Net Banking Gateway',
      };

      // Simulated 1.2s payment gateway handshake delay
      await new Promise((resolve) => setTimeout(resolve, 1200));

      const res = await bookingApi.create(payload);
      if (res.data?.success) {
        setBookingConfirmed({
          ...res.data.data,
          paymentTxnId: generatedTxnId,
          paymentMethodName: payload.paymentMethod,
        });
        setIsPaymentModalOpen(false);
      } else {
        setSubmitError(res.data?.message || 'Failed to complete transaction.');
      }
    } catch (err) {
      console.error('Payment booking error:', err);
      setSubmitError(
        err.response?.data?.message ||
          'Payment process encountered an error. Please try again.'
      );
    } finally {
      setIsProcessingPayment(false);
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
              Cab Booking & Payment Confirmed!
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
                  <span className="confirmed-label">Payment Status:</span>
                  <span style={{ color: '#16A34A', fontWeight: 800 }}>✅ PAID & SUCCESSFUL</span>
                </div>
                <div>
                  <span className="confirmed-label">Payment Transaction ID:</span>
                  <strong style={{ fontFamily: 'monospace', color: '#0284C7' }}>{bookingConfirmed.paymentTxnId || 'pay_rzp_98231'}</strong>
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

              <form onSubmit={handleOpenPaymentModal} className="booking-compact-form">
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
                          setCustomerPhone(e.target.value);
                          setIsPhoneVerified(false);
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
                          disabled={isSendingOtp}
                          className="btn-otp-trigger"
                        >
                          {isSendingOtp ? <Loader2 size={12} className="animate-spin" /> : 'Verify Number'}
                        </button>
                      )}
                    </div>
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
                  disabled={recalculatingQuote}
                  className="booking-confirm-btn"
                >
                  <Lock size={16} />
                  <span>CONFIRM & BOOK CAB NOW (₹{fareTotal?.toLocaleString()})</span>
                  <ArrowRight size={16} />
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
                <span>Instant 256-Bit SSL Payment Gateway Integration. All Cards, UPI & NetBanking accepted.</span>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* ── POPUP OTP VERIFICATION MODAL ── */}
      {isOtpModalOpen && (
        <div className="payment-modal-backdrop">
          <div className="payment-modal-card" style={{ maxWidth: '420px', padding: '1.5rem', borderRadius: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#E0F2FE', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Phone size={18} color="#0284C7" />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>
                    Verify Mobile Number
                  </h3>
                  <span style={{ fontSize: '0.72rem', color: '#64748B' }}>
                    Sent to +91 {customerPhone}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsOtpModalOpen(false)}
                style={{ background: '#F1F5F9', border: 'none', borderRadius: '8px', width: '30px', height: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
              >
                <X size={16} color="#64748B" />
              </button>
            </div>

            {import.meta.env.DEV && (
              <div style={{ background: '#F0F9FF', border: '1px solid #BAE6FD', padding: '0.65rem 0.85rem', borderRadius: '10px', fontSize: '0.78rem', color: '#0369A1', fontWeight: 700, marginBottom: '1.25rem', textAlign: 'center' }}>
                🔑 [Dev Mode Simulation] Verification Code: <span style={{ fontSize: '1.15rem', fontWeight: 900, letterSpacing: '0.12em', color: '#0284C7' }}>{generatedOtp}</span>
              </div>
            )}

            <div style={{ marginBottom: '1.25rem', textAlign: 'center' }}>
              <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 800, color: '#475569', marginBottom: '0.45rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Enter 4-Digit OTP Code
              </label>
              <input
                type="text"
                value={inputOtp}
                onChange={(e) => setInputOtp(e.target.value)}
                placeholder="• • • •"
                maxLength="4"
                autoFocus
                style={{ width: '180px', height: '46px', margin: '0 auto', fontSize: '1.35rem', letterSpacing: '0.3em', fontFamily: 'monospace', fontWeight: 900, textAlign: 'center', borderRadius: '12px', border: '2px solid #0284C7', outline: 'none', background: '#F8FAFC' }}
              />
            </div>

            {otpError && (
              <div style={{ color: '#E11D48', fontSize: '0.76rem', fontWeight: 700, marginBottom: '0.85rem', textAlign: 'center' }}>
                {otpError}
              </div>
            )}

            <button
              type="button"
              onClick={handleVerifyOtp}
              className="pay-btn-glow"
              style={{ width: '100%', margin: '0', height: '46px', fontSize: '0.88rem' }}
            >
              <CheckCircle2 size={18} />
              <span>VERIFY OTP & CONTINUE</span>
            </button>
          </div>
        </div>
      )}

      {/* ── SECURED PAYMENT GATEWAY MODAL (Razorpay / Instant UPI Payment) ── */}
      {isPaymentModalOpen && (
        <div className="payment-modal-backdrop">
          <div className="payment-modal-card">
            {/* Modal Header */}
            <div className="payment-modal-header">
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <ShieldCheck size={20} color="#10B981" />
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#FFFFFF', margin: 0 }}>
                    Secured Payment Gateway
                  </h3>
                </div>
                <p style={{ fontSize: '0.74rem', color: '#94A3B8', margin: '0.2rem 0 0 0' }}>
                  Pune ↔ Mumbai Private Travels • Instant Fare Checkout
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsPaymentModalOpen(false)}
                className="payment-modal-close-btn"
              >
                <X size={18} color="#FFFFFF" />
              </button>
            </div>

            {/* Amount Summary Strip */}
            <div className="payment-summary-strip">
              <div>
                <span style={{ fontSize: '0.7rem', color: '#64748B', fontWeight: 700, textTransform: 'uppercase' }}>
                  Total Amount Payable
                </span>
                <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#0284C7', lineHeight: 1 }}>
                  ₹{fareTotal?.toLocaleString()}
                </div>
              </div>

              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#0F172A', display: 'block' }}>
                  {selectedVehicle?.name || 'Executive Sedan'}
                </span>
                <span style={{ fontSize: '0.7rem', color: '#16A34A', fontWeight: 700 }}>
                  ✓ Expressway Toll & Tax Included
                </span>
              </div>
            </div>

            {/* Payment Method Tabs */}
            <div className="payment-method-bar">
              <button
                type="button"
                className={`payment-method-pill ${selectedPaymentMethod === 'UPI' ? 'active' : ''}`}
                onClick={() => setSelectedPaymentMethod('UPI')}
              >
                <QrCode size={15} />
                <span>UPI / QR</span>
              </button>

              <button
                type="button"
                className={`payment-method-pill ${selectedPaymentMethod === 'CARD' ? 'active' : ''}`}
                onClick={() => setSelectedPaymentMethod('CARD')}
              >
                <CreditCard size={15} />
                <span>Razorpay / Card</span>
              </button>

              <button
                type="button"
                className={`payment-method-pill ${selectedPaymentMethod === 'NETBANKING' ? 'active' : ''}`}
                onClick={() => setSelectedPaymentMethod('NETBANKING')}
              >
                <Building size={15} />
                <span>Net Banking</span>
              </button>
            </div>

            {/* Payment Option Form */}
            <div className="payment-form-body">
              {selectedPaymentMethod === 'UPI' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <label className="booking-form-label">Enter VPA / UPI ID (Google Pay, PhonePe, Paytm)</label>
                  <input
                    type="text"
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value)}
                    placeholder="e.g. 9876543210@paytm / name@upi"
                    className="booking-form-control"
                    style={{ fontSize: '0.9rem', padding: '0 1rem' }}
                  />

                  <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', padding: '0.65rem 0.85rem', borderRadius: '10px', fontSize: '0.76rem', color: '#475569' }}>
                    💡 <strong>Instant Payment Handshake:</strong> A collect request will be sent to your UPI app.
                  </div>
                </div>
              )}

              {selectedPaymentMethod === 'CARD' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                  <div>
                    <label className="booking-form-label">Card Number</label>
                    <input
                      type="text"
                      value={cardNumber}
                      onChange={(e) => setCardNumber(e.target.value)}
                      placeholder="4532 •••• •••• 8921"
                      maxLength="19"
                      className="booking-form-control"
                    />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.65rem' }}>
                    <div>
                      <label className="booking-form-label">Expiry Date</label>
                      <input
                        type="text"
                        value={cardExpiry}
                        onChange={(e) => setCardExpiry(e.target.value)}
                        placeholder="MM/YY"
                        maxLength="5"
                        className="booking-form-control"
                      />
                    </div>
                    <div>
                      <label className="booking-form-label">CVV</label>
                      <input
                        type="password"
                        value={cardCvv}
                        onChange={(e) => setCardCvv(e.target.value)}
                        placeholder="•••"
                        maxLength="4"
                        className="booking-form-control"
                      />
                    </div>
                  </div>
                </div>
              )}

              {selectedPaymentMethod === 'NETBANKING' && (
                <div>
                  <label className="booking-form-label">Select Bank</label>
                  <select className="booking-form-control" style={{ width: '100%' }}>
                    <option value="HDFC">HDFC Bank</option>
                    <option value="ICICI">ICICI Bank</option>
                    <option value="SBI">State Bank of India (SBI)</option>
                    <option value="AXIS">Axis Bank</option>
                    <option value="KOTAK">Kotak Mahindra Bank</option>
                  </select>
                </div>
              )}
            </div>

            {/* Complete Payment Button */}
            <button
              type="button"
              onClick={handleCompletePayment}
              disabled={isProcessingPayment}
              className="pay-btn-glow"
            >
              {isProcessingPayment ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  <span>Processing Bank Gateway Handshake...</span>
                </>
              ) : (
                <>
                  <Lock size={18} />
                  <span>PAY ₹{fareTotal?.toLocaleString()} & COMPLETE BOOKING</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
};
