import { cn } from "@/lib/utils";
import React from "react";

export type TextSize =
  | "xs"
  | "sm"
  | "md"
  | "lg"
  | "xl"
  | "2xl"
  | "3xl"
  | "4xl"
  | "5xl"
  | "6xl"
  | "7xl"
  | "8xl"
  | "9xl";

export type TextFont = "display" | "recoleta" | "body" | "sans" | "inter" | "mono";

export type TextWeight =
  | "thin"
  | "light"
  | "normal"
  | "medium"
  | "semibold"
  | "bold"
  | "extrabold";

export type TextColor =
  | "default"
  | "ink"
  | "body"
  | "muted"
  | "subtle"
  | "inverted"
  | "brand"
  | "pink"
  | "teal"
  | "peach"
  | "mint"
  | "ochre"
  | "lavender"
  | "coral"
  | "yellow"
  | "success"
  | "warning"
  | "danger"
  | "inherit";

const fontClasses: Record<TextFont, string> = {
  display: "font-display",
  recoleta: "font-display",
  body: "font-body",
  sans: "font-body",
  inter: "font-body",
  mono: "font-mono",
};

const sizeClasses: Record<TextSize, string> = {
  xs: "text-xs",
  sm: "text-sm",
  md: "text-base",
  lg: "text-lg",
  xl: "text-xl",
  "2xl": "text-2xl",
  "3xl": "text-3xl",
  "4xl": "text-4xl",
  "5xl": "text-5xl",
  "6xl": "text-6xl",
  "7xl": "text-7xl",
  "8xl": "text-8xl",
  "9xl": "text-9xl",
};

const weightClasses: Record<TextWeight, string> = {
  thin: "font-thin",
  light: "font-light",
  normal: "font-normal",
  medium: "font-medium",
  semibold: "font-semibold",
  bold: "font-bold",
  extrabold: "font-extrabold",
};

const colorClasses: Record<TextColor, string> = {
  default: "text-ink",
  ink: "text-ink",
  body: "text-body",
  muted: "text-muted",
  subtle: "text-muted/70",
  inverted: "text-white",
  brand: "text-brand-pink",
  pink: "text-brand-pink",
  teal: "text-brand-teal",
  peach: "text-brand-peach",
  mint: "text-brand-mint",
  ochre: "text-brand-ochre",
  lavender: "text-brand-lavender",
  coral: "text-brand-coral",
  yellow: "text-brand-yellow",
  success: "text-success",
  warning: "text-warning",
  danger: "text-brand-coral",
  inherit: "text-inherit",
};

// Hover color: the color the text transitions to when parent is hovered
const hoverColorClasses: Record<TextColor, string> = {
  default: "group-hover:text-ink",
  ink: "group-hover:text-ink",
  body: "group-hover:text-body",
  muted: "group-hover:text-muted",
  subtle: "group-hover:text-muted/70",
  inverted: "group-hover:text-white",
  brand: "group-hover:text-brand-pink",
  pink: "group-hover:text-brand-pink",
  teal: "group-hover:text-brand-teal",
  peach: "group-hover:text-brand-peach",
  mint: "group-hover:text-brand-mint",
  ochre: "group-hover:text-brand-ochre",
  lavender: "group-hover:text-brand-lavender",
  coral: "group-hover:text-brand-coral",
  yellow: "group-hover:text-brand-yellow",
  success: "group-hover:text-success",
  warning: "group-hover:text-warning",
  danger: "group-hover:text-brand-coral",
  inherit: "group-hover:text-inherit",
};

export type TextProps<T extends React.ElementType = "span"> = {
  /** Required: controls font size */
  size: TextSize;
  /** Font family — defaults to "body" */
  font?: TextFont;
  /** Text color preset based on Lotofai design system */
  color?: TextColor;
  /** Font weight */
  weight?: TextWeight;
  /**
   * When true/specified, the text reacts to a parent with the `group` class — i.e.
   * hovering the parent container changes this text's color to `hoverColor`.
   * The parent element must have the `group` Tailwind class applied.
   */
  hoverColor?: TextColor;
  /** Polymorphic tag — defaults to <span> */
  as?: T;
  children?: React.ReactNode;
  className?: string;
} & Omit<React.ComponentProps<T>, "children" | "className" | "as">;

export const Text = <T extends React.ElementType = "span">({
  size,
  font = "body",
  color = "default",
  weight = "normal",
  hoverColor,
  as,
  children,
  className,
  ...props
}: TextProps<T>) => {
  const Component = (as ?? "span") as React.ElementType;

  return (
    <Component
      {...props}
      className={cn(
        sizeClasses[size],
        fontClasses[font],
        weightClasses[weight],
        colorClasses[color],
        "transition-colors duration-200",
        hoverColor && hoverColorClasses[hoverColor],
        className
      )}
    >
      {children}
    </Component>
  );
};
