"use client";

import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { CATEGORIES } from "@/lib/categories";
import { useBattleStore } from "@/lib/store/battle-store";

interface CategorySelectorProps {
  disabled?: boolean;
}

export function CategorySelector({ disabled }: CategorySelectorProps) {
  const { category, setCategory, pendingCategory, confirmCategorySwitch, cancelCategorySwitch } = useBattleStore();

  return (
    <div className="space-y-2">
      <p className="text-sm text-muted-foreground">카테고리 선택</p>
      <ToggleGroup
        value={[category]}
        onValueChange={(values) => {
          // base-ui ToggleGroup: values is an array
          // When single-select (default), the new selection is the last value
          // When deselecting the current item, values becomes empty -- ignore to prevent no-selection
          if (values.length > 0) {
            const newValue = values[values.length - 1];
            if (newValue !== category) {
              setCategory(newValue);
            }
          }
        }}
        disabled={disabled}
        className="flex flex-nowrap gap-2 overflow-x-auto scrollbar-hide md:flex-wrap md:overflow-x-visible"
      >
        {CATEGORIES.map((cat) => (
          <ToggleGroupItem
            key={cat.id}
            value={cat.id}
            className="flex-shrink-0 min-h-[44px] px-4 transition-colors duration-200 ease-out data-[pressed]:bg-primary data-[pressed]:text-primary-foreground data-[pressed]:font-bold data-[pressed]:border-primary border"
          >
            {cat.emoji} {cat.label}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>

      {/* Inline warning when pendingCategory is set (UI-SPEC: category switch with modified prompt) */}
      {pendingCategory && (
        <div
          role="alert"
          className="flex items-center gap-2 text-sm text-destructive animate-in fade-in duration-200"
        >
          <span>수정한 프롬프트가 있습니다. 카테고리를 변경하시겠습니까?</span>
          <button
            type="button"
            onClick={confirmCategorySwitch}
            className="text-muted-foreground hover:text-foreground underline"
          >
            변경
          </button>
          <button
            type="button"
            onClick={cancelCategorySwitch}
            className="text-muted-foreground hover:text-foreground underline"
          >
            취소
          </button>
        </div>
      )}
    </div>
  );
}
