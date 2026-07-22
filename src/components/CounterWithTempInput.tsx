import { getBackgroundColor } from "../colorHelpers";
import { Tracker } from "../trackerHelpersBasic";
import PartiallyControlledInput from "./PartiallyControlledInput";
import { cn } from "../lib/utils";
import IconButton from "./IconButton";
import SimpleMinusIcon from "../icons/SimpleMinusIcon";
import SimplePlusIcon from "../icons/SimplePlusIcon";

/** Two half-width steppers, side by side, for a tracker whose on-map
 * bubble shows the SUM of two independently-tracked numbers (e.g.
 * Resistance + Temp Resistance) -- neither number is directly editable
 * via the bubble itself, only through these two separate inputs. */
export default function CounterWithTempInput({
  tracker,
  color,
  updateValue,
  updateTempValue,
  incrementValue,
  decrementValue,
  incrementTempValue,
  decrementTempValue,
  animateOnlyWhenRootActive = false,
}: {
  tracker: Tracker;
  color: number | string;
  updateValue: (content: string) => void;
  updateTempValue: (content: string) => void;
  incrementValue: () => void;
  decrementValue: () => void;
  incrementTempValue: () => void;
  decrementTempValue: () => void;
  animateOnlyWhenRootActive?: boolean;
}): React.JSX.Element {
  if (tracker.variant !== "counter-with-temp")
    throw new Error("Expected counter-with-temp tracker variant");

  const animationDuration300 = animateOnlyWhenRootActive
    ? "group-focus-within/root:duration-300 group-hover/root:duration-300"
    : "duration-300";

  const baseName = tracker.name !== undefined ? tracker.name : "Value";
  const tempLabel = tracker.tempLabel ?? `Temp ${baseName}`;

  const stepper = (
    label: string,
    value: number,
    onConfirm: (content: string) => void,
    onIncrement: () => void,
    onDecrement: () => void,
  ) => (
    <div className="group text-text-primary dark:text-text-primary-dark">
      <div
        className={cn(
          animationDuration300,
          "min-h-[14.5px] w-[48px] overflow-clip text-nowrap text-center text-2xs",
        )}
      >
        {label}
      </div>
      <div
        className={cn(
          typeof color === "number" && getBackgroundColor(color),
          "flex h-[36px] w-[48px] overflow-clip rounded-xl",
        )}
        style={
          typeof color === "string" ? { backgroundColor: color } : undefined
        }
      >
        <IconButton
          className="size-full min-w-0 rounded-none"
          Icon={SimpleMinusIcon}
          onClick={onDecrement}
        />
        <PartiallyControlledInput
          parentValue={value.toString()}
          onUserConfirm={(target) => onConfirm(target.value)}
          className="h-full w-full min-w-0 bg-transparent text-center outline-none"
          clearContentOnFocus
        />
        <IconButton
          className="size-full min-w-0 rounded-none"
          Icon={SimplePlusIcon}
          onClick={onIncrement}
        />
      </div>
    </div>
  );

  return (
    <div className="flex flex-row items-start gap-1">
      {stepper(
        baseName,
        tracker.value,
        updateValue,
        incrementValue,
        decrementValue,
      )}
      {stepper(
        tempLabel,
        tracker.tempValue,
        updateTempValue,
        incrementTempValue,
        decrementTempValue,
      )}
    </div>
  );
}
