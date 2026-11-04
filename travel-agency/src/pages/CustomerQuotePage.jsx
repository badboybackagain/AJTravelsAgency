import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  CheckCircle,
  AlertCircle,
  Clock,
  Car,
  MapPin,
  Calendar,
  ShieldCheck,
  Phone,
  MessageSquare,
  ChevronRight,
  Loader2,
  X,
  FileText,
  Info
} from 'lucide-react';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { quoteApi } from '../services/api';
import { businessConfig } from '../config/business.config';

export function CustomerQuotePage() {
  const { token } = useParams();
  const [quote, setQuote] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState(null);
  const [isDeclineModalOpen, setIsDeclineModalOpen] = useState(false);
  const [declineReason, setDeclineReason] = useState('');

  const fetchQuote = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await quoteApi.getByToken(token);
      setQuote(res.data?.data || null);
    } catch (err) {
      console.error('Failed to load quotation:', err);
      setError(
        err.response?.data?.message ||
        'This quotation could not be found or has expired. Please contact our team directly.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchQuote();
    } else {
      setError('Quotation reference is missing.');
      setLoading(false);
    }
  }, [token]);

  const handleAccept = async () => {
    setActionLoading(true);
    try {
      const res = await quoteApi.accept(token);
      const resData = res?.data?.data;
      setQuote((prev) => ({
        ...prev,
        status: 'ACCEPTED',
        acceptedAt: resData?.acceptedAt || new Date().toISOString(),
        bookingId: resData?.bookingId || prev.bookingId,
        bookingRef: resData?.bookingRef || prev.bookingRef,
      }));
      setActionMessage({
        type: 'success',
        text: resData?.bookingRef
          ? `Quotation accepted and Booking #${resData.bookingRef} confirmed!`
          : 'Thank you! You have accepted this quotation. Our dispatch team will confirm vehicle allocation shortly.',
      });
    } catch (err) {
      console.error('Error accepting quote:', err);
      setActionMessage({
        type: 'error',
        text: err.response?.data?.message || 'Could not record quotation acceptance. Please contact our helpline.',
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleDecline = async () => {
    setActionLoading(true);
    try {
      await quoteApi.decline(token, { reason: declineReason });
      setQuote((prev) => ({
        ...prev,
        status: 'DECLINED',
      }));
      setIsDeclineModalOpen(false);
      setActionMessage({
        type: 'info',
        text: 'Quotation declined. Thank you for your feedback.',
      });
    } catch (err) {
      console.error('Error declining quote:', err);
      setActionMessage({
        type: 'error',
        text: err.response?.data?.message || 'Failed to update quotation. Please try again.',
      });
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      background: '#F1F5F9',
      color: '#1E293B',
      fontFamily: "'Inter', sans-serif",
    }}>
      <style>{`
        .quote-container {
          width: 100%;
          max-width: 1020px;
          margin: 0 auto;
          padding: 5.5rem 1rem 2rem 1rem;
          flex: 1;
        }
        .quote-sheet-card {
          background: #FFFFFF;
          border-radius: 16px;
          border: 1px solid #E2E8F0;
          box-shadow: 0 10px 30px -4px rgba(15, 23, 42, 0.08);
          padding: 1.35rem 1.6rem;
        }
        .quote-grid {
          display: grid;
          grid-template-columns: 1.15fr 0.85fr;
          gap: 1.25rem;
          align-items: start;
        }
        @media (max-width: 820px) {
          .quote-container {
            padding: 5.25rem 0.75rem 1.5rem 0.75rem;
          }
          .quote-sheet-card {
            padding: 1.15rem;
          }
          .quote-grid {
            grid-template-columns: 1fr;
            gap: 1rem;
          }
        }
      `}</style>

      <Header isDark={false} />

      <main className="quote-container">
        {loading ? (
          <div style={{ padding: '6rem 1rem', textAlign: 'center', color: '#64748B' }}>
            <Loader2 size={36} className="animate-spin" style={{ margin: '0 auto 1rem auto', color: '#0284C7' }} />
            <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#0F172A', margin: 0 }}>
              Retrieving Your Quotation...
            </h2>
            <p style={{ fontSize: '0.85rem', color: '#94A3B8', marginTop: '0.5rem' }}>
              Verifying trip parameters and route fare details
            </p>
          </div>
        ) : error || !quote ? (
          <div style={{
            background: '#FFFFFF',
            borderRadius: '16px',
            padding: '2.5rem 1.5rem',
            border: '1px solid #E2E8F0',
            textAlign: 'center',
            boxShadow: '0 10px 30px rgba(0,0,0,0.04)',
          }}>
            <AlertCircle size={40} color="#EF4444" style={{ margin: '0 auto 0.75rem auto' }} />
            <h1 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#0F172A', margin: '0 0 0.4rem 0' }}>
              Quotation Unavailable
            </h1>
            <p style={{ fontSize: '0.88rem', color: '#64748B', lineHeight: 1.5, maxWidth: '440px', margin: '0 auto 1.5rem auto' }}>
              {error}
            </p>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link
                to="/fare"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  padding: '0.65rem 1.25rem',
                  borderRadius: '10px',
                  backgroundColor: '#0284C7',
                  color: '#FFFFFF',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  textDecoration: 'none',
                }}
              >
                <span>Check Live Fares</span>
                <ChevronRight size={15} />
              </Link>
              <a
                href={`https://wa.me/${businessConfig.whatsapp}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  padding: '0.65rem 1.25rem',
                  borderRadius: '10px',
                  backgroundColor: '#25D366',
                  color: '#FFFFFF',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  textDecoration: 'none',
                }}
              >
                <MessageSquare size={15} />
                <span>Chat with AJ Travels</span>
              </a>
            </div>
          </div>
        ) : (
          <div>
            {/* Action Feedback Message */}
            {actionMessage && (
              <div style={{
                marginBottom: '1rem',
                padding: '0.75rem 1rem',
                borderRadius: '10px',
                fontSize: '0.85rem',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '0.65rem',
                backgroundColor: actionMessage.type === 'success' ? '#DCFCE7' : actionMessage.type === 'info' ? '#E0F2FE' : '#FEE2E2',
                color: actionMessage.type === 'success' ? '#15803D' : actionMessage.type === 'info' ? '#0369A1' : '#991B1B',
                border: `1px solid ${actionMessage.type === 'success' ? '#BBF7D0' : actionMessage.type === 'info' ? '#BAE6FD' : '#FECACA'}`,
              }}>
                {actionMessage.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
                <span>{actionMessage.text}</span>
              </div>
            )}

            {/* Unified One-Screen Quotation Card */}
            <div className="quote-sheet-card">
              {/* Header Bar */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '0.75rem',
                borderBottom: '1px solid #E2E8F0',
                paddingBottom: '0.85rem',
                marginBottom: '1rem',
              }}>
                <div>
                  <div style={{ fontSize: '0.68rem', fontWeight: 800, color: '#0284C7', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    AJ Travels Pune • Official Quotation
                  </div>
                  <h1 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0F172A', margin: '0.1rem 0' }}>
                    Trip Quotation #{quote.quoteRef}
                  </h1>
                  <span style={{ fontSize: '0.75rem', color: '#64748B' }}>
                    Prepared for: <strong>{quote.customerName}</strong> ({quote.maskedPhone})
                  </span>
                </div>

                {/* Status Badge */}
                <div>
                  {quote.status === 'ACCEPTED' ? (
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.3rem',
                      padding: '0.35rem 0.75rem',
                      borderRadius: '9999px',
                      backgroundColor: '#DCFCE7',
                      color: '#15803D',
                      fontWeight: 800,
                      fontSize: '0.75rem',
                      border: '1px solid #BBF7D0',
                    }}>
                      <CheckCircle size={14} />
                      <span>Quotation Accepted</span>
                    </span>
                  ) : quote.status === 'DECLINED' ? (
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.3rem',
                      padding: '0.35rem 0.75rem',
                      borderRadius: '9999px',
                      backgroundColor: '#F1F5F9',
                      color: '#64748B',
                      fontWeight: 800,
                      fontSize: '0.75rem',
                      border: '1px solid #E2E8F0',
                    }}>
                      <X size={14} />
                      <span>Quotation Declined</span>
                    </span>
                  ) : quote.status === 'SUPERSEDED' ? (
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.3rem',
                      padding: '0.35rem 0.75rem',
                      borderRadius: '9999px',
                      backgroundColor: '#F1F5F9',
                      color: '#475569',
                      fontWeight: 800,
                      fontSize: '0.75rem',
                      border: '1px solid #CBD5E1',
                    }}>
                      <Clock size={14} />
                      <span>Superseded</span>
                    </span>
                  ) : quote.isExpired || quote.status === 'EXPIRED' ? (
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.3rem',
                      padding: '0.35rem 0.75rem',
                      borderRadius: '9999px',
                      backgroundColor: '#FEE2E2',
                      color: '#991B1B',
                      fontWeight: 800,
                      fontSize: '0.75rem',
                      border: '1px solid #FECACA',
                    }}>
                      <Clock size={14} />
                      <span>Expired</span>
                    </span>
                  ) : (
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.3rem',
                      padding: '0.35rem 0.75rem',
                      borderRadius: '9999px',
                      backgroundColor: '#FEF3C7',
                      color: '#B45309',
                      fontWeight: 800,
                      fontSize: '0.75rem',
                      border: '1px solid #FDE68A',
                    }}>
                      <Clock size={14} />
                      <span>Active • Awaiting Review</span>
                    </span>
                  )}
                </div>
              </div>

              {/* 2-Column Responsive Body */}
              <div className="quote-grid">
                {/* Left Column: Route & Travel Essentials */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                  {/* Confirmed Journey Strip */}
                  <div style={{
                    background: '#F8FAFC',
                    borderRadius: '12px',
                    padding: '0.9rem 1rem',
                    border: '1px solid #E2E8F0',
                  }}>
                    <div style={{ fontSize: '0.68rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', marginBottom: '0.5rem', letterSpacing: '0.04em' }}>
                      Confirmed Route & Journey
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <MapPin size={16} color="#16A34A" style={{ flexShrink: 0 }} />
                        <span style={{ fontSize: '0.78rem', color: '#64748B' }}>Pickup:</span>
                        <strong style={{ fontSize: '0.92rem', color: '#0F172A' }}>{quote.pickup}</strong>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <MapPin size={16} color="#0284C7" style={{ flexShrink: 0 }} />
                        <span style={{ fontSize: '0.78rem', color: '#64748B' }}>Drop:</span>
                        <strong style={{ fontSize: '0.92rem', color: '#0F172A' }}>{quote.destination}</strong>
                      </div>
                    </div>

                    {/* Metadata Strip */}
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(3, 1fr)',
                      gap: '0.5rem',
                      marginTop: '0.65rem',
                      paddingTop: '0.65rem',
                      borderTop: '1px dashed #CBD5E1',
                    }}>
                      <div>
                        <span style={{ fontSize: '0.68rem', color: '#64748B', display: 'block' }}>Date</span>
                        <strong style={{ fontSize: '0.82rem', color: '#0F172A' }}>{quote.travelDate}</strong>
                      </div>
                      <div>
                        <span style={{ fontSize: '0.68rem', color: '#64748B', display: 'block' }}>Vehicle</span>
                        <strong style={{ fontSize: '0.82rem', color: '#0F172A' }}>{quote.vehicleName || quote.vehicleCategory}</strong>
                      </div>
                      <div>
                        <span style={{ fontSize: '0.68rem', color: '#64748B', display: 'block' }}>Type</span>
                        <strong style={{ fontSize: '0.82rem', color: '#0F172A' }}>{quote.tripType?.replace('_', ' ')}</strong>
                      </div>
                    </div>
                  </div>

                  {/* Additional Conditional Charges (Compact Strip) */}
                  <div style={{
                    padding: '0.75rem 0.9rem',
                    background: '#F8FAFC',
                    border: '1px solid #E2E8F0',
                    borderRadius: '10px',
                    fontSize: '0.78rem',
                  }}>
                    <div style={{ fontWeight: 800, color: '#0F172A', marginBottom: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.75rem' }}>
                      <Info size={13} color="#0284C7" />
                      <span>Additional Charges (If Applicable)</span>
                    </div>

                    {quote.additionalCharges?.isConfigured ? (
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.5rem', flexWrap: 'wrap', color: '#334155', fontWeight: 600 }}>
                          {quote.additionalCharges.extraKmRate > 0 && (
                            <span>Extra Km: <strong>₹{quote.additionalCharges.extraKmRate}/km</strong></span>
                          )}
                          {quote.additionalCharges.extraHourRate > 0 && (
                            <span>Extra Hr: <strong>₹{quote.additionalCharges.extraHourRate}/hr</strong></span>
                          )}
                          {quote.additionalCharges.includedKm > 0 && (
                            <span>Package: <strong>{quote.additionalCharges.includedKm} km</strong></span>
                          )}
                        </div>
                        <div style={{ fontSize: '0.7rem', color: '#64748B', marginTop: '0.25rem', fontStyle: 'italic' }}>
                          * Applies only if journey exceeds agreed package limits. Excluded from quoted total.
                        </div>
                      </div>
                    ) : (
                      <div style={{ fontSize: '0.72rem', color: '#64748B', fontStyle: 'italic' }}>
                        Standard extra km and hourly rates apply based on actual travel beyond corridor limits.
                      </div>
                    )}
                  </div>

                  {/* Zero Advance Notice */}
                  <div style={{
                    background: '#EFF6FF',
                    border: '1px solid #BFDBFE',
                    borderRadius: '10px',
                    padding: '0.65rem 0.85rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                  }}>
                    <ShieldCheck size={18} color="#1D4ED8" style={{ flexShrink: 0 }} />
                    <div style={{ fontSize: '0.75rem', color: '#1E40AF', lineHeight: 1.35 }}>
                      <strong>Zero Advance Required:</strong> Pay directly to chauffeur on vehicle arrival (Cash / UPI).
                    </div>
                  </div>
                </div>

                {/* Right Column: Fare Breakdown & Immediate Action CTAs */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {/* Fare Summary Box */}
                  <div style={{
                    background: '#FFFFFF',
                    borderRadius: '12px',
                    border: '1.5px solid #CBD5E1',
                    padding: '0.9rem 1rem',
                  }}>
                    <div style={{ fontSize: '0.7rem', fontWeight: 800, color: '#0F172A', textTransform: 'uppercase', marginBottom: '0.5rem', letterSpacing: '0.04em' }}>
                      Itemized Fare Details
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', fontSize: '0.82rem', color: '#475569' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>Base Vehicle & Chauffeur:</span>
                        <strong style={{ color: '#0F172A' }}>₹{parseFloat(quote.baseFare || 0).toFixed(2)}</strong>
                      </div>
                      {quote.tollCharges > 0 && (
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span>Highway Tolls & Taxes:</span>
                          <strong style={{ color: '#0F172A' }}>₹{parseFloat(quote.tollCharges).toFixed(2)}</strong>
                        </div>
                      )}
                      {quote.parkingCharges > 0 && (
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span>Airport / Station Parking:</span>
                          <strong style={{ color: '#0F172A' }}>₹{parseFloat(quote.parkingCharges).toFixed(2)}</strong>
                        </div>
                      )}
                      {quote.driverAllowance > 0 && (
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span>Driver Bata:</span>
                          <strong style={{ color: '#0F172A' }}>₹{parseFloat(quote.driverAllowance).toFixed(2)}</strong>
                        </div>
                      )}

                      <div style={{
                        marginTop: '0.4rem',
                        paddingTop: '0.55rem',
                        borderTop: '2px solid #E2E8F0',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'baseline',
                      }}>
                        <div>
                          <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#0284C7', textTransform: 'uppercase', display: 'block' }}>
                            Total Quoted Fare
                          </span>
                          <span style={{ fontSize: '0.68rem', color: '#94A3B8' }}>
                            Payable on Arrival
                          </span>
                        </div>
                        <span style={{ fontSize: '1.45rem', fontWeight: 900, color: '#0F172A' }}>
                          ₹{parseFloat(quote.totalFare || 0).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Immediate Action Buttons (NO SCROLLING NEEDED) */}
                  {quote.status === 'QUOTED' && !quote.isExpired ? (
                    <div>
                      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.4rem' }}>
                        <button
                          onClick={handleAccept}
                          disabled={actionLoading}
                          style={{
                            flex: 2,
                            padding: '0.75rem 1rem',
                            borderRadius: '10px',
                            background: 'linear-gradient(135deg, #16A34A 0%, #15803D 100%)',
                            color: '#FFFFFF',
                            border: 'none',
                            fontWeight: 800,
                            fontSize: '0.92rem',
                            cursor: actionLoading ? 'not-allowed' : 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.4rem',
                            boxShadow: '0 4px 12px rgba(22, 163, 74, 0.25)',
                          }}
                        >
                          {actionLoading ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle size={16} />}
                          <span>Accept Quotation</span>
                        </button>

                        <button
                          onClick={() => setIsDeclineModalOpen(true)}
                          disabled={actionLoading}
                          style={{
                            flex: 1,
                            padding: '0.75rem 0.65rem',
                            borderRadius: '10px',
                            background: '#FFFFFF',
                            color: '#64748B',
                            border: '1px solid #CBD5E1',
                            fontWeight: 700,
                            fontSize: '0.82rem',
                            cursor: actionLoading ? 'not-allowed' : 'pointer',
                          }}
                        >
                          <span>Decline</span>
                        </button>
                      </div>

                      {quote.validUntil && (
                        <div style={{ fontSize: '0.68rem', color: '#64748B', textAlign: 'center' }}>
                          <Clock size={11} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '0.25rem' }} />
                          <span>Valid until: <strong>{new Date(quote.validUntil).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'medium', timeStyle: 'short' })}</strong></span>
                        </div>
                      )}
                    </div>
                  ) : quote.status === 'ACCEPTED' ? (
                    <div style={{
                      padding: '0.85rem',
                      borderRadius: '10px',
                      background: '#F0FDF4',
                      border: '1.5px solid #86EFAC',
                      textAlign: 'center',
                    }}>
                      <CheckCircle size={22} color="#16A34A" style={{ margin: '0 auto 0.25rem auto' }} />
                      <div style={{ fontWeight: 800, color: '#15803D', fontSize: '0.92rem' }}>
                        {quote.bookingRef ? `Booking Confirmed (#${quote.bookingRef})` : 'Quotation Accepted'}
                      </div>
                      <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.75rem', color: '#166534' }}>
                        Our operations desk has scheduled your vehicle. Driver collects fare upon arrival.
                      </p>
                    </div>
                  ) : quote.status === 'DECLINED' ? (
                    <div style={{
                      padding: '0.85rem',
                      borderRadius: '10px',
                      background: '#F8FAFC',
                      border: '1px solid #CBD5E1',
                      textAlign: 'center',
                    }}>
                      <div style={{ fontWeight: 800, color: '#475569', fontSize: '0.88rem' }}>
                        Quotation Declined
                      </div>
                    </div>
                  ) : null}

                  {/* Quick Contact Desk Links */}
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    paddingTop: '0.45rem',
                    borderTop: '1px solid #F1F5F9',
                    fontSize: '0.74rem',
                    color: '#64748B',
                  }}>
                    <span>Direct Desk:</span>
                    <div style={{ display: 'flex', gap: '0.65rem' }}>
                      <a
                        href={`tel:${businessConfig.phone}`}
                        style={{ color: '#0284C7', textDecoration: 'none', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}
                      >
                        <Phone size={12} />
                        <span>Call</span>
                      </a>
                      <a
                        href={`https://wa.me/${businessConfig.whatsapp}?text=${encodeURIComponent(
                          `Hello AJ Travels, I have a question regarding Quotation #${quote.quoteRef}.`
                        )}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ color: '#16A34A', textDecoration: 'none', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}
                      >
                        <MessageSquare size={12} />
                        <span>WhatsApp</span>
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Decline Reason Modal */}
      {isDeclineModalOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(15, 23, 42, 0.6)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem',
          zIndex: 9999,
        }}>
          <div style={{
            background: '#FFFFFF',
            borderRadius: '14px',
            maxWidth: '420px',
            width: '100%',
            padding: '1.25rem',
            boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
          }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0F172A', margin: '0 0 0.4rem 0' }}>
              Decline Quotation
            </h3>
            <p style={{ fontSize: '0.78rem', color: '#64748B', margin: '0 0 0.85rem 0' }}>
              Please let us know why you are declining so we can provide a more suitable travel option.
            </p>

            <textarea
              rows={3}
              value={declineReason}
              onChange={(e) => setDeclineReason(e.target.value)}
              placeholder="e.g. Travel dates changed, found alternative transport, budget constraints..."
              style={{
                width: '100%',
                padding: '0.6rem',
                borderRadius: '8px',
                border: '1px solid #CBD5E1',
                fontSize: '0.82rem',
                marginBottom: '1rem',
                fontFamily: 'inherit',
                boxSizing: 'border-box',
              }}
            />

            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setIsDeclineModalOpen(false)}
                disabled={actionLoading}
                style={{
                  padding: '0.5rem 0.85rem',
                  borderRadius: '8px',
                  border: '1px solid #CBD5E1',
                  background: '#FFFFFF',
                  color: '#475569',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleDecline}
                disabled={actionLoading}
                style={{
                  padding: '0.5rem 0.85rem',
                  borderRadius: '8px',
                  border: 'none',
                  background: '#EF4444',
                  color: '#FFFFFF',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                Confirm Decline
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
