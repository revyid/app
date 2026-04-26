import { useState, useEffect } from 'react';
import { Eye, GitBranch, Star, GitFork, Activity, TrendingUp, Code } from 'lucide-react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { SectionLabel } from '@/components/shared/SectionLabel';
import { supabase } from '@/lib/supabase';
import { containerVariants, itemVariants, viewportOnce } from '@/lib/animations';

// OS/Platform Statistics
export function PlatformStats() {
  const [platforms, setPlatforms] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPlatforms = async () => {
      try {
        const { data } = await supabase.rpc('get_public_analytics');
        const platformCount: Record<string, number> = {};
        (data?.user_agents || []).forEach((ua: string) => {
          let platform = 'Unknown';
          if (ua.includes('Windows')) platform = 'Windows';
          else if (ua.includes('Mac OS') || ua.includes('Macintosh')) platform = 'macOS';
          else if (ua.includes('Linux') && !ua.includes('Android')) platform = 'Linux';
          else if (ua.includes('Android')) platform = 'Android';
          else if (ua.includes('iPhone') || ua.includes('iPad')) platform = 'iOS';
          else if (ua.includes('CrOS')) platform = 'Chrome OS';
          platformCount[platform] = (platformCount[platform] || 0) + 1;
        });
        setPlatforms(platformCount);
      } catch (error) {
        console.error('Failed to fetch platform stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPlatforms();
  }, []);

  if (loading) {
    return (
      <Card className="p-6 bg-surface-container">
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-surface-variant rounded w-32" />
          <div className="h-24 bg-surface-variant rounded-2xl" />
        </div>
      </Card>
    );
  }

  const sortedPlatforms = Object.entries(platforms)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 6);

  const total = sortedPlatforms.reduce((sum, [, count]) => sum + count, 0);

  if (total === 0) return (
    <Card className="p-6 bg-surface-container">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-3 rounded-full bg-primary-container">
          <Activity className="w-5 h-5 text-on-primary-container" />
        </div>
        <h3 className="text-lg font-medium text-on-surface">Visitor Platforms</h3>
      </div>
      <p className="text-sm text-on-surface-variant text-center py-4">No platform data yet</p>
    </Card>
  );

  return (
    <Card className="p-6 bg-surface-container hover:bg-surface-container-high transition-colors">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-3 rounded-full bg-primary-container">
          <Activity className="w-5 h-5 text-on-primary-container" />
        </div>
        <h3 className="text-lg font-medium text-on-surface">Visitor Platforms</h3>
      </div>
      <div className="space-y-3">
        {sortedPlatforms.map(([platform, count]) => (
          <div key={platform}>
            <div className="flex items-center justify-between text-sm mb-2">
              <div className="flex items-center gap-2">
                <span className="font-medium text-on-surface">{platform}</span>
                <span className="text-xs text-on-surface-variant">({count})</span>
              </div>
              <span className="text-on-surface-variant font-medium">{Math.round((count / total) * 100)}%</span>
            </div>
            <div className="h-2 bg-surface-variant rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary rounded-full transition-all duration-500"
                style={{ width: `${(count / total) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

// Real-time Visitor Counter from Database
export function VisitorCounter() {
  const [stats, setStats] = useState({ total: 0, today: 0, unique: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { data } = await supabase.rpc('get_public_analytics');
        if (data) {
          setStats({
            total: data.total_views || 0,
            today: data.today_views || 0,
            unique: data.unique_visitors || 0,
          });
        }
      } catch (error) {
        console.error('Failed to fetch visitor stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <Card className="p-6 bg-surface-container">
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-surface-variant rounded w-24" />
          <div className="h-8 bg-surface-variant rounded w-32" />
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6 bg-surface-container hover:bg-surface-container-high transition-colors">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-3 rounded-full bg-primary-container">
          <Eye className="w-5 h-5 text-on-primary-container" />
        </div>
        <h3 className="text-lg font-medium text-on-surface">Site Traffic</h3>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div className="text-center p-4 rounded-2xl bg-surface-variant">
          <div className="text-2xl md:text-3xl font-bold text-on-surface">{stats.total.toLocaleString()}</div>
          <div className="text-xs md:text-sm text-on-surface-variant mt-1">Total</div>
        </div>
        <div className="text-center p-4 rounded-2xl bg-surface-variant">
          <div className="text-2xl md:text-3xl font-bold text-on-surface">{stats.today.toLocaleString()}</div>
          <div className="text-xs md:text-sm text-on-surface-variant mt-1">Today</div>
        </div>
        <div className="text-center p-4 rounded-2xl bg-surface-variant">
          <div className="text-2xl md:text-3xl font-bold text-on-surface">{stats.unique.toLocaleString()}</div>
          <div className="text-xs md:text-sm text-on-surface-variant mt-1">Unique</div>
        </div>
      </div>
    </Card>
  );
}

// GitHub fetch with ungh.cc fallback when rate limited
async function fetchGitHub(path: string): Promise<any> {
  try {
    const ghRes = await fetch(`https://api.github.com/${path}`);
    const ghData = await ghRes.json();
    if (!ghData.message) return ghData;
  } catch { /* fall through */ }

  // Fallback to ungh.cc — different URL structure and response shape
  // GitHub: users/{name}         → ungh: users/{name}         → { user: {...} }
  // GitHub: users/{name}/repos   → ungh: users/{name}/repos   → { repos: [{id,name,description,stars,forks,defaultBranch}] }
  const unghPath = path.replace(/^users\/([^/]+)$/, 'users/$1')
                       .replace(/^users\/([^/]+)\/repos.*/, 'users/$1/repos');
  const res = await fetch(`https://ungh.cc/${unghPath}`);
  const data = await res.json();

  // Normalize user object
  if (data.user) {
    return {
      public_repos: data.user.publicRepos ?? 0,
      followers: data.user.followers ?? 0,
      following: data.user.following ?? 0,
      ...data.user,
    };
  }

  // Normalize repos array
  if (data.repos) {
    return data.repos.map((r: any) => ({
      id: r.id,
      name: r.name,
      description: r.description,
      html_url: `https://github.com/${r.repo ?? r.name}`,
      stargazers_count: r.stars ?? 0,
      forks_count: r.forks ?? 0,
      language: r.language ?? null,
    }));
  }

  return data;
}

// GitHub Stats Component with more details
export function GitHubStats({ username }: { username: string }) {
  const [stats, setStats] = useState<any>(null);
  const [repos, setRepos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = () => {
      Promise.all([
        fetchGitHub(`users/${username}`),
        fetchGitHub(`users/${username}/repos?sort=updated&per_page=5`)
      ])
        .then(([userData, reposData]) => {
          if (userData.message) {
            setError(userData.message);
          } else {
            setStats(userData);
            setRepos(Array.isArray(reposData) ? reposData : []);
            setError('');
          }
          setLoading(false);
        })
        .catch(() => { setError('Failed to fetch'); setLoading(false); });
    };

    fetchData();
    const interval = setInterval(fetchData, 60000);
    return () => clearInterval(interval);
  }, [username]);

  if (loading) {
    return (
      <Card className="p-6 bg-surface-container">
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-surface-variant rounded w-32" />
          <div className="grid grid-cols-4 gap-2">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-16 bg-surface-variant rounded-2xl" />
            ))}
          </div>
        </div>
      </Card>
    );
  }
  if (error) return (
    <Card className="p-6 bg-surface-container">
      <div className="flex items-center gap-3 mb-2">
        <div className="p-3 rounded-full bg-secondary-container">
          <GitBranch className="w-5 h-5 text-on-secondary-container" />
        </div>
        <h3 className="text-lg font-medium text-on-surface">GitHub Activity</h3>
      </div>
      <p className="text-sm text-on-surface-variant">{error.includes('rate limit') ? 'GitHub API rate limit reached. Try again later.' : error}</p>
    </Card>
  );
  if (!stats) return null;

  const totalStars = repos.reduce((sum, repo) => sum + (repo.stargazers_count || 0), 0);

  return (
    <Card className="p-6 bg-surface-container hover:bg-surface-container-high transition-colors">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-3 rounded-full bg-secondary-container">
          <GitBranch className="w-5 h-5 text-on-secondary-container" />
        </div>
        <h3 className="text-lg font-medium text-on-surface">GitHub Activity</h3>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <div className="text-center p-4 rounded-2xl bg-surface-variant">
          <div className="text-2xl md:text-3xl font-bold text-on-surface">{stats.public_repos}</div>
          <div className="text-xs md:text-sm text-on-surface-variant mt-1">Repos</div>
        </div>
        <div className="text-center p-4 rounded-2xl bg-surface-variant">
          <div className="text-2xl md:text-3xl font-bold text-on-surface">{totalStars}</div>
          <div className="text-xs md:text-sm text-on-surface-variant mt-1">Stars</div>
        </div>
        <div className="text-center p-4 rounded-2xl bg-surface-variant">
          <div className="text-2xl md:text-3xl font-bold text-on-surface">{stats.followers}</div>
          <div className="text-xs md:text-sm text-on-surface-variant mt-1">Followers</div>
        </div>
        <div className="text-center p-4 rounded-2xl bg-surface-variant">
          <div className="text-2xl md:text-3xl font-bold text-on-surface">{stats.following}</div>
          <div className="text-xs md:text-sm text-on-surface-variant mt-1">Following</div>
        </div>
      </div>
      {repos.length > 0 && (
        <div className="space-y-2">
          <div className="text-xs font-medium text-on-surface-variant mb-2">Recent Repos</div>
          {repos.slice(0, 3).map(repo => (
            <div key={repo.id} className="flex items-center justify-between text-xs p-3 rounded-xl bg-surface-variant hover:bg-surface-variant/80 transition-colors">
              <span className="truncate flex-1 text-on-surface font-medium">{repo.name}</span>
              <div className="flex items-center gap-3 ml-3 shrink-0">
                <span className="flex items-center gap-1 text-on-surface-variant">
                  <Star className="w-3 h-3 text-yellow-600" />
                  {repo.stargazers_count}
                </span>
                <span className="flex items-center gap-1 text-on-surface-variant">
                  <GitFork className="w-3 h-3" />
                  {repo.forks_count}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

// Live Activity Indicator
export function LiveActivity() {
  const [online, setOnline] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => {
      setOnline(prev => !prev);
      setLastUpdate(new Date());
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex items-center gap-2 text-sm">
      <div className={`w-2 h-2 rounded-full ${online ? 'bg-green-500 animate-pulse' : 'bg-muted'}`} />
      <span className="text-muted-foreground">
        {online ? 'Live' : 'Updating...'}
        <span className="text-xs ml-1">
          {lastUpdate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
        </span>
      </span>
    </div>
  );
}

// Top Languages from GitHub
export function TopLanguages({ username }: { username: string }) {
  const [languages, setLanguages] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLangs = () => {
      fetchGitHub(`users/${username}/repos?per_page=100`)
        .then((repos: any[]) => {
          if (!Array.isArray(repos)) { setLoading(false); return; }
          const langCount: Record<string, number> = {};
          repos.forEach(repo => {
            if (repo.language) langCount[repo.language] = (langCount[repo.language] || 0) + 1;
          });
          setLanguages(langCount);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    };

    fetchLangs();
    const interval = setInterval(fetchLangs, 300000); // Refresh every 5 minutes
    return () => clearInterval(interval);
  }, [username]);

  if (loading) return <Card className="p-6 bg-surface-container animate-pulse"><div className="h-32 bg-surface-variant rounded-2xl" /></Card>;

  const sortedLangs = Object.entries(languages)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);

  const total = sortedLangs.reduce((sum, [, count]) => sum + count, 0);

  return (
    <Card className="p-6 bg-surface-container hover:bg-surface-container-high transition-colors">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-3 rounded-full bg-tertiary-container">
          <Code className="w-5 h-5 text-on-tertiary-container" />
        </div>
        <h3 className="text-lg font-medium text-on-surface">Top Languages</h3>
      </div>
      <div className="space-y-3">
        {sortedLangs.map(([lang, count]) => (
          <div key={lang}>
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="font-medium text-on-surface">{lang}</span>
              <span className="text-on-surface font-medium">{Math.round((count / total) * 100)}%</span>
            </div>
            <div className="h-2 bg-surface-variant rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary rounded-full transition-all duration-500"
                style={{ width: `${(count / total) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

// Trending Projects
export function TrendingProjects({ username }: { username: string }) {
  const [repos, setRepos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRepos = () => {
      fetchGitHub(`users/${username}/repos?sort=stars&per_page=3`)
        .then(data => {
          setRepos(Array.isArray(data) ? data : []);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    };
    fetchRepos();
    const interval = setInterval(fetchRepos, 300000); // Refresh every 5 minutes
    return () => clearInterval(interval);
  }, [username]);

  if (loading) return <Card className="p-6 bg-surface-container animate-pulse"><div className="h-40 bg-surface-variant rounded-2xl" /></Card>;
  if (repos.length === 0) return null;

  return (
    <Card className="p-6 bg-surface-container hover:bg-surface-container-high transition-colors">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-3 rounded-full bg-error-container">
          <TrendingUp className="w-5 h-5 text-on-error-container" />
        </div>
        <h3 className="text-lg font-medium text-on-surface">Top Projects</h3>
      </div>
      <div className="space-y-3">
        {repos.map(repo => (
          <a
            key={repo.id}
            href={repo.html_url}
            target="_blank"
            rel="noopener noreferrer"
            className="block p-4 rounded-2xl bg-surface-variant hover:bg-surface-container-high transition-all hover:shadow-md"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm md:text-base text-on-surface truncate">{repo.name}</div>
                <div className="text-xs md:text-sm text-on-surface line-clamp-2 mt-1 opacity-70">{repo.description || 'No description'}</div>
              </div>
              <div className="flex items-center gap-3 text-xs md:text-sm shrink-0">
                <span className="flex items-center gap-1 text-on-surface">
                  <Star className="w-4 h-4 text-yellow-500" />
                  {repo.stargazers_count}
                </span>
                <span className="flex items-center gap-1 text-on-surface">
                  <GitFork className="w-4 h-4" />
                  {repo.forks_count}
                </span>
              </div>
            </div>
          </a>
        ))}
      </div>
    </Card>
  );
}

// Repository Stats Component
export function RepoStats({ username, repo }: { username: string; repo: string }) {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`https://api.github.com/repos/${username}/${repo}`)
      .then(res => res.json())
      .then(data => {
        setStats(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [username, repo]);

  if (loading) return <div className="animate-pulse h-16 bg-muted rounded" />;
  if (!stats) return null;

  return (
    <div className="flex items-center gap-4 text-sm">
      <div className="flex items-center gap-1">
        <Star className="w-4 h-4 text-yellow-500" />
        <span className="font-medium">{stats.stargazers_count}</span>
      </div>
      <div className="flex items-center gap-1">
        <GitFork className="w-4 h-4 text-primary" />
        <span className="font-medium">{stats.forks_count}</span>
      </div>
      <div className="flex items-center gap-1">
        <Activity className="w-4 h-4 text-green-500" />
        <span className="font-medium">{stats.open_issues_count}</span>
      </div>
    </div>
  );
}

// Contribution Graph (simplified)
export function ContributionGraph({ username }: { username: string }) {
  const [contributions, setContributions] = useState<number[]>([]);

  useEffect(() => {
    // Simulate contribution data - replace with actual GitHub API
    const data = Array.from({ length: 52 }, () => Math.floor(Math.random() * 20));
    setContributions(data);
  }, [username]);

  const maxContrib = Math.max(...contributions, 1);

  return (
    <Card className="p-4">
      <h3 className="text-sm font-semibold mb-3">Contribution Activity</h3>
      <div className="flex gap-1 flex-wrap">
        {contributions.map((count, idx) => (
          <div
            key={idx}
            className="w-3 h-3 rounded-sm"
            style={{
              backgroundColor: count === 0 ? 'var(--muted)' : `rgba(var(--primary-rgb), ${count / maxContrib})`,
            }}
            title={`${count} contributions`}
          />
        ))}
      </div>
    </Card>
  );
}

// Real-time Stats Dashboard (Public)
export function PublicAnalytics() {
  const [githubUsername, setGithubUsername] = useState<string | null>(null); // null = loading

  useEffect(() => {
    import('@/lib/auth').then(({ getSiteSetting }) => {
      getSiteSetting('github_username')
        .then(username => setGithubUsername(username || ''))
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
      <motion.div variants={itemVariants}>
        <SectionLabel text="Live Stats & Activity" />
      </motion.div>

      <motion.div variants={itemVariants} className="flex items-center justify-between mb-4">
        <p className="text-sm text-on-surface-variant">Real-time analytics</p>
        <LiveActivity />
      </motion.div>

      {/* Main Stats Grid */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 mb-4 md:mb-6">
        <VisitorCounter />
        {githubUsername === null ? (
          <Card className="p-6 bg-surface-container animate-pulse"><div className="h-32 bg-surface-variant rounded-2xl" /></Card>
        ) : githubUsername ? (
          <GitHubStats username={githubUsername} />
        ) : null}
      </motion.div>

      {/* Platform Stats */}
      <motion.div variants={itemVariants} className="mb-4 md:mb-6">
        <PlatformStats />
      </motion.div>

      {/* Secondary Stats */}
      {githubUsername === null ? (
        <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
          <Card className="p-6 bg-surface-container animate-pulse"><div className="h-40 bg-surface-variant rounded-2xl" /></Card>
          <Card className="p-6 bg-surface-container animate-pulse"><div className="h-40 bg-surface-variant rounded-2xl" /></Card>
        </motion.div>
      ) : githubUsername ? (
        <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
          <TopLanguages username={githubUsername} />
          <TrendingProjects username={githubUsername} />
        </motion.div>
      ) : null}
    </motion.section>
  );
}
