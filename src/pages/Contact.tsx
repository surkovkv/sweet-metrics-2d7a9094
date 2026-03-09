import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Mail, User, MessageSquare, Send, CheckCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import ManaLensNavbar from "@/components/ManaLensNavbar";
import { sendContact } from "@/hooks/useContacts";
import { useAuth } from "@/hooks/useAuth";
import { useT } from "@/i18n/useTranslation";

const Contact = () => {
    const { user, profile, loading: authLoading } = useAuth();
    const navigate = useNavigate();
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const [sent, setSent] = useState(false);
    const [message, setMessage] = useState("");
    const t = useT();

    useEffect(() => {
        if (!authLoading && !user) {
            navigate("/auth", { replace: true });
        }
    }, [user, authLoading, navigate]);

    if (authLoading || !user) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    const nameToSubmit = profile?.nickname || "Аноним";
    const emailToSubmit = user.email || "";

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!message.trim()) return;

        setLoading(true);
        const { error } = await sendContact({
            name: nameToSubmit,
            email: emailToSubmit,
            message: message.trim(),
        });
        setLoading(false);

        if (error) {
            toast({ title: t("contact.sendError"), description: error.message, variant: "destructive" });
        } else {
            setSent(true);
        }
    };

    return (
        <div className="min-h-screen bg-background">
            <ManaLensNavbar />

            <main className="container mx-auto px-4 pt-28 pb-16 max-w-2xl">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
                        <Mail className="h-4 w-4" />
                        {t("contact.badge")}
                    </div>
                    <h1 className="font-display text-4xl font-bold text-foreground mb-3">{t("contact.title")}</h1>
                    <p className="text-muted-foreground text-lg mb-10">
                        {t("contact.subtitle")}
                    </p>

                    {sent ? (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="flex flex-col items-center gap-4 py-16 text-center"
                        >
                            <CheckCircle className="h-16 w-16 text-primary" />
                            <h2 className="font-display text-2xl font-bold text-foreground">
                                {t("contact.sentTitle")}
                            </h2>
                            <p className="text-muted-foreground">
                                {t("contact.sentDesc")}
                            </p>
                            <Button variant="outline" onClick={() => { setSent(false); setMessage(""); }}>
                                {t("contact.sendAnother")}
                            </Button>
                        </motion.div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div>
                                <label className="text-sm text-muted-foreground mb-1.5 block">{t("contact.nameLabel")}</label>
                                <div className="relative">
                                    <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        value={nameToSubmit}
                                        readOnly
                                        disabled
                                        className="pl-10 bg-secondary/50 border-border text-muted-foreground"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="text-sm text-muted-foreground mb-1.5 block">{t("contact.emailLabel")}</label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        type="email"
                                        value={emailToSubmit}
                                        readOnly
                                        disabled
                                        className="pl-10 bg-secondary/50 border-border text-muted-foreground"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="text-sm text-muted-foreground mb-1.5 block">{t("contact.messageLabel")}</label>
                                <div className="relative">
                                    <MessageSquare className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                    <textarea
                                        value={message}
                                        onChange={(e) => setMessage(e.target.value)}
                                        placeholder={t("contact.messagePlaceholder")}
                                        rows={6}
                                        required
                                        className="w-full rounded-md border border-border bg-secondary pl-10 pr-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary resize-none"
                                    />
                                </div>
                            </div>

                            <Button type="submit" disabled={loading} className="w-full h-11 gap-2 font-semibold">
                                <Send className="h-4 w-4" />
                                {loading ? t("contact.sending") : t("contact.sendBtn")}
                            </Button>
                        </form>
                    )}
                </motion.div>
            </main>
        </div>
    );
};

export default Contact;
