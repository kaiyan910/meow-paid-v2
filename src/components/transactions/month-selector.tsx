/**
 * MonthSelector — navigates between months for filtering.
 * Displays the current month/year with previous/next buttons.
 * Clicking the month label opens a year/month picker for fast navigation.
 * Accepts month state via props so it can be reused across pages.
 */
import { ChevronLeft, ChevronRight } from "lucide-react";
import type moment from "moment";
import momentFn from "moment";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

const MONTHS = Array.from({ length: 12 }, (_, i) =>
  momentFn().month(i).format("MMM"),
);

interface MonthSelectorProps {
  currentMonth: moment.Moment;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onSetMonth: (year: number, month: number) => void;
}

function MonthSelector({
  currentMonth,
  onPrevMonth,
  onNextMonth,
  onSetMonth,
}: MonthSelectorProps) {
  const { t } = useTranslation();
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerYear, setPickerYear] = useState(currentMonth.year());

  const label = currentMonth.format("MMMM YYYY");
  const selectedYear = currentMonth.year();
  const selectedMonthIdx = currentMonth.month();
  const handleMonthSelect = (monthIdx: number) => {
    onSetMonth(pickerYear, monthIdx);
    setPickerOpen(false);
  };

  return (
    <div className="flex items-center justify-between border-b-2 border-border pb-3">
      <button
        type="button"
        aria-label={t("transactions.prevMonth")}
        onClick={onPrevMonth}
        className="flex size-8 items-center justify-center rounded-sm border-2 border-border text-muted-foreground transition-colors hover:text-foreground"
      >
        <ChevronLeft className="size-4" />
      </button>

      {/* Clickable month label with popover */}
      <Popover
        open={pickerOpen}
        onOpenChange={(open) => {
          setPickerOpen(open);
          if (open) setPickerYear(currentMonth.year());
        }}
      >
        <PopoverTrigger asChild>
          <button
            type="button"
            className="cursor-pointer rounded-sm px-3 py-1 text-sm font-bold tracking-widest uppercase transition-colors hover:bg-muted"
          >
            {label}
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-64 p-3" align="center">
          {/* Year selector */}
          <div className="mb-3 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setPickerYear((y) => y - 1)}
              className="flex size-7 items-center justify-center rounded-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              <ChevronLeft className="size-4" />
            </button>
            <span className="text-sm font-bold tracking-widest">
              {pickerYear}
            </span>
            <button
              type="button"
              onClick={() => setPickerYear((y) => y + 1)}
              className="flex size-7 items-center justify-center rounded-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              <ChevronRight className="size-4" />
            </button>
          </div>

          {/* Month grid */}
          <div className="grid grid-cols-3 gap-1.5">
            {MONTHS.map((name, idx) => {
              const isSelected =
                pickerYear === selectedYear && idx === selectedMonthIdx;
              return (
                <Button
                  key={name}
                  type="button"
                  variant={isSelected ? "default" : "ghost"}
                  size="sm"
                  className={cn(
                    "text-xs tracking-wider uppercase",
                    isSelected && "font-bold",
                  )}
                  onClick={() => handleMonthSelect(idx)}
                >
                  {name}
                </Button>
              );
            })}
          </div>
        </PopoverContent>
      </Popover>

      <button
        type="button"
        aria-label={t("transactions.nextMonth")}
        onClick={onNextMonth}
        className="flex size-8 items-center justify-center rounded-sm border-2 border-border text-muted-foreground transition-colors hover:text-foreground"
      >
        <ChevronRight className="size-4" />
      </button>
    </div>
  );
}

export { MonthSelector };
