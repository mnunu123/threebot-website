"use client";

import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ArrowDown,
  ArrowUp,
  Minus,
  type LucideIcon,
} from "lucide-react";

export type TrendType = "up" | "down" | "neutral";

export interface DashboardMetricCardProps {
  value: string;
  title: string;
  icon?: LucideIcon;
  trendChange?: string;
  trendType?: TrendType;
  className?: string;
}

const DashboardMetricCard: React.FC<DashboardMetricCardProps> = ({
  value,
  title,
  icon: IconComponent,
  trendChange,
  trendType = "neutral",
  className,
}) => {
  const TrendIcon = trendType === "up" ? ArrowUp : trendType === "down" ? ArrowDown : Minus;
  const trendColorClass =
    trendType === "up"
      ? "text-green-600 dark:text-green-400"
      : trendType === "down"
        ? "text-red-600 dark:text-red-400"
        : "text-muted-foreground";

  return (
    <motion.div
      whileHover={{
        y: -4,
        boxShadow:
          "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)",
      }}
      transition={{ type: "spring", stiffness: 400, damping: 20 }}
      className={cn("cursor-pointer rounded-lg", className)}
    >
      <Card className="h-full transition-colors duration-200">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {title}
          </CardTitle>
          {IconComponent && (
            <IconComponent
              className="h-4 w-4 text-muted-foreground"
              aria-hidden
            />
          )}
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-foreground mb-2">
            {value}
          </div>
          {trendChange && (
            <p
              className={cn(
                "flex items-center text-xs font-medium",
                trendColorClass
              )}
            >
              <TrendIcon className="h-3 w-3 mr-1" aria-hidden />
              {trendChange}{" "}
              {trendType === "up"
                ? "increase"
                : trendType === "down"
                  ? "decrease"
                  : "change"}
            </p>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default DashboardMetricCard;
