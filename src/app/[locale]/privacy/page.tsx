'use client';

import { Link } from '@/i18n/navigation';
import { Shield, Eye, Database, Lock, Mail, ArrowLeft } from 'lucide-react';

const sections = [
  {
    title: 'Information We Collect',
    icon: Database,
    content: `When you use Revy, we collect the following information:
• Account data: email, display name, avatar URL, and authentication provider
• Usage data: API call counts, request metadata (user agent, IP), and timestamps
• Short URL data: original URLs, slugs, and click counts
• We do NOT collect: payment information, government IDs, or biometric data`,
  },
  {
    title: 'How We Use Your Information',
    icon: Eye,
    content: `Your data is used solely to provide and improve the service:
• Authenticate your sessions and API requests
• Track API usage for rate limiting
• Monitor service performance and reliability
• Display your profile information in the dashboard
We do NOT sell, rent, or share your personal data with third parties for advertising.`,
  },
  {
    title: 'Data Storage & Security',
    icon: Lock,
    content: `• All data is stored in Supabase (PostgreSQL) with row-level security
• API keys are stored as salted hashes — we cannot recover your key
• Sessions expire after 30 days of inactivity
• Data is transmitted over TLS/HTTPS encryption
• We follow industry-standard security practices`,
  },
  {
    title: 'Data Retention',
    icon: Database,
    content: `• Account data: retained while your account is active
• API keys: retained until deleted or expired
• Short URLs: retained until deleted
• Session data: automatically expires after 30 days
• Usage logs: retained for 90 days for analytics
You can delete your data at any time from the dashboard.`,
  },
  {
    title: 'Your Rights',
    icon: Shield,
    content: `You have the right to:
• Access all data we hold about you
• Delete your account and all associated data
• Export your data in a portable format
• Opt out of non-essential data collection
To exercise these rights, contact us or use the dashboard settings.`,
  },
  {
    title: 'Contact Us',
    icon: Mail,
    content: `If you have questions about this privacy policy or your data, contact us at:
• Email: revy8k@gmail.com
• GitHub: github.com/revyid/app
• Website: revy.my.id`,
  },
];

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
        <Link href="/" className="inline-flex items-center gap-1.5 text-body-sm text-muted-foreground hover:text-foreground transition-colors mb-8">
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </Link>

        <h1 className="text-3xl font-bold text-foreground mb-2">Privacy Policy</h1>
        <p className="text-body-sm text-muted-foreground">Last updated: July 2026</p>
        <p className="text-body-md text-muted-foreground mt-3 leading-relaxed">
          This Privacy Policy describes how Revy collects, uses, and protects your personal information when you use our platform and services.
        </p>

        <div className="mt-10 space-y-10">
          {sections.map((section, i) => (
            <section key={i} className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-primary-container flex items-center justify-center">
                  <section.icon className="w-4 h-4 text-primary" />
                </div>
                <h2 className="text-lg font-semibold text-foreground">{section.title}</h2>
              </div>
              <div className="text-body-sm text-muted-foreground leading-relaxed whitespace-pre-line pl-12">
                {section.content}
              </div>
            </section>
          ))}
        </div>

        <div className="mt-12 pt-8 border-t border-outline/10 text-center">
          <Link href="/" className="text-body-sm text-primary hover:underline">Back to Revy</Link>
        </div>
      </div>
    </div>
  );
}
