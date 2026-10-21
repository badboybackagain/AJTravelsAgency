import React, { useState } from 'react';
import { X, Send, MessageSquare, CheckCircle, User, Phone, MapPin, Calendar, Car, Loader2, AlertCircle } from 'lucide-react';
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

  React.useEffect(() => {
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
    setIsSubmitting(true);
    setErrorMsg('');
    try {
      await enquiryApi.create({
        name: formData.name,
        phone: formData.phone,
        pickup: formData.pickup,
        destination: formData.destination,
        travelDate: formData.date,
        vehicle: formData.vehicle,
        message: formData.message,
      });
      setSubmitted(true);
    } catch (err) {
      console.error('Enquiry submission error:', err);
      setErrorMsg(
        err.response?.data?.message ||
          'Failed to submit enquiry. Please try again or reach out on WhatsApp.'
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
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close-btn" onClick={onClose} aria-label="Close modal">
          <X size={20} />
        </button>

        {submitted ? (
          <div className="modal-success-state">
            <CheckCircle size={52} color="#25D366" />
            <h3>Enquiry Received!</h3>
            <p>
              Thank you, <strong>{formData.name}</strong>. We have received your trip enquiry from <strong>{formData.pickup}</strong> to <strong>{formData.destination}</strong>. Our travel desk will contact your mobile <strong>{formData.phone}</strong> shortly with exact fare details.
            </p>
            <div className="modal-success-actions">
              <a
                href={currentWALink}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-whatsapp btn-full"
              >
                <MessageSquare size={16} /> Continue on WhatsApp
              </a>
              <button
                onClick={() => {
                  setSubmitted(false);
                  onClose();
                }}
                className="btn btn-dark btn-full"
              >
                Close Window
              </button>
            </div>
          </div>
        ) : (
          <div>
            <div className="modal-header">
              <span className="modal-eyebrow">QUICK TRAVEL ENQUIRY</span>
              <h3>Get Instant Fare Quote</h3>
              <p>Fill in your trip details to check vehicle availability and best rates.</p>
            </div>

            {errorMsg && (
              <div style={{
                background: '#FEF2F2',
                border: '1px solid #FECACA',
                color: '#991B1B',
                borderRadius: '8px',
                padding: '0.6rem 0.8rem',
                fontSize: '0.8rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                marginBottom: '0.8rem'
              }}>
                <AlertCircle size={15} style={{ flexShrink: 0 }} />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="modal-form">
              <div className="modal-form-grid">
                {/* 1. Name */}
                <div className="form-group">
                  <label>
                    <User size={14} color="#C89B3C" /> Full Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    required
                    placeholder="Enter your full name"
                    value={formData.name}
                    onChange={handleChange}
                    className="modal-input"
                  />
                </div>

                {/* 2. Mobile Number */}
                <div className="form-group">
                  <label>
                    <Phone size={14} color="#C89B3C" /> Mobile Number *
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    required
                    placeholder="10-digit mobile number"
                    value={formData.phone}
                    onChange={handleChange}
                    className="modal-input"
                  />
                </div>

                {/* 3. Pickup Location */}
                <div className="form-group">
                  <label>
                    <MapPin size={14} color="#25D366" /> Pickup Location *
                  </label>
                  <input
                    type="text"
                    name="pickup"
                    required
                    placeholder="e.g. Baner / Wakad / Pune Airport"
                    value={formData.pickup}
                    onChange={handleChange}
                    className="modal-input"
                  />
                </div>

                {/* 4. Drop Location */}
                <div className="form-group">
                  <label>
                    <MapPin size={14} color="#0066FF" /> Drop Location *
                  </label>
                  <input
                    type="text"
                    name="destination"
                    required
                    placeholder="e.g. BKC / Dadar / Mumbai Airport"
                    value={formData.destination}
                    onChange={handleChange}
                    className="modal-input"
                  />
                </div>

                {/* Travel Date */}
                <div className="form-group">
                  <label>
                    <Calendar size={14} color="#C89B3C" /> Travel Date
                  </label>
                  <input
                    type="date"
                    name="date"
                    value={formData.date}
                    onChange={handleChange}
                    className="modal-input"
                  />
                </div>

                {/* Vehicle Choice */}
                <div className="form-group">
                  <label>
                    <Car size={14} color="#C89B3C" /> Preferred Vehicle
                  </label>
                  <select
                    name="vehicle"
                    value={formData.vehicle}
                    onChange={handleChange}
                    className="modal-select"
                  >
                    <option value="Executive Sedan">Executive Sedan (Dzire / Etios)</option>
                    <option value="Spacious SUV">Spacious SUV (Innova / Ertiga)</option>
                    <option value="Premium Luxury">Executive Luxury (Crysta / Mercedes)</option>
                    <option value="Luxury Mini Bus">Luxury Mini Bus (12 - 20 Seater)</option>
                  </select>
                </div>
              </div>

              {/* Action CTAs: Side-by-side buttons */}
              <div className="modal-actions">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn btn-gold modal-submit-btn"
                  style={{ opacity: isSubmitting ? 0.75 : 1, cursor: isSubmitting ? 'not-allowed' : 'pointer' }}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 size={15} className="animate-spin" /> SUBMITTING...
                    </>
                  ) : (
                    <>
                      <Send size={15} /> SUBMIT ENQUIRY
                    </>
                  )}
                </button>
                <a
                  href={currentWALink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-whatsapp modal-wa-btn"
                >
                  <MessageSquare size={15} /> WHATSAPP ENQUIRY
                </a>
              </div>
            </form>
          </div>
        )}
      </div>

      <style>{`
        .modal-overlay {
          position: fixed;
          top: 0; left: 0; right: 0; bottom: 0;
          background: rgba(7, 17, 31, 0.82);
          backdrop-filter: blur(8px);
          z-index: 2000;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 1rem;
        }

        .modal-content {
          background: #FFFFFF;
          border-radius: 20px;
          width: 100%;
          max-width: 560px;
          padding: 1.5rem 1.75rem;
          position: relative;
          box-shadow: 0 20px 50px rgba(0, 0, 0, 0.35);
          border: 1px solid var(--border-beige);
          overflow: hidden;
        }

        .modal-close-btn {
          position: absolute;
          top: 1rem;
          right: 1rem;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: #F3F4F6;
          border: none;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #4B5563;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .modal-close-btn:hover {
          background: #E5E7EB;
          color: #111827;
          transform: rotate(90deg);
        }

        .modal-header {
          margin-bottom: 0.9rem;
          padding-right: 2rem;
        }

        .modal-eyebrow {
          font-family: var(--font-heading);
          font-size: 0.72rem;
          font-weight: 800;
          color: #0284C7;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }

        .modal-header h3 {
          font-size: 1.4rem;
          font-weight: 800;
          color: #0F172A;
          margin-top: 0.1rem;
        }

        .modal-header p {
          font-size: 0.82rem;
          color: #64748B;
          margin-top: 0.15rem;
        }

        .modal-form-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 0.75rem;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .form-group label {
          font-family: var(--font-heading);
          font-size: 0.75rem;
          font-weight: 700;
          color: #374151;
          display: flex;
          align-items: center;
          gap: 0.3rem;
        }

        .modal-input, .modal-select {
          width: 100%;
          padding: 0.55rem 0.75rem;
          border-radius: 8px;
          border: 1.5px solid #E2E8F0;
          font-family: var(--font-body);
          font-size: 0.85rem;
          outline: none;
          background: #F8FAFC;
          transition: all 0.2s ease;
        }

        .modal-input:focus, .modal-select:focus {
          background: #FFFFFF;
          border-color: #0284C7;
          box-shadow: 0 0 0 3px rgba(2, 132, 199, 0.15);
        }

        .modal-actions {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 0.75rem;
          margin-top: 1rem;
        }

        .modal-submit-btn, .modal-wa-btn {
          font-size: 0.82rem;
          font-weight: 800;
          letter-spacing: 0.03em;
          padding: 0.7rem 0.85rem;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.4rem;
        }

        .modal-success-state {
          text-align: center;
          padding: 1.5rem 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.85rem;
        }

        .modal-success-state h3 {
          font-size: 1.5rem;
          font-weight: 800;
          color: var(--bg-dark-navy);
        }

        .modal-success-state p {
          font-size: 0.9rem;
          color: #4B5563;
          line-height: 1.45;
        }

        .modal-success-actions {
          display: flex;
          gap: 0.75rem;
          width: 100%;
          margin-top: 0.75rem;
        }

        @media (max-width: 600px) {
          .modal-form-grid {
            grid-template-columns: 1fr;
          }
          .modal-actions {
            grid-template-columns: 1fr;
          }
          .modal-content {
            padding: 1.25rem;
            max-height: 95vh;
            overflow-y: auto;
          }
        }
      `}</style>
    </div>
  );
};
