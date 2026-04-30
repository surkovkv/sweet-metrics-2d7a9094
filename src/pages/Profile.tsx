import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { User, Mail, Crown, Save } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import ManaLensNavbar from "@/components/ManaLensNavbar";
import { useToast } from "@/hooks/use-toast";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

const Profile = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [nicknameEdit, setNicknameEdit] = useState("");
  const [savingNickname, setSavingNickname] = useState(false);

  useEffect(() => {
    setNicknameEdit(profile?.nickname || "");
  }, [profile?.nickname]);

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

  return (
    <div className="min-h-screen bg-background">
      <ManaLensNavbar />

      <main className="container mx-auto px-4 pt-28 pb-16 max-w-4xl">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
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
        </motion.div>
      </main>
    </div>
  );
};

export default Profile;
