import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { Lock, Eye, EyeOff, Check, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const PASSWORD_RULES = [
  { label: "Минимум 8 символов", test: (p: string) => p.length >= 8 },
  { label: "Заглавная буква (A–Z)", test: (p: string) => /[A-Z]/.test(p) },
  { label: "Строчная буква (a–z)", test: (p: string) => /[a-z]/.test(p) },
  { label: "Цифра (0–9)", test: (p: string) => /\d/.test(p) },
  { label: "Спецсимвол (@$!%*?&_#-)", test: (p: string) => /[@$!%*?&_#\-]/.test(p) },
];

const isPasswordStrong = (p: string) => PASSWORD_RULES.every((r) => r.test(p));

const ResetPassword = () => {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const hash = window.location.hash;
    if (!hash.includes("type=recovery")) {
      navigate("/auth");
    }
  }, [navigate]);

  const passwordStrength = password
    ? PASSWORD_RULES.filter((r) => r.test(password)).length
    : 0;
  const strengthLabel = passwordStrength <= 2 ? "Слабый" : passwordStrength <= 4 ? "Средний" : "Сильный";
  const strengthColor = passwordStrength <= 2 ? "bg-destructive" : passwordStrength <= 4 ? "bg-yellow-500" : "bg-green-500";

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isPasswordStrong(password)) {
      toast({ title: "Пароль не соответствует требованиям", variant: "destructive" });
      return;
    }
    if (password !== confirmPassword) {
      toast({ title: "Пароли не совпадают", variant: "destructive" });
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) {
      toast({ title: "Ошибка", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Пароль обновлён!", description: "Теперь войди с новым паролем" });
      navigate("/auth");
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-6">
            <div className="h-10 w-10 rounded-lg bg-primary flex items-center justify-center">
              <span className="font-display text-sm font-bold text-primary-foreground">TH</span>
            </div>
            <span className="font-display text-2xl font-bold text-foreground">
              Tourney<span className="text-primary">Helper2</span>
            </span>
          </Link>
        </div>

        <Card className="bg-card border-border">
          <CardHeader className="text-center">
            <CardTitle className="font-display text-xl">Новый пароль</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Придумай надёжный пароль для своего аккаунта
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleReset} className="space-y-4">
              {/* Новый пароль */}
              <div className="space-y-2">
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Новый пароль"
                    className="pl-10 pr-10 bg-secondary border-border"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>

                {/* Индикатор силы */}
                {password && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 rounded-full bg-secondary overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${strengthColor}`}
                          style={{ width: `${(passwordStrength / 5) * 100}%` }}
                        />
                      </div>
                      <span className="text-xs text-muted-foreground">{strengthLabel}</span>
                    </div>
                    <ul className="space-y-1">
                      {PASSWORD_RULES.map((rule) => {
                        const ok = rule.test(password);
                        return (
                          <li key={rule.label} className={`flex items-center gap-1.5 text-xs ${ok ? "text-green-500" : "text-muted-foreground"}`}>
                            {ok ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                            {rule.label}
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                )}
              </div>

              {/* Подтверждение пароля */}
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  type={showConfirm ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Повтори пароль"
                  className={`pl-10 pr-10 bg-secondary border-border ${confirmPassword && confirmPassword !== password ? "border-destructive" : ""
                    }`}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
                >
                  {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
                {confirmPassword && confirmPassword !== password && (
                  <p className="text-xs text-destructive mt-1">Пароли не совпадают</p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full h-11 font-semibold"
                disabled={loading || !isPasswordStrong(password) || password !== confirmPassword}
              >
                {loading ? "Сохранение..." : "Обновить пароль"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default ResetPassword;
