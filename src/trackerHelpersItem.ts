import OBR, { Item } from "@owlbear-rodeo/sdk";
import { getPluginId } from "./getPluginId";
import {
  isTracker,
  TRACKER_METADATA_ID,
  HIDDEN_METADATA_ID,
  DEFEATED_METADATA_ID,
  Tracker,
} from "./trackerHelpersBasic";

/////////////////////////////////////////////////////////////////////
// Interacting with stored trackers in an item
/////////////////////////////////////////////////////////////////////

/** Write local trackers to selected item */
export async function writeTrackersToSelection(trackers: Tracker[]) {
  const selection = await OBR.player.getSelection();
  const selectedItems = await OBR.scene.items.getItems(selection);

  if (typeof selection === "undefined" || selection.length !== 1) {
    throw `Error: Player has selected ${selection?.length} items selected, expected 1.`;
  }

  OBR.scene.items.updateItems(selectedItems, (items) => {
    for (const item of items) {
      item.metadata[getPluginId(TRACKER_METADATA_ID)] = trackers;
    }
  });
}

/** Get trackers from selected item */
export async function getTrackersFromSelection(
  items?: Item[],
): Promise<Tracker[]> {
  if (items === undefined) items = await OBR.scene.items.getItems();

  const selection = await OBR.player.getSelection();
  const selectedItem = items.find((item) => item.id === selection?.[0]);
  if (selectedItem === undefined) throw TypeError;

  return getTrackersFromItem(selectedItem);
}

export function getTrackersFromItem(item: Item) {
  const metadata = item.metadata[getPluginId(TRACKER_METADATA_ID)];
  if (metadata === undefined) return [];
  if (!Array.isArray(metadata)) {
    throw TypeError(`Expected an array, got ${typeof metadata}`);
  }

  const trackers: Tracker[] = [];
  for (const tracker of metadata) {
    if (!isTracker(tracker)) {
      console.warn(
        "Invalid tracker detected and ignored, see contents below:",
        tracker,
      );
    } else {
      trackers.push(tracker);
    }
  }

  return trackers;
}

/** Classify a token as Ally/Enemy in a single atomic write. Sets the hidden
 * flag and, if the token has no trackers yet, seeds it with the given
 * default trackers -- both in the same updateItems call. Doing this as two
 * separate writes (one for trackers, one for hidden) raced against the
 * onChange listener that resyncs the tracker menu's own UI state: if the
 * "hidden changed" notification arrived before the "trackers changed"
 * write had actually landed, the popup would re-read a half-updated item
 * and get stuck showing "no trackers" even though the write had succeeded. */
export async function classifySelection(
  hidden: boolean,
  defaultTrackers: Tracker[],
) {
  const selection = await OBR.player.getSelection();
  const selectedItems = await OBR.scene.items.getItems(selection);

  if (typeof selection === "undefined" || selection.length !== 1) {
    throw `Error: Player has selected ${selection?.length} items selected, expected 1.`;
  }

  OBR.scene.items.updateItems(selectedItems, (items) => {
    for (const item of items) {
      const existingTrackers = getTrackersFromItem(item);
      if (existingTrackers.length === 0 && defaultTrackers.length !== 0) {
        item.metadata[getPluginId(TRACKER_METADATA_ID)] = defaultTrackers;
      }
      item.metadata[getPluginId(HIDDEN_METADATA_ID)] = hidden;
    }
  });
}

export function getTrackersHiddenFromItem(item: Item) {
  const trackersHidden = item.metadata[getPluginId(HIDDEN_METADATA_ID)];
  if (trackersHidden === undefined || typeof trackersHidden !== "boolean")
    return false;
  return trackersHidden;
}

/** Returns the raw hidden-classification value: true (Enemy), false (Ally),
 * or undefined if the token has never been classified as either. Unlike
 * getTrackersHiddenFromItem (which defaults to false for rendering
 * purposes), this preserves the unset case so the UI can tell "never
 * classified" apart from "explicitly classified visible". */
export function getRawTrackersHiddenFromItem(item: Item): boolean | undefined {
  const trackersHidden = item.metadata[getPluginId(HIDDEN_METADATA_ID)];
  if (typeof trackersHidden !== "boolean") return undefined;
  return trackersHidden;
}

/////////////////////////////////////////////////////////////////////
// Battle name -- written directly to the item's own `name` property
// (not a plugin-namespaced metadata key) so any other extension that
// reads a token's name, like an initiative tracker, picks this up with
// no special integration required.
/////////////////////////////////////////////////////////////////////

/** Write a name directly to the selected item's own name property */
export async function writeNameToSelection(name: string) {
  const selection = await OBR.player.getSelection();
  const selectedItems = await OBR.scene.items.getItems(selection);

  if (typeof selection === "undefined" || selection.length !== 1) {
    throw `Error: Player has selected ${selection?.length} items selected, expected 1.`;
  }

  OBR.scene.items.updateItems(selectedItems, (items) => {
    for (const item of items) {
      item.name = name;
    }
  });
}

/** Get the selected item's own name */
export async function getNameFromSelection(items?: Item[]): Promise<string> {
  if (items === undefined) items = await OBR.scene.items.getItems();

  const selection = await OBR.player.getSelection();
  const selectedItem = items.find((item) => item.id === selection?.[0]);
  if (selectedItem === undefined) throw TypeError;

  return selectedItem.name;
}

/////////////////////////////////////////////////////////////////////
// Defeated state -- hides a token's trackers on the map (without
// deleting their values) and shows "DEFEATED" where its bars were. The
// GM can toggle this on any token independent of its Ally/Enemy
// classification or initiative membership.
/////////////////////////////////////////////////////////////////////

export function getDefeatedFromItem(item: Item): boolean {
  const value = item.metadata[getPluginId(DEFEATED_METADATA_ID)];
  return typeof value === "boolean" ? value : false;
}

export async function getDefeatedFromSelection(
  items?: Item[],
): Promise<boolean> {
  if (items === undefined) items = await OBR.scene.items.getItems();

  const selection = await OBR.player.getSelection();
  const selectedItem = items.find((item) => item.id === selection?.[0]);
  if (selectedItem === undefined) return false;

  return getDefeatedFromItem(selectedItem);
}

export async function setDefeatedForSelection(defeated: boolean) {
  const selection = await OBR.player.getSelection();
  const selectedItems = await OBR.scene.items.getItems(selection);

  if (selection === undefined || selection.length !== 1) {
    throw `Error: Player has selected ${selection?.length} items selected, expected 1.`;
  }

  OBR.scene.items.updateItems(selectedItems, (items) => {
    for (const item of items) {
      item.metadata[getPluginId(DEFEATED_METADATA_ID)] = defeated;
    }
  });
}
