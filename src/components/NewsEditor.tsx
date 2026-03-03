import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Save, X, Tag as TagIcon, RefreshCw, Bold, Italic, List, ListOrdered, Heading2, Heading3, Link as LinkIcon, Quote, Code, Minus } from "lucide-react";
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
    isAdmin?: boolean;
}

type ToolbarButton = {
    icon: React.ReactNode;
    command: string;
    arg?: string;
    title: string;
};

const toolbarGroups: ToolbarButton[][] = [
    [
        { icon: <Bold className="h-4 w-4" />, command: "bold", title: "Жирный" },
        { icon: <Italic className="h-4 w-4" />, command: "italic", title: "Курсив" },
    ],
    [
        { icon: <Heading2 className="h-4 w-4" />, command: "formatBlock", arg: "h2", title: "Заголовок 2" },
        { icon: <Heading3 className="h-4 w-4" />, command: "formatBlock", arg: "h3", title: "Заголовок 3" },
    ],
    [
        { icon: <List className="h-4 w-4" />, command: "insertUnorderedList", title: "Маркированный список" },
        { icon: <ListOrdered className="h-4 w-4" />, command: "insertOrderedList", title: "Нумерованный список" },
    ],
    [
        { icon: <Quote className="h-4 w-4" />, command: "formatBlock", arg: "blockquote", title: "Цитата" },
        { icon: <Code className="h-4 w-4" />, command: "formatBlock", arg: "pre", title: "Код" },
        { icon: <Minus className="h-4 w-4" />, command: "insertHorizontalRule", title: "Горизонтальная линия" },
    ],
];

