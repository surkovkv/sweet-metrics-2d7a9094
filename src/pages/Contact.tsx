import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Mail, MessageSquare, Send, CheckCircle, Image as ImageIcon, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import ManaLensNavbar from "@/components/ManaLensNavbar";
import { useAuth } from "@/hooks/useAuth";
import { useT } from "@/i18n/useTranslation";
import { supabase } from "@/integrations/supabase/client";

const ACCEPTED = ["image/png", "image/jpeg", "image/jpg", "image/webp", "image/gif"];
const MAX_FILES = 5;
const MAX_SIZE_MB = 5;

const Contact = () => {
    const { user, profile, loading: authLoading } = useAuth();
    const navigate = useNavigate();
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const [sent, setSent] = useState(false);
    const [message, setMessage] = useState("");
    const [files, setFiles] = useState<File[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);
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

    const onPickFiles = (selected: FileList | null) => {
        if (!selected) return;
        const next: File[] = [];
        for (const f of Array.from(selected)) {
            if (!ACCEPTED.includes(f.type)) {
                toast({ title: "Неподдерживаемый формат", description: f.name, variant: "destructive" });
                continue;
            }
            if (f.size > MAX_SIZE_MB * 1024 * 1024) {
                toast({ title: "Файл слишком большой", description: `${f.name} > ${MAX_SIZE_MB}MB`, variant: "destructive" });
                continue;
            }
            next.push(f);
        }
        setFiles((prev) => [...prev, ...next].slice(0, MAX_FILES));
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    const removeFile = (idx: number) => setFiles((p) => p.filter((_, i) => i !== idx));

    const uploadAttachments = async (): Promise<string[]> => {
        if (files.length === 0) return [];
        const urls: string[] = [];
        for (const f of files) {
            const ext = f.name.split(".").pop() || "png";
            const path = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
            const { error } = await supabase.storage
                .from("contact-attachments")
                .upload(path, f, { contentType: f.type, upsert: false });
            if (error) throw error;
            const { data } = supabase.storage.from("contact-attachments").getPublicUrl(path);
            urls.push(data.publicUrl);
        }
        return urls;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!message.trim()) return;

        setLoading(true);
        try {
            const attachments = await uploadAttachments();
            const { error } = await (supabase as any).from("contacts").insert({
                name: profile?.nickname || "Аноним",
                email: user.email || "",
                message: message.trim(),
                attachments,
            });
            if (error) throw error;
            setSent(true);
            setMessage("");
            setFiles([]);
        } catch (err: any) {
            toast({ title: t("contact.sendError"), description: err.message, variant: "destructive" });
        } finally {
            setLoading(false);
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
                            <Button variant="outline" onClick={() => setSent(false)}>
                                {t("contact.sendAnother")}
                            </Button>
                        </motion.div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-5">
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

                            {/* Attachments */}
                            <div>
                                <label className="text-sm text-muted-foreground mb-1.5 block">
                                    {t("contact.attachLabel")}
                                </label>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept={ACCEPTED.join(",")}
                                    multiple
                                    className="hidden"
                                    onChange={(e) => onPickFiles(e.target.files)}
                                />
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={files.length >= MAX_FILES}
                                    className="gap-2"
                                >
                                    <ImageIcon className="h-4 w-4" />
                                    {t("contact.attachBtn")} ({files.length}/{MAX_FILES})
                                </Button>
                                {files.length > 0 && (
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-3">
                                        {files.map((f, i) => {
                                            const url = URL.createObjectURL(f);
                                            return (
                                                <div key={i} className="relative group">
                                                    <img src={url} alt={f.name} className="h-24 w-full object-cover rounded border border-border" />
                                                    <button
                                                        type="button"
                                                        onClick={() => removeFile(i)}
                                                        className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full p-0.5 opacity-90 hover:opacity-100"
                                                    >
                                                        <X className="h-3 w-3" />
                                                    </button>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                                <p className="text-xs text-muted-foreground mt-1.5">
                                    {t("contact.attachHint")}
                                </p>
                            </div>

                            <Button type="submit" disabled={loading} className="w-full h-11 gap-2 font-semibold">
                                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
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
