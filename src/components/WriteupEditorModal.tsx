  import React, { useEffect, useRef, useState } from 'react';
import { RotateCcw, Save, Upload, X } from 'lucide-react';
import {
  GREEK_GOD_PRESETS,
  GodPresetKey,
  MAX_CUSTOM_IMAGE_URL_LENGTH,
  SecurityWriteup,
  WriteupCategory,
  isValidCustomImageUrlClient,
} from '../data/portfolioData';
import { processUploadedWriteupImage } from '../utils/imageProcessor';
import { ArtworkImage } from './ArtworkImage';

export interface WriteupFormValues {
  index: string;
  title: string;
  subtitle: string;
  category: Exclude<WriteupCategory, WriteupCategory.ALL>;
  date: string;
  environment: string;
  owaspMapping: string;
  readTime: string;
  godPreset: GodPresetKey;
  customImageUrl: string;
  visibility: 'public' | 'draft';
  order: number;
  summary: string;
  vulnerabilityRootCause: string;
  exploitationStepsText: string;
  remediation: string;
  httpPoc: string;
  curlVerify: string;
}

interface WriteupEditorModalProps {
  isOpen: boolean;
  editingWriteup: SecurityWriteup | null;
  nextIndexNumber: number;
  isSaving: boolean;
  onClose: () => void;
  onSave: (values: WriteupFormValues, existingId?: string) => Promise<void>;
}

const CATEGORIES: Exclude<WriteupCategory, WriteupCategory.ALL>[] = [
  WriteupCategory.AUTH,
  WriteupCategory.SERVER,
  WriteupCategory.CLIENT_API,
];

const GOD_KEYS: GodPresetKey[] = ['athena', 'apollo', 'poseidon'];

