/**
 * LastSixMonthsStats — bar chart showing monthly totals for the last 6 months.
 * Includes payment type and subtype dropdown filters.
 */
import { BarChart3, Loader2 } from "lucide-react";
import moment from "moment";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  XAxis,
  YAxis,
} from "recharts";

import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { usePaymentTypes } from "@/hooks/use-meta-queries";
import {
  useMonthlyTotals,
  usePaymentSubtypesByType,
} from "@/hooks/use-statistics";

const TOTAL_VALUE = "__total__";
const ALL_VALUE = "__all__";

const chartConfig = {
  total: {
    label: "Total",
    color: "var(--color-primary)",
  },
} satisfies ChartConfig;

const SELECT_CLASS =
  "flex h-10 w-full rounded-sm border-2 border-input bg-background px-3 py-2 text-sm font-retro ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

function LastSixMonthsStats() {
  const { t } = useTranslation();
  const currentMonth = moment().startOf("month");

  const [paymentTypeId, setPaymentTypeId] = useState<string>(TOTAL_VALUE);
  const [paymentSubtypeId, setPaymentSubtypeId] = useState<string>(ALL_VALUE);

  const { data: paymentTypes } = usePaymentTypes();

  /* Fetch subtypes filtered by selected payment type. */
  const isTotal = paymentTypeId === TOTAL_VALUE;
  const { data: subtypes } = usePaymentSubtypesByType(
    isTotal ? null : paymentTypeId,
  );

  /* Build filter params for the query. */
  const filterTypeId = isTotal ? null : paymentTypeId;
  const filterSubtypeId =
    isTotal || paymentSubtypeId === ALL_VALUE ? null : paymentSubtypeId;

  const { data: totals, isLoading } = useMonthlyTotals(
    currentMonth,
    filterTypeId,
    filterSubtypeId,
  );

  /* Build all 6 months and merge with API data so the x-axis always shows all months. */
  const chartData = useMemo(() => {
    const months: Array<{ month: string; total: number }> = [];
    for (let i = 5; i >= 0; i--) {
      months.push({
        month: currentMonth.clone().subtract(i, "months").format("MMM"),
        total: 0,
      });
    }
    if (totals) {
      const lookup = new Map(
        totals.map((row) => [
          moment(row.month_start).format("MMM"),
          Math.round(row.total * 10) / 10,
        ]),
      );
      for (const entry of months) {
        entry.total = lookup.get(entry.month) ?? 0;
      }
    }
    return months;
  }, [totals, currentMonth]);

  /* Check if there is any data across all 6 months. */
  const hasData = useMemo(
    () => chartData.some((d) => d.total > 0),
    [chartData],
  );

  /* Calculate average. */
  const average = useMemo(() => {
    if (!chartData.length) return 0;
    const sum = chartData.reduce((acc, d) => acc + d.total, 0);
    return Math.round((sum / chartData.length) * 10) / 10;
  }, [chartData]);

  /** Handle payment type change — reset subtype when type changes. */
  const handleTypeChange = (value: string) => {
    setPaymentTypeId(value);
    setPaymentSubtypeId(ALL_VALUE);
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="space-y-2">
        {/* Payment type dropdown */}
        <div className="space-y-1">
          <label
            htmlFor="stat-payment-type"
            className="text-[10px] uppercase tracking-widest text-muted-foreground"
          >
            {t("statistics.paymentType")}
          </label>
          <select
            id="stat-payment-type"
            value={paymentTypeId}
            onChange={(e) => handleTypeChange(e.target.value)}
            className={SELECT_CLASS}
          >
            <option value={TOTAL_VALUE}>{t("statistics.total")}</option>
            {paymentTypes?.map((pt) => (
              <option key={pt.id} value={pt.id}>
                {pt.name}
              </option>
            ))}
          </select>
        </div>

        {/* Payment subtype dropdown */}
        <div className="space-y-1">
          <label
            htmlFor="stat-payment-subtype"
            className="text-[10px] uppercase tracking-widest text-muted-foreground"
          >
            {t("statistics.paymentSubtype")}
          </label>
          <select
            id="stat-payment-subtype"
            value={paymentSubtypeId}
            onChange={(e) => setPaymentSubtypeId(e.target.value)}
            disabled={isTotal}
            className={SELECT_CLASS}
          >
            <option value={ALL_VALUE}>{t("statistics.all")}</option>
            {subtypes?.map((ps) => (
              <option key={ps.id} value={ps.id}>
                {ps.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Bar chart */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="size-5 animate-spin text-muted-foreground" />
        </div>
      ) : !hasData ? (
        <div className="flex flex-col items-center justify-center gap-2 py-12 text-muted-foreground">
          <BarChart3 className="size-10" />
          <p className="text-xs tracking-widest uppercase">
            {t("statistics.noData")}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <ChartContainer config={chartConfig} className="aspect-[2/1] w-full">
            <BarChart data={chartData} accessibilityLayer>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="month"
                tickLine={false}
                tickMargin={8}
                axisLine={false}
              />
              <YAxis tickLine={false} axisLine={false} tickMargin={4} hide />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar
                dataKey="total"
                fill="var(--color-total)"
                radius={[2, 2, 0, 0]}
              >
                <LabelList
                  dataKey="total"
                  position="top"
                  className="fill-muted-foreground text-[10px]"
                  formatter={(v: number) => (v > 0 ? `$${v}` : "")}
                />
              </Bar>
            </BarChart>
          </ChartContainer>

          {/* Average */}
          <div className="flex items-center justify-between border-t-2 border-border pt-3">
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              {t("statistics.average")}
            </span>
            <span className="text-sm font-bold text-primary">
              ${average.toFixed(2)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

export { LastSixMonthsStats };
