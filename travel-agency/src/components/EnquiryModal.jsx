import React, { useState, useEffect } from 'react';
import {
  X,
  Send,
  MessageSquare,
  CheckCircle,
  User,
  Phone,
  MapPin,
  Calendar,
  Car,
  Loader2,
  AlertCircle,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  FileText
} from 'lucide-react';
import { getWhatsAppLink } from '../utils/whatsapp';
import { enquiryApi } from '../services/api';

export const EnquiryModal = ({ isOpen, onClose, initialData = null }) => {
  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    phone: initialData?.phone || '',
    pickup: initialData?.pickup || '',
    destination: initialData?.destination || '',
    date: initialData?.date || '',
    vehicle: initialData?.vehicle || 'Executive Sedan',
    message: initialData?.message || ''
  });

  useEffect(() => {
    if (initialData && isOpen) {
      setFormData((prev) => ({
        ...prev,
        name: initialData.name || prev.name,
        phone: initialData.phone || prev.phone,
        pickup: initialData.pickup || prev.pickup,
        destination: initialData.destination || prev.destination,
        date: initialData.date || prev.date,
        vehicle: initialData.vehicle || prev.vehicle,
        message: initialData.message || prev.message,
      }));
    }
  }, [initialData, isOpen]);

  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (errorMsg) setErrorMsg('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    const cleanPhone = (formData.phone || '').replace(/\D/g, '');
    if (cleanPhone.length !== 10) {
      setErrorMsg('Please enter a valid 10-digit mobile number.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');
    try {
      await enquiryApi.create({
        name: formData.name.trim(),
        phone: cleanPhone,
        pickup: formData.pickup.trim(),
        destination: formData.destination.trim(),
        travelDate: formData.date || undefined,
        vehicle: formData.vehicle,
        message: formData.message?.trim() || undefined,
      });
      setSubmitted(true);
    } catch (err) {
      console.error('Enquiry submission error:', err);
      setErrorMsg(
        err.response?.data?.message ||
        'Failed to submit enquiry. Please try again or reach out directly on WhatsApp.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentWALink = getWhatsAppLink({
    from: formData.pickup || 'Pune',
    to: formData.destination || 'Mumbai',
    pickup: formData.pickup,
    destination: formData.destination,
    date: formData.date || 'Flexible',
    vehicle: formData.vehicle,
    tripType: 'Enquiry'
  });

  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="enquiry-modal-title">
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        {/* Top Accent Gradient Bar */}
        <div className="modal-top-accent" />

        {/* Close Button */}
        <button className="modal-close-btn" onClick={onClose} aria-label="Close modal" type="button">
          <X size={18} />
        </button>

        {submitted ? (
          /* ================================================= */
          /* SUCCESS STATE: Polished Confirmation Ticket View  */
          /* ================================================= */
          <div className="modal-success-state">
            <div className="success-icon-wrapper">
              <CheckCircle size={44} className="success-icon" />
            </div>

            <div className="success-badge">
              <Sparkles size={13} />
              <span>ENQUIRY DISPATCHED SUCCESSFULLY</span>
            </div>

            <h3 id="enquiry-modal-title" className="success-title">
              Trip Enquiry Received!
            </h3>

            <p className="success-subtitle">
              Thank you, <strong>{formData.name}</strong>. Our Pune–Mumbai travel desk is calculating your exact all-inclusive fare and will contact you on <strong>{formData.phone}</strong> shortly.
            </p>

            {/* Ticket Summary Card */}
            <div className="success-summary-card">
              <div className="summary-row">
                <span className="summary-label">Route</span>
                <span className="summary-val">
                  <strong>{formData.pickup || 'Pune'}</strong>
                  <ArrowRight size={14} className="summary-arrow" />
                  <strong>{formData.destination || 'Mumbai'}</strong>
                </span>
              </div>
              <div className="summary-row">
                <span className="summary-label">Vehicle</span>
                <span className="summary-val">{formData.vehicle}</span>
              </div>
              {formData.date && (
                <div className="summary-row">
                  <span className="summary-label">Date</span>
                  <span className="summary-val">{formData.date}</span>
                </div>
              )}
            </div>

            <div className="modal-success-actions">
              <a
                href={currentWALink}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-modal-wa"
              >
                <MessageSquare size={16} /> Connect on WhatsApp
              </a>
              <button
                type="button"
                onClick={() => {
                  setSubmitted(false);
                  onClose();
                }}
                className="btn-modal-close"
              >
                Close Window
              </button>
            </div>
          </div>
        ) : (
          /* ================================================= */
          /* FORM STATE: Refined, Responsive 2-Column Inputs   */
          /* ================================================= */
          <div className="modal-body-container">
            {/* Header */}
            <div className="modal-header">
              <div className="modal-eyebrow-pill">
                <ShieldCheck size={13} />
                <span>OFFICIAL TRAVEL DESK • BEST PRICE GUARANTEE</span>
              </div>
              <h3 id="enquiry-modal-title" className="modal-title">
                Check Availability & Get Fare
              </h3>
              <p className="modal-subtitle">
                Enter your journey requirements to receive instant vehicle confirmation and fixed all-inclusive rates.
              </p>
            </div>

            {/* Error Notification */}
            {errorMsg && (
              <div className="modal-error-alert" role="alert">
                <AlertCircle size={16} className="error-alert-icon" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Main Form */}
            <form onSubmit={handleSubmit} className="modal-form" noValidate={false}>
              <div className="modal-form-grid">
                {/* 1. Full Name */}
                <div className="form-group">
                  <label htmlFor="modal-enquiry-name">
                    <User size={13} className="label-icon text-gold" />
                    <span>Full Name <span className="req">*</span></span>
                  </label>
                  <div className="input-with-icon">
                    <input
                      id="modal-enquiry-name"
                      type="text"
                      name="name"
                      required
                      placeholder="e.g. Rahul Sharma"
                      value={formData.name}
                      onChange={handleChange}
                      disabled={isSubmitting}
                      className="modal-input"
                    />
                  </div>
                </div>

                {/* 2. Mobile Number */}
                <div className="form-group">
                  <label htmlFor="modal-enquiry-phone">
                    <Phone size={13} className="label-icon text-gold" />
                    <span>WhatsApp Number <span className="req">*</span></span>
                  </label>
                  <div className="input-with-icon">
                    <input
                      id="modal-enquiry-phone"
                      type="tel"
                      name="phone"
                      required
                      maxLength="10"
                      placeholder="10-digit mobile number"
                      value={formData.phone}
                      onChange={handleChange}
                      disabled={isSubmitting}
                      className="modal-input"
                    />
                  </div>
                </div>

                {/* 3. Pickup Location */}
                <div className="form-group">
                  <label htmlFor="modal-enquiry-pickup">
                    <MapPin size={13} className="label-icon text-green" />
                    <span>Pickup Location <span className="req">*</span></span>
                  </label>
                  <div className="input-with-icon">
                    <input
                      id="modal-enquiry-pickup"
                      type="text"
                      name="pickup"
                      required
                      placeholder="e.g. Pune Airport / Wakad / Baner"
                      value={formData.pickup}
                      onChange={handleChange}
                      disabled={isSubmitting}
                      className="modal-input"
                    />
                  </div>
                </div>

                {/* 4. Drop Location */}
                <div className="form-group">
                  <label htmlFor="modal-enquiry-dest">
                    <MapPin size={13} className="label-icon text-blue" />
                    <span>Drop Destination <span className="req">*</span></span>
                  </label>
                  <div className="input-with-icon">
                    <input
                      id="modal-enquiry-dest"
                      type="text"
                      name="destination"
                      required
                      placeholder="e.g. Mumbai Airport / BKC / Dadar"
                      value={formData.destination}
                      onChange={handleChange}
                      disabled={isSubmitting}
                      className="modal-input"
                    />
                  </div>
                </div>

                {/* 5. Travel Date */}
                <div className="form-group">
                  <label htmlFor="modal-enquiry-date">
                    <Calendar size={13} className="label-icon text-gold" />
                    <span>Travel Date</span>
                  </label>
                  <div className="input-with-icon">
                    <input
                      id="modal-enquiry-date"
                      type="date"
                      name="date"
                      min={new Date().toISOString().split('T')[0]}
                      value={formData.date}
                      onChange={handleChange}
                      disabled={isSubmitting}
                      className="modal-input"
                    />
                  </div>
                </div>

                {/* 6. Vehicle Choice */}
                <div className="form-group">
                  <label htmlFor="modal-enquiry-vehicle">
                    <Car size={13} className="label-icon text-gold" />
                    <span>Preferred Fleet Vehicle</span>
                  </label>
                  <div className="select-with-arrow">
                    <select
                      id="modal-enquiry-vehicle"
                      name="vehicle"
                      value={formData.vehicle}
                      onChange={handleChange}
                      disabled={isSubmitting}
                      className="modal-select"
                    >
                      <option value="Executive Sedan">Executive Sedan (Dzire / Etios • 4+1)</option>
                      <option value="Spacious SUV">Spacious SUV (Ertiga / Carens • 6+1)</option>
                      <option value="Premium Luxury">Premium Innova Crysta (7+1 Chauffeur)</option>
                      <option value="Luxury Mini Bus">Executive Tempo Traveller (12 - 20 Seater)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* 7. Special Notes (Optional, Full Width) */}
              <div className="form-group full-width-group">
                <label htmlFor="modal-enquiry-message">
                  <FileText size={13} className="label-icon text-gold" />
                  <span>Trip Notes / Flight Timing <span className="optional">(Optional)</span></span>
                </label>
                <textarea
                  id="modal-enquiry-message"
                  name="message"
                  rows={2}
                  placeholder="e.g. Flight arrives T2 at 11:30 PM, require child car seat or large boot space."
                  value={formData.message}
                  onChange={handleChange}
                  disabled={isSubmitting}
                  className="modal-textarea"
                />
              </div>

              {/* Action Buttons & Submitting Feedback */}
              <div className="modal-actions-wrapper">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`modal-btn-submit ${isSubmitting ? 'submitting' : ''}`}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 size={16} className="modal-spinner" />
                      <span>DISPATCHING ENQUIRY...</span>
                    </>
                  ) : (
                    <>
                      <Send size={15} />
                      <span>GET FREE FARE QUOTE</span>
                    </>
                  )}
                </button>

                <a
                  href={currentWALink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="modal-btn-whatsapp"
                >
                  <MessageSquare size={16} />
                  <span>WHATSAPP CHAT</span>
                </a>
              </div>

              {/* Trust Micro-Row */}
              <div className="modal-trust-strip">
                <span className="trust-item">⚡ 10-Min Response</span>
                <span className="trust-dot">•</span>
                <span className="trust-item">🛡️ Fixed All-Inclusive</span>
                <span className="trust-dot">•</span>
                <span className="trust-item">🚖 24/7 Pune & Mumbai Chauffeurs</span>
              </div>
            </form>
          </div>
        )}
      </div>

      <style>{`
        /* ============================================================ */
        /* AJ Travels — Premium Enquiry Modal Design System             */
        /* ============================================================ */

        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(10, 22, 40, 0.78);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          z-index: 9999;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 1rem;
          animation: modalFadeIn 0.22s ease-out;
        }

        @keyframes modalFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        .modal-content {
          background: #FFFFFF;
          border-radius: 20px;
          width: 100%;
          max-width: 580px;
          padding: 1.65rem 1.85rem;
          position: relative;
          box-shadow: 0 25px 60px -12px rgba(10, 25, 47, 0.35), 0 0 0 1px rgba(226, 232, 240, 0.85);
          overflow: hidden;
          animation: modalSlideUp 0.25s cubic-bezier(0.16, 1, 0.3, 1);
        }

        @keyframes modalSlideUp {
          from {
            opacity: 0;
            transform: translateY(14px) scale(0.985);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        .modal-top-accent {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 4px;
          background: linear-gradient(90deg, #D4AF37 0%, #0284C7 50%, #25D366 100%);
        }

        .modal-close-btn {
          position: absolute;
          top: 1.1rem;
          right: 1.1rem;
          width: 34px;
          height: 34px;
          border-radius: 50%;
          background: #F1F5F9;
          border: 1px solid #E2E8F0;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #64748B;
          cursor: pointer;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          z-index: 2;
        }

        .modal-close-btn:hover {
          background: #E2E8F0;
          color: #0F172A;
          transform: rotate(90deg);
        }

        /* Header Elements */
        .modal-header {
          margin-bottom: 1.15rem;
          padding-right: 2.2rem;
        }

        .modal-eyebrow-pill {
          display: inline-flex;
          align-items: center;
          gap: 0.35rem;
          background: #F0F9FF;
          border: 1px solid #BAE6FD;
          color: #0284C7;
          padding: 0.22rem 0.6rem;
          border-radius: 9999px;
          font-size: 0.68rem;
          font-weight: 800;
          letter-spacing: 0.05em;
          text-transform: uppercase;
          margin-bottom: 0.45rem;
        }

        .modal-title {
          font-family: var(--font-heading, 'Outfit', sans-serif);
          font-size: 1.38rem;
          font-weight: 800;
          color: #0F172A;
          letter-spacing: -0.015em;
          line-height: 1.25;
          margin: 0;
        }

        .modal-subtitle {
          font-size: 0.82rem;
          color: #64748B;
          margin-top: 0.25rem;
          line-height: 1.45;
        }

        /* Error Alert */
        .modal-error-alert {
          background: #FEF2F2;
          border: 1px solid #FCA5A5;
          color: #991B1B;
          border-radius: 10px;
          padding: 0.65rem 0.85rem;
          font-size: 0.82rem;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-bottom: 1rem;
          animation: modalShake 0.3s ease;
        }

        @keyframes modalShake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-4px); }
          75% { transform: translateX(4px); }
        }

        .error-alert-icon {
          flex-shrink: 0;
          color: #DC2626;
        }

        /* Form Grid */
        .modal-form-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 0.8rem 0.9rem;
        }

        .full-width-group {
          margin-top: 0.8rem;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 0.3rem;
        }

        .form-group label {
          font-size: 0.74rem;
          font-weight: 700;
          color: #334155;
          display: flex;
          align-items: center;
          gap: 0.35rem;
          letter-spacing: 0.01em;
        }

        .label-icon {
          flex-shrink: 0;
        }

        .text-gold { color: #C89B3C; }
        .text-green { color: #10B981; }
        .text-blue { color: #0284C7; }

        .req {
          color: #DC2626;
          font-weight: 800;
        }

        .optional {
          color: #94A3B8;
          font-weight: 500;
          font-size: 0.7rem;
        }

        /* Input Controls */
        .modal-input,
        .modal-select,
        .modal-textarea {
          width: 100%;
          padding: 0.62rem 0.8rem;
          border-radius: 10px;
          border: 1.5px solid #E2E8F0;
          font-family: inherit;
          font-size: 0.86rem;
          color: #0F172A;
          background: #F8FAFC;
          outline: none;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          box-sizing: border-box;
        }

        .modal-input::placeholder,
        .modal-textarea::placeholder {
          color: #94A3B8;
          font-size: 0.82rem;
        }

        .modal-input:focus,
        .modal-select:focus,
        .modal-textarea:focus {
          background: #FFFFFF;
          border-color: #0284C7;
          box-shadow: 0 0 0 3px rgba(2, 132, 199, 0.14);
        }

        .modal-input:disabled,
        .modal-select:disabled,
        .modal-textarea:disabled {
          background: #F1F5F9;
          color: #94A3B8;
          cursor: not-allowed;
        }

        .modal-textarea {
          resize: vertical;
          min-height: 54px;
        }

        /* Actions: Submit & WhatsApp */
        .modal-actions-wrapper {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 0.75rem;
          margin-top: 1.15rem;
        }

        .modal-btn-submit {
          background: linear-gradient(135deg, #0A1E3F 0%, #1E3A8A 100%);
          color: #FFFFFF;
          border: 1px solid rgba(255, 255, 255, 0.15);
          font-size: 0.82rem;
          font-weight: 800;
          letter-spacing: 0.04em;
          padding: 0.75rem 1rem;
          border-radius: 11px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.45rem;
          box-shadow: 0 4px 14px rgba(14, 30, 63, 0.25);
          transition: all 0.22s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .modal-btn-submit:hover:not(:disabled) {
          background: linear-gradient(135deg, #0F2D6B 0%, #2563EB 100%);
          transform: translateY(-1.5px);
          box-shadow: 0 6px 20px rgba(37, 99, 235, 0.35);
        }

        .modal-btn-submit:active:not(:disabled) {
          transform: translateY(0);
        }

        .modal-btn-submit.submitting {
          background: linear-gradient(135deg, #1E293B 0%, #334155 100%);
          cursor: wait;
          opacity: 0.92;
        }

        .modal-spinner {
          animation: modalSpin 0.75s linear infinite;
        }

        @keyframes modalSpin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .modal-btn-whatsapp {
          background: #25D366;
          color: #FFFFFF;
          border: none;
          font-size: 0.82rem;
          font-weight: 800;
          letter-spacing: 0.04em;
          padding: 0.75rem 1rem;
          border-radius: 11px;
          text-decoration: none;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.45rem;
          box-shadow: 0 4px 14px rgba(37, 211, 102, 0.25);
          transition: all 0.22s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .modal-btn-whatsapp:hover {
          background: #20BA56;
          color: #FFFFFF;
          transform: translateY(-1.5px);
          box-shadow: 0 6px 20px rgba(37, 211, 102, 0.38);
        }

        /* Trust Strip */
        .modal-trust-strip {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          margin-top: 0.95rem;
          font-size: 0.72rem;
          font-weight: 600;
          color: #64748B;
          flex-wrap: wrap;
        }

        .trust-dot {
          color: #CBD5E1;
        }

        /* Success View Styles */
        .modal-success-state {
          text-align: center;
          padding: 1rem 0.5rem 0.5rem;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.75rem;
        }

        .success-icon-wrapper {
          width: 72px;
          height: 72px;
          border-radius: 50%;
          background: #DCFCE7;
          border: 2px solid #86EFAC;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #16A34A;
          box-shadow: 0 0 0 6px rgba(34, 197, 94, 0.12);
          animation: popScale 0.35s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }

        @keyframes popScale {
          0% { transform: scale(0.65); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }

        .success-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.35rem;
          background: #F0FDF4;
          border: 1px solid #BBF7D0;
          color: #15803D;
          font-size: 0.68rem;
          font-weight: 800;
          letter-spacing: 0.05em;
          padding: 0.2rem 0.6rem;
          border-radius: 9999px;
        }

        .success-title {
          font-family: var(--font-heading, 'Outfit', sans-serif);
          font-size: 1.45rem;
          font-weight: 800;
          color: #0F172A;
          margin: 0;
        }

        .success-subtitle {
          font-size: 0.86rem;
          color: #475569;
          line-height: 1.5;
          max-width: 440px;
          margin: 0;
        }

        .success-summary-card {
          background: #F8FAFC;
          border: 1px dashed #CBD5E1;
          border-radius: 12px;
          padding: 0.85rem 1.15rem;
          width: 100%;
          display: flex;
          flex-direction: column;
          gap: 0.45rem;
          box-sizing: border-box;
          margin: 0.35rem 0;
        }

        .summary-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-size: 0.82rem;
        }

        .summary-label {
          color: #64748B;
          font-weight: 600;
        }

        .summary-val {
          color: #0F172A;
          display: flex;
          align-items: center;
          gap: 0.4rem;
        }

        .summary-arrow {
          color: #0284C7;
        }

        .modal-success-actions {
          display: flex;
          flex-direction: column;
          gap: 0.6rem;
          width: 100%;
          margin-top: 0.5rem;
        }

        .btn-modal-wa {
          background: #25D366;
          color: #FFFFFF;
          padding: 0.75rem 1rem;
          border-radius: 11px;
          font-size: 0.84rem;
          font-weight: 800;
          text-decoration: none;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.45rem;
          box-shadow: 0 4px 14px rgba(37, 211, 102, 0.25);
          transition: all 0.2s ease;
        }

        .btn-modal-wa:hover {
          background: #20BA56;
          transform: translateY(-1.5px);
          box-shadow: 0 6px 18px rgba(37, 211, 102, 0.35);
        }

        .btn-modal-close {
          background: #F1F5F9;
          color: #475569;
          border: 1px solid #E2E8F0;
          padding: 0.65rem 1rem;
          border-radius: 11px;
          font-size: 0.82rem;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .btn-modal-close:hover {
          background: #E2E8F0;
          color: #0F172A;
        }

        /* Mobile Responsive */
        @media (max-width: 620px) {
          .modal-content {
            padding: 1.35rem 1.15rem;
            max-height: 94vh;
            overflow-y: auto;
            border-radius: 18px;
          }

          .modal-form-grid {
            grid-template-columns: 1fr;
            gap: 0.7rem;
          }

          .modal-actions-wrapper {
            grid-template-columns: 1fr;
          }

          .modal-trust-strip {
            font-size: 0.68rem;
          }
        }
      `}</style>
    </div>
  );
};
