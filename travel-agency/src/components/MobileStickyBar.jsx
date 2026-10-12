import React from 'react';
import { MessageSquare, Phone, Calendar } from 'lucide-react';
import { getWhatsAppLink, getPhoneCallLink } from '../utils/whatsapp';

export const MobileStickyBar = ({ onOpenEnquiry }) => {
  return (
    <div className="mobile-sticky-bar">
      <a
        href={getWhatsAppLink({ tripType: 'Intercity Travel' })}
        target="_blank"
        rel="noopener noreferrer"
        className="btn btn-whatsapp btn-sm flex-1"
      >
        <MessageSquare size={16} />
        <span>WHATSAPP</span>
      </a>

      <a href={getPhoneCallLink()} className="btn btn-gold btn-sm flex-1">
        <Phone size={16} />
        <span>CALL NOW</span>
      </a>

      <button onClick={onOpenEnquiry} className="btn btn-dark btn-sm flex-1">
        <Calendar size={16} />
        <span>BOOK</span>
      </button>

      <style>{`
        .flex-1 {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.35rem;
          font-size: 0.8rem;
          padding: 0.65rem 0.5rem;
        }
      `}</style>
    </div>
  );
};
