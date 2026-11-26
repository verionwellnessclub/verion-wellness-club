'use client';
import { useActionState, useEffect, useRef, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { createExercise } from '../actions';

const MAX_MB = 50; // límite por archivo del plan gratis de Supabase

/** Sube el video directo a Supabase Storage y luego guarda el ejercicio. */
export function ExerciseForm() {
  const [state, action, pending] = useActionState(createExercise, null);
  const [path, setPath] = useState('');
  const [progress, setProgress] = useState('');
  const [err, setErr] = useState('');
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.ok) {
      formRef.current?.reset();
      setPath('');
      setProgress('');
    }
  }, [state]);

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    setErr('');
    setPath('');
    if (!file) return;
    if (file.size > MAX_MB * 1024 * 1024) {
      setErr(`El video pesa ${(file.size / 1048576).toFixed(0)} MB. Máximo ${MAX_MB} MB: comprímelo (720p) o usa un link de YouTube/Vimeo.`);
      e.target.value = '';
      return;
    }
    setProgress('Subiendo video…');
    const ext = file.name.split('.').pop()?.toLowerCase() || 'mp4';
    const key = `exercises/${crypto.randomUUID()}.${ext}`;
    const { error } = await createClient().storage.from('videos').upload(key, file, { contentType: file.type || 'video/mp4' });
    if (error) {
      setErr('No se pudo subir: ' + error.message);
      setProgress('');
      return;
    }
    setPath(key);
    setProgress('✅ Video listo');
  }

  return (
    <form ref={formRef} action={action} className="card">
      <b>Nuevo ejercicio</b>
      <div className="field" style={{ marginTop: 10 }}><label>Nombre *</label><input name="name" required placeholder="Sentadilla goblet" /></div>
      <div className="grid2" style={{ marginTop: 0 }}>
        <div className="field"><label>Grupo muscular</label><input name="muscle_group" placeholder="Pierna" /></div>
        <div className="field"><label>Equipo</label><input name="equipment" placeholder="Kettlebell" /></div>
      </div>
      <div className="field"><label>Indicaciones técnicas</label><textarea name="description" rows={3} placeholder="Pecho arriba, rodillas siguen la punta del pie…" /></div>
      <div className="field">
        <label>Video (MP4/MOV, máx. {MAX_MB} MB)</label>
        <input type="file" accept="video/*" onChange={onFile} />
        {progress && <small className="sub">{progress}</small>}
      </div>
      <div className="field"><label>…o link de YouTube / Vimeo</label><input name="video_url" type="url" placeholder="https://youtu.be/..." /></div>
      <input type="hidden" name="video_path" value={path} />
      <button className="btn pri" disabled={pending || progress === 'Subiendo video…'}>{pending ? 'Guardando…' : 'Guardar ejercicio'}</button>
      {err && <div className="msg err">{err}</div>}
      {state?.ok && <div className="msg ok">{state.ok}</div>}
      {state?.error && <div className="msg err">{state.error}</div>}
    </form>
  );
}
