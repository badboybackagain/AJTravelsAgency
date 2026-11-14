/**
 * SEO & Domain Configuration
 * 
 * Centralized production base domain for canonical URLs, sitemaps, robots.txt,
 * OpenGraph metadata, and analyzer evaluations.
 * 
 * Official production domain: https://www.ajtravelspune.com
 * Migration ready: Configurable via process.env.SITE_DOMAIN without code modifications.
 */
const DEFAULT_SITE_DOMAIN = 'https://www.ajtravelspune.com';
const SITE_DOMAIN = (process.env.SITE_DOMAIN || DEFAULT_SITE_DOMAIN).replace(/\/$/, '');

module.exports = {
  SITE_DOMAIN,
  DEFAULT_SITE_DOMAIN,
};
