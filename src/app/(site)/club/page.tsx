import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { PlanCards, type Plan } from '@/components/PlanCards';

export const metadata: Metadata = { title: 'Club Online' };

const FAQ = [
  ['¿Necesito ir al estudio?', 'No. Los programas están pensados para entrenar en gimnasio o en casa con equipo básico. Si ya vienes a Verion, te sirven para los días que no tienes clase.'],
  ['¿Cómo funciona el coaching personalizado?', 'Después de suscribirte, tu coach te escribe por el chat de la app, revisa tus objetivos y te arma un plan. Lo ajusta según tu progreso.'],
  ['¿Puedo cancelar?', 'Sí, cuando quieras, desde tu perfil en la app. Mantienes el acceso hasta que termine el mes que ya pagaste.'],
  ['¿Incluye las clases presenciales?', 'No. Las clases en el estudio se reservan con tu paquete, TotalPass o Wellhub como siempre. El club online es un complemento.'],
];

export default async function Club() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: plans } = await supabase.from('plans').select('*').eq('active', true).order('sort');

  return (
    <main>
      <section className="shero">
        <div className="glow" />
        <div className="wrap">
          <div className="kicker">Club Online</div>
          <h1>El método Verion,<br /><em>en tu bolsillo.</em></h1>
          <p>Programas de fuerza y resistencia con video de cada ejercicio, registro de progreso y coaches reales detrás de cada plan.</p>
        </div>
      </section>
      <section className="ssec">
        <div className="wrap">
          <h2>Elige tu plan.</h2>
          <PlanCards plans={(plans ?? []) as Plan[]} loggedIn={!!user} />
        </div>
      </section>
      <section className="ssec">
        <div className="wrap">
          <h2>Preguntas frecuentes</h2>
          <div className="sgrid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))' }}>
            {FAQ.map(([q, a]) => (
              <div key={q} className="scard"><h3 style={{ fontSize: 18 }}>{q}</h3><p>{a}</p></div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
