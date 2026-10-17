/**
 * SEO & Domain Configuration
 * 
 * Centralized production base domain for canonical URLs, sitemaps, robots.txt,
 * OpenGraph metadata, and analyzer evaluations.
 * 
 * Current production default: https://punemumbaitravels.in
 * Migration ready: Configurable via process.env.SITE_DOMAIN without code modifications.
 */
const DEFAULT_SITE_DOMAIN = 'https://punemumbaitravels.in';
const SITE_DOMAIN = (process.env.SITE_DOMAIN || DEFAULT_SITE_DOMAIN).replace(/\/$/, '');

module.exports = {
  SITE_DOMAIN,
  DEFAULT_SITE_DOMAIN,
};
