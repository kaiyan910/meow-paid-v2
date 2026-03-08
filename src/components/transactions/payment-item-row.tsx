/**
 * PaymentItemRow — a single payment subtype + price pair in the transaction form.
 * Multiple rows compose the "Payment Details" section.
 * Includes a calculator button next to the price field.
 */
import { Calculator, Trash2 } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { CalculatorDialog } from "@/components/transactions/calculator-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { usePaymentSubtypes } from "@/hooks/use-meta-queries";

const SELECT_CLASS =
  "flex h-10 w-full rounded-sm border-2 border-input bg-background px-3 py-2 text-sm font-retro ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

interface PaymentItemRowProps {
  subtypeId: string;
  price: string;
  onSubtypeChange: (value: string) => void;
  onPriceChange: (value: string) => void;
  onRemove: () => void;
  canRemove: boolean;
}

function PaymentItemRow({
  subtypeId,
  price,
  onSubtypeChange,
  onPriceChange,
  onRemove,
  canRemove,
}: PaymentItemRowProps) {
  const { t } = useTranslation();
  const paymentSubtypes = usePaymentSubtypes();
  const [calcOpen, setCalcOpen] = useState(false);

  return (
    <>
      <div className="flex items-start gap-2">
        {/* Payment subtype select */}
        <select
          value={subtypeId}
          onChange={(e) => onSubtypeChange(e.target.value)}
          className={`${SELECT_CLASS} flex-1`}
        >
          <option value="">
            {t("transactions.form.paymentSubtypePlaceholder")}
          </option>
          {paymentSubtypes.data?.map((pt) => (
            <option key={pt.id} value={pt.id}>
              {pt.name}
            </option>
          ))}
        </select>

        {/* Price input */}
        <Input
          type="number"
          step="0.1"
          min="0"
          value={price}
          onChange={(e) => onPriceChange(e.target.value)}
          placeholder={t("transactions.form.pricePlaceholder")}
          className="h-10 w-24 border-2 font-retro"
        />

        {/* Calculator button */}
        <Button
          type="button"
          size="icon"
          variant="outline"
          className="size-10 shrink-0 border-2"
          onClick={() => setCalcOpen(true)}
        >
          <Calculator className="size-3.5" />
        </Button>

        {/* Remove button */}
        {canRemove && (
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="size-10 shrink-0 text-muted-foreground hover:text-destructive"
            onClick={onRemove}
          >
            <Trash2 className="size-3.5" />
          </Button>
        )}
      </div>

      {/* Calculator dialog */}
      <CalculatorDialog
        open={calcOpen}
        onOpenChange={setCalcOpen}
        initialValue={price}
        onConfirm={onPriceChange}
      />
    </>
  );
}

export { PaymentItemRow };
