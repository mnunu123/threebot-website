"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

const TooltipProvider = ({
  children,
  delayDuration = 0,
}: {
  children: React.ReactNode;
  delayDuration?: number;
}) => <>{children}</>;

interface TooltipContextValue {
  open: boolean;
  setOpen: (v: boolean) => void;
}

const TooltipContext = React.createContext<TooltipContextValue | null>(null);

function Tooltip({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = React.useState(false);

  return (
    <TooltipContext.Provider value={{ open, setOpen }}>
      <div
        className="relative inline-block"
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
      >
        {children}
      </div>
    </TooltipContext.Provider>
  );
}

const TooltipTrigger = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { asChild?: boolean }
>(function TooltipTrigger({ children, asChild, ...props }, ref) {
  const child = React.Children.only(children) as React.ReactElement;
  if (asChild && React.isValidElement(child)) {
    return React.cloneElement(child, { ref, ...props } as Record<string, unknown>);
  }
  return (
    <div ref={ref} {...props}>
      {children}
    </div>
  );
});

const TooltipContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { side?: "top" | "right" | "bottom" | "left" }
>(function TooltipContent({ className, side = "top", children, ...props }, ref) {
  const context = React.useContext(TooltipContext);
  if (!context?.open) return null;

  const posClasses =
    side === "top"
      ? "bottom-full left-1/2 -translate-x-1/2 mb-2"
      : side === "bottom"
        ? "top-full left-1/2 -translate-x-1/2 mt-2"
        : side === "left"
          ? "right-full top-1/2 -translate-y-1/2 mr-2"
          : "left-full top-1/2 -translate-y-1/2 ml-2";

  return (
    <div
      ref={ref}
      className={cn(
        "absolute z-50 overflow-hidden rounded-md border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-800 shadow-md",
        posClasses,
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
});

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider };
