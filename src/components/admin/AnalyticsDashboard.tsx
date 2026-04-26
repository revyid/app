import { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, Users, Eye, ExternalLink, Activity } from 'lucide-react';
import { getAnalyticsSummary } from '@/lib/auth';
import { Card } from '@/components/ui/card';

interface AnalyticsData {
  total_views: number;
  unique_visitors: number;
  top_pages: Array<{ page: string; views: number }> | null;
  daily_views: Array<{ date: string; views: number }> | null;
  referrers: Array<{ referrer: string; count: number }> | null;
}

export function AnalyticsDashboard() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(30);
  const [error, setError] = useState<string>();

  useEffect(() => {
    loadAnalytics();
  }, [days]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      setError(undefined);
      const result = await getAnalyticsSummary(days);
      setData(result || { total_views: 0, unique_visitors: 0, top_pages: null, daily_views: null, referrers: null });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load analytics');
      setData({ total_views: 0, unique_visitors: 0, top_pages: null, daily_views: null, referrers: null });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Activity className="w-8 h-8 animate-pulse text-primary" />
      </div>
    );
  }

  const maxDailyViews = Math.max(...(data?.daily_views?.map(d => d.views) || [1]), 1);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-primary" />
          <h3 className="text-base font-semibold text-on-surface">Analytics Dashboard</h3>
        </div>
        <select
          value={days}
          onChange={(e) => setDays(Number(e.target.value))}
          className="px-3 py-1.5 text-sm rounded-xl border border-outline/20 bg-surface-container text-on-surface"
        >
          <option value={7}>Last 7 days</option>
          <option value={30}>Last 30 days</option>
          <option value={90}>Last 90 days</option>
        </select>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-error-container text-on-error-container text-sm">
          {error}
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="p-5 bg-surface-container hover:bg-surface-container-high transition-colors">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-full bg-primary-container">
              <Eye className="w-5 h-5 text-on-primary-container" />
            </div>
            <div>
              <div className="text-2xl font-bold text-on-surface">{data?.total_views?.toLocaleString() ?? 0}</div>
              <div className="text-sm text-on-surface-variant">Total Views</div>
            </div>
          </div>
        </Card>

        <Card className="p-5 bg-surface-container hover:bg-surface-container-high transition-colors">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-full bg-secondary-container">
              <Users className="w-5 h-5 text-on-secondary-container" />
            </div>
            <div>
              <div className="text-2xl font-bold text-on-surface">{data?.unique_visitors?.toLocaleString() ?? 0}</div>
              <div className="text-sm text-on-surface-variant">Unique Visitors</div>
            </div>
          </div>
        </Card>
      </div>

      {/* Daily Views Chart */}
      {data?.daily_views && data.daily_views.length > 0 ? (
        <Card className="p-5 bg-surface-container">
          <h4 className="text-sm font-medium text-on-surface mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-primary" />
            Daily Views
          </h4>
          <div className="space-y-2">
            {data.daily_views.map((item, idx) => (
              <div key={idx} className="flex items-center gap-3">
                <div className="text-xs text-on-surface-variant w-20">
                  {new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </div>
                <div className="flex-1 h-7 bg-surface-variant rounded-xl overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-xl transition-all"
                    style={{ width: `${(item.views / maxDailyViews) * 100}%` }}
                  />
                </div>
                <div className="text-sm font-medium text-on-surface w-10 text-right">{item.views}</div>
              </div>
            ))}
          </div>
        </Card>
      ) : (
        <Card className="p-8 text-center bg-surface-container">
          <TrendingUp className="w-10 h-10 mx-auto mb-3 text-on-surface-variant opacity-30" />
          <p className="text-sm text-on-surface-variant">No daily views data yet</p>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Top Pages */}
        <Card className="p-5 bg-surface-container">
          <h4 className="text-sm font-medium text-on-surface mb-3">Top Pages</h4>
          {data?.top_pages && data.top_pages.length > 0 ? (
            <div className="space-y-2">
              {data.top_pages.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between text-sm">
                  <span className="text-on-surface-variant truncate flex-1">{item.page || '/'}</span>
                  <span className="font-medium text-on-surface ml-2">{item.views}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-on-surface-variant text-center py-4">No page data yet</p>
          )}
        </Card>

        {/* Referrers */}
        <Card className="p-5 bg-surface-container">
          <h4 className="text-sm font-medium text-on-surface mb-3 flex items-center gap-2">
            <ExternalLink className="w-4 h-4" />
            Top Referrers
          </h4>
          {data?.referrers && data.referrers.length > 0 ? (
            <div className="space-y-2">
              {data.referrers.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between text-sm">
                  <span className="text-on-surface-variant truncate flex-1">{item.referrer}</span>
                  <span className="font-medium text-on-surface ml-2">{item.count}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-on-surface-variant text-center py-4">No referrer data yet</p>
          )}
        </Card>
      </div>
    </div>
  );
}
