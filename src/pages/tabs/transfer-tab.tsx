/**
 * TransferTab — shows monthly expense summary and per-user payback amounts.
 * Uses a month selector (same as transactions page) for navigation.
 */
import { Loader2 } from "lucide-react";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";

import { MonthSelector } from "@/components/transactions/month-selector";
import { useProfiles } from "@/hooks/use-profile";
import { useTransferSummary } from "@/hooks/use-transfer";
import { useTransferStore } from "@/store/transfer.store";

function TransferTab() {
  const { t } = useTranslation();
  const { currentMonth, prevMonth, nextMonth, setMonth } = useTransferStore();
  const { data: payeeTotals, isLoading } = useTransferSummary(currentMonth);
  const { data: profiles } = useProfiles();

  /* Compute total expense and average per user. */
  const { totalExpense, averageCost, userRows } = useMemo(() => {
    const userCount = profiles?.length ?? 0;
    const total = payeeTotals?.reduce((sum, row) => sum + row.total, 0) ?? 0;
    const avg = userCount > 0 ? total / userCount : 0;

    /* Build a row for every profile, even if they paid nothing. */
    const rows = (profiles ?? []).map((profile) => {
      const paid =
        payeeTotals?.find((r) => r.payee_id === profile.user_id)?.total ?? 0;
      const owes = Math.max(0, Math.round((avg - paid) * 10) / 10);
      return {
        userId: profile.user_id,
        displayName: profile.display_name ?? profile.user_id,
        paid: Math.round(paid * 10) / 10,
        owes,
      };
    });

    return { totalExpense: total, averageCost: avg, userRows: rows };
  }, [payeeTotals, profiles]);

  return (
    <div className="space-y-4 p-4">
      {/* Month selector */}
      <MonthSelector
        currentMonth={currentMonth}
        onPrevMonth={prevMonth}
        onNextMonth={nextMonth}
        onSetMonth={setMonth}
      />

      {/* Summary section */}
      <div className="flex items-stretch gap-3">
        <div className="flex-1 rounded-sm border-2 border-border p-3 text-center">
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
            {t("transfer.totalExpense")}
          </p>
          <p className="mt-1 text-xl font-bold text-primary">
            ${totalExpense.toFixed(2)}
          </p>
        </div>
        <div className="flex-1 rounded-sm border-2 border-border p-3 text-center">
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
            {t("transfer.averageCost")}
          </p>
          <p className="mt-1 text-xl font-bold text-primary">
            ${averageCost.toFixed(2)}
          </p>
        </div>
      </div>

      {/* User list */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="size-5 animate-spin text-muted-foreground" />
        </div>
      ) : userRows.length === 0 ? (
        <p className="py-12 text-center text-xs tracking-widest uppercase text-muted-foreground">
          {t("transfer.empty")}
        </p>
      ) : (
        <ul className="space-y-2">
          {userRows.map((user) => (
            <li
              key={user.userId}
              className="flex items-center justify-between rounded-sm border-2 border-border p-3 shadow-[2px_2px_0px_0px] shadow-border/40"
            >
              <div className="space-y-0.5">
                <p className="text-sm font-bold">{user.displayName}</p>
                <p className="text-[10px] tracking-widest text-muted-foreground">
                  {t("transfer.paid")}: ${user.paid.toFixed(2)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
                  {t("transfer.owes")}
                </p>
                <p className="text-sm font-bold text-destructive">
                  ${user.owes.toFixed(2)}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export { TransferTab };
