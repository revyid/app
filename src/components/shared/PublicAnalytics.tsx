import { useState, useEffect } from 'react';
import { Eye, GitBranch, Star, GitFork, Activity, TrendingUp, Code } from 'lucide-react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { SectionLabel } from '@/components/shared/SectionLabel';
import { supabase } from '@/lib/supabase';
import { containerVariants, itemVariants, viewportOnce } from '@/lib/animations';
import { SPRING_BOUNCY } from '@/lib/motion-presets';

// ─── GitHub fetch via backend proxy ───────────────────────────────────
async function fetchGitHub(path: string): Promise<any> {
  const res = await fetch(`/api/github?path=${encodeURIComponent(path)}`);
  return res.json();
}

// ─── Shared card header ───────────────────────────────────────────────
function CardHeader({ icon, title, bg, iconColor }: { icon: React.ReactNode; title: string; bg: string; iconColor: string }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <div className={`p-3 rounded-full ${bg}`}>
        <div className={iconColor}>{icon}</div>
      </div>
      <h3 className="text-base font-semibold text-on-surface">{title}</h3>
    </div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────
function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse bg-surface-variant rounded-2xl ${className}`} />;
}

// ─── Site Traffic ─────────────────────────────────────────────────────
export function VisitorCounter() {
  const [stats, setStats] = useState({ total: 0, today: 0, unique: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.resolve(supabase.rpc('get_public_analytics'))
      .then(({ data }) => {
        if (data) setStats({ total: data.total_views || 0, today: data.today_views || 0, unique: data.unique_visitors || 0 });
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <Card className="p-6"><Skeleton className="h-28" /></Card>;

  return (
    <Card className="p-6 hover:bg-surface-container/50 transition-colors">
      <CardHeader icon={<Eye className="w-5 h-5" />} title="Site Traffic" bg="bg-primary-container" iconColor="text-on-primary-container" />
      <div className="grid grid-cols-3 gap-3">
        {[['Total', stats.total], ['Today', stats.today], ['Unique', stats.unique]].map(([label, val]) => (
          <motion.div key={label as string} whileHover={{ scale: 1.03 }} transition={SPRING_BOUNCY}
            className="text-center p-4 rounded-2xl bg-surface-variant">
            <div className="text-2xl font-bold text-on-surface">{(val as number).toLocaleString()}</div>
            <div className="text-xs text-on-surface-variant mt-1">{label}</div>
          </motion.div>
        ))}
      </div>
    </Card>
  );
}

// ─── Visitor Platforms ────────────────────────────────────────────────
export function PlatformStats() {
  const [platforms, setPlatforms] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    Promise.resolve(supabase.rpc('get_public_analytics')).then(({ data }) => {
      const count: Record<string, number> = {};
      (data?.user_agents || []).forEach((ua: string) => {
        let p = 'Unknown';
        
        // Simplified OS detection - group by family
        if (ua.includes('Windows')) p = 'Windows';
        else if (ua.includes('Mac OS') || ua.includes('Macintosh')) p = 'macOS';
        else if (ua.includes('Android')) p = 'Android';
        else if (ua.includes('iPhone') || ua.includes('iPad') || ua.includes('iOS')) p = 'iOS';
        else if (ua.includes('CrOS')) p = 'Chrome OS';
        else if (ua.includes('Ubuntu')) p = 'Ubuntu';
        else if (ua.includes('Fedora')) p = 'Fedora';
        else if (ua.includes('Debian')) p = 'Debian';
        else if (ua.includes('Arch')) p = 'Arch Linux';
        else if (ua.includes('CentOS')) p = 'CentOS';
        else if (ua.includes('Red Hat')) p = 'Red Hat';
        else if (ua.includes('Linux')) p = 'Linux';
        else if (ua.includes('FreeBSD')) p = 'FreeBSD';
        else if (ua.includes('OpenBSD')) p = 'OpenBSD';
        else if (ua.includes('NetBSD')) p = 'NetBSD';
        else if (ua.includes('SunOS')) p = 'Solaris';
        else {
          // Try to extract meaningful OS info from UA
          // Skip common non-OS patterns
          const skipPatterns = ['rv:', 'KHTML', 'Gecko', 'AppleWebKit', 'Chrome', 'Safari', 'Firefox', 'Edge', 'compatible'];
          const osMatch = ua.match(/\(([^)]+)\)/);
          if (osMatch) {
            const parts = osMatch[1].split(';').map(s => s.trim());
            for (const part of parts) {
              if (!skipPatterns.some(skip => part.includes(skip)) && part.length > 2 && part.length < 40) {
                p = part;
                break;
              }
            }
          }
        }
        
        count[p] = (count[p] || 0) + 1;
      });
      setPlatforms(count);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  if (loading) return <Card className="p-6"><Skeleton className="h-24" /></Card>;

  const sorted = Object.entries(platforms).sort(([, a], [, b]) => b - a);
  const total = sorted.reduce((s, [, c]) => s + c, 0);
  const displayed = showAll ? sorted : sorted.slice(0, 6);
  const hasMore = sorted.length > 6;

  return (
    <Card className="p-6 hover:bg-surface-container/50 transition-colors">
      <CardHeader icon={<Activity className="w-5 h-5" />} title="Visitor Platforms" bg="bg-primary-container" iconColor="text-on-primary-container" />
      {total === 0 ? (
        <p className="text-sm text-on-surface-variant text-center py-4">No data yet</p>
      ) : (
        <>
          <div className="space-y-3">
            {displayed.map(([platform, count]) => (
              <div key={platform}>
                <div className="flex justify-between text-sm mb-1.5">
                  <span className="font-medium text-on-surface truncate">{platform} <span className="text-on-surface-variant text-xs">({count})</span></span>
                  <span className="text-on-surface font-medium shrink-0 ml-2">{Math.round((count / total) * 100)}%</span>
                </div>
                <div className="h-2 bg-surface-variant rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    whileInView={{ width: `${(count / total) * 100}%` }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, ease: 'easeOut' }}
                    className="h-full bg-primary rounded-full"
                  />
                </div>
              </div>
            ))}
          </div>
          {hasMore && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowAll(!showAll)}
              className="w-full mt-3 py-2 text-xs font-medium text-primary hover:text-primary/80 transition-colors"
            >
              {showAll ? 'Show Less' : `Show ${sorted.length - 6} More`}
            </motion.button>
          )}
        </>
      )}
    </Card>
  );
}

// ─── GitHub Stats ─────────────────────────────────────────────────────
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

  if (loading) return <Card className="p-6"><Skeleton className="h-28" /></Card>;

  if (error) return (
    <Card className="p-6">
      <CardHeader icon={<GitBranch className="w-5 h-5" />} title="GitHub Activity" bg="bg-secondary-container" iconColor="text-on-secondary-container" />
      <p className="text-sm text-on-surface-variant">{error.includes('rate limit') ? 'Rate limit reached. Try again later.' : error}</p>
    </Card>
  );
  if (!stats) return null;

  const totalStars = repos.reduce((s, r) => s + (r.stargazers_count || 0), 0);

  return (
    <Card className="p-6 hover:bg-surface-container/50 transition-colors">
      <CardHeader icon={<GitBranch className="w-5 h-5" />} title="GitHub Activity" bg="bg-secondary-container" iconColor="text-on-secondary-container" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        {[['Repos', stats.public_repos], ['Stars', totalStars], ['Followers', stats.followers], ['Following', stats.following]].map(([label, val]) => (
          <motion.div key={label as string} whileHover={{ scale: 1.03 }} transition={SPRING_BOUNCY}
            className="text-center p-4 rounded-2xl bg-surface-variant">
            <div className="text-2xl font-bold text-on-surface">{val ?? 0}</div>
            <div className="text-xs text-on-surface-variant mt-1">{label}</div>
          </motion.div>
        ))}
      </div>
      {repos.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-on-surface-variant mb-2">Recent Repos</p>
          {repos.slice(0, 3).map(repo => (
            <motion.a key={repo.id} href={repo.html_url} target="_blank" rel="noopener noreferrer"
              whileHover={{ x: 4 }} transition={SPRING_BOUNCY}
              className="flex items-center justify-between text-xs p-3 rounded-xl bg-surface-variant hover:bg-surface-container-high transition-colors">
              <span className="truncate flex-1 text-on-surface font-medium">{repo.name}</span>
              <div className="flex items-center gap-3 ml-3 shrink-0 text-on-surface">
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

// ─── Top Languages ────────────────────────────────────────────────────
export function TopLanguages({ username }: { username: string }) {
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

  if (loading) return <Card className="p-6"><Skeleton className="h-32" /></Card>;

  const sorted = Object.entries(languages).sort(([, a], [, b]) => b - a).slice(0, 5);
  const total = sorted.reduce((s, [, c]) => s + c, 0);

  return (
    <Card className="p-6 hover:bg-surface-container/50 transition-colors">
      <CardHeader icon={<Code className="w-5 h-5" />} title="Top Languages" bg="bg-tertiary-container" iconColor="text-on-tertiary-container" />
      {sorted.length === 0 ? <p className="text-sm text-on-surface-variant text-center py-4">No data yet</p> : (
        <div className="space-y-3">
          {sorted.map(([lang, count]) => (
            <div key={lang}>
              <div className="flex justify-between text-sm mb-1.5">
                <span className="font-medium text-on-surface">{lang}</span>
                <span className="font-medium text-on-surface">{Math.round((count / total) * 100)}%</span>
              </div>
              <div className="h-2 bg-surface-variant rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  whileInView={{ width: `${(count / total) * 100}%` }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, ease: 'easeOut' }}
                  className="h-full bg-tertiary rounded-full"
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

// ─── Top Projects ─────────────────────────────────────────────────────
export function TrendingProjects({ username }: { username: string }) {
  const [repos, setRepos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchGitHub(`users/${username}/repos?sort=stars&per_page=3`)
      .then(data => setRepos(Array.isArray(data) ? data : []))
      .finally(() => setLoading(false));
  }, [username]);

  if (loading) return <Card className="p-6"><Skeleton className="h-40" /></Card>;
  if (repos.length === 0) return null;

  return (
    <Card className="p-6 hover:bg-surface-container/50 transition-colors">
      <CardHeader icon={<TrendingUp className="w-5 h-5" />} title="Top Projects" bg="bg-secondary-container" iconColor="text-on-secondary-container" />
      <div className="space-y-3">
        {repos.map(repo => (
          <motion.a key={repo.id} href={repo.html_url} target="_blank" rel="noopener noreferrer"
            whileHover={{ y: -2 }} whileTap={{ scale: 0.98 }} transition={SPRING_BOUNCY}
            className="block p-4 rounded-2xl bg-surface-variant hover:bg-surface-container-high transition-colors">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm text-on-surface truncate">{repo.name}</div>
                <div className="text-xs text-on-surface opacity-60 line-clamp-1 mt-0.5">{repo.description || 'No description'}</div>
              </div>
              <div className="flex items-center gap-3 text-xs text-on-surface shrink-0">
                <span className="flex items-center gap-1"><Star className="w-3.5 h-3.5 text-yellow-500" />{repo.stargazers_count}</span>
                <span className="flex items-center gap-1"><GitFork className="w-3.5 h-3.5" />{repo.forks_count}</span>
              </div>
            </div>
          </motion.a>
        ))}
      </div>
    </Card>
  );
}

// ─── Live Indicator ───────────────────────────────────────────────────
function LiveActivity() {
  const [pulse, setPulse] = useState(true);
  useEffect(() => {
    const t = setInterval(() => setPulse(p => !p), 2000);
    return () => clearInterval(t);
  }, []);
  return (
    <div className="flex items-center gap-2 text-sm text-on-surface-variant">
      <motion.div animate={{ scale: pulse ? [1, 1.4, 1] : 1 }} transition={{ duration: 0.6 }}
        className="w-2 h-2 rounded-full bg-green-500" />
      Live
    </div>
  );
}

// ─── Main Section ─────────────────────────────────────────────────────
export function PublicAnalytics() {
  const [githubUsername, setGithubUsername] = useState<string | null>(null);

  useEffect(() => {
    import('@/lib/auth').then(({ getSiteSetting }) => {
      getSiteSetting('github_username')
        .then(u => setGithubUsername(u || ''))
        .catch(() => setGithubUsername(''));
    });
  }, []);

  return (
    <motion.section
      initial="hidden"
      whileInView="visible"
      viewport={viewportOnce}
      variants={containerVariants}
      className="mb-10"
    >
      <motion.div variants={itemVariants} className="flex items-center justify-between mb-5">
        <SectionLabel text="Live Stats & Activity" />
        <LiveActivity />
      </motion.div>

      <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        <VisitorCounter />
        {githubUsername === null
          ? <Card className="p-6"><Skeleton className="h-28" /></Card>
          : githubUsername ? <GitHubStats username={githubUsername} /> : null}
      </motion.div>

      <motion.div variants={itemVariants} className="mb-4">
        <PlatformStats />
      </motion.div>

      {githubUsername === null ? (
        <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card className="p-6"><Skeleton className="h-40" /></Card>
          <Card className="p-6"><Skeleton className="h-40" /></Card>
        </motion.div>
      ) : githubUsername ? (
        <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <TopLanguages username={githubUsername} />
          <TrendingProjects username={githubUsername} />
        </motion.div>
      ) : null}
    </motion.section>
  );
}
