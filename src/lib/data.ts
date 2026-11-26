import type { SupabaseClient } from '@supabase/supabase-js';

export type Challenge = {
  id: string; slug: string; name: string; starts_on: string; ends_on: string;
  fee_mxn: number; prizes: { place: string; prize: string }[]; active: boolean;
};

export async function getActiveChallenge(supabase: SupabaseClient) {
  const { data } = await supabase
    .from('challenges').select('*').eq('active', true)
    .order('starts_on', { ascending: false }).limit(1).maybeSingle();
  return data as Challenge | null;
}

export async function getLeaderboard(supabase: SupabaseClient, challengeId: string) {
  const { data } = await supabase
    .from('leaderboard').select('user_id, full_name, schedule, points')
    .eq('challenge_id', challengeId).order('points', { ascending: false });
  return (data ?? []) as { user_id: string; full_name: string | null; schedule: 'm' | 't'; points: number }[];
}

export function challengeDay(c: Challenge) {
  const today = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Monterrey' }));
  const start = new Date(c.starts_on + 'T00:00:00');
  const end = new Date(c.ends_on + 'T00:00:00');
  const total = Math.round((end.getTime() - start.getTime()) / 864e5) + 1;
  const day = Math.floor((today.getTime() - start.getTime()) / 864e5) + 1;
  return { day: Math.max(0, Math.min(total, day)), total, started: day >= 1, finished: day > total };
}

export const mxn = (n: number) => '$' + n.toLocaleString('es-MX');

export function shortName(full: string | null) {
  if (!full) return 'Socio';
  const [a, b] = full.trim().split(/\s+/);
  return b ? `${a} ${b[0]}.` : a;
}

export function timeAgo(iso: string) {
  const s = (Date.now() - new Date(iso).getTime()) / 1000;
  if (s < 3600) return `hace ${Math.max(1, Math.round(s / 60))} min`;
  if (s < 86400) return `hace ${Math.round(s / 3600)} h`;
  return `hace ${Math.round(s / 86400)} d`;
}

const TZ = 'America/Monterrey';
export const fmtDateTime = (iso: string) =>
  new Date(iso).toLocaleString('es-MX', { timeZone: TZ, weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
export const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString('es-MX', { timeZone: TZ, day: 'numeric', month: 'long', year: 'numeric' });

export function slugify(s: string) {
  return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '').slice(0, 60);
}

export type EventRow = {
  id: string; slug: string; title: string; kind: string; description: string | null; starts_at: string;
  location: string | null; price_mxn: number; capacity: number | null; partner_name: string | null; emoji: string | null;
};
