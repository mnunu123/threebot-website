"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { motion, AnimatePresence } from "framer-motion";

interface DockProps {
  className?: string;
  activeLabel?: string | null;
  /** "vertical" | "horizontal" - 세로/가로 배치 */
  direction?: "vertical" | "horizontal";
  items: {
    icon: React.ComponentType<{ className?: string }>;
    label: string;
    onClick?: () => void;
  }[];
}

export default function Dock({
  items,
  className,
  activeLabel: controlledActive,
  direction = "horizontal",
}: DockProps) {
  const [internalActive, setInternalActive] = React.useState<string | null>(null);
  const [hovered, setHovered] = React.useState<number | null>(null);
  const active = controlledActive !== undefined ? controlledActive : internalActive;
  const isVertical = direction === "vertical";

  return (
    <div
      className={cn(
        "flex w-full",
        isVertical ? "flex-col items-center py-1" : "items-center justify-center py-12",
        className
      )}
    >
      <motion.div
        animate={isVertical ? {} : { y: [0, -2, 0] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        className={cn(
          "flex rounded-2xl border bg-background/70 backdrop-blur-2xl shadow-lg",
          isVertical ? "flex-col items-center gap-1 px-2 py-2" : "gap-3 px-3 py-3 items-end"
        )}
        style={isVertical ? undefined : { transform: "perspective(600px) rotateX(10deg)" }}
      >
        <TooltipProvider delayDuration={100}>
          {items.map((item, i) => {
            const isActive = active === item.label;
            const isHovered = hovered === i;

            return (
              <Tooltip key={item.label}>
                <TooltipTrigger asChild>
                  <motion.div
                    onMouseEnter={() => setHovered(i)}
                    onMouseLeave={() => setHovered(null)}
                    animate={{
                      scale: isHovered ? 1.2 : 1,
                      rotate: isHovered ? -5 : 0,
                    }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                    className="relative flex flex-col items-center min-h-[2.25rem] justify-center"
                  >
                    <Button
                      variant="ghost"
                      size="icon"
                      className={cn(
                        "rounded-2xl relative h-9 w-9 shrink-0",
                        "transition-colors",
                        isActive && "bg-primary/20 text-primary",
                        isHovered && "shadow-lg shadow-primary/20"
                      )}
                      onClick={() => {
                        if (controlledActive === undefined) setInternalActive(item.label);
                        item.onClick?.();
                      }}
                    >
                      <item.icon
                        className={cn(
                          "h-5 w-5 transition-colors shrink-0",
                          isActive ? "text-primary" : "text-foreground"
                        )}
                      />
                      <AnimatePresence>
                        {isHovered && (
                          <motion.span
                            layoutId="glow"
                            className="absolute inset-0 rounded-2xl border border-primary/40"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                          />
                        )}
                      </AnimatePresence>
                    </Button>

                    <span className="h-1.5 mt-0.5 flex items-center justify-center shrink-0">
                      <AnimatePresence>
                        {isActive && (
                          <motion.div
                            layoutId="dock-dot"
                            className="w-1.5 h-1.5 rounded-full bg-primary"
                            initial={{ opacity: 0, scale: 0 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0 }}
                          />
                        )}
                      </AnimatePresence>
                    </span>
                  </motion.div>
                </TooltipTrigger>
                <TooltipContent side={isVertical ? "right" : "top"} className="text-xs">
                  {item.label}
                </TooltipContent>
              </Tooltip>
            );
          })}
        </TooltipProvider>
      </motion.div>
    </div>
  );
}
