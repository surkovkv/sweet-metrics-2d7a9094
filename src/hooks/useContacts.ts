import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Tables, TablesInsert } from "@/integrations/supabase/types";

export type Contact = Tables<"contacts">;
export type ContactInsert = TablesInsert<"contacts">;

/** Отправка контактного сообщения */
export async function sendContact(data: ContactInsert) {
    return supabase.from("contacts").insert(data);
}

/** Хук для загрузки всех сообщений (только для авторизованных) */
export function useContacts() {
    const [contacts, setContacts] = useState<Contact[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetch = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from("contacts")
            .select("*")
            .order("created_at", { ascending: false });
        if (error) setError(error.message);
        else setContacts(data ?? []);
        setLoading(false);
    };

    return { contacts, loading, error, fetch };
}
