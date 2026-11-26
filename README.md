# Verion Wellness Club

Web pública y app del club en **verionwellnessclub.com**. Las reservas de clases siguen en Fitco, junto con TotalPass y Wellhub. Este proyecto agrega todo lo demás.

## Mapa

### Web pública (sin login)
| Ruta | Qué es |
|---|---|
| `/` | Inicio: servicios, planes del Club Online, próximos eventos, tienda, noticias |
| `/club` | Planes y preguntas frecuentes del entrenamiento online |
| `/eventos` y `/eventos/[evento]` | Calendario y detalle de eventos |
| `/noticias` y `/noticias/[nota]` | Afiliaciones, alianzas y novedades |
| Botón "Reservar clase" | Lleva a tu link de Fitco (`NEXT_PUBLIC_BOOKING_URL`) |

### App del club (`/app`, con login por correo)
| Sección | Qué hace |
|---|---|
| **Inicio** | Resumen, reservar clase, próximo evento, reto, embajadores (15%) y comunidad |
| **Entrenar** | Programas online con video, plan personalizado, registrar sesión (con RPE y notas), progreso y PRs |
| **Mi coach** | Chat con el coach (sólo plan Coaching) |
| **Eventos** | Apartar lugar gratis o comprar boleto; boleto con QR |
| **Wellness y 1:1** | Sesiones personales en Verion, nutrición, fisio y recuperación con precio de socio |
| **Tienda** | Merch y productos con pago Stripe; se recogen en recepción |
| **Retos** | The Holiday Burn: inscripción, puntos, ranking (mañana y tarde) |
| **Perfil** | Datos, código de embajador, administrar suscripción |

### Panel (`/admin`, sólo coaches y admin)
| Sección | Qué haces |
|---|---|
| **Resumen** | Pedidos por entregar, citas por confirmar, inscripciones al reto y puntos |
| **Ejercicios y videos** | Subir cada ejercicio con su video (o link de YouTube o Vimeo) |
| **Programas** | Armar programas por semana, día y ejercicio; publicarlos; copiarlos como plan personalizado |
| **Clientes online** | Suscriptores, chats por responder, plan de cada cliente, sus sesiones y PRs |
| **Eventos** | Crear eventos (gratis o de paga, con cupo), lista de asistentes y check-in con código |
| **Noticias** | Publicar afiliaciones y alianzas |

### Cómo se cobra
- **Suscripción mensual** (Club Online o Coaching Personalizado): Stripe Billing. El cliente cambia su tarjeta o cancela desde su perfil.
- **Pagos únicos** (tienda, boletos, retos): Stripe Checkout.

**Seguridad:** los precios, los puntos, el cupo de eventos y el acceso a los videos se validan en el servidor y la base de datos. Los videos son privados y sólo los ven suscriptores, con enlaces que caducan en 1 hora.

---

## Puesta en marcha (≈ 1 hora, sin programar)

Necesitas cuentas gratuitas en **GitHub**, **Supabase** y **Vercel**, además de tu **Stripe**.

### 1. Supabase (base de datos, login y videos)
1. supabase.com → **New project** → nombre `verion`.
2. **SQL Editor → New query** → pega todo `supabase/schema.sql` → **Run**. Hazlo una sola vez. Crea tablas, seguridad, el bucket de videos y datos de ejemplo.
3. **Authentication → URL Configuration**:
   - *Site URL:* `https://verionwellnessclub.com`
   - *Redirect URLs:* `https://verionwellnessclub.com/auth/callback` y `https://*.vercel.app/auth/callback`
4. **Authentication → Email Templates → Magic Link**: tradúcelo al español. Por ejemplo, asunto "Tu enlace para entrar a Verion".
5. **Project Settings → API**: copia la URL, la `anon key` y la `service_role key`.

### 2. GitHub
Crea un repositorio privado `verion-wellness-club` y sube todos los archivos de esta carpeta (Add file → Upload files).

