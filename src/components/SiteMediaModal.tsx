import React, { useEffect, useRef, useState } from 'react';
import { ImagePlus, Link2, RotateCcw, Save, Upload, X } from 'lucide-react';
import {
  BACKGROUND_ARTWORKS,
  HERO_ARTWORK,
  MAX_SITE_MEDIA_URL_LENGTH,
  SITE_MEDIA_PRESETS,
  SiteMediaSlotId,
  SiteMediaState,
  isValidSiteMediaUrlClient,
} from '../data/portfolioData';
import { OWNER_EMAIL } from '../lib/firebase';
import { processUploadedSiteMediaImage } from '../utils/imageProcessor';

interface SiteMediaModalProps {
  activeSlot: SiteMediaSlotId | null;
  isOwner: boolean;
  isSaving: boolean;
  currentMedia: Record<SiteMediaSlotId, SiteMediaState>;
  onSelectSlot: (slot: SiteMediaSlotId) => void;
  onClose: () => void;
  onSaveSlot: (
    slot: SiteMediaSlotId,
    nextImageUrl: string,
    nextBlendMode: 'normal' | 'lighten'
  ) => Promise<void>;
}

type SourceTab = 'upload' | 'presets' | 'url';

const SLOT_METADATA: Record<
  SiteMediaSlotId,
  { label: string; description: string; defaultSrc: string; defaultBlend: 'normal' | 'lighten' }
> = {
  background: {
    label: 'Page Background',
    description: 'Uncut floating 16:9 background fitted seamlessly on desktop and mobile.',
    defaultSrc: BACKGROUND_ARTWORKS.indraBluePanelsClean16x9,
    defaultBlend: 'normal',
  },
  hero: {
    label: 'Hero Artwork',
    description: 'Primary right-column artwork in the Overview hero section.',
    defaultSrc: HERO_ARTWORK.src,
    defaultBlend: 'lighten',
  },
  closingBanner: {
    label: 'Closing Banner',
    description: 'Full-width uncut floating 16:9 closing artwork behind SARMANSINH SOLANKI.',
    defaultSrc: BACKGROUND_ARTWORKS.indraBluePanelsClean16x9,
    defaultBlend: 'normal',
  },
};

const ALL_SLOTS: SiteMediaSlotId[] = ['background', 'closingBanner'];

