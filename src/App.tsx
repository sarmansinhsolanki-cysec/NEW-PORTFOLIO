/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  Check,
  Copy,
  FileText,
  ImagePlus,
  Lock,
  LogOut,
  Plus,
} from 'lucide-react';
import { User, onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth';
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import {
  BACKGROUND_ARTWORKS,
  GREEK_GOD_PRESETS,
  GodPresetKey,
  INITIAL_WRITEUPS,
  MAX_CUSTOM_IMAGE_URL_LENGTH,
  MAX_SITE_MEDIA_URL_LENGTH,
  STUDENT_HIGHLIGHTS,
  SecurityWriteup,
  SiteMediaSlotId,
  SiteMediaState,
  WEBSEC_SKILLS,
  WriteupCategory,
  isValidCustomImageUrlClient,
  isValidSiteMediaUrlClient,
} from './data/portfolioData';
import {
  OWNER_EMAIL,
  OperationType,
  auth,
  db,
  googleProvider,
  handleFirestoreError,
} from './lib/firebase';
import { BrandLogoMark } from './components/BrandLogoMark';
import { ClosingNameSignature } from './components/ClosingNameSignature';
import { SiteMediaModal } from './components/SiteMediaModal';
import { WriteupModal } from './components/WriteupModal';
import { WriteupEditorModal, WriteupFormValues } from './components/WriteupEditorModal';
import { WriteupImageModal } from './components/WriteupImageModal';
import { WriteupPosterCard } from './components/WriteupPosterCard';

const WRITEUP_FILTERS: WriteupCategory[] = [
  WriteupCategory.ALL,
  WriteupCategory.AUTH,
  WriteupCategory.SERVER,
  WriteupCategory.CLIENT_API,
];

const CONTACT_TOPICS = [
  'Internship / Security Role',
  'Bug Bounty Collaboration',
  'CTF Team & Labs',
  'Writeup Discussion',
];

function parseFirestoreWriteup(id: string, data: Record<string, unknown>): SecurityWriteup {
  const rawSteps = typeof data.exploitationStepsText === 'string' ? data.exploitationStepsText : '';
  const steps = rawSteps
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

  const preset = (data.godPreset as GodPresetKey) in GREEK_GOD_PRESETS
    ? (data.godPreset as GodPresetKey)
    : 'athena';

  return {
    id,
    index: String(data.index ?? '01'),
    title: String(data.title ?? ''),
    subtitle: String(data.subtitle ?? ''),
    category: (data.category as Exclude<WriteupCategory, WriteupCategory.ALL>) ?? WriteupCategory.AUTH,
    date: String(data.date ?? ''),
    environment: String(data.environment ?? ''),
    owaspMapping: String(data.owaspMapping ?? ''),
    readTime: String(data.readTime ?? ''),
    godPreset: preset,
    customImageUrl: typeof data.customImageUrl === 'string' ? data.customImageUrl : '',
    visibility: data.visibility === 'draft' ? 'draft' : 'public',
    order: typeof data.order === 'number' ? data.order : 1,
    summary: String(data.summary ?? ''),
    vulnerabilityRootCause: String(data.vulnerabilityRootCause ?? ''),
    exploitationChain: steps.length > 0 ? steps : ['Step-by-step analysis documented in PoC.'],
    remediation: String(data.remediation ?? ''),
    httpPoc: String(data.httpPoc ?? ''),
    curlVerify: String(data.curlVerify ?? ''),
  };
}

export default function App() {
  const [selectedSkillId, setSelectedSkillId] = useState<string>(WEBSEC_SKILLS[0].id);
  const [copiedHttp, setCopiedHttp] = useState(false);

  // Auth & Owner State
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [authBusy, setAuthBusy] = useState(false);
  const [authNotice, setAuthNotice] = useState('');

  const isOwner = Boolean(
    currentUser &&
      currentUser.emailVerified &&
      currentUser.email?.toLowerCase() === OWNER_EMAIL
  );

  // Writeups State
  const [isVaultSeeded, setIsVaultSeeded] = useState<boolean>(false);
  const [cloudWriteups, setCloudWriteups] = useState<SecurityWriteup[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<WriteupCategory>(
    WriteupCategory.ALL
  );
  const [activeWriteup, setActiveWriteup] = useState<SecurityWriteup | null>(null);

  // Owner Writeup Studio, Writeup Image & Site Media Studio State
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingWriteup, setEditingWriteup] = useState<SecurityWriteup | null>(null);
  const [isSavingWriteup, setIsSavingWriteup] = useState(false);
  const [imageModalWriteup, setImageModalWriteup] = useState<SecurityWriteup | null>(null);
  const [isSavingImage, setIsSavingImage] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const [siteMedia, setSiteMedia] = useState<Record<SiteMediaSlotId, SiteMediaState>>({
    background: { imageUrl: '', blendMode: 'normal' },
    hero: { imageUrl: '', blendMode: 'lighten' },
    closingBanner: { imageUrl: '', blendMode: 'normal' },
  });
  const [cloudSiteMediaSlots, setCloudSiteMediaSlots] = useState<Set<SiteMediaSlotId>>(new Set());
  const [activeSiteMediaSlot, setActiveSiteMediaSlot] = useState<SiteMediaSlotId | null>(null);
  const [isSavingSiteMedia, setIsSavingSiteMedia] = useState(false);

  // Contact Section State
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [contactTopic, setContactTopic] = useState<string>(CONTACT_TOPICS[0]);
  const [senderName, setSenderName] = useState('');
  const [senderEmail, setSenderEmail] = useState('');
  const [messageBody, setMessageBody] = useState('');
  const [formError, setFormError] = useState('');
  const [submittedReceipt, setSubmittedReceipt] = useState<{
    name: string;
    email: string;
    topic: string;
    timestamp: string;
  } | null>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setAuthReady(true);
      if (user && user.email?.toLowerCase() !== OWNER_EMAIL) {
        setAuthNotice(
          `Signed in as ${user.email}. Read-only mode — writeup editing is restricted to Sarmansinh Solanki.`
        );
      } else {
        setAuthNotice('');
      }
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!authReady) return;

    const configQuery = query(
      collection(db, 'siteConfig'),
      where('visibility', '==', 'public')
    );

    const unsubConfig = onSnapshot(
      configQuery,
      (snap) => {
        const portfolioDoc = snap.docs.find((d) => d.id === 'portfolio');
        setIsVaultSeeded(Boolean(portfolioDoc?.data()?.seeded));
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, 'siteConfig');
      }
    );

    const writeupsQuery = isOwner
      ? query(collection(db, 'writeups'))
      : query(collection(db, 'writeups'), where('visibility', '==', 'public'));

    const unsubWriteups = onSnapshot(
      writeupsQuery,
      (snap) => {
        const items = snap.docs
          .map((d) => parseFirestoreWriteup(d.id, d.data() as Record<string, unknown>))
          .sort((a, b) => a.order - b.order);
        setCloudWriteups(items);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, 'writeups');
      }
    );

    const siteMediaQuery = query(
      collection(db, 'siteMedia'),
      where('visibility', '==', 'public')
    );

    const unsubSiteMedia = onSnapshot(
      siteMediaQuery,
      (snap) => {
        const nextState: Record<SiteMediaSlotId, SiteMediaState> = {
          background: { imageUrl: '', blendMode: 'normal' },
          hero: { imageUrl: '', blendMode: 'lighten' },
          closingBanner: { imageUrl: '', blendMode: 'normal' },
        };
        const existingSlots = new Set<SiteMediaSlotId>();

        const DEFAULT_MEDIA_EPOCH_MS = 1793353273000; // 2026-10-30T02:41:13-07:00
        for (const docSnap of snap.docs) {
          const id = docSnap.id as SiteMediaSlotId;
          if (id === 'background' || id === 'hero' || id === 'closingBanner') {
            const raw = docSnap.data();
            const rawUrl = typeof raw.imageUrl === 'string' ? raw.imageUrl : '';
            const updatedAtObj = raw.updatedAt as { toMillis?: () => number } | undefined;
            const updatedAtMs =
              typeof updatedAtObj?.toMillis === 'function' ? updatedAtObj.toMillis() : 0;
            const isSupersededDefaultMedia =
              updatedAtMs > 0 && updatedAtMs < DEFAULT_MEDIA_EPOCH_MS;
            const isLegacyHermesUrl =
              rawUrl.includes('Screenshot_2026-10-29_210814') ||
              rawUrl.includes('Screenshot_2026-10-30_130535') ||
              rawUrl.includes('bg_dithered_hermes_terminals');
            const rawBlend = raw.blendMode === 'lighten' ? 'lighten' : 'normal';
            nextState[id] = {
              imageUrl:
                !isLegacyHermesUrl &&
                !isSupersededDefaultMedia &&
                isValidSiteMediaUrlClient(rawUrl)
                  ? rawUrl
                  : '',
              blendMode: rawBlend,
            };
            existingSlots.add(id);
          }
        }

        setSiteMedia(nextState);
        setCloudSiteMediaSlots(existingSlots);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, 'siteMedia');
      }
    );

    return () => {
      unsubConfig();
      unsubWriteups();
      unsubSiteMedia();
    };
  }, [authReady, isOwner]);

  useEffect(() => {
    if (!authReady || !isOwner || !currentUser) return;

    let cancelled = false;
    const ensureVaultSeeded = async () => {
      try {
        const metaSnap = await getDocs(
          query(collection(db, 'siteConfig'), where('visibility', '==', 'public'))
        );
        const alreadySeeded = metaSnap.docs.some(
          (d) => d.id === 'portfolio' && d.data().seeded === true
        );
        if (alreadySeeded || cancelled) return;

        const batch = writeBatch(db);
        for (const item of INITIAL_WRITEUPS) {
          const ref = doc(db, 'writeups', item.id);
          batch.set(ref, {
            index: item.index,
            title: item.title,
            subtitle: item.subtitle,
            category: item.category,
            date: item.date,
            environment: item.environment,
            owaspMapping: item.owaspMapping,
            readTime: item.readTime,
            godPreset: item.godPreset,
            visibility: item.visibility,
            order: item.order,
            summary: item.summary,
            vulnerabilityRootCause: item.vulnerabilityRootCause,
            exploitationStepsText: item.exploitationChain.join('\n'),
            remediation: item.remediation,
            httpPoc: item.httpPoc,
            curlVerify: item.curlVerify,
            authorUid: currentUser.uid,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
        }

        batch.set(doc(db, 'siteConfig', 'portfolio'), {
          seeded: true,
          visibility: 'public',
          authorUid: currentUser.uid,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });

        await batch.commit();
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, 'writeups');
      }
    };

    void ensureVaultSeeded();
    return () => {
      cancelled = true;
    };
  }, [authReady, isOwner, currentUser]);

  const displayedWriteups = useMemo(() => {
    const source = isVaultSeeded || cloudWriteups.length > 0 ? cloudWriteups : INITIAL_WRITEUPS;
    if (selectedCategory === WriteupCategory.ALL) return source;
    return source.filter((w) => w.category === selectedCategory);
  }, [isVaultSeeded, cloudWriteups, selectedCategory]);

  const activeSkill = useMemo(
    () => WEBSEC_SKILLS.find((s) => s.id === selectedSkillId) ?? WEBSEC_SKILLS[0],
    [selectedSkillId]
  );

  const handleOwnerSignIn = async () => {
    setAuthBusy(true);
    setAuthNotice('');
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Sign-in canceled.';
      if (!msg.includes('popup-closed-by-user')) {
        setAuthNotice('Google authentication could not complete. Please try again.');
      }
    } finally {
      setAuthBusy(false);
    }
  };

  const handleSignOut = async () => {
    await signOut(auth);
    setConfirmDeleteId(null);
  };

  const handleSaveWriteup = async (values: WriteupFormValues, existingId?: string) => {
    if (!isOwner || !currentUser) return;
    setIsSavingWriteup(true);
    const cleanCustomImageUrl = values.customImageUrl.trim().slice(0, MAX_CUSTOM_IMAGE_URL_LENGTH);
    const safeCustomUrl = isValidCustomImageUrlClient(cleanCustomImageUrl)
      ? cleanCustomImageUrl
      : '';
    const existsInCloud = Boolean(existingId && cloudWriteups.some((w) => w.id === existingId));

    try {
      if (existingId && existsInCloud) {
        const docRef = doc(db, 'writeups', existingId);
        await updateDoc(docRef, {
          index: values.index,
          title: values.title,
          subtitle: values.subtitle,
          category: values.category,
          date: values.date,
          environment: values.environment,
          owaspMapping: values.owaspMapping,
          readTime: values.readTime,
          godPreset: values.godPreset,
          customImageUrl: safeCustomUrl,
          visibility: values.visibility,
          order: values.order,
          summary: values.summary,
          vulnerabilityRootCause: values.vulnerabilityRootCause,
          exploitationStepsText: values.exploitationStepsText,
          remediation: values.remediation,
          httpPoc: values.httpPoc,
          curlVerify: values.curlVerify,
          updatedAt: serverTimestamp(),
        });
      } else {
        const cleanSlug = values.title
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-+|-+$/g, '')
          .slice(0, 48);
        const targetId = existingId || `wu-${cleanSlug || 'entry'}-${Date.now().toString(36)}`;
        await setDoc(doc(db, 'writeups', targetId), {
          index: values.index,
          title: values.title,
          subtitle: values.subtitle,
          category: values.category,
          date: values.date,
          environment: values.environment,
          owaspMapping: values.owaspMapping,
          readTime: values.readTime,
          godPreset: values.godPreset,
          customImageUrl: safeCustomUrl,
          visibility: values.visibility,
          order: values.order,
          summary: values.summary,
          vulnerabilityRootCause: values.vulnerabilityRootCause,
          exploitationStepsText: values.exploitationStepsText,
          remediation: values.remediation,
          httpPoc: values.httpPoc,
          curlVerify: values.curlVerify,
          authorUid: currentUser.uid,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }
      setEditorOpen(false);
      setEditingWriteup(null);
    } catch (error) {
      handleFirestoreError(
        error,
        existingId && existsInCloud ? OperationType.UPDATE : OperationType.CREATE,
        `writeups/${existingId ?? 'new'}`
      );
    } finally {
      setIsSavingWriteup(false);
    }
  };

  const handleSaveWriteupImage = async (
    target: SecurityWriteup,
    nextGodPreset: GodPresetKey,
    nextCustomImageUrl: string
  ) => {
    if (!isOwner || !currentUser) return;
    const cleanUrl = nextCustomImageUrl.trim().slice(0, MAX_CUSTOM_IMAGE_URL_LENGTH);
    if (!isValidCustomImageUrlClient(cleanUrl)) return;

    setIsSavingImage(true);
    const existsInCloud = cloudWriteups.some((w) => w.id === target.id);
    try {
      const docRef = doc(db, 'writeups', target.id);
      if (existsInCloud) {
        await updateDoc(docRef, {
          godPreset: nextGodPreset,
          customImageUrl: cleanUrl,
          updatedAt: serverTimestamp(),
        });
      } else {
        await setDoc(docRef, {
          index: target.index.slice(0, 8),
          title: target.title.slice(0, 160),
          subtitle: target.subtitle.slice(0, 240),
          category: target.category,
          date: target.date.slice(0, 40),
          environment: target.environment.slice(0, 80),
          owaspMapping: target.owaspMapping.slice(0, 80),
          readTime: target.readTime.slice(0, 30),
          godPreset: nextGodPreset,
          customImageUrl: cleanUrl,
          visibility: target.visibility,
          order: target.order,
          summary: target.summary.slice(0, 600),
          vulnerabilityRootCause: target.vulnerabilityRootCause.slice(0, 2000),
          exploitationStepsText: target.exploitationChain.join('\n').slice(0, 4000),
          remediation: target.remediation.slice(0, 2000),
          httpPoc: target.httpPoc.slice(0, 4000),
          curlVerify: target.curlVerify.slice(0, 1200),
          authorUid: currentUser.uid,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }
      setActiveWriteup((prev) =>
        prev && prev.id === target.id
          ? { ...prev, godPreset: nextGodPreset, customImageUrl: cleanUrl }
          : prev
      );
      setImageModalWriteup(null);
    } catch (error) {
      handleFirestoreError(
        error,
        existsInCloud ? OperationType.UPDATE : OperationType.CREATE,
        `writeups/${target.id}`
      );
    } finally {
      setIsSavingImage(false);
    }
  };

  const handleSaveSiteMediaSlot = async (
    slot: SiteMediaSlotId,
    nextImageUrl: string,
    nextBlendMode: 'normal' | 'lighten'
  ) => {
    if (!isOwner || !currentUser) return;
    const cleanUrl = nextImageUrl.trim().slice(0, MAX_SITE_MEDIA_URL_LENGTH);
    if (!isValidSiteMediaUrlClient(cleanUrl)) return;

    setIsSavingSiteMedia(true);
    const existsInCloud = cloudSiteMediaSlots.has(slot);
    try {
      const slotRef = doc(db, 'siteMedia', slot);
      if (existsInCloud) {
        await updateDoc(slotRef, {
          imageUrl: cleanUrl,
          blendMode: nextBlendMode,
          updatedAt: serverTimestamp(),
        });
      } else {
        await setDoc(slotRef, {
          slot,
          imageUrl: cleanUrl,
          blendMode: nextBlendMode,
          visibility: 'public',
          authorUid: currentUser.uid,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }
      setActiveSiteMediaSlot(null);
    } catch (error) {
      handleFirestoreError(
        error,
        existsInCloud ? OperationType.UPDATE : OperationType.CREATE,
        `siteMedia/${slot}`
      );
    } finally {
      setIsSavingSiteMedia(false);
    }
  };

  const handleDeleteWriteup = async (id: string) => {
    if (!isOwner) return;
    try {
      await deleteDoc(doc(db, 'writeups', id));
      setConfirmDeleteId(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `writeups/${id}`);
    }
  };

  const scrollToSection = (sectionId: string) => {
    const el = document.getElementById(sectionId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleCopyHttpSnippet = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // Visual state confirms
    }
    setCopiedHttp(true);
    window.setTimeout(() => setCopiedHttp(false), 1800);
  };

  const handleCopyEmail = async () => {
    try {
      await navigator.clipboard.writeText(OWNER_EMAIL);
    } catch {
      // Visual state confirms
    }
    setCopiedEmail(true);
    window.setTimeout(() => setCopiedEmail(false), 1800);
  };

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!senderName.trim() || !senderEmail.trim() || !messageBody.trim()) {
      setFormError('Please fill in your name, email address, and message.');
      return;
    }
    if (!senderEmail.includes('@')) {
      setFormError('Please enter a valid email address.');
      return;
    }
    setFormError('');
    setSubmittedReceipt({
      name: senderName.trim(),
      email: senderEmail.trim(),
      topic: contactTopic,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    });
    setSenderName('');
    setSenderEmail('');
    setMessageBody('');
  };

  const totalCount = (isVaultSeeded || cloudWriteups.length > 0 ? cloudWriteups : INITIAL_WRITEUPS).length;

  const customBgUrl = siteMedia.background.imageUrl.trim();
  const effectiveBackgroundSrc =
    customBgUrl || BACKGROUND_ARTWORKS.indraBluePanelsClean16x9;
  const effectiveBgBlendLighten = customBgUrl
    ? siteMedia.background.blendMode === 'lighten'
    : false;

  const customBannerUrl = siteMedia.closingBanner.imageUrl.trim();
  const effectiveClosingBannerSrc =
    customBannerUrl || BACKGROUND_ARTWORKS.indraBluePanelsClean16x9;
  const effectiveBannerBlendLighten = customBannerUrl
    ? siteMedia.closingBanner.blendMode === 'lighten'
    : false;

  return (
    <div className="min-h-screen w-full bg-[#080ea8]">
      <div
        id="overview"
        className="relative min-h-screen w-full text-[#f2f2f2] isolate overflow-x-clip"
      >
        {/* FIXED FLOATING PORTFOLIO BACKGROUND — Uncut 16:9 Indra Stage Across Every Device */}
        <div
          aria-hidden="true"
          className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-[#080ea8]"
        >
          {/* Seamless Matching Ambient Backdrop so Edges Never Look Cut */}
          <img
            key={`ambient-${effectiveBackgroundSrc}`}
            src={effectiveBackgroundSrc}
            alt=""
            referrerPolicy="no-referrer"
            onError={(e) => {
              if (e.currentTarget.src !== BACKGROUND_ARTWORKS.indraBluePanelsClean16x9) {
                e.currentTarget.src = BACKGROUND_ARTWORKS.indraBluePanelsClean16x9;
              }
            }}
            className="absolute inset-0 h-full w-full scale-110 object-cover object-center blur-2xl opacity-95 select-none"
          />

          {/* Desktop & Laptop (>= lg) Uncut Floating 16:9 Indra Stage Below Sticky Header */}
          <div className="hidden lg:flex absolute inset-x-0 top-16 bottom-0 p-4 xl:p-5 items-center justify-center indra-stage-container">
            <div className="relative indra-fitted-16x9 animate-cosmic-float">
              <img
                key={effectiveBackgroundSrc}
                src={effectiveBackgroundSrc}
                alt=""
                referrerPolicy="no-referrer"
                onError={(e) => {
                  if (e.currentTarget.src !== BACKGROUND_ARTWORKS.indraBluePanelsClean16x9) {
                    e.currentTarget.src = BACKGROUND_ARTWORKS.indraBluePanelsClean16x9;
                  }
                }}
                className={`block h-full w-full object-contain object-center indra-seamless-edge ${
                  effectiveBgBlendLighten ? 'mix-blend-lighten' : ''
                } select-none`}
              />
            </div>
          </div>

          {/* Readability Scrim Applied Uniformly Across Both Layers */}
          <div className="absolute inset-0 bg-[#04074f]/46 lg:bg-[linear-gradient(90deg,rgba(4,6,72,0.52)_0%,rgba(5,8,92,0.24)_38%,rgba(5,8,92,0.03)_62%,transparent_100%)]" />
        </div>

        {/* Strict 3-Zone Top Bar Contract */}
        <header className="sticky top-0 z-40 h-14 sm:h-16 border-b border-white/12 bg-[#050724]/82 backdrop-blur-md">
          <div className="mx-auto flex h-full max-w-[1240px] items-center justify-between gap-8 px-4 sm:px-6">
            {/* Zone 1: Brand mark & single-line wordmark */}
            <a
              href="#overview"
              className="inline-flex items-center gap-2.5 font-display text-2xl font-medium tracking-tight text-white whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-[#5f6bff]"
            >
              <BrandLogoMark className="h-7 w-7" />
              <span>Sarmansinh Solanki</span>
            </a>

            {/* Zone 2: Concise single-line navigation links */}
            <nav
              aria-label="Primary"
              className="hidden md:flex items-center gap-8 font-mono text-xs tracking-wider text-[#c5cae8]"
            >
              <a
                href="#overview"
                className="hover:text-white hover:underline underline-offset-4 transition-colors duration-150 whitespace-nowrap shrink-0"
              >
                Overview
              </a>
              <a
                href="#skills"
                className="hover:text-white hover:underline underline-offset-4 transition-colors duration-150 whitespace-nowrap shrink-0"
              >
                Skills
              </a>
              <a
                href="#writeups"
                className="hover:text-white hover:underline underline-offset-4 transition-colors duration-150 whitespace-nowrap shrink-0"
              >
                Writeups
              </a>
              <a
                href="#contact"
                className="hover:text-white hover:underline underline-offset-4 transition-colors duration-150 whitespace-nowrap shrink-0"
              >
                Contact
              </a>
            </nav>

            {/* Zone 3: 1 primary action */}
            <div className="flex items-center shrink-0">
              <button
                type="button"
                onClick={() => scrollToSection('contact')}
                className="bg-white/10 border border-white/15 px-4 py-2 font-mono text-xs font-medium text-white hover:bg-[#0000f2] hover:border-[#0000f2] transition-colors duration-150 whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-white"
              >
                Get in Touch
              </button>
            </div>
          </div>
        </header>

        {/* Owner-Only Site-Wide Media Toolbar (Visible Strictly to Sarmansinh Solanki) */}
        {isOwner && (
          <div className="border-b border-[#5b66ff]/40 bg-[#080c2e]/92 backdrop-blur-md">
            <div className="mx-auto flex max-w-[1240px] flex-wrap items-center justify-between gap-3 px-6 py-2.5 font-mono text-xs">
              <span className="text-[#c8cfff]">
                Owner Studio ({OWNER_EMAIL})
              </span>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setActiveSiteMediaSlot('background')}
                  className="inline-flex items-center gap-1.5 border border-white/25 bg-[#0f1542] px-3 py-1.5 text-white hover:bg-[#0000f2] hover:border-[#0000f2] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <ImagePlus className="h-3.5 w-3.5" />
                  <span>Change Background</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveSiteMediaSlot('closingBanner')}
                  className="inline-flex items-center gap-1.5 border border-white/25 bg-[#0f1542] px-3 py-1.5 text-white hover:bg-[#0000f2] hover:border-[#0000f2] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <ImagePlus className="h-3.5 w-3.5" />
                  <span>Change Closing Banner</span>
                </button>
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="inline-flex items-center gap-1.5 border border-white/18 bg-[#090c24] px-3 py-1.5 text-[#c5cae8] hover:text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          </div>
        )}

        <main>
          {/* HERO / OVERVIEW SECTION — Floating 16:9 Indra Stage Across Phone, Tablet, Laptop & Desktop */}
          <section
            aria-label="Introduction"
            className="border-b border-white/10 lg:min-h-[calc(100svh-4rem)] lg:flex lg:flex-col lg:justify-between"
          >
            {/* Mobile & Portrait Tablet (< lg): Uncut Floating 16:9 Indra Stage */}
            <div className="relative w-full overflow-hidden bg-[#080ea8] lg:hidden">
              <img
                key={`mobile-ambient-${effectiveBackgroundSrc}`}
                src={effectiveBackgroundSrc}
                alt=""
                aria-hidden="true"
                referrerPolicy="no-referrer"
                onError={(e) => {
                  if (e.currentTarget.src !== BACKGROUND_ARTWORKS.indraBluePanelsClean16x9) {
                    e.currentTarget.src = BACKGROUND_ARTWORKS.indraBluePanelsClean16x9;
                  }
                }}
                className="pointer-events-none absolute inset-0 h-full w-full scale-110 object-cover object-center blur-xl opacity-95 select-none"
              />
              <div className="relative mx-auto w-full px-2.5 py-3 sm:px-4 sm:py-4">
                <div className="relative mx-auto w-full aspect-video animate-cosmic-float">
                  <img
                    key={`mobile-hero-${effectiveBackgroundSrc}`}
                    src={effectiveBackgroundSrc}
                    alt="Blue halftone artwork of Lord Indra with terminal detail panels over mountain peaks"
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      if (e.currentTarget.src !== BACKGROUND_ARTWORKS.indraBluePanelsClean16x9) {
                        e.currentTarget.src = BACKGROUND_ARTWORKS.indraBluePanelsClean16x9;
                      }
                    }}
                    className={`block h-full w-full object-contain object-center indra-seamless-edge ${
                      effectiveBgBlendLighten ? 'mix-blend-lighten' : ''
                    } select-none`}
                  />
                </div>
              </div>
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-x-0 bottom-0 h-6 bg-gradient-to-b from-transparent to-[#050852]/70"
              />
            </div>

            <div className="mx-auto w-full max-w-[1240px] flex-1 flex items-center px-4 sm:px-6 py-10 sm:py-14 lg:py-16">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center w-full">
                {/* Left Column: Clean Editorial Intro (No Terminal Clutter); Right Stage Open Over Indra & Panels */}
                <div className="lg:col-span-5 space-y-6">
                  <div className="flex flex-wrap items-center gap-2 font-mono text-xs text-[#b6bef0]">
                    <span>Sarmansinh Solanki</span>
                    <span aria-hidden="true">·</span>
                    <span>Cyber Security Student</span>
                    <span aria-hidden="true">·</span>
                    <span>Web Application Security</span>
                  </div>

                  <h1 className="font-display text-[clamp(3rem,5.6vw,5.2rem)] font-light leading-[0.94] tracking-[-0.02em] text-[#f4f6ff] drop-shadow-[0_2px_18px_rgba(3,5,48,0.65)] [text-wrap:balance]">
                    Web Security That Sharpens Every Layer.
                  </h1>

                  <p className="max-w-[48ch] text-[15px] sm:text-base leading-[1.65] text-[#cbd2f5] drop-shadow-[0_1px_12px_rgba(3,5,48,0.65)]">
                    I am Sarmansinh Solanki, a cyber security student specializing in Web
                    Application Security—auditing authentication flows, access controls,
                    injections, and APIs, and publishing reproducible security writeups.
                  </p>

                  <div className="flex flex-wrap items-center gap-3 pt-1">
                    <button
                      type="button"
                      onClick={() => scrollToSection('writeups')}
                      className="inline-flex items-center gap-2 bg-[#161a36]/92 border border-white/18 px-5 py-2.5 font-mono text-xs font-medium text-white hover:bg-[#0000f2] hover:border-[#0000f2] transition-colors duration-150 whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-white"
                    >
                      <FileText className="h-3.5 w-3.5 text-[#7a84ff]" />
                      <span>Read Writeups</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => scrollToSection('skills')}
                      className="inline-flex items-center gap-2 bg-[#080b29]/80 border border-white/18 px-5 py-2.5 font-mono text-xs font-medium text-[#e4e7f7] hover:bg-white/18 hover:text-white transition-colors duration-150 whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      <span>Web AppSec Skills</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Full-Width Focus Strip Anchored Cleanly Below Hero Stage */}
            <div className="border-t border-white/12 bg-[#050826]/78 backdrop-blur-sm">
              <div className="mx-auto max-w-[1240px] grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-white/12">
                {STUDENT_HIGHLIGHTS.map((item, idx) => (
                  <div key={idx} className="p-5 sm:p-6 space-y-1.5">
                    <div className="font-display text-3xl sm:text-4xl font-light tracking-tight text-white tabular-nums">
                      {item.value}
                    </div>
                    <p className="text-xs leading-relaxed text-[#b2bae3]">
                      {item.label}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* SUBTLE MARQUEE DIVIDER */}
          <div
            aria-hidden="true"
            className="overflow-hidden border-b border-white/12 bg-[#040724]/85 py-3 select-none"
          >
            <div className="animate-marquee font-mono text-xs text-[#9da6d6] tracking-wide">
              {[0, 1].map((loopIdx) => (
                <div key={loopIdx} className="flex items-center gap-8 pr-8 whitespace-nowrap">
                  <span>web application security</span>
                  <span>·</span>
                  <span>oauth & jwt auditing</span>
                  <span>·</span>
                  <span>broken access control & idor</span>
                  <span>·</span>
                  <span>sqli, ssti & ssrf</span>
                  <span>·</span>
                  <span>dom xss & postmessage</span>
                  <span>·</span>
                  <span>vulnerability writeups</span>
                  <span>·</span>
                </div>
              ))}
            </div>
          </div>

          {/* SECTION 1: SKILLS — WEB APPLICATION SECURITY */}
          <section id="skills" className="relative border-b border-white/12 scroll-mt-16">

            <div className="mx-auto max-w-[1240px] px-6 py-16 sm:py-20">
              <div className="max-w-2xl space-y-2 pb-10">
                <div className="font-mono text-xs text-[#b5beeb]">
                  01 · Core Discipline
                </div>
                <h2 className="font-display text-4xl sm:text-5xl font-light tracking-tight text-white [text-wrap:balance]">
                  Web Application Security Skills
                </h2>
                <p className="text-sm sm:text-base text-[#cbd2f2] leading-relaxed pt-1">
                  Select any Web Application Security domain below to inspect my testing workflow
                  and sample HTTP / code audit vector.
                </p>
              </div>

              {/* 6-Cell Web AppSec Hairline Matrix */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 border-t border-l border-white/12">
                {WEBSEC_SKILLS.map((skill) => {
                  const isSelected = skill.id === activeSkill.id;
                  return (
                    <button
                      key={skill.id}
                      type="button"
                      onClick={() => setSelectedSkillId(skill.id)}
                      className={`text-left p-6 sm:p-7 border-r border-b border-white/12 transition-colors duration-150 cursor-pointer focus-visible:outline-2 focus-visible:outline-[#5f6bff] flex flex-col justify-between gap-5 ${
                        isSelected
                          ? 'bg-[#10153b]/90'
                          : 'bg-[#07091c]/75 hover:bg-[#0c102e]/85'
                      }`}
                    >
                      <div className="space-y-3">
                        <div className="flex items-center justify-between font-mono text-xs">
                          <span className={isSelected ? 'text-[#8e98ff]' : 'text-[#969ec4]'}>
                            {skill.index}. Web AppSec
                          </span>
                          <span
                            className={`whitespace-nowrap shrink-0 ${
                              isSelected ? 'text-white underline underline-offset-4' : 'text-[#7e86ad]'
                            }`}
                          >
                            {isSelected ? 'Active Vector' : 'Inspect'}
                          </span>
                        </div>
                        <h3 className="font-display text-2xl font-normal tracking-tight text-white">
                          {skill.index}. {skill.title}
                        </h3>
                        <p className="text-sm leading-relaxed text-[#b8bee0]">
                          {skill.summary}
                        </p>
                      </div>

                      <div className="font-mono text-xs text-[#a5add4] pt-2 border-t border-white/10">
                        {skill.focusAreas}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Interactive Testing Methodology & HTTP Vector Drawer */}
              <div className="mt-8 border border-white/15 bg-[#090b20]/85 backdrop-blur-sm p-6 sm:p-8">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                  <div className="lg:col-span-6 space-y-5">
                    <div className="font-mono text-xs text-[#8e98ff]">
                      Testing Methodology · {activeSkill.index}. {activeSkill.title}
                    </div>
                    <h3 className="font-display text-3xl font-light text-white tracking-tight">
                      {activeSkill.title}
                    </h3>
                    <p className="text-sm sm:text-base text-[#c5cbe8] leading-relaxed">
                      {activeSkill.methodology}
                    </p>

                    <div className="pt-2 space-y-2">
                      <div className="font-mono text-xs text-[#a5add4]">
                        Assessment Workflow
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {activeSkill.workflowSteps.map((step, idx) => (
                          <div
                            key={step}
                            className="border border-white/12 bg-[#050614]/90 px-3 py-2.5 font-mono text-xs text-[#e4e7f7]"
                          >
                            <div className="text-[10px] text-[#8590ff] tabular-nums mb-1">
                              Phase 0{idx + 1}
                            </div>
                            <div className="leading-snug">{step}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="lg:col-span-6 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs text-[#a5add4]">
                        Sample Audit Vector / HTTP Request
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCopyHttpSnippet(activeSkill.httpSnippet)}
                        className="inline-flex items-center gap-1.5 border border-white/15 bg-[#0d1029] px-3 py-1 font-mono text-xs text-white hover:bg-[#0000f2] hover:border-[#0000f2] transition-colors duration-150 whitespace-nowrap shrink-0 cursor-pointer"
                      >
                        {copiedHttp ? (
                          <>
                            <Check className="h-3.5 w-3.5" />
                            <span>Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="h-3.5 w-3.5" />
                            <span>Copy Vector</span>
                          </>
                        )}
                      </button>
                    </div>
                    <pre className="overflow-x-auto border border-white/12 bg-[#040510] p-5 font-mono text-xs sm:text-[13px] text-[#e2e6fa] leading-relaxed">
                      <code>{activeSkill.httpSnippet}</code>
                    </pre>
                    <p className="font-mono text-xs text-[#a5add4]">
                      Coverage: {activeSkill.focusAreas}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* SECTION 2: WRITEUPS — 3-Column Open Editorial Layout + Exact Blue-Dithered Plates */}
          <section
            id="writeups"
            className="border-b border-white/10 bg-[#141525] scroll-mt-16"
          >
            <div className="mx-auto max-w-[1200px] px-6 py-16 sm:py-24">
              <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-10 border-b border-white/10">
                <div className="space-y-2 max-w-2xl">
                  <div className="font-mono text-xs text-[#a5add4]">
                    02 · Vulnerability Research, CTF & Lab Walkthroughs
                  </div>
                  <h2 className="font-display text-4xl sm:text-5xl font-light tracking-tight text-white">
                    Technical Security Writeups
                  </h2>
                </div>

                {/* Filter Tabs + Owner Controls */}
                <div className="flex flex-wrap items-center gap-3">
                  <div
                    className="flex flex-wrap items-center gap-1 border border-white/12 bg-[#0d0e1c] p-1"
                    role="group"
                    aria-label="Filter writeups by vulnerability class"
                  >
                    {WRITEUP_FILTERS.map((category) => {
                      const isActive = selectedCategory === category;
                      return (
                        <button
                          key={category}
                          type="button"
                          onClick={() => setSelectedCategory(category)}
                          className={`px-3.5 py-1.5 font-mono text-xs transition-colors duration-150 whitespace-nowrap shrink-0 cursor-pointer ${
                            isActive
                              ? 'bg-[#0000f2] text-white'
                              : 'text-[#a5add4] hover:text-white'
                          }`}
                        >
                          {category}
                        </button>
                      );
                    })}
                  </div>

                  {/* Owner Authentication & Writeup Studio Actions */}
                  {isOwner ? (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingWriteup(null);
                          setEditorOpen(true);
                        }}
                        className="inline-flex items-center gap-1.5 bg-[#0000f2] px-4 py-2 font-mono text-xs font-medium text-white hover:bg-[#242bff] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        <span>New Writeup</span>
                      </button>
                      <button
                        type="button"
                        onClick={handleSignOut}
                        aria-label="Sign out of owner mode"
                        className="inline-flex items-center gap-1.5 border border-white/20 bg-[#0d0e1c] px-3 py-2 font-mono text-xs text-[#c5cae8] hover:text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                      >
                        <LogOut className="h-3.5 w-3.5" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  ) : currentUser ? (
                    <button
                      type="button"
                      onClick={handleSignOut}
                      className="inline-flex items-center gap-1.5 border border-white/20 bg-[#0d0e1c] px-3.5 py-2 font-mono text-xs text-[#c5cae8] hover:text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      <LogOut className="h-3.5 w-3.5" />
                      <span>Sign Out</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled={authBusy}
                      onClick={handleOwnerSignIn}
                      className="inline-flex items-center gap-1.5 border border-white/18 bg-[#0d0e1c] px-3.5 py-2 font-mono text-xs text-[#c5cae8] hover:border-[#5f6bff] hover:text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      <Lock className="h-3.5 w-3.5" />
                      <span>{authBusy ? 'Signing In...' : 'Owner Edit'}</span>
                    </button>
                  )}
                </div>
              </div>

              {isOwner && (
                <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border border-[#4b56ff]/40 bg-[#0e1338]/80 px-4 py-2.5 font-mono text-xs text-[#c8cfff]">
                  <span>
                    Owner Edit Mode Active ({OWNER_EMAIL}) · Change card images, publish, edit, or delete writeups.
                  </span>
                  <span className="tabular-nums">{totalCount} Total Writeups</span>
                </div>
              )}

              {authNotice && (
                <div
                  role="status"
                  className="mt-4 border border-white/15 bg-[#0b0e26] px-4 py-2.5 font-mono text-xs text-[#d6daf2]"
                >
                  {authNotice}
                </div>
              )}

              {/* 3-Column Open Editorial Row + Exact Blue-Dithered Square Plates */}
              {displayedWriteups.length === 0 ? (
                <div className="mt-12 border border-white/12 bg-[#0d0e1c] p-10 text-center space-y-3">
                  <p className="font-display text-2xl text-white">
                    No writeups in this category yet.
                  </p>
                  <p className="text-sm text-[#a5add4]">
                    Switch categories above{isOwner ? ' or click New Writeup to publish one.' : '.'}
                  </p>
                </div>
              ) : (
                <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-9 lg:gap-11">
                  {displayedWriteups.map((writeup, idx) => (
                    <WriteupPosterCard
                      key={writeup.id}
                      writeup={writeup}
                      cardPosition={idx}
                      isOwner={isOwner}
                      isConfirmingDelete={confirmDeleteId === writeup.id}
                      onOpen={(selected) => setActiveWriteup(selected)}
                      onEdit={(selected) => {
                        setEditingWriteup(selected);
                        setEditorOpen(true);
                      }}
                      onChangeImage={(selected) => {
                        if (isOwner) setImageModalWriteup(selected);
                      }}
                      onRequestDelete={(id) => setConfirmDeleteId(id)}
                      onConfirmDelete={(id) => void handleDeleteWriteup(id)}
                      onCancelDelete={() => setConfirmDeleteId(null)}
                    />
                  ))}
                </div>
              )}
            </div>
          </section>

          {/* SECTION 3: CONTACT — Seamless #141525 Surface Into Footer */}
          <section id="contact" className="relative bg-[#141525] scroll-mt-16">
            <div className="mx-auto max-w-[1200px] px-6 pt-12 pb-4 sm:pt-16 sm:pb-6">
              <div className="grid grid-cols-1 lg:grid-cols-12 border border-white/15">
                {/* Left Column: Electric Klein Blue Direct Channel */}
                <div className="lg:col-span-5 bg-[#0000f2] p-6 sm:p-10 lg:p-12 text-white flex flex-col justify-between gap-8 border-b lg:border-b-0 lg:border-r border-white/20">
                  <div className="space-y-4">
                    <div className="font-mono text-xs text-white/85">
                      03 · Contact
                    </div>
                    <h2 className="font-display text-4xl sm:text-5xl font-light tracking-tight text-white [text-wrap:balance]">
                      Connect With Sarmansinh Solanki
                    </h2>
                    <p className="text-sm sm:text-base text-white/90 leading-relaxed">
                      Open to cyber security internships, junior Web Application Security roles,
                      CTF collaborations, and discussions around web vulnerability research and
                      writeups.
                    </p>
                  </div>

                  <div className="space-y-3 pt-4 border-t border-white/25">
                    <div className="font-mono text-xs text-white/85">
                      Direct Email Address
                    </div>
                    <div className="flex items-center justify-between gap-3 border border-white/25 bg-[#04067a]/90 px-4 py-3">
                      <span className="font-mono text-xs sm:text-sm text-white truncate">
                        {OWNER_EMAIL}
                      </span>
                      <button
                        type="button"
                        onClick={handleCopyEmail}
                        className="inline-flex items-center gap-1.5 bg-white px-3 py-1.5 font-mono text-xs font-medium text-[#0000c8] hover:bg-[#e6e9ff] transition-colors duration-150 whitespace-nowrap shrink-0 cursor-pointer"
                      >
                        {copiedEmail ? (
                          <>
                            <Check className="h-3.5 w-3.5" />
                            <span>Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="h-3.5 w-3.5" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Right Column: Direct Message Form */}
                <div className="lg:col-span-7 p-6 sm:p-10 lg:p-12 bg-[#0b0c18]">
                  {submittedReceipt ? (
                    <div className="border border-[#4b56ff]/50 bg-[#0d1130] p-6 sm:p-8 space-y-4">
                      <div className="font-mono text-xs text-[#9ea6ff] tabular-nums">
                        Message Received · {submittedReceipt.timestamp}
                      </div>
                      <h3 className="font-display text-3xl text-white">
                        Thank you, {submittedReceipt.name}.
                      </h3>
                      <p className="text-sm text-[#c5cae8] leading-relaxed">
                        Your message regarding{' '}
                        <span className="text-white font-medium">{submittedReceipt.topic}</span> has
                        been recorded. Sarmansinh will follow up at{' '}
                        <span className="font-mono text-xs text-white">
                          {submittedReceipt.email}
                        </span>
                        .
                      </p>
                      <button
                        type="button"
                        onClick={() => setSubmittedReceipt(null)}
                        className="border border-white/20 px-4 py-2 font-mono text-xs text-white hover:bg-white/10 transition-colors duration-150 whitespace-nowrap shrink-0 cursor-pointer"
                      >
                        Send Another Message
                      </button>
                    </div>
                  ) : (
                    <form onSubmit={handleContactSubmit} className="space-y-5" noValidate>
                      <div className="space-y-2">
                        <span className="block font-mono text-xs text-[#a5add4]">
                          Topic
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {CONTACT_TOPICS.map((topic) => (
                            <button
                              key={topic}
                              type="button"
                              onClick={() => setContactTopic(topic)}
                              className={`px-3 py-1.5 font-mono text-xs border transition-colors duration-150 whitespace-nowrap shrink-0 cursor-pointer ${
                                contactTopic === topic
                                  ? 'border-[#0000f2] bg-[#0000f2] text-white'
                                  : 'border-white/12 bg-[#050614] text-[#b8bee0] hover:text-white'
                              }`}
                            >
                              {topic}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label
                            htmlFor="sender-name"
                            className="block font-mono text-xs text-[#a5add4]"
                          >
                            Your Name
                          </label>
                          <input
                            id="sender-name"
                            type="text"
                            value={senderName}
                            onChange={(e) => setSenderName(e.target.value)}
                            placeholder="Enter your name"
                            className="w-full border border-white/15 bg-[#050614] px-3.5 py-2.5 text-sm text-white placeholder-[#5e658a] focus:border-[#5f6bff] focus:outline-none"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label
                            htmlFor="sender-email"
                            className="block font-mono text-xs text-[#a5add4]"
                          >
                            Your Email
                          </label>
                          <input
                            id="sender-email"
                            type="email"
                            value={senderEmail}
                            onChange={(e) => setSenderEmail(e.target.value)}
                            placeholder="you@domain.com"
                            className="w-full border border-white/15 bg-[#050614] px-3.5 py-2.5 text-sm text-white placeholder-[#5e658a] focus:border-[#5f6bff] focus:outline-none"
                          />
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label
                          htmlFor="message-body"
                          className="block font-mono text-xs text-[#a5add4]"
                        >
                          Message
                        </label>
                        <textarea
                          id="message-body"
                          rows={4}
                          value={messageBody}
                          onChange={(e) => setMessageBody(e.target.value)}
                          placeholder="Share details about a security role, bug bounty target, or CTF writeup..."
                          className="w-full border border-white/15 bg-[#050614] px-3.5 py-2.5 text-sm text-white placeholder-[#5e658a] focus:border-[#5f6bff] focus:outline-none"
                        />
                      </div>

                      {formError && (
                        <p role="alert" className="font-mono text-xs text-[#ff7b7b]">
                          {formError}
                        </p>
                      )}

                      <button
                        type="submit"
                        className="w-full sm:w-auto bg-[#0000f2] px-6 py-3 font-mono text-xs font-medium text-white hover:bg-[#242bff] transition-colors duration-150 whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-white"
                      >
                        Send Message
                      </button>
                    </form>
                  )}
                </div>
              </div>
            </div>
          </section>
        </main>

        {/* EDITORIAL #141525 FOOTER BAND FLUSH INTO FULL-BLEED 16:9 CLOSING STAGE */}
        <footer className="w-full bg-[#141525] text-[#dce0f2]">
          {/* Flush #141525 Three-Column Footer Bar (Zero Bottom Gap Into Blue Banner) */}
          <div className="mx-auto max-w-[1200px] px-6 py-12 sm:py-14">
            <div className="grid grid-cols-1 md:grid-cols-3 items-center gap-8">
              {/* Left Column: Title & Copyright */}
              <div className="font-display text-[14px] sm:text-[15px] leading-[1.4] tracking-[0.03em] uppercase space-y-0.5">
                <div className="font-medium text-[#f2f4fc]">
                  WEB APPLICATION SECURITY
                </div>
                <div className="font-normal text-[#cfd4ec]">
                  © 2026, SARMANSINH SOLANKI.
                </div>
              </div>

              {/* Center Column: Three Classical Monochrome Engraved Stamp Cards */}
              <div
                aria-hidden="true"
                className="flex items-center justify-start md:justify-center gap-3"
              >
                {/* Stamp 1: Celestial Sphere & Classical Hand */}
                <div className="flex h-[54px] w-[39px] items-center justify-center rounded-[4px] border border-[#dce0f5]/60 bg-[#141525] p-1">
                  <svg viewBox="0 0 36 50" className="h-full w-full text-[#e8ecff]" fill="none">
                    <circle cx="18" cy="15" r="6.2" stroke="currentColor" strokeWidth="1.2" />
                    <ellipse cx="18" cy="15" rx="6.2" ry="2.4" stroke="currentColor" strokeWidth="0.9" />
                    <path d="M18 8.8V21.2" stroke="currentColor" strokeWidth="0.85" />
                    <path
                      d="M7 33.5C11 32 14.5 31.5 20.5 32.5L26 30.8C27.2 30.5 28 31.6 27 32.5L20.5 36.2L29.5 42.5M7 36.8L16.5 37.8L25.5 45"
                      stroke="currentColor"
                      strokeWidth="1.15"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>

                {/* Stamp 2: Engraved Sovereign Indra Trishula & Halo Crest */}
                <div className="flex h-[54px] w-[39px] flex-col items-center justify-between rounded-[4px] border border-[#dce0f5]/60 bg-[#141525] px-1 py-1">
                  <span className="font-display text-[9.5px] font-semibold leading-none tracking-[0.04em] text-[#f2f4fc]">
                    APPSEC
                  </span>
                  <svg viewBox="0 0 32 32" className="h-[34px] w-full text-[#e8ecff]" fill="none">
                    <circle
                      cx="16"
                      cy="14.5"
                      r="8.2"
                      stroke="currentColor"
                      strokeOpacity="0.45"
                      strokeWidth="1.1"
                    />
                    <path d="M16 4.5L18.15 8.4L16 7.6L13.85 8.4L16 4.5Z" fill="currentColor" />
                    <path d="M9.6 6L11.5 9.2L9.6 8.5L7.7 9.2L9.6 6Z" fill="currentColor" />
                    <path d="M22.4 6L24.3 9.2L22.4 8.5L20.5 9.2L22.4 6Z" fill="currentColor" />
                    <path
                      d="M16 7.4V27"
                      stroke="currentColor"
                      strokeWidth="1.6"
                      strokeLinecap="round"
                    />
                    <path
                      d="M16 17.6C11.8 17.6 9.6 15.1 9.6 11.2V8.5M16 17.6C20.2 17.6 22.4 15.1 22.4 11.2V8.5M12.5 21.2H19.5"
                      stroke="currentColor"
                      strokeWidth="1.45"
                      strokeLinecap="round"
                    />
                  </svg>
                </div>

                {/* Stamp 3: Classical Sovereign Wing Crest */}
                <div className="flex h-[54px] w-[39px] items-center justify-center rounded-[4px] border border-[#dce0f5]/60 bg-[#141525] p-1">
                  <svg viewBox="0 0 36 50" className="h-full w-full text-[#e8ecff]" fill="none">
                    <path
                      d="M8 36L28 14M12 37L29 19M16 38L28 25M9 31L23 15"
                      stroke="currentColor"
                      strokeWidth="1.2"
                      strokeLinecap="round"
                    />
                    <path
                      d="M7.5 36.5C11.5 30 17.5 21 28.5 13.5C27.5 21.5 23 29.5 14.5 38.5L7.5 36.5Z"
                      stroke="currentColor"
                      strokeWidth="1.15"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
              </div>

              {/* Right Column: Condensed Links & Year */}
              <div className="font-display text-[14px] sm:text-[15px] leading-[1.4] tracking-[0.03em] uppercase md:text-right space-y-0.5">
                <div className="flex flex-wrap items-center md:justify-end gap-2 font-medium text-[#f2f4fc]">
                  <a
                    href="#skills"
                    className="hover:text-[#8e9aff] transition-colors whitespace-nowrap shrink-0"
                  >
                    SKILLS
                  </a>
                  <span aria-hidden="true" className="text-white/45">|</span>
                  <a
                    href="#writeups"
                    className="hover:text-[#8e9aff] transition-colors whitespace-nowrap shrink-0"
                  >
                    WRITEUPS
                  </a>
                  <span aria-hidden="true" className="text-white/45">|</span>
                  <a
                    href="#contact"
                    className="hover:text-[#8e9aff] transition-colors whitespace-nowrap shrink-0"
                  >
                    CONTACT
                  </a>
                  {!currentUser && (
                    <>
                      <span aria-hidden="true" className="text-white/45">|</span>
                      <button
                        type="button"
                        disabled={authBusy}
                        onClick={handleOwnerSignIn}
                        className="uppercase hover:text-[#8e9aff] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                      >
                        {authBusy ? 'SIGNING IN...' : 'OWNER'}
                      </button>
                    </>
                  )}
                </div>
                <div className="flex flex-wrap items-center md:justify-end gap-1.5 font-normal text-[#cfd4ec]">
                  <span>PORTFOLIO · 2026</span>
                  <span aria-hidden="true">·</span>
                  <a
                    href="#overview"
                    className="hover:text-white transition-colors whitespace-nowrap shrink-0"
                  >
                    TOP ↑
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Flush Full-Bleed Uncut Floating 16:9 Closing Banner Stage */}
          <div className="relative w-full overflow-hidden bg-[#080ea8]">
            <img
              key={`closing-ambient-${effectiveClosingBannerSrc}`}
              src={effectiveClosingBannerSrc}
              alt=""
              aria-hidden="true"
              referrerPolicy="no-referrer"
              onError={(e) => {
                if (e.currentTarget.src !== BACKGROUND_ARTWORKS.indraBluePanelsClean16x9) {
                  e.currentTarget.src = BACKGROUND_ARTWORKS.indraBluePanelsClean16x9;
                }
              }}
              className="pointer-events-none absolute inset-0 h-full w-full scale-110 object-cover object-center blur-xl opacity-95 select-none"
            />

            <div className="relative mx-auto w-full px-2.5 py-3.5 sm:px-5 sm:py-5">
              <div className="relative mx-auto w-full aspect-video animate-cosmic-float">
                <img
                  key={effectiveClosingBannerSrc}
                  src={effectiveClosingBannerSrc}
                  alt="Blue halftone artwork of Lord Indra with terminal detail panels over mountain peaks"
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    if (e.currentTarget.src !== BACKGROUND_ARTWORKS.indraBluePanelsClean16x9) {
                      e.currentTarget.src = BACKGROUND_ARTWORKS.indraBluePanelsClean16x9;
                    }
                  }}
                  className={`block h-full w-full object-contain object-center indra-seamless-edge ${
                    effectiveBannerBlendLighten ? 'mix-blend-lighten' : ''
                  } select-none`}
                />
              </div>
            </div>

            {/* Subtle Centered Cobalt Contrast Vignette */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(3,8,112,0.16)_0%,transparent_72%)]"
            />

            {/* Full Name Typing + Fade-In Wordmark Centered in Middle */}
            <ClosingNameSignature />

            {isOwner && (
              <div className="absolute top-2.5 right-2.5 sm:top-4 sm:right-4 z-20 flex flex-wrap items-center gap-1.5 sm:gap-2">
                <button
                  type="button"
                  onClick={() => setActiveSiteMediaSlot('background')}
                  className="inline-flex items-center gap-1.5 rounded-[5px] border border-white/25 bg-[#070919]/90 px-2.5 py-1 sm:px-3 sm:py-1.5 font-mono text-[11px] sm:text-xs font-medium text-white shadow-md backdrop-blur-xs hover:bg-[#0000f2] hover:border-[#0000f2] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <ImagePlus className="h-3.5 w-3.5" />
                  <span>Change Background</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveSiteMediaSlot('closingBanner')}
                  className="inline-flex items-center gap-1.5 rounded-[5px] border border-white/25 bg-[#070919]/90 px-2.5 py-1 sm:px-3 sm:py-1.5 font-mono text-[11px] sm:text-xs font-medium text-white shadow-md backdrop-blur-xs hover:bg-[#0000f2] hover:border-[#0000f2] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <ImagePlus className="h-3.5 w-3.5" />
                  <span>Change Banner Image</span>
                </button>
              </div>
            )}
          </div>
        </footer>

        {/* Writeup Reader Modal */}
        <WriteupModal
          writeup={activeWriteup}
          isOwner={isOwner}
          onEdit={(target) => {
            setEditingWriteup(target);
            setEditorOpen(true);
          }}
          onChangeImage={(target) => {
            if (isOwner) setImageModalWriteup(target);
          }}
          onClose={() => setActiveWriteup(null)}
        />

        {/* Owner-Only Writeup Editor, Writeup Image & Site Media Modals */}
        {isOwner && (
          <>
            <WriteupEditorModal
              isOpen={editorOpen}
              editingWriteup={editingWriteup}
              nextIndexNumber={totalCount + 1}
              isSaving={isSavingWriteup}
              onClose={() => {
                setEditorOpen(false);
                setEditingWriteup(null);
              }}
              onSave={handleSaveWriteup}
            />

            <WriteupImageModal
              writeup={imageModalWriteup}
              isOwner={isOwner}
              isSaving={isSavingImage}
              onClose={() => setImageModalWriteup(null)}
              onSaveImage={handleSaveWriteupImage}
            />

            <SiteMediaModal
              activeSlot={activeSiteMediaSlot}
              isOwner={isOwner}
              isSaving={isSavingSiteMedia}
              currentMedia={siteMedia}
              onSelectSlot={(slot) => setActiveSiteMediaSlot(slot)}
              onClose={() => setActiveSiteMediaSlot(null)}
              onSaveSlot={handleSaveSiteMediaSlot}
            />
          </>
        )}
      </div>
    </div>
  );
}
