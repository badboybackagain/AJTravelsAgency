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

function updateCanonicalTag(canonicalUrl) {
  if (!canonicalUrl) return;
  const canonicalTags = document.querySelectorAll('link[rel="canonical"]');
  if (canonicalTags.length > 0) {
    canonicalTags[0].setAttribute('href', canonicalUrl);
    for (let i = 1; i < canonicalTags.length; i++) {
      canonicalTags[i].remove();
    }
  } else {
    const canonicalTag = document.createElement('link');
    canonicalTag.setAttribute('rel', 'canonical');
    canonicalTag.setAttribute('href', canonicalUrl);
    document.head.appendChild(canonicalTag);
  }
}

export function usePageSeo(pageKey, defaultTitle, defaultDesc, defaultCanonical) {
  useEffect(() => {
    let isMounted = true;

    // Apply immediate fallback if provided
    if (defaultTitle) document.title = defaultTitle;

    if (defaultDesc) {
      let metaDescTag = document.querySelector('meta[name="description"]');
      if (!metaDescTag) {
        metaDescTag = document.createElement('meta');
        metaDescTag.setAttribute('name', 'description');
        document.head.appendChild(metaDescTag);
      }
      metaDescTag.setAttribute('content', defaultDesc);
    }

    if (defaultCanonical) {
      updateCanonicalTag(defaultCanonical);
    }

    getSeoMetadata(pageKey).then(meta => {
      if (!isMounted) return;

      const title = meta?.seoTitle || defaultTitle;
      const desc = meta?.metaDescription || defaultDesc;
      const canonical = meta?.canonicalUrl || defaultCanonical;

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

      if (canonical) {
        updateCanonicalTag(canonical);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [pageKey, defaultTitle, defaultDesc, defaultCanonical]);
}