export const SiteMediaModal: React.FC<SiteMediaModalProps> = ({
  activeSlot,
  isOwner,
  isSaving,
  currentMedia,
  onSelectSlot,
  onClose,
  onSaveSlot,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [sourceTab, setSourceTab] = useState<SourceTab>('upload');
  const [draftUrl, setDraftUrl] = useState<string>('');
  const [draftBlend, setDraftBlend] = useState<'normal' | 'lighten'>('normal');
  const [urlInput, setUrlInput] = useState<string>('');
  const [useBlueDither, setUseBlueDither] = useState<boolean>(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isProcessingFile, setIsProcessingFile] = useState<boolean>(false);
  const [previewFailed, setPreviewFailed] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');

  useEffect(() => {
    if (!activeSlot || !isOwner) return;
    const slotState = currentMedia[activeSlot];
    const existingUrl = slotState?.imageUrl?.trim() ?? '';
    setDraftUrl(existingUrl);
    setDraftBlend(slotState?.blendMode ?? SLOT_METADATA[activeSlot].defaultBlend);
    setUrlInput(existingUrl.startsWith('data:image/') ? '' : existingUrl);
    setUploadedFile(null);
    setUseBlueDither(false);
    setPreviewFailed(false);
    setErrorMsg('');
  }, [activeSlot, isOwner, currentMedia]);

  useEffect(() => {
    if (!activeSlot || !isOwner) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isSaving) onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [activeSlot, isOwner, isSaving, onClose]);

  if (!activeSlot || !isOwner) return null;

  const meta = SLOT_METADATA[activeSlot];
  const effectivePreviewSrc = draftUrl.trim().length > 0 ? draftUrl.trim() : meta.defaultSrc;

  const handleProcessFile = async (file: File, applyDither: boolean) => {
    setErrorMsg('');
    setIsProcessingFile(true);
    try {
      const dataUrl = await processUploadedSiteMediaImage(file, applyDither);
      setUploadedFile(file);
      setDraftUrl(dataUrl);
      if (activeSlot === 'hero') {
        setDraftBlend('normal');
      }
      setPreviewFailed(false);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Could not process selected image.');
    } finally {
      setIsProcessingFile(false);
    }
  };

  const handleToggleDither = async (nextDither: boolean) => {
    setUseBlueDither(nextDither);
    if (uploadedFile) {
      await handleProcessFile(uploadedFile, nextDither);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await handleProcessFile(file, useBlueDither);
    e.target.value = '';
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    await handleProcessFile(file, useBlueDither);
  };

  const handleApplyUrl = () => {
    const trimmed = urlInput.trim();
    if (!trimmed) {
      setDraftUrl('');
      setDraftBlend(meta.defaultBlend);
      setPreviewFailed(false);
      setErrorMsg('');
      return;
    }
    if (!isValidSiteMediaUrlClient(trimmed)) {
      setErrorMsg('Enter an https://, http://, or /assets/ image URL.');
      return;
    }
    setUploadedFile(null);
    setDraftUrl(trimmed);
    if (activeSlot === 'hero') {
      setDraftBlend('normal');
    }
    setPreviewFailed(false);
    setErrorMsg('');
  };

  const handleResetDefault = () => {
    setUploadedFile(null);
    setDraftUrl('');
    setUrlInput('');
    setDraftBlend(meta.defaultBlend);
    setPreviewFailed(false);
    setErrorMsg('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanUrl = draftUrl.trim().slice(0, MAX_SITE_MEDIA_URL_LENGTH);
    if (!isValidSiteMediaUrlClient(cleanUrl)) {
      setErrorMsg('Selected image URL format or size is not allowed.');
      return;
    }
    setErrorMsg('');
    await onSaveSlot(activeSlot, cleanUrl, draftBlend);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 sm:p-6 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-labelledby="site-media-modal-title"
      onClick={() => {
        if (!isSaving) onClose();
      }}
    >
      <div
        className="relative max-h-[92vh] w-full max-w-4xl overflow-y-auto border border-white/20 bg-[#0b0d1f] text-[#f2f2f2]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 z-20 flex items-center justify-between gap-4 border-b border-white/12 bg-[#0b0d1f]/95 px-6 py-4 backdrop-blur-xs">
          <div>
            <div className="font-mono text-xs text-[#9ea6ff]">
              Owner Site Media Studio · {OWNER_EMAIL}
            </div>
            <h2
              id="site-media-modal-title"
              className="font-display text-2xl sm:text-3xl font-normal text-white"
            >
              Change {meta.label}
            </h2>
          </div>

          <button
            type="button"
            disabled={isSaving}
            onClick={onClose}
            aria-label="Close site media studio"
            className="inline-flex h-9 w-9 items-center justify-center border border-white/20 bg-[#121530] text-white hover:bg-[#0000f2] hover:border-[#0000f2] transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Slot Switcher Bar */}
        <div className="border-b border-white/10 bg-[#070917] px-6 py-3 flex flex-wrap items-center justify-between gap-3">
          <div
            className="flex flex-wrap items-center gap-1.5"
            role="tablist"
            aria-label="Portfolio image slots"
          >
            {ALL_SLOTS.map((slotKey) => {
              const isSelected = slotKey === activeSlot;
              return (
                <button
                  key={slotKey}
                  type="button"
                  role="tab"
                  aria-selected={isSelected}
                  disabled={isSaving}
                  onClick={() => onSelectSlot(slotKey)}
                  className={`px-3.5 py-1.5 font-mono text-xs border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    isSelected
                      ? 'border-[#0000f2] bg-[#0000f2] text-white'
                      : 'border-white/12 bg-[#0d1026] text-[#b4bce3] hover:text-white'
                  }`}
                >
                  {SLOT_METADATA[slotKey].label}
                </button>
              );
            })}
          </div>

          <span className="font-mono text-xs text-[#9ca2c4]">{meta.description}</span>
        </div>

        <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Column: Live Slot Preview */}
            <div className="lg:col-span-5 space-y-3">
              <div className="flex items-center justify-between font-mono text-xs text-[#a5add4]">
                <span>Live {meta.label} Preview</span>
                <span>{draftUrl ? 'Custom Image' : 'Default Artwork'}</span>
              </div>

              <div
                className={`relative overflow-hidden border border-white/15 bg-[#060920] ${
                  activeSlot === 'hero' ? 'aspect-[4/4.3]' : 'aspect-[16/9]'
                } w-full`}
              >
                {!previewFailed ? (
                  <img
                    src={effectivePreviewSrc}
                    alt={meta.label}
                    referrerPolicy="no-referrer"
                    onError={() => setPreviewFailed(true)}
                    className={`h-full w-full ${
                      activeSlot === 'hero' ? 'object-contain' : 'object-cover'
                    } object-center ${draftBlend === 'lighten' ? 'mix-blend-lighten' : ''}`}
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center p-4 text-center font-mono text-xs text-white/80">
                    Image preview could not load. Check URL or upload another file.
                  </div>
                )}
              </div>

              {/* Hero Blend Mode Control */}
              {activeSlot === 'hero' && (
                <div className="space-y-1.5 pt-1">
                  <span className="block font-mono text-xs text-[#a5add4]">
                    Hero Canvas Blend Mode
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    <button
                      type="button"
                      onClick={() => setDraftBlend('normal')}
                      className={`border px-3 py-1.5 font-mono text-xs transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                        draftBlend === 'normal'
                          ? 'border-[#0000f2] bg-[#0000f2] text-white'
                          : 'border-white/15 bg-[#060713] text-[#b8bee0] hover:text-white'
                      }`}
                    >
                      Standard Full Image
                    </button>
                    <button
                      type="button"
                      onClick={() => setDraftBlend('lighten')}
                      className={`border px-3 py-1.5 font-mono text-xs transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                        draftBlend === 'lighten'
                          ? 'border-[#0000f2] bg-[#0000f2] text-white'
                          : 'border-white/15 bg-[#060713] text-[#b8bee0] hover:text-white'
                      }`}
                    >
                      Lighten Blend (Dark Woodcuts)
                    </button>
                  </div>
                </div>
              )}

              {draftUrl && (
                <div className="pt-1">
                  <button
                    type="button"
                    onClick={handleResetDefault}
                    className="inline-flex items-center gap-1.5 border border-white/20 bg-[#121530] px-3 py-1.5 font-mono text-xs text-[#d6daf2] hover:border-white/40 hover:text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    <span>Restore Default {meta.label}</span>
                  </button>
                </div>
              )}
            </div>

            {/* Right Column: Upload / Built-in Presets / URL */}
            <div className="lg:col-span-7 space-y-5">
              <div
                className="flex flex-wrap items-center gap-1 border border-white/12 bg-[#060713] p-1"
                role="tablist"
                aria-label="Image source tabs"
              >
                <button
                  type="button"
                  role="tab"
                  aria-selected={sourceTab === 'upload'}
                  onClick={() => setSourceTab('upload')}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 font-mono text-xs transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    sourceTab === 'upload'
                      ? 'bg-[#0000f2] text-white'
                      : 'text-[#a5add4] hover:text-white'
                  }`}
                >
                  <Upload className="h-3.5 w-3.5" />
                  <span>Upload File</span>
                </button>

                <button
                  type="button"
                  role="tab"
                  aria-selected={sourceTab === 'presets'}
                  onClick={() => setSourceTab('presets')}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 font-mono text-xs transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    sourceTab === 'presets'
                      ? 'bg-[#0000f2] text-white'
                      : 'text-[#a5add4] hover:text-white'
                  }`}
                >
                  <ImagePlus className="h-3.5 w-3.5" />
                  <span>Built-in Artworks</span>
                </button>

                <button
                  type="button"
                  role="tab"
                  aria-selected={sourceTab === 'url'}
                  onClick={() => setSourceTab('url')}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 font-mono text-xs transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    sourceTab === 'url'
                      ? 'bg-[#0000f2] text-white'
                      : 'text-[#a5add4] hover:text-white'
                  }`}
                >
                  <Link2 className="h-3.5 w-3.5" />
                  <span>Image URL</span>
                </button>
              </div>

              {/* TAB 1: UPLOAD */}
              {sourceTab === 'upload' && (
                <div className="space-y-4">
                  <div
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={handleDrop}
                    className="flex flex-col items-center justify-center gap-3 border border-dashed border-white/25 bg-[#060713] p-6 text-center"
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    <ImagePlus className="h-7 w-7 text-[#8e98ff]" />
                    <div className="space-y-1">
                      <p className="text-sm text-white">
                        Drop an image here or select any image from your device
                      </p>
                      <p className="font-mono text-xs text-[#9ca2c4]">
                        High-resolution compression up to 1360px · Saved directly to your cloud portfolio
                      </p>
                    </div>
                    <button
                      type="button"
                      disabled={isProcessingFile}
                      onClick={() => fileInputRef.current?.click()}
                      className="mt-1 bg-[#0000f2] px-4 py-2 font-mono text-xs font-medium text-white hover:bg-[#242bff] disabled:opacity-60 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      {isProcessingFile ? 'Processing Image...' : 'Choose Image File'}
                    </button>
                  </div>

                  <div className="space-y-1.5">
                    <span className="block font-mono text-xs text-[#a5add4]">
                      Uploaded Image Color Treatment
                    </span>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => void handleToggleDither(false)}
                        className={`border px-3 py-1.5 font-mono text-xs transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                          !useBlueDither
                            ? 'border-[#0000f2] bg-[#0000f2] text-white'
                            : 'border-white/15 bg-[#060713] text-[#b8bee0] hover:text-white'
                        }`}
                      >
                        Original Colors
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleToggleDither(true)}
                        className={`border px-3 py-1.5 font-mono text-xs transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                          useBlueDither
                            ? 'border-[#0000f2] bg-[#0000f2] text-white'
                            : 'border-white/15 bg-[#060713] text-[#b8bee0] hover:text-white'
                        }`}
                      >
                        Blue Dither Filter
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: BUILT-IN PRESETS */}
              {sourceTab === 'presets' && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-72 overflow-y-auto pr-1">
                  {SITE_MEDIA_PRESETS.map((preset) => {
                    const isDefaultMatch = !draftUrl && meta.defaultSrc === preset.src;
                    const isSelected = draftUrl === preset.src || isDefaultMatch;
                    return (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => {
                          setUploadedFile(null);
                          setDraftUrl(preset.src === meta.defaultSrc ? '' : preset.src);
                          if (activeSlot === 'hero') {
                            setDraftBlend(preset.recommendedBlend);
                          } else {
                            setDraftBlend('normal');
                          }
                          setPreviewFailed(false);
                          setErrorMsg('');
                        }}
                        className={`flex flex-col border text-left transition-colors cursor-pointer ${
                          isSelected
                            ? 'border-[#5f6bff] bg-[#141945]'
                            : 'border-white/12 bg-[#060713] hover:border-white/30'
                        }`}
                      >
                        <div className="aspect-[16/10] w-full overflow-hidden bg-[#060920]">
                          <img
                            src={preset.src}
                            alt={preset.label}
                            referrerPolicy="no-referrer"
                            className="h-full w-full object-cover object-center"
                          />
                        </div>
                        <div className="p-2">
                          <div className="font-mono text-[11px] text-white truncate">
                            {preset.label}
                          </div>
                          <div className="font-mono text-[10px] text-[#9ca2c4] truncate">
                            {preset.subtitle}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* TAB 3: DIRECT URL */}
              {sourceTab === 'url' && (
                <div className="space-y-3">
                  <label htmlFor="site-media-url" className="block font-mono text-xs text-[#a5add4]">
                    Direct Image URL (HTTPS or /assets/ path)
                  </label>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      id="site-media-url"
                      type="url"
                      value={urlInput}
                      onChange={(e) => setUrlInput(e.target.value)}
                      placeholder="https://example.com/custom-background.jpg"
                      className="flex-1 border border-white/15 bg-[#060713] px-3.5 py-2.5 font-mono text-xs text-white placeholder-[#5e658a] focus:border-[#5f6bff] focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={handleApplyUrl}
                      className="bg-[#0000f2] px-4 py-2.5 font-mono text-xs font-medium text-white hover:bg-[#242bff] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      Preview URL
                    </button>
                  </div>
                  <p className="font-mono text-[11px] text-[#9ca2c4] leading-relaxed">
                    Paste any direct image link and click Preview URL, then click Save {meta.label}.
                  </p>
                </div>
              )}
            </div>
          </div>

          {errorMsg && (
            <p role="alert" className="font-mono text-xs text-[#ff8585]">
              {errorMsg}
            </p>
          )}

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 border-t border-white/12 pt-4">
            <button
              type="button"
              disabled={isSaving}
              onClick={onClose}
              className="border border-white/20 px-4 py-2 font-mono text-xs text-[#c5cae8] hover:text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving || isProcessingFile}
              className="inline-flex items-center gap-2 bg-[#0000f2] px-5 py-2 font-mono text-xs font-medium text-white hover:bg-[#242bff] disabled:opacity-60 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Save className="h-3.5 w-3.5" />
              <span>{isSaving ? 'Saving...' : `Save ${meta.label}`}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
