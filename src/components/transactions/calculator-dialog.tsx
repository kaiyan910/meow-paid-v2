/**
 * CalculatorDialog — simple calculator popup for computing price values.
 * Supports +, -, *, / operations. Displays a keypad UI.
 * The result is passed back via onConfirm when the user presses OK.
 */
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface CalculatorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialValue: string;
  onConfirm: (value: string) => void;
}

/** Safely evaluate a simple arithmetic expression. */
function safeEval(expr: string): number | null {
  // Only allow digits, decimal points, operators, spaces, and parentheses
  if (!/^[\d+\-*/. ()]+$/.test(expr)) return null;
  try {
    // Use Function constructor for safe evaluation of arithmetic
    const fn = new Function(`"use strict"; return (${expr});`);
    const result = fn() as unknown;
    if (typeof result !== "number" || !Number.isFinite(result)) return null;
    return Math.round(result * 10) / 10;
  } catch {
    return null;
  }
}

const BUTTONS = [
  ["7", "8", "9", "/"],
  ["4", "5", "6", "*"],
  ["1", "2", "3", "-"],
  ["0", ".", "C", "+"],
] as const;

function CalculatorDialog({
  open,
  onOpenChange,
  initialValue,
  onConfirm,
}: CalculatorDialogProps) {
  const { t } = useTranslation();
  const [expression, setExpression] = useState(initialValue || "0");

  /** Sync expression when dialog opens. */
  useEffect(() => {
    if (open) {
      setExpression(initialValue || "0");
    }
  }, [open, initialValue]);

  const handleButton = (btn: string) => {
    if (btn === "C") {
      setExpression("0");
      return;
    }

    setExpression((prev) => {
      if (prev === "0" && btn !== "." && !"+-*/".includes(btn)) {
        return btn;
      }
      return prev + btn;
    });
  };

  const handleConfirm = () => {
    const result = safeEval(expression);
    if (result !== null) {
      onConfirm(result.toString());
    }
    onOpenChange(false);
  };

  const displayResult = safeEval(expression);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[280px]">
        <DialogHeader>
          <DialogTitle>{t("transactions.form.calculator")}</DialogTitle>
        </DialogHeader>

        {/* Display */}
        <div className="space-y-1">
          <div className="rounded-sm border-2 border-border bg-muted/30 px-3 py-2 text-right font-retro text-sm text-muted-foreground min-h-[2rem] break-all">
            {expression}
          </div>
          {displayResult !== null &&
            expression !== displayResult.toString() && (
              <div className="text-right font-retro text-lg font-bold">
                = {displayResult}
              </div>
            )}
        </div>

        {/* Keypad */}
        <div className="grid grid-cols-4 gap-1.5">
          {BUTTONS.flat().map((btn) => (
            <Button
              key={btn}
              type="button"
              variant={
                "+-*/".includes(btn)
                  ? "outline"
                  : btn === "C"
                    ? "destructive"
                    : "secondary"
              }
              className="h-10 border-2 font-retro text-base"
              onClick={() => handleButton(btn)}
            >
              {btn}
            </Button>
          ))}
        </div>

        {/* Backspace row */}
        <div className="grid grid-cols-2 gap-1.5">
          <Button
            type="button"
            variant="outline"
            className="h-10 border-2 font-retro text-sm"
            onClick={() =>
              setExpression((prev) =>
                prev.length > 1 ? prev.slice(0, -1) : "0",
              )
            }
          >
            ←
          </Button>
          <Button
            type="button"
            variant="outline"
            className="h-10 border-2 font-retro text-sm"
            onClick={() => {
              const result = safeEval(expression);
              if (result !== null) {
                setExpression(result.toString());
              }
            }}
          >
            =
          </Button>
        </div>

        <DialogFooter>
          <Button
            type="button"
            className="w-full border-2"
            onClick={handleConfirm}
          >
            {t("transactions.form.calculatorConfirm")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export { CalculatorDialog };
