import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Newspaper, Loader2, PlusCircle, Clock } from "lucide-react";
import ManaLensNavbar from "@/components/ManaLensNavbar";
import NewsCard from "@/components/NewsCard";
import NewsEditor from "@/components/NewsEditor";
import { useNewsPosts, useMyNewsPosts } from "@/hooks/useNewsPosts";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const News = () => {
    const { user, profile } = useAuth();
    const { posts, loading, error, refetch } = useNewsPosts();
    const { posts: myPosts, refetch: refetchMy } = useMyNewsPosts(user?.id);
    const [showEditor, setShowEditor] = useState(false);

    const myPending = myPosts.filter((p) => !p.published);
    const isAdmin = profile?.nickname === "admin";

    const handleSave = () => {
        setShowEditor(false);
        refetch();
        refetchMy();
    };

    return (
        <div className="min-h-screen bg-background">
            <ManaLensNavbar />

            <main className="container mx-auto px-4 pt-28 pb-16 max-w-5xl">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="mb-8"
                >
                    <div className="flex items-start justify-between gap-4 flex-wrap">
                        <div>
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
                        </div>

                        {user && !showEditor && (
                            <Button onClick={() => setShowEditor(true)} className="gap-2">
                                <PlusCircle className="h-4 w-4" />
                                Написать статью
                            </Button>
                        )}
                    </div>
                </motion.div>

                {/* Editor */}
                <AnimatePresence>
                    {showEditor && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="mb-10"
                        >
                            <NewsEditor
                                onSave={handleSave}
                                onCancel={() => setShowEditor(false)}
                                isAdmin={isAdmin}
                            />
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* My pending posts */}
                {user && myPending.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="mb-10"
                    >
                        <h2 className="font-display text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
                            <Clock className="h-5 w-5 text-yellow-500" />
                            Мои статьи на модерации ({myPending.length})
                        </h2>
                        <div className="space-y-3">
                            {myPending.map((post) => (
                                <Card key={post.id} className="bg-card border-border border-l-4 border-l-yellow-500">
                                    <CardContent className="p-4 flex items-center justify-between gap-4">
                                        <div>
                                            <p className="font-semibold text-foreground">{post.title}</p>
                                            <p className="text-xs text-muted-foreground mt-1">
                                                ID: <code className="bg-secondary px-1 rounded text-xs">{post.id}</code>
                                                {" · "}
                                                {new Date(post.created_at).toLocaleDateString()}
                                            </p>
                                        </div>
                                        <span className="flex items-center gap-1 text-xs bg-yellow-500/20 text-yellow-500 px-2 py-1 rounded-full whitespace-nowrap">
                                            <Clock className="h-3 w-3" /> На модерации
                                        </span>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </motion.div>
                )}

                {/* Loading state */}
                {loading && (
                    <div className="flex items-center justify-center py-24 text-muted-foreground gap-3">
                        <Loader2 className="h-6 w-6 animate-spin" />
                        <span>Загрузка новостей...</span>
                    </div>
                )}

                {error && !loading && (
                    <div className="text-center py-24 text-destructive">
                        <p>Ошибка загрузки: {error}</p>
                    </div>
                )}

                {!loading && !error && posts.length === 0 && (
                    <div className="text-center py-24 text-muted-foreground">
                        <Newspaper className="h-12 w-12 mx-auto mb-4 opacity-30" />
                        <p className="text-lg">Публикаций пока нет</p>
                        <p className="text-sm mt-1">Первая статья скоро появится!</p>
                    </div>
                )}

                {!loading && !error && posts.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {posts.map((post, i) => (
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
