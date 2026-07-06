/**
 * LazyImage — Optimized image component with lazy loading
 *
 * Features:
 * - Native lazy loading with IntersectionObserver fallback
 * - Blur-up placeholder effect
 * - Fade-in on load
 * - Error state with fallback icon
 * - Aspect ratio locking to prevent CLS
 */

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ImageIcon } from 'lucide-react';
import { cn } from '@/shared/lib/utils';

/**
 * @param {object} props
 * @param {string} props.src — Image URL
 * @param {string} props.alt — Alt text
 * @param {string} [props.className] — Container classes
 * @param {string} [props.imgClassName] — Image classes
 * @param {number} [props.width] — Intrinsic width (for aspect ratio)
 * @param {number} [props.height] — Intrinsic height
 * @param {'cover'|'contain'|'fill'} [props.fit='cover'] — Object fit
 * @param {boolean} [props.priority=false] — Skip lazy loading
 * @param {string} [props.placeholder] — Blur-up base64 or color
 * @param {Function} [props.onLoad] — Load callback
 */
export default function LazyImage({
  src,
  alt,
  className,
  imgClassName,
  width,
  height,
  fit = 'cover',
  priority = false,
  placeholder,
  onLoad,
}) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  const imgRef = useRef(null);
  const observerRef = useRef(null);

  const aspectRatio = width && height ? width / height : undefined;

  useEffect(() => {
    setLoaded(false);
    setError(false);

    if (!src || priority) return;

    // IntersectionObserver for non-priority images
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && imgRef.current) {
          imgRef.current.src = src;
          observer.unobserve(imgRef.current);
        }
      },
      { rootMargin: '200px' }
    );

    observerRef.current = observer;

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, [src, priority]);

  const handleLoad = (e) => {
    setLoaded(true);
    onLoad?.(e);
  };

  const handleError = () => {
    setError(true);
  };

  // Placeholder background
  const placeholderBg = placeholder || '#f0f0f0';

  return (
    <div
      className={cn('relative overflow-hidden bg-neutral-100 dark:bg-neutral-800', className)}
      style={aspectRatio ? { aspectRatio: `${width} / ${height}` } : undefined}
    >
      {/* Placeholder / blur-up */}
      <AnimatePresence>
        {!loaded && !error && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0"
            style={{ background: placeholderBg }}
          />
        )}
      </AnimatePresence>

      {/* Error state */}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center text-neutral-400 dark:text-neutral-600">
          <ImageIcon className="h-8 w-8" />
        </div>
      )}

      {/* Image */}
      <img
        ref={imgRef}
        src={priority ? src : undefined}
        alt={alt}
        width={width}
        height={height}
        loading={priority ? 'eager' : 'lazy'}
        onLoad={handleLoad}
        onError={handleError}
        className={cn(
          'h-full w-full transition-opacity duration-500',
          loaded ? 'opacity-100' : 'opacity-0',
          error && 'hidden',
          fit === 'cover' && 'object-cover',
          fit === 'contain' && 'object-contain',
          fit === 'fill' && 'object-fill',
          imgClassName
        )}
      />

      {/* Fade-in overlay on load */}
      <AnimatePresence>
        {loaded && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="pointer-events-none absolute inset-0"
          />
        )}
      </AnimatePresence>
    </div>
  );
}
