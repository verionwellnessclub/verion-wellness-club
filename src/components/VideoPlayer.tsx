/** Reproduce un video subido (enlace firmado) o un link de YouTube / Vimeo. */
export function VideoPlayer({ src, url, title }: { src?: string | null; url?: string | null; title: string }) {
  if (src) {
    return (
      <video className="video" src={src} controls playsInline preload="metadata" controlsList="nodownload" aria-label={title} />
    );
  }
  if (url) {
    const embed = toEmbed(url);
    if (embed) {
      return (
        <div className="video">
          <iframe src={embed} title={title} allow="autoplay; fullscreen; picture-in-picture" allowFullScreen />
        </div>
      );
    }
    return <a className="btn ghost sm" href={url} target="_blank" rel="noreferrer">Ver video ↗</a>;
  }
  return null;
}

function toEmbed(url: string) {
  try {
    const u = new URL(url);
    if (u.hostname.includes('youtu.be')) return `https://www.youtube.com/embed/${u.pathname.slice(1)}`;
    if (u.hostname.includes('youtube.com')) {
      const id = u.searchParams.get('v') ?? u.pathname.split('/').pop();
      return id ? `https://www.youtube.com/embed/${id}` : null;
    }
    if (u.hostname.includes('vimeo.com')) {
      const id = u.pathname.split('/').filter(Boolean).pop();
      return id ? `https://player.vimeo.com/video/${id}` : null;
    }
  } catch {}
  return null;
}
