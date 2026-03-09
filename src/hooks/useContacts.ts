import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type Contact = {
    id: string;
    name: string;
    email: string;
    message: string;
    category?: string;
    created_at: string;
};

export type ContactInsert = Omit<Contact, "id" | "created_at">;

/** Отправка контактного сообщения */
export async function sendContact(data: ContactInsert) {
    return (supabase as any).from("contacts").insert(data);
}

/** Хук для загрузки всех сообщений (только для авторизованных) */
export function useContacts() {
    const [contacts, setContacts] = useState<Contact[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetch = async () => {
        setLoading(true);
        const { data, error } = await (supabase as any)
            .from("contacts")
            .select("*")
            .order("created_at", { ascending: false });
        if (error) setError(error.message);
        else setContacts(data ?? []);
        setLoading(false);
    };

    return { contacts, loading, error, fetch };
}
