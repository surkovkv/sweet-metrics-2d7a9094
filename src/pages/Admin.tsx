import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Shield, MessageSquare, Newspaper, Settings, Check, X, ToggleLeft, ToggleRight, Loader2, RefreshCcw } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import ManaLensNavbar from "@/components/ManaLensNavbar";
import NewsEditor from "@/components/NewsEditor";
import { Contact } from "@/hooks/useContacts";
import { NewsPost } from "@/hooks/useNewsPosts";

export default function Admin() {
    const { user, profile, loading: authLoading } = useAuth();
    const navigate = useNavigate();
    const { toast } = useToast();

    const [contacts, setContacts] = useState<Contact[]>([]);
    const [news, setNews] = useState<NewsPost[]>([]);
    const [loadingData, setLoadingData] = useState(false);

    const isAdmin = profile?.nickname === "kikusadmin";
    const [editingPost, setEditingPost] = useState<NewsPost | null>(null);
    const [showNewEditor, setShowNewEditor] = useState(false);

    useEffect(() => {
        if (!authLoading && !isAdmin) {
            navigate("/", { replace: true });
        }
    }, [isAdmin, authLoading, navigate]);

    const fetchData = async () => {
        if (!isAdmin) return;
        setLoadingData(true);

        // Fetch contacts
        const { data: contactsData } = await supabase
            .from("contacts")
            .select("*")
            .order("created_at", { ascending: false });
        if (contactsData) setContacts(contactsData);

        // Fetch all news
        const { data: newsData } = await supabase
            .from("news_posts")
            .select("*")
            .order("created_at", { ascending: false });
        if (newsData) setNews(newsData);

        setLoadingData(false);
    };

    useEffect(() => {
        fetchData();
    }, [isAdmin]);

    const publishNews = async (id: string, publish: boolean) => {
        const { error } = await supabase.from("news_posts").update({ published: publish }).eq("id", id);
        if (error) {
            toast({ title: "Ошибка", description: error.message, variant: "destructive" });
        } else {
            toast({ title: "Успех", description: publish ? "Новость опубликована" : "Новость снята с публикации" });
            fetchData();
        }
    };

    const handleEditorSave = () => {
        setEditingPost(null);
        setShowNewEditor(false);
        fetchData();
    };

    const toggleProStatus = async () => {
        if (!user) return;
        const newStatus = !profile?.is_pro;
        const { error } = await supabase.from("profiles").update({ is_pro: newStatus }).eq("user_id", user.id);
        if (error) {
            toast({ title: "Ошибка", description: error.message, variant: "destructive" });
        } else {
            toast({ title: "PRO Статус обновлен", description: `Теперь статус PRO: ${newStatus}` });
            // Require refresh or useAuth reload to take effect immediately in other tabs
            setTimeout(() => window.location.reload(), 1000);
        }
    };

    const triggerHsguruFetch = () => {
        // Mock function for now, until backend is ready
        toast({ title: "Синхронизация", description: "Запрос к HSGuru отправлен (имитация)" });
    };

    if (authLoading || !isAdmin) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background">
            <ManaLensNavbar />

            <main className="container mx-auto px-4 pt-28 pb-16 max-w-5xl">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                    <div className="flex items-center gap-3 mb-8">
                        <div className="p-3 bg-primary/20 text-primary rounded-xl">
                            <Shield className="h-8 w-8" />
                        </div>
                        <div>
                            <h1 className="font-display text-3xl font-bold">Админ-панель</h1>
                            <p className="text-muted-foreground">Управление контентом и настройками</p>
                        </div>
                        <Button className="ml-auto" variant="outline" onClick={fetchData} disabled={loadingData}>
                            <RefreshCcw className={`h-4 w-4 mr-2 ${loadingData ? 'animate-spin' : ''}`} />
                            Обновить
                        </Button>
                    </div>

                    <Tabs defaultValue="news" className="space-y-6">
                        <TabsList className="bg-secondary">
                            <TabsTrigger value="news" className="gap-2"><Newspaper className="h-4 w-4" /> Новости</TabsTrigger>
                            <TabsTrigger value="contacts" className="gap-2"><MessageSquare className="h-4 w-4" /> Сообщения</TabsTrigger>
                            <TabsTrigger value="settings" className="gap-2"><Settings className="h-4 w-4" /> Инструменты</TabsTrigger>
                        </TabsList>

                        <TabsContent value="news" className="space-y-4">
                            <Card className="bg-card border-border">
                                <CardHeader>
                                    <CardTitle>Модерация новостей</CardTitle>
                                    <CardDescription>Одобрение или скрытие новостей от пользователей</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    {news.length === 0 ? (
                                        <p className="text-muted-foreground text-center py-4">Нет новостей.</p>
                                    ) : (
                                        <div className="space-y-4">
                                            {news.map(post => (
                                                <div key={post.id} className="p-4 rounded-lg bg-secondary/50 flex flex-col md:flex-row gap-4 items-start md:items-center justify-between border border-border">
                                                    <div>
                                                        <h3 className="font-semibold text-foreground flex items-center gap-2">
                                                            {post.title}
                                                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${post.published ? 'bg-green-500/20 text-green-500' : 'bg-yellow-500/20 text-yellow-500'}`}>
                                                                {post.published ? 'Опубликовано' : 'Ожидает'}
                                                            </span>
                                                        </h3>
                                                        <p className="text-xs text-muted-foreground mt-1">Автор: {post.author_name} · Дата: {new Date(post.created_at).toLocaleDateString()}</p>
                                                    </div>
                                                    <div className="flex gap-2 w-full md:w-auto">
                                                        {post.published ? (
                                                            <Button size="sm" variant="destructive" onClick={() => publishNews(post.id, false)} className="w-full md:w-auto">
                                                                <X className="h-4 w-4 mr-1" /> Скрыть
                                                            </Button>
                                                        ) : (
                                                            <Button size="sm" onClick={() => publishNews(post.id, true)} className="w-full md:w-auto bg-green-600 hover:bg-green-700 text-white">
                                                                <Check className="h-4 w-4 mr-1" /> Одобрить
                                                            </Button>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="contacts">
                            <Card className="bg-card border-border">
                                <CardHeader>
                                    <CardTitle>Обратная связь</CardTitle>
                                    <CardDescription>Сообщения из раздела "Связаться с нами"</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    {contacts.length === 0 ? (
                                        <p className="text-muted-foreground text-center py-4">Нет сообщений.</p>
                                    ) : (
                                        <div className="space-y-4">
                                            {contacts.map(msg => (
                                                <div key={msg.id} className="p-4 rounded-lg bg-secondary/50 border border-border">
                                                    <div className="flex justify-between items-start mb-2">
                                                        <div>
                                                            <p className="font-semibold text-foreground">{msg.name}</p>
                                                            <p className="text-xs text-muted-foreground">{msg.email}</p>
                                                        </div>
                                                        <span className="text-xs text-muted-foreground">{new Date(msg.created_at).toLocaleDateString()}</span>
                                                    </div>
                                                    <div className="p-3 bg-background rounded-md text-sm text-foreground whitespace-pre-wrap border border-border">
                                                        {msg.message}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="settings">
                            <Card className="bg-card border-border">
                                <CardHeader>
                                    <CardTitle>Тестирование и инструменты</CardTitle>
                                    <CardDescription>Специальные функции для проверки работы платформы</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <div className="flex items-center justify-between p-4 bg-secondary/50 rounded-lg border border-border">
                                        <div>
                                            <p className="font-semibold">Тарифный план (Тест)</p>
                                            <p className="text-sm text-muted-foreground">Переключить свой статус между FREE и PRO</p>
                                        </div>
                                        <Button variant={profile?.is_pro ? "default" : "outline"} onClick={toggleProStatus} className="gap-2">
                                            {profile?.is_pro ? <ToggleRight className="h-4 w-4" /> : <ToggleLeft className="h-4 w-4" />}
                                            {profile?.is_pro ? "PRO Активен" : "FREE Активен"}
                                        </Button>
                                    </div>
                                    <div className="flex items-center justify-between p-4 bg-secondary/50 rounded-lg border border-border">
                                        <div>
                                            <p className="font-semibold">Tournament Strategist</p>
                                            <p className="text-sm text-muted-foreground">Принудительно загрузить свежие данные HSGuru</p>
                                        </div>
                                        <Button onClick={triggerHsguruFetch}>
                                            Синхронизировать
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>

                    </Tabs>
                </motion.div>
            </main>
        </div>
    );
}
