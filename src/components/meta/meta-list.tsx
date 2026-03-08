/**
 * MetaList — generic list of meta items with delete action.
 * Each row is clickable to trigger an edit action.
 */
import { Loader2, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";

export interface MetaListItem {
  id: string;
  title: string;
  subtitle?: string;
  /** Optional image URL displayed as a thumbnail (e.g. shop logo). */
  image?: string;
}

interface MetaListProps {
  items: MetaListItem[];
  isLoading: boolean;
  onItemClick: (id: string) => void;
  onDelete: (id: string) => void;
  deletingId: string | null;
}

function MetaList({
  items,
  isLoading,
  onItemClick,
  onDelete,
  deletingId,
}: MetaListProps) {
  const { t } = useTranslation();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="size-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <p className="py-12 text-center text-xs tracking-widest uppercase text-muted-foreground">
        {t("meta.empty")}
      </p>
    );
  }

  return (
    <ul className="space-y-2">
      {items.map((item) => (
        <li key={item.id}>
          <div className="flex w-full gap-2 items-center justify-between rounded-sm border-2 border-border p-3 shadow-[2px_2px_0px_0px] shadow-border/40 transition-colors hover:border-primary/60">
            <button
              type="button"
              onClick={() => onItemClick(item.id)}
              className="flex min-w-0 flex-1 items-center gap-2 text-left bg-transparent border-none p-0 cursor-pointer"
            >
              {item.image && (
                <img
                  src={item.image}
                  alt={item.title}
                  className="size-10 shrink-0 rounded-sm border border-border object-cover"
                />
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium tracking-wide">
                  {item.title}
                </p>
                {item.subtitle && (
                  <p className="truncate text-[10px] uppercase tracking-widest text-muted-foreground">
                    {item.subtitle}
                  </p>
                )}
              </div>
            </button>
            <Button
              type="button"
              size="icon"
              variant="ghost"
              className="ml-2 size-8 shrink-0 text-muted-foreground hover:text-destructive"
              disabled={deletingId === item.id}
              onClick={() => onDelete(item.id)}
            >
              {deletingId === item.id ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <Trash2 className="size-3.5" />
              )}
            </Button>
          </div>
        </li>
      ))}
    </ul>
  );
}

export { MetaList };
