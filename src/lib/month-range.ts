import type { Moment } from "moment";

/** Sends the browser's calendar-month boundaries as UTC instants. */
export function monthRange(month: Moment) {
  return {
    start: month.clone().startOf("month").toISOString(),
    end: month.clone().endOf("month").toISOString(),
  };
}
