'use client';
import { useActionState, useEffect, useRef } from 'react';
import { useFormStatus } from 'react-dom';
import type { ActionState } from '@/app/app/actions';

type Props = {
  action: (state: ActionState, form: FormData) => Promise<ActionState>;
  children: React.ReactNode;
  className?: string;
  resetOnSuccess?: boolean;
};

/** Formulario que llama a una server action y muestra el resultado. */
export function ActionForm({ action, children, className, resetOnSuccess = true }: Props) {
  const [state, formAction] = useActionState(action, null);
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state?.ok && resetOnSuccess) ref.current?.reset();
  }, [state, resetOnSuccess]);
  return (
    <form ref={ref} action={formAction} className={className}>
      {children}
      {state?.ok && <div className="msg ok">{state.ok}</div>}
      {state?.error && <div className="msg err">{state.error}</div>}
    </form>
  );
}

export function Submit({ children, className = 'btn pri', style }: { children: React.ReactNode; className?: string; style?: React.CSSProperties }) {
  const { pending } = useFormStatus();
  return (
    <button className={className} style={style} disabled={pending}>
      {pending ? '…' : children}
    </button>
  );
}
