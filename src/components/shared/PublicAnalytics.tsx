import { useState, useEffect, useRef, useMemo } from 'react';
import { Eye, GitBranch, Star, GitFork, Activity, TrendingUp, Code, Monitor, Smartphone, Tablet, Globe, ArrowUpRight, ArrowDownRight, BarChart3 } from 'lucide-react';
import { motion } from 'framer-motion';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { Card } from '@/components/ui/card';
import { SectionLabel } from '@/components/shared/SectionLabel';
import { getSupabase } from '@/lib/supabase';
import { containerVariants, itemVariants, viewportOnce, SPRING_BOUNCY } from '@/lib/motion-presets';

let _siteKeyCache: string | null = null;

async function getSiteKey(): Promise<string> {
  if (_siteKeyCache !== null) return _siteKeyCache;
  try {
    const client = await getSupabase();
    const { data } = await client.rpc('get_site_setting', { p_key: 'site_api_key' });
    _siteKeyCache = data || '';
  } catch {
    _siteKeyCache = '';
  }
  return _siteKeyCache ?? '';
}

async function fetchGitHub(path: string): Promise<any> {
  const key = await getSiteKey();
  const res = await fetch(`/api/github?path=${encodeURIComponent(path)}`, {
    headers: key ? { 'x-api-key': key } : {},
  });
  return res.json();
}

