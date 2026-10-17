import React from 'react';
import { Link } from 'react-router-dom';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';

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
      background: '#F8F7F4',
      color: '#1E293B',
      fontFamily: "'Inter', sans-serif",
    }}>
      <Header isDark={false} />
      <div style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '4rem 1.5rem',
        textAlign: 'center',
      }}>
      <div style={{
        maxWidth: '520px',
        width: '100%',
        background: '#FFFFFF',
        border: '1.5px solid #DCE3EB',
        borderRadius: '24px',
        padding: '3rem 2rem',
        boxShadow: '0 20px 50px rgba(15, 23, 42, 0.08)',
      }}>

        {/* 404 number */}
        <div style={{
          fontSize: 'clamp(5rem, 16vw, 8rem)',
          fontWeight: 900,
          lineHeight: 1,
          background: 'linear-gradient(135deg, #2563EB, #1D4ED8)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          marginBottom: '1rem',
          fontFamily: "'Outfit', sans-serif",
        }}>
          404
        </div>

        <h1 style={{
          fontSize: '1.75rem',
          fontWeight: 800,
          margin: '0 0 0.75rem',
          color: '#17324D',
          fontFamily: "'Outfit', sans-serif",
        }}>
          Page Not Found
        </h1>

        <p style={{
          fontSize: '0.95rem',
          color: '#475569',
          lineHeight: 1.6,
          margin: '0 0 2rem',
        }}>
          The page you are looking for does not exist or has been relocated.
          Explore our verified fleet and calculate live fares below.
        </p>

        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link
            to="/"
            style={{
              display: 'inline-block',
              padding: '0.75rem 1.6rem',
              background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)',
              color: '#FFFFFF',
              borderRadius: '9999px',
              fontWeight: 700,
              textDecoration: 'none',
              fontSize: '0.9rem',
              boxShadow: '0 4px 16px rgba(37, 99, 235, 0.35)',
              transition: 'all 0.2s',
            }}
          >
            Go to Home
          </Link>
          <Link
            to="/fare"
            style={{
              display: 'inline-block',
              padding: '0.75rem 1.6rem',
              border: '1.5px solid #DCE3EB',
              color: '#17324D',
              borderRadius: '9999px',
              fontWeight: 700,
              textDecoration: 'none',
              fontSize: '0.9rem',
              transition: 'all 0.2s',
              background: '#F8FAFC',
            }}
          >
            Check Fares
          </Link>
        </div>
      </div>
      </div>
      <Footer />
    </div>
  );
}
