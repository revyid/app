import en from '../../../messages/en.json';
import id from '../../../messages/id.json';

const messages: Record<string, any> = { en, id };

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const msgs = messages[locale] || messages.en;

  return (
    <div lang={locale}>
      {children}
    </div>
  );
}