export const WriteupEditorModal: React.FC<WriteupEditorModalProps> = ({
  isOpen,
  editingWriteup,
  nextIndexNumber,
  isSaving,
  onClose,
  onSave,
}) => {
  const paddedNext = String(nextIndexNumber).padStart(2, '0');
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [index, setIndex] = useState(paddedNext);
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [category, setCategory] = useState<Exclude<WriteupCategory, WriteupCategory.ALL>>(
    WriteupCategory.AUTH
  );
  const [date, setDate] = useState('October 2026');
  const [environment, setEnvironment] = useState('WebSec Lab Research');
  const [owaspMapping, setOwaspMapping] = useState('OWASP A01 · Broken Access Control');
  const [readTime, setReadTime] = useState('6 min read');
  const [godPreset, setGodPreset] = useState<GodPresetKey>('athena');
  const [customImageUrl, setCustomImageUrl] = useState<string>('');
  const [useBlueDither, setUseBlueDither] = useState<boolean>(false);
  const [isUploadingImage, setIsUploadingImage] = useState<boolean>(false);
  const [visibility, setVisibility] = useState<'public' | 'draft'>('public');
  const [order, setOrder] = useState<number>(nextIndexNumber);
  const [summary, setSummary] = useState('');
  const [vulnerabilityRootCause, setVulnerabilityRootCause] = useState('');
  const [exploitationStepsText, setExploitationStepsText] = useState('');
  const [remediation, setRemediation] = useState('');
  const [httpPoc, setHttpPoc] = useState('');
  const [curlVerify, setCurlVerify] = useState('');
  const [validationError, setValidationError] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    setValidationError('');
    setUseBlueDither(false);

    if (editingWriteup) {
      setIndex(editingWriteup.index);
      setTitle(editingWriteup.title);
      setSubtitle(editingWriteup.subtitle);
      setCategory(editingWriteup.category);
      setDate(editingWriteup.date);
      setEnvironment(editingWriteup.environment);
      setOwaspMapping(editingWriteup.owaspMapping);
      setReadTime(editingWriteup.readTime);
      setGodPreset(editingWriteup.godPreset);
      setCustomImageUrl(editingWriteup.customImageUrl ?? '');
      setVisibility(editingWriteup.visibility);
      setOrder(editingWriteup.order);
      setSummary(editingWriteup.summary);
      setVulnerabilityRootCause(editingWriteup.vulnerabilityRootCause);
      setExploitationStepsText(editingWriteup.exploitationChain.join('\n'));
      setRemediation(editingWriteup.remediation);
      setHttpPoc(editingWriteup.httpPoc);
      setCurlVerify(editingWriteup.curlVerify);
    } else {
      const nextIdx = String(nextIndexNumber).padStart(2, '0');
      setIndex(nextIdx);
      setTitle('');
      setSubtitle('');
      setCategory(WriteupCategory.AUTH);
      setDate('October 2026');
      setEnvironment('WebSec Lab Research');
      setOwaspMapping('OWASP A01 · Broken Access Control');
      setReadTime('6 min read');
      setGodPreset('athena');
      setCustomImageUrl('');
      setVisibility('public');
      setOrder(nextIndexNumber);
      setSummary('');
      setVulnerabilityRootCause('');
      setExploitationStepsText('');
      setRemediation('');
      setHttpPoc('GET /api/v1/target HTTP/1.1\nHost: target.lab');
      setCurlVerify('curl -i https://target.lab/api/v1/target');
    }
  }, [isOpen, editingWriteup, nextIndexNumber]);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isSaving) onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, isSaving, onClose]);

  if (!isOpen) return null;

  const handleUploadCustomFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setValidationError('');
    setIsUploadingImage(true);
    try {
      const dataUrl = await processUploadedWriteupImage(file, useBlueDither);
      setCustomImageUrl(dataUrl);
    } catch (err) {
      setValidationError(err instanceof Error ? err.message : 'Could not process selected image.');
    } finally {
      setIsUploadingImage(false);
      e.target.value = '';
    }
  };

  // Enforce schema constraints synchronized verbatim with firebase-blueprint.json & firestore.rules
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const cleanIndex = index.trim().slice(0, 8);
    const cleanTitle = title.trim().slice(0, 160);
        const cleanSubtitle = (subtitle.trim() || cleanTitle).slice(0, 240);
    const cleanDate = date.trim().slice(0, 40);
    const cleanEnv = environment.trim().slice(0, 80);
    const cleanOwasp = owaspMapping.trim().slice(0, 80);
    const cleanReadTime = readTime.trim().slice(0, 30);
    const cleanCustomImageUrl = customImageUrl.trim().slice(0, MAX_CUSTOM_IMAGE_URL_LENGTH);
    const cleanSummary = summary.trim().slice(0, 600);
    const cleanRootCause = vulnerabilityRootCause.trim().slice(0, 2000);
    const cleanSteps = exploitationStepsText.trim().slice(0, 4000);
    const cleanRemediation = remediation.trim().slice(0, 2000);
    const cleanHttpPoc = httpPoc.trim().slice(0, 4000);
    const cleanCurl = curlVerify.trim().slice(0, 1200);
    const safeOrder = Math.max(0, Math.min(10000, Number(order) || 1));

    if (cleanIndex.length < 1) {
      setValidationError('Index is required (e.g. 05).');
      return;
    }
    if (cleanTitle.length < 3) {
      setValidationError('Title must be between 3 and 160 characters.');
      return;
    }
    if (cleanSubtitle.length < 3) {
      setValidationError('Subtitle must be between 3 and 240 characters.');
      return;
    }
    if (cleanDate.length < 2 || cleanEnv.length < 2 || cleanOwasp.length < 2 || cleanReadTime.length < 2) {
      setValidationError('Date, environment, OWASP mapping, and read time must each be at least 2 characters.');
      return;
    }
    if (!isValidCustomImageUrlClient(cleanCustomImageUrl)) {
      setValidationError('Custom image must be a valid uploaded image, https:// link, or /assets/ path.');
      return;
    }
    if (cleanSummary.length < 10) {
      setValidationError('Summary must be at least 10 characters.');
      return;
    }
    if (cleanRootCause.length < 10) {
      setValidationError('Root cause analysis must be at least 10 characters.');
      return;
    }
    if (cleanSteps.length < 10) {
      setValidationError('Exploitation steps must be at least 10 characters (enter one step per line).');
      return;
    }
    if (cleanRemediation.length < 10) {
      setValidationError('Remediation guidance must be at least 10 characters.');
      return;
    }
    if (cleanHttpPoc.length < 5 || cleanCurl.length < 5) {
      setValidationError('HTTP PoC trace and cURL command must each be at least 5 characters.');
      return;
    }

    setValidationError('');
    await onSave(
      {
        index: cleanIndex,
        title: cleanTitle,
        subtitle: cleanSubtitle,
        category,
        date: cleanDate,
        environment: cleanEnv,
        owaspMapping: cleanOwasp,
        readTime: cleanReadTime,
        godPreset,
        customImageUrl: cleanCustomImageUrl,
        visibility,
        order: safeOrder,
        summary: cleanSummary,
        vulnerabilityRootCause: cleanRootCause,
        exploitationStepsText: cleanSteps,
        remediation: cleanRemediation,
        httpPoc: cleanHttpPoc,
        curlVerify: cleanCurl,
      },
      editingWriteup?.id
    );
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 sm:p-6 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-labelledby="editor-modal-title"
      onClick={() => {
        if (!isSaving) onClose();
      }}
    >
      <div
        className="relative max-h-[92vh] w-full max-w-4xl overflow-y-auto border border-white/20 bg-[#070919] text-[#f2f2f2]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 z-20 flex items-center justify-between gap-4 border-b border-white/15 bg-[#070919]/95 px-6 py-4 backdrop-blur-xs">
          <div>
            <div className="font-mono text-xs text-[#8a94ff]">
              Owner Writeup Studio · Sarmansinh Solanki
            </div>
            <h2 id="editor-modal-title" className="font-display text-2xl sm:text-3xl text-white">
              {editingWriteup ? `Edit Writeup ${editingWriteup.index}` : 'Publish New Security Writeup'}
            </h2>
          </div>

          <button
            type="button"
            disabled={isSaving}
            onClick={onClose}
            aria-label="Close writeup editor"
            className="inline-flex h-9 w-9 items-center justify-center border border-white/20 bg-[#0d1029] text-white hover:bg-[#1822f2] hover:border-[#1822f2] transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-6" noValidate>
          {/* Writeup Artwork Selector (Built-in Plates OR Custom Upload / URL) */}
          <div className="space-y-3 border border-white/12 bg-[#050611] p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="font-mono text-xs text-[#9ca2c4]">
                Writeup Card Image (Choose Default Plate or Upload Custom Image)
              </span>
              {customImageUrl && (
                <button
                  type="button"
                  onClick={() => setCustomImageUrl('')}
                  className="inline-flex items-center gap-1 border border-white/20 px-2.5 py-1 font-mono text-[11px] text-[#d6daf2] hover:text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <RotateCcw className="h-3 w-3" />
                  <span>Use Default Plate</span>
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {GOD_KEYS.map((key) => {
                const option = GREEK_GOD_PRESETS[key];
                const isSelected = godPreset === key && !customImageUrl;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => {
                      setGodPreset(key);
                      setCustomImageUrl('');
                    }}
                    className={`flex flex-col border text-left transition-colors cursor-pointer ${
                      isSelected
                        ? 'border-[#4f5bff] bg-[#131842]'
                        : 'border-white/12 bg-[#070919] hover:border-white/30'
                    }`}
                  >
                    <div className="h-28 w-full overflow-hidden border-b border-white/10">
                      <ArtworkImage
                        src={option.src}
                        alt={option.alt}
                        title={option.label}
                        className="h-full w-full"
                        imgClassName="object-cover object-center"
                      />
                    </div>
                    <div className="p-2">
                      <div className="font-display text-base text-white leading-tight">
                        {option.label}
                      </div>
                      <div className="font-mono text-[10px] text-[#9ca2c4] truncate">
                        {option.domain}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Custom Upload + URL Bar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2 border-t border-white/10">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleUploadCustomFile}
                className="hidden"
              />
              <button
                type="button"
                disabled={isUploadingImage}
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center justify-center gap-1.5 bg-[#1822f2] px-3.5 py-2 font-mono text-xs text-white hover:bg-[#2d37ff] disabled:opacity-60 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Upload className="h-3.5 w-3.5" />
                <span>{isUploadingImage ? 'Uploading...' : 'Upload Custom Image'}</span>
              </button>

              <label className="inline-flex items-center gap-1.5 font-mono text-xs text-[#b8bee0] whitespace-nowrap shrink-0 cursor-pointer">
                <input
                  type="checkbox"
                  checked={useBlueDither}
                  onChange={(e) => setUseBlueDither(e.target.checked)}
                  className="accent-[#0000f2]"
                />
                <span>Blue Dither Filter</span>
              </label>

              <input
                type="url"
                value={customImageUrl.startsWith('data:image/') ? '' : customImageUrl}
                onChange={(e) => setCustomImageUrl(e.target.value)}
                placeholder={
                  customImageUrl.startsWith('data:image/')
                    ? 'Custom uploaded image ready'
                    : 'Or paste https:// image URL...'
                }
                className="flex-1 border border-white/15 bg-[#070919] px-3 py-2 font-mono text-xs text-white placeholder-[#6d749c] focus:border-[#5f6bff] focus:outline-none"
              />
            </div>

            {customImageUrl && (
              <div className="flex items-center gap-3 pt-1">
                <div className="h-16 w-16 overflow-hidden rounded-[6px] border border-white/20 bg-[#0d1be0] shrink-0">
                  <img
                    src={customImageUrl}
                    alt="Custom writeup preview"
                    referrerPolicy="no-referrer"
                    className="h-full w-full object-cover object-center"
                  />
                </div>
                <span className="font-mono text-xs text-[#9ea6ff]">
                  Custom cover image active for this writeup.
                </span>
              </div>
            )}
          </div>

          {/* Primary Metadata Row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="space-y-1.5">
              <label htmlFor="wu-index" className="block font-mono text-xs text-[#9ca2c4]">
                Index Label
              </label>
              <input
                id="wu-index"
                type="text"
                maxLength={8}
                value={index}
                onChange={(e) => setIndex(e.target.value)}
                className="w-full border border-white/15 bg-[#050611] px-3 py-2 font-mono text-sm text-white focus:border-[#5f6bff] focus:outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="wu-order" className="block font-mono text-xs text-[#9ca2c4]">
                Sort Order
              </label>
              <input
                id="wu-order"
                type="number"
                min={0}
                max={10000}
                value={order}
                onChange={(e) => setOrder(Number(e.target.value))}
                className="w-full border border-white/15 bg-[#050611] px-3 py-2 font-mono text-sm text-white focus:border-[#5f6bff] focus:outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="wu-category" className="block font-mono text-xs text-[#9ca2c4]">
                Category
              </label>
              <select
                id="wu-category"
                value={category}
                onChange={(e) =>
                  setCategory(e.target.value as Exclude<WriteupCategory, WriteupCategory.ALL>)
                }
                className="w-full border border-white/15 bg-[#050611] px-3 py-2 font-mono text-xs text-white focus:border-[#5f6bff] focus:outline-none"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="wu-visibility" className="block font-mono text-xs text-[#9ca2c4]">
                Visibility
              </label>
              <select
                id="wu-visibility"
                value={visibility}
                onChange={(e) => setVisibility(e.target.value as 'public' | 'draft')}
                className="w-full border border-white/15 bg-[#050611] px-3 py-2 font-mono text-xs text-white focus:border-[#5f6bff] focus:outline-none"
              >
                <option value="public">Public</option>
                <option value="draft">Private Draft (Only Me)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label htmlFor="wu-title" className="block font-mono text-xs text-[#9ca2c4]">
                Writeup Title
              </label>
              <input
                id="wu-title"
                type="text"
                maxLength={160}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Bypassing JWT RS256 Verification via Embedded JWK"
                className="w-full border border-white/15 bg-[#050611] px-3.5 py-2.5 text-sm text-white placeholder-[#5e658a] focus:border-[#5f6bff] focus:outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="wu-subtitle" className="block font-mono text-xs text-[#9ca2c4]">
                Technical Subtitle
              </label>
              <input
                id="wu-subtitle"
                type="text"
                maxLength={240}
                value={subtitle}
                onChange={(e) => setSubtitle(e.target.value)}
                placeholder="Self-signed key injection in an authentication microservice"
                className="w-full border border-white/15 bg-[#050611] px-3.5 py-2.5 text-sm text-white placeholder-[#5e658a] focus:border-[#5f6bff] focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="space-y-1.5">
              <label htmlFor="wu-owasp" className="block font-mono text-xs text-[#9ca2c4]">
                OWASP Mapping
              </label>
              <input
                id="wu-owasp"
                type="text"
                maxLength={80}
                value={owaspMapping}
                onChange={(e) => setOwaspMapping(e.target.value)}
                className="w-full border border-white/15 bg-[#050611] px-3 py-2 text-xs text-white focus:border-[#5f6bff] focus:outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="wu-env" className="block font-mono text-xs text-[#9ca2c4]">
                Lab / CTF Target
              </label>
              <input
                id="wu-env"
                type="text"
                maxLength={80}
                value={environment}
                onChange={(e) => setEnvironment(e.target.value)}
                className="w-full border border-white/15 bg-[#050611] px-3 py-2 text-xs text-white focus:border-[#5f6bff] focus:outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="wu-date" className="block font-mono text-xs text-[#9ca2c4]">
                Date
              </label>
              <input
                id="wu-date"
                type="text"
                maxLength={40}
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full border border-white/15 bg-[#050611] px-3 py-2 text-xs text-white focus:border-[#5f6bff] focus:outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="wu-readtime" className="block font-mono text-xs text-[#9ca2c4]">
                Read Time
              </label>
              <input
                id="wu-readtime"
                type="text"
                maxLength={30}
                value={readTime}
                onChange={(e) => setReadTime(e.target.value)}
                className="w-full border border-white/15 bg-[#050611] px-3 py-2 text-xs text-white focus:border-[#5f6bff] focus:outline-none"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="wu-summary" className="block font-mono text-xs text-[#9ca2c4]">
              Card Summary
            </label>
            <textarea
              id="wu-summary"
              rows={2}
              maxLength={600}
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="Concise overview displayed on the writeup card..."
              className="w-full border border-white/15 bg-[#050611] px-3.5 py-2.5 text-sm text-white placeholder-[#5e658a] focus:border-[#5f6bff] focus:outline-none"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="wu-rootcause" className="block font-mono text-xs text-[#9ca2c4]">
              01. Root Cause Analysis
            </label>
            <textarea
              id="wu-rootcause"
              rows={3}
              maxLength={2000}
              value={vulnerabilityRootCause}
              onChange={(e) => setVulnerabilityRootCause(e.target.value)}
              placeholder="Explain why the vulnerability existed in the application logic..."
              className="w-full border border-white/15 bg-[#050611] px-3.5 py-2.5 text-sm text-white placeholder-[#5e658a] focus:border-[#5f6bff] focus:outline-none"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="wu-steps" className="block font-mono text-xs text-[#9ca2c4]">
              02. Exploitation Walkthrough (One Step Per Line)
            </label>
            <textarea
              id="wu-steps"
              rows={4}
              maxLength={4000}
              value={exploitationStepsText}
              onChange={(e) => setExploitationStepsText(e.target.value)}
              placeholder={'Enumerated JWT header handling on /api/auth\nCrafted embedded jwk parameter signed with local RSA keypair\nObtained administrative session token'}
              className="w-full border border-white/15 bg-[#050611] px-3.5 py-2.5 font-mono text-xs text-white placeholder-[#5e658a] focus:border-[#5f6bff] focus:outline-none leading-relaxed"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label htmlFor="wu-poc" className="block font-mono text-xs text-[#9ca2c4]">
                HTTP Proof of Concept Trace
              </label>
              <textarea
                id="wu-poc"
                rows={4}
                maxLength={4000}
                value={httpPoc}
                onChange={(e) => setHttpPoc(e.target.value)}
                className="w-full border border-white/15 bg-[#050611] px-3.5 py-2.5 font-mono text-xs text-white focus:border-[#5f6bff] focus:outline-none leading-relaxed"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="wu-curl" className="block font-mono text-xs text-[#9ca2c4]">
                Reproducible Verification Command (cURL)
              </label>
              <textarea
                id="wu-curl"
                rows={4}
                maxLength={1200}
                value={curlVerify}
                onChange={(e) => setCurlVerify(e.target.value)}
                className="w-full border border-white/15 bg-[#050611] px-3.5 py-2.5 font-mono text-xs text-white focus:border-[#5f6bff] focus:outline-none leading-relaxed"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="wu-remediation" className="block font-mono text-xs text-[#9ca2c4]">
              03. Recommended Remediation
            </label>
            <textarea
              id="wu-remediation"
              rows={2}
              maxLength={2000}
              value={remediation}
              onChange={(e) => setRemediation(e.target.value)}
              placeholder="Describe how developers should patch and harden the endpoint..."
              className="w-full border border-white/15 bg-[#050611] px-3.5 py-2.5 text-sm text-white placeholder-[#5e658a] focus:border-[#5f6bff] focus:outline-none"
            />
          </div>

          {validationError && (
            <p role="alert" className="font-mono text-xs text-[#ff8585]">
              {validationError}
            </p>
          )}

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
              disabled={isSaving}
              className="inline-flex items-center gap-2 bg-[#1822f2] px-5 py-2 font-mono text-xs font-medium text-white hover:bg-[#2d37ff] disabled:opacity-60 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Save className="h-3.5 w-3.5" />
              <span>{isSaving ? 'Saving to Vault...' : editingWriteup ? 'Save Changes' : 'Publish Writeup'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
