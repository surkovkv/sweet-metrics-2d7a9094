import { motion } from "framer-motion";
import { Newspaper, Loader2 } from "lucide-react";
import ManaLensNavbar from "@/components/ManaLensNavbar";
import NewsCard from "@/components/NewsCard";
import { useNewsPosts } from "@/hooks/useNewsPosts";
import { newsPosts as staticPosts } from "@/data/news";

const News = () => {
    const { posts, loading, error } = useNewsPosts();

    // Fallback to static data when Supabase returns empty or errors
    const displayPosts = (!loading && (error || posts.length === 0))
        ? staticPosts.map((p, i) => ({
            id: p.id.toString(),
            slug: p.slug,
            title: p.title,
            summary: p.summary,
            content: p.content,
            created_at: p.date,
            author_name: p.author,
            tags: p.tags,
            cover_image: p.coverImage ?? null,
            published: true,
            author_id: null,
            updated_at: p.date,
        }))
        : posts;

    return (
        <div className="min-h-screen bg-background">
            <ManaLensNavbar />

            <main className="container mx-auto px-4 pt-28 pb-16 max-w-5xl">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="mb-12"
                >
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
                        <Newspaper className="h-4 w-4" />
                        Новости и обновления
                    </div>
                    <h1 className="font-display text-4xl md:text-5xl font-bold text-foreground mb-4">
                        Новости
                    </h1>
                    <p className="text-muted-foreground text-lg max-w-2xl">
                        Следи за обновлениями платформы, гайдами по стратегии и патч-нотами.
                    </p>
                </motion.div>

                {loading && (
                    <div className="flex items-center justify-center py-24 text-muted-foreground gap-3">
                        <Loader2 className="h-6 w-6 animate-spin" />
                        <span>Загрузка новостей...</span>
                    </div>
                )}

                {!loading && displayPosts.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {displayPosts.map((post, i) => (
                            <NewsCard
                                key={post.id}
                                post={{
                                    id: 0,
                                    slug: post.slug,
                                    title: post.title,
                                    summary: post.summary,
                                    content: post.content,
                                    date: post.created_at.slice(0, 10),
                                    author: post.author_name,
                                    tags: post.tags ?? [],
                                    coverImage: post.cover_image ?? undefined,
                                }}
                                index={i}
                            />
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
};

export default News;
