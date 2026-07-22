import { MenuItem, MenuList, Popover, Tooltip } from "@mui/material";
import React from "react";
import { useOwlbearStore } from "../useOwlbearStore";
import AddIcon from "../icons/AddIcon";
import IconButton from "./IconButton";
import { useTrackerStore } from "../useTrackerStore";

export default function AddTrackerButton({
  dense,
}: {
  dense?: boolean;
}): React.JSX.Element {
  const mode = useOwlbearStore((state) => state.themeMode);

  const addTrackerBubble = useTrackerStore((state) => state.addTrackerBubble);
  const addCounterTracker = useTrackerStore((state) => state.addCounterTracker);
  const addTrackerBar = useTrackerStore((state) => state.addTrackerBar);
  const addCheckboxTracker = useTrackerStore(
    (state) => state.addCheckboxTracker,
  );

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
    <div className="flex items-end justify-end">
      {dense === true ? (
        <IconButton Icon={AddIcon} onClick={handleClick} />
      ) : (
        <Tooltip title="Add Tracker">
          <IconButton Icon={AddIcon} onClick={handleClick} />
        </Tooltip>
      )}

      <button></button>

      <Popover
        id={id}
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "center",
        }}
        transformOrigin={{
          vertical: "top",
          horizontal: "center",
        }}
        className={mode === "DARK" ? "dark" : ""}
      >
        <MenuList dense={dense} disablePadding>
          <MenuItem
            onClick={() => {
              addCheckboxTracker();
              handleClose();
            }}
          >
            Checkbox
          </MenuItem>
          <MenuItem
            onClick={() => {
              addTrackerBubble();
              handleClose();
            }}
          >
            Number
          </MenuItem>
          <MenuItem
            onClick={() => {
              addCounterTracker();
              handleClose();
            }}
          >
            Counter
          </MenuItem>
          <MenuItem
            onClick={() => {
              addTrackerBar();
              handleClose();
            }}
          >
            Bar
          </MenuItem>
        </MenuList>
      </Popover>
    </div>
  );
}
