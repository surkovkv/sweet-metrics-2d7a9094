import { useLang } from "@/components/LanguageSwitcher";
import { t } from "./translations";

export function useT() {
  const { lang } = useLang();
  return (key: string) => t(lang, key);
}
