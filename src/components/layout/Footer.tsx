'use client';

import Link from 'next/link';
import { Heart } from 'lucide-react';

export function Footer() {
  return (
    <footer className="border-t border-outline/10 bg-surface/50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 mb-8">
          <div>
            <h3 className="text-label-sm font-semibold text-foreground mb-3">Product</h3>
            <ul className="space-y-2 text-body-sm text-muted-foreground">
              <li><Link href="/dashboard" className="hover:text-foreground transition-colors">Dashboard</Link></li>
              <li><Link href="/dashboard/api-keys" className="hover:text-foreground transition-colors">API Keys</Link></li>
              <li><Link href="/dashboard/shorten" className="hover:text-foreground transition-colors">URL Shortener</Link></li>
              <li><Link href="/docs/sandbox" className="hover:text-foreground transition-colors">Sandbox</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="text-label-sm font-semibold text-foreground mb-3">Developers</h3>
            <ul className="space-y-2 text-body-sm text-muted-foreground">
              <li><Link href="/docs" className="hover:text-foreground transition-colors">Documentation</Link></li>
              <li><Link href="/docs/guide" className="hover:text-foreground transition-colors">Guide</Link></li>
              <li><Link href="/docs/api-reference" className="hover:text-foreground transition-colors">API Reference</Link></li>
              <li><Link href="/docs/curl-ts" className="hover:text-foreground transition-colors">curl-ts</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="text-label-sm font-semibold text-foreground mb-3">Legal</h3>
            <ul className="space-y-2 text-body-sm text-muted-foreground">
              <li><Link href="/docs/privacy" className="hover:text-foreground transition-colors">Privacy Policy</Link></li>
              <li><Link href="/docs/terms" className="hover:text-foreground transition-colors">Terms of Service</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="text-label-sm font-semibold text-foreground mb-3">Connect</h3>
            <ul className="space-y-2 text-body-sm text-muted-foreground">
              <li><a href="https://github.com/revyid" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">GitHub</a></li>
              <li><a href="https://instagram.com/revy.id" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">Instagram</a></li>
              <li><a href="https://linkedin.com/in/revyid" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">LinkedIn</a></li>
              <li><a href="mailto:revy8k@gmail.com" className="hover:text-foreground transition-colors">Email</a></li>
            </ul>
          </div>
        </div>
        <div className="pt-6 border-t border-outline/10 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-label-sm text-muted-foreground">
            &copy; 2026 Revy. All rights reserved.
          </p>
          <p className="text-label-sm text-muted-foreground flex items-center gap-1">
            Built with <Heart className="w-3 h-3 text-error fill-error" /> using React & Next.js
          </p>
        </div>
      </div>
    </footer>
  );
}
