import { useState, useEffect } from "react";
import { Globe, ChevronDown } from "lucide-react";

export const LANGUAGES = [
    { code: "en", label: "English", flag: "🇬🇧" },
    { code: "ru", label: "Русский", flag: "🇷🇺" },
    { code: "es", label: "Español", flag: "🇪🇸" },
    { code: "zh", label: "中文", flag: "🇨🇳" },
    { code: "hi", label: "हिन्दी", flag: "🇮🇳" },
    { code: "ar", label: "العربية", flag: "🇸🇦" },
    { code: "pt", label: "Português", flag: "🇧🇷" },
    { code: "fr", label: "Français", flag: "🇫🇷" },
];

export const LANG_STORAGE_KEY = "app_language";

export function useLang() {
    const [lang, setLangState] = useState<string>(() => {
        if (typeof window !== "undefined") {
            return localStorage.getItem(LANG_STORAGE_KEY) || "ru";
        }
        return "ru";
    });

    const setLang = (code: string) => {
        localStorage.setItem(LANG_STORAGE_KEY, code);
        setLangState(code);
        // Trigger a storage event for other components to react
        window.dispatchEvent(new StorageEvent("storage", { key: LANG_STORAGE_KEY, newValue: code }));
    };

    useEffect(() => {
        const handler = (e: StorageEvent) => {
            if (e.key === LANG_STORAGE_KEY && e.newValue) {
                setLangState(e.newValue);
            }
        };
        window.addEventListener("storage", handler);
        return () => window.removeEventListener("storage", handler);
    }, []);

    return { lang, setLang };
}

export default function LanguageSwitcher() {
    const { lang, setLang } = useLang();
    const [open, setOpen] = useState(false);

    const current = LANGUAGES.find((l) => l.code === lang) || LANGUAGES[0];

    return (
        <div className="relative">
            <button
                onClick={() => setOpen(!open)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-sm text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors border border-transparent hover:border-border"
            >
                <Globe className="h-4 w-4" />
                <span className="hidden sm:inline">{current.flag} {current.code.toUpperCase()}</span>
                <span className="sm:hidden">{current.flag}</span>
                <ChevronDown className={`h-3 w-3 transition-transform ${open ? "rotate-180" : ""}`} />
            </button>

            {open && (
                <>
                    {/* Backdrop */}
                    <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
                    {/* Dropdown */}
                    <div className="absolute right-0 top-full mt-1 z-50 w-44 bg-card border border-border rounded-xl shadow-lg overflow-hidden">
                        {LANGUAGES.map((l) => (
                            <button
                                key={l.code}
                                onClick={() => { setLang(l.code); setOpen(false); }}
                                className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm transition-colors text-left ${lang === l.code
                                        ? "bg-primary/10 text-primary font-medium"
                                        : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                                    }`}
                            >
                                <span className="text-base">{l.flag}</span>
                                <span>{l.label}</span>
                            </button>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}
