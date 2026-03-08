/**
 * Transfer UI store — tracks the current month for the transfer page.
 */
import moment from "moment";
import { create } from "zustand";

interface TransferUIState {
  /** Current month as moment object. */
  currentMonth: moment.Moment;
  /** Go to the previous month. */
  prevMonth: () => void;
  /** Go to the next month. */
  nextMonth: () => void;
  /** Jump to a specific year and month. */
  setMonth: (year: number, month: number) => void;
}

export const useTransferStore = create<TransferUIState>((set) => ({
  currentMonth: moment().startOf("month"),
  prevMonth: () =>
    set((state) => ({
      currentMonth: state.currentMonth.clone().subtract(1, "month"),
    })),
  nextMonth: () =>
    set((state) => ({
      currentMonth: state.currentMonth.clone().add(1, "month"),
    })),
  setMonth: (year, month) =>
    set({ currentMonth: moment({ year, month }).startOf("month") }),
}));
