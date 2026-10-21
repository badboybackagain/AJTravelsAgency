import React, { useState, useEffect } from 'react';
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
      b.id?.toLowerCase().includes(q)
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
          <div style={{ overflowX: 'auto' }}>
            <table className="admin-table">
              <thead>
                <tr>
                  <th style={{ minWidth: '120px' }}>Booking ID & Date</th>
                  <th style={{ minWidth: '180px' }}>Customer Details</th>
                  <th style={{ minWidth: '200px' }}>Route & Travel Date</th>
                  <th style={{ minWidth: '160px' }}>Vehicle & Class</th>
                  <th style={{ minWidth: '130px' }}>Fare (Payable)</th>
                  <th style={{ minWidth: '200px' }}>Payment Mode</th>
                  <th style={{ minWidth: '140px' }}>Booking Status</th>
                  <th style={{ minWidth: '150px', textAlign: 'right' }}>Quick Contact</th>
                </tr>
              </thead>
              <tbody>
                {filteredBookings.map((b) => {
                  const payDisplay = resolvePaymentDisplay(b);

                  const bookingDate = new Date(b.createdAt).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  });

                  const travelDate = b.pickupDate
                    ? new Date(b.pickupDate).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })
                    : 'Flexible';

                  const isUpdatingThis = updatingId === b.id;

                  return (
                    <tr key={b.id}>
                      {/* ID & Date */}
                      <td>
                        <div
                          style={{
                            fontFamily: 'monospace',
                            fontWeight: 800,
                            color: '#0F172A',
                            fontSize: '0.85rem',
                          }}
                        >
                          #{b.id.slice(-6).toUpperCase()}
                        </div>
                        <div style={{ fontSize: '0.7rem', color: '#94A3B8', marginTop: '0.15rem' }}>{bookingDate}</div>
                        {b.enquiryId && (
                          <div
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.25rem',
                              padding: '0.15rem 0.45rem',
                              borderRadius: '4px',
                              backgroundColor: '#EFF6FF',
                              border: '1px solid #DBEAFE',
                              color: '#1D4ED8',
                              fontSize: '0.66rem',
                              fontWeight: 700,
                              marginTop: '0.35rem',
                            }}
                            title={`Converted from Enquiry #${b.enquiryId}`}
                          >
                            <FileText size={10} />
                            <span>Enquiry #{b.enquiryId.slice(-6).toUpperCase()}</span>
                          </div>
                        )}
                      </td>

                      {/* Customer Details */}
                      <td>
                        <div
                          style={{
                            fontWeight: 700,
                            color: '#0F172A',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.35rem',
                          }}
                        >
                          <User size={13} color="#0284C7" />
                          <span>{b.customerName || 'Guest Customer'}</span>
                        </div>
                        <div
                          style={{
                            fontSize: '0.75rem',
                            color: '#475569',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.35rem',
                            marginTop: '0.15rem',
                          }}
                        >
                          <Phone size={13} color="#16A34A" />
                          <span>{b.customerPhone}</span>
                          <span
                            style={{
                              fontSize: '0.62rem',
                              color: '#15803D',
                              background: '#DCFCE7',
                              padding: '0.1rem 0.35rem',
                              borderRadius: '4px',
                              fontWeight: 800,
                            }}
                          >
                            ✓ Verified
                          </span>
                        </div>
                        {b.customerEmail && (
                          <div
                            style={{
                              fontSize: '0.7rem',
                              color: '#94A3B8',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.35rem',
                              marginTop: '0.15rem',
                            }}
                          >
                            <Mail size={13} color="#94A3B8" />
                            <span>{b.customerEmail}</span>
                          </div>
                        )}
                      </td>

                      {/* Route & Travel Date */}
                      <td>
                        <div
                          style={{
                            fontWeight: 700,
                            color: '#0F172A',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.35rem',
                          }}
                        >
                          <MapPin size={13} color="#0284C7" />
                          <span>
                            {b.route?.routeName ||
                              `${b.route?.pickupLocation?.name || b.pickupAddress || 'Pune'} ➔ ${
                                b.route?.dropLocation?.name || b.dropAddress || 'Mumbai'
                              }`}
                          </span>
                        </div>
                        <div
                          style={{
                            fontSize: '0.72rem',
                            color: '#64748B',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.35rem',
                            marginTop: '0.2rem',
                          }}
                        >
                          <Calendar size={13} color="#94A3B8" />
                          <span>
                            {travelDate} • {b.pickupTime || '08:00 AM'}
                          </span>
                        </div>
                      </td>

                      {/* Vehicle */}
                      <td>
                        <div style={{ fontWeight: 700, color: '#0F172A' }}>
                          {b.vehicle?.name || b.localVehicle?.name || 'Executive Cab'}
                        </div>
                        <div style={{ fontSize: '0.72rem', color: '#64748B' }}>
                          {b.vehicle?.category || b.localVehicle?.category || 'SEDAN'} • {b.passengers} Pax
                        </div>
                      </td>

                      {/* Fare Payable */}
                      <td>
                        <div style={{ fontSize: '0.92rem', fontWeight: 900, color: '#0369A1' }}>
                          ₹{b.fareTotal?.toLocaleString()}
                        </div>
                        <div style={{ fontSize: '0.68rem', color: '#64748B' }}>
                          {payDisplay.isVerifiedOnline ? 'Paid Online' : 'Due on Arrival'}
                        </div>
                      </td>

                      {/* Truthful Payment Status Column */}
                      <td>
                        <div style={{ display: 'inline-flex', flexDirection: 'column', gap: '0.25rem' }}>
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.35rem',
                              padding: '0.22rem 0.6rem',
                              borderRadius: '9999px',
                              backgroundColor: payDisplay.badgeBg,
                              border: `1px solid ${payDisplay.badgeBorder}`,
                              color: payDisplay.badgeColor,
                              fontSize: '0.7rem',
                              fontWeight: 800,
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {payDisplay.icon === 'check' && <CheckCircle size={11} color={payDisplay.badgeColor} />}
                            {payDisplay.icon === 'clock' && <Clock size={11} color={payDisplay.badgeColor} />}
                            {payDisplay.icon === 'alert' && <AlertCircle size={11} color={payDisplay.badgeColor} />}
                            <span>{payDisplay.statusLabel}</span>
                          </span>

                          {payDisplay.refLabel && (
                            <div style={{ fontSize: '0.68rem', color: '#64748B' }}>
                              <span style={{ fontFamily: 'monospace', color: '#0F172A', fontWeight: 700 }}>
                                {payDisplay.refLabel}
                              </span>
                            </div>
                          )}

                          <div style={{ fontSize: '0.67rem', color: '#475569', fontWeight: 600 }}>
                            {payDisplay.methodLabel}
                          </div>
                        </div>
                      </td>

                      {/* Interactive Booking Status Selector */}
                      <td>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                          <select
                            value={b.status || 'CONFIRMED'}
                            disabled={isUpdatingThis}
                            onChange={(e) => handleStatusChange(b.id, e.target.value)}
                            style={{
                              padding: '0.3rem 0.55rem',
                              borderRadius: '8px',
                              fontSize: '0.74rem',
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
                          {isUpdatingThis && <Loader2 size={12} className="animate-spin text-sky-500" />}
                        </div>
                      </td>

                      {/* Quick Contact Actions */}
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                          <a
                            href={`https://wa.me/91${b.customerPhone?.replace(/[^0-9]/g, '')}?text=Hello%20${encodeURIComponent(
                              b.customerName || ''
                            )},%20regarding%20your%20Pune-Mumbai%20travel%20booking%20#${b.id.slice(-6).toUpperCase()}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.3rem',
                              padding: '0.35rem 0.65rem',
                              borderRadius: '8px',
                              backgroundColor: '#DCFCE7',
                              color: '#15803D',
                              fontSize: '0.75rem',
                              fontWeight: 700,
                              textDecoration: 'none',
                            }}
                          >
                            <MessageSquare size={13} />
                            <span>WhatsApp</span>
                          </a>

                          <a
                            href={`tel:${b.customerPhone}`}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.3rem',
                              padding: '0.35rem 0.65rem',
                              borderRadius: '8px',
                              backgroundColor: '#E0F2FE',
                              color: '#0369A1',
                              fontSize: '0.75rem',
                              fontWeight: 700,
                              textDecoration: 'none',
                            }}
                          >
                            <Phone size={13} />
                            <span>Call</span>
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
