import { useEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

// Register ScrollTrigger plugin with GSAP
if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

/**
 * useScrollReveal — High-Performance GSAP & ScrollTrigger motion system for AJ Travels.
 *
 * Implements:
 * 1. Hero entrance sequence with subtle, staggered timing (<0.85s total) so booking form is instantly usable.
 * 2. Gentle desktop background parallax on hero.
 * 3. ScrollTrigger reveals on major landing sections and cards as they enter the viewport.
 * 4. Strict adherence to `prefers-reduced-motion` for accessibility.
 * 5. Automatic cleanup on React unmount to prevent memory leaks or duplicate triggers.
 */
export function useScrollReveal(dependencies = []) {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // 1. Accessibility Check: Respect reduced motion preferences immediately
    const prefersReducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      document.querySelectorAll('.reveal, .reveal-on-scroll').forEach((el) => {
        el.style.opacity = '1';
        el.style.transform = 'none';
        el.classList.add('revealed', 'is-revealed');
      });
      return;
    }

    let ctx;
    const initTimer = setTimeout(() => {
      ctx = gsap.context(() => {
        // Refresh ScrollTrigger to ensure accurate positions after route transition
        ScrollTrigger.refresh();

        // ── HERO SECTION: Always Statically Visible (LCP Element, Zero Blink/Flash) ──
        const heroSection = document.querySelector('#home');
        if (heroSection) {
          // Guarantee hero text elements and booking form remain fully visible without any opacity drops
          const heroElements = heroSection.querySelectorAll(
            '.hero-eyebrow, .hero-title, .hero-description, .hero-trust-chips .hero-chip, .hero-dispatch-notice-pill, .booking-card-wrapper'
          );
          heroElements.forEach((el) => {
            el.style.opacity = '1';
            el.style.transform = 'none';
          });

          // Desktop-only subtle parallax on hero background on scroll (disabled on touch/mobile for performance)
          if (window.innerWidth >= 768) {
            const heroBg = heroSection.querySelector('.hero-bg-img');
            if (heroBg) {
              gsap.to(heroBg, {
                yPercent: 8,
                ease: 'none',
                scrollTrigger: {
                  trigger: heroSection,
                  start: 'top top',
                  end: 'bottom top',
                  scrub: 0.4,
                },
              });
            }
          }
        }

        // Internal Page Hero Animation — Keep immediately visible without opacity drop
        const internalHero = document.querySelector('.internal-hero-content, .article-header, .svc-hero-grid, .veh-hero-grid');
        if (internalHero && !heroSection) {
          internalHero.style.opacity = '1';
          internalHero.style.transform = 'none';
        }

        // ── SCROLLTRIGGER SECTION REVEALS (All Public Pages) ──
        const targetSections = document.querySelectorAll(
          '.reveal, .reveal-on-scroll, .internal-hero-section, .blog-main-section, .contact-main-section, .services-main-section, .vehicles-main-section, .content-section, .article-main-container, .stats-counter-strip'
        );

        targetSections.forEach((section) => {
          // Find internal groups to stagger
          const header = section.querySelector(
            '.lovable-section-header, .category-section-header, .corridor-header, .faq-header, .section-eyebrow, .contact-subheading'
          );
          const cards = section.querySelectorAll(
            '.trust-scroll-card, .dest-icon-card, .spotlight-card-wrapper, .pill-tab-wrapper, .category-transport-card, .route-offer-tile, .card-white, .split-grid, .trip-card, .vehicle-card, .faq-card-modern, .final-cta-box, .featured-article-card, .article-card, .article-hero-img-box, .key-takeaways-callout, .contact-channel-card, .form-card-container, .service-showcase-card, .fleet-showcase-card, .stat-card, .core-value-card, .pillar-card, .article-faq-item'
          );

          // If section has a header, reveal header first
          if (header) {
            gsap.fromTo(
              header,
              { opacity: 0, y: 18 },
              {
                opacity: 1,
                y: 0,
                duration: 0.6,
                ease: 'power2.out',
                scrollTrigger: {
                  trigger: section,
                  start: 'top 88%',
                  once: true,
                  onEnter: () => section.classList.add('revealed', 'is-revealed'),
                },
              }
            );
          }

          // If section has cards, stagger their appearance
          if (cards && cards.length > 0) {
            gsap.fromTo(
              cards,
              { opacity: 0, y: 22 },
              {
                opacity: 1,
                y: 0,
                duration: 0.55,
                stagger: 0.06,
                ease: 'power2.out',
                scrollTrigger: {
                  trigger: section,
                  start: header ? 'top 82%' : 'top 88%',
                  once: true,
                  onEnter: () => section.classList.add('revealed', 'is-revealed'),
                },
              }
            );
          } else if (!header && section.classList.contains('reveal')) {
            // General section reveal
            gsap.fromTo(
              section,
              { opacity: 0, y: 22 },
              {
                opacity: 1,
                y: 0,
                duration: 0.6,
                ease: 'power2.out',
                scrollTrigger: {
                  trigger: section,
                  start: 'top 88%',
                  once: true,
                  onEnter: () => section.classList.add('revealed', 'is-revealed'),
                },
              }
            );
          }
        });
      });
    }, 60);

    // 3. Failsafe fallback: ensure no content remains permanently invisible
    const safetyTimer = setTimeout(() => {
      document.querySelectorAll('.reveal, .reveal-on-scroll').forEach((el) => {
        el.classList.add('revealed', 'is-revealed');
      });
    }, 1200);

    return () => {
      clearTimeout(initTimer);
      clearTimeout(safetyTimer);
      if (ctx) ctx.revert();
    };
  }, dependencies);
}
