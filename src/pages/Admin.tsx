import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Shield, MessageSquare, Settings, ToggleLeft, ToggleRight, Loader2, RefreshCcw, Users, Trash2, Image as ImageIcon } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import ManaLensNavbar from "@/components/ManaLensNavbar";
import { Contact } from "@/hooks/useContacts";

const sb = supabase as any;

type ContactWithAttachments = Contact & { attachments?: string[] };

export default function Admin() {
    const { user, profile, loading: authLoading, isAdmin, refreshProfile } = useAuth();
    const navigate = useNavigate();
    const { toast } = useToast();

    const [contacts, setContacts] = useState<ContactWithAttachments[]>([]);
    const [loadingData, setLoadingData] = useState(false);
    const [syncLoading, setSyncLoading] = useState(false);
    const [userStats, setUserStats] = useState<{ total: number; pro: number } | null>(null);

    useEffect(() => {
        if (!authLoading && !isAdmin) {
            navigate("/", { replace: true });
        }
    }, [isAdmin, authLoading, navigate]);

    const fetchData = async () => {
        if (!isAdmin) return;
        setLoadingData(true);

        const [contactsRes, statsRes] = await Promise.all([
            sb.from("contacts").select("*").order("created_at", { ascending: false }),
            sb.from("profiles").select("is_pro"),
        ]);

        if (contactsRes.data) setContacts(contactsRes.data);
        if (statsRes.data) {
            setUserStats({
                total: statsRes.data.length,
                pro: statsRes.data.filter((p: any) => p.is_pro).length,
            });
        }

        setLoadingData(false);
    };

    useEffect(() => {
        fetchData();
    }, [isAdmin]);

    const deleteContact = async (id: string) => {
        if (!confirm("Удалить сообщение?")) return;
        const { error } = await sb.from("contacts").delete().eq("id", id);
        if (error) {
            toast({ title: "Ошибка", description: error.message, variant: "destructive" });
        } else {
            toast({ title: "Удалено" });
            fetchData();
        }
    };

    const toggleProStatus = async () => {
        if (!user) return;
        const newStatus = !profile?.is_pro;
        const { error } = await sb.from("profiles").update({ is_pro: newStatus }).eq("user_id", user.id);
        if (error) {
            toast({ title: "Ошибка", description: error.message, variant: "destructive" });
        } else {
            toast({ title: "PRO Статус обновлен", description: `Теперь статус PRO: ${newStatus}` });
            await refreshProfile();
            await fetchData();
        }
    };

    const triggerHsguruFetch = async () => {
        setSyncLoading(true);
        try {
            const { data, error } = await supabase.functions.invoke("scrape-hsguru");
            if (error) throw error;
            if (data?.success) {
                const summary = (data.summary || []) as Array<{ rank: string; period: string; archetypes: number; matchups: number }>;
                const desc = summary
                    .map((s) => `${s.rank}/${s.period}: ${s.archetypes}a/${s.matchups}m`)
                    .join(" · ") || `date=${data.date}`;
                toast({
                    title: "Синхронизация завершена",
                    description: `${desc} (${data.date})`,
                });
            } else {
                toast({
                    title: "Ошибка синхронизации",
                    description: data?.error || "Неизвестная ошибка",
                    variant: "destructive",
                });
            }
        } catch (err: any) {
            toast({
                title: "Ошибка",
                description: err.message || "Не удалось выполнить синхронизацию",
                variant: "destructive",
            });
        } finally {
            setSyncLoading(false);
        }
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

                    {userStats && (
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                            <Card className="bg-card border-border">
                                <CardContent className="p-4 flex items-center gap-3">
                                    <Users className="h-5 w-5 text-primary" />
                                    <div>
                                        <p className="text-2xl font-bold text-foreground">{userStats.total}</p>
                                        <p className="text-xs text-muted-foreground">Пользователей</p>
                                    </div>
                                </CardContent>
                            </Card>
                            <Card className="bg-card border-border">
                                <CardContent className="p-4 flex items-center gap-3">
                                    <Shield className="h-5 w-5 text-primary" />
                                    <div>
                                        <p className="text-2xl font-bold text-foreground">{userStats.pro}</p>
                                        <p className="text-xs text-muted-foreground">PRO</p>
                                    </div>
                                </CardContent>
                            </Card>
                            <Card className="bg-card border-border">
                                <CardContent className="p-4 flex items-center gap-3">
                                    <MessageSquare className="h-5 w-5 text-primary" />
                                    <div>
                                        <p className="text-2xl font-bold text-foreground">{contacts.length}</p>
                                        <p className="text-xs text-muted-foreground">Сообщений</p>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    )}

                    <Tabs defaultValue="contacts" className="space-y-6">
                        <TabsList className="bg-secondary">
                            <TabsTrigger value="contacts" className="gap-2"><MessageSquare className="h-4 w-4" /> Сообщения</TabsTrigger>
                            <TabsTrigger value="settings" className="gap-2"><Settings className="h-4 w-4" /> Инструменты</TabsTrigger>
                        </TabsList>

                        <TabsContent value="contacts">
                            <Card className="bg-card border-border">
                                <CardHeader>
                                    <CardTitle>Обратная связь</CardTitle>
                                    <CardDescription>Сообщения из раздела «Связаться с нами»</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    {contacts.length === 0 ? (
                                        <p className="text-muted-foreground text-center py-4">Нет сообщений.</p>
                                    ) : (
                                        <div className="space-y-4">
                                            {contacts.map(msg => (
                                                <div key={msg.id} className="p-4 rounded-lg bg-secondary/50 border border-border">
                                                    <div className="flex justify-between items-start mb-2 gap-3">
                                                        <div className="min-w-0 flex-1">
                                                            <p className="font-semibold text-foreground truncate">{msg.name}</p>
                                                            <p className="text-xs text-muted-foreground truncate">{msg.email}</p>
                                                        </div>
                                                        <div className="flex items-center gap-2 shrink-0">
                                                            <span className="text-xs text-muted-foreground">{new Date(msg.created_at).toLocaleString("ru-RU")}</span>
                                                            <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => deleteContact(msg.id)}>
                                                                <Trash2 className="h-3.5 w-3.5" />
                                                            </Button>
                                                        </div>
                                                    </div>
                                                    <div className="p-3 bg-background rounded-md text-sm text-foreground whitespace-pre-wrap border border-border">
                                                        {msg.message}
                                                    </div>
                                                    {msg.attachments && msg.attachments.length > 0 && (
                                                        <div className="flex flex-wrap gap-2 mt-3">
                                                            {msg.attachments.map((url, i) => (
                                                                <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="block group">
                                                                    <img src={url} alt={`Скрин ${i + 1}`} className="h-20 w-20 object-cover rounded border border-border group-hover:border-primary transition-colors" />
                                                                </a>
                                                            ))}
                                                            <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                                                <ImageIcon className="h-3 w-3" /> {msg.attachments.length}
                                                            </span>
                                                        </div>
                                                    )}
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
                                            <p className="text-sm text-muted-foreground">Принудительно загрузить свежие данные HSGuru (12 запросов)</p>
                                        </div>
                                        <Button onClick={triggerHsguruFetch} disabled={syncLoading}>
                                            {syncLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                                            {syncLoading ? "Синхронизация..." : "Синхронизировать"}
                                        </Button>
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        Автосинк выполняется ежедневно в 06:00 UTC.
                                    </p>
                                </CardContent>
                            </Card>
                        </TabsContent>

                    </Tabs>
                </motion.div>
            </main>
        </div>
    );
}
