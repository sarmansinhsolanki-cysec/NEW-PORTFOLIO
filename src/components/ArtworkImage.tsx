import React, { useState } from 'react';
import { Compass } from 'lucide-react';

interface ArtworkImageProps {
  src: string;
  alt: string;
  title?: string;
  className?: string;
  imgClassName?: string;
  priority?: boolean;
  blendLighten?: boolean;
}

export const ArtworkImage: React.FC<ArtworkImageProps> = ({
  src,
  alt,
  title,
  className = '',
  imgClassName = '',
  priority = false,
  blendLighten = false,
}) => {
  const [hasError, setHasError] = useState(false);

  if (hasError || !src) {
    return (
      <div
        className={`relative flex flex-col items-center justify-center overflow-hidden bg-transparent p-6 text-center ${className}`}
        role="img"
        aria-label={alt}
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-25 bg-[radial-gradient(circle_at_50%_40%,#0000f2_0%,transparent_65%)]"
        />
        <Compass className="relative z-10 mb-3 h-8 w-8 text-[#6c75ff] stroke-[1.25]" />
        {title && (
          <span className="relative z-10 font-display text-lg tracking-wide text-[#f2f2f2]">
            {title}
          </span>
        )}
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden ${className}`}>
      <img
        src={src}
        alt={alt}
        referrerPolicy="no-referrer"
        loading={priority ? 'eager' : 'lazy'}
        decoding="async"
        onError={() => setHasError(true)}
        className={`h-full w-full transition-transform duration-200 ease-out ${
          blendLighten ? 'mix-blend-lighten' : ''
        } ${imgClassName || 'object-contain'}`}
      />
    </div>
  );
};
