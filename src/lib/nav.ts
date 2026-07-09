import { Home, LayoutDashboard, Key, Link2, BookOpen, Globe, PlayCircle, Code as CodeIcon } from 'lucide-react';
import type { NavItem } from '@/components/layout/MobileNavDrawer';

export const NAV: NavItem[] = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, children: [
    { href: '/dashboard/api-keys', label: 'API Keys', icon: Key },
    { href: '/dashboard/shorten', label: 'URL Shortener', icon: Link2 },
  ]},
  { href: '/docs', label: 'Docs', icon: BookOpen, children: [
    { href: '/docs', label: 'Overview', icon: BookOpen },
    { href: '/docs/guide', label: 'Guide', icon: BookOpen },
    { href: '/docs/api-reference', label: 'API Reference', icon: Globe, children: [
      { href: '/docs/api-reference/github', label: 'GitHub API', icon: Globe },
    ]},
    { href: '/docs/api-reference/shorten', label: 'URL Shortener', icon: Link2 },
    { href: '/docs/sandbox', label: 'Sandbox', icon: PlayCircle },
    { href: '/docs/curl-ts', label: 'curl-ts', icon: CodeIcon },
  ]},
];
