import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Calendar, User, Tag, Newspaper, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import ManaLensNavbar from "@/components/ManaLensNavbar";
import { useNewsPost } from "@/hooks/useNewsPosts";

const NewsPost = () => {
    const { slug } = useParams<{ slug: string }>();
    const navigate = useNavigate();
    const { post, loading, error } = useNewsPost(slug ?? "");

    if (loading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <ManaLensNavbar />
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (error || !post) {
        return (
            <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-6 text-center px-4">
                <ManaLensNavbar />
                <Newspaper className="h-16 w-16 text-muted-foreground/40" />
                <h1 className="font-display text-3xl font-bold text-foreground">
                    Публикация не найдена
                </h1>
                <p className="text-muted-foreground">
                    Такой статьи не существует или она была удалена.
                </p>
                <Button onClick={() => navigate("/news")} variant="outline" className="gap-2">
                    <ArrowLeft className="h-4 w-4" /> Вернуться к новостям
                </Button>
            </div>
        );
    }

    const formattedDate = new Date(post.created_at).toLocaleDateString("ru-RU", {
        day: "numeric",
        month: "long",
        year: "numeric",
    });

    return (
        <div className="min-h-screen bg-background">
            <ManaLensNavbar />

            <main className="container mx-auto px-4 pt-28 pb-16 max-w-3xl">
                {/* Назад */}
                <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3 }}
                    className="mb-8"
                >
                    <button
                        onClick={() => navigate("/news")}
                        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Все новости
                    </button>
                </motion.div>

                {/* Обложка */}
                {post.cover_image && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.5 }}
                        className="mb-8 rounded-xl overflow-hidden aspect-video"
                    >
                        <img src={post.cover_image} alt={post.title} className="w-full h-full object-cover" />
                    </motion.div>
                )}

                {/* Заголовок и мета */}
                <motion.header
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                    className="mb-8"
                >
                    {post.tags && post.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-4">
                            {post.tags.map((tag) => (
                                <span
                                    key={tag}
                                    className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-0.5 rounded-full bg-primary/10 text-primary"
                                >
                                    <Tag className="h-3 w-3" />
                                    {tag}
                                </span>
                            ))}
                        </div>
                    )}

                    <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground leading-tight mb-6">
                        {post.title}
                    </h1>

                    <div className="flex flex-wrap items-center gap-5 text-sm text-muted-foreground pb-6 border-b border-border">
                        <span className="flex items-center gap-1.5">
                            <Calendar className="h-4 w-4" />
                            {formattedDate}
                        </span>
                        <span className="flex items-center gap-1.5">
                            <User className="h-4 w-4" />
                            {post.author_name}
                        </span>
                    </div>
                </motion.header>

                {/* Контент */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    className="prose prose-invert prose-sm md:prose-base max-w-none
            prose-headings:font-display prose-headings:text-foreground
            prose-p:text-muted-foreground prose-p:leading-relaxed
            prose-li:text-muted-foreground
            prose-strong:text-foreground
            prose-a:text-primary prose-a:no-underline hover:prose-a:underline"
                    dangerouslySetInnerHTML={{ __html: post.content }}
                />

                {/* Кнопка назад снизу */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.4, delay: 0.4 }}
                    className="mt-12 pt-8 border-t border-border"
                >
                    <Button onClick={() => navigate("/news")} variant="outline" className="gap-2">
                        <ArrowLeft className="h-4 w-4" /> Назад к новостям
                    </Button>
                </motion.div>
            </main>
        </div>
    );
};

export default NewsPost;
