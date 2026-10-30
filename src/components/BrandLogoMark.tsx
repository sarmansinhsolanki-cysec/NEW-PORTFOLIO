import React, { useId } from 'react';

interface BrandLogoMarkProps {
  className?: string;
}

export const BrandLogoMark: React.FC<BrandLogoMarkProps> = ({
  className = 'h-7 w-7',
}) => {
  const uid = useId();
  const cobaltGradId = `indra-cobalt-${uid}`;
  const haloGradId = `indra-halo-${uid}`;

  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      aria-hidden="true"
      className={`${className} shrink-0 select-none`}
    >
      <defs>
        <linearGradient
          id={cobaltGradId}
          x1="2"
          y1="2"
          x2="30"
          y2="30"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#2230ff" />
          <stop offset="52%" stopColor="#0b14b8" />
          <stop offset="100%" stopColor="#05096e" />
        </linearGradient>
        <radialGradient
          id={haloGradId}
          cx="16"
          cy="13.5"
          r="11"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#8d9eff" stopOpacity="0.45" />
          <stop offset="100%" stopColor="#0b14b8" stopOpacity="0" />
        </radialGradient>
      </defs>

      <rect
        x="1.25"
        y="1.25"
        width="29.5"
        height="29.5"
        rx="7"
        fill={`url(#${cobaltGradId})`}
      />
      <rect
        x="1.25"
        y="1.25"
        width="29.5"
        height="29.5"
        rx="7"
        fill={`url(#${haloGradId})`}
      />
      <rect
        x="1.75"
        y="1.75"
        width="28.5"
        height="28.5"
        rx="6.5"
        stroke="#b6c2ff"
        strokeOpacity="0.85"
        strokeWidth="1.25"
      />

      {/* Celestial Moon Halo */}
      <circle
        cx="16"
        cy="14.5"
        r="8.2"
        stroke="#97a6ff"
        strokeOpacity="0.45"
        strokeWidth="1.2"
      />

      {/* Indra Trishula / Vajra Sovereign Crest */}
      <path d="M16 4.4L18.45 8.6L16 7.7L13.55 8.6L16 4.4Z" fill="#f6f8ff" />
      <path
        d="M16 7.4V26.4"
        stroke="#f6f8ff"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
      <path
        d="M16 17.8C11.8 17.8 9.6 15.3 9.6 11.2V8.6"
        stroke="#f6f8ff"
        strokeWidth="2.05"
        strokeLinecap="round"
      />
      <path d="M9.6 5.8L11.75 9.4L9.6 8.6L7.45 9.4L9.6 5.8Z" fill="#f6f8ff" />
      <path
        d="M16 17.8C20.2 17.8 22.4 15.3 22.4 11.2V8.6"
        stroke="#f6f8ff"
        strokeWidth="2.05"
        strokeLinecap="round"
      />
      <path
        d="M22.4 5.8L24.55 9.4L22.4 8.6L20.25 9.4L22.4 5.8Z"
        fill="#f6f8ff"
      />
      <path
        d="M12.3 21.3H19.7"
        stroke="#dce3ff"
        strokeWidth="1.95"
        strokeLinecap="round"
      />
      <circle cx="16" cy="17.8" r="1.7" fill="#f6f8ff" />
    </svg>
  );
};
