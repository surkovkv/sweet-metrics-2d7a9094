import { useState } from "react";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, Mail, Lock, User, Check, X, ArrowLeft } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useT } from "@/i18n/useTranslation";

type AuthMode = "login" | "signup" | "forgot";

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const NICKNAME_RULES = [
  { key: "auth.nickRule1", test: (n: string) => n.length >= 3 && n.length <= 20 },
  { key: "auth.nickRule2", test: (n: string) => /^[a-zA-Z0-9_-]*$/.test(n) },
  { key: "auth.nickRule3", test: (n: string) => /^[a-zA-Z]/.test(n) },
  { key: "auth.nickRule4", test: (n: string) => !/\s/.test(n) },
];

const isNicknameValid = (n: string) => NICKNAME_RULES.every((r) => r.test(n));

const Auth = () => {
  const t = useT();

  const PASSWORD_RULES = [
    { label: t("auth.pwdRule1"), test: (p: string) => p.length >= 8 },
    { label: t("auth.pwdRule2"), test: (p: string) => /[A-Z]/.test(p) },
    { label: t("auth.pwdRule3"), test: (p: string) => /[a-z]/.test(p) },
    { label: t("auth.pwdRule4"), test: (p: string) => /\d/.test(p) },
    { label: t("auth.pwdRule5"), test: (p: string) => /[@$!%*?&_#\-]/.test(p) },
  ];

  const isPasswordStrong = (p: string) => PASSWORD_RULES.every((r) => r.test(p));

  const [mode, setMode] = useState<AuthMode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [nickname, setNickname] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showRules, setShowRules] = useState(false);
  const [showNickRules, setShowNickRules] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const validateEmail = () => emailRegex.test(email);

  const checkNicknameUnique = async (nick: string): Promise<boolean> => {
    const { data } = await (supabase as any)
      .from("profiles")
      .select("id")
      .ilike("nickname", nick.trim())
      .maybeSingle();
    return !data;
  };

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) return;
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      toast({ title: t("auth.loginError"), description: error.message, variant: "destructive" });
    } else {
      navigate("/");
    }
  };

  const handleSignup = async () => {
    if (!nickname.trim() || !isNicknameValid(nickname)) {
      toast({ title: t("auth.enterNickname"), variant: "destructive" });
      return;
    }
    if (!validateEmail()) {
      toast({ title: t("auth.invalidEmail"), description: t("auth.emailError"), variant: "destructive" });
      return;
    }
    if (!isPasswordStrong(password)) {
      toast({ title: t("auth.passwordWeak"), variant: "destructive" });
      return;
    }
    if (password !== confirmPassword) {
      toast({ title: t("auth.passwordMismatch"), variant: "destructive" });
      return;
    }

    setLoading(true);
    const isUnique = await checkNicknameUnique(nickname);
    if (!isUnique) {
      setLoading(false);
      toast({ title: t("auth.nicknameTaken"), description: t("auth.nicknameChooseOther"), variant: "destructive" });
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
      toast({ title: t("auth.signupError"), description: error.message, variant: "destructive" });
    } else {
      toast({ title: t("auth.checkEmail"), description: t("auth.checkEmailDesc") });
    }
  };

  const handleForgotPassword = async () => {
    if (!email.trim()) return;
    if (!validateEmail()) {
      toast({ title: t("auth.invalidEmail"), variant: "destructive" });
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);
    if (error) {
      toast({ title: t("auth.forgotError"), description: error.message, variant: "destructive" });
    } else {
      toast({ title: t("auth.resetSent"), description: t("auth.resetSentDesc") });
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

  const strengthLabel = passwordStrength <= 2 ? t("auth.pwdWeak") : passwordStrength <= 4 ? t("auth.pwdMedium") : t("auth.pwdStrong");
  const strengthColor = passwordStrength <= 2 ? "bg-destructive" : passwordStrength <= 4 ? "bg-yellow-500" : "bg-green-500";

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8 relative min-h-[80px]">
          <Button 
            variant="ghost" 
            size="sm" 
            className="absolute left-0 top-0 text-muted-foreground hover:text-foreground"
            onClick={() => navigate("/")}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t("auth.backToHome")}
          </Button>

          <Link to="/" className="inline-flex items-center gap-2 mt-12">
            <div className="h-10 w-10 rounded-lg bg-primary flex items-center justify-center">
              <span className="font-display text-sm font-bold text-primary-foreground">TH</span>
            </div>
            <span className="font-display text-2xl font-bold text-foreground">
              Tourney<span className="text-primary">Helper</span>
            </span>
          </Link>
        </div>

        <Card className="bg-card border-border">
          <CardHeader className="text-center">
            <CardTitle className="font-display text-xl">
              {mode === "login" && t("auth.login")}
              {mode === "signup" && t("auth.signup")}
              {mode === "forgot" && t("auth.forgot")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">

              {/* Nickname — signup only */}
              {mode === "signup" && (
                <div className="space-y-2">
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      value={nickname}
                      onChange={(e) => setNickname(e.target.value)}
                      onFocus={() => setShowNickRules(true)}
                      placeholder={t("auth.nicknamePlaceholder")}
                      className="pl-10 bg-secondary border-border"
                      required
                      maxLength={20}
                    />
                  </div>
                  {showNickRules && nickname && (
                    <ul className="space-y-1">
                      {NICKNAME_RULES.map((rule) => {
                        const ok = rule.test(nickname);
                        return (
                          <li key={rule.key} className={`flex items-center gap-1.5 text-xs ${ok ? "text-green-500" : "text-muted-foreground"}`}>
                            {ok ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                            {t(rule.key)}
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              )}

              {/* Email */}
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t("auth.emailPlaceholder")}
                  className={`pl-10 bg-secondary border-border ${email && !validateEmail() ? "border-destructive" : ""}`}
                  required
                />
              </div>

              {/* Password */}
              {mode !== "forgot" && (
                <div className="space-y-2">
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      onFocus={() => mode === "signup" && setShowRules(true)}
                      placeholder={t("auth.passwordPlaceholder")}
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

              {/* Confirm password */}
              {mode === "signup" && (
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    type={showConfirm ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder={t("auth.confirmPlaceholder")}
                    className={`pl-10 pr-10 bg-secondary border-border ${confirmPassword && confirmPassword !== password ? "border-destructive" : ""}`}
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
                    <p className="text-xs text-destructive mt-1">{t("auth.passwordMismatch")}</p>
                  )}
                </div>
              )}

              {mode === "login" && (
                <button
                  type="button"
                  onClick={() => setMode("forgot")}
                  className="text-sm text-primary hover:underline block w-full text-right"
                >
                  {t("auth.forgotLink")}
                </button>
              )}

              <Button
                type="submit"
                className="w-full h-11 font-semibold"
                disabled={loading || (mode === "signup" && (
                  !isPasswordStrong(password) || password !== confirmPassword || !validateEmail() || !isNicknameValid(nickname)
                ))}
              >
                {loading
                  ? t("auth.loading")
                  : mode === "login"
                    ? t("auth.loginBtn")
                    : mode === "signup"
                      ? t("auth.signupBtn")
                      : t("auth.sendEmailBtn")}
              </Button>
            </form>

            <div className="mt-6 text-center text-sm text-muted-foreground">
              {mode === "login" ? (
                <>
                  {t("auth.noAccount")}{" "}
                  <button onClick={() => setMode("signup")} className="text-primary hover:underline">
                    {t("auth.signupLink")}
                  </button>
                </>
              ) : (
                <>
                  {t("auth.haveAccount")}{" "}
                  <button onClick={() => setMode("login")} className="text-primary hover:underline">
                    {t("auth.loginLink")}
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
