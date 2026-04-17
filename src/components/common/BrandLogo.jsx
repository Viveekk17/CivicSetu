import React from 'react';

/**
 * BrandLogo — the unified CivicSetu image mark used across the platform.
 * Renders the existing /public/civicsetu-logo.png at the requested size.
 *
 * Props:
 *   size    — pixel size of the square logo (default 36)
 *   variant — 'default' | 'onDark' (adds a soft halo for dark backgrounds)
 *   className — extra classes for the wrapper
 */
const BrandLogo = ({ size = 36, variant = 'default', className = '' }) => (
  <img
    src="/civicsetu-brand.png"
    alt="CivicSetu"
    width={size}
    height={size}
    className={`object-contain shrink-0 ${className}`}
    style={{
      width: size,
      height: size,
      filter: variant === 'onDark'
        ? 'drop-shadow(0 0 8px rgba(125, 211, 252, 0.45))'
        : 'drop-shadow(0 4px 10px rgba(20, 36, 138, 0.18))',
    }}
  />
);

export default BrandLogo;
