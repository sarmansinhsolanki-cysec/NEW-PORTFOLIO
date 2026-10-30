import React, { useEffect, useState } from 'react';
import { ImagePlus, Pencil, Trash2 } from 'lucide-react';
import {
  GREEK_GOD_PRESETS,
  SecurityWriteup,
  resolveWriteupImageSrc,
} from '../data/portfolioData';

interface WriteupPosterCardProps {
  writeup: SecurityWriteup;
  cardPosition: number;
  isOwner: boolean;
  isConfirmingDelete: boolean;
  onOpen: (writeup: SecurityWriteup) => void;
  onEdit: (writeup: SecurityWriteup) => void;
  onChangeImage: (writeup: SecurityWriteup) => void;
  onRequestDelete: (id: string) => void;
  onConfirmDelete: (id: string) => void;
  onCancelDelete: () => void;
}

const LEGACY_DEFAULT_TITLES: Record<string, string> = {
  'Chaining Path-Traversal Redirects with Unbound OAuth State for Account Takeover':
    'OAuth Redirect Takeover',
  'Bypassing REST Tenant Filters via Undocumented GraphQL Node Resolution':
    'GraphQL Tenant IDOR',
  'Escalating HTML-to-PDF Export into Internal Microservice SSRF via 307 Redirects':
    'Headless PDF SSRF',
  'Exploiting Loose postMessage Origin Matching & DOM Clobbering in an Embedded Widget':
    'postMessage DOM XSS',
};

function getDisplayTitle(writeup: SecurityWriteup): string {
  return LEGACY_DEFAULT_TITLES[writeup.title] ?? writeup.title;
}

export const WriteupPosterCard: React.FC<WriteupPosterCardProps> = ({
  writeup,
  cardPosition,
  isOwner,
  isConfirmingDelete,
  onOpen,
  onEdit,
  onChangeImage,
  onRequestDelete,
  onConfirmDelete,
  onCancelDelete,
}) => {
  const [imgFailed, setImgFailed] = useState(false);
  const godArt = GREEK_GOD_PRESETS[writeup.godPreset];
  const imgSrc = resolveWriteupImageSrc(writeup, cardPosition);
  const displayTitle = getDisplayTitle(writeup);

  useEffect(() => {
    setImgFailed(false);
  }, [imgSrc]);

  return (
    <article className="group flex h-full flex-col justify-between">
      {/* Top Left-Aligned Editorial Block (Index Kicker + Tall Condensed Title + Clean Prose) */}
      <div className="flex flex-1 flex-col">
        <div className="flex items-center justify-between gap-3">
          <div className="font-sans text-[11px] font-medium tracking-[0.04em] text-[#d6dae8] tabular-nums">
            {writeup.index} · {writeup.category}
            {isOwner && writeup.visibility === 'draft' ? ' · Draft' : ''}
          </div>

          {/* Owner-Only Inline Actions (Visible Strictly to Sarmansinh Solanki) */}
          {isOwner && (
            <div className="flex items-center gap-1.5 font-mono text-[11px]">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(writeup);
                }}
                className="inline-flex items-center gap-1 border border-white/20 bg-[#0d1024] px-2 py-0.5 text-white hover:bg-[#0000f2] hover:border-[#0000f2] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Pencil className="h-3 w-3" />
                <span>Edit</span>
              </button>

              {isConfirmingDelete ? (
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onConfirmDelete(writeup.id);
                    }}
                    className="bg-[#c92a2a] px-2 py-0.5 text-white hover:bg-[#e03131] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    Confirm
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onCancelDelete();
                    }}
                    className="border border-white/20 px-2 py-0.5 text-[#c5cae8] hover:text-white whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onRequestDelete(writeup.id);
                  }}
                  className="inline-flex items-center gap-1 border border-white/15 px-2 py-0.5 text-[#ffb3b3] hover:border-[#ff6b6b] hover:text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <Trash2 className="h-3 w-3" />
                  <span>Delete</span>
                </button>
              )}
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={() => onOpen(writeup)}
          className="mt-3 mb-7 flex flex-1 flex-col text-left cursor-pointer focus-visible:outline-2 focus-visible:outline-[#5f6bff]"
        >
          <h3 className="font-display text-[2.35rem] sm:text-[2.65rem] font-normal leading-[1.0] tracking-[-0.02em] text-[#f2f2f2] group-hover:text-white transition-colors duration-150 [text-wrap:balance]">
            {displayTitle}
          </h3>

          <p className="mt-4 text-[15px] leading-[1.58] text-[#c2c6db] line-clamp-4">
            {writeup.summary}
          </p>
        </button>
      </div>

      {/* Bottom Square Rounded-Corner Writeup Image + Owner-Only Change Image Control */}
      <div className="relative aspect-[334/320] w-full overflow-hidden rounded-[8px] bg-[#0d1be0]">
        <button
          type="button"
          onClick={() => onOpen(writeup)}
          aria-label={`Open full writeup: ${displayTitle}`}
          className="block h-full w-full cursor-pointer focus-visible:outline-2 focus-visible:outline-[#5f6bff]"
        >
          {!imgFailed ? (
            <img
              src={imgSrc}
              alt={godArt?.alt ?? displayTitle}
              referrerPolicy="no-referrer"
              loading="lazy"
              onError={() => setImgFailed(true)}
              className="h-full w-full scale-[1.01] object-cover object-center transition-transform duration-200 ease-out group-hover:scale-[1.04]"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-[#0d1be0] p-6 font-display text-2xl text-white">
              {displayTitle}
            </div>
          )}
        </button>

        {/* Strictly Owner-Only Direct Image Changer Button */}
        {isOwner && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onChangeImage(writeup);
            }}
            className="absolute top-3 right-3 z-10 inline-flex items-center gap-1.5 rounded-[5px] border border-white/25 bg-[#070919]/90 px-2.5 py-1.5 font-mono text-xs font-medium text-white shadow-md backdrop-blur-xs hover:bg-[#0000f2] hover:border-[#0000f2] transition-colors duration-150 whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-white"
          >
            <ImagePlus className="h-3.5 w-3.5" />
            <span>Change Image</span>
          </button>
        )}
      </div>
    </article>
  );
};
