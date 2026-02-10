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
  /** 이전/비교 값 (예: "from 2,420") */
  fromValue?: string;
  /** 변동률 문자열 (예: "18.4%") - 배지에 표시 */
  trendChange?: string;
  trendType?: TrendType;
  /** 배지형 스타일 사용 (참고 이미지 스타일) */
  badgeStyle?: boolean;
  className?: string;
}

const DashboardMetricCard: React.FC<DashboardMetricCardProps> = ({
  value,
  title,
  icon: IconComponent,
  fromValue,
  trendChange,
  trendType = "neutral",
  badgeStyle = false,
  className,
}) => {
  const TrendIcon = trendType === "up" ? ArrowUp : trendType === "down" ? ArrowDown : Minus;
  const trendColorClass =
    trendType === "up"
      ? "text-emerald-700 dark:text-emerald-400"
      : trendType === "down"
        ? "text-red-600 dark:text-red-400"
        : "text-muted-foreground";
  const badgeBgClass =
    trendType === "up"
      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400"
      : trendType === "down"
        ? "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400"
        : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400";

  return (
    <motion.div
      whileHover={{
        y: -2,
        boxShadow:
          "0 4px 6px -1px rgb(0 0 0 / 0.07), 0 2px 4px -2px rgb(0 0 0 / 0.05)",
      }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      className={cn("cursor-pointer rounded-lg", className)}
    >
      <Card className="h-full transition-colors duration-200 border-slate-200/80 bg-white shadow-sm">
        <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-1.5 pt-5 px-5">
          <CardTitle className="text-sm font-medium text-slate-500">
            {title}
          </CardTitle>
          {badgeStyle && trendChange && trendType !== "neutral" && (
            <span
              className={cn(
                "inline-flex items-center gap-0.5 rounded-md px-2 py-0.5 text-xs font-semibold",
                badgeBgClass
              )}
            >
              <TrendIcon className="h-3 w-3" aria-hidden />
              {trendChange}
            </span>
          )}
          {!badgeStyle && IconComponent && (
            <IconComponent
              className="h-4 w-4 text-muted-foreground"
              aria-hidden
            />
          )}
        </CardHeader>
        <CardContent className="pt-1 px-5 pb-5">
          <div className="text-2xl font-bold text-slate-900 tracking-tight">
            {value}
          </div>
          {fromValue && (
            <p className="text-xs text-slate-400 mt-0.5">from {fromValue}</p>
          )}
          {trendChange && !badgeStyle && (
            <p
              className={cn(
                "flex items-center text-xs font-medium mt-1",
                trendColorClass
              )}
            >
              <TrendIcon className="h-3 w-3 mr-1" aria-hidden />
              {trendChange}
            </p>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default DashboardMetricCard;
