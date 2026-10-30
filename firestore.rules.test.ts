/**
 * Phase 0 Security TDD Verification Suite for Sarmansinh Solanki Portfolio
 * Verifies all 12 "Dirty Dozen" adversarial payloads across /writeups and /siteMedia return PERMISSION_DENIED.
 */

export interface DirtyDozenScenario {
  id: number;
  name: string;
  auth: { uid: string; email?: string; email_verified?: boolean } | null;
  operation: 'create' | 'update' | 'get' | 'list' | 'delete';
  path: string;
  payload?: Record<string, unknown>;
  expectedOutcome: 'PERMISSION_DENIED';
}

const VALID_WRITEUP_PAYLOAD = {
  index: '01',
  title: 'OAuth 2.0 Redirect Bypass Analysis',
  subtitle: 'Path traversal normalization inside redirect_uri',
  category: 'Auth & Session',
  date: 'October 2026',
  environment: 'WebSec Lab',
  owaspMapping: 'OWASP A07',
  readTime: '6 min read',
  godPreset: 'athena',
  customImageUrl: '',
  summary: 'Detailed analysis of OAuth redirect URI validation bypass leading to code leakage.',
  vulnerabilityRootCause: 'Unanchored prefix check combined with dot-segment client routing.',
  exploitationStepsText: 'Step 1: Probe callback\nStep 2: Capture code via Referer',
  remediation: 'Canonicalize and enforce exact byte-for-byte redirect_uri matching.',
  httpPoc: 'GET /oauth/authorize?redirect_uri=... HTTP/1.1',
  curlVerify: 'curl -i https://auth.target.lab/oauth/authorize',
  visibility: 'public',
  order: 1,
  authorUid: 'owner_sarmansinh_uid',
  createdAt: '__SERVER_TIMESTAMP__',
  updatedAt: '__SERVER_TIMESTAMP__',
};

const VALID_SITE_MEDIA_PAYLOAD = {
  slot: 'background',
  imageUrl: 'https://example.com/background.png',
  blendMode: 'normal',
  visibility: 'public',
  authorUid: 'owner_sarmansinh_uid',
  createdAt: '__SERVER_TIMESTAMP__',
  updatedAt: '__SERVER_TIMESTAMP__',
};

export const DIRTY_DOZEN_TESTS: DirtyDozenScenario[] = [
  {
    id: 1,
    name: 'Unauthenticated Background Image Change',
    auth: null,
    operation: 'create',
    path: '/siteMedia/background',
    payload: VALID_SITE_MEDIA_PAYLOAD,
    expectedOutcome: 'PERMISSION_DENIED',
  },
  {
    id: 2,
    name: 'Non-Owner Authenticated User Attempting Background Image Update',
    auth: { uid: 'intruder_uid', email: 'intruder@gmail.com', email_verified: true },
    operation: 'update',
    path: '/siteMedia/background',
    payload: { ...VALID_SITE_MEDIA_PAYLOAD, imageUrl: 'https://evil.example/bg.png' },
    expectedOutcome: 'PERMISSION_DENIED',
  },
  {
    id: 3,
    name: 'Email Spoofing Attack (email_verified == false)',
    auth: {
      uid: 'spoof_uid',
      email: 'sarmansinhsolanki@gmail.com',
      email_verified: false,
    },
    operation: 'create',
    path: '/siteMedia/hero',
    payload: { ...VALID_SITE_MEDIA_PAYLOAD, slot: 'hero', authorUid: 'spoof_uid' },
    expectedOutcome: 'PERMISSION_DENIED',
  },
  {
    id: 4,
    name: 'Shadow / Ghost Field Injection on SiteMedia Create',
    auth: {
      uid: 'owner_sarmansinh_uid',
      email: 'sarmansinhsolanki@gmail.com',
      email_verified: true,
    },
    operation: 'create',
    path: '/siteMedia/background',
    payload: { ...VALID_SITE_MEDIA_PAYLOAD, isAdminOverride: true },
    expectedOutcome: 'PERMISSION_DENIED',
  },
  {
    id: 5,
    name: 'Author UID Identity Spoofing',
    auth: {
      uid: 'owner_sarmansinh_uid',
      email: 'sarmansinhsolanki@gmail.com',
      email_verified: true,
    },
    operation: 'create',
    path: '/siteMedia/background',
    payload: { ...VALID_SITE_MEDIA_PAYLOAD, authorUid: 'different_uid' },
    expectedOutcome: 'PERMISSION_DENIED',
  },
  {
    id: 6,
    name: 'Client-Forged Past Timestamp on Create',
    auth: {
      uid: 'owner_sarmansinh_uid',
      email: 'sarmansinhsolanki@gmail.com',
      email_verified: true,
    },
    operation: 'create',
    path: '/siteMedia/hero',
    payload: { ...VALID_SITE_MEDIA_PAYLOAD, slot: 'hero', createdAt: '2020-01-01T00:00:00Z' },
    expectedOutcome: 'PERMISSION_DENIED',
  },
  {
    id: 7,
    name: 'Immutable createdAt Mutation on Update',
    auth: {
      uid: 'owner_sarmansinh_uid',
      email: 'sarmansinhsolanki@gmail.com',
      email_verified: true,
    },
    operation: 'update',
    path: '/siteMedia/background',
    payload: { ...VALID_SITE_MEDIA_PAYLOAD, createdAt: '2026-01-01T00:00:00Z' },
    expectedOutcome: 'PERMISSION_DENIED',
  },
  {
    id: 8,
    name: 'Immutable authorUid Mutation on Update',
    auth: {
      uid: 'owner_sarmansinh_uid',
      email: 'sarmansinhsolanki@gmail.com',
      email_verified: true,
    },
    operation: 'update',
    path: '/writeups/w1',
    payload: { ...VALID_WRITEUP_PAYLOAD, authorUid: 'reassigned_uid' },
    expectedOutcome: 'PERMISSION_DENIED',
  },
  {
    id: 9,
    name: 'Scheme Poisoning Attack (javascript: URI on Background Image)',
    auth: {
      uid: 'owner_sarmansinh_uid',
      email: 'sarmansinhsolanki@gmail.com',
      email_verified: true,
    },
    operation: 'update',
    path: '/siteMedia/background',
    payload: { ...VALID_SITE_MEDIA_PAYLOAD, imageUrl: 'javascript:alert(document.domain)' },
    expectedOutcome: 'PERMISSION_DENIED',
  },
  {
    id: 10,
    name: 'Unauthorized Slot ID Poisoning in /siteMedia',
    auth: {
      uid: 'owner_sarmansinh_uid',
      email: 'sarmansinhsolanki@gmail.com',
      email_verified: true,
    },
    operation: 'create',
    path: '/siteMedia/randomSlot99',
    payload: { ...VALID_SITE_MEDIA_PAYLOAD, slot: 'randomSlot99' },
    expectedOutcome: 'PERMISSION_DENIED',
  },
  {
    id: 11,
    name: 'Document ID Regex Poisoning',
    auth: {
      uid: 'owner_sarmansinh_uid',
      email: 'sarmansinhsolanki@gmail.com',
      email_verified: true,
    },
    operation: 'create',
    path: '/writeups/bad$id with spaces',
    payload: VALID_WRITEUP_PAYLOAD,
    expectedOutcome: 'PERMISSION_DENIED',
  },
  {
    id: 12,
    name: 'Unauthorized Draft Writeup Read by Visitor',
    auth: null,
    operation: 'get',
    path: '/writeups/private_draft_1',
    expectedOutcome: 'PERMISSION_DENIED',
  },
];
