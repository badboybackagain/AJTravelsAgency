import React, { useState, useEffect, useCallback } from 'react';
import {
  Calendar,
  Clock,
  User,
  Phone,
  Mail,
  MapPin,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Search,
  Loader2,
  FileText,
  MessageSquare,
  X,
  Car,
  Filter,
  Check
} from 'lucide-react';
import { bookingApi } from '../../services/api';
import './admin.css';

/**
 * Resolves truthful payment information from persisted booking data.
 * Strictly avoids fabricating transaction references or claiming payments were collected online.
 */
const resolvePaymentDisplay = (b) => {
  let paymentInfo = null;
  try {
    if (b.fareDetails) {
      const parsed = JSON.parse(b.fareDetails);
      paymentInfo = parsed.paymentInfo || null;
    }
  } catch (e) {}

  const rawStatus = (paymentInfo?.paymentStatus || b.paymentStatus || 'PAY_TO_DRIVER').toUpperCase();
  const rawMethod = paymentInfo?.paymentMethod || b.paymentMethod || 'Pay to Driver (Cash / UPI)';
  const rawPaymentId = paymentInfo?.paymentId || null;
  const isSimulated = Boolean(paymentInfo?.isSimulated);

  // 1. Pay to Driver / Cash on Pickup (Standard authentic operating mode for AJ Travels)
  if (
    rawStatus === 'PAY_TO_DRIVER' ||
    rawMethod.toLowerCase().includes('driver') ||
    rawMethod.toLowerCase().includes('cash')
  ) {
    return {
      statusLabel: 'PAY TO DRIVER',
      badgeBg: '#FEF3C7',
      badgeBorder: '#FDE68A',
      badgeColor: '#B45309',
      icon: 'clock',
      methodLabel: 'Cash / UPI to Chauffeur on Arrival',
      refLabel: rawPaymentId ? `Ref: #${rawPaymentId.slice(-6).toUpperCase()}` : `Ref: #${b.id.slice(-6).toUpperCase()}`,
      isVerifiedOnline: false,
    };
  }

  // 2. Simulated Dev/Test Transaction (Early test records)
  if (isSimulated) {
    return {
      statusLabel: 'SIMULATED TEST',
      badgeBg: '#F1F5F9',
      badgeBorder: '#CBD5E1',
      badgeColor: '#475569',
      icon: 'alert',
      methodLabel: `${rawMethod} (Test Mode)`,
      refLabel: rawPaymentId ? `Test Ref: ${rawPaymentId}` : `Ref: #${b.id.slice(-6).toUpperCase()}`,
      isVerifiedOnline: false,
    };
  }

  // 3. Genuine Verified Online Payment (Only when gateway actually confirms payment)
  if (rawStatus === 'PAID' || rawStatus === 'COMPLETED' || rawStatus === 'SUCCESSFUL') {
    return {
      statusLabel: 'PAID ONLINE',
      badgeBg: '#DCFCE7',
      badgeBorder: '#86EFAC',
      badgeColor: '#15803D',
      icon: 'check',
      methodLabel: rawMethod,
      refLabel: rawPaymentId ? `Txn: ${rawPaymentId}` : null,
      isVerifiedOnline: true,
    };
  }

  // 4. Default: Payment Pending / Unsettled
  return {
    statusLabel: 'PAYMENT PENDING',
    badgeBg: '#F8FAFC',
    badgeBorder: '#E2E8F0',
    badgeColor: '#64748B',
    icon: 'clock',
    methodLabel: rawMethod || 'Pending Settlement',
    refLabel: rawPaymentId ? `Ref: #${rawPaymentId.slice(-6).toUpperCase()}` : null,
    isVerifiedOnline: false,
  };
};

