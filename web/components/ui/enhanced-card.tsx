import * as React from "react";
import { cn } from "@/lib/utils";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "elevated" | "interactive" | "warning" | "success";
  size?: "sm" | "md" | "lg";
}

const cardVariants = {
  default: "bg-white border-peach-sand",
  elevated: "bg-white border-peach-sand shadow-lg",
  interactive: "bg-white border-peach-sand hover:shadow-md transition-shadow cursor-pointer",
  warning: "bg-cream border-chili-red/30 border-l-4 border-l-chili-red",
  success: "bg-cream border-tamarind-orange/30 border-l-4 border-l-tamarind-orange"
};

const cardSizes = {
  sm: "p-3 rounded-lg",
  md: "p-4 rounded-xl", 
  lg: "p-6 rounded-2xl"
};

export function EnhancedCard({ 
  children, 
  className, 
  variant = "default", 
  size = "md",
  ...props 
}: CardProps) {
  return (
    <div 
      className={cn(
        "border shadow-soft",
        cardVariants[variant],
        cardSizes[size],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ 
  children, 
  className,
  ...props 
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div 
      className={cn("mb-3 font-semibold text-cacao-brown", className)}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardContent({ 
  children, 
  className,
  ...props 
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div 
      className={cn("text-cacao-brown/90", className)}
      {...props}
    >
      {children}
    </div>
  );
}

// Accessibility-focused KPI component
interface KPICardProps {
  title: string;
  value: string | number;
  description?: string;
  trend?: "up" | "down" | "neutral";
  className?: string;
}

export function KPICard({ title, value, description, trend, className }: KPICardProps) {
  const trendIcon = trend === "up" ? "↗" : trend === "down" ? "↘" : "";
  
  return (
    <EnhancedCard 
      className={cn("text-center", className)}
      role="group"
      aria-labelledby={`kpi-${title.replace(/\s+/g, '-').toLowerCase()}`}
    >
      <div 
        id={`kpi-${title.replace(/\s+/g, '-').toLowerCase()}`}
        className="text-sm font-medium text-cacao-brown/70 mb-1"
      >
        {title}
      </div>
      <div 
        className="text-3xl font-bold text-cacao-brown mb-1"
        aria-live="polite"
      >
        {typeof value === 'number' ? value.toLocaleString() : value}
        {trend && (
          <span 
            className={cn(
              "text-lg ml-2",
              trend === "up" && "text-green-600",
              trend === "down" && "text-red-600"
            )}
            aria-label={`Trend ${trend}`}
          >
            {trendIcon}
          </span>
        )}
      </div>
      {description && (
        <div className="text-xs text-cacao-brown/60">{description}</div>
      )}
    </EnhancedCard>
  );
}