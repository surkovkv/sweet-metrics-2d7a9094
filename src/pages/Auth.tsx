import { useState } from "react";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, Mail, Lock, User, Check, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

type AuthMode = "login" | "signup" | "forgot";

// Требования к паролю
const PASSWORD_RULES = [
  { label: "Минимум 8 символов", test: (p: string) => p.length >= 8 },
  { label: "Заглавная буква (A–Z)", test: (p: string) => /[A-Z]/.test(p) },
  { label: "Строчная буква (a–z)", test: (p: string) => /[a-z]/.test(p) },
  { label: "Цифра (0–9)", test: (p: string) => /\d/.test(p) },
  { label: "Спецсимвол (@$!%*?&_#-)", test: (p: string) => /[@$!%*?&_#\-]/.test(p) },
];

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const isPasswordStrong = (p: string) => PASSWORD_RULES.every((r) => r.test(p));

const Auth = () => {
  const [mode, setMode] = useState<AuthMode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [nickname, setNickname] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showRules, setShowRules] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  // --- Валидация ---
  const validateEmail = () => emailRegex.test(email);

  const checkNicknameUnique = async (nick: string): Promise<boolean> => {
    const { data } = await supabase
      .from("profiles")
      .select("id")
      .eq("nickname", nick.trim())
      .maybeSingle();
    return !data; // true = уникален
  };

  // --- Обработчики ---
  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) return;
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      toast({ title: "Ошибка входа", description: error.message, variant: "destructive" });
    } else {
      navigate("/");
    }
  };

  const handleSignup = async () => {
    if (!nickname.trim()) {
      toast({ title: "Введи никнейм", variant: "destructive" });
      return;
    }
    if (!validateEmail()) {
      toast({ title: "Некорректный email", description: "Формат: name@domain.tld", variant: "destructive" });
      return;
    }
    if (!isPasswordStrong(password)) {
      toast({ title: "Пароль не соответствует требованиям", variant: "destructive" });
      return;
    }
    if (password !== confirmPassword) {
      toast({ title: "Пароли не совпадают", variant: "destructive" });
      return;
    }

    setLoading(true);

    const isUnique = await checkNicknameUnique(nickname);
    if (!isUnique) {
      setLoading(false);
      toast({ title: "Никнейм уже занят", description: "Выбери другой никнейм", variant: "destructive" });
      return;
    }

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { nickname: nickname.trim() },
        emailRedirectTo: window.location.origin,
      },
    });
    setLoading(false);

    if (error) {
      toast({ title: "Ошибка регистрации", description: error.message, variant: "destructive" });
    } else {
      toast({
        title: "Проверь почту!",
        description: "Мы отправили письмо для подтверждения аккаунта",
      });
    }
  };

  const handleForgotPassword = async () => {
    if (!email.trim()) return;
    if (!validateEmail()) {
      toast({ title: "Некорректный email", variant: "destructive" });
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);
    if (error) {
      toast({ title: "Ошибка", description: error.message, variant: "destructive" });
    } else {
      toast({
        title: "Письмо отправлено",
        description: "Проверь почту — там ссылка для смены пароля",
      });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === "login") handleLogin();
    else if (mode === "signup") handleSignup();
    else handleForgotPassword();
  };

  const passwordStrength = password
    ? PASSWORD_RULES.filter((r) => r.test(password)).length
    : 0;

  const strengthLabel = passwordStrength <= 2 ? "Слабый" : passwordStrength <= 4 ? "Средний" : "Сильный";
  const strengthColor = passwordStrength <= 2 ? "bg-destructive" : passwordStrength <= 4 ? "bg-yellow-500" : "bg-green-500";

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
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
            <CardTitle className="font-display text-xl">
              {mode === "login" && "Вход в аккаунт"}
              {mode === "signup" && "Регистрация"}
              {mode === "forgot" && "Восстановление пароля"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">

              {/* Никнейм — только при регистрации */}
              {mode === "signup" && (
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value)}
                    placeholder="Никнейм (уникальный)"
                    className="pl-10 bg-secondary border-border"
                    required
                    maxLength={32}
                  />
                </div>
              )}

              {/* Email */}
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email"
                  className={`pl-10 bg-secondary border-border ${email && !validateEmail() ? "border-destructive" : ""
                    }`}
                  required
                />
                {email && !validateEmail() && (
                  <p className="text-xs text-destructive mt-1">Формат: name@domain.tld</p>
                )}
              </div>

              {/* Пароль */}
              {mode !== "forgot" && (
                <div className="space-y-2">
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      onFocus={() => mode === "signup" && setShowRules(true)}
                      placeholder="Пароль"
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

                  {/* Индикатор силы + правила — только при регистрации */}
                  {mode === "signup" && password && (
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
                      {showRules && (
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
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Подтверждение пароля — только при регистрации */}
              {mode === "signup" && (
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
              )}

              {/* Забыли пароль */}
              {mode === "login" && (
                <button
                  type="button"
                  onClick={() => setMode("forgot")}
                  className="text-sm text-primary hover:underline block w-full text-right"
                >
                  Забыл пароль?
                </button>
              )}

              <Button
                type="submit"
                className="w-full h-11 font-semibold"
                disabled={loading || (mode === "signup" && (
                  !isPasswordStrong(password) || password !== confirmPassword || !validateEmail()
                ))}
              >
                {loading
                  ? "Загрузка..."
                  : mode === "login"
                    ? "Войти"
                    : mode === "signup"
                      ? "Зарегистрироваться"
                      : "Отправить письмо"}
              </Button>
            </form>

            <div className="mt-6 text-center text-sm text-muted-foreground">
              {mode === "login" ? (
                <>
                  Нет аккаунта?{" "}
                  <button onClick={() => setMode("signup")} className="text-primary hover:underline">
                    Зарегистрируйся
                  </button>
                </>
              ) : (
                <>
                  Уже есть аккаунт?{" "}
                  <button onClick={() => setMode("login")} className="text-primary hover:underline">
                    Войти
                  </button>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default Auth;
