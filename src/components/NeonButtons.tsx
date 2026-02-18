import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { forwardRef } from "react";

export { Button };

// Re-export with neon variant support
export const NeonButton = forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & { size?: "default" | "sm" | "lg" }
>(({ className, size = "default", ...props }, ref) => (
  <button
    ref={ref}
    className={cn(
      "relative inline-flex items-center justify-center font-display font-semibold tracking-wider uppercase",
      "bg-primary text-primary-foreground rounded-lg transition-all duration-300",
      "hover:shadow-[0_0_30px_hsl(var(--neon)/0.4)] hover:scale-[1.02]",
      "active:scale-[0.98]",
      "border border-primary/50",
      size === "sm" && "px-4 py-2 text-xs",
      size === "default" && "px-6 py-3 text-sm",
      size === "lg" && "px-8 py-4 text-base",
      className
    )}
    {...props}
  />
));
NeonButton.displayName = "NeonButton";

export const GhostNeonButton = forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & { size?: "default" | "sm" | "lg" }
>(({ className, size = "default", ...props }, ref) => (
  <button
    ref={ref}
    className={cn(
      "relative inline-flex items-center justify-center font-display font-semibold tracking-wider uppercase",
      "bg-transparent text-primary rounded-lg transition-all duration-300",
      "border border-primary/30 hover:border-primary/60",
      "hover:bg-primary/5 hover:shadow-[0_0_20px_hsl(var(--neon)/0.15)]",
      "active:scale-[0.98]",
      size === "sm" && "px-4 py-2 text-xs",
      size === "default" && "px-6 py-3 text-sm",
      size === "lg" && "px-8 py-4 text-base",
      className
    )}
    {...props}
  />
));
GhostNeonButton.displayName = "GhostNeonButton";
