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
  MessageSquare,
  Info,
} from 'lucide-react';
import { bookingApi, fareApi, locationApi, otpApi, enquiryApi, API_BASE_URL } from '../services/api';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { usePageSeo } from '../hooks/usePageSeo';
import { useScrollReveal } from '../hooks/useScrollReveal';
import './fare.css';

export const BookingPage = () => {
  usePageSeo('booking', 'Book Pune to Mumbai Cab Online | AJ Tours & Travels', undefined, 'https://ajtravelspune.com/booking');
  const [searchParams] = useSearchParams();
  const locationState = useLocation();
  const navigate = useNavigate();

  // Scroll reveal trigger
  useScrollReveal();

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
  const [pickupAddress, setPickupAddress] = useState(
    () =>
      searchParams.get('pickupAddress') ||
      locationState.state?.pickupAddress ||
      locationState.state?.searchParams?.pickupAddress ||
      ''
  );
  const [dropAddress, setDropAddress] = useState(
    () =>
      searchParams.get('dropAddress') ||
      locationState.state?.dropAddress ||
      locationState.state?.searchParams?.dropAddress ||
      ''
  );
  const [notes, setNotes] = useState('');

  // WhatsApp OTP Verification Inline States
  const [isPhoneVerified, setIsPhoneVerified] = useState(false);
  const [verificationToken, setVerificationToken] = useState('');
  const [verifiedPhoneNumber, setVerifiedPhoneNumber] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [inputOtp, setInputOtp] = useState('');
  const [otpNotice, setOtpNotice] = useState('');
  const [otpError, setOtpError] = useState('');
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  // Fallback Callback & Enquiry States
  const [isFallbackMode, setIsFallbackMode] = useState(false);
  const [isSubmittingCallback, setIsSubmittingCallback] = useState(false);
  const [callbackError, setCallbackError] = useState('');
  const [callbackSuccess, setCallbackSuccess] = useState(null);

  // Submission State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [bookingConfirmed, setBookingConfirmed] = useState(null);

  // Server-side quote verification on mount
  useEffect(() => {
    // Skip entirely if quoteData and vehicle are already passed via navigation state
    if (locationState.state?.quoteData && (locationState.state?.vehicle || vehicleId)) {
      setRecalculatingQuote(false);
      return;
    }

    const effectivePId =
      pickupId && pickupId !== 'custom'
        ? pickupId
        : quoteData?.route?.pickup?.id || quoteData?.searchParams?.pickupLocationId || '';

    const effectiveDId =
      dropId && dropId !== 'custom'
        ? dropId
        : quoteData?.route?.drop?.id || quoteData?.searchParams?.dropLocationId || '';

    // Skip API call if we lack the required IDs (would cause 400)
    const hasValidRoute =
      tripType === 'LOCAL'
        ? city && duration
        : Boolean(effectivePId && effectivePId !== 'custom' && effectiveDId && effectiveDId !== 'custom');

    if (!hasValidRoute) {
      setRecalculatingQuote(false);
      return;
    }

    const revalidateQuote = async () => {
      setRecalculatingQuote(true);
      setQuoteError('');
      try {
        const payload = {
          tripType,
          pickupLocationId: effectivePId && effectivePId !== 'custom' ? effectivePId : undefined,
          dropLocationId: effectiveDId && effectiveDId !== 'custom' ? effectiveDId : undefined,
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
        // Only log — don't block the booking page with an error banner
        console.warn('Quote revalidation skipped:', err?.response?.data?.message || err.message);
        setQuoteError('');
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
        setVerifiedPhoneNumber(cleanPhone);
        setOtpSent(false);
        setOtpError('');
        setSubmitError('');
        setCallbackError('');
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

    if (!selectedVehicle?.vehicleId && !vehicleId) {
      setSubmitError('Please select a vehicle and route via the Fare Calculator first before confirming your booking.');
      return;
    }

    // Resolve final master location IDs (never send 'custom' or unresolvable IDs)
    const finalPickupLocationId =
      pickupId && pickupId !== 'custom'
        ? pickupId
        : quoteData?.route?.pickup?.id || quoteData?.searchParams?.pickupLocationId || null;

    const finalDropLocationId =
      dropId && dropId !== 'custom'
        ? dropId
        : quoteData?.route?.drop?.id || quoteData?.searchParams?.dropLocationId || null;

    if (tripType !== 'LOCAL') {
      if (!finalPickupLocationId || finalPickupLocationId === 'custom' || !finalDropLocationId || finalDropLocationId === 'custom') {
        setSubmitError('Unable to resolve master corridor locations for this booking. Please re-select your route via the Fare Calculator.');
        return;
      }
    }

    setIsSubmitting(true);

    try {
      const payload = {
        tripType,
        pickupLocationId: tripType !== 'LOCAL' ? finalPickupLocationId : undefined,
        dropLocationId: tripType !== 'LOCAL' ? finalDropLocationId : undefined,
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

  // Phone change handler: resets verification if phone number digits change
  const handlePhoneChange = (e) => {
    const rawVal = e.target.value;
    const digits = rawVal.replace(/\D/g, '').slice(0, 10);
    setCustomerPhone(digits);

    if (isPhoneVerified && digits !== verifiedPhoneNumber) {
      setIsPhoneVerified(false);
      setVerificationToken('');
      setVerifiedPhoneNumber('');
      setOtpSent(false);
      setOtpNotice('');
      setOtpError('');
    }
  };

  // Resolved journey values for fallback enquiry and WhatsApp message
  const pickupRouteName =
    searchParams.get('pickupName') ||
    pickupAddress ||
    quoteData?.route?.pickup?.name ||
    'Pune';
  const dropRouteName =
    tripType === 'LOCAL'
      ? `${city} Local (${duration}h Package)`
      : searchParams.get('dropName') ||
        dropAddress ||
        quoteData?.route?.drop?.name ||
        'Mumbai';
  const selectedVehName =
    selectedVehicle?.name ||
    searchParams.get('vehicleName') ||
    'Executive Cab';
  const tripTypeLabel =
    tripType === 'ROUND_TRIP'
      ? 'Round Trip'
      : tripType === 'LOCAL'
      ? `Local Rental (${duration}h Package)`
      : 'One Way';

  const fareTotal = selectedVehicle?.fare?.total || 0;
  const fareSummaryText =
    fareTotal > 0
      ? `₹${fareTotal.toLocaleString()} (All inclusive)`
      : 'Please confirm the latest fare.';

  // Direct WhatsApp Chat Message Generator (Official: +91 7447443536)
  let whatsappMsg = `Hello AJ Travels Pune, I would like to enquire about a cab reservation:\n`;
  whatsappMsg += `• Name: ${customerName.trim() || 'Guest'}\n`;
  if (customerPhone.trim()) {
    whatsappMsg += `• Mobile: +91 ${customerPhone.replace(/\D/g, '')}\n`;
  }
  whatsappMsg += `• Trip Type: ${tripTypeLabel}\n`;
  whatsappMsg += `• Route: ${pickupRouteName} to ${dropRouteName}\n`;
  if (pickupAddress.trim()) {
    whatsappMsg += `• Pickup Address: ${pickupAddress.trim()}\n`;
  }
  if (tripType !== 'LOCAL' && dropAddress.trim()) {
    whatsappMsg += `• Drop Address: ${dropAddress.trim()}\n`;
  }
  whatsappMsg += `• Travel Date & Time: ${departureDate} at ${departureTime}\n`;
  if (tripType === 'ROUND_TRIP' && returnDate) {
    whatsappMsg += `• Return Date & Time: ${returnDate} at ${returnTime || 'Flexible'}\n`;
  }
  whatsappMsg += `• Passengers: ${passengers} Person(s)\n`;
  whatsappMsg += `• Selected Vehicle: ${selectedVehName}\n`;
  whatsappMsg += `• Estimated Fare: ${fareSummaryText}\n\n`;
  whatsappMsg += `Please check vehicle availability and confirm my booking details.`;

  const whatsappDirectUrl = `https://wa.me/917447443536?text=${encodeURIComponent(whatsappMsg)}`;

  // Fallback Callback Enquiry Submission Handler (POST /api/enquiries)
  const handleRequestCallback = async () => {
    setCallbackError('');
    setSubmitError('');

    if (!customerName.trim()) {
      setCallbackError('Please enter your full name first.');
      return;
    }

    const cleanPhone = customerPhone.replace(/\D/g, '');
    if (cleanPhone.length !== 10) {
      setCallbackError('Please enter a valid 10-digit mobile number.');
      return;
    }

    if (!pickupAddress.trim()) {
      setIsFallbackMode(true);
      setCallbackError('Address fields unlocked below. Please enter your pickup address and click Request a Callback.');
      return;
    }

    if (tripType !== 'LOCAL' && !dropAddress.trim()) {
      setIsFallbackMode(true);
      setCallbackError('Address fields unlocked below. Please enter your destination address and click Request a Callback.');
      return;
    }

    setIsSubmittingCallback(true);
    try {
      const payload = {
        name: customerName.trim(),
        phone: cleanPhone,
        pickup: pickupRouteName,
        destination: dropRouteName,
        pickupAddress: pickupAddress.trim(),
        dropAddress: tripType === 'LOCAL' ? `${city} Local City Travel` : dropAddress.trim(),
        travelDate: departureDate || date,
        departureTime: departureTime || time,
        vehicle: selectedVehName,
        vehicleId: selectedVehicle?.vehicleId || vehicleId || undefined,
        pickupLocationId: (pickupId && pickupId !== 'custom' ? pickupId : quoteData?.route?.pickup?.id || quoteData?.searchParams?.pickupLocationId) || undefined,
        dropLocationId: (dropId && dropId !== 'custom' ? dropId : quoteData?.route?.drop?.id || quoteData?.searchParams?.dropLocationId) || undefined,
        tripType,
        city: tripType === 'LOCAL' ? city : undefined,
        duration: tripType === 'LOCAL' ? parseInt(duration, 10) : undefined,
        passengers: parseInt(passengers, 10) || 1,
        notes: notes.trim() || undefined,
        source: 'WEB_FALLBACK',
      };

      const res = await enquiryApi.create(payload);
      if (res.data?.success) {
        setCallbackSuccess({
          reference: res.data.data?.reference || `ENQ-${res.data.data?.id?.slice(-6).toUpperCase()}`,
          id: res.data.data?.id,
          name: customerName.trim(),
          phone: cleanPhone,
          pickup: payload.pickup,
          destination: payload.destination,
          pickupAddress: pickupAddress.trim(),
          dropAddress: payload.dropAddress,
          vehicle: payload.vehicle,
          travelDate: payload.travelDate,
          departureTime: payload.departureTime,
          tripType,
        });
      } else {
        setCallbackError(res.data?.message || 'Failed to submit callback request. Please try again or chat with us on WhatsApp.');
      }
    } catch (err) {
      console.error('Callback enquiry error:', err);
      setCallbackError(err.response?.data?.message || 'Unable to submit enquiry at this moment. Please call or WhatsApp us directly.');
    } finally {
      setIsSubmittingCallback(false);
    }
  };

  const isAddressUnlocked = isPhoneVerified || isFallbackMode;

  // Fuel Type resolver
  let fuelType = 'CNG / Petrol';
  if (selectedVehicle?.description?.toLowerCase().includes('diesel')) {
    fuelType = 'Diesel (AC)';
  }

  return (
    <div className="fare-page-wrapper">
      <Header isDark={false} />

      {/* ── Internal Hero Banner (Matches Services & Corridors Header System) ── */}
      <section className="internal-hero-section">
        <div className="container">
          <div className="breadcrumbs-nav">
            <Link to="/">Home</Link>
            <span className="bc-sep">/</span>
            <Link to="/fare">Fare Calculator</Link>
            <span className="bc-sep">/</span>
            <span className="bc-current">Confirm Reservation</span>
          </div>

          <div className="internal-hero-content">
            <div className="hero-badge-pill">
              <Sparkles size={14} />
              <span>AJ TRAVEL AGENCY • EXPRESS CAB RESERVATION</span>
            </div>

            <h1 className="internal-hero-title">
              Confirm Your Cab <span className="text-gradient">Reservation</span>
            </h1>

            <p className="internal-hero-subtitle">
              Direct doorstep pickup with professional verified chauffeur. Pay directly to the driver upon trip arrival — zero advance deposit required.
            </p>

            {/* Corridor Route / Trip Stats Chips */}
            <div className="svc-stats-chips-row">
              <div className="chip-box">
                <Car size={15} color="#2563EB" />
                <div>
                  <span className="chip-lbl">ASSIGNED VEHICLE</span>
                  <strong>
                    {selectedVehicle?.name || (!recalculatingQuote && searchParams.get('vehicleName')) || (recalculatingQuote ? 'Calculating Cab Fare...' : 'Executive Cab')}
                  </strong>
                </div>
              </div>

              <div className="chip-box">
                <MapPin size={15} color="#2563EB" />
                <div>
                  <span className="chip-lbl">CORRIDOR ROUTE</span>
                  <strong>
                    {tripType === 'LOCAL'
                      ? `${city} Local (${duration}h Package)`
                      : `${quoteData?.route?.pickup?.name || 'Pune'} ➔ ${quoteData?.route?.drop?.name || 'Mumbai'}`}
                  </strong>
                </div>
              </div>

              <div className="chip-box">
                <ShieldCheck size={15} color="#15803D" />
                <div>
                  <span className="chip-lbl">RESERVATION GUARANTEE</span>
                  <strong>100% Guaranteed On-Time Departure</strong>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

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
                      : `${searchParams.get('pickupName') || pickupAddress || quoteData?.route?.pickup?.name || 'Pune'} ➔ ${searchParams.get('dropName') || dropAddress || quoteData?.route?.drop?.name || 'Mumbai'}`}
                  </strong>
                </div>
                <div>
                  <span className="confirmed-label">Vehicle Selected:</span>
                  <strong>{selectedVehicle?.name || searchParams.get('vehicleName') || 'Executive Cab'}</strong>
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
        ) : callbackSuccess ? (
          /* Fallback Callback Enquiry Confirmation Modal */
          <div className="booking-confirmed-card" style={{ border: '2px solid #F59E0B' }}>
            <div className="confirmed-icon-circle" style={{ backgroundColor: '#FEF3C7', color: '#D97706' }}>
              <PhoneCall size={32} strokeWidth={2.5} />
            </div>

            <h2 style={{ fontSize: '1.45rem', fontWeight: 800, color: '#0F172A', marginBottom: '0.25rem' }}>
              Trip Request Received!
            </h2>
            <p style={{ color: '#64748B', fontSize: '0.86rem', marginBottom: '1.1rem' }}>
              Enquiry Reference:{' '}
              <strong style={{ color: '#D97706' }}>#{callbackSuccess.reference}</strong>. Your trip request has been received. Our team will contact you to confirm availability and the final booking details.
            </p>

            <div style={{ backgroundColor: '#FFFBEB', border: '1px solid #FCD34D', borderRadius: '10px', padding: '0.75rem 1rem', marginBottom: '1.25rem', textAlign: 'left', fontSize: '0.8rem', color: '#92400E', lineHeight: 1.45 }}>
              <strong>Direct Request Notice:</strong> This trip request is saved as an enquiry with status <strong>NEW</strong>. Chauffeur allocation will be confirmed over phone call on <strong>+91 {callbackSuccess.phone}</strong>. No payment is required right now.
            </div>

            <div className="confirmed-summary-table">
              <div className="confirmed-grid-2">
                <div>
                  <span className="confirmed-label">Customer Name:</span>
                  <strong>{callbackSuccess.name}</strong>
                </div>
                <div>
                  <span className="confirmed-label">Contact Mobile:</span>
                  <strong style={{ color: '#D97706' }}>+91 {callbackSuccess.phone} (Callback Pending)</strong>
                </div>
                <div>
                  <span className="confirmed-label">Travel Route:</span>
                  <strong>
                    {tripType === 'LOCAL'
                      ? `${city} (${duration}h Package)`
                      : `${callbackSuccess.pickup} ➔ ${callbackSuccess.destination}`}
                  </strong>
                </div>
                <div>
                  <span className="confirmed-label">Pickup Address:</span>
                  <strong>{callbackSuccess.pickupAddress}</strong>
                </div>
                {tripType !== 'LOCAL' && (
                  <div>
                    <span className="confirmed-label">Drop Address:</span>
                    <strong>{callbackSuccess.dropAddress}</strong>
                  </div>
                )}
                <div>
                  <span className="confirmed-label">Vehicle Requested:</span>
                  <strong>{callbackSuccess.vehicle}</strong>
                </div>
                <div>
                  <span className="confirmed-label">Travel Schedule:</span>
                  <strong>{callbackSuccess.travelDate} at {callbackSuccess.departureTime}</strong>
                </div>
                <div>
                  <span className="confirmed-label">Quoted Fare:</span>
                  <strong style={{ color: '#0284C7' }}>{fareSummaryText}</strong>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', marginTop: '1.25rem', flexWrap: 'wrap' }}>
              <Link to="/" className="btn-blue" style={{ padding: '0.7rem 1.4rem' }}>
                Back to Home Page
              </Link>
              <a
                href={whatsappDirectUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  padding: '0.7rem 1.4rem',
                  background: '#15803D',
                  color: '#FFFFFF',
                  fontWeight: 800,
                  borderRadius: '8px',
                  textDecoration: 'none',
                  fontSize: '0.84rem'
                }}
              >
                <Phone size={14} />
                <span>Chat on WhatsApp</span>
              </a>
            </div>
          </div>
        ) : (
          <div className="booking-compact-grid">
            {/* Left Column: Form */}
            <div className="booking-card-left reveal stagger-1">
              <div className="booking-section-header">
                <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>
                  AJ Travel Agency — Passenger & Booking Details
                </h2>
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

              {!selectedVehicle && !recalculatingQuote && (
                <div style={{
                  backgroundColor: '#EFF6FF',
                  border: '1.5px solid #BFDBFE',
                  borderRadius: '10px',
                  padding: '0.85rem 1rem',
                  marginBottom: '1.1rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '0.75rem',
                  flexWrap: 'wrap'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Car size={18} color="#2563EB" style={{ flexShrink: 0 }} />
                    <span style={{ fontSize: '0.78rem', fontWeight: 600, color: '#1E40AF' }}>
                      Select your pickup & cab model in our Fare Calculator for automatic rate calculation.
                    </span>
                  </div>
                  <Link
                    to="/fare"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      padding: '0.4rem 0.85rem',
                      background: '#2563EB',
                      color: '#FFFFFF',
                      fontSize: '0.74rem',
                      fontWeight: 800,
                      borderRadius: '6px',
                      textDecoration: 'none',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    <span>Choose Cab & Fare</span>
                    <ArrowRight size={13} />
                  </Link>
                </div>
              )}

              <form onSubmit={handleCreateBooking} className="booking-compact-form">
                {/* ── Section 1: Passenger Contact Details ── */}
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

                  {/* Mobile Number with inline OTP trigger */}
                  <div className="booking-input-group">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <label className="booking-form-label">Mobile Number *</label>
                      {isPhoneVerified ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                          <span style={{ fontSize: '0.66rem', color: '#16A34A', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                            <CheckCircle2 size={11} color="#16A34A" />
                            <span>✓ Verified</span>
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              setIsPhoneVerified(false);
                              setVerificationToken('');
                              setVerifiedPhoneNumber('');
                              setOtpSent(false);
                              setOtpNotice('');
                            }}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: '#0284C7',
                              fontSize: '0.66rem',
                              fontWeight: 700,
                              cursor: 'pointer',
                              padding: 0,
                              textDecoration: 'underline'
                            }}
                          >
                            Change
                          </button>
                        </div>
                      ) : isFallbackMode ? (
                        <span style={{ fontSize: '0.66rem', color: '#D97706', fontWeight: 700 }}>
                          Callback Mode Active
                        </span>
                      ) : null}
                    </div>

                    <div className="booking-field-wrapper" style={{ gap: '0.35rem' }}>
                      <span className="booking-phone-prefix">+91</span>
                      <input
                        type="tel"
                        value={customerPhone}
                        onChange={handlePhoneChange}
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
                  </div>
                </div>

                {/* Inline OTP Verification Flow (Shown when OTP is dispatched) */}
                {otpSent && !isPhoneVerified && (
                  <div
                    id="inline-otp-section"
                    style={{
                      padding: '0.85rem 1rem',
                      background: '#F0FDF4',
                      border: '1.5px solid #86EFAC',
                      borderRadius: '10px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.55rem',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <CheckCircle2 size={15} color="#16A34A" style={{ flexShrink: 0 }} />
                      <span style={{ fontSize: '0.76rem', fontWeight: 700, color: '#15803D' }}>
                        OTP sent to WhatsApp (+91 {customerPhone}). Please enter it below:
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

                    <div style={{ display: 'flex', gap: '0.45rem', alignItems: 'center', flexWrap: 'wrap' }}>
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
                          minWidth: '120px',
                          height: '35px',
                          padding: '0 0.65rem',
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
                          height: '35px',
                          padding: '0 0.95rem',
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
                          height: '35px',
                          padding: '0 0.75rem',
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

                {/* Inline error if OTP send failed */}
                {otpError && !otpSent && !isPhoneVerified && (
                  <div
                    id="inline-otp-send-error"
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

                {/* ── Section 2: Journey Pickup & Destination ── */}
                {/* Pickup Address */}
                <div className="booking-input-group">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <label className="booking-form-label">
                      <MapPin size={12} color="#2563EB" style={{ display: 'inline', marginRight: '3px' }} />
                      Exact Pickup Address / Building / Landmark *
                    </label>
                    {!isPhoneVerified && !isFallbackMode && (
                      <span style={{ fontSize: '0.66rem', color: '#D97706', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                        <Lock size={11} />
                        <span>Verify Phone First</span>
                      </span>
                    )}
                    {!isPhoneVerified && isFallbackMode && (
                      <span style={{ fontSize: '0.66rem', color: '#0284C7', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                        <Unlock size={11} />
                        <span>Unlocked for Callback</span>
                      </span>
                    )}
                  </div>
                  <div className="booking-field-wrapper">
                    <div className="booking-dot-indicator pickup-dot" />
                    <input
                      type="text"
                      value={pickupAddress}
                      disabled={!isAddressUnlocked}
                      onChange={(e) => setPickupAddress(e.target.value)}
                      placeholder={isAddressUnlocked ? 'e.g. Flat 302, Rohan Viti, Wakad / Baner / Pune Airport' : '🔒 Verify mobile number above to enter exact pickup address'}
                      className="booking-form-control with-dot"
                      required
                    />
                  </div>
                </div>

                {/* Drop Address (Intercity or Local) */}
                {tripType !== 'LOCAL' ? (
                  <div className="booking-input-group">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <label className="booking-form-label">
                        <Navigation size={12} color="#10B981" style={{ display: 'inline', marginRight: '3px' }} />
                        Drop Location / Terminal / Hotel *
                      </label>
                      {!isPhoneVerified && !isFallbackMode && (
                        <span style={{ fontSize: '0.66rem', color: '#D97706', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                          <Lock size={11} />
                          <span>Verify Phone First</span>
                        </span>
                      )}
                      {!isPhoneVerified && isFallbackMode && (
                        <span style={{ fontSize: '0.66rem', color: '#0284C7', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                          <Unlock size={11} />
                          <span>Unlocked for Callback</span>
                        </span>
                      )}
                    </div>
                    <div className="booking-field-wrapper">
                      <div className="booking-dot-indicator drop-dot" />
                      <input
                        type="text"
                        value={dropAddress}
                        disabled={!isAddressUnlocked}
                        onChange={(e) => setDropAddress(e.target.value)}
                        placeholder={isAddressUnlocked ? 'e.g. T2 Mumbai International Airport / BKC / Bandra' : '🔒 Verify mobile number above to enter exact drop location'}
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
                      disabled={!isAddressUnlocked}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder={isAddressUnlocked ? 'e.g. City sightseeing, business meetings around FC Road' : '🔒 Verify mobile number above to type notes'}
                      className="booking-form-control"
                    />
                  </div>
                )}

                {/* ── Section 3: Optional Invoice Details ── */}
                <div className="booking-input-group">
                  <label className="booking-form-label">Email (Optional - For GST / Booking Invoice)</label>
                  <input
                    type="email"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    placeholder="e.g. name@example.com"
                    className="booking-form-control"
                  />
                </div>

                {/* ── Section 4: 24/7 WhatsApp Instant Assistance Strip ── */}
                <div
                  id="booking-otp-fallback-card"
                  style={{
                    padding: '0.75rem 1rem',
                    background: '#F0FDF4',
                    border: '1.5px solid #BBF7D0',
                    borderRadius: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '0.85rem',
                    flexWrap: 'wrap',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', minWidth: '220px', flex: '1' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#DCFCE7', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <MessageSquare size={16} color="#15803D" />
                    </div>
                    <div>
                      <div style={{ fontWeight: 800, fontSize: '0.8rem', color: '#14532D' }}>
                        Need help? Chat directly on WhatsApp
                      </div>
                      <div style={{ fontSize: '0.72rem', color: '#166534', marginTop: '0.1rem' }}>
                        Our 24/7 travel desk is available to confirm availability and answer any questions.
                      </div>
                    </div>
                  </div>

                  <a
                    id="btn-chat-whatsapp-direct"
                    href={whatsappDirectUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      height: '34px',
                      padding: '0 1rem',
                      background: '#15803D',
                      color: '#FFFFFF',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '0.74rem',
                      fontWeight: 800,
                      textDecoration: 'none',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.35rem',
                      transition: 'all 0.15s ease',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    <Phone size={13} />
                    <span>CHAT ON WHATSAPP</span>
                  </a>
                </div>

                {/* ── Section 5: Submit Action ── */}
                <button
                  type="submit"
                  disabled={recalculatingQuote || isSubmitting || (!selectedVehicle && !vehicleId) || !isPhoneVerified}
                  className="booking-confirm-btn"
                  style={(!selectedVehicle && !vehicleId) || !isPhoneVerified ? { opacity: 0.7, cursor: 'not-allowed' } : {}}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      <span>CONFIRMING YOUR BOOKING...</span>
                    </>
                  ) : !selectedVehicle && !vehicleId ? (
                    <>
                      <AlertCircle size={16} />
                      <span>SELECT CAB IN FARE CALCULATOR TO BOOK</span>
                    </>
                  ) : !isPhoneVerified ? (
                    <>
                      <Lock size={16} />
                      <span>VERIFY PHONE NUMBER VIA OTP TO CONFIRM BOOKING</span>
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
            <div className="booking-card-right reveal stagger-2">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.65rem' }}>
                <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Trip & Vehicle Summary
                </span>
                <span className="booking-fare-verified-badge">
                  ✓ Guaranteed Price
                </span>
              </div>

              {/* Vehicle Mini Card */}
              {recalculatingQuote ? (
                <div className="booking-vehicle-compact-card" aria-busy="true" aria-label="Calculating vehicle quote">
                  <div className="booking-skeleton-box" style={{ width: '70px', height: '52px', borderRadius: '8px', flexShrink: 0 }}></div>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div className="booking-skeleton-box" style={{ width: '70%', height: '16px', marginBottom: '6px' }}></div>
                    <div className="booking-skeleton-box" style={{ width: '45%', height: '12px' }}></div>
                  </div>
                </div>
              ) : selectedVehicle ? (
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
              ) : (
                <div style={{
                  padding: '0.85rem 1rem',
                  backgroundColor: '#FFFBEB',
                  border: '1.5px solid #FCD34D',
                  borderRadius: '10px',
                  marginBottom: '1rem',
                  display: 'flex',
                  gap: '0.65rem',
                  alignItems: 'flex-start'
                }}>
                  <AlertCircle size={18} color="#D97706" style={{ flexShrink: 0, marginTop: '2px' }} />
                  <div>
                    <div style={{ fontWeight: 800, fontSize: '0.82rem', color: '#92400E', marginBottom: '0.2rem' }}>
                      No Cab Category Selected
                    </div>
                    <p style={{ fontSize: '0.74rem', color: '#B45309', margin: '0 0 0.5rem 0', lineHeight: 1.4 }}>
                      Choose your corridor route and cab model in our Fare Calculator to lock in your guaranteed all-inclusive price.
                    </p>
                    <Link
                      to="/fare"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.3rem',
                        fontSize: '0.74rem',
                        fontWeight: 800,
                        color: '#1D4ED8',
                        textDecoration: 'none'
                      }}
                    >
                      <span>Open Fare Calculator</span>
                      <ArrowRight size={13} />
                    </Link>
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

              {/* Additional Charges (If Applicable) */}
              {(selectedVehicle?.fare?.extraKmRate > 0 || selectedVehicle?.fare?.extraHourRate > 0) && (
                <div style={{
                  marginTop: '0.85rem',
                  padding: '0.75rem 0.85rem',
                  background: '#F8FAFC',
                  border: '1px solid #E2E8F0',
                  borderRadius: '10px',
                  fontSize: '0.75rem',
                }}>
                  <div style={{ fontWeight: 800, color: '#0F172A', marginBottom: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <Info size={13} color="#0284C7" />
                    <span>Additional Charges (If Applicable)</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', color: '#475569' }}>
                    {selectedVehicle?.fare?.extraKmRate > 0 && (
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>Extra distance:</span>
                        <strong style={{ color: '#0F172A' }}>₹{selectedVehicle.fare.extraKmRate} per km</strong>
                      </div>
                    )}
                    {selectedVehicle?.fare?.extraHourRate > 0 && (
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>Extra hour / waiting:</span>
                        <strong style={{ color: '#0F172A' }}>₹{selectedVehicle.fare.extraHourRate} per hour</strong>
                      </div>
                    )}
                    {selectedVehicle?.fare?.includedKm > 0 && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748B' }}>
                        <span>Included distance:</span>
                        <span>{selectedVehicle.fare.includedKm} km</span>
                      </div>
                    )}
                  </div>
                  <div style={{ fontSize: '0.67rem', color: '#64748B', marginTop: '0.35rem', fontStyle: 'italic', lineHeight: 1.35 }}>
                    * Conditional charges — apply only when journey exceeds included distance or duration. Not added to booking total.
                  </div>
                </div>
              )}

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
