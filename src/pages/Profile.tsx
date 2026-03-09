import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  User, Mail, Newspaper, MessageSquare,
  Plus, Pencil, Trash2, Loader2, Eye, EyeOff, Crown, Save
} from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import ManaLensNavbar from "@/components/ManaLensNavbar";
import NewsEditor from "@/components/NewsEditor";
import { useMyNewsPosts, deleteNewsPost, type NewsPost } from "@/hooks/useNewsPosts";
import { useContacts } from "@/hooks/useContacts";
import { useToast } from "@/hooks/use-toast";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

type Tab = "profile" | "articles" | "messages";

const Profile = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [tab, setTab] = useState<Tab>("profile");
  const [editing, setEditing] = useState<NewsPost | null | "new">(null);

  const { posts, loading: postsLoading, refetch } = useMyNewsPosts(user?.id);
  const { contacts, loading: contactsLoading, fetch: fetchContacts } = useContacts();

  const [nicknameEdit, setNicknameEdit] = useState("");
  const [savingNickname, setSavingNickname] = useState(false);

  useEffect(() => {
    setNicknameEdit(profile?.nickname || "");
  }, [profile?.nickname]);

  useEffect(() => {
    if (tab === "messages") fetchContacts();
  }, [tab]);

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <ManaLensNavbar />
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Необходима авторизация</p>
          <Button onClick={() => navigate("/auth")}>Войти</Button>
        </div>
      </div>
    );
  }

  const initial = (profile?.nickname?.[0] || user.email?.[0] || "U").toUpperCase();

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: "profile", label: "Профиль", icon: <User className="h-4 w-4" /> },
    { id: "articles", label: "Статьи", icon: <Newspaper className="h-4 w-4" /> },
    { id: "messages", label: "Сообщения", icon: <MessageSquare className="h-4 w-4" /> },
  ];

  const handleDelete = async (id: string) => {
    if (!confirm("Удалить статью?")) return;
    const { error } = await deleteNewsPost(id);
    if (error) {
      toast({ title: "Ошибка удаления", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Статья удалена" });
      refetch();
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <ManaLensNavbar />

      <main className="container mx-auto px-4 pt-28 pb-16 max-w-4xl">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>

          {/* Шапка кабинета */}
          <div className="flex items-center gap-5 mb-8">
            <div className="h-16 w-16 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-2xl shrink-0">
              {initial}
            </div>
            <div>
              <h1 className="font-display text-2xl font-bold text-foreground">
                {profile?.nickname || "Игрок"}
              </h1>
              <p className="text-sm text-muted-foreground">{user.email}</p>
            </div>
          </div>

          {/* Вкладки */}
          <div className="flex gap-1 p-1 bg-secondary rounded-lg mb-8 w-fit">
            {tabs.map((t) => (
              <button
                key={t.id}
                onClick={() => { setTab(t.id); setEditing(null); }}
                className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${tab === t.id
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
                  }`}
              >
                {t.icon}
                {t.label}
              </button>
            ))}
          </div>

          {/* Вкладка: Профиль */}
          {tab === "profile" && (
            <Card className="bg-card border-border max-w-md">
              <CardHeader className="pb-2">
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                  Информация об аккаунте
                </p>
              </CardHeader>
              <CardContent className="space-y-3">

                {/* Никнейм */}
                <div className="p-3 rounded-lg bg-secondary space-y-2">
                  <div className="flex items-center gap-3">
                    <User className="h-5 w-5 text-primary shrink-0" />
                    <div className="flex-1">
                      <p className="text-xs text-muted-foreground">Никнейм</p>
                      {profile?.is_pro ? (
                        <div className="flex items-center gap-2 mt-1">
                          <Input
                            value={nicknameEdit}
                            onChange={(e) => setNicknameEdit(e.target.value)}
                            className="h-7 text-sm bg-background border-border px-2"
                            maxLength={32}
                          />
                          <Button
                            size="sm"
                            className="h-7 px-2 gap-1 text-xs"
                            disabled={savingNickname || nicknameEdit === profile?.nickname || !nicknameEdit.trim()}
                            onClick={async () => {
                              setSavingNickname(true);
                              const { error } = await (supabase as any)
                                .from("profiles")
                                .update({ nickname: nicknameEdit.trim() })
                                .eq("user_id", user.id);
                              setSavingNickname(false);
                              if (error) {
                                toast({ title: "Ошибка", description: error.message, variant: "destructive" });
                              } else {
                                toast({ title: "Никнейм обновлён" });
                              }
                            }}
                          >
                            <Save className="h-3 w-3" />
                            {savingNickname ? "..." : "Сохранить"}
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 mt-0.5">
                          <p className="text-sm font-medium text-foreground">{profile?.nickname || "—"}</p>
                          <Link
                            to="/upgrade"
                            className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                          >
                            <Crown className="h-3 w-3" /> PRO
                          </Link>
                        </div>
                      )}
                    </div>
                  </div>
                  {!profile?.is_pro && (
                    <p className="text-xs text-muted-foreground pl-8">
                      Изменение никнейма доступно на тарифе{" "}
                      <Link to="/upgrade" className="text-primary hover:underline">PRO</Link>
                    </p>
                  )}
                </div>

                {/* Email */}
                <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary">
                  <Mail className="h-5 w-5 text-primary shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground">Email</p>
                    <p className="text-sm font-medium text-foreground">{user.email}</p>
                  </div>
                </div>

              </CardContent>
            </Card>
          )}

          {/* Вкладка: Статьи */}
          {tab === "articles" && (
            <div className="space-y-4">
              {/* Редактор */}
              {editing !== null && (
                <NewsEditor
                  post={editing === "new" ? null : editing}
                  onSave={() => { setEditing(null); refetch(); }}
                  onCancel={() => setEditing(null)}
                />
              )}

              {/* Кнопка создания */}
              {editing === null && (
                <Button onClick={() => setEditing("new")} className="gap-2">
                  <Plus className="h-4 w-4" /> Написать статью
                </Button>
              )}

              {/* Список статей */}
              {postsLoading ? (
                <div className="flex items-center gap-2 py-8 text-muted-foreground">
                  <Loader2 className="h-5 w-5 animate-spin" /> Загрузка...
                </div>
              ) : posts.length === 0 ? (
                <div className="text-center py-16 text-muted-foreground border border-dashed border-border rounded-xl">
                  <Newspaper className="h-10 w-10 mx-auto mb-3 opacity-30" />
                  <p>У тебя ещё нет статей</p>
                  <p className="text-sm mt-1">Нажми «Написать статью», чтобы создать первую</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {posts.map((post) => (
                    <div
                      key={post.id}
                      className="flex items-center justify-between gap-4 p-4 bg-card border border-border rounded-xl hover:border-primary/30 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          {post.published ? (
                            <Eye className="h-3.5 w-3.5 text-primary shrink-0" />
                          ) : (
                            <EyeOff className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                          )}
                          <p className="text-sm font-medium text-foreground truncate">
                            {post.title}
                          </p>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {new Date(post.created_at).toLocaleDateString("ru-RU")} · /{post.slug}
                        </p>
                      </div>
                      <div className="flex gap-2 shrink-0">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8"
                          onClick={() => setEditing(post)}
                          title="Редактировать"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => handleDelete(post.id)}
                          title="Удалить"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Вкладка: Сообщения */}
          {tab === "messages" && (
            <div className="space-y-3">
              {contactsLoading ? (
                <div className="flex items-center gap-2 py-8 text-muted-foreground">
                  <Loader2 className="h-5 w-5 animate-spin" /> Загрузка...
                </div>
              ) : contacts.length === 0 ? (
                <div className="text-center py-16 text-muted-foreground border border-dashed border-border rounded-xl">
                  <MessageSquare className="h-10 w-10 mx-auto mb-3 opacity-30" />
                  <p>Сообщений пока нет</p>
                </div>
              ) : (
                contacts.map((c) => (
                  <Card key={c.id} className="bg-card border-border">
                    <CardContent className="pt-4 pb-4 space-y-2">
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-primary shrink-0" />
                          <span className="text-sm font-medium text-foreground">{c.name}</span>
                          <span className="text-xs text-muted-foreground">&lt;{c.email}&gt;</span>
                        </div>
                        <span className="text-xs text-muted-foreground shrink-0">
                          {new Date(c.created_at).toLocaleDateString("ru-RU")}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground leading-relaxed pl-6">
                        {c.message}
                      </p>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          )}

        </motion.div>
      </main>
    </div>
  );
};

export default Profile;
