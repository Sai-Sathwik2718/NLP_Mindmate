import React from "react";

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  hoverEffect?: boolean;
  onClick?: () => void;
}

export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  className = "",
  hoverEffect = false,
  onClick,
}) => {
  return (
    <div
      onClick={onClick}
      className={`
        glass-card 
        dark:bg-slate-900/40 
        bg-white/60 
        border 
        dark:border-slate-800/60 
        border-slate-200/50 
        rounded-2xl 
        p-6 
        shadow-xl 
        backdrop-blur-md 
        transition-all 
        duration-300 
        ${hoverEffect ? "hover:-translate-y-1 hover:shadow-2xl hover:border-indigo-500/30 dark:hover:border-indigo-500/20" : ""}
        ${onClick ? "cursor-pointer" : ""}
        ${className}
      `}
    >
      {children}
    </div>
  );
};
export default GlassCard;
