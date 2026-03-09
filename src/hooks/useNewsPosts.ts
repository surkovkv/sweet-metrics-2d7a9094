import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export type NewsPost = {
    id: string;
    title: string;
    slug: string;
    summary: string;
    content: string;
    tags: string[];
    cover_image: string | null;
    published: boolean;
    author_id: string;
    author_name: string;
    created_at: string;
    updated_at: string;
};

export type NewsPostInsert = Omit<NewsPost, "id" | "created_at" | "updated_at">;
export type NewsPostUpdate = Partial<Omit<NewsPost, "id" | "created_at" | "updated_at">>;

const sb = supabase as any;

/** Загрузка всех опубликованных постов */
export function useNewsPosts() {
    const [posts, setPosts] = useState<NewsPost[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetch = useCallback(async () => {
        setLoading(true);
        const { data, error } = await sb
            .from("news_posts")
            .select("*")
            .eq("published", true)
            .order("created_at", { ascending: false });
        if (error) setError(error.message);
        else setPosts(data ?? []);
        setLoading(false);
    }, []);

    useEffect(() => { fetch(); }, [fetch]);

    return { posts, loading, error, refetch: fetch };
}

/** Загрузка одного поста по slug */
export function useNewsPost(slug: string) {
    const [post, setPost] = useState<NewsPost | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!slug) return;
        setLoading(true);
        sb
            .from("news_posts")
            .select("*")
            .eq("slug", slug)
            .single()
            .then(({ data, error }: any) => {
                if (error) setError(error.message);
                else setPost(data);
                setLoading(false);
            });
    }, [slug]);

    return { post, loading, error };
}

/** Посты текущего авторизованного пользователя */
export function useMyNewsPosts(userId: string | undefined) {
    const [posts, setPosts] = useState<NewsPost[]>([]);
    const [loading, setLoading] = useState(false);

    const fetch = useCallback(async () => {
        if (!userId) return;
        setLoading(true);
        const { data } = await sb
            .from("news_posts")
            .select("*")
            .eq("author_id", userId)
            .order("created_at", { ascending: false });
        setPosts(data ?? []);
        setLoading(false);
    }, [userId]);

    useEffect(() => { fetch(); }, [fetch]);

    return { posts, loading, refetch: fetch };
}

/** Создание поста */
export async function createNewsPost(post: NewsPostInsert) {
    return sb.from("news_posts").insert(post).select().single();
}

/** Обновление поста */
export async function updateNewsPost(id: string, post: NewsPostUpdate) {
    return sb.from("news_posts").update(post).eq("id", id).select().single();
}

/** Удаление поста */
export async function deleteNewsPost(id: string) {
    return sb.from("news_posts").delete().eq("id", id);
}

/** Генерация slug из заголовка */
export function generateSlug(title: string): string {
    return title
        .toLowerCase()
        .replace(/[а-яё]/g, (ch) => {
            const map: Record<string, string> = {
                а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ё: "yo", ж: "zh", з: "z",
                и: "i", й: "y", к: "k", л: "l", м: "m", н: "n", о: "o", п: "p", р: "r",
                с: "s", т: "t", у: "u", ф: "f", х: "h", ц: "ts", ч: "ch", ш: "sh", щ: "sch",
                ъ: "", ы: "y", ь: "", э: "e", ю: "yu", я: "ya"
            };
            return map[ch] ?? ch;
        })
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "")
        .slice(0, 80);
}
