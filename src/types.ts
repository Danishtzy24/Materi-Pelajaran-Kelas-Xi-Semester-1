export type Category = 'numerasi' | 'bahasa' | 'sosial' | 'kewarganegaraan' | 'agama' | 'jurusan';
export interface Subject { id: string; name: string; category: Category; label: string; code: string; description: string; topics: string[]; url: string | null; art: string; tone: string; delivery?: 'link' | 'preview'; major?: string; day?: string; }
export interface LessonLinks { bahasaInggris: string; bahasaIndonesia: string; bahasaJepang: string; pancasila: string; }
