'use server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { slugify } from '@/lib/data';
import type { ActionState } from '../app/actions';

type SB = Awaited<ReturnType<typeof createClient>>;

async function staff() {
  const supabase = await createClient();
  const { data: role } = await supabase.rpc('my_role');
  if (role !== 'admin' && role !== 'coach') throw new Error('Sin permiso');
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, uid: user!.id };
}

const str = (f: FormData, k: string) => String(f.get(k) ?? '').trim();
const num = (f: FormData, k: string) => (f.get(k) === '' || f.get(k) == null ? null : Number(f.get(k)));
const clean = (m: string) => m.replace(/^.*?: /, '');

async function userIdByEmail(supabase: SB, email: string) {
  const { data } = await supabase.from('profiles').select('id').ilike('email', email.trim()).maybeSingle();
  return data?.id as string | undefined;
}

// ======================= Resumen / operación =======================
export async function enrollByEmail(_: ActionState, form: FormData): Promise<ActionState> {
  const { supabase } = await staff();
  const id = await userIdByEmail(supabase, str(form, 'email'));
  if (!id) return { error: 'No encontré ese correo. La persona debe crear su cuenta primero.' };
  const { error } = await supabase.from('challenge_entries').upsert({ challenge_id: str(form, 'challenge_id'), user_id: id, paid: true });
  revalidatePath('/admin');
  return error ? { error: error.message } : { ok: 'Inscrito ✅' };
}

export async function awardPoints(_: ActionState, form: FormData): Promise<ActionState> {
  const { supabase } = await staff();
  const id = await userIdByEmail(supabase, str(form, 'email'));
  if (!id) return { error: 'No encontré ese correo' };
  const { error } = await supabase.from('points_log').insert({ user_id: id, action_id: str(form, 'action_id') });
  revalidatePath('/admin');
  return error ? { error: clean(error.message) } : { ok: 'Puntos otorgados ✅' };
}

export async function setAppointmentStatus(form: FormData) {
  const { supabase } = await staff();
  await supabase.from('appointments').update({ status: str(form, 'status') }).eq('id', str(form, 'id'));
  revalidatePath('/admin');
}
export async function setOrderStatus(form: FormData) {
  const { supabase } = await staff();
  await supabase.from('orders').update({ status: str(form, 'status') }).eq('id', str(form, 'id'));
  revalidatePath('/admin');
}
export async function deletePoints(form: FormData) {
  const { supabase } = await staff();
  await supabase.from('points_log').delete().eq('id', str(form, 'id'));
  revalidatePath('/admin');
}

// ======================= Ejercicios / videos =======================
export async function createExercise(_: ActionState, form: FormData): Promise<ActionState> {
  const { supabase } = await staff();
  const name = str(form, 'name');
  if (!name) return { error: 'Ponle nombre al ejercicio' };
  const { error } = await supabase.from('exercises').insert({
    name,
    description: str(form, 'description') || null,
    muscle_group: str(form, 'muscle_group') || null,
    equipment: str(form, 'equipment') || null,
    video_path: str(form, 'video_path') || null,
    video_url: str(form, 'video_url') || null,
  });
  revalidatePath('/admin/ejercicios');
  return error ? { error: error.message } : { ok: `“${name}” agregado ✅` };
}

export async function deleteExercise(form: FormData) {
  const { supabase } = await staff();
  const id = str(form, 'id');
  const { data: ex } = await supabase.from('exercises').select('video_path').eq('id', id).single();
  const { error } = await supabase.from('exercises').delete().eq('id', id);
  if (!error && ex?.video_path) await supabase.storage.from('videos').remove([ex.video_path]);
  revalidatePath('/admin/ejercicios');
}

// ======================= Programas =======================
export async function createProgram(_: ActionState, form: FormData): Promise<ActionState> {
  const { supabase, uid } = await staff();
  const title = str(form, 'title');
  if (!title) return { error: 'Falta el título' };
  const assignEmail = str(form, 'assign_email');
  let assigned_to: string | null = null;
  if (assignEmail) {
    assigned_to = (await userIdByEmail(supabase, assignEmail)) ?? null;
    if (!assigned_to) return { error: 'No encontré a ese cliente' };
  }
  const { data, error } = await supabase.from('programs').insert({
    title,
    description: str(form, 'description') || null,
    level: str(form, 'level') || 'Principiante',
    goal: str(form, 'goal') || null,
    weeks: num(form, 'weeks') ?? 4,
    emoji: str(form, 'emoji') || '🏋️',
    assigned_to,
    published: !!assigned_to,
    created_by: uid,
  }).select('id').single();
  if (error) return { error: error.message };
  redirect(`/admin/programas/${data.id}`);
}

