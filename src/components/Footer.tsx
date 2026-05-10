import { Link } from "react-router-dom";
import { Mail, Phone } from "lucide-react";

const Footer = () => (
  <footer className="border-t border-border pt-10 pb-6 mt-auto">
    <div className="container mx-auto px-6">

      {/* Top row: brand + nav links */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-8">
        <div className="flex items-center gap-2 shrink-0">
          <div className="h-6 w-6 rounded bg-primary flex items-center justify-center">
            <span className="font-display text-[10px] font-bold text-primary-foreground">TH</span>
          </div>
          <span className="font-display text-sm font-semibold text-foreground">
            Tourney<span className="text-primary">Helper</span>
          </span>
        </div>

        <nav className="flex flex-wrap gap-x-6 gap-y-2 text-xs text-muted-foreground">
          <Link to="/upgrade" className="hover:text-foreground transition-colors">Тарифы</Link>
          <Link to="/news" className="hover:text-foreground transition-colors">Новости</Link>
          <Link to="/contact" className="hover:text-foreground transition-colors">Контакты</Link>
          <Link to="/public-offer" className="hover:text-foreground transition-colors">Публичная оферта</Link>
        </nav>
      </div>

      {/* Contacts row */}
      <div className="flex flex-wrap gap-x-6 gap-y-1.5 mb-5 text-xs text-muted-foreground">
        <a href="mailto:kikus.banhelper@gmail.com" className="flex items-center gap-1.5 hover:text-foreground transition-colors">
          <Mail className="h-3 w-3 shrink-0" />
          kikus.banhelper@gmail.com
        </a>
        <a href="tel:+79962168957" className="flex items-center gap-1.5 hover:text-foreground transition-colors">
          <Phone className="h-3 w-3 shrink-0" />
          +7 996 216-89-57
        </a>
      </div>

      {/* Requisites */}
      <p className="text-[11px] text-muted-foreground/70 mb-2">
        Самозанятый Сурков К.В. · ИНН 026413639226 · г. Нефтекамск
      </p>

      {/* Refund policy */}
      <p className="text-[11px] text-muted-foreground/70 mb-5">
        Возврат денежных средств возможен до момента активации доступа к сервису.{" "}
        <Link to="/public-offer" className="underline hover:text-muted-foreground transition-colors">
          Подробнее — в публичной оферте
        </Link>.
      </p>

      {/* Bottom row */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-3 border-t border-border/50 pt-4">
        <p className="text-[11px] text-muted-foreground/60">
          © 2026 TourneyHelper · hs-banhelper.online
        </p>
        <p className="text-[11px] text-muted-foreground/60 text-center md:text-right">
          Не является официальным продуктом Blizzard Entertainment
        </p>
      </div>

    </div>
  </footer>
);

export default Footer;
