import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  hoverEffect?: boolean;
}

export function GlassCard({ className, hoverEffect = true, children, ...props }: GlassCardProps) {
  return (
    <div
      className={twMerge(
        "rounded-2xl border border-white/10 bg-black/40 p-6 backdrop-blur-md text-white shadow-xl transition-all duration-300",
        hoverEffect && "hover:border-white/20 hover:bg-black/50 hover:shadow-cyan-500/10 hover:-translate-y-1",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
