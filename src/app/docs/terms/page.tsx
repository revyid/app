'use client';

import { FileText, CheckCircle, XCircle, AlertTriangle, Scale, Mail } from 'lucide-react';

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
• Not use automated tools to scrape or bulk-download data
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
• Violate any applicable laws or regulations
We reserve the right to suspend or terminate accounts that violate these terms.`,
  },
  {
    title: 'API Usage & Rate Limits',
    icon: AlertTriangle,
    content: `• Each API key has a rate limit (default: 100 requests/hour)
• Exceeding the limit returns a 429 status code
• Abusive usage may result in permanent key revocation
• We monitor API usage patterns to prevent abuse
• Automated scraping or bulk downloading is prohibited`,
  },
  {
    title: 'Intellectual Property',
    icon: Scale,
    content: `• Revy's code, design, and branding are our intellectual property
• You retain ownership of any content you create using the service
• Short URLs you create are yours to manage and delete
• API responses contain data from third parties (GitHub) subject to their own terms`,
  },
  {
    title: 'Limitation of Liability',
    icon: Scale,
    content: `• Revy is provided "as is" without warranties
• We are not liable for any indirect, incidental, or consequential damages
• Our total liability shall not exceed the amount you paid for the service (currently free)
• We do not guarantee uptime, availability, or data accuracy
• Third-party data (GitHub API) may be inaccurate or outdated`,
  },
  {
    title: 'Termination',
    icon: XCircle,
    content: `• You may delete your account at any time from the dashboard
• We may suspend or terminate accounts that violate these terms
• Upon termination, your data will be deleted within 30 days
• API keys are revoked immediately upon account deletion`,
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
    <div className="space-y-10 max-w-3xl">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Terms of Service</h1>
        <p className="text-body-sm text-muted-foreground">Last updated: July 2026</p>
        <p className="text-body-md text-muted-foreground mt-3 leading-relaxed">
          These Terms of Service govern your use of Revy and its services. By using Revy, you agree to these terms.
        </p>
      </div>

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
  );
}
