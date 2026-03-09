import { Link, useNavigate } from "react-router-dom";
import { User, Crown, LogOut, Shield } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useT } from "@/i18n/useTranslation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const UserMenu = () => {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const t = useT();

  if (!user) {
    return (
      <Link
        to="/auth"
        className="flex items-center gap-1.5 px-3 py-2 rounded-md text-sm bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors"
      >
        {t("userMenu.login")}
      </Link>
    );
  }

  const initial = (profile?.nickname?.[0] || user.email?.[0] || "U").toUpperCase();
  const isPro = profile?.is_pro ?? false;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="h-9 w-9 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-sm hover:bg-primary/90 transition-colors">
          {initial}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <div className="px-3 py-2">
          <p className="text-sm font-medium text-foreground flex items-center gap-1.5">
            {profile?.nickname || "Player"}
            {isPro && <Crown className="h-3.5 w-3.5 text-primary" />}
          </p>
          <p className="text-xs text-muted-foreground">{user.email}</p>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="cursor-pointer gap-2" asChild>
          <Link to="/profile">
            <User className="h-4 w-4" />
            {t("userMenu.profile")}
          </Link>
        </DropdownMenuItem>
        {profile?.nickname === "admin" && (
          <DropdownMenuItem className="cursor-pointer gap-2 text-primary focus:text-primary" asChild>
            <Link to="/admin">
              <Shield className="h-4 w-4" />
              {t("userMenu.admin")}
            </Link>
          </DropdownMenuItem>
        )}
        <DropdownMenuItem className="cursor-pointer gap-2" asChild>
          <Link to="/upgrade">
            <Crown className="h-4 w-4" />
            {t("userMenu.plan")}
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="cursor-pointer gap-2 text-destructive focus:text-destructive"
          onClick={async () => {
            await signOut();
            navigate("/");
          }}
        >
          <LogOut className="h-4 w-4" />
          {t("userMenu.logout")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default UserMenu;