function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse bg-surface-variant rounded-2xl ${className}`} />;
}

function parseUserAgent(ua: string): { os: string; browser: string; device: 'desktop' | 'mobile' | 'tablet' | 'bot' } {
  const lower = ua.toLowerCase();
  if (lower.includes('bot') || lower.includes('crawler') || lower.includes('spider') || lower.includes('curl') || lower.includes('wget')) {
    return { os: 'Bot', browser: 'Bot', device: 'bot' };
  }
  let os = 'Other';
  if (lower.includes('windows nt 10')) os = 'Windows';
  else if (lower.includes('windows')) os = 'Windows';
  else if (lower.includes('iphone') || lower.includes('ipad')) os = 'iOS';
  else if (lower.includes('android')) os = 'Android';
  else if (lower.includes('mac os x') || lower.includes('macintosh')) os = 'macOS';
  else if (lower.includes('cros')) os = 'Chrome OS';
  else if (lower.includes('linux')) os = 'Linux';
  let browser = 'Other';
  if (lower.includes('edg/')) browser = 'Edge';
  else if (lower.includes('opr/') || lower.includes('opera')) browser = 'Opera';
  else if (lower.includes('chrome') && !lower.includes('edg/')) browser = 'Chrome';
  else if (lower.includes('firefox')) browser = 'Firefox';
  else if (lower.includes('safari') && !lower.includes('chrome')) browser = 'Safari';
  let device: 'desktop' | 'mobile' | 'tablet' | 'bot' = 'desktop';
  if (lower.includes('mobile') || lower.includes('iphone') || (lower.includes('android') && !lower.includes('tablet'))) device = 'mobile';
  else if (lower.includes('ipad') || lower.includes('tablet')) device = 'tablet';
  return { os, browser, device };
}

function AnimatedNumber({ value, className }: { value: number; className?: string }) {
  const [displayed, setDisplayed] = useState(0);
  useEffect(() => {
    if (value === 0) { setDisplayed(0); return; }
    const step = Math.max(1, Math.ceil(value / 30));
    let current = 0;
    const interval = setInterval(() => {
      current += step;
      if (current >= value) { setDisplayed(value); clearInterval(interval); }
      else setDisplayed(current);
    }, 20);
    return () => clearInterval(interval);
  }, [value]);
  return <span className={className}>{displayed.toLocaleString()}</span>;
}

/* eslint-disable @typescript-eslint/no-explicit-any */
const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-surface border border-outline/20 rounded-xl px-3 py-2 shadow-elevation-3">
      <p className="text-label-sm text-muted-foreground">{label}</p>
      <p className="text-body-sm font-bold text-primary">{payload[0].value} views</p>
    </div>
  );
};

function TrafficChart({ dailyViews, hourlyViews, agents }: { dailyViews: any[]; hourlyViews: any[]; agents: string[] }) {
  const [timeRange, setTimeRange] = useState<'daily' | 'hourly'>('daily');
  const [mode, setMode] = useState<'all' | 'platform'>('all');

  const platformBreakdown = useMemo(() => {
    if (!Array.isArray(agents) || agents.length === 0) return [];
    const count: Record<string, number> = {};
    agents.forEach(ua => {
      const parsed = parseUserAgent(ua);
      const key = parsed.os;
      count[key] = (count[key] || 0) + 1;
    });
    const total = Object.values(count).reduce((s, c) => s + c, 0);
    return Object.entries(count)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 4)
      .map(([name, c]) => ({ name, ratio: total > 0 ? c / total : 0 }));
  }, [agents]);

  const platformColors = ['hsl(var(--primary))', 'hsl(var(--tertiary))', 'hsl(var(--secondary))', '#f59e0b'];

  const rawChartData = timeRange === 'daily'
    ? dailyViews.map(d => ({ name: new Date(d.date).toLocaleDateString('en', { weekday: 'short' }), views: d.views }))
    : hourlyViews.map(d => ({ name: new Date(d.hour).toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' }), views: d.views }));

  const chartData = mode === 'platform'
    ? rawChartData.map(d => {
        const row: any = { name: d.name };
        platformBreakdown.forEach(p => { row[p.name] = Math.round(d.views * p.ratio); });
        return row;
      })
    : rawChartData;

  const total = rawChartData.reduce((s, d) => s + d.views, 0);
  const prev = rawChartData.slice(0, Math.floor(rawChartData.length / 2)).reduce((s, d) => s + d.views, 0);
  const curr = rawChartData.slice(Math.floor(rawChartData.length / 2)).reduce((s, d) => s + d.views, 0);
  const change = prev > 0 ? ((curr - prev) / prev * 100).toFixed(1) : '0';
  const isUp = Number(change) >= 0;

  return (
    <Card className="p-4 sm:p-6 hover:bg-surface-container/50 transition-colors col-span-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-full bg-primary-container">
            <div className="text-primary-container-foreground"><BarChart3 className="w-5 h-5" /></div>
          </div>
          <div>
            <h3 className="text-title-sm font-semibold text-foreground">Traffic & Audience</h3>
            <div className="flex items-center gap-1.5 text-label-sm">
              <span className="text-muted-foreground">{total.toLocaleString()} total</span>
              <span className={`flex items-center gap-0.5 font-medium ${isUp ? 'text-success' : 'text-error'}`}>
                {isUp ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                {change}%
              </span>
            </div>
          </div>
        </div>
        <div className="flex gap-1 flex-wrap self-start">
          <div className="flex gap-1 p-1 bg-surface-variant rounded-lg">
            {(['daily', 'hourly'] as const).map(v => (
              <button key={v} onClick={() => setTimeRange(v)}
                className={`px-2 sm:px-3 py-1 rounded-md text-label-sm font-medium transition-all ${timeRange === v ? 'bg-surface shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}>
                {v === 'daily' ? '7D' : '24H'}
              </button>
            ))}
          </div>
          <div className="flex gap-1 p-1 bg-surface-variant rounded-lg">
            {(['all', 'platform'] as const).map(m => (
              <button key={m} onClick={() => setMode(m)}
                className={`px-2 sm:px-3 py-1 rounded-md text-label-sm font-medium transition-all ${mode === m ? 'bg-surface shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}>
                {m === 'all' ? 'All' : 'Platform'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {mode === 'platform' && platformBreakdown.length > 0 && (
        <div className="flex flex-wrap gap-3 mb-3">
          {platformBreakdown.map((p, i) => (
            <div key={p.name} className="flex items-center gap-1.5 text-label-sm">
              <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: platformColors[i] }} />
              <span className="text-muted-foreground">{p.name}</span>
              <span className="text-foreground font-medium">{Math.round(p.ratio * 100)}%</span>
            </div>
          ))}
        </div>
      )}

      {/* Two-column layout: chart + audience */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart — takes 2/3 */}
        <div className="lg:col-span-2 h-56">
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--outline) / 0.08)" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                  axisLine={{ stroke: 'hsl(var(--outline) / 0.15)' }} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                  axisLine={{ stroke: 'hsl(var(--outline) / 0.15)' }} tickLine={false} />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (!active || !payload?.length) return null;
                    return (
                      <div className="bg-surface border border-outline/20 rounded-xl px-3 py-2 shadow-elevation-3">
                        <p className="text-label-sm text-muted-foreground mb-1">{label}</p>
                        {payload.map((p: any, i: number) => (
                          <div key={i} className="flex items-center gap-2 text-body-sm">
                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
                            <span className="text-muted-foreground">{p.name}:</span>
                            <span className="font-bold" style={{ color: p.color }}>{p.value}</span>
                          </div>
                        ))}
                      </div>
                    );
                  }}
                />
                {mode === 'all' ? (
                  <Line type="monotone" dataKey="views" stroke="hsl(var(--primary))" strokeWidth={2.5}
                    dot={{ r: 3, fill: 'hsl(var(--primary))', strokeWidth: 0 }}
                    activeDot={{ r: 5, fill: 'hsl(var(--primary))', stroke: 'hsl(var(--background))', strokeWidth: 2 }} />
                ) : (
                  platformBreakdown.map((p, i) => (
                    <Line key={p.name} type="monotone" dataKey={p.name} stroke={platformColors[i]}
                      strokeWidth={2} dot={{ r: 2, fill: platformColors[i], strokeWidth: 0 }}
                      activeDot={{ r: 4, fill: platformColors[i], stroke: 'hsl(var(--background))', strokeWidth: 2 }} />
                  ))
                )}
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-muted-foreground text-body-sm">No data yet</div>
          )}
        </div>

        {/* Audience breakdown — takes 1/3 */}
        <div className="lg:border-l lg:border-outline/10 lg:pl-6">
          <p className="text-label-sm font-medium text-muted-foreground mb-3">Audience</p>
          <PlatformBreakdown agents={agents} />
        </div>
      </div>
    </Card>
  );
}

function StatTicker({ label, value, icon, color, change }: { label: string; value: number; icon: React.ReactNode; color: string; change?: string }) {
  const isPositive = change && !change.startsWith('-');
  return (
    <motion.div whileHover={{ scale: 1.03, y: -2 }} transition={SPRING_BOUNCY}
      className="relative p-4 rounded-2xl bg-surface-variant overflow-hidden">
      <div className={`absolute top-0 right-0 w-16 h-16 rounded-full ${color} opacity-10 -translate-y-1/3 translate-x-1/3`} />
      <div className="flex items-center justify-between mb-2">
        <div className="text-muted-foreground">{icon}</div>
        {change && (
          <div className={`flex items-center gap-0.5 text-label-sm font-medium ${isPositive ? 'text-success' : 'text-error'}`}>
            {isPositive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
            {change}
          </div>
        )}
      </div>
      <AnimatedNumber value={value} className="text-2xl font-bold text-foreground block" />
      <div className="text-label-sm text-muted-foreground mt-1">{label}</div>
    </motion.div>
  );
}

function VisitorCounter({ today, unique }: { today: number; unique: number }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <StatTicker label="Today" value={today} icon={<Activity className="w-4 h-4" />} color="bg-primary" />
      <StatTicker label="Unique Visitors" value={unique} icon={<Eye className="w-4 h-4" />} color="bg-secondary" />
    </div>
  );
}

function PlatformBreakdown({ agents }: { agents: string[] }) {
  const [activeTab, setActiveTab] = useState<'os' | 'browser' | 'device'>('os');

  const parsed = agents.map(parseUserAgent);
  const osCount: Record<string, number> = {};
  const browserCount: Record<string, number> = {};
  const deviceCount: Record<string, number> = {};
  parsed.forEach(p => {
    osCount[p.os] = (osCount[p.os] || 0) + 1;
    browserCount[p.browser] = (browserCount[p.browser] || 0) + 1;
    deviceCount[p.device] = (deviceCount[p.device] || 0) + 1;
  });

  const tabs = [
    { id: 'os' as const, label: 'OS', icon: <Monitor className="w-3.5 h-3.5" /> },
    { id: 'browser' as const, label: 'Browser', icon: <Globe className="w-3.5 h-3.5" /> },
    { id: 'device' as const, label: 'Device', icon: <Smartphone className="w-3.5 h-3.5" /> },
  ];

  const currentData = activeTab === 'os' ? osCount : activeTab === 'browser' ? browserCount : deviceCount;
  const sorted = Object.entries(currentData).sort(([, a], [, b]) => b - a);
  const total = sorted.reduce((s, [, c]) => s + c, 0);
  const items = sorted.slice(0, 6); // include all including Bot
  const colors = ['hsl(var(--primary))', 'hsl(var(--tertiary))', 'hsl(var(--secondary))', '#f59e0b', 'hsl(var(--error))', 'hsl(var(--outline))'];

  return (
    <div>
      {/* Tab switcher */}
      <div className="flex gap-1 p-1 bg-surface-variant rounded-lg mb-4 w-fit">
        {tabs.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-label-sm font-medium transition-all ${activeTab === tab.id ? 'bg-surface shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}>
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {items.length > 0 ? (
        <div className="space-y-2.5">
          {items.map(([name, count], i) => {
            const pct = total > 0 ? Math.round((count / total) * 100) : 0;
            return (
              <div key={name} className="space-y-1">
                <div className="flex items-center justify-between text-label-sm">
                  <span className="text-foreground font-medium">{name}</span>
                  <span className="text-muted-foreground font-mono">{pct}%</span>
                </div>
                <div className="h-1.5 bg-surface-variant rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    whileInView={{ width: `${pct}%` }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: i * 0.08 }}
                    className="h-full rounded-full"
                    style={{ backgroundColor: colors[i] || colors[0] }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="text-body-sm text-muted-foreground text-center py-4">No data yet</p>
      )}
    </div>
  );
}

function LiveIndicator() {
  const [pulse, setPulse] = useState(true);
  useEffect(() => {
    const t = setInterval(() => setPulse(p => !p), 2000);
    return () => clearInterval(t);
  }, []);
  return (
    <div className="flex items-center gap-2 text-body-sm text-muted-foreground">
      <motion.div animate={{ scale: pulse ? [1, 1.4, 1] : 1 }} transition={{ duration: 0.6 }}
        className="w-2 h-2 rounded-full bg-success" />
      Live
    </div>
  );
}

export function GitHubStats({ username }: { username: string }) {
  const [stats, setStats] = useState<any>(null);
  const [repos, setRepos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([
      fetchGitHub(`users/${username}`),
      fetchGitHub(`users/${username}/repos?sort=updated&per_page=5`),
    ]).then(([user, reposData]) => {
      if (user.message) { setError(user.message); }
      else { setStats(user); setRepos(Array.isArray(reposData) ? reposData : []); }
    }).catch(() => setError('Failed to fetch'))
      .finally(() => setLoading(false));
  }, [username]);

  if (loading) return <Card className="p-6"><Skeleton className="h-40" /></Card>;
  if (error) return (
    <Card className="p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-3 rounded-full bg-secondary-container"><GitBranch className="w-5 h-5 text-secondary-container-foreground" /></div>
        <h3 className="text-title-sm font-semibold text-foreground">GitHub Activity</h3>
      </div>
      <p className="text-body-sm text-muted-foreground">{error.includes('rate limit') ? 'Rate limit reached. Try again later.' : error}</p>
    </Card>
  );
  if (!stats) return null;

  const totalStars = repos.reduce((s, r) => s + (r.stargazers_count || 0), 0);

  return (
    <Card className="p-6 hover:bg-surface-container/50 transition-colors">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-3 rounded-full bg-secondary-container">
          <div className="text-secondary-container-foreground"><GitBranch className="w-5 h-5" /></div>
        </div>
        <div>
          <h3 className="text-title-sm font-semibold text-foreground">GitHub Activity</h3>
          <p className="text-label-sm text-muted-foreground">@{username}</p>
        </div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <StatTicker label="Repos" value={stats.public_repos} icon={<GitBranch className="w-4 h-4" />} color="bg-secondary" />
        <StatTicker label="Stars" value={totalStars} icon={<Star className="w-4 h-4 text-yellow-500" />} color="bg-yellow-500/20" />
        <StatTicker label="Followers" value={stats.followers} icon={<TrendingUp className="w-4 h-4" />} color="bg-primary" />
        <StatTicker label="Following" value={stats.following} icon={<Activity className="w-4 h-4" />} color="bg-tertiary" />
      </div>
      {repos.length > 0 && (
        <div className="space-y-2">
          <p className="text-label-sm font-medium text-muted-foreground mb-2">Recent Repos</p>
          {repos.slice(0, 3).map(repo => (
            <motion.a key={repo.id} href={repo.html_url} target="_blank" rel="noopener noreferrer"
              whileHover={{ x: 4 }} transition={SPRING_BOUNCY}
              className="flex items-center justify-between text-body-sm p-3 rounded-xl bg-surface-variant hover:bg-surface-container-high transition-colors">
              <span className="truncate flex-1 text-foreground font-medium">{repo.name}</span>
              <div className="flex items-center gap-3 ml-3 shrink-0 text-foreground">
                <span className="flex items-center gap-1"><Star className="w-3 h-3 text-yellow-500" />{repo.stargazers_count}</span>
                <span className="flex items-center gap-1"><GitFork className="w-3 h-3" />{repo.forks_count}</span>
              </div>
            </motion.a>
          ))}
        </div>
      )}
    </Card>
  );
}

function TopLanguages({ username }: { username: string }) {
  const [languages, setLanguages] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchGitHub(`users/${username}/repos?per_page=100`).then((repos: any[]) => {
      if (!Array.isArray(repos)) return;
      const count: Record<string, number> = {};
      repos.forEach(r => { if (r.language) count[r.language] = (count[r.language] || 0) + 1; });
      setLanguages(count);
    }).finally(() => setLoading(false));
  }, [username]);

  if (loading) return <Card className="p-6"><Skeleton className="h-36" /></Card>;

  const sorted = Object.entries(languages).sort(([, a], [, b]) => b - a);
  const total = sorted.reduce((s, [, c]) => s + c, 0);
  const chartData = sorted.slice(0, 5).map(([name, count]) => ({ name, count, pct: total > 0 ? Math.round((count / total) * 100) : 0 }));

  return (
    <Card className="p-6 hover:bg-surface-container/50 transition-colors">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-3 rounded-full bg-primary-container">
          <div className="text-primary-container-foreground"><Code className="w-5 h-5" /></div>
        </div>
        <h3 className="text-title-sm font-semibold text-foreground">Top Languages</h3>
      </div>
      {chartData.length > 0 ? (
        <div className="h-40 mb-4">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--outline) / 0.1)" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="count" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <p className="text-body-sm text-muted-foreground text-center py-4">No data yet</p>
      )}
      <div className="space-y-2">
        {chartData.map((lang, i) => (
          <div key={lang.name} className="flex items-center gap-3">
            <span className="text-label-sm font-mono text-muted-foreground w-5">{i + 1}</span>
            <div className="flex-1 min-w-0">
              <div className="flex justify-between text-body-sm mb-1">
                <span className="font-medium text-foreground">{lang.name}</span>
                <span className="text-label-sm text-muted-foreground">{lang.pct}%</span>
              </div>
              <div className="h-1.5 bg-surface-variant rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  whileInView={{ width: `${lang.pct}%` }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.8, delay: i * 0.1 }}
                  className="h-full bg-primary rounded-full"
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

export function PublicAnalytics() {
  const sectionRef = useRef<HTMLElement>(null);
  const [inView, setInView] = useState(false);
  const [githubUsername, setGithubUsername] = useState<string | null>(null);
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const fetched = useRef(false);

  useEffect(() => {
    if (!sectionRef.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setInView(true); observer.disconnect(); } },
      { rootMargin: '200px' }
    );
    observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  const refreshStats = useRef(async () => {
    try {
      const { data } = await (await getSupabase()).rpc('get_public_analytics');
      if (data) setAnalytics(data);
    } catch (e) { console.error('Stats refresh error:', e); }
  });

  useEffect(() => {
    if (!inView || fetched.current) return;
    fetched.current = true;
    setLoading(true);
    Promise.all([
      getSupabase().then(c => c.rpc('get_public_analytics')),
      import('@/lib/auth').then(({ getSiteSetting }) => getSiteSetting('github_username')),
    ]).then(([analyticsResult, username]) => {
      const { data, error: rpcError } = analyticsResult;
      if (rpcError) { console.error('Stats RPC error:', rpcError); setError(rpcError.message); }
      else setAnalytics(data);
      setGithubUsername(username || '');
    }).catch((e) => { console.error('Stats fetch error:', e); setError(e.message); })
      .finally(() => setLoading(false));
  }, [inView]);

  // Realtime: subscribe to new analytics events and refresh stats
  useEffect(() => {
    if (!inView) return;
    let channel: any;
    getSupabase().then(client => {
      channel = client
        .channel('analytics-realtime')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'analytics_events' }, () => {
          refreshStats.current();
        })
        .subscribe();
    });
    return () => { if (channel) getSupabase().then(client => client.removeChannel(channel)); };
  }, [inView]);

  if (!inView) return (
    <motion.section ref={sectionRef} initial="hidden" variants={containerVariants} className="mb-10">
      <motion.div variants={itemVariants} className="flex items-center justify-between mb-5">
        <SectionLabel text="Live Stats & Activity" />
      </motion.div>
      <Card className="p-6"><Skeleton className="h-64" /></Card>
    </motion.section>
  );

  if (loading) return (
    <motion.section ref={sectionRef} initial="hidden" animate="visible" variants={containerVariants} className="mb-10">
      <motion.div variants={itemVariants} className="flex items-center justify-between mb-5">
        <SectionLabel text="Live Stats & Activity" />
      </motion.div>
      <Card className="p-6"><Skeleton className="h-64" /></Card>
    </motion.section>
  );

  if (error) return (
    <motion.section ref={sectionRef} initial="hidden" animate="visible" variants={containerVariants} className="mb-10">
      <motion.div variants={itemVariants} className="flex items-center justify-between mb-5">
        <SectionLabel text="Live Stats & Activity" />
      </motion.div>
      <Card className="p-6"><p className="text-body-sm text-error text-center py-4">{error}</p></Card>
    </motion.section>
  );

  return (
    <motion.section ref={sectionRef} initial="hidden" animate="visible" variants={containerVariants} className="mb-10">
      <motion.div variants={itemVariants} className="flex items-center justify-between mb-5">
        <SectionLabel text="Live Stats & Activity" />
        <LiveIndicator />
      </motion.div>

      {/* Ticker row */}
      <motion.div variants={itemVariants} className="mb-4">
        <div className="grid grid-cols-3 gap-3">
          <StatTicker label="Total Views" value={analytics?.total_views || 0} icon={<TrendingUp className="w-4 h-4" />} color="bg-primary" />
          <StatTicker label="Today" value={analytics?.today_views || 0} icon={<Activity className="w-4 h-4" />} color="bg-tertiary" />
          <StatTicker label="Unique Visitors" value={analytics?.unique_visitors || 0} icon={<Eye className="w-4 h-4" />} color="bg-secondary" />
        </div>
      </motion.div>

      {/* Charts row — full width */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 gap-4 mb-4">
        <TrafficChart dailyViews={analytics?.daily_views || []} hourlyViews={analytics?.hourly_views || []} agents={analytics?.user_agents || []} />
      </motion.div>

      {/* GitHub row */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {githubUsername === null
          ? <Card className="p-6"><Skeleton className="h-40" /></Card>
          : githubUsername ? <GitHubStats username={githubUsername} /> : (
            <Card className="p-6 hover:bg-surface-container/50 transition-colors">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 rounded-full bg-secondary-container"><GitBranch className="w-5 h-5 text-secondary-container-foreground" /></div>
                <h3 className="text-title-sm font-semibold text-foreground">GitHub Activity</h3>
              </div>
              <div className="text-center py-6">
                <GitBranch className="w-10 h-10 mx-auto mb-3 text-muted-foreground/30" />
                <p className="text-body-sm text-muted-foreground mb-1">GitHub stats not configured</p>
                <p className="text-label-sm text-muted-foreground/60">Set <code className="bg-surface-variant px-1.5 py-0.5 rounded text-primary">github_username</code> in admin settings</p>
              </div>
            </Card>
          )}
        {githubUsername && <TopLanguages username={githubUsername} />}
      </motion.div>
    </motion.section>
  );
}
