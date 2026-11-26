'use server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export type ActionState = { ok?: string; error?: string } | null;

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Sesión expirada');
  return { supabase, user };
}

const clean = (msg: string) => msg.replace(/^.*?: /, '');

/** Intenta sumar puntos del reto activo por una acción (si no está inscrito, no pasa nada). */
async function tryPoints(supabase: Awaited<ReturnType<typeof createClient>>, userId: string, code: string) {
  const { data: act } = await supabase
    .from('challenge_actions').select('id, points, challenges!inner(active)')
    .eq('code', code).eq('challenges.active', true).limit(1).maybeSingle();
  if (!act) return 0;
  const { error } = await supabase.from('points_log').insert({ user_id: userId, action_id: act.id });
  return error ? 0 : act.points;
}

// ---------------- Retos ----------------
export async function logActivity(_: ActionState, form: FormData): Promise<ActionState> {
  const { supabase, user } = await requireUser();
  const { error } = await supabase.from('points_log').insert({ user_id: user.id, action_id: String(form.get('action_id')) });
  revalidatePath('/app/retos');
  revalidatePath('/app');
  return error ? { error: clean(error.message) } : { ok: '¡Puntos sumados! 🔥' };
}

// ---------------- Entrenamiento ----------------
export async function addPR(_: ActionState, form: FormData): Promise<ActionState> {
  const { supabase, user } = await requireUser();
  const exercise = String(form.get('exercise') ?? '').trim();
  const weight = Number(form.get('weight_kg'));
  const reps = Number(form.get('reps'));
  if (!exercise || !(weight > 0) || !(reps > 0)) return { error: 'Completa ejercicio, peso y repeticiones' };
  const { error } = await supabase.from('prs').insert({ user_id: user.id, exercise, weight_kg: weight, reps });
  if (error) return { error: 'No se pudo guardar el PR' };
  const pts = await tryPoints(supabase, user.id, 'pr');
  revalidatePath('/app/progreso');
  return { ok: `🏆 PR guardado${pts ? ` · +${pts} pts en el reto` : ''}` };
}

export async function completeWorkout(_: ActionState, form: FormData): Promise<ActionState> {
  const { supabase, user } = await requireUser();
  const workoutId = String(form.get('workout_id'));
  const rpe = Number(form.get('rpe')) || null;
  const { error } = await supabase.from('workout_logs').insert({
    user_id: user.id,
    workout_id: workoutId,
    rpe,
    notes: String(form.get('notes') ?? '').slice(0, 500) || null,
  });
  if (error) return { error: 'No se pudo registrar' };
  const pts = await tryPoints(supabase, user.id, 'online');
  revalidatePath('/app/entrenar', 'layout');
  return { ok: `💪 ¡Sesión completada!${pts ? ` +${pts} pts en el reto` : ''}` };
}

export async function sendCoachMessage(_: ActionState, form: FormData): Promise<ActionState> {
  const { supabase, user } = await requireUser();
  const body = String(form.get('body') ?? '').trim();
  if (!body) return { error: 'Escribe tu mensaje' };
  const { error } = await supabase.from('coach_messages').insert({ client_id: user.id, author_id: user.id, body: body.slice(0, 2000) });
  revalidatePath('/app/coach');
  return error ? { error: 'Tu plan no incluye chat con coach o hubo un error' } : { ok: 'Enviado' };
}

// ---------------- Comunidad ----------------
export async function createPost(_: ActionState, form: FormData): Promise<ActionState> {
  const { supabase, user } = await requireUser();
  const body = String(form.get('body') ?? '').trim();
  if (!body) return { error: 'Escribe algo' };
  const { error } = await supabase.from('posts').insert({ user_id: user.id, body: body.slice(0, 500) });
  revalidatePath('/app');
  return error ? { error: 'No se pudo publicar' } : { ok: 'Publicado' };
}

// ---------------- Eventos ----------------
export async function rsvpEvent(_: ActionState, form: FormData): Promise<ActionState> {
  const { supabase, user } = await requireUser();
  const eventId = String(form.get('event_id'));
  const { error } = await supabase.from('event_tickets').insert({ event_id: eventId, user_id: user.id });
  revalidatePath('/app/eventos', 'layout');
  if (error) {
    if (error.code === '23505') return { error: 'Ya tienes tu lugar' };
    return { error: clean(error.message) || 'No se pudo apartar' };
  }
  return { ok: '🎟️ ¡Lugar apartado! Muestra tu QR al llegar.' };
}

// ---------------- Wellness ----------------
export async function requestAppointment(_: ActionState, form: FormData): Promise<ActionState> {
  const { supabase, user } = await requireUser();
  const date = String(form.get('date'));
  const time = String(form.get('time'));
  if (!date || !time) return { error: 'Elige día y hora' };
  const preferred = new Date(`${date}T${time}:00-06:00`);
  if (isNaN(preferred.getTime()) || preferred < new Date()) return { error: 'Elige una fecha futura' };
  const { error } = await supabase.from('appointments').insert({
    user_id: user.id,
    service_id: String(form.get('service_id')),
    preferred_at: preferred.toISOString(),
    notes: String(form.get('notes') ?? '').slice(0, 300) || null,
  });
  revalidatePath('/app/wellness');
  return error ? { error: 'No se pudo solicitar la cita' } : { ok: '📅 Solicitud enviada. Te confirmamos pronto.' };
}

// ---------------- Perfil ----------------
export async function updateProfile(_: ActionState, form: FormData): Promise<ActionState> {
  const { supabase, user } = await requireUser();
  const full_name = String(form.get('full_name') ?? '').trim();
  const schedule = form.get('schedule') === 'm' ? 'm' : 't';
  const { error } = await supabase.from('profiles').update({ full_name, schedule }).eq('id', user.id);
  revalidatePath('/app', 'layout');
  return error ? { error: 'No se pudo guardar' } : { ok: 'Perfil actualizado' };
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect('/');
}