export const AdminBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [updatingId, setUpdatingId] = useState(null);

  // Deterministic, crystal-clear Booking ID formatter (e.g. BK-1001, BK-1002...)
  const getBookingDisplayId = useCallback((b) => {
    if (!b) return 'N/A';
    if (b.bookingNumber) return b.bookingNumber;
    if (bookings && bookings.length > 0) {
      const sorted = [...bookings].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
      const idx = sorted.findIndex((item) => item.id === b.id);
      if (idx !== -1) return `BK-${1001 + idx}`;
    }
    return `BK-${b.id ? b.id.slice(-4).toUpperCase() : '1001'}`;
  }, [bookings]);
  const [feedbackMsg, setFeedbackMsg] = useState(null);

  const fetchBookings = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await bookingApi.adminGetAll();
      setBookings(res.data?.data || []);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to load bookings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const handleStatusChange = async (bookingId, newStatus) => {
    if (!['PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED'].includes(newStatus)) return;
    setUpdatingId(bookingId);
    try {
      await bookingApi.updateStatus(bookingId, newStatus);
      setBookings((prev) =>
        prev.map((item) =>
          item.id === bookingId ? { ...item, status: newStatus, updatedAt: new Date().toISOString() } : item
        )
      );
      setFeedbackMsg({
        type: 'success',
        text: `Booking #${bookingId.slice(-6).toUpperCase()} status updated to ${newStatus}.`,
      });
      setTimeout(() => setFeedbackMsg(null), 4000);
    } catch (err) {
      console.error('Failed to update booking status:', err);
      setFeedbackMsg({
        type: 'error',
        text: err.response?.data?.message || 'Failed to update booking status. Please try again.',
      });
      setTimeout(() => setFeedbackMsg(null), 5000);
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredBookings = bookings.filter((b) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      b.customerName?.toLowerCase().includes(q) ||
      b.customerPhone?.toLowerCase().includes(q) ||
      b.customerEmail?.toLowerCase().includes(q) ||
      b.route?.routeName?.toLowerCase().includes(q) ||
      b.vehicle?.name?.toLowerCase().includes(q) ||
      b.id?.toLowerCase().includes(q) ||
      b.enquiryNumber?.toLowerCase().includes(q) || getBookingDisplayId(b).toLowerCase().includes(q)
    );
  });

  const payToDriverCount = bookings.filter((b) => {
    const pay = resolvePaymentDisplay(b);
    return pay.statusLabel === 'PAY TO DRIVER';
  }).length;

  const simulatedCount = bookings.filter((b) => {
    const pay = resolvePaymentDisplay(b);
    return pay.statusLabel === 'SIMULATED TEST';
  }).length;

  return (
    <div>
      {/* Top Banner */}
      <div
        className="admin-card"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1.5rem',
          flexWrap: 'wrap',
          marginBottom: '1.25rem',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
            <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>
              Customer Bookings & Reservations
            </h1>
            <span
              style={{
                padding: '0.2rem 0.65rem',
                borderRadius: '9999px',
                backgroundColor: '#DCFCE7',
                color: '#15803D',
                fontSize: '0.75rem',
                fontWeight: 800,
              }}
            >
              {bookings.length} Total Bookings
            </span>
            {payToDriverCount > 0 && (
              <span
                style={{
                  padding: '0.2rem 0.65rem',
                  borderRadius: '9999px',
                  backgroundColor: '#FEF3C7',
                  color: '#B45309',
                  fontSize: '0.75rem',
                  fontWeight: 800,
                }}
              >
                {payToDriverCount} Pay to Driver
              </span>
            )}
            {simulatedCount > 0 && (
              <span
                style={{
                  padding: '0.2rem 0.65rem',
                  borderRadius: '9999px',
                  backgroundColor: '#F1F5F9',
                  color: '#475569',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                }}
              >
                {simulatedCount} Test Entries
              </span>
            )}
          </div>
          <p style={{ fontSize: '0.8rem', color: '#64748B', margin: '0.35rem 0 0 0' }}>
            Real-time customer travel reservations verified with WhatsApp OTP. Driver collects trip payment on arrival.
          </p>
        </div>

        <button
          onClick={fetchBookings}
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
        <div
          style={{
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
            boxShadow: '0 2px 6px rgba(0,0,0,0.05)',
          }}
        >
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

      {/* Toolbar: Search */}
      <div className="admin-toolbar">
        <div className="admin-search-wrapper" style={{ width: '380px' }}>
          <Search size={16} className="admin-search-icon" />
          <input
            type="text"
            placeholder="Search customer name, phone, email, route..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="admin-search-input"
          />
        </div>
      </div>

      {/* Table of Bookings */}
      <div className="admin-table-container">
        {loading ? (
          <div style={{ padding: '4rem', textAlign: 'center', color: '#94A3B8' }}>
            <Loader2 size={30} className="animate-spin text-sky-500" style={{ margin: '0 auto 0.75rem auto' }} />
            <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>Loading bookings...</div>
          </div>
        ) : error ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#E11D48' }}>
            <AlertCircle size={28} style={{ margin: '0 auto 0.5rem auto' }} />
            <div style={{ fontWeight: 700 }}>{error}</div>
          </div>
        ) : filteredBookings.length === 0 ? (
          <div style={{ padding: '4rem 2rem', textAlign: 'center', color: '#64748B' }}>
            <FileText size={36} color="#CBD5E1" style={{ margin: '0 auto 0.75rem auto' }} />
            <div style={{ fontWeight: 800, fontSize: '1rem', color: '#0F172A', marginBottom: '0.35rem' }}>
              No Bookings Found
            </div>
            <p style={{ fontSize: '0.8rem', color: '#94A3B8', maxWidth: '360px', margin: '0 auto' }}>
              Customer bookings submitted through the booking page will appear here automatically.
            </p>
          </div>
        ) : (
          <div style={{ width: '100%', overflowX: 'hidden' }}>
            <table className="admin-table" style={{ width: '100%', tableLayout: 'fixed' }}>
              <thead>
                <tr>
                  <th style={{ width: '14%' }}>Booking ID</th>
                  <th style={{ width: '20%' }}>Customer</th>
                  <th style={{ width: '24%' }}>Route & Time</th>
                  <th style={{ width: '14%' }}>Vehicle</th>
                  <th style={{ width: '10%' }}>Fare</th>
                  <th style={{ width: '10%' }}>Status</th>
                  <th style={{ width: '8%', textAlign: 'center' }}>Contact</th>
                </tr>
              </thead>
              <tbody>
                {filteredBookings.map((b) => {
                  const displayId = getBookingDisplayId(b);

                  const bookingDate = new Date(b.createdAt).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit',
                  });

                  const travelDate = b.pickupDate
                    ? new Date(b.pickupDate).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                      })
                    : 'Flexible';

                  const isUpdatingThis = updatingId === b.id;

                  return (
                    <tr key={b.id}>
                      {/* 1. Clean Booking ID & Date */}
                      <td style={{ padding: '0.7rem 0.85rem' }}>
                        <div
                          style={{
                            fontWeight: 800,
                            color: '#0F172A',
                            fontSize: '0.85rem',
                            letterSpacing: '0.02em',
                          }}
                        >
                          {displayId}
                        </div>
                        <div style={{ fontSize: '0.68rem', color: '#94A3B8', marginTop: '0.1rem' }}>{bookingDate}</div>
                        {b.enquiryId && (
                          <div
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.2rem',
                              padding: '0.1rem 0.35rem',
                              borderRadius: '4px',
                              backgroundColor: '#EFF6FF',
                              border: '1px solid #DBEAFE',
                              color: '#1D4ED8',
                              fontSize: '0.64rem',
                              fontWeight: 700,
                              marginTop: '0.25rem',
                            }}
                            title={`Converted from Enquiry ${b.enquiryNumber || `ENQ-${b.enquiryId.slice(-4).toUpperCase()}`}`}
                          >
                            <FileText size={9} />
                            <span>{b.enquiryNumber || `ENQ-${b.enquiryId.slice(-4).toUpperCase()}`}</span>
                          </div>
                        )}
                      </td>

                      {/* 2. Customer Details */}
                      <td style={{ padding: '0.7rem 0.85rem' }}>
                        <div
                          style={{
                            fontWeight: 700,
                            color: '#0F172A',
                            fontSize: '0.82rem',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                        >
                          {b.customerName || 'Guest Customer'}
                        </div>
                        <div
                          style={{
                            fontSize: '0.74rem',
                            color: '#475569',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.3rem',
                            marginTop: '0.15rem',
                          }}
                        >
                          <Phone size={11} color="#16A34A" />
                          <span>{b.customerPhone}</span>
                        </div>
                      </td>

                      {/* 3. Route & Travel Date */}
                      <td style={{ padding: '0.7rem 0.85rem' }}>
                        <div
                          style={{
                            fontWeight: 700,
                            color: '#0F172A',
                            fontSize: '0.82rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.3rem',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                        >
                          <MapPin size={12} color="#0284C7" style={{ flexShrink: 0 }} />
                          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {b.route?.routeName ||
                              `${b.route?.pickupLocation?.name || b.pickupAddress || 'Pune'} ➔ ${
                                b.route?.dropLocation?.name || b.dropAddress || 'Mumbai'
                              }`}
                          </span>
                        </div>
                        <div
                          style={{
                            fontSize: '0.7rem',
                            color: '#64748B',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.3rem',
                            marginTop: '0.15rem',
                          }}
                        >
                          <Calendar size={11} color="#94A3B8" style={{ flexShrink: 0 }} />
                          <span>
                            {travelDate} • {b.pickupTime || '08:00 AM'}
                          </span>
                        </div>
                      </td>

                      {/* 4. Vehicle */}
                      <td style={{ padding: '0.7rem 0.85rem' }}>
                        <div style={{ fontWeight: 700, color: '#0F172A', fontSize: '0.8rem' }}>
                          {b.vehicle?.name || b.localVehicle?.name || 'Executive Cab'}
                        </div>
                        <div style={{ fontSize: '0.7rem', color: '#64748B' }}>
                          {b.passengers || 1} Pax
                        </div>
                      </td>

                      {/* 5. Fare & Payment Mode */}
                      <td style={{ padding: '0.7rem 0.85rem' }}>
                        <div style={{ fontSize: '0.9rem', fontWeight: 900, color: '#0369A1' }}>
                          ₹{b.fareTotal ? parseFloat(b.fareTotal).toLocaleString('en-IN') : '0'}
                        </div>
                        <div style={{ fontSize: '0.66rem', color: '#15803D', fontWeight: 700 }}>
                          Pay to Driver
                        </div>
                      </td>

                      {/* 6. Status Dropdown */}
                      <td style={{ padding: '0.7rem 0.65rem' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                          <select
                            value={b.status || 'CONFIRMED'}
                            disabled={isUpdatingThis}
                            onChange={(e) => handleStatusChange(b.id, e.target.value)}
                            style={{
                              padding: '0.26rem 0.45rem',
                              borderRadius: '6px',
                              fontSize: '0.72rem',
                              fontWeight: 700,
                              border: '1px solid #CBD5E1',
                              backgroundColor:
                                b.status === 'COMPLETED'
                                  ? '#DCFCE7'
                                  : b.status === 'CANCELLED'
                                  ? '#FEE2E2'
                                  : '#E0F2FE',
                              color:
                                b.status === 'COMPLETED'
                                  ? '#15803D'
                                  : b.status === 'CANCELLED'
                                  ? '#991B1B'
                                  : '#0369A1',
                              cursor: isUpdatingThis ? 'wait' : 'pointer',
                              outline: 'none',
                            }}
                          >
                            <option value="CONFIRMED">Confirmed</option>
                            <option value="COMPLETED">Completed</option>
                            <option value="CANCELLED">Cancelled</option>
                            <option value="PENDING">Pending</option>
                          </select>
                          {isUpdatingThis && <Loader2 size={11} className="animate-spin text-sky-500" />}
                        </div>
                      </td>

                      {/* 7. Quick Contact Icons Only */}
                      <td style={{ padding: '0.7rem 0.65rem', textAlign: 'center' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem' }}>
                          <a
                            href={`https://wa.me/91${b.customerPhone?.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
                              `Hello ${b.customerName || 'Customer'}, regarding your travel booking ${displayId} with AJ Travels.`
                            )}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            title="Chat on WhatsApp"
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              width: '28px',
                              height: '28px',
                              borderRadius: '6px',
                              backgroundColor: '#DCFCE7',
                              border: '1px solid #BBF7D0',
                              color: '#15803D',
                              textDecoration: 'none',
                            }}
                          >
                            <MessageSquare size={13} />
                          </a>

                          <a
                            href={`tel:${b.customerPhone}`}
                            title="Call Customer"
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              width: '28px',
                              height: '28px',
                              borderRadius: '6px',
                              backgroundColor: '#E0F2FE',
                              border: '1px solid #BAE6FD',
                              color: '#0369A1',
                              textDecoration: 'none',
                            }}
                          >
                            <Phone size={13} />
                          </a>
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
    </div>
  );
};
