/** Datos generales de la marca. Edítalos aquí y se actualizan en toda la web y la app. */
export const SITE = {
  name: 'Verion Wellness Club',
  short: 'Verion',
  domain: 'verionwellnessclub.com',
  city: 'Saltillo, Coahuila',
  tagline: 'Entrena. Recupérate. Pertenece.',
  description:
    'Club de wellness en Saltillo: entrenamiento funcional, coaching online, nutrición, fisio, eventos y comunidad.',
  instagram: 'https://instagram.com/verion', // ← cambia por tu usuario real
  /** Link público de reservas de Fitco (o la página donde tienes el calendario). */
  bookingUrl: process.env.NEXT_PUBLIC_BOOKING_URL || '#',
  address: 'Saltillo, Coahuila', // ← tu dirección
  whatsappText: '',
};

export const EVENT_KINDS: Record<string, string> = {
  running: 'Running',
  marca: 'Con marcas',
  workshop: 'Workshop',
  reto: 'Reto',
  comunidad: 'Comunidad',
};

export const NEWS_KINDS: Record<string, string> = {
  noticia: 'Noticia',
  afiliacion: 'Afiliación',
  alianza: 'Alianza',
};
