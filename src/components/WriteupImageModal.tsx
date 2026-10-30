import React, { useEffect, useRef, useState } from 'react';
import { ImagePlus, Link2, RotateCcw, Save, Upload, X } from 'lucide-react';
import {
  BUILT_IN_WRITEUP_GALLERY,
  GREEK_GOD_PRESETS,
  GodPresetKey,
  MAX_CUSTOM_IMAGE_URL_LENGTH,
  SecurityWriteup,
  isValidCustomImageUrlClient,
} from '../data/portfolioData';
import { OWNER_EMAIL } from '../lib/firebase';
import { processUploadedWriteupImage } from '../utils/imageProcessor';

interface WriteupImageModalProps {
  writeup: SecurityWriteup | null;
  isOwner: boolean;
  isSaving: boolean;
  onClose: () => void;
  onSaveImage: (
    writeup: SecurityWriteup,
    nextGodPreset: GodPresetKey,
    nextCustomImageUrl: string
  ) => Promise<void>;
}

type ImageSourceTab = 'upload' | 'gallery' | 'url';

export const WriteupImageModal: React.FC<WriteupImageModalProps> = ({
  writeup,
  isOwner,
  isSaving,
  onClose,
  onSaveImage,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [activeTab, setActiveTab] = useState<ImageSourceTab>('upload');
  const [selectedGodPreset, setSelectedGodPreset] = useState<GodPresetKey>('athena');
  const [draftCustomUrl, setDraftCustomUrl] = useState<string>('');
  const [urlInput, setUrlInput] = useState<string>('');
  const [useBlueDither, setUseBlueDither] = useState<boolean>(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isProcessingFile, setIsProcessingFile] = useState<boolean>(false);
  const [previewFailed, setPreviewFailed] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');

  useEffect(() => {
    if (!writeup || !isOwner) return;
    const existingCustom = writeup.customImageUrl?.trim() ?? '';
    setSelectedGodPreset(writeup.godPreset);
    setDraftCustomUrl(existingCustom);
    setUrlInput(existingCustom.startsWith('data:image/') ? '' : existingCustom);
    setUploadedFile(null);
    setUseBlueDither(false);
    setPreviewFailed(false);
    setErrorMsg('');
    setActiveTab('upload');
  }, [writeup, isOwner]);

  useEffect(() => {
    if (!writeup || !isOwner) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isSaving) onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [writeup, isOwner, isSaving, onClose]);

  if (!writeup || !isOwner) return null;

  const previewSrc =
    draftCustomUrl.trim().length > 0
      ? draftCustomUrl.trim()
      : GREEK_GOD_PRESETS[selectedGodPreset]?.posterSrc ??
        '/assets/aistudio/hermes_writeup_card_1.png';

  const handleProcessFile = async (file: File, applyDither: boolean) => {
    setErrorMsg('');
    setIsProcessingFile(true);
    try {
      const processedDataUrl = await processUploadedWriteupImage(file, applyDither);
      setUploadedFile(file);
      setDraftCustomUrl(processedDataUrl);
      setPreviewFailed(false);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Could not process image file.');
    } finally {
      setIsProcessingFile(false);
    }
  };

  const handleToggleDitherMode = async (nextDither: boolean) => {
    setUseBlueDither(nextDither);
    if (uploadedFile) {
      await handleProcessFile(uploadedFile, nextDither);
    }
  };

  const handleFileInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
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
      setDraftCustomUrl('');
      setPreviewFailed(false);
      setErrorMsg('');
      return;
    }
    if (!isValidCustomImageUrlClient(trimmed)) {
      setErrorMsg('Enter an https://, http://, or /assets/ image URL.');
      return;
    }
    setUploadedFile(null);
    setDraftCustomUrl(trimmed);
    setPreviewFailed(false);
    setErrorMsg('');
  };

  const handleResetDefault = () => {
    setUploadedFile(null);
    setDraftCustomUrl('');
    setUrlInput('');
    setPreviewFailed(false);
    setErrorMsg('');
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanUrl = draftCustomUrl.trim().slice(0, MAX_CUSTOM_IMAGE_URL_LENGTH);
    if (!isValidCustomImageUrlClient(cleanUrl)) {
      setErrorMsg('Selected image URL format or size is not allowed.');
      return;
    }
    setErrorMsg('');
    await onSaveImage(writeup, selectedGodPreset, cleanUrl);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 sm:p-6 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-labelledby="writeup-image-modal-title"
      onClick={() => {
        if (!isSaving) onClose();
      }}
    >
      <div
        className="relative max-h-[92vh] w-full max-w-3xl overflow-y-auto border border-white/20 bg-[#0b0d1f] text-[#f2f2f2]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 z-20 flex items-center justify-between gap-4 border-b border-white/12 bg-[#0b0d1f]/95 px-6 py-4 backdrop-blur-xs">
          <div>
            <div className="font-mono text-xs text-[#9ea6ff]">
              Owner Artwork Control · {OWNER_EMAIL}
            </div>
            <h2
              id="writeup-image-modal-title"
              className="font-display text-2xl sm:text-3xl font-normal text-white"
            >
              Change Writeup Image · {writeup.index}
            </h2>
          </div>

          <button
            type="button"
            disabled={isSaving}
            onClick={onClose}
            aria-label="Close image changer"
            className="inline-flex h-9 w-9 items-center justify-center border border-white/20 bg-[#121530] text-white hover:bg-[#0000f2] hover:border-[#0000f2] transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSave} className="p-6 sm:p-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
            {/* Left Column: Exact Square Card Preview */}
            <div className="md:col-span-5 space-y-3">
              <div className="flex items-center justify-between font-mono text-xs text-[#a5add4]">
                <span>Live Card Preview</span>
                {draftCustomUrl ? (
                  <span className="text-[#9ea6ff]">Custom Image</span>
                ) : (
                  <span>Default Plate</span>
                )}
              </div>

              <div className="overflow-hidden rounded-[8px] bg-[#0d1be0] aspect-[334/320] w-full border border-white/12">
                {!previewFailed ? (
                  <img
                    src={previewSrc}
                    alt={writeup.title}
                    referrerPolicy="no-referrer"
                    onError={() => setPreviewFailed(true)}
                    className="h-full w-full object-cover object-center"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center p-4 text-center font-mono text-xs text-white/85">
                    Image preview could not load. Check the URL or upload a file.
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between gap-2 pt-1">
                <span className="font-mono text-[11px] text-[#9ca2c4] truncate">
                  {writeup.title}
                </span>
                {draftCustomUrl && (
                  <button
                    type="button"
                    onClick={handleResetDefault}
                    className="inline-flex items-center gap-1 border border-white/18 bg-[#121530] px-2.5 py-1 font-mono text-[11px] text-[#d6daf2] hover:border-white/40 hover:text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    <RotateCcw className="h-3 w-3" />
                    <span>Reset Default</span>
                  </button>
                )}
              </div>
            </div>

            {/* Right Column: Source Selector Tabs & Controls */}
            <div className="md:col-span-7 space-y-5">
              {/* Source Tabs */}
              <div
                className="flex flex-wrap items-center gap-1 border border-white/12 bg-[#060713] p-1"
                role="tablist"
                aria-label="Image source options"
              >
                <button
                  type="button"
                  role="tab"
                  aria-selected={activeTab === 'upload'}
                  onClick={() => setActiveTab('upload')}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 font-mono text-xs transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    activeTab === 'upload'
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
                  aria-selected={activeTab === 'gallery'}
                  onClick={() => setActiveTab('gallery')}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 font-mono text-xs transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    activeTab === 'gallery'
                      ? 'bg-[#0000f2] text-white'
                      : 'text-[#a5add4] hover:text-white'
                  }`}
                >
                  <ImagePlus className="h-3.5 w-3.5" />
                  <span>Built-in Plates</span>
                </button>

                <button
                  type="button"
                  role="tab"
                  aria-selected={activeTab === 'url'}
                  onClick={() => setActiveTab('url')}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 font-mono text-xs transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    activeTab === 'url'
                      ? 'bg-[#0000f2] text-white'
                      : 'text-[#a5add4] hover:text-white'
                  }`}
                >
                  <Link2 className="h-3.5 w-3.5" />
                  <span>Image URL</span>
                </button>
              </div>

              {/* TAB 1: UPLOAD FROM COMPUTER */}
              {activeTab === 'upload' && (
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
                      onChange={handleFileInputChange}
                      className="hidden"
                    />
                    <ImagePlus className="h-7 w-7 text-[#8e98ff]" />
                    <div className="space-y-1">
                      <p className="text-sm text-white">
                        Drop an image here or choose a file from your device
                      </p>
                      <p className="font-mono text-xs text-[#9ca2c4]">
                        PNG, JPG, or WebP · Automatically optimized for cloud storage
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

                  {/* Color Mode Toggle for Uploaded Images */}
                  <div className="space-y-1.5">
                    <span className="block font-mono text-xs text-[#a5add4]">
                      Uploaded Image Color Treatment
                    </span>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => void handleToggleDitherMode(false)}
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
                        onClick={() => void handleToggleDitherMode(true)}
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

              {/* TAB 2: BUILT-IN PLATES */}
              {activeTab === 'gallery' && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-72 overflow-y-auto pr-1">
                  {BUILT_IN_WRITEUP_GALLERY.map((plate) => {
                    const isSelected = plate.useAsCustomUrl
                      ? draftCustomUrl === plate.src
                      : draftCustomUrl === '' && selectedGodPreset === plate.godPreset;
                    return (
                      <button
                        key={plate.id}
                        type="button"
                        onClick={() => {
                          setUploadedFile(null);
                          setSelectedGodPreset(plate.godPreset);
                          setDraftCustomUrl(plate.useAsCustomUrl ? plate.src : '');
                          setPreviewFailed(false);
                          setErrorMsg('');
                        }}
                        className={`flex flex-col border text-left transition-colors cursor-pointer ${
                          isSelected
                            ? 'border-[#5f6bff] bg-[#141945]'
                            : 'border-white/12 bg-[#060713] hover:border-white/30'
                        }`}
                      >
                        <div className="aspect-[334/320] w-full overflow-hidden bg-[#0d1be0]">
                          <img
                            src={plate.src}
                            alt={plate.label}
                            referrerPolicy="no-referrer"
                            className="h-full w-full object-cover object-center"
                          />
                        </div>
                        <div className="p-2">
                          <div className="font-mono text-[11px] text-white truncate">
                            {plate.label}
                          </div>
                          <div className="font-mono text-[10px] text-[#9ca2c4] truncate">
                            {plate.subtitle}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* TAB 3: DIRECT IMAGE URL */}
              {activeTab === 'url' && (
                <div className="space-y-3">
                  <label htmlFor="writeup-img-url" className="block font-mono text-xs text-[#a5add4]">
                    Direct Image URL (HTTPS or /assets/ path)
                  </label>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      id="writeup-img-url"
                      type="url"
                      value={urlInput}
                      onChange={(e) => setUrlInput(e.target.value)}
                      placeholder="https://example.com/writeup-cover.png"
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
                    Paste any direct image link and click Preview URL, then click Save Image below.
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
              <span>{isSaving ? 'Saving Image...' : 'Save Image'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
