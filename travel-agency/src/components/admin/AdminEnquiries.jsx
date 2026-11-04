import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Calendar,
  Clock,
  User,
  Phone,
  MapPin,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Search,
  Loader2,
  FileText,
  MessageSquare,
  Eye,
  X,
  Car,
  Filter,
  Check,
  ChevronRight,
  Send,
  HelpCircle,
  DollarSign,
  ExternalLink,
  ShieldCheck,
  Sparkles,
  Copy,
  PhoneCall
} from 'lucide-react';
import { enquiryApi, quoteApi, fareApi, adminFareConfigApi } from '../../services/api';
import './admin.css';

const STATUS_CONFIG = {
  NEW: {
    label: 'New Request',
    badgeClass: 'limited',
    bg: '#FEF3C7',
    border: '#FDE68A',
    color: '#B45309',
    description: 'Awaiting initial contact / quotation'
  },
  CONTACTED: {
    label: 'Contacted',
    badgeClass: 'info',
    bg: '#E0F2FE',
    border: '#BAE6FD',
    color: '#0369A1',
    description: 'Customer contacted via Phone / WhatsApp'
  },
  RESOLVED: {
    label: 'Resolved',
    badgeClass: 'available',
    bg: '#DCFCE7',
    border: '#BBF7D0',
    color: '#15803D',
    description: 'Quote provided, booked or closed'
  }
};