export async function updateProgram(_: ActionState, form: FormData): Promise<ActionState> {
  const { supabase } = await staff();
  const id = str(form, 'id');
  const { error } = await supabase.from('programs').update({
    title: str(form, 'title'),
    description: str(form, 'description') || null,
    level: str(form, 'level'),
    goal: str(form, 'goal') || null,
    weeks: num(form, 'weeks') ?? 4,
    emoji: str(form, 'emoji') || '🏋️',
    published: form.get('published') === 'on',
  }).eq('id', id);
  revalidatePath(`/admin/programas/${id}`);
  return error ? { error: error.message } : { ok: 'Guardado ✅' };
}

export async function deleteProgram(form: FormData) {
  const { supabase } = await staff();
  await supabase.from('programs').delete().eq('id', str(form, 'id'));
  redirect('/admin/programas');
}

export async function addWorkout(_: ActionState, form: FormData): Promise<ActionState> {
  const { supabase } = await staff();
  const program_id = str(form, 'program_id');
  const { error } = await supabase.from('workouts').insert({
    program_id,
    week: num(form, 'week') ?? 1,
    day: num(form, 'day') ?? 1,
    title: str(form, 'title') || 'Sesión',
    minutes: num(form, 'minutes'),
    notes: str(form, 'notes') || null,
  });
  revalidatePath(`/admin/programas/${program_id}`);
  if (error?.code === '23505') return { error: 'Ya existe una sesión en esa semana y día' };
  return error ? { error: error.message } : { ok: 'Sesión agregada' };
}

export async function deleteWorkout(form: FormData) {
  const { supabase } = await staff();
  await supabase.from('workouts').delete().eq('id', str(form, 'id'));
  revalidatePath(`/admin/programas/${str(form, 'program_id')}`);
}

export async function addItem(_: ActionState, form: FormData): Promise<ActionState> {
  const { supabase } = await staff();
  const workout_id = str(form, 'workout_id');
  const { count } = await supabase.from('workout_items').select('id', { count: 'exact', head: true }).eq('workout_id', workout_id);
  const { error } = await supabase.from('workout_items').insert({
    workout_id,
    exercise_id: str(form, 'exercise_id'),
    sets: num(form, 'sets'),
    reps: str(form, 'reps') || null,
    rest_sec: num(form, 'rest_sec'),
    notes: str(form, 'notes') || null,
    sort: (count ?? 0) + 1,
  });
  revalidatePath(`/admin/programas/${str(form, 'program_id')}`);
  return error ? { error: error.message } : { ok: 'Ejercicio agregado' };
}

export async function deleteItem(form: FormData) {
  const { supabase } = await staff();
  await supabase.from('workout_items').delete().eq('id', str(form, 'id'));
  revalidatePath(`/admin/programas/${str(form, 'program_id')}`);
}

/** Copia un programa (sesiones y ejercicios) como plan personalizado de un cliente. */
export async function copyProgramTo(_: ActionState, form: FormData): Promise<ActionState> {
  const { supabase, uid } = await staff();
  const sourceId = str(form, 'program_id');
  const clientId = str(form, 'client_id') || (await userIdByEmail(supabase, str(form, 'email')));
  if (!clientId) return { error: 'No encontré a ese cliente' };
  const { data: src } = await supabase.from('programs').select('*').eq('id', sourceId).single();
  if (!src) return { error: 'Programa no encontrado' };
  const { data: copy, error } = await supabase.from('programs').insert({
    title: src.title, description: src.description, level: src.level, goal: src.goal, weeks: src.weeks,
    emoji: src.emoji, assigned_to: clientId, published: true, created_by: uid,
  }).select('id').single();
  if (error || !copy) return { error: error?.message ?? 'Error' };
  const { data: wks } = await supabase.from('workouts').select('*, workout_items(*)').eq('program_id', sourceId);
  for (const w of wks ?? []) {
    const { data: nw } = await supabase.from('workouts')
      .insert({ program_id: copy.id, week: w.week, day: w.day, title: w.title, notes: w.notes, minutes: w.minutes })
      .select('id').single();
    const items = (w.workout_items ?? []) as { exercise_id: string; sets: number | null; reps: string | null; rest_sec: number | null; notes: string | null; sort: number }[];
    if (nw && items.length) {
      await supabase.from('workout_items').insert(items.map((i) => ({
        workout_id: nw.id, exercise_id: i.exercise_id, sets: i.sets, reps: i.reps, rest_sec: i.rest_sec, notes: i.notes, sort: i.sort,
      })));
    }
  }
  redirect(`/admin/programas/${copy.id}`);
}

