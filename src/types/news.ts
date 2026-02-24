export interface NewsPost {
    id: number;
    slug: string;
    title: string;
    summary: string;
    content: string;
    date: string;       // ISO-дата, напр. "2026-02-23"
    author: string;
    tags: string[];
    coverImage?: string;
}
