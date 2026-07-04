'use client';

import { Copy, Check, ExternalLink, Monitor, Terminal, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

function CopyBtn({ text }: { text: string }) {
  const [ok, setOk] = useState(false);
  const go = () => {
    navigator.clipboard.writeText(text);
    setOk(true);
    setTimeout(() => setOk(false), 1500);
  };
  return (
    <button
      onClick={go}
      className="text-label-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
    >
      {ok ? (
        <>
          <Check className="w-3 h-3" /> Copied
        </>
      ) : (
        <>
          <Copy className="w-3 h-3" /> Copy
        </>
      )}
    </button>
  );
}

function CodeBlock({ code, lang = 'bash' }: { code: string; lang?: string }) {
  return (
    <div className="my-3 rounded-xl border border-outline/20 overflow-hidden">
      <div className="flex items-center justify-between px-3 py-1.5 bg-surface-variant/80 border-b border-outline/20">
        <span className="text-label-sm text-muted-foreground font-mono">{lang}</span>
        <CopyBtn text={code} />
      </div>
      <pre className="p-3 bg-surface-variant/50 overflow-x-auto">
        <code className="text-[13px] font-mono text-foreground whitespace-pre leading-relaxed">
          {code}
        </code>
      </pre>
    </div>
  );
}

const IMAGES = [
  {
    name: 'Buildroot Linux',
    size: '~10 MB',
    boot: '~10s',
    interface: 'Serial console + VGA',
    interaction: 'Terminal input (serial0)',
    desc: 'Minimal Linux with busybox. Boots directly to a shell via serial console. Best for command-line interaction.',
    image: 'buildroot-bzimage68.bin',
    source: 'bzimage (kernel)',
  },
  {
    name: 'TinyCore',
    size: '~20 MB',
    boot: '~5s',
    interface: 'VGA only',
    interaction: 'Click on VGA screen',
    desc: 'Ultra-minimal Linux with a graphical desktop. No serial console — interact via the VGA display.',
    image: 'TinyCore-11.0.iso',
    source: 'hda (ISO as hard disk)',
  },
  {
    name: 'SliTaz',
    size: '~56 MB',
    boot: '~15s',
    interface: 'VGA only',
    interaction: 'Click on VGA screen',
    desc: 'Lightweight Linux with a full GUI desktop. No serial console — interact via the VGA display.',
    image: 'slitaz-rolling-2024.iso',
    source: 'hda (ISO as hard disk)',
  },
];

export default function LinuxSandboxDocsPage() {
  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Linux Sandbox</h1>
        <p className="text-body-md text-muted-foreground max-w-2xl">
          Run real Linux distributions in your browser. Powered by{' '}
          <a
            href="https://github.com/nickstenning/v86"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            v86
          </a>{' '}
          — an x86 PC emulator compiled to WebAssembly.
        </p>
        <Link
          href="/docs/sandbox/linux"
          className="inline-flex items-center gap-1.5 mt-3 text-primary hover:underline text-body-sm font-medium"
        >
          Try it now <ExternalLink className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* How it works */}
      <section>
        <h2 className="text-xl font-semibold text-foreground mb-3">How It Works</h2>
        <p className="text-body-sm text-muted-foreground mb-3">
          The Linux Sandbox uses v86 to emulate a full x86 PC in your browser. The CPU
          instructions are translated to WebAssembly at runtime for near-native performance. No
          server required — everything runs client-side.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-4 rounded-xl bg-surface border border-outline/15">
            <Monitor className="w-5 h-5 text-primary mb-2" />
            <h3 className="text-body-sm font-semibold text-foreground mb-1">VGA Display</h3>
            <p className="text-label-sm text-muted-foreground">
              Full screen output via Bochs VBE. Click to focus keyboard/mouse input.
            </p>
          </div>
          <div className="p-4 rounded-xl bg-surface border border-outline/15">
            <Terminal className="w-5 h-5 text-success mb-2" />
            <h3 className="text-body-sm font-semibold text-foreground mb-1">Serial Console</h3>
            <p className="text-label-sm text-muted-foreground">
              Buildroot supports serial0 — type commands in the terminal panel.
            </p>
          </div>
          <div className="p-4 rounded-xl bg-surface border border-outline/15">
            <AlertTriangle className="w-5 h-5 text-warning mb-2" />
            <h3 className="text-body-sm font-semibold text-foreground mb-1">No Persistence</h3>
            <p className="text-label-sm text-muted-foreground">
              All changes are lost on page reload. Use for demos and experimentation only.
            </p>
          </div>
        </div>
      </section>

      {/* Available Images */}
      <section>
        <h2 className="text-xl font-semibold text-foreground mb-3">Available Images</h2>
        <div className="rounded-xl border border-outline/15 overflow-hidden">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="bg-surface-variant/50 border-b border-outline/15">
                <th className="text-left py-2 px-3 text-muted-foreground font-medium">Image</th>
                <th className="text-left py-2 px-3 text-muted-foreground font-medium">Size</th>
                <th className="text-left py-2 px-3 text-muted-foreground font-medium">Boot</th>
                <th className="text-left py-2 px-3 text-muted-foreground font-medium">Interface</th>
                <th className="text-left py-2 px-3 text-muted-foreground font-medium">Interaction</th>
              </tr>
            </thead>
            <tbody>
              {IMAGES.map((img) => (
                <tr key={img.name} className="border-b border-outline/10 last:border-0">
                  <td className="py-2 px-3 font-medium text-foreground">{img.name}</td>
                  <td className="py-2 px-3 text-muted-foreground">{img.size}</td>
                  <td className="py-2 px-3 text-muted-foreground">{img.boot}</td>
                  <td className="py-2 px-3 text-muted-foreground">{img.interface}</td>
                  <td className="py-2 px-3 text-muted-foreground">{img.interaction}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Image Details */}
      <section>
        <h2 className="text-xl font-semibold text-foreground mb-3">Image Details</h2>
        <div className="space-y-4">
          {IMAGES.map((img) => (
            <div key={img.name} className="p-4 rounded-xl bg-surface border border-outline/15">
              <div className="flex items-center gap-2 mb-2">
                <h3 className="text-body-md font-semibold text-foreground">{img.name}</h3>
                <span className="px-2 py-0.5 rounded bg-surface-variant text-label-sm text-muted-foreground font-mono">
                  {img.source}
                </span>
              </div>
              <p className="text-body-sm text-muted-foreground">{img.desc}</p>
              <p className="text-label-sm text-muted-foreground/60 mt-2 font-mono">
                {img.image}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Serial Console */}
      <section>
        <h2 className="text-xl font-semibold text-foreground mb-3">Serial Console (Buildroot)</h2>
        <p className="text-body-sm text-muted-foreground mb-3">
          Buildroot Linux boots with a serial console enabled. The terminal panel on the right
          connects to <code className="px-1 py-0.5 bg-surface-variant rounded text-primary font-mono text-[11px]">serial0</code> —
          type commands and see output in real-time.
        </p>
        <div className="space-y-2">
          <p className="text-label-sm text-muted-foreground">
            <strong className="text-foreground">Supported commands:</strong> All busybox commands
            — <code className="px-1 py-0.5 bg-surface-variant rounded text-primary font-mono text-[11px]">ls</code>,{' '}
            <code className="px-1 py-0.5 bg-surface-variant rounded text-primary font-mono text-[11px]">cat</code>,{' '}
            <code className="px-1 py-0.5 bg-surface-variant rounded text-primary font-mono text-[11px]">ping</code>,{' '}
            <code className="px-1 py-0.5 bg-surface-variant rounded text-primary font-mono text-[11px]">curl</code>,{' '}
            <code className="px-1 py-0.5 bg-surface-variant rounded text-primary font-mono text-[11px]">lua</code>, etc.
          </p>
          <p className="text-label-sm text-muted-foreground">
            <strong className="text-foreground">Network:</strong>{' '}
            <code className="px-1 py-0.5 bg-surface-variant rounded text-primary font-mono text-[11px]">ping 8.8.8.8</code>{' '}
            works if the network adapter is configured.
          </p>
        </div>
      </section>

      {/* Technical Details */}
      <section>
        <h2 className="text-xl font-semibold text-foreground mb-3">Technical Details</h2>
        <div className="space-y-3">
          <div className="rounded-xl border border-outline/15 overflow-hidden">
            <table className="w-full text-[13px]">
              <tbody>
                {[
                  ['Emulator', 'v86 0.5.420 (WebAssembly)'],
                  ['CPU', 'x86-compatible, Pentium 4 level, SSE3'],
                  ['BIOS', 'SeaBIOS + Bochs VGA BIOS'],
                  ['Storage', 'IDE disk controller'],
                  ['Display', 'VGA with SVGA support (Bochs VBE)'],
                  ['Serial', '16550A UART (serial0)'],
                  ['Network', 'NE2000 PCI (optional)'],
                ].map(([k, v]) => (
                  <tr key={k} className="border-b border-outline/10 last:border-0">
                    <td className="py-2 px-3 font-medium text-foreground w-32">{k}</td>
                    <td className="py-2 px-3 text-muted-foreground font-mono text-[12px]">{v}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Limitations */}
      <section>
        <h2 className="text-xl font-semibold text-foreground mb-3">Limitations</h2>
        <ul className="space-y-2 text-body-sm text-muted-foreground">
          <li className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-warning shrink-0 mt-0.5" />
            No persistent storage — all changes lost on reload
          </li>
          <li className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-warning shrink-0 mt-0.5" />
            32-bit only — 64-bit kernels are not supported by v86
          </li>
          <li className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-warning shrink-0 mt-0.5" />
            Limited performance — WebAssembly overhead vs native
          </li>
          <li className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-warning shrink-0 mt-0.5" />
            No sound emulation in the sandbox
          </li>
        </ul>
      </section>

      {/* Links */}
      <section>
        <h2 className="text-xl font-semibold text-foreground mb-3">Links</h2>
        <ul className="space-y-2 text-body-sm">
          <li>
            <a
              href="https://github.com/nickstenning/v86"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              v86 GitHub Repository
            </a>{' '}
            <span className="text-muted-foreground">— source code and documentation</span>
          </li>
          <li>
            <a
              href="https://copy.sh/v86/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              v86 Demo
            </a>{' '}
            <span className="text-muted-foreground">— official demo with all supported OS images</span>
          </li>
          <li>
            <a
              href="https://github.com/copy/images"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              v86 Images
            </a>{' '}
            <span className="text-muted-foreground">— source for disk images</span>
          </li>
        </ul>
      </section>
    </div>
  );
}