const NewsEditor = ({ post, onSave, onCancel, isAdmin = false }: NewsEditorProps) => {
    const { user, profile } = useAuth();
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const editorRef = useRef<HTMLDivElement>(null);

    const [title, setTitle] = useState(post?.title ?? "");
    const [slug, setSlug] = useState(post?.slug ?? "");
    const [summary, setSummary] = useState(post?.summary ?? "");
    const [tagsStr, setTagsStr] = useState((post?.tags ?? []).join(", "));
    const [coverImage, setCoverImage] = useState(post?.cover_image ?? "");
    const [published, setPublished] = useState(post?.published ?? false);
    const [slugManual, setSlugManual] = useState(!!post);

    useEffect(() => {
        if (editorRef.current && post?.content && editorRef.current.innerHTML === "") {
            editorRef.current.innerHTML = post.content;
        }
    }, [post]);

    useEffect(() => {
        if (!slugManual && title) setSlug(generateSlug(title));
    }, [title, slugManual]);

    const execCmd = (command: string, arg?: string) => {
        document.execCommand(command, false, arg);
        editorRef.current?.focus();
    };

    const insertLink = () => {
        const url = prompt("URL ссылки:");
        if (url) execCmd("createLink", url);
    };

    const handleSave = async () => {
        const content = editorRef.current?.innerHTML ?? "";

        if (!title.trim() || !slug.trim() || !summary.trim() || !content.trim() || content === "<br>") {
            toast({ title: "Заполни все обязательные поля", variant: "destructive" });
            return;
        }
        if (!user) {
            toast({ title: "Необходима авторизация", variant: "destructive" });
            return;
        }

        setLoading(true);
        const tags = tagsStr.split(",").map((t) => t.trim()).filter(Boolean);

        // Non-admin users always submit as pending (published = false)
        const publishedState = isAdmin ? published : false;

        let err: string | null = null;

        if (post?.id) {
            const { error } = await updateNewsPost(post.id, {
                title, slug, summary, content, tags,
                cover_image: coverImage || null,
                published: publishedState,
            });
            err = error?.message ?? null;
        } else {
            const payload: NewsPostInsert = {
                title, slug, summary, content, tags,
                cover_image: coverImage || null,
                published: publishedState,
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
            if (!isAdmin && !post?.id) {
                toast({
                    title: "✅ Статья отправлена на модерацию",
                    description: "После проверки администратором она будет опубликована.",
                });
            } else {
                toast({ title: post?.id ? "Статья обновлена" : "Статья создана" });
            }
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

            {!isAdmin && (
                <div className="p-3 bg-primary/10 border border-primary/20 rounded-lg text-sm text-primary">
                    📝 Статья будет отправлена на модерацию перед публикацией.
                </div>
            )}

            {/* Title */}
            <div>
                <label className="text-xs text-muted-foreground mb-1 block">Заголовок *</label>
                <Input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Введи заголовок статьи"
                    className="bg-secondary border-border"
                />
            </div>

            {/* Slug — always visible (useful for admin) */}
            {isAdmin && (
                <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Slug * (URL-имя)</label>
                    <div className="flex gap-2">
                        <Input
                            value={slug}
                            onChange={(e) => { setSlug(e.target.value); setSlugManual(true); }}
                            placeholder="my-article-slug"
                            className="bg-secondary border-border font-mono text-sm"
                        />
                        <Button
                            type="button" variant="outline" size="icon"
                            onClick={() => { setSlug(generateSlug(title)); setSlugManual(false); }}
                            title="Сгенерировать из заголовка"
                        >
                            <RefreshCw className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            )}

            {/* Summary */}
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

            {/* Rich Text Editor */}
            <div>
                <label className="text-xs text-muted-foreground mb-1 block">Контент *</label>
                {/* Toolbar */}
                <div className="flex flex-wrap items-center gap-1 p-2 bg-secondary border border-border rounded-t-md border-b-0">
                    {toolbarGroups.map((group, gi) => (
                        <div key={gi} className="flex items-center gap-1 pr-1 border-r border-border last:border-r-0">
                            {group.map((btn, bi) => (
                                <button
                                    key={bi}
                                    type="button"
                                    title={btn.title}
                                    onMouseDown={(e) => {
                                        e.preventDefault();
                                        execCmd(btn.command, btn.arg);
                                    }}
                                    className="p-1.5 rounded hover:bg-primary/20 text-muted-foreground hover:text-primary transition-colors"
                                >
                                    {btn.icon}
                                </button>
                            ))}
                        </div>
                    ))}
                    <button
                        type="button"
                        title="Ссылка"
                        onMouseDown={(e) => { e.preventDefault(); insertLink(); }}
                        className="p-1.5 rounded hover:bg-primary/20 text-muted-foreground hover:text-primary transition-colors"
                    >
                        <LinkIcon className="h-4 w-4" />
                    </button>
                </div>
                <div
                    ref={editorRef}
                    contentEditable
                    suppressContentEditableWarning
                    className="min-h-[200px] p-3 bg-secondary border border-border rounded-b-md text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary prose prose-invert max-w-none"
                    style={{ lineHeight: "1.6" }}
                    dangerouslySetInnerHTML={post?.content ? { __html: post.content } : undefined}
                />
            </div>

            {/* Tags */}
            <div>
                <label className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                    <TagIcon className="h-3 w-3" /> Теги (через запятую)
                </label>
                <Input
                    value={tagsStr}
                    onChange={(e) => setTagsStr(e.target.value)}
                    placeholder="Релиз, Гайд, Новости"
                    className="bg-secondary border-border"
                />
            </div>

            {/* Cover image */}
            <div>
                <label className="text-xs text-muted-foreground mb-1 block">URL обложки (необязательно)</label>
                <Input
                    value={coverImage}
                    onChange={(e) => setCoverImage(e.target.value)}
                    placeholder="https://..."
                    className="bg-secondary border-border"
                />
            </div>

            {/* Published status — admin only */}
            {isAdmin && (
                <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                        type="checkbox"
                        checked={published}
                        onChange={(e) => setPublished(e.target.checked)}
                        className="accent-primary w-4 h-4"
                    />
                    <span className="text-sm text-foreground">Опубликовано</span>
                </label>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-2">
                <Button onClick={handleSave} disabled={loading} className="gap-2 flex-1">
                    <Save className="h-4 w-4" />
                    {loading ? "Сохранение..." : isAdmin ? "Сохранить" : "Отправить на модерацию"}
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
