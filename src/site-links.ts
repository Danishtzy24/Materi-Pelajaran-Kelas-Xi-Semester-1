import type { LessonLinks } from './types';
/** Published English/Japanese URLs stay available even with old/empty configuration. */
export const DEFAULT_LINKS: LessonLinks = {
 bahasaInggris: 'https://bahasa-inggris-xi-semester-1.vercel.app/',
 bahasaIndonesia: 'https://bahasa-indonesia-xi-semester-1.vercel.app/',
 bahasaJepang: 'https://bahasa-jepang-xi-semester-1.vercel.app/',
 pancasila: 'https://pkn-xi-semester-1.vercel.app/',
};
function publicUrl(value: unknown): string {
 if (typeof value !== 'string' || !value.trim()) return '';
 try { const url = new URL(value.trim()); return ['https:', 'http:'].includes(url.protocol) ? url.href : ''; } catch { return ''; }
}
export async function loadLessonLinks(): Promise<LessonLinks> {
 try {
  const response = await fetch(`${import.meta.env.BASE_URL}tautan-materi.json`, { cache: 'no-store' });
  if (!response.ok) return { ...DEFAULT_LINKS };
  const value: unknown = await response.json();
  if (!value || typeof value !== 'object' || Array.isArray(value)) return { ...DEFAULT_LINKS };
  const data = value as Partial<Record<keyof LessonLinks, unknown>>;
  return {
   bahasaInggris: publicUrl(data.bahasaInggris) || DEFAULT_LINKS.bahasaInggris,
   bahasaIndonesia: publicUrl(data.bahasaIndonesia) || DEFAULT_LINKS.bahasaIndonesia,
   bahasaJepang: publicUrl(data.bahasaJepang) || DEFAULT_LINKS.bahasaJepang,
   pancasila: publicUrl(data.pancasila) || DEFAULT_LINKS.pancasila,
  };
 } catch { return { ...DEFAULT_LINKS }; }
}
