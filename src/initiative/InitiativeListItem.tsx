import { InitiativeEntry } from "../initiativeHelpers";
import IconButton from "../components/IconButton";
import CheckedCircle from "../icons/CheckedCircle";
import UncheckedCircle from "../icons/UncheckedCircle";
import CloseIcon from "../icons/CloseIcon";
import NotVisibleIcon from "../icons/NotVisibleIcon";
import TokenImage from "./TokenImage";
import { cn } from "../lib/utils";
import { focusOnItem } from "./focusOnItem";

export default function InitiativeListItem({
  entry,
  role,
  onReadyChange,
  onRemove,
}: {
  entry: InitiativeEntry;
  role: "GM" | "PLAYER";
  onReadyChange: (slotId: string, ready: boolean) => void;
  onRemove: () => void;
}): React.JSX.Element | null {
  if (!entry.visible && role !== "GM") return null;

  const anyActive = !entry.defeated && entry.slots.some((slot) => slot.active);
  const allSpent = entry.slots.every((slot) => !slot.ready && !slot.active);
  // Players can see enemy activation state but not change it -- only the
  // GM (or the party's own entries) can toggle ready/active.
  const canToggleActivation = role === "GM" || entry.group === "PARTY";

  return (
    <div
      className={cn(
        "group flex items-center gap-2 rounded-lg px-2 py-1 hover:bg-black/10 dark:hover:bg-white/10",
        anyActive && "bg-white/40 dark:bg-black/40",
      )}
      onDoubleClick={() => focusOnItem(entry.itemId)}
    >
      <button
        className="relative grid size-[30px] shrink-0 place-items-center"
        onClick={onRemove}
        title="Remove from initiative"
      >
        <div className="col-start-1 row-start-1 group-hover:opacity-0">
          <TokenImage src={entry.url} outline={anyActive} />
        </div>
        <CloseIcon className="col-start-1 row-start-1 size-[22px] fill-text-secondary opacity-0 group-hover:opacity-100 dark:fill-text-primary-dark" />
      </button>

      {!entry.visible && role === "GM" && (
        <NotVisibleIcon className="size-4 shrink-0 fill-text-secondary opacity-60 dark:fill-text-primary-dark" />
      )}

      <div
        className={cn(
          "grow truncate text-sm text-text-primary dark:text-text-primary-dark",
          (allSpent || entry.defeated) &&
            "text-text-secondary dark:text-text-secondary-dark",
          !entry.visible && role === "GM" && "opacity-60",
        )}
      >
        {entry.name}
      </div>

      {!entry.defeated && (
        <div className="flex shrink-0 items-center">
          {entry.slots.map((slot) => (
            <IconButton
              key={slot.id}
              Icon={slot.ready ? CheckedCircle : UncheckedCircle}
              className={cn(
                "size-[28px] disabled:opacity-30",
                !slot.ready && !slot.active && "opacity-50",
              )}
              disabled={!canToggleActivation}
              onClick={
                canToggleActivation
                  ? () => onReadyChange(slot.id, !slot.ready)
                  : undefined
              }
              title={
                canToggleActivation
                  ? slot.ready
                    ? "Mark as acted"
                    : "Mark as ready"
                  : "Only the GM can toggle enemy activations"
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}
