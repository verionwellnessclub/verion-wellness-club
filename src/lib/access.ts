import type { SupabaseClient } from '@supabase/supabase-js';
import { createServiceClient } from '@/lib/supabase/server';

export type SubInfo = {
  active: boolean;
  coaching: boolean;
  planName: string | null;
  periodEnd: string | null;
  cancelAtEnd: boolean;
  customerId: string | null;
};

/** Estado de la suscripción del usuario actual (la RLS ya filtra a la suya). */
export async function getSubscription(supabase: SupabaseClient, userId: string): Promise<SubInfo> {
  const { data } = await supabase
    .from('subscriptions')
    .select('status, current_period_end, cancel_at_period_end, stripe_customer_id, plans(name, includes_coaching)')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false });
  const live = (data ?? []).find(
    (s) =>
      ['active', 'trialing', 'past_due'].includes(s.status) &&
      (!s.current_period_end || new Date(s.current_period_end).getTime() > Date.now() - 3 * 864e5)
  );
  const plan = live?.plans as unknown as { name: string; includes_coaching: boolean } | null;
  return {
    active: !!live,
    coaching: !!plan?.includes_coaching,
    planName: plan?.name ?? null,
    periodEnd: live?.current_period_end ?? null,
    cancelAtEnd: !!live?.cancel_at_period_end,
    customerId: live?.stripe_customer_id ?? data?.[0]?.stripe_customer_id ?? null,
  };
}

/** Enlaces firmados (1 h) para videos privados del bucket "videos". */
export async function signVideos(paths: string[]) {
  const unique = [...new Set(paths.filter(Boolean))];
  if (!unique.length) return {} as Record<string, string>;
  const { data } = await createServiceClient().storage.from('videos').createSignedUrls(unique, 3600);
  const out: Record<string, string> = {};
  (data ?? []).forEach((d) => {
    if (d.path && d.signedUrl) out[d.path] = d.signedUrl;
  });
  return out;
}
