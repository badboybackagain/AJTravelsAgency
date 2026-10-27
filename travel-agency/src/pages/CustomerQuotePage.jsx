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
  FileText
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
      await quoteApi.accept(token);
      setQuote((prev) => ({
        ...prev,
        status: 'ACCEPTED',
        acceptedAt: new Date().toISOString(),
      }));
      setActionMessage({
        type: 'success',
        text: 'Thank you! You have accepted this quotation. Our dispatch team will confirm vehicle allocation shortly.',
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
      background: '#F8F9FA',
      color: '#1E293B',
      fontFamily: "'Inter', sans-serif",
    }}>
      <Header isDark={false} />

      <main style={{
        flex: 1,
        maxWidth: '720px',
        width: '100%',
        margin: '0 auto',
        padding: '2.5rem 1rem 4rem 1rem',
      }}>
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
            borderRadius: '20px',
            padding: '3rem 2rem',
            border: '1px solid #E2E8F0',
            textAlign: 'center',
            boxShadow: '0 10px 30px rgba(0,0,0,0.04)',
          }}>
            <AlertCircle size={44} color="#EF4444" style={{ margin: '0 auto 1rem auto' }} />
            <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0F172A', margin: '0 0 0.5rem 0' }}>
              Quotation Unavailable
            </h1>
            <p style={{ fontSize: '0.9rem', color: '#64748B', lineHeight: 1.6, maxWidth: '440px', margin: '0 auto 1.75rem auto' }}>
              {error}
            </p>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link
                to="/fare"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  padding: '0.75rem 1.5rem',
                  borderRadius: '10px',
                  backgroundColor: '#0284C7',
                  color: '#FFFFFF',
                  fontWeight: 700,
                  fontSize: '0.88rem',
                  textDecoration: 'none',
                }}
              >
                <span>Check Live Fares</span>
                <ChevronRight size={16} />
              </Link>
              <a
                href={`https://wa.me/${businessConfig.whatsapp}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  padding: '0.75rem 1.5rem',
                  borderRadius: '10px',
                  backgroundColor: '#25D366',
                  color: '#FFFFFF',
                  fontWeight: 700,
                  fontSize: '0.88rem',
                  textDecoration: 'none',
                }}
              >
                <MessageSquare size={16} />
                <span>Chat with AJ Travels</span>
              </a>
            </div>
          </div>
        ) : (
          <div>
            {/* Feedback Message */}
            {actionMessage && (
              <div style={{
                marginBottom: '1.25rem',
                padding: '1rem 1.25rem',
                borderRadius: '12px',
                fontSize: '0.88rem',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                backgroundColor: actionMessage.type === 'success' ? '#DCFCE7' : actionMessage.type === 'info' ? '#E0F2FE' : '#FEE2E2',
                color: actionMessage.type === 'success' ? '#15803D' : actionMessage.type === 'info' ? '#0369A1' : '#991B1B',
                border: `1px solid ${actionMessage.type === 'success' ? '#BBF7D0' : actionMessage.type === 'info' ? '#BAE6FD' : '#FECACA'}`,
              }}>
                {actionMessage.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
                <span>{actionMessage.text}</span>
              </div>
            )}

            {/* Top Card: Brand & Quotation Header */}
            <div style={{
              background: '#FFFFFF',
              borderRadius: '20px',
              padding: '1.75rem',
              border: '1px solid #E2E8F0',
              boxShadow: '0 10px 30px rgba(0,0,0,0.04)',
              marginBottom: '1.25rem',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', borderBottom: '1px solid #F1F5F9', paddingBottom: '1.25rem', marginBottom: '1.25rem' }}>
                <div>
                  <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#0284C7', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    AJ Travels Pune • Official Quotation
                  </span>
                  <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0F172A', margin: '0.2rem 0 0 0' }}>
                    Trip Quotation #{quote.quoteRef}
                  </h1>
                  <span style={{ fontSize: '0.75rem', color: '#64748B', display: 'block', marginTop: '0.2rem' }}>
                    Prepared for: <strong>{quote.customerName}</strong> ({quote.maskedPhone})
                  </span>
                </div>

                {/* Status Badge */}
                <div>
                  {quote.status === 'ACCEPTED' ? (
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      padding: '0.4rem 0.85rem',
                      borderRadius: '9999px',
                      backgroundColor: '#DCFCE7',
                      color: '#15803D',
                      fontWeight: 800,
                      fontSize: '0.8rem',
                      border: '1px solid #BBF7D0',
                    }}>
                      <CheckCircle size={15} />
                      <span>Quotation Accepted</span>
                    </span>
                  ) : quote.status === 'DECLINED' ? (
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      padding: '0.4rem 0.85rem',
                      borderRadius: '9999px',
                      backgroundColor: '#F1F5F9',
                      color: '#64748B',
                      fontWeight: 800,
                      fontSize: '0.8rem',
                      border: '1px solid #E2E8F0',
                    }}>
                      <X size={15} />
                      <span>Quotation Declined</span>
                    </span>
                  ) : quote.status === 'SUPERSEDED' ? (
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      padding: '0.4rem 0.85rem',
                      borderRadius: '9999px',
                      backgroundColor: '#F1F5F9',
                      color: '#475569',
                      fontWeight: 800,
                      fontSize: '0.8rem',
                      border: '1px solid #CBD5E1',
                    }}>
                      <Clock size={15} />
                      <span>Superseded by Newer Quote</span>
                    </span>
                  ) : quote.isExpired || quote.status === 'EXPIRED' ? (
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      padding: '0.4rem 0.85rem',
                      borderRadius: '9999px',
                      backgroundColor: '#FEE2E2',
                      color: '#991B1B',
                      fontWeight: 800,
                      fontSize: '0.8rem',
                      border: '1px solid #FECACA',
                    }}>
                      <Clock size={15} />
                      <span>Expired</span>
                    </span>
                  ) : (
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      padding: '0.4rem 0.85rem',
                      borderRadius: '9999px',
                      backgroundColor: '#FEF3C7',
                      color: '#B45309',
                      fontWeight: 800,
                      fontSize: '0.8rem',
                      border: '1px solid #FDE68A',
                    }}>
                      <Clock size={15} />
                      <span>Active • Awaiting Review</span>
                    </span>
                  )}
                </div>
              </div>

              {/* Journey Route Card */}
              <div style={{
                background: '#F8FAFC',
                borderRadius: '14px',
                padding: '1.25rem',
                border: '1px solid #E2E8F0',
                marginBottom: '1.25rem',
              }}>
                <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', marginBottom: '0.75rem' }}>
                  Confirmed Route & Journey Details
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.65rem' }}>
                    <MapPin size={18} color="#16A34A" style={{ marginTop: '0.15rem' }} />
                    <div>
                      <span style={{ fontSize: '0.72rem', color: '#94A3B8', display: 'block' }}>Pickup Location</span>
                      <strong style={{ fontSize: '0.98rem', color: '#0F172A' }}>{quote.pickup}</strong>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.65rem' }}>
                    <MapPin size={18} color="#0284C7" style={{ marginTop: '0.15rem' }} />
                    <div>
                      <span style={{ fontSize: '0.72rem', color: '#94A3B8', display: 'block' }}>Destination</span>
                      <strong style={{ fontSize: '0.98rem', color: '#0F172A' }}>{quote.destination}</strong>
                    </div>
                  </div>
                </div>

                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                  gap: '0.75rem',
                  marginTop: '1rem',
                  paddingTop: '1rem',
                  borderTop: '1px dashed #CBD5E1',
                }}>
                  <div>
                    <span style={{ fontSize: '0.7rem', color: '#64748B', display: 'block' }}>Travel Date</span>
                    <strong style={{ fontSize: '0.88rem', color: '#0F172A' }}>{quote.travelDate}</strong>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.7rem', color: '#64748B', display: 'block' }}>Vehicle Category</span>
                    <strong style={{ fontSize: '0.88rem', color: '#0F172A' }}>{quote.vehicleName || quote.vehicleCategory}</strong>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.7rem', color: '#64748B', display: 'block' }}>Trip Type</span>
                    <strong style={{ fontSize: '0.88rem', color: '#0F172A' }}>{quote.tripType?.replace('_', ' ')}</strong>
                  </div>
                </div>
              </div>

              {/* Itemized Fare Breakdown */}
              <div style={{
                background: '#FFFFFF',
                borderRadius: '14px',
                border: '1.5px solid #E2E8F0',
                padding: '1.25rem',
                marginBottom: '1.25rem',
              }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#0F172A', textTransform: 'uppercase', marginBottom: '0.85rem' }}>
                  Itemized Fare Breakdown
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem', color: '#475569' }}>
                    <span>Base Vehicle & Chauffeur Fare:</span>
                    <strong style={{ color: '#0F172A' }}>₹{parseFloat(quote.baseFare || 0).toFixed(2)}</strong>
                  </div>
                  {quote.tollCharges > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem', color: '#475569' }}>
                      <span>Highway Tolls & State Taxes:</span>
                      <strong style={{ color: '#0F172A' }}>₹{parseFloat(quote.tollCharges).toFixed(2)}</strong>
                    </div>
                  )}
                  {quote.driverAllowance > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem', color: '#475569' }}>
                      <span>Driver Bata / Night Allowance:</span>
                      <strong style={{ color: '#0F172A' }}>₹{parseFloat(quote.driverAllowance).toFixed(2)}</strong>
                    </div>
                  )}
                  {quote.parkingCharges > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem', color: '#475569' }}>
                      <span>Airport / Station Parking:</span>
                      <strong style={{ color: '#0F172A' }}>₹{parseFloat(quote.parkingCharges).toFixed(2)}</strong>
                    </div>
                  )}

                  <div style={{
                    marginTop: '0.5rem',
                    paddingTop: '0.75rem',
                    borderTop: '2px solid #E2E8F0',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}>
                    <div>
                      <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#0284C7', textTransform: 'uppercase', display: 'block' }}>
                        Total Quoted Fare
                      </span>
                      <span style={{ fontSize: '0.7rem', color: '#94A3B8' }}>
                        All inclusive as per agreed terms
                      </span>
                    </div>
                    <span style={{ fontSize: '1.45rem', fontWeight: 900, color: '#0F172A' }}>
                      ₹{parseFloat(quote.totalFare || 0).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Inclusions & Terms */}
              <div style={{
                background: '#F8FAFC',
                borderRadius: '12px',
                padding: '1rem',
                border: '1px solid #E2E8F0',
                marginBottom: '1.5rem',
                fontSize: '0.8rem',
                lineHeight: 1.5,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#16A34A', fontWeight: 700, marginBottom: '0.35rem' }}>
                  <ShieldCheck size={16} />
                  <span>Inclusions & Quality Guarantee:</span>
                </div>
                <p style={{ margin: '0 0 0.5rem 0', color: '#475569' }}>
                  {quote.inclusions || 'Vehicle rental, fuel, experienced chauffeur, and highway tolls.'}
                </p>

                {quote.exclusions && (
                  <>
                    <div style={{ fontWeight: 700, color: '#B45309', marginBottom: '0.25rem' }}>
                      Exclusions:
                    </div>
                    <p style={{ margin: 0, color: '#78350F' }}>{quote.exclusions}</p>
                  </>
                )}
              </div>

              {/* Payment Transparency Notice */}
              <div style={{
                background: '#EFF6FF',
                border: '1px solid #BFDBFE',
                borderRadius: '12px',
                padding: '0.85rem 1rem',
                marginBottom: '1.5rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
              }}>
                <ShieldCheck size={22} color="#1D4ED8" style={{ flexShrink: 0 }} />
                <div style={{ fontSize: '0.8rem', color: '#1E40AF', lineHeight: 1.45 }}>
                  <strong>Zero Advance Payment Required:</strong> Accepting this quotation does not require advance card or UPI payment. You pay directly to the chauffeur upon vehicle arrival.
                </div>
              </div>

              {/* Validity Info */}
              {quote.validUntil && quote.status === 'QUOTED' && !quote.isExpired && (
                <div style={{ fontSize: '0.75rem', color: '#64748B', textAlign: 'center', marginBottom: '1.5rem' }}>
                  <Clock size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '0.3rem' }} />
                  <span>This quotation is valid until: <strong>{new Date(quote.validUntil).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'medium', timeStyle: 'short' })}</strong></span>
                </div>
              )}

              {/* Action Buttons (Strictly when QUOTED and not expired) */}
              {quote.status === 'QUOTED' && !quote.isExpired ? (
                <div style={{ display: 'flex', gap: '0.85rem', flexWrap: 'wrap' }}>
                  <button
                    onClick={handleAccept}
                    disabled={actionLoading}
                    style={{
                      flex: 2,
                      minWidth: '200px',
                      padding: '0.85rem 1.5rem',
                      borderRadius: '12px',
                      background: 'linear-gradient(135deg, #16A34A 0%, #15803D 100%)',
                      color: '#FFFFFF',
                      border: 'none',
                      fontWeight: 800,
                      fontSize: '0.95rem',
                      cursor: actionLoading ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.5rem',
                      boxShadow: '0 4px 14px rgba(22, 163, 74, 0.3)',
                    }}
                  >
                    {actionLoading ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle size={18} />}
                    <span>Accept Quotation</span>
                  </button>

                  <button
                    onClick={() => setIsDeclineModalOpen(true)}
                    disabled={actionLoading}
                    style={{
                      flex: 1,
                      minWidth: '120px',
                      padding: '0.85rem 1rem',
                      borderRadius: '12px',
                      background: '#FFFFFF',
                      color: '#64748B',
                      border: '1.5px solid #CBD5E1',
                      fontWeight: 700,
                      fontSize: '0.88rem',
                      cursor: actionLoading ? 'not-allowed' : 'pointer',
                    }}
                  >
                    <span>Decline Quote</span>
                  </button>
                </div>
              ) : quote.status === 'ACCEPTED' ? (
                <div style={{
                  padding: '1.25rem',
                  borderRadius: '12px',
                  background: '#F0FDF4',
                  border: '1.5px solid #86EFAC',
                  textAlign: 'center',
                }}>
                  <CheckCircle size={28} color="#16A34A" style={{ margin: '0 auto 0.5rem auto' }} />
                  <div style={{ fontWeight: 800, color: '#15803D', fontSize: '1rem', marginBottom: '0.25rem' }}>
                    Quotation Accepted
                  </div>
                  <p style={{ margin: 0, fontSize: '0.82rem', color: '#166534' }}>
                    Accepted on {new Date(quote.acceptedAt || Date.now()).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'medium', timeStyle: 'short' })}. Our dispatch team is allocating your executive cab.
                  </p>
                </div>
              ) : quote.status === 'SUPERSEDED' ? (
                <div style={{
                  padding: '1.25rem',
                  borderRadius: '12px',
                  background: '#F8FAFC',
                  border: '1.5px solid #CBD5E1',
                  textAlign: 'center',
                }}>
                  <AlertCircle size={28} color="#64748B" style={{ margin: '0 auto 0.5rem auto' }} />
                  <div style={{ fontWeight: 800, color: '#334155', fontSize: '1rem', marginBottom: '0.25rem' }}>
                    Quotation Superseded
                  </div>
                  <p style={{ margin: 0, fontSize: '0.82rem', color: '#64748B' }}>
                    A more recent quotation has been issued for this trip enquiry. Please check your latest quote link or contact AJ Travels.
                  </p>
                </div>
              ) : null}

              {/* Direct Support Quick Links */}
              <div style={{
                marginTop: '1.75rem',
                paddingTop: '1.25rem',
                borderTop: '1px solid #F1F5F9',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '0.75rem',
                fontSize: '0.8rem',
                color: '#64748B',
              }}>
                <span>Questions about this quote?</span>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <a
                    href={`tel:${businessConfig.phone}`}
                    style={{ color: '#0284C7', textDecoration: 'none', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}
                  >
                    <Phone size={14} />
                    <span>{businessConfig.phoneDisplay}</span>
                  </a>
                  <a
                    href={`https://wa.me/${businessConfig.whatsapp}?text=${encodeURIComponent(
                      `Hello AJ Travels, I have a question regarding Quotation #Q-${quote.quoteRef}.`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: '#16A34A', textDecoration: 'none', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}
                  >
                    <MessageSquare size={14} />
                    <span>WhatsApp Desk</span>
                  </a>
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
            borderRadius: '16px',
            maxWidth: '440px',
            width: '100%',
            padding: '1.5rem',
            boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
          }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0F172A', margin: '0 0 0.5rem 0' }}>
              Decline Quotation
            </h3>
            <p style={{ fontSize: '0.82rem', color: '#64748B', margin: '0 0 1rem 0' }}>
              Please let us know why you are declining so we can provide a more suitable travel option.
            </p>

            <textarea
              rows={3}
              value={declineReason}
              onChange={(e) => setDeclineReason(e.target.value)}
              placeholder="e.g. Travel dates changed, found alternative transport, budget constraints..."
              style={{
                width: '100%',
                padding: '0.65rem',
                borderRadius: '8px',
                border: '1px solid #CBD5E1',
                fontSize: '0.85rem',
                marginBottom: '1.25rem',
                fontFamily: 'inherit',
                boxSizing: 'border-box',
              }}
            />

            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setIsDeclineModalOpen(false)}
                disabled={actionLoading}
                style={{
                  padding: '0.55rem 1rem',
                  borderRadius: '8px',
                  border: '1px solid #CBD5E1',
                  background: '#FFFFFF',
                  color: '#475569',
                  fontSize: '0.82rem',
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
                  padding: '0.55rem 1rem',
                  borderRadius: '8px',
                  border: 'none',
                  background: '#EF4444',
                  color: '#FFFFFF',
                  fontSize: '0.82rem',
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
