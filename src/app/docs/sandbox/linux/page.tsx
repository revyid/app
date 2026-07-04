'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Play, Square, Loader2, Monitor, Keyboard } from 'lucide-react';

interface Profile {
  id: string;
  name: string;
  desc: string;
  memory: number;
  bzimage?: string;
  hda?: string;
  cdrom?: string;
  cmdline?: string;
  state?: string;
  filesystem?: string;
  net_device_type?: string;
}

const PROFILES: Profile[] = [
  {
    id: 'buildroot',
    name: 'Buildroot Linux',
    desc: 'Minimal Linux with serial console — type commands in the terminal below',
    memory: 128,
    bzimage: 'https://i.copy.sh/buildroot-bzimage68.bin',
    cmdline: 'tsc=reliable mitigations=off random.trust_cpu=on',
  },
  {
    id: 'archlinux',
    name: 'Arch Linux',
    desc: 'Full Linux with Xorg, Firefox — interact via the VGA screen above',
    memory: 512,
    state: 'https://i.copy.sh/arch_state-v3.bin.zst',
    filesystem: 'https://i.copy.sh/arch/',
    net_device_type: 'virtio',
  },
  {
    id: 'tinycore',
    name: 'TinyCore',
    desc: 'Ultra-minimal Linux — interact via the VGA screen above',
    memory: 256,
    hda: 'https://i.copy.sh/TinyCore-11.0.iso',
  },
  {
    id: 'slitaz',
    name: 'SliTaz',
    desc: 'Lightweight Linux with GUI — interact via the VGA screen above',
    memory: 512,
    hda: 'https://i.copy.sh/slitaz-rolling-2024.iso',
  },
];

declare global {
  interface Window {
    V86: any;
  }
}

const V86_CDN = 'https://cdn.jsdelivr.net/npm/v86@0.5.420';

function proxyUrl(url: string): string {
  if (url.includes('i.copy.sh')) {
    return `/api/v86-proxy?url=${encodeURIComponent(url)}`;
  }
  return url;
}

async function loadV86(): Promise<any> {
  if (window.V86) return window.V86;
  const script = document.createElement('script');
  script.src = `${V86_CDN}/build/libv86.js`;
  document.head.appendChild(script);
  await new Promise<void>((resolve, reject) => {
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load v86'));
  });
  return (window as any).V86;
}

