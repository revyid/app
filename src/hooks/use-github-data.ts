import useSWR from 'swr';

const GITHUB_USERNAME = 'revyid';

async function fetchGitHubContributions() {
  const res = await fetch(`/api/github?path=users/${GITHUB_USERNAME}/events&per_page=1`);
  if (!res.ok) return null;
  return res.json();
}

async function fetchGitHubRepos() {
  const res = await fetch(`/api/github?path=users/${GITHUB_USERNAME}/repos?sort=updated&per_page=10`);
  if (!res.ok) return [];
  return res.json();
}

export function useGitHubEvents() {
  const { data, error, isLoading, mutate } = useSWR(
    'github-events',
    fetchGitHubContributions,
    {
      revalidateOnFocus: false,
      dedupingInterval: 300000, // 5 minutes
      errorRetryCount: 2,
    }
  );

  return { data, error, isLoading, refresh: () => mutate() };
}

export function useGitHubRepos() {
  const { data, error, isLoading, mutate } = useSWR(
    'github-repos',
    fetchGitHubRepos,
    {
      revalidateOnFocus: false,
      dedupingInterval: 300000,
      errorRetryCount: 2,
    }
  );

  return { data, error, isLoading, refresh: () => mutate() };
}