// ======================= Clientes / coaching =======================
export async function staffReply(_: ActionState, form: FormData): Promise<ActionState> {
  const { supabase, uid } = await staff();
  const client_id = str(form, 'client_id');
  const body = str(form, 'body');
  if (!body) return { error: 'Escribe un mensaje' };
  const { error } = await supabase.from('coach_messages').insert({ client_id, author_id: uid, body: body.slice(0, 2000) });
  revalidatePath(`/admin/clientes/${client_id}`);
  return error ? { error: error.message } : { ok: 'Enviado' };
}

// ======================= Eventos =======================
export async function createEvent(_: ActionState, form: FormData): Promise<ActionState> {
  const { supabase } = await staff();
  const title = str(form, 'title');
  const date = str(form, 'date');
  const time = str(form, 'time');
  if (!title || !date || !time) return { error: 'Título, fecha y hora son obligatorios' };
  const { error } = await supabase.from('events').insert({
    slug: `${slugify(title)}-${date.slice(5).replace('-', '')}`,
    title,
    kind: str(form, 'kind') || 'comunidad',
    description: str(form, 'description') || null,
    starts_at: new Date(`${date}T${time}:00-06:00`).toISOString(),
    location: str(form, 'location') || null,
    price_mxn: num(form, 'price_mxn') ?? 0,
    capacity: num(form, 'capacity'),
    partner_name: str(form, 'partner_name') || null,
    emoji: str(form, 'emoji') || '📍',
    published: form.get('published') === 'on',
  });
  revalidatePath('/admin/eventos');
  return error ? { error: error.code === '23505' ? 'Ya existe un evento con ese nombre ese día' : error.message } : { ok: 'Evento creado ✅' };
}

export async function togglePublished(form: FormData) {
  const { supabase } = await staff();
  const table = str(form, 'table') === 'news' ? 'news' : str(form, 'table') === 'programs' ? 'programs' : 'events';
  await supabase.from(table).update({ published: form.get('value') === 'true' }).eq('id', str(form, 'id'));
  revalidatePath(`/admin/${table === 'news' ? 'noticias' : table === 'programs' ? 'programas' : 'eventos'}`);
  revalidatePath('/', 'layout');
}

export async function checkInTicket(_: ActionState, form: FormData): Promise<ActionState> {
  const { supabase } = await staff();
  const code = str(form, 'code').toUpperCase();
  const eventId = str(form, 'event_id');
  const { data: t } = await supabase.from('event_tickets').select('id, status, profiles(full_name)')
    .eq('event_id', eventId).eq('code', code).maybeSingle();
  if (!t) return { error: `Código ${code} no válido para este evento` };
  if (t.status === 'asistio') return { error: 'Ese boleto ya se usó' };
  await supabase.from('event_tickets').update({ status: 'asistio' }).eq('id', t.id);
  revalidatePath(`/admin/eventos/${eventId}`);
  return { ok: `✅ Bienvenida/o ${(t.profiles as unknown as { full_name: string } | null)?.full_name ?? ''}` };
}

export async function markAttended(form: FormData) {
  const { supabase } = await staff();
  await supabase.from('event_tickets').update({ status: 'asistio' }).eq('id', str(form, 'id'));
  revalidatePath(`/admin/eventos/${str(form, 'event_id')}`);
}

// ======================= Noticias =======================
export async function createNews(_: ActionState, form: FormData): Promise<ActionState> {
  const { supabase } = await staff();
  const title = str(form, 'title');
  if (!title) return { error: 'Falta el título' };
  const { error } = await supabase.from('news').insert({
    slug: `${slugify(title)}-${Date.now().toString(36).slice(-4)}`,
    title,
    kind: str(form, 'kind') || 'noticia',
    summary: str(form, 'summary') || null,
    body: str(form, 'body') || null,
    partner_name: str(form, 'partner_name') || null,
    partner_url: str(form, 'partner_url') || null,
    emoji: str(form, 'emoji') || '📰',
    published: form.get('published') === 'on',
  });
  revalidatePath('/admin/noticias');
  revalidatePath('/noticias');
  return error ? { error: error.message } : { ok: 'Publicación creada ✅' };
}