async function fetchBuffer(url: string): Promise<ArrayBuffer> {
  const res = await fetch(proxyUrl(url));
  if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status}`);
  return res.arrayBuffer();
}

export default function LinuxSandboxPage() {
  const [profile, setProfile] = useState(PROFILES[0]);
  const [running, setRunning] = useState(false);
  const [booting, setBooting] = useState(false);
  const [terminalInput, setTerminalInput] = useState('');
  const [terminalLines, setTerminalLines] = useState<string[]>(['> Select a Linux distribution and click Start.']);
  const containerRef = useRef<HTMLDivElement>(null);
  const emulatorRef = useRef<any>(null);
  const termRef = useRef<HTMLDivElement>(null);
  const serialReceivedRef = useRef(false);

  useEffect(() => {
    if (termRef.current) termRef.current.scrollTop = termRef.current.scrollHeight;
  }, [terminalLines]);

  const startEmulator = useCallback(async () => {
    if (!containerRef.current || running) return;
    setBooting(true);
    setTerminalLines(['> Booting ' + profile.name + '...', '> Loading disk image...']);

    try {
      const V86Class = await loadV86();

      const config: any = {
        screen_container: containerRef.current,
        bios: { url: '/v86/bios/seabios.bin' },
        vga_bios: { url: '/v86/bios/vgabios.bin' },
        wasm_path: `${V86_CDN}/build/v86.wasm`,
        memory_size: profile.memory,
        autostart: true,
        preserve_mac_address: true,
      };

      if (profile.bzimage) {
        setTerminalLines(prev => [...prev, '> Loading kernel image...']);
        const buf = await fetchBuffer(profile.bzimage);
        config.bzimage = { buffer: buf };
      }
      if (profile.hda) {
        setTerminalLines(prev => [...prev, '> Loading disk image...']);
        const buf = await fetchBuffer(profile.hda);
        config.hda = { buffer: buf };
      }
      if (profile.cdrom) {
        const buf = await fetchBuffer(profile.cdrom);
        config.cdrom = { buffer: buf };
      }
      if (profile.cmdline) {
        config.cmdline = profile.cmdline;
      }
      if (profile.state) {
        setTerminalLines(prev => [...prev, '> Loading state image...']);
        const buf = await fetchBuffer(profile.state);
        config.initial_state = { buffer: buf };
      }
      if (profile.filesystem) {
        config.filesystem = {
          baseurl: proxyUrl(profile.filesystem),
          basefs: { url: proxyUrl('https://i.copy.sh/fs.json') },
        };
        config.bzimage_initrd_from_filesystem = true;
      }
      if (profile.net_device_type) {
        config.net_device_type = profile.net_device_type;
      }

      const emulator = new V86Class(config);

      emulatorRef.current = emulator;
      serialReceivedRef.current = false;
      setRunning(true);
      setBooting(false);
      setTerminalLines(prev => [...prev, '> Emulator started.']);

      emulator.add_listener('serial0-output-byte', (byte: number) => {
        serialReceivedRef.current = true;
        setTerminalLines(prev => {
          const last = prev[prev.length - 1] || '';
          if (byte === 10 || byte === 13) return [...prev, ''].slice(-500);
          if (byte < 32 && byte !== 9) return prev;
          const newLines = [...prev.slice(0, -1), last + String.fromCharCode(byte)];
          return newLines.slice(-500);
        });
      });

      // If no serial output after 5s, tell user to use VGA display
      setTimeout(() => {
        if (!serialReceivedRef.current && emulatorRef.current) {
          setTerminalLines(prev => [
            ...prev,
            '> No serial output — interact via the VGA display above.',
            '> This image does not have a serial console enabled.',
          ]);
        }
      }, 5000);
    } catch (e: any) {
      setTerminalLines(prev => [...prev, '> Error: ' + e.message]);
      setBooting(false);
    }
  }, [profile, running]);

  const stopEmulator = () => {
    if (emulatorRef.current) {
      emulatorRef.current.destroy();
      emulatorRef.current = null;
    }
    serialReceivedRef.current = false;
    setRunning(false);
    setBooting(false);
    setTerminalLines(['> Emulator stopped.']);
  };

  const sendCommand = () => {
    if (!emulatorRef.current || !terminalInput.trim()) return;
    const cmd = terminalInput.trim();
    setTerminalLines(prev => [...prev, '$ ' + cmd]);
    // serial0_send takes a string, not individual chars
    emulatorRef.current.serial0_send(cmd + '\n');
    setTerminalInput('');
  };

  useEffect(() => {
    return () => {
      if (emulatorRef.current) emulatorRef.current.destroy();
    };
  }, []);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-foreground mb-1">Linux Sandbox</h1>
        <p className="text-body-sm text-muted-foreground">
          Full Linux environment in your browser via{' '}
          <a
            href="https://github.com/nickstenning/v86"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            v86
          </a>{' '}
          x86 emulator.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {PROFILES.map(p => (
          <button
            key={p.id}
            onClick={() => {
              if (!running) setProfile(p);
            }}
            disabled={running}
            className={`px-3 py-1.5 text-label-sm font-medium rounded-lg transition-colors disabled:opacity-50 ${
              profile.id === p.id
                ? 'bg-primary text-primary-foreground'
                : 'bg-surface-variant text-muted-foreground hover:text-foreground'
            }`}
          >
            {p.name}
          </button>
        ))}
        <button
          onClick={running ? stopEmulator : startEmulator}
          disabled={booting}
          className={`flex items-center gap-1.5 px-4 py-1.5 text-label-sm font-medium rounded-lg transition-colors disabled:opacity-50 ${
            running ? 'bg-error text-error-foreground' : 'bg-success text-success-foreground'
          }`}
        >
          {booting ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" /> Booting...
            </>
          ) : running ? (
            <>
              <Square className="w-3.5 h-3.5" /> Stop
            </>
          ) : (
            <>
              <Play className="w-3.5 h-3.5" /> Start
            </>
          )}
        </button>
      </div>

      <p className="text-label-sm text-muted-foreground">
        {profile.desc} &mdash; {profile.memory}MB RAM
      </p>

      <div className="flex flex-col lg:flex-row gap-4">
        <div className="flex-1 min-w-0">
          <div className="rounded-xl border border-outline/20 overflow-hidden bg-black">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-[#1a1b26] border-b border-outline/10">
              <div className="flex gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-error/80" />
                <div className="w-2.5 h-2.5 rounded-full bg-warning/80" />
                <div className="w-2.5 h-2.5 rounded-full bg-success/80" />
              </div>
              <Monitor className="w-3.5 h-3.5 text-muted-foreground/50 ml-1" />
              <span className="text-label-sm text-muted-foreground/50 font-mono">{profile.name}</span>
            </div>
            <div
              ref={containerRef}
              className="w-full aspect-[4/3] bg-black"
              style={{ minHeight: 400 }}
            />
          </div>
        </div>

        <div className="lg:w-96 flex flex-col">
          <div
            className="rounded-xl border border-outline/20 overflow-hidden flex flex-col"
            style={{ height: 432 }}
          >
            <div className="flex items-center gap-2 px-3 py-1.5 bg-[#13141c] border-b border-outline/10 shrink-0">
              <Keyboard className="w-3.5 h-3.5 text-muted-foreground/50" />
              <span className="text-label-sm text-muted-foreground/60 font-mono">serial0</span>
            </div>
            <div
              ref={termRef}
              className="flex-1 overflow-y-auto p-3 bg-[#1a1b26] font-mono text-[12px] leading-relaxed text-[#a9b1d6]"
            >
              {terminalLines.map((line, i) => (
                <div
                  key={i}
                  className={
                    line.startsWith('$')
                      ? 'text-[#9ece6a]'
                      : line.startsWith('>')
                        ? 'text-[#7aa2f7]'
                        : ''
                  }
                >
                  {line || '\u00A0'}
                </div>
              ))}
            </div>
            <div className="flex items-center gap-2 px-3 py-2 bg-[#13141c] border-t border-outline/10 shrink-0">
              <span className="text-[#9ece6a] font-mono text-[13px]">$</span>
              <input
                type="text"
                value={terminalInput}
                onChange={e => setTerminalInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && sendCommand()}
                disabled={!running}
                placeholder={running ? 'Type command...' : 'Start emulator first'}
                className="flex-1 bg-transparent text-[#a9b1d6] font-mono text-[13px] outline-none placeholder:text-muted-foreground/30 disabled:opacity-50"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="p-3 rounded-xl bg-surface-variant/30 border border-outline/10 text-label-sm text-muted-foreground">
        <strong className="text-foreground">Powered by v86</strong> &mdash; x86 PC emulator
        running WebAssembly in your browser. Buildroot has serial console; TinyCore and SliTaz
        use VGA display only.
      </div>
    </div>
  );
}
