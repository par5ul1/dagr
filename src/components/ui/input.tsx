import type * as React from "react";

import { cn } from "@/lib/utils";

type InputProps = React.ComponentProps<"input"> & {
  leftAdornment?: React.ReactNode;
  rightAdornment?: React.ReactNode;
};

function Input({
  className,
  type,
  leftAdornment,
  rightAdornment,
  ...props
}: InputProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-2 h-9 rounded-md border border-input bg-transparent selection:bg-primary selection:text-primary-foreground dark:bg-input/30 px-3 py-1 pr-1 shadow-xs transition-[color,box-shadow] focus-within:border-ring focus-within:ring-ring/50 focus-within:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
        "has-[*:not(input):focus]:outline-none has-[*:not(input):focus]:ring-0 has-[*:not(input):focus]:border-input",
        className,
      )}
    >
      {leftAdornment}
      <input
        type={type}
        data-slot="input"
        className="file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground flex h-full w-full min-w-0 border-0 bg-transparent text-base outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
        {...props}
      />
      {rightAdornment}
    </div>
  );
}

export { Input };
