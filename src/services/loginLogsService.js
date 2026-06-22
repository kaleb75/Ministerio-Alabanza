import { supabase } from '../lib/supabase';

export async function recordLogin(user) {
  await supabase.from('login_logs').insert({
    user_id:    user.id,
    user_email: user.email,
    user_name:  user.name,
  });
}

export async function getLoginSummary() {
  const { data, error } = await supabase
    .from('login_logs')
    .select('user_id, user_email, user_name, login_at')
    .order('login_at', { ascending: false });

  if (error || !data) return [];

  const map = new Map();
  for (const row of data) {
    if (!map.has(row.user_id)) {
      map.set(row.user_id, {
        user_id:    row.user_id,
        user_email: row.user_email,
        user_name:  row.user_name,
        last_login: row.login_at,
        count:      1,
      });
    } else {
      map.get(row.user_id).count++;
    }
  }

  return Array.from(map.values()).sort(
    (a, b) => new Date(b.last_login) - new Date(a.last_login)
  );
}

export async function getUserLoginHistory(userId) {
  const { data, error } = await supabase
    .from('login_logs')
    .select('login_at')
    .eq('user_id', userId)
    .order('login_at', { ascending: false })
    .limit(50);

  if (error) return [];
  return data ?? [];
}
