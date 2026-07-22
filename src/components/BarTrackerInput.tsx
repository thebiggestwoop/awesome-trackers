import { InputHTMLAttributes, useState } from "react";
import { getBackgroundColor } from "../colorHelpers";
import { Tracker } from "../trackerHelpersBasic";
import PartiallyControlledInput from "./PartiallyControlledInput";

export default function BarTrackerInput({
  tracker,
  color,
  valueUpdateHandler,
  maxUpdateHandler,
  valueInputProps,
  maxInputProps,
  animateOnlyWhenRootActive = false,
}: {
  tracker: Tracker;
  color: number | string;
  valueUpdateHandler: (content: string) => void;
  maxUpdateHandler: (content: string) => void;
  valueInputProps?: InputHTMLAttributes<HTMLInputElement>;
  maxInputProps?: InputHTMLAttributes<HTMLInputElement>;
  animateOnlyWhenRootActive?: boolean;
}): React.JSX.Element {
  if (tracker.variant !== "value-max")
    throw new Error("Expected value-max tracker variant");

  const animationDuration300 = animateOnlyWhenRootActive
    ? "group-focus-within/root:duration-300 group-hover/root:duration-300"
    : "duration-300";

  const [focusTarget, setFocusTarget] = useState<"value" | "max">("value");

  const ValueInput = (
    <PartiallyControlledInput
      {...valueInputProps}
      className="h-full w-full bg-transparent text-center outline-none"
      parentValue={tracker.value.toString()}
      onFocus={() => setFocusTarget("value")}
      onUserConfirm={(target) => valueUpdateHandler(target.value)}
      clearContentOnFocus
    />
  );
  const MaxInput = (
    <PartiallyControlledInput
      {...maxInputProps}
      className="h-full w-full bg-transparent text-center outline-none"
      parentValue={tracker.max.toString()}
      onFocus={() => setFocusTarget("max")}
      onUserConfirm={(target) => maxUpdateHandler(target.value)}
      clearContentOnFocus
    />
  );

  return (
    <div className="group text-text-primary dark:text-text-primary-dark">
      <div className=" grid">
        <div
          className={`${animationDuration300} col-start-1 row-start-1 min-h-[14.5px] w-full overflow-clip text-nowrap text-center text-2xs opacity-0 transition-opacity  group-focus-within:opacity-100`}
        >
          {focusTarget === "value" ? tracker.value : tracker.max}
        </div>
        <div
          className={`${animationDuration300} col-start-1 row-start-1 min-h-[14.5px] w-full overflow-clip text-nowrap text-center text-2xs opacity-100 transition-opacity  group-focus-within:opacity-0`}
        >
          {tracker.name}
        </div>
      </div>

      <div
        className={`${typeof color === "number" ? getBackgroundColor(color) : ""} flex h-[44px] w-[100px] items-center rounded-2xl`}
        style={typeof color === "string" ? { backgroundColor: color } : undefined}
      >
        {ValueInput}
        <div className="self-center pt-[2px]">/</div>
        {MaxInput}
      </div>
    </div>
  );
}
