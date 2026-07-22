import { InputHTMLAttributes } from "react";
import { getBackgroundColor } from "../colorHelpers";
import { Tracker } from "../trackerHelpersBasic";
import PartiallyControlledInput from "./PartiallyControlledInput";
import { cn } from "../lib/utils";
import IconButton from "./IconButton";
import SimpleMinusIcon from "../icons/SimpleMinusIcon";
import SimplePlusIcon from "../icons/SimplePlusIcon";

export default function CounterTrackerInput({
  tracker,
  color,
  updateHandler,
  increment,
  decrement,
  inputProps,
  animateOnlyWhenRootActive = false,
}: {
  tracker: Tracker;
  color: number | string;
  updateHandler: (content: string) => void;
  increment: () => void;
  decrement: () => void;
  inputProps?: InputHTMLAttributes<HTMLInputElement>;
  animateOnlyWhenRootActive?: boolean;
}): React.JSX.Element {
  if (tracker.variant !== "counter")
    throw new Error("Expected value tracker variant");

  const animationDuration300 = animateOnlyWhenRootActive
    ? "group-focus-within/root:duration-300 group-hover/root:duration-300"
    : "duration-300";

  return (
    <div className="group text-text-primary dark:text-text-primary-dark">
      <div
        className={cn(
          animationDuration300,
          "col-start-1 row-start-1 min-h-[14.5px] max-w-[100px] overflow-clip text-nowrap text-center text-2xs",
        )}
      >
        {tracker.name}
      </div>

      <div
        className={cn(
          typeof color === "number" && getBackgroundColor(color),
          "flex h-[44px] w-[100px] overflow-clip rounded-2xl",
        )}
        style={typeof color === "string" ? { backgroundColor: color } : undefined}
      >
        <IconButton
          className="h-full w-full rounded-none"
          Icon={SimpleMinusIcon}
          onClick={decrement}
        />
        <PartiallyControlledInput
          {...inputProps}
          parentValue={tracker.value.toString()}
          onUserConfirm={(target) => updateHandler(target.value)}
          className="h-[44px] w-full bg-transparent text-center outline-none"
          clearContentOnFocus
        />
        <IconButton
          className="h-full w-full rounded-none"
          Icon={SimplePlusIcon}
          onClick={increment}
        />
      </div>
    </div>
  );
}
