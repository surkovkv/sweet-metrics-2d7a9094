import { useState } from "react";
import { motion } from "framer-motion";
import { Mail, User, MessageSquare, Send, CheckCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import ManaLensNavbar from "@/components/ManaLensNavbar";
import { sendContact } from "@/hooks/useContacts";
import { useAuth } from "@/hooks/useAuth";

const Contact = () => {
    const { user, profile } = useAuth();
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const [sent, setSent] = useState(false);

    const [name, setName] = useState(profile?.nickname || "");
    const [email, setEmail] = useState(user?.email || "");
    const [message, setMessage] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim() || !email.trim() || !message.trim()) return;

        setLoading(true);
        const { error } = await sendContact({
            name: name.trim(),
            email: email.trim(),
            message: message.trim(),
            user_id: user?.id ?? null,
        });
        setLoading(false);

        if (error) {
            toast({ title: "Ошибка отправки", description: error.message, variant: "destructive" });
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
                        Связаться с нами
                    </div>
                    <h1 className="font-display text-4xl font-bold text-foreground mb-3">Контакты</h1>
                    <p className="text-muted-foreground text-lg mb-10">
                        Есть вопросы, идеи или нашёл баг? Напиши нам — ответим как можно скорее.
                    </p>

                    {sent ? (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="flex flex-col items-center gap-4 py-16 text-center"
                        >
                            <CheckCircle className="h-16 w-16 text-primary" />
                            <h2 className="font-display text-2xl font-bold text-foreground">
                                Сообщение отправлено!
                            </h2>
                            <p className="text-muted-foreground">
                                Мы его получили и свяжемся с тобой по email.
                            </p>
                            <Button variant="outline" onClick={() => { setSent(false); setMessage(""); }}>
                                Отправить ещё
                            </Button>
                        </motion.div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div>
                                <label className="text-sm text-muted-foreground mb-1.5 block">Имя *</label>
                                <div className="relative">
                                    <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        placeholder="Твоё имя или никнейм"
                                        className="pl-10 bg-secondary border-border"
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="text-sm text-muted-foreground mb-1.5 block">Email *</label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="example@mail.com"
                                        className="pl-10 bg-secondary border-border"
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="text-sm text-muted-foreground mb-1.5 block">Сообщение *</label>
                                <div className="relative">
                                    <MessageSquare className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                    <textarea
                                        value={message}
                                        onChange={(e) => setMessage(e.target.value)}
                                        placeholder="Опиши свой вопрос или предложение..."
                                        rows={6}
                                        required
                                        className="w-full rounded-md border border-border bg-secondary pl-10 pr-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary resize-none"
                                    />
                                </div>
                            </div>

                            <Button type="submit" disabled={loading} className="w-full h-11 gap-2 font-semibold">
                                <Send className="h-4 w-4" />
                                {loading ? "Отправка..." : "Отправить сообщение"}
                            </Button>
                        </form>
                    )}
                </motion.div>
            </main>
        </div>
    );
};

export default Contact;
