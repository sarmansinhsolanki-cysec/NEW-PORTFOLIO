import React, { useState } from 'react';
import { Check, Copy } from 'lucide-react';

type TerminalTab = 'profile' | 'recon';

interface ShellEntry {
  cmd: string;
  output: string;
}

const INITIAL_HISTORY: ShellEntry[] = [
  {
    cmd: 'whoami --profile',
    output:
      'Sarmansinh Solanki · Cyber Security Student\nSpecialization: Web Application Security, Vulnerability Analysis & Technical Writeups.',
  },
];

export const HeroTerminal: React.FC<{ onNavigateSection: (sectionId: string) => void }> = ({
  onNavigateSection,
}) => {
  const [activeTab, setActiveTab] = useState<TerminalTab>('recon');
  const [copied, setCopied] = useState(false);
  const [shellInput, setShellInput] = useState('');
  const [history, setHistory] = useState<ShellEntry[]>(INITIAL_HISTORY);

  const profileCurl = 'curl -fsSL https://sarmansinh.sec/profile.sh | bash';

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // Visual confirmation handled
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };

  const executeShellCommand = (rawCmd: string) => {
    const cmd = rawCmd.trim().toLowerCase();
    if (!cmd) return;

    if (cmd === 'clear') {
      setHistory([]);
      setShellInput('');
      return;
    }

    let output = '';
    if (cmd === 'help') {
      output = 'Available commands: whoami · skills · writeups · contact · clear';
    } else if (cmd === 'whoami') {
      output =
        'Name:   Sarmansinh Solanki\nRole:   Cyber Security Student\nFocus:  Web Application Security (OWASP Top 10, Auth/OAuth, BOLA/IDOR, SSRF, XSS)';
    } else if (cmd === 'skills') {
      output =
        '01  Authentication & OAuth 2.0 Auditing\n' +
        '02  Broken Access Control & IDOR / BOLA\n' +
        '03  SQLi, SSTI & Server-Side Injection\n' +
        '04  SSRF & HTTP Request Smuggling\n' +
        '05  DOM XSS, CSRF & postMessage Security\n' +
        '06  API / GraphQL Testing & Burp Recon';
      onNavigateSection('skills');
    } else if (cmd === 'writeups' || cmd === 'ls') {
      output =
        '01  [Athena]   OAuth Path-Traversal Redirect Account Takeover\n' +
        '02  [Apollo]   Bypassing REST Tenant Filters via Relay Node IDOR\n' +
        '03  [Poseidon] Escalating HTML-to-PDF Export into Internal SSRF\n' +
        '04  [Ares]     Loose postMessage Origin Check to DOM XSS';
      onNavigateSection('writeups');
    } else if (cmd === 'contact') {
      output = 'Email: sarmansinhsolanki@gmail.com (Scrolling to Contact...)';
      onNavigateSection('contact');
    } else {
      output = `Command not recognized: "${rawCmd}". Try: whoami, skills, writeups, contact, clear`;
    }

    setHistory((prev) => [...prev.slice(-3), { cmd: rawCmd, output }]);
    setShellInput('');
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    executeShellCommand(shellInput);
  };

  return (
    <div className="w-full max-w-xl space-y-2.5">
      <div className="font-mono text-[11px] tracking-wider text-[#b8bee0]">
        Inspect via Terminal
      </div>

      <div className="overflow-hidden border border-[#1d25ff]/40 bg-[#07081a]">
        {/* Hermes Agent Electric Klein Blue Tab Strip */}
        <div
          className="grid grid-cols-2 divide-x divide-white/15 bg-[#0b12bd]"
          role="tablist"
          aria-label="Security terminal"
        >
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'recon'}
            onClick={() => setActiveTab('recon')}
            className={`flex items-center justify-between px-3.5 py-2 font-mono text-xs whitespace-nowrap shrink-0 transition-colors duration-150 cursor-pointer ${
              activeTab === 'recon'
                ? 'bg-[#0000f2] text-white font-medium'
                : 'text-white/75 hover:text-white'
            }`}
          >
            <span aria-hidden="true" className="opacity-50">:</span>
            <span className="underline underline-offset-4">CLI Command</span>
            <span aria-hidden="true" className="opacity-50">:</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'profile'}
            onClick={() => setActiveTab('profile')}
            className={`flex items-center justify-between px-3.5 py-2 font-mono text-xs whitespace-nowrap shrink-0 transition-colors duration-150 cursor-pointer ${
              activeTab === 'profile'
                ? 'bg-[#0000f2] text-white font-medium'
                : 'text-white/75 hover:text-white'
            }`}
          >
            <span aria-hidden="true" className="opacity-50">:</span>
            <span className="underline underline-offset-4">Interactive Shell</span>
            <span aria-hidden="true" className="opacity-50">:</span>
          </button>
        </div>

        {activeTab === 'recon' ? (
          <div className="flex items-center justify-between gap-3 bg-[#08091e] px-4 py-3.5">
            <code className="font-mono text-xs text-[#f2f2f2] overflow-x-auto whitespace-nowrap">
              {profileCurl}
            </code>
            <button
              type="button"
              onClick={() => handleCopy(profileCurl)}
              aria-label="Copy CLI command"
              className="inline-flex items-center gap-1.5 px-2 py-1 font-mono text-xs text-[#c5cae8] hover:text-white transition-colors duration-150 whitespace-nowrap shrink-0 cursor-pointer"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-white" /> : <Copy className="h-3.5 w-3.5" />}
            </button>
          </div>
        ) : (
          <div className="p-4 space-y-3 bg-[#08091e]">
            <div className="max-h-36 overflow-y-auto space-y-2.5 bg-[#050614] p-3 border border-white/10 font-mono text-xs">
              {history.length === 0 ? (
                <p className="text-[#7e85ab]">Terminal cleared. Select or enter a command below.</p>
              ) : (
                history.map((item, idx) => (
                  <div key={idx} className="space-y-1">
                    <div className="text-[#8590ff]">$ {item.cmd}</div>
                    <pre className="whitespace-pre-wrap text-[#e2e5f5] leading-relaxed font-mono">
                      {item.output}
                    </pre>
                  </div>
                ))
              )}
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              {['whoami', 'skills', 'writeups', 'contact', 'clear'].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => executeShellCommand(preset)}
                  className="border border-white/12 bg-[#0d1029] px-2.5 py-1 font-mono text-[11px] text-[#c5cae8] hover:border-[#5f6bff] hover:text-white transition-colors duration-150 whitespace-nowrap shrink-0 cursor-pointer"
                >
                  {preset}
                </button>
              ))}
            </div>

            <form onSubmit={handleFormSubmit} className="flex items-center gap-2">
              <label htmlFor="websec-shell-input" className="sr-only">
                Run terminal command
              </label>
              <div className="flex flex-1 items-center border border-white/15 bg-[#050614] px-3 py-1.5">
                <span className="mr-2 font-mono text-xs text-[#5f6bff]">$</span>
                <input
                  id="websec-shell-input"
                  type="text"
                  value={shellInput}
                  onChange={(e) => setShellInput(e.target.value)}
                  placeholder="Type skills, writeups, contact..."
                  className="w-full bg-transparent font-mono text-xs text-white placeholder-[#687096] focus:outline-none"
                />
              </div>
              <button
                type="submit"
                className="bg-[#0000f2] px-3.5 py-1.5 font-mono text-xs font-medium text-white hover:bg-[#242bff] transition-colors duration-150 whitespace-nowrap shrink-0 cursor-pointer"
              >
                Run
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
