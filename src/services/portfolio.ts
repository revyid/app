import { getAllPortfolioData } from '@/lib/auth';

export async function fetchPortfolioData(): Promise<Record<string, unknown>> {
  try {
    const data = await getAllPortfolioData();
    return data;
  } catch (err) {
    console.error('[PortfolioService] Failed to fetch:', err);
    return {};
  }
}