export const AdminEnquiries = () => {
  const [enquiries, setEnquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL'); // 'ALL' | 'NEW' | 'CONTACTED' | 'RESOLVED'
  const [selectedEnquiry, setSelectedEnquiry] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);
  const [feedbackMsg, setFeedbackMsg] = useState(null);

  // Step 3 Quotation Workflow State
  const [selectedEnquiryQuotes, setSelectedEnquiryQuotes] = useState([]);
  const [loadingQuotes, setLoadingQuotes] = useState(false);
  const [isQuoteModalOpen, setIsQuoteModalOpen] = useState(false);
  const [submittingQuote, setSubmittingQuote] = useState(false);
  const [copiedQuoteId, setCopiedQuoteId] = useState(null);
  const [convertingBookingId, setConvertingBookingId] = useState(null);

  // Simple, professional, stable Enquiry ID formatter (e.g. ENQ-1005, ENQ-1004...)
  const getEnquiryDisplayId = useCallback((enq) => {
    if (!enq) return 'N/A';
    if (enq.enquiryNumber) return enq.enquiryNumber;
    if (enq.reference) return enq.reference;

    // Stable deterministic fallback based on chronological order in enquiries list
    if (enquiries && enquiries.length > 0) {
      const sorted = [...enquiries].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
      const idx = sorted.findIndex((item) => item.id === enq.id);
      if (idx !== -1) {
        return `ENQ-${1001 + idx}`;
      }
    }
    return `ENQ-${enq.id ? enq.id.slice(-4).toUpperCase() : '1001'}`;
  }, [enquiries]);
  const [autoPricingStatus, setAutoPricingStatus] = useState(null);
  const [configuredFares, setConfiguredFares] = useState([]);

  useEffect(() => {
    adminFareConfigApi.getAll()
      .then((res) => setConfiguredFares(res.data?.data || []))
      .catch((err) => console.warn('Could not load configured fares for auto-pricing:', err.message));
  }, []);

  const findMatchingFare = useCallback((pickup, drop, vehicleCat, tripType) => {
    if (!configuredFares || configuredFares.length === 0) return null;
    const pLower = (pickup || '').toLowerCase();
    const dLower = (drop || '').toLowerCase();

    // Direct match
    const match = configuredFares.find((f) => {
      const orig = (f.pickupCity || f.route?.pickupLocation?.name || '').toLowerCase();
      const dest = (f.dropCity || f.route?.dropLocation?.name || '').toLowerCase();
      const cat = (f.vehicleCategory || f.vehicle?.category || '').toUpperCase();
      const tType = (f.tripType || '').toUpperCase();

      const origMatch = orig && (pLower.includes(orig) || orig.includes(pLower));
      const destMatch = dest && (dLower.includes(dest) || dest.includes(dLower));
      const catMatch = !vehicleCat || cat === vehicleCat.toUpperCase();
      const typeMatch = !tripType || tType === tripType.toUpperCase();
      return origMatch && destMatch && catMatch && typeMatch;
    });
    if (match) return match;

    // Corridor match (e.g. Pune <-> Mumbai)
    const isPune = pLower.includes('pune') || dLower.includes('pune');
    const isMumbai = pLower.includes('mumbai') || dLower.includes('mumbai');
    if (isPune && isMumbai) {
      return configuredFares.find((f) => {
        const orig = (f.pickupCity || f.route?.pickupLocation?.name || '').toLowerCase();
        const dest = (f.dropCity || f.route?.dropLocation?.name || '').toLowerCase();
        const cat = (f.vehicleCategory || f.vehicle?.category || '').toUpperCase();
        const tType = (f.tripType || '').toUpperCase();
        const isCorridor = (orig.includes('pune') && dest.includes('mumbai')) || (orig.includes('mumbai') && dest.includes('pune'));
        const catMatch = !vehicleCat || cat === vehicleCat.toUpperCase();
        const typeMatch = !tripType || tType === tripType.toUpperCase();
        return isCorridor && catMatch && typeMatch;
      });
    }
    return null;
  }, [configuredFares]);

  const [quoteForm, setQuoteForm] = useState({
    vehicleCategory: 'SEDAN',
    vehicleName: 'Toyota Etios / Dzire (4+1)',
    tripType: 'ONE_WAY',
    baseFare: '',
    tollCharges: '',
    driverAllowance: '',
    parkingCharges: '',
    extraKmRate: '',
    extraHourRate: '',
    includedKm: '',
    validHours: 48,
    inclusions: 'Vehicle rental, fuel, experienced chauffeur, and highway tolls.',
    exclusions: 'Airport/station parking charges, extra hour/km over limit.',
    terms: 'Driver allowance included. Tolls paid as actuals or included as per quote.',
  });

  const loadQuotesForEnquiry = async (enquiryId) => {
    setLoadingQuotes(true);
    try {
      const res = await quoteApi.adminGetQuotes(enquiryId);
      setSelectedEnquiryQuotes(res.data?.data || []);
    } catch (err) {
      console.warn('Could not load quotes:', err.response?.data?.message || err.message);
      setSelectedEnquiryQuotes([]);
    } finally {
      setLoadingQuotes(false);
    }
  };

  useEffect(() => {
    if (selectedEnquiry) {
      loadQuotesForEnquiry(selectedEnquiry.id);
    } else {
      setSelectedEnquiryQuotes([]);
    }
  }, [selectedEnquiry]);

  const handleOpenQuoteModal = (enq) => {
    // Detect vehicle preference from enquiry if available
    let defaultCategory = 'SEDAN';
    let defaultVehicleName = 'Executive Sedan (Etios / Dzire 4+1)';
    const pref = (enq.vehicle || '').toLowerCase();
    if (pref.includes('innova') || pref.includes('crysta')) {
      defaultCategory = 'INNOVA_CRYSTA';
      defaultVehicleName = 'Toyota Innova Crysta (6+1)';
    } else if (pref.includes('ertiga') || pref.includes('suv')) {
      defaultCategory = 'SUV';
      defaultVehicleName = 'Maruti Ertiga / Carens (6+1)';
    } else if (pref.includes('tempo') || pref.includes('bus')) {
      defaultCategory = 'TEMPO_TRAVELLER';
      defaultVehicleName = 'Force Urbania / Tempo Traveller (13/17 Seater)';
    }

    const pLower = (enq?.pickup || '').toLowerCase();
    const dLower = (enq?.destination || '').toLowerCase();
    const isPuneMumbai = (pLower.includes('pune') && dLower.includes('mumbai')) || (pLower.includes('mumbai') && dLower.includes('pune'));
    const matchedInitFare = findMatchingFare(enq?.pickup, enq?.destination, defaultCategory, 'ONE_WAY');

    let initExtraKm = '';
    let initExtraHr = '';
    let initIncludedKm = '';

    if (matchedInitFare) {
      initExtraKm = matchedInitFare.perKmFare !== undefined && matchedInitFare.perKmFare !== null ? matchedInitFare.perKmFare.toString() : '14';
      initExtraHr = (matchedInitFare.fareWaiting?.perHourCharge || 150).toString();
      initIncludedKm = '';
    } else if (isPuneMumbai) {
      initExtraKm = '14';
      initExtraHr = '150';
      initIncludedKm = '';
    }

    setQuoteForm({
      vehicleCategory: defaultCategory,
      vehicleName: defaultVehicleName,
      tripType: 'ONE_WAY',
      baseFare: '',
      tollCharges: '',
      driverAllowance: '',
      parkingCharges: '',
      extraKmRate: initExtraKm,
      extraHourRate: initExtraHr,
      includedKm: initIncludedKm,
      validHours: 48,
      inclusions: 'Vehicle rental, fuel, experienced chauffeur, and highway tolls.',
      exclusions: 'Airport/station parking charges, extra hour/km over limit.',
      terms: 'Driver allowance included. Tolls paid as actuals or included as per quote.',
    });
    setAutoPricingStatus(null);
    setIsQuoteModalOpen(true);
  };

  const handleQuoteFormChange = (field, val) => {
    setQuoteForm((prev) => {
      const next = { ...prev, [field]: val };
      if (field === 'parkingCharges') {
        const parkingNum = parseFloat(val) || 0;
        if (parkingNum > 0) {
          // If parking is charged, it's an inclusion! Remove from exclusions
          next.exclusions = (next.exclusions || '')
            .replace(/airport\/station\s*parking\s*(charges)?/gi, '')
            .replace(/parking\s*charges/gi, '')
            .replace(/,\s*,/g, ',')
            .replace(/^\s*,\s*|\s*,\s*$/g, '')
            .trim();
          if (!next.exclusions) {
            next.exclusions = 'Extra kilometre/hour charges over package limit, night travel allowance (if applicable).';
          }
          if (!/parking/i.test(next.inclusions || '')) {
            next.inclusions = (next.inclusions || '').replace(/\.\s*$/, '') + ', and airport/station parking.';
          }
        } else {
          // No parking charged in breakdown -> parking is excluded
          if (!/parking/i.test(next.exclusions || '')) {
            next.exclusions = 'Airport/station parking charges, ' + (next.exclusions || '').replace(/^,\s*/, '');
          }
          next.inclusions = (next.inclusions || '')
            .replace(/,\s*and\s*airport\/station\s*parking\b/gi, '')
            .replace(/airport\/station\s*parking/gi, '')
            .replace(/,\s*,/g, ',')
            .replace(/^\s*,\s*|\s*,\s*$/g, '')
            .trim();
          if (next.inclusions && !next.inclusions.endsWith('.')) {
            next.inclusions += '.';
          }
        }
      }
      return next;
    });
  };

  // Auto route check helper
  const handleAutoCheckFare = async () => {
    if (!selectedEnquiry) return;
    setAutoPricingStatus({ type: 'loading', text: 'Checking configured corridor pricing...' });
    try {
      const pickupQuery = selectedEnquiry.pickup.toLowerCase();
      const dropQuery = selectedEnquiry.destination.toLowerCase();

      // Check standard corridors
      const isPune = pickupQuery.includes('pune') || dropQuery.includes('pune');
      const isMumbai = pickupQuery.includes('mumbai') || dropQuery.includes('mumbai');

      const matched = findMatchingFare(
        selectedEnquiry.pickup,
        selectedEnquiry.destination,
        quoteForm.vehicleCategory,
        quoteForm.tripType
      );

      if (matched) {
        const base = matched.baseFare || 2600;
        const toll = matched.tollCharges || 430;
        const perKm = matched.perKmFare !== undefined && matched.perKmFare !== null ? matched.perKmFare : (quoteForm.tripType === 'ROUND_TRIP' ? 13 : 14);
        const waiting = matched.fareWaiting?.perHourCharge || 150;
        const included = quoteForm.includedKm || '';

        setQuoteForm((prev) => ({
          ...prev,
          baseFare: base.toString(),
          tollCharges: toll.toString(),
          driverAllowance: '0',
          parkingCharges: '0',
          extraKmRate: perKm.toString(),
          extraHourRate: waiting.toString(),
          includedKm: included.toString(),
        }));

        setAutoPricingStatus({
          type: 'success',
          text: `Configured fare matched: ${matched.route?.pickupLocation?.name || 'Pune'} ↔ ${matched.route?.dropLocation?.name || 'Mumbai'}. Loaded base (₹${base}), toll (₹${toll}), extra km (₹${perKm}/km), and extra hour (₹${waiting}/hr).`,
        });
      } else if (isPune && isMumbai) {
        // Standard configured corridor fallback
        let suggestedBase = quoteForm.tripType === 'ROUND_TRIP' ? 4199 : 2600;
        let suggestedToll = quoteForm.tripType === 'ROUND_TRIP' ? 640 : 430;
        const extraKm = quoteForm.tripType === 'ROUND_TRIP' ? 13 : 14;
        const extraHr = 150;
        const inclKm = quoteForm.includedKm || '';

        if (quoteForm.vehicleCategory === 'INNOVA_CRYSTA') {
          suggestedBase = quoteForm.tripType === 'ROUND_TRIP' ? 8999 : 4899;
        } else if (quoteForm.vehicleCategory === 'SUV') {
          suggestedBase = quoteForm.tripType === 'ROUND_TRIP' ? 5999 : 3199;
        }

        setQuoteForm((prev) => ({
          ...prev,
          baseFare: suggestedBase.toString(),
          tollCharges: suggestedToll.toString(),
          driverAllowance: '0',
          parkingCharges: '0',
          extraKmRate: extraKm.toString(),
          extraHourRate: extraHr.toString(),
          includedKm: inclKm.toString(),
        }));

        setAutoPricingStatus({
          type: 'success',
          text: `Configured corridor matched: Pune ↔ Mumbai corridor. Loaded verified base rate, expressway toll, and conditional rates (₹${extraKm}/km, ₹${extraHr}/hr).`,
        });
      } else {
        setQuoteForm((prev) => ({
          ...prev,
          extraKmRate: '',
          extraHourRate: '',
          includedKm: '',
        }));
        setAutoPricingStatus({
          type: 'info',
          text: `Custom Route detected: "${selectedEnquiry.pickup}" to "${selectedEnquiry.destination}". Additional rates not configured; enter manual breakdown if applicable.`,
        });
      }
    } catch (e) {
      setAutoPricingStatus({
        type: 'info',
        text: 'Custom Route: Please review road distance and enter manual fare.',
      });
    }
  };

  const calculatePreviewTotal = () => {
    const base = parseFloat(quoteForm.baseFare) || 0;
    const toll = parseFloat(quoteForm.tollCharges) || 0;
    const driver = parseFloat(quoteForm.driverAllowance) || 0;
    const parking = parseFloat(quoteForm.parkingCharges) || 0;
    return (base + toll + driver + parking).toFixed(2);
  };

  const handleSubmitQuote = async (e) => {
    e.preventDefault();
    if (!selectedEnquiry) return;

    const base = parseFloat(quoteForm.baseFare);
    if (isNaN(base) || base <= 0) {
      setFeedbackMsg({ type: 'error', text: 'Base fare must be greater than zero.' });
      setTimeout(() => setFeedbackMsg(null), 4000);
      return;
    }

    setSubmittingQuote(true);
    try {
      const res = await quoteApi.adminPrepareQuote(selectedEnquiry.id, {
        vehicleCategory: quoteForm.vehicleCategory,
        vehicleName: quoteForm.vehicleName,
        tripType: quoteForm.tripType,
        baseFare: base,
        tollCharges: parseFloat(quoteForm.tollCharges) || 0,
        driverAllowance: parseFloat(quoteForm.driverAllowance) || 0,
        parkingCharges: parseFloat(quoteForm.parkingCharges) || 0,
        extraKmRate: quoteForm.extraKmRate ? parseFloat(quoteForm.extraKmRate) : undefined,
        extraHourRate: quoteForm.extraHourRate ? parseFloat(quoteForm.extraHourRate) : undefined,
        includedKm: quoteForm.includedKm ? parseFloat(quoteForm.includedKm) : undefined,
        validHours: quoteForm.validHours,
        inclusions: quoteForm.inclusions,
        exclusions: quoteForm.exclusions,
        terms: quoteForm.terms,
      });

      // Refresh quotes and enquiry status
      await loadQuotesForEnquiry(selectedEnquiry.id);
      setEnquiries((prev) =>
        prev.map((item) =>
          item.id === selectedEnquiry.id ? { ...item, status: 'CONTACTED', updatedAt: new Date().toISOString() } : item
        )
      );
      setSelectedEnquiry((prev) => ({ ...prev, status: 'CONTACTED' }));

      setIsQuoteModalOpen(false);
      setFeedbackMsg({
        type: 'success',
        text: `Quotation created successfully for ₹${calculatePreviewTotal()}. Click "Copy Link" to copy the customer quotation URL.`,
      });
      setTimeout(() => setFeedbackMsg(null), 5000);
    } catch (err) {
      console.error('Failed to create quote:', err);
      setFeedbackMsg({
        type: 'error',
        text: err.response?.data?.message || 'Failed to create quotation. Please check database connection.',
      });
      setTimeout(() => setFeedbackMsg(null), 6000);
    } finally {
      setSubmittingQuote(false);
    }
  };

  const handleCopyQuoteLink = async (quote) => {
    const fullUrl = `${window.location.origin}/quote/${quote.quoteToken}`;
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(fullUrl);
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = fullUrl;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
      setCopiedQuoteId(quote.id);
      setFeedbackMsg({
        type: 'success',
        text: `Quotation review link for #Q-${quote.id.slice(-6).toUpperCase()} copied to clipboard!`,
      });
      setTimeout(() => setCopiedQuoteId(null), 3000);
      setTimeout(() => setFeedbackMsg(null), 4000);
    } catch (err) {
      console.error('Failed to copy link:', err);
      setFeedbackMsg({
        type: 'info',
        text: `Link: ${fullUrl}`,
      });
      setTimeout(() => setFeedbackMsg(null), 8000);
    }
  };

  const handleConvertToBooking = async (enquiryId, quoteId) => {
    if (!window.confirm('Convert this ACCEPTED quotation into a confirmed booking? The payment status will be set to PAY TO DRIVER.')) {
      return;
    }

    setConvertingBookingId(quoteId);
    try {
      const res = await quoteApi.adminConvertToBooking(enquiryId, quoteId);
      const bookingData = res.data?.data;

      setFeedbackMsg({
        type: 'success',
        text: `Success! Booking #${bookingData?.id?.slice(-6).toUpperCase()} confirmed from accepted quote. Status: Pay to Driver on Arrival.`,
      });
      setTimeout(() => setFeedbackMsg(null), 6000);

      // Refresh quotes and status
      await loadQuotesForEnquiry(enquiryId);
      setEnquiries((prev) =>
        prev.map((item) =>
          item.id === enquiryId ? { ...item, status: 'RESOLVED', updatedAt: new Date().toISOString() } : item
        )
      );
      if (selectedEnquiry && selectedEnquiry.id === enquiryId) {
        setSelectedEnquiry((prev) => ({ ...prev, status: 'RESOLVED' }));
      }
    } catch (err) {
      console.error('Conversion failed:', err);
      setFeedbackMsg({
        type: 'error',
        text: err.response?.data?.message || 'Failed to convert quote to booking.',
      });
      setTimeout(() => setFeedbackMsg(null), 6000);
    } finally {
      setConvertingBookingId(null);
    }
  };

  const fetchEnquiries = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await enquiryApi.adminGetAll();
      setEnquiries(res.data?.data || []);
    } catch (err) {
      console.error('Failed to load enquiries:', err);
      setError(err.response?.data?.message || err.message || 'Failed to load enquiries from database.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEnquiries();
  }, []);

  const handleStatusChange = async (enquiryId, newStatus) => {
    if (!['NEW', 'CONTACTED', 'RESOLVED'].includes(newStatus)) return;
    setUpdatingId(enquiryId);
    try {
      await enquiryApi.adminUpdateStatus(enquiryId, newStatus);
      // Update local state
      setEnquiries((prev) =>
        prev.map((item) =>
          item.id === enquiryId ? { ...item, status: newStatus, updatedAt: new Date().toISOString() } : item
        )
      );
      if (selectedEnquiry && selectedEnquiry.id === enquiryId) {
        setSelectedEnquiry((prev) => ({ ...prev, status: newStatus, updatedAt: new Date().toISOString() }));
      }
      setFeedbackMsg({
        type: 'success',
        text: `Enquiry ${getEnquiryDisplayId(selectedEnquiry || { id: enquiryId })} marked as ${STATUS_CONFIG[newStatus]?.label || newStatus}.`
      });
      setTimeout(() => setFeedbackMsg(null), 4000);
    } catch (err) {
      console.error('Error updating status:', err);
      setFeedbackMsg({
        type: 'error',
        text: err.response?.data?.message || 'Failed to update enquiry status. Please try again.'
      });
      setTimeout(() => setFeedbackMsg(null), 5000);
    } finally {
      setUpdatingId(null);
    }
  };

  // Client-side filtering and search
  const filteredEnquiries = enquiries.filter((item) => {
    if (statusFilter !== 'ALL' && item.status !== statusFilter) {
      return false;
    }
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const displayId = getEnquiryDisplayId(item).toLowerCase();
    return (
      displayId.includes(q) ||
      displayId.replace('enq-', '').includes(q) ||
      item.name?.toLowerCase().includes(q) ||
      item.phone?.toLowerCase().includes(q) ||
      item.pickup?.toLowerCase().includes(q) ||
      item.destination?.toLowerCase().includes(q) ||
      item.vehicle?.toLowerCase().includes(q) ||
      item.id?.toLowerCase().includes(q) ||
      item.message?.toLowerCase().includes(q)
    );
  });

  const countNew = enquiries.filter((e) => e.status === 'NEW').length;
  const countContacted = enquiries.filter((e) => e.status === 'CONTACTED').length;
  const countResolved = enquiries.filter((e) => e.status === 'RESOLVED').length;

  return (
    <div>
      {/* Top Banner */}
      <div className="admin-card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1.5rem', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>
              Customer Trip Enquiries
            </h1>
            <span style={{
              padding: '0.2rem 0.65rem',
              borderRadius: '9999px',
              backgroundColor: '#E0F2FE',
              color: '#0369A1',
              fontSize: '0.75rem',
              fontWeight: 800
            }}>
              {enquiries.length} Total
            </span>
            {countNew > 0 && (
              <span style={{
                padding: '0.2rem 0.65rem',
                borderRadius: '9999px',
                backgroundColor: '#FEF3C7',
                color: '#B45309',
                fontSize: '0.75rem',
                fontWeight: 800
              }}>
                {countNew} Pending
              </span>
            )}
          </div>
          <p style={{ fontSize: '0.8rem', color: '#64748B', margin: '0.35rem 0 0 0' }}>
            Direct customer enquiries submitted via website quote requests and contact pages with verified mobile numbers.
          </p>
        </div>

        <button
          onClick={fetchEnquiries}
          disabled={loading}
          className="admin-btn-secondary"
          style={{ height: '42px', padding: '0 1rem' }}
        >
          <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Floating Feedback Alert */}
      {feedbackMsg && (
        <div style={{
          padding: '0.75rem 1rem',
          borderRadius: '10px',
          marginBottom: '1rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: feedbackMsg.type === 'success' ? '#DCFCE7' : '#FEE2E2',
          border: `1px solid ${feedbackMsg.type === 'success' ? '#86EFAC' : '#FCA5A5'}`,
          color: feedbackMsg.type === 'success' ? '#15803D' : '#991B1B',
          fontSize: '0.82rem',
          fontWeight: 600,
          boxShadow: '0 2px 6px rgba(0,0,0,0.05)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {feedbackMsg.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
            <span>{feedbackMsg.text}</span>
          </div>
          <button
            onClick={() => setFeedbackMsg(null)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', padding: 0 }}
          >
            <X size={15} />
          </button>
        </div>
      )}

      {/* Toolbar: Search & Status Filters */}
      <div className="admin-toolbar">
        <div className="admin-search-wrapper" style={{ width: '380px' }}>
          <Search size={16} className="admin-search-icon" />
          <input
            type="text"
            placeholder="Search name, phone, pickup, destination..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="admin-search-input"
          />
        </div>

        <div className="admin-filter-pills">
          <button
            onClick={() => setStatusFilter('ALL')}
            className={`admin-filter-btn ${statusFilter === 'ALL' ? 'active' : ''}`}
          >
            All ({enquiries.length})
          </button>
          <button
            onClick={() => setStatusFilter('NEW')}
            className={`admin-filter-btn ${statusFilter === 'NEW' ? 'active' : ''}`}
            style={{ color: statusFilter === 'NEW' ? '#B45309' : undefined }}
          >
            New ({countNew})
          </button>
          <button
            onClick={() => setStatusFilter('CONTACTED')}
            className={`admin-filter-btn ${statusFilter === 'CONTACTED' ? 'active' : ''}`}
            style={{ color: statusFilter === 'CONTACTED' ? '#0369A1' : undefined }}
          >
            Contacted ({countContacted})
          </button>
          <button
            onClick={() => setStatusFilter('RESOLVED')}
            className={`admin-filter-btn ${statusFilter === 'RESOLVED' ? 'active' : ''}`}
            style={{ color: statusFilter === 'RESOLVED' ? '#15803D' : undefined }}
          >
            Resolved ({countResolved})
          </button>
        </div>
      </div>

      {/* Main Table */}
      <div className="admin-table-container">
        {loading ? (
          <div style={{ padding: '4rem', textAlign: 'center', color: '#94A3B8' }}>
            <Loader2 size={30} className="animate-spin text-sky-500" style={{ margin: '0 auto 0.75rem auto' }} />
            <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>Loading enquiries from database...</div>
          </div>
        ) : error ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#E11D48' }}>
            <AlertCircle size={28} style={{ margin: '0 auto 0.5rem auto' }} />
            <div style={{ fontWeight: 700, marginBottom: '0.5rem' }}>{error}</div>
            <button
              onClick={fetchEnquiries}
              className="admin-btn-secondary"
              style={{ marginTop: '0.5rem', display: 'inline-flex' }}
            >
              Retry
            </button>
          </div>
        ) : filteredEnquiries.length === 0 ? (
          <div style={{ padding: '4rem 2rem', textAlign: 'center', color: '#64748B' }}>
            <FileText size={36} color="#CBD5E1" style={{ margin: '0 auto 0.75rem auto' }} />
            <div style={{ fontWeight: 800, fontSize: '1rem', color: '#0F172A', marginBottom: '0.35rem' }}>
              No Enquiries Found
            </div>
            <p style={{ fontSize: '0.8rem', color: '#94A3B8', maxWidth: '380px', margin: '0 auto' }}>
              {searchQuery || statusFilter !== 'ALL'
                ? 'No enquiries match your current search query or status filter.'
                : 'Customer enquiries submitted via the website quote modal or contact form will appear here.'}
            </p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="admin-table">
              <thead>
                <tr>
                  <th style={{ minWidth: '120px' }}>Enquiry ID & Date</th>
                  <th style={{ minWidth: '180px' }}>Customer</th>
                  <th style={{ minWidth: '220px' }}>Route (Pickup ➔ Drop)</th>
                  <th style={{ minWidth: '140px' }}>Travel Date</th>
                  <th style={{ minWidth: '150px' }}>Vehicle</th>
                  <th style={{ minWidth: '160px' }}>Status</th>
                  <th style={{ minWidth: '170px', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredEnquiries.map((enq) => {
                  const createdDate = new Date(enq.createdAt).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  });

                  const cleanPhone = enq.phone ? enq.phone.replace(/[^0-9]/g, '') : '';
                  const displayId = getEnquiryDisplayId(enq);
                  const isUpdatingThis = updatingId === enq.id;
                  const cfg = STATUS_CONFIG[enq.status] || STATUS_CONFIG.NEW;

                  const waText = encodeURIComponent(
                    `Hello ${enq.name || 'Sir/Madam'}, thank you for contacting AJ Travels Pune regarding your travel enquiry ${displayId} from ${enq.pickup || 'Pune'} to ${enq.destination || 'Mumbai'}. We are pleased to provide you with the best available fare quote.`
                  );

                  return (
                    <tr key={enq.id}>
                      {/* Enquiry ID & Received Timestamp */}
                      <td>
                        <div style={{ display: 'inline-flex', alignItems: 'center' }}>
                          <span style={{
                            fontWeight: 800,
                            color: '#0284C7',
                            fontSize: '0.82rem',
                            backgroundColor: '#EFF6FF',
                            border: '1px solid #BFDBFE',
                            padding: '0.2rem 0.55rem',
                            borderRadius: '6px',
                            letterSpacing: '0.04em',
                            fontFamily: "'Inter', sans-serif"
                          }}>
                            {displayId}
                          </span>
                        </div>
                        <div style={{ fontSize: '0.7rem', color: '#94A3B8', marginTop: '0.25rem' }}>
                          {createdDate}
                        </div>
                      </td>

                      {/* Customer Details */}
                      <td>
                        <div style={{ fontWeight: 700, color: '#0F172A', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                          <User size={13} color="#0284C7" />
                          <span>{enq.name || 'Guest User'}</span>
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#475569', display: 'flex', alignItems: 'center', gap: '0.35rem', marginTop: '0.15rem' }}>
                          <Phone size={13} color="#16A34A" />
                          <span>{enq.phone || 'N/A'}</span>
                        </div>
                        {enq.message && enq.message.includes('[WEB DIRECT REQUEST — UNVERIFIED PHONE]') && (
                          <div style={{ marginTop: '0.3rem' }}>
                            <span style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.25rem',
                              backgroundColor: '#FEF3C7',
                              color: '#B45309',
                              border: '1px solid #F59E0B',
                              borderRadius: '4px',
                              padding: '0.12rem 0.45rem',
                              fontSize: '0.64rem',
                              fontWeight: 800,
                              letterSpacing: '0.02em',
                              whiteSpace: 'nowrap'
                            }}>
                              <PhoneCall size={10} />
                              <span>UNVERIFIED PHONE — CALLBACK REQUIRED</span>
                            </span>
                          </div>
                        )}
                      </td>

                      {/* Route */}
                      <td>
                        <div style={{ fontWeight: 700, color: '#0F172A', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                          <MapPin size={13} color="#0284C7" />
                          <span>{enq.pickup} <span style={{ color: '#94A3B8' }}>➔</span> {enq.destination}</span>
                        </div>
                        {enq.message && (
                          <div style={{
                            fontSize: '0.72rem',
                            color: '#64748B',
                            marginTop: '0.2rem',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            maxWidth: '240px'
                          }}>
                            "{enq.message}"
                          </div>
                        )}
                      </td>

                      {/* Travel Date */}
                      <td>
                        <div style={{ fontSize: '0.78rem', color: '#334155', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                          <Calendar size={13} color="#94A3B8" />
                          <span>{enq.travelDate || 'Flexible / Not Specified'}</span>
                        </div>
                      </td>

                      {/* Preferred Vehicle */}
                      <td>
                        <div style={{ fontSize: '0.78rem', color: '#0F172A', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                          <Car size={13} color="#64748B" />
                          <span>{enq.vehicle || 'Any Available Cab'}</span>
                        </div>
                      </td>

                      {/* Interactive Status Selector */}
                      <td>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                          <select
                            value={enq.status}
                            disabled={isUpdatingThis}
                            onChange={(e) => handleStatusChange(enq.id, e.target.value)}
                            style={{
                              padding: '0.3rem 0.6rem',
                              borderRadius: '8px',
                              fontSize: '0.75rem',
                              fontWeight: 700,
                              border: `1.5px solid ${cfg.border}`,
                              backgroundColor: cfg.bg,
                              color: cfg.color,
                              cursor: isUpdatingThis ? 'wait' : 'pointer',
                              outline: 'none',
                              transition: 'all 0.2s'
                            }}
                          >
                            <option value="NEW">New Request</option>
                            <option value="CONTACTED">Contacted</option>
                            <option value="RESOLVED">Resolved</option>
                          </select>
                          {isUpdatingThis && <Loader2 size={13} className="animate-spin text-sky-500" />}
                        </div>
                      </td>

                      {/* Quick Contact & Details Actions */}
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                          {cleanPhone && (
                            <>
                              <a
                                href={`https://wa.me/91${cleanPhone}?text=${waText}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                title="Reply via WhatsApp"
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  width: '32px',
                                  height: '32px',
                                  borderRadius: '8px',
                                  backgroundColor: '#DCFCE7',
                                  color: '#15803D',
                                  textDecoration: 'none'
                                }}
                              >
                                <MessageSquare size={14} />
                              </a>

                              <a
                                href={`tel:${cleanPhone}`}
                                title="Call Customer"
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  width: '32px',
                                  height: '32px',
                                  borderRadius: '8px',
                                  backgroundColor: '#E0F2FE',
                                  color: '#0369A1',
                                  textDecoration: 'none'
                                }}
                              >
                                <Phone size={14} />
                              </a>
                            </>
                          )}

                          <button
                            onClick={() => setSelectedEnquiry(enq)}
                            title="View Full Details"
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              width: '32px',
                              height: '32px',
                              borderRadius: '8px',
                              backgroundColor: '#F1F5F9',
                              border: '1px solid #E2E8F0',
                              color: '#334155',
                              cursor: 'pointer'
                            }}
                          >
                            <Eye size={14} />
                          </button>
                        </div>
                      </td>

                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Enquiry Detail Modal */}
      {selectedEnquiry && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(4px)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem'
          }}
          onClick={() => setSelectedEnquiry(null)}
        >
          <div
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '16px',
              maxWidth: '560px',
              width: '100%',
              padding: '1.75rem',
              boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
              position: 'relative',
              maxHeight: '90vh',
              overflowY: 'auto'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Close Button */}
            <button
              onClick={() => setSelectedEnquiry(null)}
              style={{
                position: 'absolute',
                top: '1.25rem',
                right: '1.25rem',
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                border: '1px solid #E2E8F0',
                background: '#F8FAFC',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: '#64748B'
              }}
            >
              <X size={16} />
            </button>

            {/* Modal Header */}
            <div style={{ marginBottom: '1.25rem', paddingRight: '2.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                <span style={{
                  fontWeight: 800,
                  color: '#0284C7',
                  fontSize: '0.85rem',
                  backgroundColor: '#EFF6FF',
                  border: '1px solid #BFDBFE',
                  padding: '0.2rem 0.55rem',
                  borderRadius: '6px',
                  letterSpacing: '0.04em',
                  fontFamily: "'Inter', sans-serif"
                }}>
                  {getEnquiryDisplayId(selectedEnquiry)}
                </span>
                {selectedEnquiry.createdAt && (
                  <span style={{ fontSize: '0.72rem', color: '#94A3B8', fontWeight: 600 }}>
                    Received: {new Date(selectedEnquiry.createdAt).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                )}
              </div>
              <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#0F172A', margin: '0.2rem 0 0 0' }}>
                {selectedEnquiry.name || 'Trip Enquiry'}
              </h2>
            </div>

            {/* Unverified Callback Alert Banner */}
            {selectedEnquiry.message && selectedEnquiry.message.includes('[WEB DIRECT REQUEST — UNVERIFIED PHONE]') && (
              <div style={{
                background: '#FEF3C7',
                border: '1.5px solid #F59E0B',
                borderRadius: '10px',
                padding: '0.75rem 1rem',
                marginBottom: '1.2rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.6rem'
              }}>
                <PhoneCall size={18} color="#B45309" style={{ flexShrink: 0 }} />
                <div>
                  <strong style={{ fontSize: '0.82rem', color: '#92400E', display: 'block' }}>
                    UNVERIFIED PHONE — CALLBACK REQUIRED
                  </strong>
                  <span style={{ fontSize: '0.73rem', color: '#B45309', display: 'block', marginTop: '0.1rem', lineHeight: 1.35 }}>
                    Customer submitted this trip request via the Web Direct Callback option without WhatsApp OTP verification. Dispatcher must call the customer to confirm availability, vehicle class, and pickup address before booking.
                  </span>
                </div>
              </div>
            )}

            {/* Journey Card */}
            <div style={{
              background: '#F8FAFC',
              borderRadius: '12px',
              padding: '1rem',
              border: '1px solid #E2E8F0',
              marginBottom: '1.25rem'
            }}>
              <div style={{ fontSize: '0.7rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                Requested Route
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <MapPin size={16} color="#16A34A" />
                  <div>
                    <span style={{ fontSize: '0.7rem', color: '#94A3B8', display: 'block' }}>Pickup Point</span>
                    <strong style={{ fontSize: '0.9rem', color: '#0F172A' }}>{selectedEnquiry.pickup}</strong>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <MapPin size={16} color="#0284C7" />
                  <div>
                    <span style={{ fontSize: '0.7rem', color: '#94A3B8', display: 'block' }}>Destination Point</span>
                    <strong style={{ fontSize: '0.9rem', color: '#0F172A' }}>{selectedEnquiry.destination}</strong>
                  </div>
                </div>
              </div>
            </div>

            {/* Grid of Key Properties */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem', marginBottom: '1.25rem' }}>
              <div style={{ padding: '0.75rem', borderRadius: '10px', background: '#F8FAFC', border: '1px solid #E2E8F0' }}>
                <span style={{ fontSize: '0.7rem', color: '#64748B', display: 'block', fontWeight: 700 }}>Customer Name</span>
                <strong style={{ fontSize: '0.88rem', color: '#0F172A', marginTop: '0.15rem', display: 'block' }}>
                  {selectedEnquiry.name || 'Guest'}
                </strong>
              </div>

              <div style={{ padding: '0.75rem', borderRadius: '10px', background: '#F8FAFC', border: '1px solid #E2E8F0' }}>
                <span style={{ fontSize: '0.7rem', color: '#64748B', display: 'block', fontWeight: 700 }}>Mobile Number</span>
                <strong style={{ fontSize: '0.88rem', color: '#0F172A', marginTop: '0.15rem', display: 'block' }}>
                  {selectedEnquiry.phone || 'N/A'}
                </strong>
              </div>

              <div style={{ padding: '0.75rem', borderRadius: '10px', background: '#F8FAFC', border: '1px solid #E2E8F0' }}>
                <span style={{ fontSize: '0.7rem', color: '#64748B', display: 'block', fontWeight: 700 }}>Travel Date</span>
                <strong style={{ fontSize: '0.88rem', color: '#0F172A', marginTop: '0.15rem', display: 'block' }}>
                  {selectedEnquiry.travelDate || 'Flexible'}
                </strong>
              </div>

              <div style={{ padding: '0.75rem', borderRadius: '10px', background: '#F8FAFC', border: '1px solid #E2E8F0' }}>
                <span style={{ fontSize: '0.7rem', color: '#64748B', display: 'block', fontWeight: 700 }}>Vehicle Preference</span>
                <strong style={{ fontSize: '0.88rem', color: '#0F172A', marginTop: '0.15rem', display: 'block' }}>
                  {selectedEnquiry.vehicle || 'Any Executive Cab'}
                </strong>
              </div>
            </div>

            {/* Customer Message / Notes */}
            {selectedEnquiry.message && (
              <div style={{
                background: '#FFFBEB',
                border: '1px solid #FDE68A',
                borderRadius: '10px',
                padding: '0.85rem 1rem',
                marginBottom: '1.25rem'
              }}>
                <span style={{ fontSize: '0.7rem', color: '#B45309', fontWeight: 800, textTransform: 'uppercase', display: 'block', marginBottom: '0.25rem' }}>
                  Customer Message / Special Requirements
                </span>
                <p style={{ margin: 0, fontSize: '0.82rem', color: '#78350F', lineHeight: 1.5, whiteSpace: 'pre-line' }}>
                  {selectedEnquiry.message}
                </p>
              </div>
            )}

            {/* Status Management */}
            <div style={{
              padding: '1rem',
              borderRadius: '12px',
              background: '#F1F5F9',
              marginBottom: '1.25rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '1rem',
              flexWrap: 'wrap'
            }}>
              <div>
                <span style={{ fontSize: '0.72rem', color: '#475569', fontWeight: 700, display: 'block' }}>
                  Update Enquiry Status
                </span>
                <span style={{ fontSize: '0.68rem', color: '#64748B' }}>
                  Current: <strong>{STATUS_CONFIG[selectedEnquiry.status]?.label || selectedEnquiry.status}</strong>
                </span>
              </div>

              <div style={{ display: 'flex', gap: '0.4rem' }}>
                {['NEW', 'CONTACTED', 'RESOLVED'].map((st) => (
                  <button
                    key={st}
                    disabled={updatingId === selectedEnquiry.id}
                    onClick={() => handleStatusChange(selectedEnquiry.id, st)}
                    style={{
                      padding: '0.4rem 0.75rem',
                      borderRadius: '8px',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      border: selectedEnquiry.status === st ? '1.5px solid #0284C7' : '1px solid #CBD5E1',
                      background: selectedEnquiry.status === st ? '#E0F2FE' : '#FFFFFF',
                      color: selectedEnquiry.status === st ? '#0369A1' : '#475569',
                      transition: 'all 0.2s'
                    }}
                  >
                    {st === 'NEW' ? 'New' : st === 'CONTACTED' ? 'Contacted' : 'Resolved'}
                  </button>
                ))}
              </div>
            </div>

            {/* Timestamps */}
            <div style={{ fontSize: '0.7rem', color: '#94A3B8', marginBottom: '1.25rem' }}>
              <div>Received: {new Date(selectedEnquiry.createdAt).toLocaleString('en-IN')}</div>
              <div>Last Updated: {new Date(selectedEnquiry.updatedAt).toLocaleString('en-IN')}</div>
            </div>

            {/* Quotations & Controlled Booking Conversion Section */}
            <div style={{
              background: '#FFFFFF',
              border: '1.5px solid #E2E8F0',
              borderRadius: '14px',
              padding: '1.25rem',
              marginBottom: '1.25rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <DollarSign size={16} color="#0284C7" />
                  <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#0F172A', textTransform: 'uppercase' }}>
                    Quotations & Booking Conversion
                  </span>
                </div>
                <button
                  onClick={() => handleOpenQuoteModal(selectedEnquiry)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    padding: '0.35rem 0.75rem',
                    borderRadius: '8px',
                    backgroundColor: '#0284C7',
                    color: '#FFFFFF',
                    border: 'none',
                    fontSize: '0.74rem',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  <Sparkles size={13} />
                  <span>Prepare Quotation</span>
                </button>
              </div>

              {loadingQuotes ? (
                <div style={{ textAlign: 'center', padding: '1rem', color: '#94A3B8' }}>
                  <Loader2 size={18} className="animate-spin text-sky-500" style={{ margin: '0 auto 0.3rem auto' }} />
                  <span style={{ fontSize: '0.75rem' }}>Checking quotation records...</span>
                </div>
              ) : selectedEnquiryQuotes.length === 0 ? (
                <div style={{
                  padding: '1rem',
                  borderRadius: '10px',
                  backgroundColor: '#F8FAFC',
                  border: '1px dashed #CBD5E1',
                  textAlign: 'center',
                  fontSize: '0.8rem',
                  color: '#64748B'
                }}>
                  No formal quotation has been issued yet for this enquiry.
                  <div style={{ marginTop: '0.35rem' }}>
                    Click <strong>"Prepare Quotation"</strong> above to calculate and dispatch a quote.
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {selectedEnquiryQuotes.map((q) => {
                    const isAccepted = q.status === 'ACCEPTED';
                    const isBooked = Boolean(q.bookingId);
                    const isExpired = new Date() > new Date(q.validUntil) || q.status === 'EXPIRED';

                    return (
                      <div
                        key={q.id}
                        style={{
                          borderRadius: '10px',
                          border: isAccepted ? '1.5px solid #86EFAC' : '1px solid #E2E8F0',
                          backgroundColor: isAccepted ? '#F0FDF4' : '#F8FAFC',
                          padding: '0.85rem 1rem'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.5rem' }}>
                          <div>
                            <span style={{ fontFamily: 'monospace', fontWeight: 800, fontSize: '0.82rem', color: '#0F172A' }}>
                              #Q-{q.id.slice(-6).toUpperCase()}
                            </span>
                            <span style={{ fontSize: '0.72rem', color: '#64748B', marginLeft: '0.5rem' }}>
                              {q.vehicleName || q.vehicleCategory} ({q.tripType})
                            </span>
                          </div>

                          {/* Quote Status Badge */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            {isBooked ? (
                              <span style={{
                                padding: '0.2rem 0.5rem',
                                borderRadius: '6px',
                                backgroundColor: '#DCFCE7',
                                color: '#15803D',
                                fontSize: '0.72rem',
                                fontWeight: 800
                              }}>
                                Booking Created: #{q.bookingId.slice(-6).toUpperCase()}
                              </span>
                            ) : isAccepted ? (
                              <span style={{
                                padding: '0.2rem 0.5rem',
                                borderRadius: '6px',
                                backgroundColor: '#DCFCE7',
                                color: '#15803D',
                                fontSize: '0.72rem',
                                fontWeight: 800,
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.25rem'
                              }}>
                                <Check size={12} />
                                <span>Accepted by Customer</span>
                              </span>
                            ) : q.status === 'DECLINED' ? (
                              <span style={{
                                padding: '0.2rem 0.5rem',
                                borderRadius: '6px',
                                backgroundColor: '#F1F5F9',
                                color: '#64748B',
                                fontSize: '0.72rem',
                                fontWeight: 800
                              }}>
                                Declined
                              </span>
                            ) : q.status === 'SUPERSEDED' ? (
                              <span style={{
                                padding: '0.2rem 0.5rem',
                                borderRadius: '6px',
                                backgroundColor: '#F1F5F9',
                                color: '#64748B',
                                fontSize: '0.72rem',
                                fontWeight: 800
                              }}>
                                Superseded
                              </span>
                            ) : isExpired ? (
                              <span style={{
                                padding: '0.2rem 0.5rem',
                                borderRadius: '6px',
                                backgroundColor: '#FEE2E2',
                                color: '#991B1B',
                                fontSize: '0.72rem',
                                fontWeight: 800
                              }}>
                                Expired
                              </span>
                            ) : (
                              <span style={{
                                padding: '0.2rem 0.5rem',
                                borderRadius: '6px',
                                backgroundColor: '#FEF3C7',
                                color: '#B45309',
                                fontSize: '0.72rem',
                                fontWeight: 800
                              }}>
                                Quoted • Awaiting Response
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Fare Breakdown Snippet */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.78rem', color: '#475569', marginBottom: '0.45rem' }}>
                          <span>Base: ₹{q.baseFare} + Tolls: ₹{q.tollCharges} + Driver: ₹{q.driverAllowance}</span>
                          <strong style={{ fontSize: '0.95rem', color: '#0F172A' }}>
                            Total: ₹{parseFloat(q.totalFare).toFixed(2)}
                          </strong>
                        </div>

                        {/* Additional Charges Indicator */}
                        {q.additionalCharges?.isConfigured && (
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            fontSize: '0.72rem',
                            color: '#0369A1',
                            background: '#F0F9FF',
                            border: '1px solid #BAE6FD',
                            padding: '0.3rem 0.55rem',
                            borderRadius: '6px',
                            marginBottom: '0.65rem'
                          }}>
                            <span>Extra Km: <strong>₹{q.additionalCharges.extraKmRate}/km</strong></span>
                            <span>Extra Hour: <strong>₹{q.additionalCharges.extraHourRate}/hr</strong></span>
                            {Boolean(q.additionalCharges.includedKm && Number(q.additionalCharges.includedKm) > 0) && (<span>Included: <strong>{q.additionalCharges.includedKm} km</strong></span>)}
                          </div>
                        )}

                        {/* Customer Quote Link */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem', borderTop: '1px dashed #CBD5E1', paddingTop: '0.5rem' }}>
                          <a
                            href={`/quote/${q.quoteToken}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              fontSize: '0.72rem',
                              color: '#0284C7',
                              fontWeight: 700,
                              textDecoration: 'none',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.25rem'
                            }}
                          >
                            <span>Customer Review Link</span>
                            <ExternalLink size={12} />
                          </a>

                          <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                            {/* Copy Quotation Link Action */}
                            <button
                              type="button"
                              onClick={() => handleCopyQuoteLink(q)}
                              style={{
                                padding: '0.3rem 0.65rem',
                                borderRadius: '6px',
                                backgroundColor: copiedQuoteId === q.id ? '#DCFCE7' : '#EFF6FF',
                                color: copiedQuoteId === q.id ? '#15803D' : '#1D4ED8',
                                border: `1px solid ${copiedQuoteId === q.id ? '#BBF7D0' : '#BFDBFE'}`,
                                fontSize: '0.72rem',
                                fontWeight: 700,
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.3rem'
                              }}
                              title="Copy secure quotation review URL to clipboard"
                            >
                              {copiedQuoteId === q.id ? <Check size={12} /> : <Copy size={12} />}
                              <span>{copiedQuoteId === q.id ? 'Link Copied!' : 'Copy Link'}</span>
                            </button>

                            {/* Convert to Booking Button (Strictly when ACCEPTED and NOT yet booked) */}
                            {isAccepted && !isBooked && (
                              <button
                                disabled={convertingBookingId === q.id}
                                onClick={() => handleConvertToBooking(selectedEnquiry.id, q.id)}
                                style={{
                                  padding: '0.35rem 0.75rem',
                                  borderRadius: '6px',
                                  backgroundColor: '#16A34A',
                                  color: '#FFFFFF',
                                  border: 'none',
                                  fontSize: '0.74rem',
                                  fontWeight: 800,
                                  cursor: 'pointer',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '0.35rem',
                                  boxShadow: '0 2px 6px rgba(22, 163, 74, 0.3)'
                                }}
                              >
                                {convertingBookingId === q.id ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle size={12} />}
                                <span>Convert to Confirmed Booking</span>
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Quick Action Buttons */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <a
                href={`https://wa.me/91${selectedEnquiry.phone?.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
                  `Hello ${selectedEnquiry.name || 'Sir/Madam'}, thank you for contacting AJ Travels Pune regarding your travel enquiry ${getEnquiryDisplayId(selectedEnquiry)} from ${selectedEnquiry.pickup} to ${selectedEnquiry.destination}. We are pleased to provide you with the best available fare quote.`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.4rem',
                  padding: '0.65rem 1rem',
                  borderRadius: '10px',
                  backgroundColor: '#25D366',
                  color: '#FFFFFF',
                  fontWeight: 700,
                  fontSize: '0.82rem',
                  textDecoration: 'none'
                }}
              >
                <MessageSquare size={16} />
                <span>WhatsApp Customer</span>
              </a>

              <a
                href={`tel:${selectedEnquiry.phone}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.4rem',
                  padding: '0.65rem 1rem',
                  borderRadius: '10px',
                  backgroundColor: '#0284C7',
                  color: '#FFFFFF',
                  fontWeight: 700,
                  fontSize: '0.82rem',
                  textDecoration: 'none'
                }}
              >
                <Phone size={16} />
                <span>Call Customer</span>
              </a>
            </div>

          </div>
        </div>
      )}

      {/* Prepare Formal Quotation Modal */}
      {isQuoteModalOpen && selectedEnquiry && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
            zIndex: 10000,
          }}
          onClick={() => setIsQuoteModalOpen(false)}
        >
          <div
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '16px',
              maxWidth: '560px',
              width: '100%',
              padding: '1.75rem',
              boxShadow: '0 20px 40px rgba(0,0,0,0.25)',
              position: 'relative',
              maxHeight: '92vh',
              overflowY: 'auto'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Close Button */}
            <button
              onClick={() => setIsQuoteModalOpen(false)}
              style={{
                position: 'absolute',
                top: '1.25rem',
                right: '1.25rem',
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                border: '1px solid #E2E8F0',
                background: '#F8FAFC',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: '#64748B'
              }}
            >
              <X size={16} />
            </button>

            {/* Header */}
            <div style={{ marginBottom: '1.25rem', paddingRight: '2rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                <span style={{
                  fontWeight: 800,
                  color: '#0284C7',
                  fontSize: '0.82rem',
                  backgroundColor: '#EFF6FF',
                  border: '1px solid #BFDBFE',
                  padding: '0.15rem 0.5rem',
                  borderRadius: '6px',
                  letterSpacing: '0.04em',
                  fontFamily: "'Inter', sans-serif"
                }}>
                  {getEnquiryDisplayId(selectedEnquiry)}
                </span>
                <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#0284C7', textTransform: 'uppercase' }}>
                  Quotation Builder
                </span>
              </div>
              <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#0F172A', margin: '0.2rem 0 0 0' }}>
                Prepare Fare Quote for {selectedEnquiry.name}
              </h2>
              <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '0.25rem' }}>
                Route: <strong>{selectedEnquiry.pickup}</strong> ➔ <strong>{selectedEnquiry.destination}</strong>
              </div>
            </div>

            {/* Auto Corridor Rate Helper Button */}
            <div style={{
              background: '#F0F9FF',
              border: '1px solid #BAE6FD',
              borderRadius: '10px',
              padding: '0.75rem 1rem',
              marginBottom: '1.25rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '0.75rem',
              flexWrap: 'wrap'
            }}>
              <div>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#0369A1' }}>
                  Route Pricing Check
                </div>
                <div style={{ fontSize: '0.7rem', color: '#0284C7' }}>
                  Auto-detect configured rates or enter custom outstation fare
                </div>
              </div>
              <button
                type="button"
                onClick={handleAutoCheckFare}
                style={{
                  padding: '0.35rem 0.75rem',
                  borderRadius: '6px',
                  backgroundColor: '#0284C7',
                  color: '#FFFFFF',
                  border: 'none',
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.3rem'
                }}
              >
                <Sparkles size={12} />
                <span>Check Corridor Rate</span>
              </button>
            </div>

            {autoPricingStatus && (
              <div style={{
                fontSize: '0.75rem',
                fontWeight: 600,
                padding: '0.5rem 0.75rem',
                borderRadius: '8px',
                marginBottom: '1rem',
                backgroundColor: autoPricingStatus.type === 'success' ? '#DCFCE7' : '#EFF6FF',
                color: autoPricingStatus.type === 'success' ? '#15803D' : '#1D4ED8',
                border: `1px solid ${autoPricingStatus.type === 'success' ? '#BBF7D0' : '#BFDBFE'}`,
              }}>
                {autoPricingStatus.text}
              </div>
            )}

            <form onSubmit={handleSubmitQuote}>
              {/* Vehicle & Trip Selection */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
                <div>
                  <label style={{ fontSize: '0.72rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '0.25rem' }}>
                    Vehicle Category *
                  </label>
                  <select
                    value={quoteForm.vehicleCategory}
                    onChange={(e) => {
                      const cat = e.target.value;
                      let vName = 'Executive Sedan (Etios / Dzire)';
                      if (cat === 'INNOVA_CRYSTA') vName = 'Toyota Innova Crysta (6+1)';
                      if (cat === 'SUV') vName = 'Maruti Ertiga / Carens (6+1)';
                      if (cat === 'TEMPO_TRAVELLER') vName = 'Force Urbania / Tempo (13/17 Seater)';
                      setQuoteForm((prev) => ({ ...prev, vehicleCategory: cat, vehicleName: vName }));
                    }}
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      borderRadius: '8px',
                      border: '1px solid #CBD5E1',
                      fontSize: '0.8rem',
                      outline: 'none',
                    }}
                  >
                    <option value="SEDAN">Sedan (Dzire / Etios 4+1)</option>
                    <option value="SUV">SUV (Ertiga / Carens 6+1)</option>
                    <option value="INNOVA_CRYSTA">Toyota Innova Crysta (6+1)</option>
                    <option value="TEMPO_TRAVELLER">Tempo Traveller (13/17)</option>
                    <option value="OTHER">Other Custom Vehicle</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '0.72rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '0.25rem' }}>
                    Trip Type *
                  </label>
                  <select
                    value={quoteForm.tripType}
                    onChange={(e) => handleQuoteFormChange('tripType', e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      borderRadius: '8px',
                      border: '1px solid #CBD5E1',
                      fontSize: '0.8rem',
                      outline: 'none',
                    }}
                  >
                    <option value="ONE_WAY">One-Way Intercity</option>
                    <option value="ROUND_TRIP">Round-Trip Outstation</option>
                    <option value="LOCAL">Local Rental Package</option>
                  </select>
                </div>
              </div>

              {/* Vehicle Display Name */}
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ fontSize: '0.72rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '0.25rem' }}>
                  Vehicle Display Name (Customer-facing)
                </label>
                <input
                  type="text"
                  value={quoteForm.vehicleName}
                  onChange={(e) => handleQuoteFormChange('vehicleName', e.target.value)}
                  placeholder="e.g. Toyota Innova Crysta (6+1 AC)"
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    borderRadius: '8px',
                    border: '1px solid #CBD5E1',
                    fontSize: '0.82rem',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              {/* Itemized Fare Inputs */}
              <div style={{
                background: '#F8FAFC',
                borderRadius: '10px',
                padding: '0.85rem',
                border: '1px solid #E2E8F0',
                marginBottom: '1rem'
              }}>
                <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#0F172A', textTransform: 'uppercase', marginBottom: '0.65rem' }}>
                  Itemized Fare Details (₹)
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.65rem' }}>
                  <div>
                    <label style={{ fontSize: '0.7rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '0.2rem' }}>
                      Base Vehicle Fare *
                    </label>
                    <input
                      type="number"
                      required
                      min="1"
                      placeholder="e.g. 2600"
                      value={quoteForm.baseFare}
                      onChange={(e) => handleQuoteFormChange('baseFare', e.target.value)}
                      style={{
                        width: '100%',
                        padding: '0.45rem',
                        borderRadius: '6px',
                        border: '1px solid #CBD5E1',
                        fontSize: '0.82rem',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '0.7rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '0.2rem' }}>
                      Highway Tolls & Taxes
                    </label>
                    <input
                      type="number"
                      min="0"
                      placeholder="e.g. 430"
                      value={quoteForm.tollCharges}
                      onChange={(e) => handleQuoteFormChange('tollCharges', e.target.value)}
                      style={{
                        width: '100%',
                        padding: '0.45rem',
                        borderRadius: '6px',
                        border: '1px solid #CBD5E1',
                        fontSize: '0.82rem',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>
                </div>

                <div style={{ marginTop: '0.65rem' }}>
                  <label style={{ fontSize: '0.7rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '0.2rem' }}>
                    Parking Charges (Airport / Station — Optional)
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="e.g. 0 (leave 0 if not applicable)"
                    value={quoteForm.parkingCharges}
                    onChange={(e) => handleQuoteFormChange('parkingCharges', e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.45rem',
                      borderRadius: '6px',
                      border: '1px solid #CBD5E1',
                      fontSize: '0.82rem',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                {/* Total Calculated Fare Banner */}
                <div style={{
                  marginTop: '0.75rem',
                  paddingTop: '0.65rem',
                  borderTop: '1px dashed #CBD5E1',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#0F172A' }}>
                    Total Quoted Fare (Payable on Arrival):
                  </span>
                  <span style={{ fontSize: '1.25rem', fontWeight: 900, color: '#16A34A' }}>
                    ₹{calculatePreviewTotal()}
                  </span>
                </div>
              </div>

              {/* Optional: Extra Distance / Waiting Rates (Collapsible to keep form compact) */}
              <details style={{
                background: '#F8FAFC',
                borderRadius: '8px',
                padding: '0.55rem 0.85rem',
                border: '1px solid #E2E8F0',
                marginBottom: '1rem'
              }}>
                <summary style={{ fontSize: '0.72rem', fontWeight: 700, color: '#475569', cursor: 'pointer', userSelect: 'none' }}>
                  + Extra Distance & Waiting Hourly Rates (Optional)
                </summary>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.65rem', marginTop: '0.65rem' }}>
                  <div>
                    <label style={{ fontSize: '0.68rem', fontWeight: 600, color: '#64748B', display: 'block', marginBottom: '0.2rem' }}>
                      Extra Km Rate (₹/km)
                    </label>
                    <input
                      type="number"
                      min="0"
                      placeholder="e.g. 14"
                      value={quoteForm.extraKmRate}
                      onChange={(e) => handleQuoteFormChange('extraKmRate', e.target.value)}
                      style={{
                        width: '100%',
                        padding: '0.4rem',
                        borderRadius: '6px',
                        border: '1px solid #CBD5E1',
                        fontSize: '0.8rem',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '0.68rem', fontWeight: 600, color: '#64748B', display: 'block', marginBottom: '0.2rem' }}>
                      Extra Hour Rate (₹/hr)
                    </label>
                    <input
                      type="number"
                      min="0"
                      placeholder="e.g. 100"
                      value={quoteForm.extraHourRate}
                      onChange={(e) => handleQuoteFormChange('extraHourRate', e.target.value)}
                      style={{
                        width: '100%',
                        padding: '0.4rem',
                        borderRadius: '6px',
                        border: '1px solid #CBD5E1',
                        fontSize: '0.8rem',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '0.68rem', fontWeight: 600, color: '#64748B', display: 'block', marginBottom: '0.2rem' }}>
                      Included Distance (km)
                    </label>
                    <input
                      type="number"
                      min="0"
                      placeholder="Optional (leave empty for fixed trip)"
                      value={quoteForm.includedKm}
                      onChange={(e) => handleQuoteFormChange('includedKm', e.target.value)}
                      style={{
                        width: '100%',
                        padding: '0.4rem',
                        borderRadius: '6px',
                        border: '1px solid #CBD5E1',
                        fontSize: '0.8rem',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>
                </div>
              </details>

              {/* Inclusions and Exclusions Editable Fields */}
              <div style={{ marginBottom: '1rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div>
                    <label style={{ fontSize: '0.72rem', fontWeight: 700, color: '#166534', display: 'block', marginBottom: '0.25rem' }}>
                      Inclusions (Included in Quoted Price)
                    </label>
                    <textarea
                      rows={2}
                      value={quoteForm.inclusions}
                      onChange={(e) => handleQuoteFormChange('inclusions', e.target.value)}
                      placeholder="e.g. Fuel, Tolls, Driver Allowance..."
                      style={{
                        width: '100%',
                        padding: '0.45rem',
                        borderRadius: '6px',
                        border: '1px solid #BBF7D0',
                        backgroundColor: '#F0FDF4',
                        fontSize: '0.76rem',
                        boxSizing: 'border-box',
                        resize: 'vertical'
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.72rem', fontWeight: 700, color: '#991B1B', display: 'block', marginBottom: '0.25rem' }}>
                      Exclusions (Payable Directly by Customer)
                    </label>
                    <textarea
                      rows={2}
                      value={quoteForm.exclusions}
                      onChange={(e) => handleQuoteFormChange('exclusions', e.target.value)}
                      placeholder="e.g. Extra km/hr over limit..."
                      style={{
                        width: '100%',
                        padding: '0.45rem',
                        borderRadius: '6px',
                        border: '1px solid #FECACA',
                        backgroundColor: '#FEF2F2',
                        fontSize: '0.76rem',
                        boxSizing: 'border-box',
                        resize: 'vertical'
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Quote Validity */}
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ fontSize: '0.72rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '0.25rem' }}>
                  Quotation Validity
                </label>
                <select
                  value={quoteForm.validHours}
                  onChange={(e) => handleQuoteFormChange('validHours', parseInt(e.target.value, 10))}
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    borderRadius: '8px',
                    border: '1px solid #CBD5E1',
                    fontSize: '0.8rem',
                    outline: 'none',
                  }}
                >
                  <option value={24}>24 Hours</option>
                  <option value={48}>48 Hours (Recommended)</option>
                  <option value={72}>72 Hours</option>
                  <option value={168}>7 Days</option>
                </select>
              </div>

              {/* Sharing Information Note */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.55rem',
                marginBottom: '1.25rem',
                padding: '0.65rem 0.85rem',
                borderRadius: '8px',
                backgroundColor: '#F1F5F9',
                border: '1px solid #E2E8F0',
                color: '#475569',
                fontSize: '0.74rem',
                lineHeight: 1.45
              }}>
                <FileText size={16} color="#0284C7" style={{ flexShrink: 0 }} />
                <span>
                  Saving this quotation generates a secure customer URL with an unpredictable token. You can copy the link directly from the dashboard to share with the customer.
                </span>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setIsQuoteModalOpen(false)}
                  disabled={submittingQuote}
                  style={{
                    padding: '0.6rem 1.25rem',
                    borderRadius: '8px',
                    border: '1px solid #CBD5E1',
                    background: '#FFFFFF',
                    color: '#475569',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={submittingQuote}
                  style={{
                    padding: '0.6rem 1.5rem',
                    borderRadius: '8px',
                    border: 'none',
                    background: '#0284C7',
                    color: '#FFFFFF',
                    fontSize: '0.82rem',
                    fontWeight: 800,
                    cursor: submittingQuote ? 'not-allowed' : 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    boxShadow: '0 4px 12px rgba(2, 132, 199, 0.3)'
                  }}
                >
                  {submittingQuote ? <Loader2 size={15} className="animate-spin" /> : <CheckCircle size={15} />}
                  <span>Save Quotation</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
