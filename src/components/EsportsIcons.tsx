import React from 'react';

interface IconProps {
  className?: string;
  size?: number;
}

/**
 * Modern, sharp, esports-style icons with consistent stroke width,
 * layered geometric depth, and subtle electric purple / silver accents.
 */

export const EsportsFlame: React.FC<IconProps> = ({ className = 'w-5 h-5', size }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    style={size ? { width: size, height: size } : undefined}
  >
    <path
      d="M12 2L14.8 6.5C16.8 9.7 18 12.1 18 14.5C18 18.09 15.31 21 12 21C8.69 21 6 18.09 6 14.5C6 12.8 6.9 10.8 8.2 8.7L12 2Z"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M12 11C12.8 12.5 13.5 13.7 13.5 15C13.5 16.1 12.83 17 12 17C11.17 17 10.5 16.1 10.5 15C10.5 14.1 11 12.8 12 11Z"
      fill="currentColor"
      fillOpacity="0.4"
      stroke="currentColor"
      strokeWidth="1.2"
    />
  </svg>
);

export const EsportsTrophy: React.FC<IconProps> = ({ className = 'w-5 h-5', size }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    style={size ? { width: size, height: size } : undefined}
  >
    {/* Cup Body */}
    <path
      d="M6 3H18V10C18 13.31 15.31 16 12 16C8.69 16 6 13.31 6 10V3Z"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    {/* Left Handle */}
    <path
      d="M6 5H4C2.9 5 2 5.9 2 7V8C2 9.66 3.34 11 5 11H6"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
    />
    {/* Right Handle */}
    <path
      d="M18 5H20C21.1 5 22 5.9 22 7V8C22 9.66 20.66 11 19 11H18"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
    />
    {/* Stem & Pedestal */}
    <path
      d="M12 16V19M8 21H16"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    {/* Star Emblem */}
    <path
      d="M12 7.5L12.8 9.2L14.6 9.4L13.2 10.6L13.6 12.4L12 11.5L10.4 12.4L10.8 10.6L9.4 9.4L11.2 9.2L12 7.5Z"
      fill="currentColor"
      fillOpacity="0.6"
    />
  </svg>
);

export const EsportsSwords: React.FC<IconProps> = ({ className = 'w-5 h-5', size }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    style={size ? { width: size, height: size } : undefined}
  >
    {/* Blade 1 */}
    <path
      d="M18.5 2.5L21.5 5.5L13 14L10 11L18.5 2.5Z"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinejoin="round"
    />
    <path d="M10 11L7.5 13.5M13 14L10.5 16.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    <path d="M8 16L4 20M3 21L5 19" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />

    {/* Blade 2 */}
    <path
      d="M5.5 2.5L2.5 5.5L11 14L14 11L5.5 2.5Z"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinejoin="round"
    />
    <path d="M14 11L16.5 13.5M11 14L13.5 16.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    <path d="M16 16L20 20M21 21L19 19" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
  </svg>
);

export const EsportsCrosshair: React.FC<IconProps> = ({ className = 'w-5 h-5', size }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    style={size ? { width: size, height: size } : undefined}
  >
    <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.8" strokeDasharray="3 3" />
    <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.5" />
    <path d="M12 2V6M12 18V22M2 12H6M18 12H22" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
  </svg>
);

export const EsportsTelemetry: React.FC<IconProps> = ({ className = 'w-5 h-5', size }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    style={size ? { width: size, height: size } : undefined}
  >
    <path
      d="M3 17L8.5 10.5L13 14.5L20.5 5M21 10V5H16"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M4 20H20"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      opacity="0.4"
    />
    <circle cx="8.5" cy="10.5" r="1.5" fill="currentColor" />
    <circle cx="13" cy="14.5" r="1.5" fill="currentColor" />
    <circle cx="20.5" cy="5" r="1.5" fill="currentColor" />
  </svg>
);

export const EsportsShield: React.FC<IconProps> = ({ className = 'w-5 h-5', size }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    style={size ? { width: size, height: size } : undefined}
  >
    <path
      d="M12 2L4 5.5V11.5C4 16.5 7.4 20.8 12 22C16.6 20.8 20 16.5 20 11.5V5.5L12 2Z"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M12 6V18M8 10L12 7L16 10"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      opacity="0.6"
    />
  </svg>
);

export const EsportsDefeat: React.FC<IconProps> = ({ className = 'w-5 h-5', size }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    style={size ? { width: size, height: size } : undefined}
  >
    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" opacity="0.8" />
    <path d="M15 9L9 15M9 9L15 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

export const EsportsScan: React.FC<IconProps> = ({ className = 'w-5 h-5', size }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    style={size ? { width: size, height: size } : undefined}
  >
    <path d="M4 8V5C4 4.45 4.45 4 5 4H8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <path d="M16 4H19C19.55 4 20 4.45 20 5V8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <path d="M20 16V19C20 19.55 19.55 20 19 20H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <path d="M8 20H5C4.45 20 4 19.55 4 19V16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <path d="M2 12H22" stroke="currentColor" strokeWidth="1.5" strokeDasharray="3 3" />
    <rect x="7" y="9" width="10" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.5" opacity="0.5" />
  </svg>
);

export const EsportsWhatsApp: React.FC<IconProps> = ({ className = 'w-5 h-5', size }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    style={size ? { width: size, height: size } : undefined}
  >
    <path
      d="M12 21C16.97 21 21 16.97 21 12C21 7.03 16.97 3 12 3C7.03 3 3 7.03 3 12C3 13.67 3.46 15.24 4.26 16.59L3 21L7.56 19.82C8.88 20.57 10.39 21 12 21Z"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M9.5 8.5C9.2 8 8.8 8 8.5 8C8.2 8 8 8.1 7.8 8.3C7.4 8.7 6.8 9.4 6.8 10.7C6.8 12 7.7 13.3 7.9 13.5C8.1 13.7 9.7 16.2 12.2 17.2C14.3 18 14.8 17.8 15.3 17.7C15.9 17.6 17.1 16.9 17.4 16.1C17.7 15.3 17.7 14.6 17.6 14.5C17.5 14.4 17.3 14.3 17 14.1C16.7 14 15.3 13.3 15 13.2C14.7 13.1 14.5 13 14.3 13.3C14 13.7 13.4 14.4 13.2 14.6C13 14.8 12.8 14.8 12.5 14.7C12.2 14.5 11.2 14.2 10.1 13.2C9.2 12.4 8.6 11.4 8.4 11.1C8.2 10.8 8.4 10.6 8.5 10.5C8.6 10.4 8.8 10.1 9 9.9C9.2 9.7 9.2 9.5 9.3 9.3C9.4 9.1 9.4 8.9 9.3 8.8C9.2 8.7 9.7 8.9 9.5 8.5Z"
      fill="currentColor"
      fillOpacity="0.8"
    />
  </svg>
);

export const EsportsProfit: React.FC<IconProps> = ({ className = 'w-5 h-5', size }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    style={size ? { width: size, height: size } : undefined}
  >
    <path
      d="M12 2L20 6.5V17.5L12 22L4 17.5V6.5L12 2Z"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinejoin="round"
    />
    <path
      d="M7.5 14L10.5 10.5L13 13L16.5 8.5M16.5 8.5H13M16.5 8.5V12"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <circle cx="12" cy="12" r="1" fill="currentColor" />
  </svg>
);
