/**
 * StatisticsTab — shows expense statistics with two tabs:
 * "This Month" for current month breakdown and "Last 6 Months" for trend chart.
 */
import { useTranslation } from "react-i18next";

import { LastSixMonthsStats } from "@/components/statistics/last-six-months-stats";
import { ThisMonthStats } from "@/components/statistics/this-month-stats";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

function StatisticsTab() {
  const { t } = useTranslation();

  return (
    <div className="space-y-4 p-4">
      <Tabs defaultValue="this-month">
        <TabsList className="w-full">
          <TabsTrigger value="this-month" className="flex-1">
            {t("statistics.thisMonth")}
          </TabsTrigger>
          <TabsTrigger value="last-6-months" className="flex-1">
            {t("statistics.lastSixMonths")}
          </TabsTrigger>
        </TabsList>
        <TabsContent value="this-month">
          <ThisMonthStats />
        </TabsContent>
        <TabsContent value="last-6-months">
          <LastSixMonthsStats />
        </TabsContent>
      </Tabs>
    </div>
  );
}

export { StatisticsTab };
