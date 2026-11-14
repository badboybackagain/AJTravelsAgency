import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { businessConfig } from '../config/business.config';

// WhatsApp icon — speech bubble + phone style matching the reference screenshot
const WhatsAppIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 32 32"
    width="32"
    height="32"
    aria-hidden="true"
    focusable="false"
  >
    {/* Speech bubble shape */}
    <path
      fill="#fff"
      d="M16 2C8.268 2 2 8.268 2 16c0 2.49.643 4.827 1.768 6.86L2 30l7.34-1.74A13.93 13.93 0 0 0 16 30c7.732 0 14-6.268 14-14S23.732 2 16 2z"
    />
    {/* Phone handset inside */}
    <path
      fill="#25D366"
      d="M21.84 18.63c-.31-.16-1.84-.91-2.13-1.01-.29-.1-.5-.16-.7.16-.21.31-.8 1.01-.98 1.22-.18.21-.36.23-.67.08-.31-.16-1.3-.48-2.48-1.53-.92-.82-1.54-1.83-1.72-2.14-.18-.31-.02-.47.13-.63.14-.14.31-.36.47-.54.16-.18.21-.31.31-.52.1-.21.05-.39-.03-.55-.08-.16-.7-1.69-.96-2.31-.25-.6-.51-.52-.7-.53l-.6-.01c-.21 0-.54.08-.82.39-.29.31-1.09 1.06-1.09 2.59s1.12 3 1.27 3.2c.16.21 2.19 3.35 5.32 4.7.74.32 1.32.51 1.77.65.74.24 1.42.2 1.95.12.6-.09 1.84-.75 2.1-1.48.26-.73.26-1.35.18-1.48-.07-.13-.28-.21-.59-.37z"
    />
  </svg>
);

// Routes where the bubble should NOT be shown
const HIDDEN_PATHS = ['/admin'];

export const WhatsAppBubble = () => {
  const { pathname } = useLocation();
  const [hovered, setHovered] = useState(false);
  const [tooltipVisible, setTooltipVisible] = useState(false);

  // Hide on admin and login routes
  const isHidden = HIDDEN_PATHS.some(prefix => pathname.startsWith(prefix));
  if (isHidden) return null;

  // Source: businessConfig.whatsapp — the verified AJ Travels business number
  const waNumber = businessConfig.whatsapp; // "917447443536"
  const prefilledMessage = encodeURIComponent('Hi AJ Travels, I need assistance with cab booking.');
  const waUrl = `https://wa.me/${waNumber}?text=${prefilledMessage}`;

  const handleMouseEnter = () => {
    setHovered(true);
    setTooltipVisible(true);
  };
  const handleMouseLeave = () => {
    setHovered(false);
    setTooltipVisible(false);
  };

  return (
    <div
      className="wa-bubble-wrapper"
      style={{
        position: 'fixed',
        // Desktop: 24px from bottom-right; Mobile: 20px bottom, 16px right
        bottom: 'var(--wa-bottom, 24px)',
        right: 'var(--wa-right, 24px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
      }}
      aria-label="Chat with AJ Travels on WhatsApp"
    >
      {/* Tooltip — appears on hover, desktop only */}
      {tooltipVisible && (
        <div
          style={{
            background: '#1a1a1a',
            color: '#fff',
            fontSize: '13px',
            fontWeight: 500,
            padding: '7px 13px',
            borderRadius: '20px',
            whiteSpace: 'nowrap',
            boxShadow: '0 2px 10px rgba(0,0,0,0.25)',
            opacity: tooltipVisible ? 1 : 0,
            transition: 'opacity 0.2s ease',
            pointerEvents: 'none',
            userSelect: 'none',
          }}
          aria-hidden="true"
        >
          Chat on WhatsApp
        </div>
      )}

      {/* The bubble button */}
      <a
        href={waUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chat with AJ Travels on WhatsApp"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onFocus={handleMouseEnter}
        onBlur={handleMouseLeave}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '58px',
          height: '58px',
          borderRadius: '50%',
          background: '#25D366',
          boxShadow: hovered
            ? '0 6px 24px rgba(37,211,102,0.55), 0 2px 8px rgba(0,0,0,0.18)'
            : '0 4px 16px rgba(37,211,102,0.38), 0 2px 6px rgba(0,0,0,0.14)',
          transform: hovered ? 'scale(1.1)' : 'scale(1)',
          transition: 'transform 0.2s ease, box-shadow 0.2s ease',
          textDecoration: 'none',
          border: 'none',
          cursor: 'pointer',
          outline: 'none',
          WebkitTapHighlightColor: 'transparent',
          position: 'relative', // needed for the indicator dot
        }}
        // Keyboard focus visible ring via CSS class would be ideal,
        // but since we're using inline styles, we apply it on focus via onFocus/onBlur
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            window.open(waUrl, '_blank', 'noopener,noreferrer');
          }
        }}
      >
        <WhatsAppIcon />
        {/* Online indicator dot — top-right of the circle, matches reference */}
        <span
          aria-hidden="true"
          style={{
            position: 'absolute',
            top: '4px',
            right: '4px',
            width: '11px',
            height: '11px',
            borderRadius: '50%',
            background: '#4ade80',
            border: '2px solid #25D366',
            boxShadow: '0 0 0 1px rgba(255,255,255,0.4)',
          }}
        />
      </a>

      {/* Pulse ring animation — purely decorative, draws attention */}
      <style>{`
        @keyframes wa-pulse {
          0%   { transform: scale(1);   opacity: 0.6; }
          70%  { transform: scale(1.55); opacity: 0; }
          100% { transform: scale(1.55); opacity: 0; }
        }
        .wa-bubble-pulse {
          position: fixed;
          bottom: 24px;
          right: 24px;
          width: 58px;
          height: 58px;
          border-radius: 50%;
          background: rgba(37, 211, 102, 0.35);
          animation: wa-pulse 2.4s ease-out infinite;
          pointer-events: none;
          z-index: 9998;
        }
        /* Mobile: lift above any browser chrome at bottom, tuck in from edge */
        @media (max-width: 767px) {
          .wa-bubble-pulse {
            bottom: 20px;
            right: 16px;
          }
          .wa-bubble-wrapper {
            bottom: 20px !important;
            right: 16px !important;
          }
        }
      `}</style>
      <div className="wa-bubble-pulse" aria-hidden="true" />
    </div>
  );
};
