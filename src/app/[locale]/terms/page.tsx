'use client';

import { Link } from '@/i18n/navigation';
import { FileText, CheckCircle, XCircle, AlertTriangle, Scale, Mail, ArrowLeft } from 'lucide-react';

const sections = [
  {
    title: 'Acceptance of Terms',
    icon: CheckCircle,
    content: `By accessing or using Revy, you agree to be bound by these Terms of Service. If you do not agree, do not use the service. We reserve the right to update these terms at any time.`,
  },
  {
    title: 'Description of Service',
    icon: FileText,
    content: `Revy provides:
• GitHub API proxy for accessing public GitHub data
• URL shortening and click tracking
• Interactive code sandbox (JavaScript, Python, TypeScript, cURL)
• Dashboard for managing API keys and short URLs
The service is provided "as is" without warranties of any kind.`,
  },
  {
    title: 'User Responsibilities',
    icon: CheckCircle,
    content: `You agree to:
• Use the service only for lawful purposes
• Not attempt to abuse, overload, or disrupt the service
• Not share your API keys with unauthorized parties
• Not use the service to circumvent rate limits or access controls
• Keep your account credentials secure`,
  },
  {
    title: 'Prohibited Uses',
    icon: XCircle,
    content: `You must NOT use Revy to:
• Send spam, phishing, or malicious content
• Create short URLs that lead to harmful or illegal content
• Attempt to gain unauthorized access to other users' data
• Reverse engineer or exploit the service
• Violate any applicable laws or regulations`,
  },
  {
    title: 'API Usage & Rate Limits',
    icon: AlertTriangle,
    content: `• Each API key has a rate limit (default: 100 requests/hour)
• Exceeding the limit returns a 429 status code
• Abusive usage may result in permanent key revocation
• Automated scraping or bulk downloading is prohibited`,
  },
  {
    title: 'Limitation of Liability',
    icon: Scale,
    content: `• Revy is provided "as is" without warranties
• We are not liable for any indirect, incidental, or consequential damages
• Our total liability shall not exceed the amount you paid for the service (currently free)
• We do not guarantee uptime, availability, or data accuracy`,
  },
  {
    title: 'Contact',
    icon: Mail,
    content: `For questions about these terms:
• Email: revy8k@gmail.com
• GitHub: github.com/revyid/app
• Website: revy.my.id`,
  },
];

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
        <Link href="/" className="inline-flex items-center gap-1.5 text-body-sm text-muted-foreground hover:text-foreground transition-colors mb-8">
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </Link>

        <h1 className="text-3xl font-bold text-foreground mb-2">Terms of Service</h1>
        <p className="text-body-sm text-muted-foreground">Last updated: July 2026</p>
        <p className="text-body-md text-muted-foreground mt-3 leading-relaxed">
          These Terms of Service govern your use of Revy and its services. By using Revy, you agree to these terms.
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
