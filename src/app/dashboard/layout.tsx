export const dynamic = 'force-dynamic';

import { DashboardGuard } from '@/components/dashboard/DashboardGuard';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <DashboardGuard>
      <div className="min-h-screen bg-background text-foreground">
        {children}
      </div>
    </DashboardGuard>
  );
}
