import * as React from "react";
import { cn } from "@/lib/utils";

export type CardVariant = "default" | "elevated" | "interactive" | "outline" | "ghost";
export type CardSize = "sm" | "md" | "lg";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant;
  size?: CardSize;
}

const baseCardClasses = "rounded-xl border bg-card";
const sizeClasses: Record<CardSize, string> = {
  sm: "p-4",
  md: "p-6",
  lg: "p-8",
};

function variantClasses(variant: CardVariant): string {
  switch (variant) {
    case "elevated":
      return "shadow-lg";
    case "interactive":
      return "cursor-pointer hover:shadow-md transition-shadow";
    case "outline":
      return "border-2";
    case "ghost":
      return "border-none shadow-none";
    default:
      return "";
  }
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = "default", size = "md", ...props }, ref) => {
    const { onClick, tabIndex, onKeyDown, ...rest } = props as CardProps & {
      onClick?: React.MouseEventHandler<HTMLDivElement>;
      tabIndex?: number;
      onKeyDown?: React.KeyboardEventHandler<HTMLDivElement>;
    };
    const interactive = variant === 'interactive' || typeof onClick === 'function';
    const handleKeyDown: React.KeyboardEventHandler<HTMLDivElement> = (e) => {
      if (onKeyDown) onKeyDown(e);
      if (!interactive) return;
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        const clickEvent = new MouseEvent('click', { bubbles: true, cancelable: true });
        (e.currentTarget as HTMLDivElement).dispatchEvent(clickEvent);
      }
    };
    return (
      <div
        ref={ref}
        role={interactive ? 'button' : undefined}
        tabIndex={interactive ? (tabIndex ?? 0) : tabIndex}
        className={cn(baseCardClasses, sizeClasses[size], variantClasses(variant), className)}
        onKeyDown={handleKeyDown}
        onClick={onClick}
        {...(rest as any)}
      />
    );
  }
);
Card.displayName = "Card";

// Keyboard accessibility: activate on Enter/Space when interactive
function isInteractiveCard(props: CardProps): boolean {
  return props.variant === 'interactive' || typeof (props as any).onClick === 'function';
}

export function InteractiveCard(props: CardProps) {
  return <Card {...props} />;
}

export function CardHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("flex flex-col space-y-1.5", className)} {...props} />;
}

export function CardTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h3 className={cn("font-semibold leading-none tracking-tight", className)} {...props} />;
}

export function CardDescription({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn("text-sm text-muted-foreground", className)} {...props} />;
}

export function CardContent({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("p-6 pt-0", className)} {...props} />;
}

export function CardFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("flex items-center p-6 pt-0", className)} {...props} />;
}

// Backwards-compatible components used elsewhere in the app
export function EnhancedCard({ children, className, variant = "default", size = "md", ...props }: CardProps) {
  const Comp = variant === 'interactive' ? InteractiveCard : Card;
  return <Comp className={className} variant={variant} size={size} {...props}>{children}</Comp>;
}

interface KPICardProps {
  title: string;
  value: string | number;
  description?: string;
  trend?: "up" | "down" | "neutral";
  className?: string;
}

export function KPICard({ title, value, description, trend, className }: KPICardProps) {
  const trendIcon = trend === "up" ? "↗" : trend === "down" ? "↘" : "";
  const titleId = `kpi-${title.replace(/\s+/g, '-').toLowerCase()}`;
  return (
    <EnhancedCard className={cn("text-center", className)} role="group" aria-labelledby={titleId}>
      <div id={titleId} className="text-sm font-medium text-cacao-brown/70 mb-1">
        {title}
      </div>
      <div className="text-3xl font-bold text-cacao-brown mb-1" aria-live="polite">
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
      {description && <div className="text-xs text-cacao-brown/60">{description}</div>}
    </EnhancedCard>
  );
}