import { unstable_cache } from 'next/cache';

interface GitHubContributionsResponse {
  totalContributions: number;
  weeks: Array<{
    contributionDays: Array<{
      contributionCount: number;
      date: string;
    }>;
  }>;
}

const GITHUB_TOKENS: string[] = [];
for (let i = 1; i <= 5; i++) {
  const t = process.env[`GITHUB_TOKEN_${i}`];
  if (t) GITHUB_TOKENS.push(t);
}

function pickToken(): string | undefined {
  if (GITHUB_TOKENS.length === 0) return undefined;
  return GITHUB_TOKENS[Math.floor(Math.random() * GITHUB_TOKENS.length)];
}

export const getGitHubContributions = unstable_cache(
  async (username: string): Promise<GitHubContributionsResponse | null> => {
    try {
      const token = pickToken();
      const headers: Record<string, string> = {
        'Accept': 'application/vnd.github+json',
        'User-Agent': 'revy-portfolio',
        'Content-Type': 'application/json',
      };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const now = new Date();
      const startDate = new Date(now);
      startDate.setDate(startDate.getDate() - 365);

      const query = `
        query($username: String!, $start: DateTime!, $end: DateTime!) {
          user(login: $username) {
            contributionsCollection(from: $start, to: $end) {
              contributionCalendar {
                totalContributions
                weeks {
                  contributionDays {
                    contributionCount
                    date
                  }
                }
              }
            }
          }
        }
      `;

      const res = await fetch('https://api.github.com/graphql', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          query,
          variables: {
            username,
            start: startDate.toISOString(),
            end: now.toISOString(),
          },
        }),
      });

      if (!res.ok) {
        console.error(`[GitHub] GraphQL error: ${res.status}`);
        return null;
      }

      const json = await res.json();
      const calendar = json?.data?.user?.contributionsCollection?.contributionCalendar;
      if (!calendar) return null;

      return {
        totalContributions: calendar.totalContributions,
        weeks: calendar.weeks,
      };
    } catch (err) {
      console.error('[GitHub] Failed to fetch contributions:', err);
      return null;
    }
  },
  ['github-contributions'],
  { revalidate: 3600, tags: ['github'] }
);

export async function getGitHubRepos(username: string) {
  try {
    const token = pickToken();
    const headers: Record<string, string> = {
      'Accept': 'application/vnd.github+json',
      'User-Agent': 'revy-portfolio',
    };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`https://api.github.com/users/${username}/repos?sort=updated&per_page=10`, {
      headers,
      next: { revalidate: 3600, tags: ['github-repos'] },
    });

    if (!res.ok) return [];
    return await res.json();
  } catch (err) {
    console.error('[GitHub] Failed to fetch repos:', err);
    return [];
  }
}
