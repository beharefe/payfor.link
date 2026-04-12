"use client";

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@unseallink/components/ui/chart";
import Link from "next/link";
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts";
import { WithdrawButton } from "./dashboard-actions";

export type DayRevenue = { date: string; revenue: number; refunded: number };

const chartConfig = {
  revenue:  { label: "Revenue",  color: "var(--foreground)" },
  refunded: { label: "Refunded", color: "var(--muted-foreground)" },
};

type Props = {
  data: DayRevenue[];
  totalSales: number;
  totalEarned: number;
  stripeConnected: boolean;
  hasLinks: boolean;
};

export function RevenueChart({ data, totalSales, totalEarned, stripeConnected, hasLinks }: Props) {
  const hasData = data.some((d) => d.revenue > 0 || d.refunded > 0);

  return (
    <div className="border border-border rounded-2xl bg-card overflow-hidden">
      {/* Stat boxes */}
      <div className={`grid divide-x divide-border border-b border-border ${stripeConnected ? "grid-cols-2" : ""}`}>
        <div className="px-4 py-4">
          <p className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground mb-1">
            Total sales
          </p>
          <p className="text-2xl font-medium text-foreground tabular-nums">{totalSales}</p>
        </div>
        {stripeConnected && (
          <div className="px-4 py-4 flex items-center justify-between gap-2">
            <div>
              <p className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground mb-1">
                Total earned
              </p>
              <p className="text-2xl font-medium text-foreground tabular-nums">
                ${totalEarned.toFixed(2)}
              </p>
            </div>
            <span className="hidden sm:inline-flex">
              <WithdrawButton />
            </span>
          </div>
        )}
      </div>

      {/* Chart */}
      <div className="px-3 pt-3 pb-1">
        <div className="flex items-center justify-between px-1 mb-3">
          <p className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
            Revenue · last 30 days
          </p>
          {hasData && data.some((d) => d.refunded > 0) && (
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                <span className="inline-block w-2 h-2 rounded-sm bg-foreground" />
                Sales
              </span>
              <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                <span className="inline-block w-2 h-2 rounded-sm bg-muted-foreground/50" />
                Refunded
              </span>
            </div>
          )}
        </div>
        {hasData ? (
          <ChartContainer config={chartConfig} className="h-[140px] w-full">
            <BarChart data={data} margin={{ top: 0, right: 0, left: -20, bottom: 0 }} stackOffset="none">
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
                    formatter={(value, name) => [
                      `$${Number(value).toFixed(2)}`,
                      name === "revenue" ? "Revenue" : "Refunded",
                    ]}
                  />
                }
              />
              <Bar dataKey="revenue"  stackId="a" fill="var(--color-revenue)"  radius={[3, 3, 0, 0]} />
              <Bar dataKey="refunded" stackId="a" fill="var(--color-refunded)" fillOpacity={0.45} radius={[3, 3, 0, 0]} />
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
