import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Calendar, User, ArrowRight, Tag } from "lucide-react";
import type { NewsPost } from "@/types/news";

interface NewsCardProps {
    post: NewsPost;
    index?: number;
}

const NewsCard = ({ post, index = 0 }: NewsCardProps) => {
    const formattedDate = new Date(post.date).toLocaleDateString("ru-RU", {
        day: "numeric",
        month: "long",
        year: "numeric",
    });

    return (
        <motion.article
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: index * 0.1 }}
            className="group flex flex-col rounded-xl border border-border bg-card overflow-hidden hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300"
        >
            {/* Обложка */}
            {post.coverImage ? (
                <div className="h-48 overflow-hidden">
                    <img
                        src={post.coverImage}
                        alt={post.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                </div>
            ) : (
                <div className="h-2 bg-gradient-to-r from-primary/60 via-primary to-primary/60" />
            )}

            <div className="flex flex-col flex-1 p-6 gap-4">
                {/* Теги */}
                {post.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
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

                {/* Заголовок */}
                <h2 className="font-display text-xl font-bold text-foreground leading-snug group-hover:text-primary transition-colors">
                    {post.title}
                </h2>

                {/* Краткое описание */}
                <p className="text-sm text-muted-foreground leading-relaxed flex-1">
                    {post.summary}
                </p>

                {/* Мета */}
                <div className="flex items-center gap-4 text-xs text-muted-foreground pt-2 border-t border-border">
                    <span className="flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5" />
                        {formattedDate}
                    </span>
                    <span className="flex items-center gap-1.5">
                        <User className="h-3.5 w-3.5" />
                        {post.author}
                    </span>
                </div>

                {/* Кнопка */}
                <Link
                    to={`/news/${post.slug}`}
                    className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:gap-3 transition-all duration-200"
                >
                    Читать далее <ArrowRight className="h-4 w-4" />
                </Link>
            </div>
        </motion.article>
    );
};

export default NewsCard;
