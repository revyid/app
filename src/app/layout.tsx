import type { Metadata } from 'next';
import './globals.css';
import 'aos/dist/aos.css';
import { RootProviders } from './root-providers';
import { ClientShell } from '@/components/layout/ClientShell';
import { AOSInit } from '@/components/shared/AOSInit';

export const metadata: Metadata = {
  title: 'Revy — Full-Stack Software Engineer · Jambi, Indonesia',
  description: 'Full-stack software engineer from Jambi, Indonesia. 2+ years building web and mobile apps with React, Node.js, TypeScript, and more.',
  keywords: ['Revy', 'software engineer', 'full-stack developer', 'React', 'TypeScript', 'Node.js', 'Indonesia', 'portfolio'],
  authors: [{ name: 'Revy' }],
  robots: 'index, follow',
  alternates: { canonical: 'https://revy.my.id/' },
  openGraph: {
    type: 'website',
    url: 'https://revy.my.id/',
    title: 'Revy — Full-Stack Software Engineer · Jambi, Indonesia',
    description: 'Full-stack software engineer from Jambi, Indonesia. 2+ years building web and mobile apps with React, Node.js, TypeScript, and more.',
    images: [{ url: 'https://revy.my.id/og-image.png', width: 1200, height: 630 }],
    locale: 'en_US',
    siteName: 'Revy Portfolio',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Revy — Full-Stack Software Engineer · Jambi, Indonesia',
    description: 'Full-stack software engineer from Jambi, Indonesia. 2+ years building web and mobile apps with React, Node.js, TypeScript, and more.',
    images: ['https://revy.my.id/og-image.png'],
    creator: '@revy_id',
  },
  icons: {
    icon: '/favicon.svg',
    shortcut: '/favicon-32x32.png',
    apple: '/apple-touch-icon.png',
  },
  manifest: '/site.webmanifest',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="theme-color" content="#82E635" />
        <link rel="preconnect" href="https://ui-avatars.com" />
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('theme');var d=matchMedia('(prefers-color-scheme:dark)').matches;var isDark=t==='dark'||(!t&&d);document.documentElement.classList[isDark?'add':'remove']('dark');var v=localStorage.getItem('themeVars');if(v){var vars=JSON.parse(v);var r=document.documentElement;Object.keys(vars).forEach(function(k){r.style.setProperty('--'+k,vars[k])})}}catch(e){}})()`,
          }}
        />
        <script type="text/javascript" defer data-plerdy_code='1'>
          {`var _protocol="https:"==document.location.protocol?"https://":"http://";
          _site_hash_code = "8c33dfc72588663055a661574d83ac8e",_suid=78670, plerdyScript=document.createElement("script");
          plerdyScript.setAttribute("defer",""),plerdyScript.dataset.plerdymainscript="plerdymainscript",
          plerdyScript.src="https://a.plerdy.com/public/js/click/main.js?v="+Math.random();
          var plerdymainscript=document.querySelector("[data-plerdymainscript='plerdymainscript']");
          plerdymainscript&&plerdymainscript.parentNode.removeChild(plerdymainscript);
          try{document.head.appendChild(plerdyScript)}catch(t){console.log(t,"unable add script tag")}`}
        </script>
        <script
          dangerouslySetInnerHTML={{
            __html: `if('serviceWorker' in navigator){navigator.serviceWorker.register('/sw.js').catch(function(){})}`,
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'Person',
              name: 'Revy',
              url: 'https://revy.my.id',
              email: 'revy8k [at] gmail [dot] com',
              jobTitle: 'Full-Stack Software Engineer',
              description: 'Full-stack software engineer from Jambi, Indonesia with 2+ years of experience building web and mobile applications.',
              image: 'https://revy.my.id/og-image.png',
              sameAs: ['https://github.com/revyid', 'https://instagram.com/revy.id', 'https://linkedin.com/in/revyid'],
              address: { '@type': 'PostalAddress', addressLocality: 'Jambi', addressCountry: 'ID' },
              knowsAbout: ['JavaScript', 'TypeScript', 'React', 'Node.js', 'Python', 'Docker', 'MongoDB'],
            }),
          }}
        />
      </head>
      <body className="bg-background text-foreground antialiased" style={{ overflowX: 'clip', position: 'relative' }} suppressHydrationWarning>
        <AOSInit />
        <RootProviders><ClientShell>{children}</ClientShell></RootProviders>
      </body>
    </html>
  );
}
