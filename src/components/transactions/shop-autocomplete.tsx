/**
 * ShopAutocomplete — filterable text input that suggests shops from the database.
 * Shows a dropdown list matching the typed query; selecting sets the shop_id.
 */
import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import { Input } from "@/components/ui/input";
import { useShops } from "@/hooks/use-meta-queries";
import { cn } from "@/lib/utils";

interface ShopAutocompleteProps {
  value: string;
  onChange: (shopId: string) => void;
  onBlur: () => void;
}

function ShopAutocomplete({ value, onChange, onBlur }: ShopAutocompleteProps) {
  const { t } = useTranslation();
  const shops = useShops();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Find current shop name for display
  const selectedShop = shops.data?.find((s) => s.id === value);
  const displayValue = query || (selectedShop ? selectedShop.name : "");

  // Filter shops by query
  const filtered = (shops.data ?? []).filter((s) =>
    s.name.toLowerCase().includes((query || "").toLowerCase()),
  );

  return (
    <div ref={containerRef} className="relative">
      <Input
        value={displayValue}
        placeholder={t("transactions.form.shopPlaceholder")}
        className="border-2 font-retro"
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
          if (value) onChange("");
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => {
          setTimeout(() => {
            setOpen(false);
            onBlur();
          }, 150);
        }}
      />
      {open && filtered.length > 0 && (
        <ul className="absolute z-50 mt-1 max-h-48 w-full overflow-y-auto rounded-sm border-2 border-border bg-background shadow-[2px_2px_0px_0px] shadow-border/40">
          {filtered.map((shop) => (
            <li key={shop.id}>
              <button
                type="button"
                className={cn(
                  "flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors hover:bg-muted",
                  value === shop.id && "bg-muted font-medium",
                )}
                onMouseDown={(e) => {
                  e.preventDefault();
                  onChange(shop.id);
                  setQuery(shop.name);
                  setOpen(false);
                }}
              >
                {shop.logo && (
                  <img
                    src={shop.logo}
                    alt={shop.name}
                    className="size-6 shrink-0 rounded-sm border border-border object-cover"
                  />
                )}
                <span className="truncate">{shop.name}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export { ShopAutocomplete };
