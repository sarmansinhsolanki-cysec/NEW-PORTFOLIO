import React, { useEffect, useState } from 'react';
import { Check, Copy, ImagePlus, Maximize2, Minimize2, Pencil, X } from 'lucide-react';
import {
  GREEK_GOD_PRESETS,
  SecurityWriteup,
  resolveWriteupImageSrc,
} from '../data/portfolioData';
import { ArtworkImage } from './ArtworkImage';

interface WriteupModalProps {
  writeup: SecurityWriteup | null;
  isOwner: boolean;
  onEdit?: (writeup: SecurityWriteup) => void;
  onChangeImage?: (writeup: SecurityWriteup) => void;
  onClose: () => void;
}

export const WriteupModal: React.FC<WriteupModalProps> = ({
  writeup,
  isOwner,
  onEdit,
  onChangeImage,
  onClose,
}) => {
  const [copiedCurl, setCopiedCurl] = useState(false);
  const [copiedPoc, setCopiedPoc] = useState(false);
  const [expandedArt, setExpandedArt] = useState(false);

  useEffect(() => {
    if (!writeup) return;
    setExpandedArt(false);
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [writeup, onClose]);

  if (!writeup) return null;

  const godArt = GREEK_GOD_PRESETS[writeup.godPreset] ?? GREEK_GOD_PRESETS.athena;
  const resolvedArtworkSrc = resolveWriteupImageSrc(writeup);

  const copyText = async (text: string, which: 'curl' | 'poc') => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // Visual state confirms
    }
    if (which === 'curl') {
      setCopiedCurl(true);
      window.setTimeout(() => setCopiedCurl(false), 1800);
    } else {
      setCopiedPoc(true);
      window.setTimeout(() => setCopiedPoc(false), 1800);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 sm:p-6 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-labelledby="writeup-modal-title"
      onClick={onClose}
    >
      <div
        className="relative max-h-[92vh] w-full max-w-4xl overflow-y-auto border border-white/20 bg-[#070919] text-[#f2f2f2]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Modal Header */}
        <div className="sticky top-0 z-20 flex items-center justify-between gap-4 border-b border-white/12 bg-[#070919]/95 px-6 py-4 backdrop-blur-xs">
          <div className="flex items-center gap-2 font-mono text-xs text-[#9ca2c4] truncate">
            <span>{writeup.index}</span>
            <span aria-hidden="true">·</span>
            <span>{writeup.owaspMapping}</span>
            <span aria-hidden="true">·</span>
            <span>{writeup.readTime}</span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {isOwner && onChangeImage && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onChangeImage(writeup);
                }}
                className="inline-flex items-center gap-1.5 border border-white/20 bg-[#0d1029] px-3 py-1.5 font-mono text-xs text-white hover:bg-[#0000f2] hover:border-[#0000f2] transition-colors duration-150 whitespace-nowrap shrink-0 cursor-pointer"
              >
                <ImagePlus className="h-3.5 w-3.5" />
                <span>Change Image</span>
              </button>
            )}
            {isOwner && onEdit && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onEdit(writeup);
                }}
                className="inline-flex items-center gap-1.5 bg-[#1822f2] px-3 py-1.5 font-mono text-xs text-white hover:bg-[#2d37ff] transition-colors duration-150 whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Pencil className="h-3.5 w-3.5" />
                <span>Edit Writeup</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => setExpandedArt((prev) => !prev)}
              className="inline-flex items-center gap-1.5 border border-white/15 px-3 py-1.5 font-mono text-xs text-[#d6daf2] hover:border-white/40 hover:text-white transition-colors duration-150 whitespace-nowrap shrink-0 cursor-pointer"
            >
              {expandedArt ? (
                <>
                  <Minimize2 className="h-3.5 w-3.5" />
                  <span>Reader View</span>
                </>
              ) : (
                <>
                  <Maximize2 className="h-3.5 w-3.5" />
                  <span>Full Artwork</span>
                </>
              )}
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close writeup reader"
              className="inline-flex h-9 w-9 items-center justify-center border border-white/20 bg-[#0d1029] text-white hover:bg-[#1822f2] hover:border-[#1822f2] transition-colors duration-150 cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Writeup Artwork Banner */}
        <div className="border-b border-white/12 bg-[#04050e]">
          <ArtworkImage
            key={resolvedArtworkSrc}
            src={resolvedArtworkSrc}
            alt={godArt.alt}
            title={writeup.title}
            className={expandedArt ? 'h-[62vh] w-full' : 'h-64 sm:h-80 w-full'}
            imgClassName={expandedArt ? 'object-contain' : 'object-cover object-center'}
          />
        </div>

        {/* Writeup Body */}
        <div className="p-6 sm:p-8 space-y-8">
          <div className="space-y-2 border-b border-white/10 pb-6">
            <div className="font-mono text-xs text-[#8a94ff]">
              Published {writeup.date} · {writeup.environment} · By Sarmansinh Solanki
            </div>
            <h2
              id="writeup-modal-title"
              className="font-display text-3xl sm:text-4xl font-normal tracking-tight text-white"
            >
              {writeup.title}
            </h2>
            <p className="text-base text-[#b8bee0] leading-relaxed">
              {writeup.subtitle}
            </p>
          </div>

          <div className="space-y-3">
            <h3 className="font-display text-2xl text-white tracking-tight">
              01. Root Cause Analysis
            </h3>
            <p className="text-sm sm:text-base text-[#c2c8e8] leading-relaxed whitespace-pre-line">
              {writeup.vulnerabilityRootCause}
            </p>
          </div>

          <div className="space-y-3">
            <h3 className="font-display text-2xl text-white tracking-tight">
              02. Exploitation Walkthrough
            </h3>
            <ul className="space-y-2.5 text-sm text-[#b8bee0] leading-relaxed">
              {writeup.exploitationChain.map((step, idx) => (
                <li key={idx} className="flex gap-3 border border-white/10 bg-[#0b0d21] p-4">
                  <span className="font-mono text-xs text-[#8590ff] tabular-nums shrink-0 pt-0.5">
                    Step 0{idx + 1}
                  </span>
                  <span>{step}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* HTTP / cURL PoC */}
          <div className="space-y-5">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs text-[#9ca2c4]">
                  HTTP Proof of Concept Trace
                </span>
                <button
                  type="button"
                  onClick={() => copyText(writeup.httpPoc, 'poc')}
                  className="inline-flex items-center gap-1.5 font-mono text-xs text-[#8590ff] hover:text-white transition-colors cursor-pointer whitespace-nowrap shrink-0"
                >
                  {copiedPoc ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                  <span>{copiedPoc ? 'Copied Trace' : 'Copy HTTP Trace'}</span>
                </button>
              </div>
              <pre className="overflow-x-auto border border-white/12 bg-[#04050e] p-4 font-mono text-xs text-[#e4e7f7] leading-relaxed">
                <code>{writeup.httpPoc}</code>
              </pre>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs text-[#9ca2c4]">
                  Reproducible Verification Command
                </span>
                <button
                  type="button"
                  onClick={() => copyText(writeup.curlVerify, 'curl')}
                  className="inline-flex items-center gap-1.5 font-mono text-xs text-[#8590ff] hover:text-white transition-colors cursor-pointer whitespace-nowrap shrink-0"
                >
                  {copiedCurl ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                  <span>{copiedCurl ? 'Copied Command' : 'Copy cURL'}</span>
                </button>
              </div>
              <pre className="overflow-x-auto border border-white/12 bg-[#04050e] p-4 font-mono text-xs text-[#f2f2f2]">
                <code>$ {writeup.curlVerify}</code>
              </pre>
            </div>
          </div>

          <div className="space-y-2 border border-white/12 bg-[#0b0e26] p-5">
            <h3 className="font-display text-2xl text-white tracking-tight">
              03. Recommended Remediation
            </h3>
            <p className="text-sm sm:text-base text-[#c5cae8] leading-relaxed whitespace-pre-line">
              {writeup.remediation}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
