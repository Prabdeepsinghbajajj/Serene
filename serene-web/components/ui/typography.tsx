import { cn } from "@/lib/utils";

/* -------------------------------------------------------------------------- */
/*  Heading                                                                     */
/* -------------------------------------------------------------------------- */

type HeadingLevel = "h1" | "h2" | "h3" | "h4";
type HeadingSize = "xl" | "lg" | "md" | "sm";

const headingSizeMap: Record<HeadingSize, string> = {
  xl: "text-4xl",
  lg: "text-3xl",
  md: "text-2xl",
  sm: "text-xl",
};

interface HeadingProps {
  as?: HeadingLevel;
  size?: HeadingSize;
  className?: string;
  children: React.ReactNode;
}

export function Heading({
  as: Tag = "h2",
  size = "lg",
  className,
  children,
}: HeadingProps) {
  return (
    <Tag
      className={cn(
        "font-serif font-medium text-slate-warm leading-tight",
        headingSizeMap[size],
        className
      )}
    >
      {children}
    </Tag>
  );
}

/* -------------------------------------------------------------------------- */
/*  Body                                                                        */
/* -------------------------------------------------------------------------- */

type BodySize = "lg" | "base" | "sm";

const bodySizeMap: Record<BodySize, string> = {
  lg: "text-body-lg",
  base: "text-body",
  sm: "text-body", /* floor at 16px (text-base) — bible §6: minimum 16px */
};

interface BodyProps {
  size?: BodySize;
  muted?: boolean;
  className?: string;
  children: React.ReactNode;
}

export function Body({ size = "base", muted = false, className, children }: BodyProps) {
  return (
    <p
      className={cn(
        "font-sans leading-[1.7]",
        bodySizeMap[size],
        muted ? "text-slate-muted" : "text-slate-warm",
        className
      )}
    >
      {children}
    </p>
  );
}

/* -------------------------------------------------------------------------- */
/*  Label                                                                       */
/* -------------------------------------------------------------------------- */

/* 14px is the only place sub-16px text is permitted (bible §6 read through §5) */

interface LabelProps {
  className?: string;
  children: React.ReactNode;
}

export function Label({ className, children }: LabelProps) {
  return (
    <span
      className={cn(
        "font-sans text-sm text-slate-muted uppercase tracking-widest",
        className
      )}
    >
      {children}
    </span>
  );
}

/* -------------------------------------------------------------------------- */
/*  Companion                                                                   */
/* -------------------------------------------------------------------------- */

/* Used exclusively for AI companion messages — never repurpose for decorative text */

interface CompanionProps {
  className?: string;
  children: React.ReactNode;
}

export function Companion({ className, children }: CompanionProps) {
  return (
    <p
      className={cn(
        "font-serif italic text-base text-slate-warm leading-[1.7]",
        className
      )}
    >
      {children}
    </p>
  );
}
