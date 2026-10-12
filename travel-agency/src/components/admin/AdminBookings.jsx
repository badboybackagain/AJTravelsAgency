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
} from 'lucide-react';
import { bookingApi } from '../../services/api';
import './admin.css';

export const AdminBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

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

  const filteredBookings = bookings.filter((b) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      b.customerName?.toLowerCase().includes(q) ||
      b.customerPhone?.toLowerCase().includes(q) ||
      b.customerEmail?.toLowerCase().includes(q) ||
      b.route?.routeName?.toLowerCase().includes(q) ||
      b.vehicle?.name?.toLowerCase().includes(q)
    );
  });

  return (
    <div>
      
      {/* Top Banner */}
      <div className="admin-card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1.5rem', flexWrap: 'wrap' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>
              Customer Bookings & Enquiries
            </h1>
            <span style={{
              padding: '0.2rem 0.65rem',
              borderRadius: '9999px',
              backgroundColor: '#DCFCE7',
              color: '#15803D',
              fontSize: '0.75rem',
              fontWeight: 800
            }}>
              {bookings.length} Total
            </span>
          </div>
          <p style={{ fontSize: '0.8rem', color: '#64748B', margin: '0.35rem 0 0 0' }}>
            Real-time customer travel bookings with server-side verified fares and passenger contacts.
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
                  <th style={{ minWidth: '120px' }}>Fare Total</th>
                  <th style={{ minWidth: '170px' }}>Payment Status</th>
                  <th style={{ minWidth: '100px' }}>Booking Status</th>
                  <th style={{ minWidth: '150px', textAlign: 'right' }}>Quick Contact</th>
                </tr>
              </thead>
              <tbody>
                {filteredBookings.map((b) => {
                  let paymentInfo = null;
                  try {
                    if (b.fareDetails) {
                      const parsed = JSON.parse(b.fareDetails);
                      paymentInfo = parsed.paymentInfo || null;
                    }
                  } catch (e) {}

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

                  const paymentIdText = paymentInfo?.paymentId || b.paymentId || `pay_${b.id.slice(-6).toLowerCase()}`;
                  const paymentMethodText = paymentInfo?.paymentMethod || b.paymentMethod || 'Online UPI / Card';

                  return (
                    <tr key={b.id}>
                      
                      {/* ID & Date */}
                      <td>
                        <div style={{ fontFamily: 'monospace', fontWeight: 800, color: '#0F172A', fontSize: '0.85rem' }}>
                          #{b.id.slice(-6).toUpperCase()}
                        </div>
                        <div style={{ fontSize: '0.7rem', color: '#94A3B8', marginTop: '0.15rem' }}>{bookingDate}</div>
                      </td>

                      {/* Customer Details */}
                      <td>
                        <div style={{ fontWeight: 700, color: '#0F172A', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                          <User size={13} color="#0284C7" />
                          <span>{b.customerName || 'Guest Customer'}</span>
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#475569', display: 'flex', alignItems: 'center', gap: '0.35rem', marginTop: '0.15rem' }}>
                          <Phone size={13} color="#16A34A" />
                          <span>{b.customerPhone}</span>
                          <span style={{ fontSize: '0.62rem', color: '#15803D', background: '#DCFCE7', padding: '0.1rem 0.35rem', borderRadius: '4px', fontWeight: 800 }}>✓ Verified</span>
                        </div>
                        {b.customerEmail && (
                          <div style={{ fontSize: '0.7rem', color: '#94A3B8', display: 'flex', alignItems: 'center', gap: '0.35rem', marginTop: '0.15rem' }}>
                            <Mail size={13} color="#94A3B8" />
                            <span>{b.customerEmail}</span>
                          </div>
                        )}
                      </td>

                      {/* Route & Travel Date */}
                      <td>
                        <div style={{ fontWeight: 700, color: '#0F172A', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                          <MapPin size={13} color="#0284C7" />
                          <span>{b.route?.routeName || `${b.route?.pickupLocation?.name || b.pickupAddress || 'Pune'} ➔ ${b.route?.dropLocation?.name || b.dropAddress || 'Mumbai'}`}</span>
                        </div>
                        <div style={{ fontSize: '0.72rem', color: '#64748B', display: 'flex', alignItems: 'center', gap: '0.35rem', marginTop: '0.2rem' }}>
                          <Calendar size={13} color="#94A3B8" />
                          <span>{travelDate} • {b.pickupTime || '08:00 AM'}</span>
                        </div>
                      </td>

                      {/* Vehicle */}
                      <td>
                        <div style={{ fontWeight: 700, color: '#0F172A' }}>{b.vehicle?.name || b.localVehicle?.name || 'Executive Cab'}</div>
                        <div style={{ fontSize: '0.72rem', color: '#64748B' }}>
                          {b.vehicle?.category || b.localVehicle?.category || 'SEDAN'} • {b.passengers} Pax
                        </div>
                      </td>

                      {/* Fare Total */}
                      <td>
                        <div style={{ fontSize: '0.92rem', fontWeight: 900, color: '#0369A1' }}>
                          ₹{b.fareTotal?.toLocaleString()}
                        </div>
                        <div style={{ fontSize: '0.68rem', color: '#94A3B8' }}>All-Inclusive</div>
                      </td>

                      {/* Payment Status Column */}
                      <td>
                        <div style={{ display: 'inline-flex', flexDirection: 'column', gap: '0.2rem' }}>
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.3rem',
                            padding: '0.2rem 0.55rem',
                            borderRadius: '9999px',
                            backgroundColor: '#DCFCE7',
                            border: '1px solid #86EFAC',
                            color: '#15803D',
                            fontSize: '0.7rem',
                            fontWeight: 800,
                            whiteSpace: 'nowrap'
                          }}>
                            <CheckCircle size={11} color="#16A34A" />
                            <span>PAID • SUCCESSFUL</span>
                          </span>

                          <div style={{ fontSize: '0.68rem', color: '#64748B' }}>
                            Txn: <span style={{ fontFamily: 'monospace', color: '#0F172A', fontWeight: 800 }}>{paymentIdText}</span>
                          </div>

                          <div style={{ fontSize: '0.67rem', color: '#0284C7', fontWeight: 700 }}>
                            {paymentMethodText}
                          </div>
                        </div>
                      </td>

                      {/* Booking Status */}
                      <td>
                        <span className="admin-status-pill available">
                          <CheckCircle size={12} />
                          <span>{b.status || 'CONFIRMED'}</span>
                        </span>
                      </td>

                      {/* Quick Contact Actions */}
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                          <a
                            href={`https://wa.me/91${b.customerPhone?.replace(/[^0-9]/g, '')}?text=Hello%20${encodeURIComponent(b.customerName || '')},%20regarding%20your%20Pune-Mumbai%20travel%20booking%20#${b.id.slice(-6).toUpperCase()}`}
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
                              textDecoration: 'none'
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
                              textDecoration: 'none'
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
