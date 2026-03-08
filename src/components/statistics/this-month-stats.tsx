/**
 * ThisMonthStats — shows total expenses and category breakdown
 * for the current month using real Supabase data.
 */
import { Loader2 } from "lucide-react";
import moment from "moment";
import { useTranslation } from "react-i18next";

import { useMonthlyStats } from "@/hooks/use-statistics";

function ThisMonthStats() {
  const { t } = useTranslation();
  const currentMonth = moment().startOf("month");
  const { data: stats, isLoading } = useMonthlyStats(currentMonth);

  const totalExpenses = stats?.reduce((sum, row) => sum + row.total, 0) ?? 0;
  const maxTotal =
    stats && stats.length > 0 ? Math.max(...stats.map((r) => r.total)) : 1;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="size-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary card */}
      <div className="rounded-sm border-2 border-primary p-5 text-center shadow-[4px_4px_0px_0px] shadow-primary/30">
        <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
          {t("statistics.totalExpenses")}
        </p>
        <p className="mt-1 text-4xl font-bold text-primary">
          ${totalExpenses.toFixed(2)}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          {currentMonth.format("MMMM YYYY")}
        </p>
      </div>

      {/* Category breakdown */}
      <div className="space-y-3">
        <h2 className="text-[10px] uppercase tracking-widest text-muted-foreground">
          {t("statistics.categoryBreakdown")}
        </h2>
        {stats && stats.length > 0 ? (
          stats.map((row) => {
            const pct =
              totalExpenses > 0
                ? Math.round((row.total / totalExpenses) * 100)
                : 0;
            return (
              <div key={row.payment_subtype_id} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="tracking-wide">
                    {row.payment_subtype_name}
                  </span>
                  <span className="font-bold tabular-nums">
                    ${row.total.toFixed(2)}{" "}
                    <span className="text-muted-foreground">({pct}%)</span>
                  </span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-sm border border-border bg-muted">
                  <div
                    className="h-full rounded-sm bg-primary transition-all"
                    style={{
                      width: `${(row.total / maxTotal) * 100}%`,
                      opacity: 0.3 + (row.total / maxTotal) * 0.7,
                    }}
                  />
                </div>
              </div>
            );
          })
        ) : (
          <p className="text-xs text-muted-foreground">
            {t("statistics.noData")}
          </p>
        )}
      </div>
    </div>
  );
}

export { ThisMonthStats };
