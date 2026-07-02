import { useState, useEffect } from 'react';
import { Users, Shield, Key, Search } from 'lucide-react';
import { getSupabase } from '@/lib/supabase';
import { getStoredToken } from '@/lib/auth';
import { Button } from '@/components/ui/button';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SupabaseClient = any;

async function rpcCall(client: SupabaseClient, name: string, params?: Record<string, unknown>) {
  const { data, error } = await client.rpc(name, params);
  if (error) throw error;
  return data;
}

interface AppUser {
  id: string;
  email: string;
  display_name: string | null;
  avatar_url: string | null;
  provider: string;
  is_admin: boolean;
  created_at: string;
}

interface UserApiKey {
  id: string;
  name: string;
  key_prefix: string;
  rate_limit: number;
  is_active: boolean;
}

export function UserManagement() {
  const [users, setUsers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [editingUser, setEditingUser] = useState<string | null>(null);
  const [rateLimit, setRateLimit] = useState(100);
  const [userKeys, setUserKeys] = useState<Record<string, UserApiKey[]>>({});

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const token = getStoredToken();
      if (!token) return;
      const supabase = getSupabase();
      const data = await rpcCall(supabase, 'admin_list_users', { p_token: token });
      if (data?.users) setUsers(data.users);
    } catch (e) {
      console.error('Failed to fetch users:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  const fetchUserKeys = async (userId: string) => {
    try {
      const supabase = getSupabase();
      const data = await rpcCall(supabase, 'admin_get_user_keys', { p_user_id: userId });
      if (data?.keys) setUserKeys(prev => ({ ...prev, [userId]: data.keys }));
    } catch (e) {
      console.error('Failed to fetch user keys:', e);
    }
  };

  const toggleAdmin = async (userId: string, current: boolean) => {
    try {
      const supabase = getSupabase();
      await rpcCall(supabase, 'admin_toggle_user_admin', { p_user_id: userId, p_is_admin: !current });
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, is_admin: !current } : u));
    } catch (e) {
      console.error('Failed to toggle admin:', e);
    }
  };

  const updateUserRateLimit = async (userId: string, limit: number) => {
    try {
      const supabase = getSupabase();
      await rpcCall(supabase, 'admin_set_user_rate_limit', { p_user_id: userId, p_rate_limit: limit });
      setUserKeys(prev => ({
        ...prev,
        [userId]: (prev[userId] || []).map(k => ({ ...k, rate_limit: limit })),
      }));
    } catch (e) {
      console.error('Failed to update rate limit:', e);
    }
  };

  const filteredUsers = users.filter(u =>
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    (u.display_name || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Users className="w-5 h-5 text-primary" />
        <h3 className="text-base font-semibold text-on-surface">User Management</h3>
      </div>

      <div className="relative">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search users..."
          className="w-full pl-10 pr-4 py-2 text-sm rounded-xl border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
        />
      </div>

      {loading ? (
        <div className="text-center py-8 text-muted-foreground text-sm">Loading users...</div>
      ) : filteredUsers.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground text-sm">No users found</div>
      ) : (
        <div className="space-y-2">
          {filteredUsers.map((u) => (
            <div key={u.id} className="p-3 rounded-xl border border-border bg-surface-container space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <img
                    src={u.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(u.display_name || u.email)}&background=random`}
                    alt=""
                    className="w-8 h-8 rounded-full object-cover"
                  />
                  <div>
                    <p className="text-sm font-medium text-on-surface">{u.display_name || u.email}</p>
                    <p className="text-xs text-on-surface-variant">{u.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => toggleAdmin(u.id, u.is_admin)}
                    className={`p-1.5 rounded-lg transition-colors ${u.is_admin ? 'bg-primary/20 text-primary' : 'text-muted-foreground hover:bg-surface-variant'}`}
                    title={u.is_admin ? 'Remove admin' : 'Make admin'}
                  >
                    <Shield className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => {
                      if (editingUser === u.id) {
                        setEditingUser(null);
                      } else {
                        setEditingUser(u.id);
                        fetchUserKeys(u.id);
                      }
                    }}
                    className="p-1.5 rounded-lg text-muted-foreground hover:bg-surface-variant transition-colors"
                    title="Manage rate limit"
                  >
                    <Key className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {editingUser === u.id && userKeys[u.id] && (
                <div className="pl-11 space-y-2">
                  <p className="text-xs text-on-surface-variant font-medium">API Keys ({userKeys[u.id].length})</p>
                  {userKeys[u.id].length === 0 ? (
                    <p className="text-xs text-on-surface-variant">No API keys</p>
                  ) : (
                    userKeys[u.id].map((k) => (
                      <div key={k.id} className="flex items-center justify-between p-2 rounded-lg bg-background">
                        <span className="text-xs text-on-surface-variant">{k.key_prefix}... — {k.name}</span>
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            value={k.rate_limit}
                            onChange={(e) => {
                              const val = parseInt(e.target.value) || 0;
                              setUserKeys(prev => ({
                                ...prev,
                                [u.id]: (prev[u.id] || []).map(key => key.id === k.id ? { ...key, rate_limit: val } : key),
                              }));
                            }}
                            className="w-16 px-2 py-1 text-xs rounded border border-border bg-background text-foreground text-center"
                            min={0}
                          />
                          <Button
                            size="sm"
                            onClick={() => updateUserRateLimit(u.id, k.rate_limit)}
                            className="text-xs px-2 py-1"
                          >
                            Save
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
