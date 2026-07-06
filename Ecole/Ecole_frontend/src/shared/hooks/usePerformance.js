/**
 * usePerformance — Performance monitoring hook
 *
 * Tracks Core Web Vitals (CLS, LCP, FID) and logs them
 * for monitoring. In production, reports to console/analytics.
 *
 * Usage:
 *   usePerformance();
 */

import { useEffect } from 'react';

/** Check if PerformanceObserver is supported */
const supportsObserver = typeof window !== 'undefined' && 'PerformanceObserver' in window;

/**
 * Report a core web vital metric.
 * @param {'CLS'|'LCP'|'FID'|'TTFB'} name
 * @param {number} value
 * @param {string} rating
 */
function reportMetric(name, value, rating) {
  const entry = {
    name,
    value,
    rating,
    url: window.location.href,
    timestamp: new Date().toISOString(),
  };

  // Console in dev
  if (import.meta.env.DEV) {
    console.info(`[Perf] ${name}: ${value.toFixed(2)} (${rating})`);
  }

  // In production, send to analytics endpoint
  if (import.meta.env.PROD) {
    // Dispatch custom event for analytics collectors
    window.dispatchEvent(
      new CustomEvent('ecole-web-vital', { detail: entry })
    );

    // Beacon to /api/v1/analytics/vitals (fire-and-forget)
    try {
      const payload = JSON.stringify(entry);
      navigator.sendBeacon?.('/api/v1/analytics/vitals', payload);
    } catch {
      // Silent fail — analytics should never block UX
    }
  }
}

/**
 * Map numeric value to rating label.
 */
function ratingFor(name, value) {
  const thresholds = {
    LCP: [2500, 4000],
    FID: [100, 300],
    CLS: [0.1, 0.25],
    TTFB: [800, 1800],
  };
  const [good, poor] = thresholds[name] || [1000, 3000];
  if (value <= good) return 'good';
  if (value <= poor) return 'needs-improvement';
  return 'poor';
}

export default function usePerformance() {
  useEffect(() => {
    if (!supportsObserver) return;

    /* ─── LCP — Largest Contentful Paint ──────────────────────────────── */
    try {
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const last = entries[entries.length - 1];
        if (last) {
          reportMetric('LCP', last.startTime, ratingFor('LCP', last.startTime));
        }
      });
      lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });
    } catch { /* not supported */ }

    /* ─── FID — First Input Delay ─────────────────────────────────────── */
    try {
      const fidObserver = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          reportMetric('FID', entry.processingStart - entry.startTime, ratingFor('FID', entry.processingStart - entry.startTime));
        });
      });
      fidObserver.observe({ type: 'first-input', buffered: true });
    } catch { /* not supported */ }

    /* ─── CLS — Cumulative Layout Shift ───────────────────────────────── */
    let clsValue = 0;

    try {
      const clsObserver = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          if (!entry.hadRecentInput) {
            clsValue += entry.value;
          }
        });
      });
      clsObserver.observe({ type: 'layout-shift', buffered: true });

      // Report CLS on pagehide (not on every shift)
      const reportCLS = () => {
        if (clsValue > 0) {
          reportMetric('CLS', clsValue, ratingFor('CLS', clsValue));
        }
      };
      window.addEventListener('beforeunload', reportCLS, { once: true });
      window.addEventListener('pagehide', reportCLS, { once: true });
    } catch { /* not supported */ }

    /* ─── TTFB — Time to First Byte ───────────────────────────────────── */
    const navEntry = performance.getEntriesByType('navigation')[0];
    if (navEntry) {
      const ttfb = navEntry.responseStart - navEntry.requestStart;
      reportMetric('TTFB', ttfb, ratingFor('TTFB', ttfb));
    }
  }, []);
}
