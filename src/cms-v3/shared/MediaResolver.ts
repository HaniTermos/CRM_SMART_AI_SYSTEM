/**
 * SmartStore Website Studio (CMS V3) — Media Resolver & Embed Generator
 */

export interface MediaResolution {
  provider: 'youtube' | 'vimeo' | 'mp4' | 'unknown';
  embedUrl: string;
  posterUrl?: string;
  isValid: boolean;
}

export function resolveMediaUrl(url: string, defaultPoster?: string): MediaResolution {
  if (!url) {
    return { provider: 'unknown', embedUrl: '', posterUrl: defaultPoster, isValid: false };
  }

  const clean = url.trim();

  // YouTube match
  if (clean.includes('youtube.com') || clean.includes('youtu.be')) {
    let videoId = '';
    if (clean.includes('v=')) {
      videoId = clean.split('v=')[1]?.split('&')[0] || '';
    } else if (clean.includes('youtu.be/')) {
      videoId = clean.split('youtu.be/')[1]?.split('?')[0] || '';
    }
    const embedUrl = videoId ? `https://www.youtube-nocookie.com/embed/${videoId}?rel=0` : clean;
    const posterUrl = videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : defaultPoster;
    return { provider: 'youtube', embedUrl, posterUrl, isValid: Boolean(videoId) };
  }

  // Vimeo match
  if (clean.includes('vimeo.com')) {
    const videoId = clean.split('vimeo.com/')[1]?.split('?')[0] || '';
    const embedUrl = videoId ? `https://player.vimeo.com/video/${videoId}` : clean;
    return { provider: 'vimeo', embedUrl, posterUrl: defaultPoster, isValid: Boolean(videoId) };
  }

  // MP4 direct video file match
  if (clean.endsWith('.mp4')) {
    return { provider: 'mp4', embedUrl: clean, posterUrl: defaultPoster, isValid: true };
  }

  return { provider: 'unknown', embedUrl: clean, posterUrl: defaultPoster, isValid: false };
}
