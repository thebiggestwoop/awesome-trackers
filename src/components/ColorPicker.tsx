import React from "react";
import { getBackgroundColor } from "../colorHelpers";
import { Popover, Tooltip } from "@mui/material";
import IconButton from "./IconButton";
import Palette from "../icons/Palette";
import { useOwlbearStore } from "../useOwlbearStore";
import { cn } from "../lib/utils";

export default function ColorPicker({
  setColorNumber,
}: {
  setColorNumber: (color: number) => void;
}): React.JSX.Element {
  const mode = useOwlbearStore((state) => state.themeMode);

  const colorButtons: React.JSX.Element[] = [];
  for (let i = 0; i < 9; i++) {
    colorButtons.push(
      <button
        key={i}
        onClick={() => {
          setColorNumber(i);
        }}
        className="group flex size-[34px] items-center justify-center outline-none"
      >
        <div
          className={cn(
            "h-[24px] w-[24px] rounded-full opacity-90 duration-100 group-hover:h-[32px] group-hover:w-[32px] group-focus-visible:h-[32px] group-focus-visible:w-[32px]",
            getBackgroundColor(i),
          )}
        />
        <div
          className={cn(
            "absolute h-[24px] w-[24px] rounded-full  duration-100 group-hover:h-[32px] group-hover:w-[32px] group-focus-visible:h-[32px] group-focus-visible:w-[32px]",
            getBackgroundColor(i),
          )}
        />
      </button>,
    );
  }

  const [anchorEl, setAnchorEl] = React.useState<HTMLButtonElement | null>(
    null,
  );

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const open = Boolean(anchorEl);
  const id = open ? "simple-popover" : undefined;

  return (
    <div>
      <Tooltip title="Color Picker">
        <IconButton Icon={Palette} onClick={handleClick} />
      </Tooltip>

      <Popover
        id={id}
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "left",
        }}
      >
        <div
          className={cn(
            "grid size-[120px] grid-cols-3 place-items-center p-1",
            { dark: mode === "DARK" },
          )}
        >
          {colorButtons}
        </div>
      </Popover>
    </div>
  );
}
