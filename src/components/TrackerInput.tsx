import { InputHTMLAttributes, useState } from "react";
import PartiallyControlledInput from "./PartiallyControlledInput";
import { cn } from "../lib/utils";

export const TrackerInput = ({
  value,
  onConfirm,
  inputProps,
  previousHint,
  fullWidth,
}: {
  value: string;
  onConfirm: (content: string) => void;
  inputProps?: InputHTMLAttributes<HTMLInputElement>;
  previousHint?: boolean;
  fullWidth?: boolean;
}) => {
  const [hasFocus, setHasFocus] = useState(false);
  const [hasHover, setHasHover] = useState(false);

  return (
    <div className={cn({ "w-full": fullWidth === true })}>
      <PartiallyControlledInput
        {...inputProps}
        parentValue={value.toString()}
        onUserConfirm={(target) => onConfirm(target.value)}
        className={cn(
          "peer w-full bg-transparent outline-none",
          inputProps?.className,
        )}
        clearContentOnFocus
        onFocus={() => setHasFocus(true)}
        onBlur={() => setHasFocus(false)}
        onMouseEnter={() => setHasHover(true)}
        onMouseLeave={() => setHasHover(false)}
      />
      <div className="flex min-h-[2px] flex-col justify-end">
        <div
          className={cn(
            "w-full border-b border-text-secondary/0 duration-150 dark:border-white/0",
            {
              "border-text-secondary dark:border-white": hasHover || hasFocus,
            },
          )}
        />
        <div
          className={cn(
            "w-full border-b border-text-secondary duration-150 dark:border-text-secondary-dark",
            {
              "dark:border-white": hasHover || hasFocus,
            },
          )}
        />
      </div>
      {previousHint === true && (
        <div
          className={`pointer-events-none w-full  max-w-full -translate-y-2 overflow-clip text-nowrap text-2xs opacity-0 transition-all duration-150 peer-focus-within:translate-y-0 peer-focus-within:opacity-100`}
        >
          {value}
        </div>
      )}
    </div>
  );
};
