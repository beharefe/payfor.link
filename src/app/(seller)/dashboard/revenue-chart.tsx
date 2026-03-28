"use client";

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@unseallink/components/ui/chart";
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
};

export function RevenueChart({ data, totalSales, totalEarned, stripeConnected }: Props) {
  const hasData = data.some((d) => d.revenue > 0);

  return (
    <div className="border border-border rounded-2xl bg-card overflow-hidden">
      {/* Stat boxes */}
      <div className="grid grid-cols-2 divide-x divide-border border-b border-border">
        <div className="px-6 py-5">
          <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground mb-1">
            Total sales
          </p>
          <p className="text-3xl font-medium text-foreground tabular-nums">{totalSales}</p>
        </div>
        <div className="px-6 py-5 flex flex-col gap-3">
          <div>
            <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground mb-1">
              Total earned
            </p>
            <p className="text-3xl font-medium text-foreground tabular-nums">
              ${totalEarned.toFixed(2)}
            </p>
          </div>
          {stripeConnected ? (
            <WithdrawButton />
          ) : (
            <InitiateStripeConnectButton label="Set Up Payout" />
          )}
        </div>
      </div>

      {/* Chart */}
      <div className="px-4 pt-4 pb-2">
        <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground mb-4 px-2">
          Revenue · last 30 days
        </p>
        {hasData ? (
          <ChartContainer config={chartConfig} className="h-[200px] w-full">
            <BarChart data={data} margin={{ top: 0, right: 0, left: -16, bottom: 0 }}>
              <CartesianGrid vertical={false} stroke="hsl(var(--border))" />
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
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
          <div className="h-[200px] flex items-center justify-center">
            <p className="text-sm text-muted-foreground">No sales yet</p>
          </div>
        )}
      </div>
    </div>
  );
}
