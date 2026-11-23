import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/cn";

type Variant = "primary" | "secondary" | "tertiary" | "text";
type Size = "md" | "lg";

const base =
  "inline-flex h-11 items-center justify-center gap-2 rounded-md text-body font-medium whitespace-nowrap transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-400 disabled:pointer-events-none aria-disabled:pointer-events-none";

const variants: Record<Variant, string> = {
  primary:
    "bg-primary-500 text-white hover:bg-primary-600 disabled:bg-primary-200 aria-disabled:bg-primary-200",
  secondary:
    "border border-primary-500 bg-white text-primary-500 hover:bg-primary-100 disabled:border-primary-200 disabled:text-primary-300 aria-disabled:border-primary-200 aria-disabled:text-primary-300",
  tertiary:
    "border border-neutral-200 bg-white text-neutral-900 hover:bg-neutral-50 disabled:text-neutral-300 aria-disabled:text-neutral-300",
  text: "h-auto px-0 text-primary-500 hover:text-primary-600 disabled:text-primary-200 aria-disabled:text-primary-200",
};

const sizes: Record<Size, string> = {
  md: "px-3",
  lg: "px-4",
};

type CommonProps = {
  variant?: Variant;
  size?: Size;
  leadingIcon?: ReactNode;
  trailingIcon?: ReactNode;
  className?: string;
  children: ReactNode;
};

type ButtonAsButton = CommonProps &
  Omit<ComponentProps<"button">, keyof CommonProps> & { href?: undefined };

type ButtonAsLink = CommonProps &
  Omit<ComponentProps<typeof Link>, keyof CommonProps> & {
    href: ComponentProps<typeof Link>["href"];
    disabled?: boolean;
  };

export type ButtonProps = ButtonAsButton | ButtonAsLink;

export function buttonClasses({
  variant = "primary",
  size = "lg",
  className,
}: { variant?: Variant; size?: Size; className?: string } = {}) {
  return cn(base, variants[variant], variant !== "text" && sizes[size], className);
}

export function Button(props: ButtonProps) {
  if (props.href !== undefined) {
    const {
      variant,
      size,
      leadingIcon,
      trailingIcon,
      className,
      children,
      disabled,
      ...rest
    } = props;
    return (
      <Link
        {...rest}
        className={buttonClasses({ variant, size, className })}
        aria-disabled={disabled || undefined}
        tabIndex={disabled ? -1 : rest.tabIndex}
      >
        {leadingIcon}
        {children}
        {trailingIcon}
      </Link>
    );
  }

  const {
    variant,
    size,
    leadingIcon,
    trailingIcon,
    className,
    children,
    type = "button",
    ...rest
  } = props;
  return (
    <button {...rest} type={type} className={buttonClasses({ variant, size, className })}>
      {leadingIcon}
      {children}
      {trailingIcon}
    </button>
  );
}
