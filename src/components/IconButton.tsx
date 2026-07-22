import React, { ComponentType } from "react";
import { IconProps } from "./IconPropsType";
import { cn } from "../lib/utils";

interface IconButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  Icon: ComponentType<IconProps>;
  className?: string;
}

export default function IconButton({
  Icon,
  className,
  ...props
}: IconButtonProps): React.JSX.Element {
  return (
    <button
      {...props}
      className={cn(
        "flex size-[36px] items-center justify-center rounded-full outline-none duration-100 hover:bg-black/10 focus-visible:bg-black/10 hover:dark:bg-white/10 focus-visible:dark:bg-white/10",
        className,
      )}
    >
      <Icon className={"fill-text-secondary dark:fill-text-primary-dark"} />
    </button>
  );
}
