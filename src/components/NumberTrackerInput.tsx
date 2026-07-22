import { InputHTMLAttributes } from "react";
import { getBackgroundColor } from "../colorHelpers";
import { Tracker } from "../trackerHelpersBasic";
import PartiallyControlledInput from "./PartiallyControlledInput";
import { cn } from "../lib/utils";

export default function NumberTrackerInput({
  tracker,
  color,
  updateHandler,
  inputProps,
  animateOnlyWhenRootActive = false,
}: {
  tracker: Tracker;
  color: number | string;
  updateHandler: (content: string) => void;
  inputProps?: InputHTMLAttributes<HTMLInputElement>;
  animateOnlyWhenRootActive?: boolean;
}): React.JSX.Element {
  if (tracker.variant !== "value")
    throw new Error("Expected value tracker variant");

  const animationDuration300 = animateOnlyWhenRootActive
    ? "group-focus-within/root:duration-300 group-hover/root:duration-300"
    : "duration-300";

  const Input = (
    <PartiallyControlledInput
      {...inputProps}
      parentValue={tracker.value.toString()}
      onUserConfirm={(target) => updateHandler(target.value)}
      className="h-[44px] w-full bg-transparent text-center outline-none"
      clearContentOnFocus
    />
  );

  return (
    <div className="group text-text-primary dark:text-text-primary-dark">
      <div className="grid">
        <div
          className={cn(
            animationDuration300,
            "col-start-1 row-start-1 min-h-[14.5px] max-w-[44px] overflow-clip text-nowrap text-center text-2xs  opacity-0 transition-opacity  group-focus-within:opacity-100",
          )}
        >
          {tracker.value}
        </div>
        <div
          className={cn(
            animationDuration300,
            "col-start-1 row-start-1 min-h-[14.5px] max-w-[44px] overflow-clip text-nowrap text-center text-2xs  opacity-100 transition-opacity  group-focus-within:opacity-0",
          )}
        >
          {tracker.name}
        </div>
      </div>

      <div
        className={cn(
          typeof color === "number" && getBackgroundColor(color),
          "h-[44px] w-[44px] rounded-2xl",
        )}
        style={typeof color === "string" ? { backgroundColor: color } : undefined}
      >
        {Input}
      </div>
    </div>
  );
}