### 3. Vercel
1. vercel.com → **Add New → Project** → importa el repositorio.
2. Pega las variables de `.env.example` con tus valores.
3. **Deploy**.
4. **Settings → Domains** → agrega `verionwellnessclub.com` y `www.verionwellnessclub.com`. Vercel te dice qué registros DNS poner donde compraste el dominio.

### 4. Stripe
1. **Developers → API keys** → la *Secret key* va en `STRIPE_SECRET_KEY`.
2. **Developers → Webhooks → Add endpoint**:
   - URL: `https://verionwellnessclub.com/api/stripe/webhook`
   - Eventos: `checkout.session.completed`, `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`
   - Copia el *Signing secret* a `STRIPE_WEBHOOK_SECRET`.
3. **Settings → Billing → Customer portal** → actívalo y permite "Cancelar suscripción" y "Actualizar método de pago".
4. En Vercel → Deployments → **Redeploy**.

> Prueba primero con llaves `sk_test_` y la tarjeta `4242 4242 4242 4242`. Después cambia a las llaves `live` y crea un nuevo webhook en modo live.

### 5. Hazte admin
Entra a `/login` con tu correo y luego, en Supabase → SQL Editor:
```sql
update public.profiles set role = 'admin' where email = 'TU_CORREO';
-- coaches:
update public.profiles set role = 'coach' where email = 'CORREO_DEL_COACH';
```

### 6. Edita tus datos
- `src/config/site.ts`: Instagram, dirección y textos generales.
- Precios de planes, productos y servicios: Supabase → **Table Editor** (`plans`, `products`, `wellness_services`).

---

## Cómo cargar el entrenamiento online
1. **Ejercicios y videos**: sube cada ejercicio con su video, una sola vez.
   - Formato recomendado: vertical u horizontal, 720p, 15 a 60 segundos, sin audio o con audio corto.
   - El plan gratis de Supabase acepta **hasta 50 MB por video y 1 GB en total**, que son unos 60–100 videos cortos.
   - Si necesitas más, sube a **Supabase Pro** (USD 25/mes, 100 GB) o usa links de YouTube en modo "no listado".
2. **Programas → Nuevo programa**: ponle título, nivel y semanas. Agrega las sesiones (semana y día) y a cada sesión sus ejercicios con series, reps y descanso. Al final, márcalo como **Publicado**.
3. **Plan personalizado**: desde **Clientes online** abre al cliente y crea su plan desde cero. También puedes abrir un programa del catálogo y usar **Copiar a cliente** para ajustarlo.
4. Contesta los chats marcados **Por responder**.

## Instalar en el celular
- iPhone: Safari → `verionwellnessclub.com/app` → Compartir → "Agregar a pantalla de inicio".
- Android: Chrome → menú ⋮ → "Instalar app".

## Limitaciones conocidas
- **Reservas y membresías del estudio** siguen en Fitco. La app sólo enlaza.
- **Check-in en eventos**: se escribe el código del boleto o se marca en la lista. No hay escáner de cámara integrado todavía.
- **Evento lleno al pagar**: si un evento de paga se llena mientras alguien está pagando, el pago entra pero el boleto no se crea. Revisa en Stripe y reembolsa. Es raro con cupos razonables.
- **Cambio de plan**: para cambiar de Club a Coaching hay que cancelar y volver a suscribirse.
- **Avisos**: no hay notificaciones push ni correos automáticos de mensajes del coach. Sería la siguiente mejora.

## Para desarrolladores
```bash
npm install
cp .env.example .env.local
npm run dev            # http://localhost:3000
stripe listen --forward-to localhost:3000/api/stripe/webhook   # webhooks en local
```
Stack: Next.js 15 (App Router, Server Actions) · Supabase (Postgres, Auth, Storage, RLS) · Stripe (Checkout, Billing, Customer Portal) · PWA.
