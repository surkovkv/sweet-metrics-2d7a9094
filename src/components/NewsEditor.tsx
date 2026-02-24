import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Save, X, Tag as TagIcon, RefreshCw } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
    createNewsPost,
    updateNewsPost,
    generateSlug,
    type NewsPost,
    type NewsPostInsert,
} from "@/hooks/useNewsPosts";
import { useAuth } from "@/hooks/useAuth";

interface NewsEditorProps {
    post?: NewsPost | null;
    onSave?: () => void;
    onCancel?: () => void;
}

const NewsEditor = ({ post, onSave, onCancel }: NewsEditorProps) => {
    const { user, profile } = useAuth();
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);

    const [title, setTitle] = useState(post?.title ?? "");
    const [slug, setSlug] = useState(post?.slug ?? "");
    const [summary, setSummary] = useState(post?.summary ?? "");
    const [content, setContent] = useState(post?.content ?? "");
    const [tagsStr, setTagsStr] = useState((post?.tags ?? []).join(", "));
    const [coverImage, setCoverImage] = useState(post?.cover_image ?? "");
    const [published, setPublished] = useState(post?.published ?? true);
    const [slugManual, setSlugManual] = useState(!!post);

    // Авто-slug из заголовка
    useEffect(() => {
        if (!slugManual && title) setSlug(generateSlug(title));
    }, [title, slugManual]);

    const handleSave = async () => {
        if (!title.trim() || !slug.trim() || !summary.trim() || !content.trim()) {
            toast({ title: "Заполни все обязательные поля", variant: "destructive" });
            return;
        }
        if (!user) {
            toast({ title: "Необходима авторизация", variant: "destructive" });
            return;
        }

        setLoading(true);
        const tags = tagsStr
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean);

        let err: string | null = null;

        if (post?.id) {
            const { error } = await updateNewsPost(post.id, {
                title, slug, summary, content, tags,
                cover_image: coverImage || null,
                published,
            });
            err = error?.message ?? null;
        } else {
            const payload: NewsPostInsert = {
                title, slug, summary, content, tags,
                cover_image: coverImage || null,
                published,
                author_id: user.id,
                author_name: profile?.nickname || user.email || "Автор",
            };
            const { error } = await createNewsPost(payload);
            err = error?.message ?? null;
        }

        setLoading(false);

        if (err) {
            toast({ title: "Ошибка сохранения", description: err, variant: "destructive" });
        } else {
            toast({ title: post?.id ? "Статья обновлена" : "Статья создана" });
            onSave?.();
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card border border-border rounded-xl p-6 space-y-4"
        >
            <h2 className="font-display text-xl font-bold text-foreground">
                {post?.id ? "Редактировать статью" : "Новая статья"}
            </h2>

            {/* Заголовок */}
            <div>
                <label className="text-xs text-muted-foreground mb-1 block">Заголовок *</label>
                <Input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Введи заголовок статьи"
                    className="bg-secondary border-border"
                />
            </div>

            {/* Slug */}
            <div>
                <label className="text-xs text-muted-foreground mb-1 block">
                    Slug * (URL-имя)
                </label>
                <div className="flex gap-2">
                    <Input
                        value={slug}
                        onChange={(e) => { setSlug(e.target.value); setSlugManual(true); }}
                        placeholder="my-article-slug"
                        className="bg-secondary border-border font-mono text-sm"
                    />
                    <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => { setSlug(generateSlug(title)); setSlugManual(false); }}
                        title="Сгенерировать из заголовка"
                    >
                        <RefreshCw className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            {/* Краткое описание */}
            <div>
                <label className="text-xs text-muted-foreground mb-1 block">Краткое описание *</label>
                <textarea
                    value={summary}
                    onChange={(e) => setSummary(e.target.value)}
                    placeholder="Одно-два предложения о чём статья"
                    rows={2}
                    className="w-full rounded-md border border-border bg-secondary px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary resize-none"
                />
            </div>

            {/* Контент */}
            <div>
                <label className="text-xs text-muted-foreground mb-1 block">
                    Контент * (HTML)
                </label>
                <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder={"<p>Текст статьи...</p>\n<h2>Подзаголовок</h2>\n<ul><li>Пункт</li></ul>"}
                    rows={10}
                    className="w-full rounded-md border border-border bg-secondary px-3 py-2 text-sm text-foreground font-mono placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary resize-y"
                />
            </div>

            {/* Теги */}
            <div>
                <label className="text-xs text-muted-foreground mb-1 block flex items-center gap-1">
                    <TagIcon className="h-3 w-3" /> Теги (через запятую)
                </label>
                <Input
                    value={tagsStr}
                    onChange={(e) => setTagsStr(e.target.value)}
                    placeholder="Релиз, Гайд, Новости"
                    className="bg-secondary border-border"
                />
            </div>

            {/* Обложка */}
            <div>
                <label className="text-xs text-muted-foreground mb-1 block">URL обложки (необязательно)</label>
                <Input
                    value={coverImage}
                    onChange={(e) => setCoverImage(e.target.value)}
                    placeholder="https://..."
                    className="bg-secondary border-border"
                />
            </div>

            {/* Статус */}
            <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                    type="checkbox"
                    checked={published}
                    onChange={(e) => setPublished(e.target.checked)}
                    className="accent-primary w-4 h-4"
                />
                <span className="text-sm text-foreground">Опубликовано</span>
            </label>

            {/* Кнопки */}
            <div className="flex gap-3 pt-2">
                <Button onClick={handleSave} disabled={loading} className="gap-2 flex-1">
                    <Save className="h-4 w-4" />
                    {loading ? "Сохранение..." : "Сохранить"}
                </Button>
                {onCancel && (
                    <Button variant="outline" onClick={onCancel} className="gap-2">
                        <X className="h-4 w-4" /> Отмена
                    </Button>
                )}
            </div>
        </motion.div>
    );
};

export default NewsEditor;
