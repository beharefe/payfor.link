"use client";

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@unseallink/components/ui/chart";
import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts";
import {
  InitiateStripeConnectButton,
  WithdrawButton,
} from "./dashboard-actions";

export type DayRevenue = { date: string; revenue: number };

const chartConfig = {
  revenue: { label: "Revenue", color: "hsl(var(--foreground))" },
};

type Props = {
  data: DayRevenue[];
  totalSales: number;
  totalEarned: number;
  stripeConnected: boolean;
  hasLinks: boolean;
};

export function RevenueChart({ data, totalSales, totalEarned, stripeConnected, hasLinks }: Props) {
  const hasData = data.some((d) => d.revenue > 0);

  return (
    <div className="border border-border rounded-2xl bg-card overflow-hidden">
      {/* Stat boxes */}
      <div className="grid grid-cols-2 divide-x divide-border border-b border-border">
        <div className="px-4 py-4">
          <p className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground mb-1">
            Total sales
          </p>
          <p className="text-2xl font-medium text-foreground tabular-nums">{totalSales}</p>
        </div>
        <div className="px-4 py-4 flex items-center justify-between gap-2">
          <div>
            <p className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground mb-1">
              Total earned
            </p>
            <p className="text-2xl font-medium text-foreground tabular-nums">
              ${totalEarned.toFixed(2)}
            </p>
          </div>
          {stripeConnected ? (
            <WithdrawButton />
          ) : (
            <InitiateStripeConnectButton label="Set up" />
          )}
        </div>
      </div>

      {/* Chart */}
      <div className="px-3 pt-3 pb-1">
        <p className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground mb-3 px-1">
          Revenue · last 30 days
        </p>
        {hasData ? (
          <ChartContainer config={chartConfig} className="h-[140px] w-full">
            <BarChart data={data} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <CartesianGrid vertical={false} stroke="hsl(var(--border))" />
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                interval="preserveStartEnd"
              />
              <ChartTooltip
                cursor={{ fill: "hsl(var(--muted))" }}
                content={
                  <ChartTooltipContent
                    formatter={(value) => [`$${Number(value).toFixed(2)}`, "Revenue"]}
                  />
                }
              />
              <Bar
                dataKey="revenue"
                fill="hsl(var(--foreground))"
                radius={[3, 3, 0, 0]}
              />
            </BarChart>
          </ChartContainer>
        ) : (
          <div className="h-[140px] flex flex-col items-center justify-center gap-3">
            <p className="text-sm text-muted-foreground">No sales yet</p>
            {!hasLinks && (
              <Link
                href="/dashboard/links/new"
                className="inline-flex items-center px-5 py-2 bg-primary text-primary-foreground no-underline rounded-full font-medium text-sm hover:opacity-90 transition-opacity"
              >
                Sell your first link →
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
