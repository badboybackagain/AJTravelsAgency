import { useEffect } from 'react';
import { seoApi } from '../services/api';

// Cache for fetched SEO pages so we only fetch once per session
let seoCache = null;
let fetchPromise = null;

async function getSeoMetadata(pageKey) {
  if (seoCache) {
    return seoCache.find(p => p.pageKey === pageKey);
  }
  if (!fetchPromise) {
    fetchPromise = seoApi.getPublicPages()
      .then(res => {
        seoCache = res.data?.data || [];
        return seoCache;
      })
      .catch(() => {
        return [];
      });
  }
  const pages = await fetchPromise;
  return pages.find(p => p.pageKey === pageKey);
}

export function usePageSeo(pageKey, defaultTitle, defaultDesc) {
  useEffect(() => {
    let isMounted = true;

    // Apply immediate fallback if provided
    if (defaultTitle) document.title = defaultTitle;

    getSeoMetadata(pageKey).then(meta => {
      if (!isMounted) return;

      const title = meta?.seoTitle || defaultTitle;
      const desc = meta?.metaDescription || defaultDesc;

      if (title) {
        document.title = title;
      }

      if (desc) {
        let metaDescTag = document.querySelector('meta[name="description"]');
        if (!metaDescTag) {
          metaDescTag = document.createElement('meta');
          metaDescTag.setAttribute('name', 'description');
          document.head.appendChild(metaDescTag);
        }
        metaDescTag.setAttribute('content', desc);
      }

      if (meta?.canonicalUrl) {
        let canonicalTag = document.querySelector('link[rel="canonical"]');
        if (!canonicalTag) {
          canonicalTag = document.createElement('link');
          canonicalTag.setAttribute('rel', 'canonical');
          document.head.appendChild(canonicalTag);
        }
        canonicalTag.setAttribute('href', meta.canonicalUrl);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [pageKey, defaultTitle, defaultDesc]);
}
