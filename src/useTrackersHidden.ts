import { useEffect, useState } from "react";
import OBR, { Item } from "@owlbear-rodeo/sdk";
import { HIDDEN_METADATA_ID } from "./trackerHelpersBasic";
import { getPluginId } from "./getPluginId";
import { getRawTrackersHiddenFromItem } from "./trackerHelpersItem";

export const useTrackersHidden = (): {
  value: boolean | undefined;
  toggle: () => void;
  set: (value: boolean) => void;
  clear: () => void;
} => {
  const [trackersHidden, setTrackersHidden] = useState<boolean | undefined>(
    undefined,
  );

  useEffect(() => {
    const updateTrackers = (items: Item[]) => {
      getTrackersHiddenFromSelection(items).then((val) => {
        setTrackersHidden(val);
      });
    };

    OBR.scene.items.getItems().then(updateTrackers);
    return OBR.scene.items.onChange(updateTrackers);
  }, []);

  const toggleTrackersHidden = () => {
    setTrackersHidden((prev) => {
      const newTrackersHidden = prev === undefined ? true : !prev;
      writeTrackersHiddenToSelection(newTrackersHidden);
      return newTrackersHidden;
    });
  };

  const setTrackersHiddenExplicit = (value: boolean) => {
    setTrackersHidden(value);
    writeTrackersHiddenToSelection(value);
  };

  const clearTrackersHidden = () => {
    setTrackersHidden(undefined);
    writeTrackersHiddenToSelection(undefined);
  };

  return {
    value: trackersHidden,
    toggle: toggleTrackersHidden,
    set: setTrackersHiddenExplicit,
    clear: clearTrackersHidden,
  };
};

async function getTrackersHiddenFromSelection(
  items: Item[],
): Promise<boolean | undefined> {
  const selection = await OBR.player.getSelection();
  const selectedItem = items.find((item) => item.id === selection?.[0]);

  if (selectedItem === undefined) return undefined;

  return getRawTrackersHiddenFromItem(selectedItem);
}

/** Write local trackers hidden state to selected item. Passing undefined
 * clears the classification entirely (back to "never classified"). */
async function writeTrackersHiddenToSelection(
  trackersHidden: boolean | undefined,
) {
  const selection = await OBR.player.getSelection();
  const selectedItems = await OBR.scene.items.getItems(selection);

  if (selection === undefined || selection.length !== 1) {
    throw `Error: Player has selected ${selection?.length} items selected, expected 1.`;
  }

  OBR.scene.items.updateItems(selectedItems, (items) => {
    for (const item of items) {
      item.metadata[getPluginId(HIDDEN_METADATA_ID)] = trackersHidden;
    }
  });
}
