import React from 'react';
import { Link } from 'react-router-dom';

/**
 * NotFoundPage — shown for any URL the app does not recognise.
 *
 * IMPORTANT: This page deliberately does NOT redirect to the homepage.
 * Silently redirecting unknown URLs hides real problems and is damaging
 * for SEO migration (Google treats a 200 redirect as the page being there).
 *
 * The backend Express server returns HTTP 404 for unknown paths, so crawlers
 * correctly see a 404 status code even though React Router renders this page
 * client-side for direct navigations.
 */
export function NotFoundPage() {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #0f1623 0%, #1a2235 100%)',
      color: '#fff',
      fontFamily: "'Inter', sans-serif",
      padding: '2rem',
      textAlign: 'center',
    }}>
      <div style={{ maxWidth: '480px', width: '100%' }}>

        {/* 404 number */}
        <div style={{
          fontSize: 'clamp(6rem, 20vw, 10rem)',
          fontWeight: 800,
          lineHeight: 1,
          background: 'linear-gradient(135deg, #D8AE55, #f0cc7a)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          marginBottom: '1rem',
          fontFamily: "'Outfit', sans-serif",
        }}>
          404
        </div>

        <h1 style={{
          fontSize: '1.5rem',
          fontWeight: 700,
          margin: '0 0 0.75rem',
          color: '#fff',
        }}>
          Page not found
        </h1>

        <p style={{
          fontSize: '1rem',
          color: '#9CA3AF',
          lineHeight: 1.6,
          margin: '0 0 2rem',
        }}>
          The page you are looking for does not exist in this version of the site.
          If you followed a link from the existing website, some pages are still being
          developed and will be available soon.
        </p>

        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link
            to="/"
            style={{
              display: 'inline-block',
              padding: '0.75rem 1.5rem',
              background: 'linear-gradient(135deg, #D8AE55, #c49a3a)',
              color: '#0f1623',
              borderRadius: '0.5rem',
              fontWeight: 700,
              textDecoration: 'none',
              fontSize: '0.95rem',
              transition: 'opacity 0.2s',
            }}
            onMouseOver={e => e.currentTarget.style.opacity = '0.9'}
            onMouseOut={e => e.currentTarget.style.opacity = '1'}
          >
            Go to Home
          </Link>
          <Link
            to="/fare"
            style={{
              display: 'inline-block',
              padding: '0.75rem 1.5rem',
              border: '1px solid rgba(216, 174, 85, 0.4)',
              color: '#D8AE55',
              borderRadius: '0.5rem',
              fontWeight: 600,
              textDecoration: 'none',
              fontSize: '0.95rem',
              transition: 'border-color 0.2s, background 0.2s',
              background: 'transparent',
            }}
            onMouseOver={e => { e.currentTarget.style.borderColor = '#D8AE55'; e.currentTarget.style.background = 'rgba(216,174,85,0.08)'; }}
            onMouseOut={e => { e.currentTarget.style.borderColor = 'rgba(216, 174, 85, 0.4)'; e.currentTarget.style.background = 'transparent'; }}
          >
            Check Fares
          </Link>
        </div>
      </div>
    </div>
  );
}
